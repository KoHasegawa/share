import unittest

from deepseek_mail_bot.attachments import ExtractedAttachment, OutgoingFile
from deepseek_mail_bot.bot import (
    authentication_passed,
    build_prompt,
    format_reply_body,
    looks_like_loop,
    parse_subject_directives,
    sender_is_allowed,
)
from deepseek_mail_bot.deepseek import Completion
from deepseek_mail_bot.mailbox import IncomingMessage


def make_message(**overrides) -> IncomingMessage:
    defaults = dict(
        uid="1",
        message_id="<m1@example.com>",
        subject="質問",
        sender_name="Ko",
        sender_address="haseko.86@gmail.com",
        to_addresses=["bot@example.com"],
        date="Sun, 02 Aug 2026 10:00:00 +0900",
        body="こんにちは",
    )
    defaults.update(overrides)
    return IncomingMessage(**defaults)


class SubjectDirectivesTest(unittest.TestCase):
    def test_plain_subject(self):
        result = parse_subject_directives("売上の分析をお願い")
        self.assertEqual(result.subject, "売上の分析をお願い")
        self.assertFalse(result.use_reasoner)
        self.assertFalse(result.reset_history)

    def test_reasoner_tag(self):
        result = parse_subject_directives("[r1] 難しい問題")
        self.assertTrue(result.use_reasoner)
        self.assertEqual(result.subject, "難しい問題")

    def test_multiple_tags(self):
        result = parse_subject_directives("[new][reasoner] やり直し")
        self.assertTrue(result.use_reasoner)
        self.assertTrue(result.reset_history)
        self.assertEqual(result.subject, "やり直し")

    def test_unknown_tag_is_left_alone(self):
        result = parse_subject_directives("[緊急] 対応して")
        self.assertEqual(result.subject, "[緊急] 対応して")
        self.assertFalse(result.use_reasoner)

    def test_empty_subject(self):
        self.assertEqual(parse_subject_directives("").subject, "")


class SenderAllowlistTest(unittest.TestCase):
    def test_exact_match_is_case_insensitive(self):
        self.assertTrue(sender_is_allowed("Haseko.86@Gmail.com", ["haseko.86@gmail.com"]))

    def test_domain_wildcard(self):
        self.assertTrue(sender_is_allowed("anyone@example.co.jp", ["@example.co.jp"]))
        self.assertFalse(sender_is_allowed("anyone@evil.com", ["@example.co.jp"]))

    def test_rejects_unknown_and_empty(self):
        self.assertFalse(sender_is_allowed("spam@evil.com", ["haseko.86@gmail.com"]))
        self.assertFalse(sender_is_allowed("", ["haseko.86@gmail.com"]))
        self.assertFalse(sender_is_allowed("haseko.86@gmail.com", []))


class AuthenticationTest(unittest.TestCase):
    def test_dkim_pass_for_sender_domain(self):
        message = make_message(
            auth_results=["mx.google.com; dkim=pass header.d=gmail.com; spf=pass smtp.mailfrom=gmail.com"]
        )
        passed, _ = authentication_passed(message)
        self.assertTrue(passed)

    def test_spf_pass_only(self):
        message = make_message(
            auth_results=["mx.google.com; dkim=none; spf=pass smtp.mailfrom=haseko.86@gmail.com"]
        )
        passed, _ = authentication_passed(message)
        self.assertTrue(passed)

    def test_pass_for_a_different_domain_is_rejected(self):
        message = make_message(
            auth_results=["mx.google.com; dkim=pass header.d=evil.com; spf=pass smtp.mailfrom=evil.com"]
        )
        passed, reason = authentication_passed(message)
        self.assertFalse(passed)
        self.assertIn("一致しません", reason)

    def test_missing_header_is_rejected(self):
        passed, reason = authentication_passed(make_message(auth_results=[]))
        self.assertFalse(passed)
        self.assertIn("ヘッダがありません", reason)

    def test_fail_result_is_rejected(self):
        message = make_message(auth_results=["mx.google.com; dkim=fail header.d=gmail.com; spf=softfail"])
        self.assertFalse(authentication_passed(message)[0])

    def test_lookalike_domain_is_rejected(self):
        # 部分一致で通してしまうと evilgmail.com が gmail.com になりすませる。
        message = make_message(
            auth_results=["mx.google.com; dkim=pass header.d=evilgmail.com; spf=pass smtp.mailfrom=evilgmail.com"]
        )
        self.assertFalse(authentication_passed(message)[0])

    def test_subdomain_is_accepted(self):
        message = make_message(auth_results=["mx.google.com; dkim=pass header.d=mail.gmail.com"])
        self.assertTrue(authentication_passed(message)[0])

    def test_second_header_can_provide_the_pass(self):
        message = make_message(
            auth_results=[
                "relay.example.com; dkim=none; spf=none",
                "mx.google.com; dkim=pass header.d=gmail.com",
            ]
        )
        self.assertTrue(authentication_passed(message)[0])

    def test_failing_result_for_correct_domain_does_not_grant_pass(self):
        # 別ドメインが pass していても、送信元ドメインが fail なら通さない。
        message = make_message(
            auth_results=["mx.google.com; dkim=fail header.d=gmail.com; dkim=pass header.d=other.com"]
        )
        passed, reason = authentication_passed(message)
        self.assertFalse(passed)
        self.assertIn("一致しません", reason)


