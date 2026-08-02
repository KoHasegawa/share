"""IMAP での受信と SMTP での返信。"""

from __future__ import annotations

import email
import email.policy
import html
import imaplib
import logging
import re
import smtplib
from dataclasses import dataclass, field
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.utils import formataddr, formatdate, getaddresses, make_msgid, parseaddr

from .attachments import OutgoingFile

log = logging.getLogger(__name__)

_TAG_RE = re.compile(r"<[^>]+>")
_SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1>", re.IGNORECASE | re.DOTALL)
_BLANKS_RE = re.compile(r"\n{3,}")


class MailboxError(RuntimeError):
    """IMAP / SMTP の操作が失敗したときに投げる。"""


@dataclass
class RawAttachment:
    """受信メールに付いていた添付ファイル（生バイト）。"""

    filename: str
    content_type: str
    data: bytes


@dataclass
class IncomingMessage:
    """処理対象の受信メール 1 通。"""

    uid: str
    message_id: str
    subject: str
    sender_name: str
    sender_address: str
    to_addresses: list[str]
    date: str
    body: str
    attachments: list[RawAttachment] = field(default_factory=list)
    in_reply_to: str = ""
    references: list[str] = field(default_factory=list)
    auth_results: list[str] = field(default_factory=list)
    auto_submitted: str = ""
    bot_marker: str = ""

    @property
    def thread_root(self) -> str:
        """スレッドを一意に表す ID（会話履歴のキーに使う）。"""

        if self.references:
            return self.references[0]
        if self.in_reply_to:
            return self.in_reply_to
        return self.message_id or self.uid

    @property
    def sender_domain(self) -> str:
        _, _, domain = self.sender_address.partition("@")
        return domain.lower()


def _decode_header_value(value: str | None) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value))).strip()
    except Exception:  # noqa: BLE001 - 壊れたヘッダでボットを止めない
        return value.strip()


def html_to_text(markup: str) -> str:
    """HTML パートしかないメール向けの、割り切った本文抽出。"""

    text = _SCRIPT_RE.sub(" ", markup)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</(p|div|tr|li|h[1-6])>", "\n", text, flags=re.IGNORECASE)
    text = _TAG_RE.sub("", text)
    text = html.unescape(text)
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return _BLANKS_RE.sub("\n\n", text).strip()


def strip_quoted_reply(body: str) -> str:
    """引用部分（> 行や Gmail の「〜さんは書きました」）を落とす。"""

    lines = body.splitlines()
    cutoff = len(lines)
    patterns = (
        re.compile(r"^\s*On .+ wrote:\s*$"),
        re.compile(r"^\s*\d{4}年\d{1,2}月\d{1,2}日.*(?:さんは|:)\s*$"),
        re.compile(r"^\s*-{2,}\s*Original Message\s*-{2,}\s*$", re.IGNORECASE),
        re.compile(r"^\s*_{10,}\s*$"),
        re.compile(r"^\s*--\s*$"),
    )
    for index, line in enumerate(lines):
        if any(pattern.match(line) for pattern in patterns):
            cutoff = index
            break
    kept = lines[:cutoff]
    while kept and not kept[-1].strip():
        kept.pop()
    trimmed = "\n".join(kept).strip()
    # 引用しか無いメールで本文を全部消してしまうより、元の本文を返すほうがまし。
    return trimmed or body.strip()


def parse_message(uid: str, raw: bytes) -> IncomingMessage:
    """IMAP から取得した生バイト列を IncomingMessage に変換する。"""

    parsed = email.message_from_bytes(raw, policy=email.policy.default)
    name, address = parseaddr(parsed.get("From", ""))
    references = [ref for ref in (parsed.get("References") or "").split() if ref]

    text_parts: list[str] = []
    html_parts: list[str] = []
    attachments: list[RawAttachment] = []

    for part in parsed.walk():
        if part.get_content_maintype() == "multipart":
            continue
        filename = _decode_header_value(part.get_filename())
        disposition = (part.get_content_disposition() or "").lower()
        content_type = part.get_content_type()

        if filename or disposition == "attachment":
            try:
                data = part.get_payload(decode=True) or b""
            except Exception as exc:  # noqa: BLE001
                log.warning("添付 %s のデコードに失敗しました: %s", filename, exc)
                continue
            attachments.append(
                RawAttachment(
                    filename=filename or "attachment",
                    content_type=content_type,
                    data=data,
                )
            )
            continue

        try:
            content = part.get_content()
        except Exception as exc:  # noqa: BLE001
            log.warning("本文パート（%s）の解析に失敗しました: %s", content_type, exc)
            continue
        if not isinstance(content, str):
            continue
        if content_type == "text/plain":
            text_parts.append(content)
        elif content_type == "text/html":
            html_parts.append(content)

    if text_parts:
        body = "\n".join(text_parts)
    elif html_parts:
        body = html_to_text("\n".join(html_parts))
    else:
        body = ""

    return IncomingMessage(
        uid=uid,
        message_id=(parsed.get("Message-ID") or "").strip(),
        subject=_decode_header_value(parsed.get("Subject")),
        sender_name=_decode_header_value(name),
        sender_address=address.lower().strip(),
        to_addresses=[addr.lower() for _, addr in getaddresses(parsed.get_all("To") or []) if addr],
        date=(parsed.get("Date") or "").strip(),
        body=strip_quoted_reply(body),
        attachments=attachments,
        in_reply_to=(parsed.get("In-Reply-To") or "").strip(),
        references=references,
        auth_results=[str(value) for value in (parsed.get_all("Authentication-Results") or [])],
        auto_submitted=(parsed.get("Auto-Submitted") or "").strip().lower(),
        bot_marker=(parsed.get("X-DeepSeek-Mail-Bot") or "").strip(),
    )


