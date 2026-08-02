"""IMAP と DeepSeek をスタブに差し替えて、受信から返信までを通しで確認する。"""

import tempfile
import unittest
from email.message import EmailMessage
from pathlib import Path
from unittest import mock

from deepseek_mail_bot.bot import MailBot
from deepseek_mail_bot.config import Config
from deepseek_mail_bot.deepseek import Completion, DeepSeekError
from deepseek_mail_bot.mailbox import parse_message


def make_config(state_dir: Path, **overrides) -> Config:
    defaults = dict(
        imap_host="imap.example.com",
        imap_port=993,
        imap_user="bot@example.com",
        imap_password="secret",
        imap_folder="INBOX",
        imap_ssl=True,
        smtp_host="smtp.example.com",
        smtp_port=587,
        smtp_user="bot@example.com",
        smtp_password="secret",
        smtp_starttls=True,
        bot_address="bot@example.com",
        bot_name="DeepSeek Bot",
        allowed_senders=["haseko.86@gmail.com"],
        require_auth_results=True,
        api_key="sk-test",
        base_url="https://api.deepseek.com",
        model="deepseek-chat",
        reasoner_model="deepseek-reasoner",
        temperature=0.3,
        max_tokens=4096,
        request_timeout=60,
        max_retries=0,
        system_prompt="system",
        max_input_chars=100_000,
        max_attachment_bytes=1_000_000,
        max_outgoing_attachment_bytes=1_000_000,
        max_history_turns=5,
        max_messages_per_run=10,
        state_dir=state_dir,
        dry_run=False,
        mark_seen=True,
        error_notice=True,
    )
    defaults.update(overrides)
    return Config(**defaults)


def raw_mail(
    sender="Ko Hasegawa <haseko.86@gmail.com>",
    subject="集計をお願い",
    body="添付の CSV を集計して、結果を CSV で返して。",
    auth="mx.google.com; dkim=pass header.d=gmail.com; spf=pass smtp.mailfrom=gmail.com",
    attachment=None,
    message_id="<q1@mail.gmail.com>",
):
    message = EmailMessage()
    message["From"] = sender
    message["To"] = "bot@example.com"
    message["Subject"] = subject
    message["Message-ID"] = message_id
    message["Date"] = "Sun, 02 Aug 2026 10:00:00 +0900"
    if auth:
        message["Authentication-Results"] = auth
    message.set_content(body)
    if attachment:
        filename, data = attachment
        message.add_attachment(data, maintype="text", subtype="csv", filename=filename)
    return message.as_bytes()


class FakeMailbox:
    """Mailbox のスタブ。fetch_unseen で決め打ちのメールを返す。"""

    def __init__(self, raws):
        self.raws = raws
        self.seen: list[str] = []
        self.flagged: list[str] = []

    def __call__(self, **kwargs):
        return self

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False

    def fetch_unseen(self, limit=10):
        return [parse_message(str(index), raw) for index, raw in enumerate(self.raws[:limit])]

    def mark_seen(self, uid):
        self.seen.append(uid)

    def mark_flagged(self, uid):
        self.flagged.append(uid)


class FakeClient:
    def __init__(self, content="回答本文", error=None):
        self.content = content
        self.error = error
        self.calls: list[dict] = []

    def chat(self, messages, model="deepseek-chat", temperature=0.3, max_tokens=4096):
        self.calls.append({"messages": messages, "model": model})
        if self.error:
            raise self.error
        return Completion(
            content=self.content,
            reasoning=None,
            model=model,
            prompt_tokens=100,
            completion_tokens=50,
            finish_reason="stop",
        )


class EndToEndTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.state_dir = Path(self._tmp.name)
        self.addCleanup(self._tmp.cleanup)
        self.sent: list[EmailMessage] = []

    def run_bot(self, raws, client, config=None):
        mailbox = FakeMailbox(raws)
        config = config or make_config(self.state_dir)
        bot = MailBot(config, client=client)
        with mock.patch("deepseek_mail_bot.bot.Mailbox", mailbox), mock.patch(
            "deepseek_mail_bot.bot.send_message",
            side_effect=lambda msg, **kwargs: self.sent.append(msg),
        ):
            replied = bot.run_once()
        return replied, mailbox

    def test_replies_with_generated_attachment(self):
        client = FakeClient(
            content="集計しました。\n\n```file:summary.csv\nitem,total\napple,3\n```\n"
        )
        raws = [raw_mail(attachment=("data.csv", b"item,qty\napple,1\napple,2\n"))]
        replied, mailbox = self.run_bot(raws, client)

        self.assertEqual(replied, 1)
        self.assertEqual(len(self.sent), 1)
        reply = self.sent[0]
        self.assertEqual(reply["To"], "Ko Hasegawa <haseko.86@gmail.com>")
        self.assertEqual(reply["Subject"], "Re: 集計をお願い")
        self.assertEqual(reply["In-Reply-To"], "<q1@mail.gmail.com>")

        body = reply.get_body(preferencelist=("plain",)).get_content()
        self.assertIn("集計しました", body)
        self.assertIn("［添付: summary.csv］", body)
        self.assertNotIn("apple,3", body)

        attachments = list(reply.iter_attachments())
        self.assertEqual([a.get_filename() for a in attachments], ["summary.csv"])
        self.assertIn("apple,3", attachments[0].get_content())

        self.assertEqual(mailbox.seen, ["0"])

        # 受信した添付の中身がプロンプトに載っていること
        prompt = client.calls[0]["messages"][-1]["content"]
        self.assertIn("data.csv", prompt)
        self.assertIn("apple,1", prompt)

    def test_rejects_unknown_sender_without_calling_api(self):
        client = FakeClient()
        raws = [raw_mail(sender="Spammer <spam@evil.com>")]
        replied, mailbox = self.run_bot(raws, client)

        self.assertEqual(replied, 0)
        self.assertEqual(self.sent, [])
        self.assertEqual(client.calls, [])
        self.assertEqual(mailbox.seen, ["0"])

    def test_rejects_spoofed_sender_that_fails_dkim(self):
        client = FakeClient()
        raws = [raw_mail(auth="mx.google.com; dkim=fail header.d=gmail.com; spf=softfail")]
        replied, _ = self.run_bot(raws, client)

        self.assertEqual(replied, 0)
        self.assertEqual(client.calls, [])

    def test_auth_check_can_be_disabled(self):
        client = FakeClient()
        config = make_config(self.state_dir, require_auth_results=False)
        replied, _ = self.run_bot([raw_mail(auth=None)], client, config=config)

        self.assertEqual(replied, 1)

    def test_does_not_reply_to_its_own_mail(self):
        client = FakeClient()
        raws = [raw_mail(sender="DeepSeek Bot <bot@example.com>")]
        replied, _ = self.run_bot(raws, client)

        self.assertEqual(replied, 0)
        self.assertEqual(client.calls, [])

    def test_reasoner_tag_selects_model(self):
        client = FakeClient()
        replied, _ = self.run_bot([raw_mail(subject="[r1] 難問")], client)

        self.assertEqual(replied, 1)
        self.assertEqual(client.calls[0]["model"], "deepseek-reasoner")
        self.assertEqual(self.sent[0]["Subject"], "Re: 難問")

    def test_thread_history_is_carried_over(self):
        first = FakeClient(content="一回目の回答")
        self.run_bot([raw_mail(message_id="<t1@x>")], first)

        second = FakeClient(content="二回目の回答")
        follow_up = raw_mail(message_id="<t2@x>", body="さっきの続きを教えて")
        follow_up = follow_up.replace(
            b"Message-ID: <t2@x>",
            b"Message-ID: <t2@x>\nIn-Reply-To: <t1@x>\nReferences: <t1@x>",
        )
        self.run_bot([follow_up], second)

        roles = [m["role"] for m in second.calls[0]["messages"]]
        self.assertEqual(roles, ["system", "user", "assistant", "user"])
        self.assertEqual(second.calls[0]["messages"][2]["content"], "一回目の回答")

    def test_new_tag_resets_history(self):
        first = FakeClient(content="一回目の回答")
        self.run_bot([raw_mail(message_id="<s1@x>")], first)

        second = FakeClient()
        follow_up = raw_mail(message_id="<s2@x>", subject="[new] 別の話")
        follow_up = follow_up.replace(b"Message-ID: <s2@x>", b"Message-ID: <s2@x>\nReferences: <s1@x>")
        self.run_bot([follow_up], second)

        roles = [m["role"] for m in second.calls[0]["messages"]]
        self.assertEqual(roles, ["system", "user"])

    def test_api_failure_sends_error_notice_and_flags(self):
        client = FakeClient(error=DeepSeekError("HTTP 402: 残高不足"))
        replied, mailbox = self.run_bot([raw_mail()], client)

        self.assertEqual(replied, 0)
        self.assertEqual(len(self.sent), 1)
        body = self.sent[0].get_body(preferencelist=("plain",)).get_content()
        self.assertIn("残高不足", body)
        self.assertEqual(mailbox.flagged, ["0"])

    def test_dry_run_sends_nothing(self):
        client = FakeClient()
        config = make_config(self.state_dir, dry_run=True)
        replied, mailbox = self.run_bot([raw_mail()], client, config=config)

        self.assertEqual(replied, 0)
        self.assertEqual(self.sent, [])
        self.assertEqual(mailbox.seen, [])
        self.assertEqual(len(client.calls), 1)

    def test_oversized_generated_attachment_is_dropped(self):
        client = FakeClient(content="大きいファイルです。\n\n```file:big.txt\n" + "x" * 5000 + "\n```")
        config = make_config(self.state_dir, max_outgoing_attachment_bytes=1000)
        replied, _ = self.run_bot([raw_mail()], client, config=config)

        self.assertEqual(replied, 1)
        self.assertEqual(list(self.sent[0].iter_attachments()), [])

    def test_processes_multiple_messages(self):
        client = FakeClient()
        raws = [raw_mail(message_id="<a@x>"), raw_mail(message_id="<b@x>", subject="二通目")]
        replied, mailbox = self.run_bot(raws, client)

        self.assertEqual(replied, 2)
        self.assertEqual(len(self.sent), 2)
        self.assertEqual(mailbox.seen, ["0", "1"])


if __name__ == "__main__":
    unittest.main()