class LoopGuardTest(unittest.TestCase):
    def test_rejects_own_address(self):
        message = make_message(sender_address="bot@example.com")
        self.assertIsNotNone(looks_like_loop(message, "Bot@Example.com"))

    def test_rejects_bot_marker_and_auto_submitted(self):
        self.assertIsNotNone(looks_like_loop(make_message(bot_marker="reply"), "bot@example.com"))
        self.assertIsNotNone(
            looks_like_loop(make_message(auto_submitted="auto-replied"), "bot@example.com")
        )

    def test_allows_normal_mail(self):
        self.assertIsNone(looks_like_loop(make_message(auto_submitted="no"), "bot@example.com"))
        self.assertIsNone(looks_like_loop(make_message(), "bot@example.com"))


class PromptTest(unittest.TestCase):
    def test_includes_headers_body_and_attachments(self):
        attachment = ExtractedAttachment("data.csv", "text/csv", 10, "a,b\n1,2")
        prompt = build_prompt(make_message(), "売上分析", [attachment], max_chars=10_000)
        self.assertIn("件名: 売上分析", prompt)
        self.assertIn("haseko.86@gmail.com", prompt)
        self.assertIn("こんにちは", prompt)
        self.assertIn("data.csv", prompt)
        self.assertIn("a,b", prompt)

    def test_empty_body_is_labelled(self):
        prompt = build_prompt(make_message(body=""), "件名", [], max_chars=10_000)
        self.assertIn("（本文は空です）", prompt)

    def test_respects_max_chars(self):
        attachment = ExtractedAttachment("big.txt", "text/plain", 100_000, "x" * 100_000)
        prompt = build_prompt(make_message(), "件名", [attachment], max_chars=3_000)
        self.assertLessEqual(len(prompt), 3_100)


class ReplyBodyTest(unittest.TestCase):
    def _completion(self, finish_reason="stop"):
        return Completion(
            content="回答",
            reasoning=None,
            model="deepseek-chat",
            prompt_tokens=1200,
            completion_tokens=340,
            finish_reason=finish_reason,
        )

    def test_footer_contains_model_and_usage(self):
        body = format_reply_body("回答です", self._completion(), [], elapsed=3.21)
        self.assertIn("回答です", body)
        self.assertIn("deepseek-chat", body)
        self.assertIn("1,200 tok", body)
        self.assertIn("3.2 秒", body)

    def test_lists_attachments(self):
        files = [OutgoingFile("report.md", b"x")]
        self.assertIn("添付: report.md", format_reply_body("本文", self._completion(), files, 1.0))

    def test_warns_when_truncated(self):
        body = format_reply_body("途中まで", self._completion("length"), [], 1.0)
        self.assertIn("最大トークン数", body)


if __name__ == "__main__":
    unittest.main()
