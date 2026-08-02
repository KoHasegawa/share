"""受信メールを DeepSeek に投げて返信するメイン処理。"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass

from .attachments import ExtractedAttachment, OutgoingFile, extract_attachment, split_file_blocks
from .config import Config
from .deepseek import Completion, DeepSeekClient, DeepSeekError
from .history import ThreadHistory
from .mailbox import IncomingMessage, Mailbox, MailboxError, build_reply, send_message

log = logging.getLogger(__name__)

_SUBJECT_TAG_RE = re.compile(r"^\s*\[(?P<tag>[a-zA-Z0-9_\-]+)\]\s*")

REASONER_TAGS = {"r1", "reasoner", "reason", "think", "deep"}
CHAT_TAGS = {"v3", "chat", "fast"}
RESET_TAGS = {"new", "reset", "clear"}


@dataclass
class SubjectDirectives:
    """件名の先頭に付いた [タグ] から読み取った指示。"""

    subject: str
    use_reasoner: bool = False
    reset_history: bool = False


def parse_subject_directives(subject: str) -> SubjectDirectives:
    """件名の先頭タグを解釈し、タグを取り除いた件名と一緒に返す。"""

    result = SubjectDirectives(subject=subject or "")
    remaining = result.subject
    while True:
        match = _SUBJECT_TAG_RE.match(remaining)
        if not match:
            break
        tag = match.group("tag").lower()
        if tag in REASONER_TAGS:
            result.use_reasoner = True
        elif tag in CHAT_TAGS:
            result.use_reasoner = False
        elif tag in RESET_TAGS:
            result.reset_history = True
        else:
            break  # 知らないタグは件名の一部として残す
        remaining = remaining[match.end():]
    result.subject = remaining.strip()
    return result


def sender_is_allowed(address: str, allowed: list[str]) -> bool:
    """送信元が許可リストに含まれるか判定する（@domain 形式のワイルドカードも可）。"""

    address = (address or "").lower().strip()
    if not address:
        return False
    for entry in allowed:
        if entry.startswith("@"):
            if address.endswith(entry):
                return True
        elif address == entry:
            return True
    return False


_DKIM_PASS_RE = re.compile(r"dkim=pass[^;]*?header\.(?:d|i)=@?([a-z0-9.\-]+)", re.IGNORECASE)
_SPF_PASS_RE = re.compile(
    r"spf=pass[^;]*?smtp\.(?:mailfrom|helo)=(?:[^;\s]*@)?([a-z0-9.\-]+)", re.IGNORECASE
)


def domain_matches(candidate: str, domain: str) -> bool:
    """認証結果のドメインが送信元ドメインと一致するか（サブドメインは許容）。

    部分一致で判定すると evilgmail.com が gmail.com として通ってしまうため、
    完全一致かドット区切りのサブドメインかだけを認める。
    """

    candidate = candidate.lower().strip().rstrip(".")
    domain = domain.lower().strip().rstrip(".")
    if not candidate or not domain:
        return False
    return candidate == domain or candidate.endswith(f".{domain}")


def authentication_passed(message: IncomingMessage) -> tuple[bool, str]:
    """Authentication-Results から DKIM / SPF の合格を確認する。

    From ヘッダは簡単に詐称できるので、許可リストだけでは守りとして弱い。
    受信サーバが付けた検証結果を見て、送信元ドメインが本物か確かめる。
    """

    if not message.auth_results:
        return False, "Authentication-Results ヘッダがありません"

    domain = message.sender_domain
    if not domain:
        return False, "送信元アドレスにドメインがありません"

    joined = " ".join(message.auth_results)
    for label, pattern in (("dkim=pass", _DKIM_PASS_RE), ("spf=pass", _SPF_PASS_RE)):
        for match in pattern.finditer(joined):
            if domain_matches(match.group(1), domain):
                return True, label

    lowered = joined.lower()
    if "dkim=pass" in lowered or "spf=pass" in lowered:
        return False, f"DKIM/SPF は pass ですが送信元ドメイン {domain} と一致しません"
    return False, "DKIM / SPF がいずれも pass していません"


def looks_like_loop(message: IncomingMessage, bot_address: str) -> str | None:
    """自動応答の往復ループになりそうなメールを弾く。理由を返す（問題なければ None）。"""

    if message.sender_address == bot_address.lower():
        return "ボット自身からのメールです"
    if message.bot_marker:
        return "このボットが送ったメールです"
    if message.auto_submitted and message.auto_submitted != "no":
        return f"Auto-Submitted: {message.auto_submitted} が付いています"
    return None


def collect_attachments(message: IncomingMessage, max_bytes: int) -> list[ExtractedAttachment]:
    """受信添付をテキストに変換する。大きすぎるものはスキップする。"""

    results: list[ExtractedAttachment] = []
    for item in message.attachments:
        if len(item.data) > max_bytes:
            results.append(
                ExtractedAttachment(
                    filename=item.filename,
                    content_type=item.content_type,
                    size=len(item.data),
                    text=None,
                    note=f"（{max_bytes:,} バイトの上限を超えるためスキップしました）",
                )
            )
            continue
        results.append(extract_attachment(item.filename, item.content_type, item.data))
    return results


def build_prompt(
    message: IncomingMessage,
    subject: str,
    attachments: list[ExtractedAttachment],
    max_chars: int,
) -> str:
    """メール 1 通を DeepSeek に渡す user メッセージへ整形する。"""

    header = "\n".join(
        [
            f"件名: {subject or '(件名なし)'}",
            f"差出人: {message.sender_name or message.sender_address} <{message.sender_address}>",
            f"日時: {message.date}",
        ]
    )
    body = message.body.strip() or "（本文は空です）"
    sections = [header, "", "--- 本文 ---", body]

    if attachments:
        sections.extend(["", f"--- 添付ファイル（{len(attachments)} 件） ---"])
        budget = max(0, max_chars - len("\n".join(sections)))
        per_file = max(2_000, budget // len(attachments)) if budget else 2_000
        for attachment in attachments:
            sections.append("")
            sections.append(attachment.as_prompt_block(char_limit=per_file))

    prompt = "\n".join(sections)
    if len(prompt) > max_chars:
        prompt = prompt[:max_chars] + "\n\n…（入力が長いため以降を省略しました）"
    return prompt


def format_reply_body(body: str, completion: Completion, attached: list[OutgoingFile], elapsed: float) -> str:
    """本文にフッター（モデル名・トークン数）を付ける。"""

    lines = [body.strip() or "（応答が空でした）"]
    if completion.truncated:
        lines.append("")
        lines.append("※ 出力が最大トークン数に達したため、途中で切れている可能性があります。")

    footer = [
        "",
        "-- ",
        f"DeepSeek ({completion.model}) / "
        f"入力 {completion.prompt_tokens:,} tok・出力 {completion.completion_tokens:,} tok・{elapsed:.1f} 秒",
    ]
    if attached:
        names = "、".join(item.filename for item in attached)
        footer.append(f"添付: {names}")
    return "\n".join(lines + footer)


class MailBot:
    def __init__(self, config: Config, client: DeepSeekClient | None = None) -> None:
        self.config = config
        self.client = client or DeepSeekClient(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.request_timeout,
            max_retries=config.max_retries,
        )
        self.history = ThreadHistory(config.state_dir, max_turns=config.max_history_turns)

    def run_once(self) -> int:
        """未読メールを 1 巡処理して、返信した件数を返す。"""

        config = self.config
        with Mailbox(
            host=config.imap_host,
            port=config.imap_port,
            user=config.imap_user,
            password=config.imap_password,
            folder=config.imap_folder,
            ssl=config.imap_ssl,
        ) as mailbox:
            messages = mailbox.fetch_unseen(limit=config.max_messages_per_run)
            if not messages:
                log.info("未読メールはありません。")
                return 0

            log.info("未読メール %d 件を処理します。", len(messages))
            replied = 0
            for message in messages:
                try:
                    if self._process(message, mailbox):
                        replied += 1
                except Exception as exc:  # noqa: BLE001 - 1 通の失敗で残りを止めない
                    log.exception("UID %s の処理中にエラーが発生しました: %s", message.uid, exc)
            return replied

    def run_forever(self, interval: int) -> None:
        """常駐モード。interval 秒ごとに受信箱を確認する。"""

        log.info("常駐モードを開始します（%d 秒間隔）。", interval)
        while True:
            try:
                self.run_once()
            except MailboxError as exc:
                log.error("メールボットの実行に失敗しました: %s", exc)
            except Exception as exc:  # noqa: BLE001
                log.exception("想定外のエラーが発生しました: %s", exc)
            time.sleep(interval)

    def _process(self, message: IncomingMessage, mailbox: Mailbox) -> bool:
        config = self.config

        loop_reason = looks_like_loop(message, config.bot_address)
        if loop_reason:
            log.info("UID %s をスキップします（%s）。", message.uid, loop_reason)
            self._mark_seen(mailbox, message)
            return False

        if not sender_is_allowed(message.sender_address, config.allowed_senders):
            log.warning(
                "UID %s を無視します（許可されていない送信元: %s）。", message.uid, message.sender_address
            )
            self._mark_seen(mailbox, message)
            return False

        if config.require_auth_results:
            passed, reason = authentication_passed(message)
            if not passed:
                log.warning(
                    "UID %s を無視します（送信元 %s の認証に失敗: %s）。",
                    message.uid,
                    message.sender_address,
                    reason,
                )
                self._mark_seen(mailbox, message)
                return False

        directives = parse_subject_directives(message.subject)
        model = config.reasoner_model if directives.use_reasoner else config.model
        thread_root = message.thread_root
        if directives.reset_history:
            self.history.clear(thread_root)

        attachments = collect_attachments(message, config.max_attachment_bytes)
        prompt = build_prompt(message, directives.subject, attachments, config.max_input_chars)

        conversation: list[dict[str, str]] = [{"role": "system", "content": config.system_prompt}]
        conversation.extend(self.history.load(thread_root))
        conversation.append({"role": "user", "content": prompt})

        log.info(
            "UID %s に応答します（差出人=%s, 件名=%r, 添付=%d 件, モデル=%s）。",
            message.uid,
            message.sender_address,
            directives.subject,
            len(attachments),
            model,
        )

        started = time.monotonic()
        try:
            completion = self.client.chat(
                conversation,
                model=model,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
            )
        except DeepSeekError as exc:
            log.error("DeepSeek の呼び出しに失敗しました: %s", exc)
            self._send_error_notice(message, str(exc))
            self._mark_seen(mailbox, message, flag=True)
            return False
        elapsed = time.monotonic() - started

        body, files = split_file_blocks(completion.content)
        files = self._filter_outgoing(files)
        reply_body = format_reply_body(body, completion, files, elapsed)

        if config.dry_run:
            log.info("DRY_RUN のため送信しません。返信本文:\n%s", reply_body)
            return False

        reply = build_reply(
            original=message,
            body=reply_body,
            from_address=config.bot_address,
            from_name=config.bot_name,
            files=files,
            subject=directives.subject,
        )
        send_message(
            reply,
            host=config.smtp_host,
            port=config.smtp_port,
            user=config.smtp_user,
            password=config.smtp_password,
            starttls=config.smtp_starttls,
        )
        log.info("UID %s に返信しました（添付 %d 件）。", message.uid, len(files))

        self.history.append(thread_root, prompt, completion.content, subject=directives.subject)
        self._mark_seen(mailbox, message)
        return True

    def _filter_outgoing(self, files: list[OutgoingFile]) -> list[OutgoingFile]:
        limit = self.config.max_outgoing_attachment_bytes
        kept: list[OutgoingFile] = []
        total = 0
        for item in files:
            if len(item.content) > limit or total + len(item.content) > limit:
                log.warning("添付 %s は上限を超えるため送信しません。", item.filename)
                continue
            total += len(item.content)
            kept.append(item)
        return kept

    def _mark_seen(self, mailbox: Mailbox, message: IncomingMessage, flag: bool = False) -> None:
        if not self.config.mark_seen or self.config.dry_run:
            return
        try:
            mailbox.mark_seen(message.uid)
            if flag:
                mailbox.mark_flagged(message.uid)
        except Exception as exc:  # noqa: BLE001
            log.warning("UID %s のフラグ更新に失敗しました: %s", message.uid, exc)

    def _send_error_notice(self, message: IncomingMessage, detail: str) -> None:
        if not self.config.error_notice or self.config.dry_run:
            return
        body = (
            "DeepSeek への問い合わせが失敗したため、回答を生成できませんでした。\n\n"
            f"エラー内容:\n{detail[:2000]}\n\n"
            "しばらく待ってから再送してください。"
        )
        try:
            reply = build_reply(
                original=message,
                body=body,
                from_address=self.config.bot_address,
                from_name=self.config.bot_name,
            )
            send_message(
                reply,
                host=self.config.smtp_host,
                port=self.config.smtp_port,
                user=self.config.smtp_user,
                password=self.config.smtp_password,
                starttls=self.config.smtp_starttls,
            )
        except MailboxError as exc:
            log.error("エラー通知メールの送信にも失敗しました: %s", exc)