class Mailbox:
    """IMAP 接続のコンテキストマネージャ。"""

    def __init__(self, host: str, port: int, user: str, password: str, folder: str = "INBOX", ssl: bool = True) -> None:
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.folder = folder
        self.ssl = ssl
        self._conn: imaplib.IMAP4 | None = None

    def __enter__(self) -> "Mailbox":
        try:
            self._conn = (
                imaplib.IMAP4_SSL(self.host, self.port) if self.ssl else imaplib.IMAP4(self.host, self.port)
            )
            self._conn.login(self.user, self.password)
            status, _ = self._conn.select(self.folder)
            if status != "OK":
                raise MailboxError(f"IMAP フォルダ {self.folder} を選択できませんでした。")
        except (imaplib.IMAP4.error, OSError) as exc:
            # ここで例外を投げると with 本体に入らず __exit__ も呼ばれないので、
            # 開きかけの接続は自分で片付ける。
            self._close_quietly()
            raise MailboxError(f"IMAP への接続に失敗しました: {exc}") from exc
        except MailboxError:
            self._close_quietly()
            raise
        return self

    def _close_quietly(self) -> None:
        if self._conn is None:
            return
        try:
            self._conn.logout()
        except Exception:  # noqa: BLE001 - 後始末なので失敗しても無視する
            pass
        self._conn = None

    def __exit__(self, *exc_info: object) -> None:
        if self._conn is None:
            return
        try:
            self._conn.close()
        except Exception:  # noqa: BLE001
            pass
        try:
            self._conn.logout()
        except Exception:  # noqa: BLE001
            pass
        self._conn = None

    @property
    def conn(self) -> imaplib.IMAP4:
        if self._conn is None:
            raise MailboxError("IMAP に接続していません。with 文の中で使ってください。")
        return self._conn

    def fetch_unseen(self, limit: int = 10) -> list[IncomingMessage]:
        """未読メールを取得する（\\Seen は立てない）。"""

        status, data = self.conn.uid("SEARCH", None, "UNSEEN")
        if status != "OK":
            raise MailboxError("未読メールの検索に失敗しました。")
        uids = (data[0] or b"").split()
        if not uids:
            return []

        messages: list[IncomingMessage] = []
        for uid_bytes in uids[:limit]:
            uid = uid_bytes.decode()
            status, payload = self.conn.uid("FETCH", uid, "(BODY.PEEK[])")
            if status != "OK" or not payload or not isinstance(payload[0], tuple):
                log.warning("UID %s の取得に失敗しました。", uid)
                continue
            try:
                messages.append(parse_message(uid, payload[0][1]))
            except Exception as exc:  # noqa: BLE001 - 1 通の破損で全体を止めない
                log.exception("UID %s の解析に失敗しました: %s", uid, exc)
        return messages

    def mark_seen(self, uid: str) -> None:
        self.conn.uid("STORE", uid, "+FLAGS", "(\\Seen)")

    def mark_flagged(self, uid: str) -> None:
        self.conn.uid("STORE", uid, "+FLAGS", "(\\Flagged)")


def build_reply(
    original: IncomingMessage,
    body: str,
    from_address: str,
    from_name: str,
    files: list[OutgoingFile] | None = None,
    subject: str | None = None,
) -> EmailMessage:
    """元メールにスレッドとしてぶら下がる返信を組み立てる。

    subject を渡すと元の件名の代わりに使う。[r1] などの指示タグを落とした件名を
    渡すことで、その返信にさらに返信したときにタグが再適用されるのを防ぐ。
    """

    reply = EmailMessage()
    reply["From"] = formataddr((from_name, from_address))
    reply["To"] = formataddr((original.sender_name, original.sender_address))
    subject = (subject if subject is not None else original.subject) or "(件名なし)"
    reply["Subject"] = subject if subject.lower().startswith("re:") else f"Re: {subject}"
    reply["Date"] = formatdate(localtime=True)
    reply["Message-ID"] = make_msgid(domain=from_address.partition("@")[2] or None)

    if original.message_id:
        reply["In-Reply-To"] = original.message_id
        references = original.references + [original.message_id]
        reply["References"] = " ".join(references[-20:])

    # 自分の返信に反応して無限ループしないよう、機械送信であることを明示する。
    reply["Auto-Submitted"] = "auto-replied"
    reply["X-DeepSeek-Mail-Bot"] = "reply"

    reply.set_content(body, subtype="plain", charset="utf-8")

    for item in files or []:
        maintype, _, subtype = item.content_type.partition("/")
        reply.add_attachment(
            item.content,
            maintype=maintype or "application",
            subtype=subtype or "octet-stream",
            filename=item.filename,
        )
    return reply


def send_message(
    message: EmailMessage,
    host: str,
    port: int,
    user: str,
    password: str,
    starttls: bool = True,
) -> None:
    try:
        if port == 465:
            server: smtplib.SMTP = smtplib.SMTP_SSL(host, port, timeout=60)
        else:
            server = smtplib.SMTP(host, port, timeout=60)
        with server:
            server.ehlo()
            if starttls and port != 465:
                server.starttls()
                server.ehlo()
            server.login(user, password)
            server.send_message(message)
    except (smtplib.SMTPException, OSError) as exc:
        raise MailboxError(f"メールの送信に失敗しました: {exc}") from exc
