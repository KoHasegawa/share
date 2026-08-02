import unittest
from email.message import EmailMessage

from deepseek_mail_bot.mailbox import (
    IncomingMessage,
    build_reply,
    html_to_text,
    parse_message,
    strip_quoted_reply,
)
from deepseek_mail_bot.attachments import OutgoingFile


def make_raw(*, with_attachment=False, html_only=False, subject="テスト"):
    message = EmailMessage()
    message["From"] = "Ko Hasegawa <haseko.86@gmail.com>"
    message["To"] = "bot@example.com"
    message["Subject"] = subject
    message["Message-ID"] = "<abc123@mail.gmail.com>"
    message["Date"] = "Sun, 02 Aug 2026 10:00:00 +0900"
    message["Authentication-Results"] = "mx.example.com; dkim=pass header.d=gmail.com; spf=pass"

    if html_only:
        message.set_content("<html><body><p>こんにちは</p><p>世界</p></body></html>", subtype="html")
    else:
        message.set_content("この CSV を要約して。")

    if with_attachment:
        message.add_attachment(
            "a,b\n1,2\n".encode("utf-8"),
            maintype="text",
            subtype="csv",
            filename="data.csv",
        )
    return message.as_bytes()


class ParseMessageTest(unittest.TestCase):
    def test_parses_headers_and_body(self):
        parsed = parse_message("42", make_raw())
        self.assertEqual(parsed.uid, "42")
        self.assertEqual(parsed.sender_address, "haseko.86@gmail.com")
        self.assertEqual(parsed.sender_name, "Ko Hasegawa")
        self.assertEqual(parsed.sender_domain, "gmail.com")
        self.assertEqual(parsed.subject, "テスト")
        self.assertIn("要約して", parsed.body)
        self.assertEqual(parsed.message_id, "<abc123@mail.gmail.com>")

    def test_parses_attachment(self):
        parsed = parse_message("1", make_raw(with_attachment=True))
        self.assertEqual(len(parsed.attachments), 1)
        self.assertEqual(parsed.attachments[0].filename, "data.csv")
        self.assertEqual(parsed.attachments[0].data, b"a,b\n1,2\n")
        self.assertIn("要約して", parsed.body)

    def test_falls_back_to_html_part(self):
        parsed = parse_message("2", make_raw(html_only=True))
        self.assertIn("こんにちは", parsed.body)
        self.assertNotIn("<p>", parsed.body)

    def test_encoded_subject(self):
        raw = make_raw(subject="日本語の件名")
        self.assertEqual(parse_message("3", raw).subject, "日本語の件名")

    def test_thread_root_prefers_references(self):
        message = IncomingMessage(
            uid="1",
            message_id="<c@x>",
            subject="",
            sender_name="",
            sender_address="a@b.com",
            to_addresses=[],
            date="",
            body="",
            in_reply_to="<b@x>",
            references=["<a@x>", "<b@x>"],
        )
        self.assertEqual(message.thread_root, "<a@x>")
        message.references = []
        self.assertEqual(message.thread_root, "<b@x>")
        message.in_reply_to = ""
        self.assertEqual(message.thread_root, "<c@x>")


class TextHelpersTest(unittest.TestCase):
    def test_html_to_text(self):
        text = html_to_text("<div>あ<br>い</div><script>var x=1;</script>")
        self.assertIn("あ", text)
        self.assertIn("い", text)
        self.assertNotIn("var x", text)

    def test_strip_quoted_reply(self):
        body = "新しい質問です。\n\nOn Mon, Jan 1, 2026 at 10:00 AM Bot wrote:\n> 前回の回答\n> 続き"
        self.assertEqual(strip_quoted_reply(body), "新しい質問です。")

    def test_strip_quoted_reply_keeps_body_when_all_quoted(self):
        body = "On Mon, Jan 1, 2026 at 10:00 AM Bot wrote:\n> 全部引用"
        self.assertIn("全部引用", strip_quoted_reply(body))


class BuildReplyTest(unittest.TestCase):
    def setUp(self):
        self.original = parse_message("7", make_raw())

    def test_threading_headers(self):
        reply = build_reply(self.original, "回答です", "bot@example.com", "Bot")
        self.assertEqual(reply["To"], "Ko Hasegawa <haseko.86@gmail.com>")
        self.assertEqual(reply["Subject"], "Re: テスト")
        self.assertEqual(reply["In-Reply-To"], "<abc123@mail.gmail.com>")
        self.assertIn("<abc123@mail.gmail.com>", reply["References"])
        self.assertEqual(reply["Auto-Submitted"], "auto-replied")
        self.assertEqual(reply["X-DeepSeek-Mail-Bot"], "reply")

    def test_does_not_double_prefix_subject(self):
        self.original.subject = "Re: テスト"
        reply = build_reply(self.original, "本文", "bot@example.com", "Bot")
        self.assertEqual(reply["Subject"], "Re: テスト")

    def test_attaches_files(self):
        files = [OutgoingFile("report.md", b"# title\n"), OutgoingFile("out.csv", b"a,b\n")]
        reply = build_reply(self.original, "本文", "bot@example.com", "Bot", files=files)
        names = [part.get_filename() for part in reply.iter_attachments()]
        self.assertEqual(names, ["report.md", "out.csv"])
        body = reply.get_body(preferencelist=("plain",))
        self.assertIn("本文", body.get_content())


if __name__ == "__main__":
    unittest.main()
