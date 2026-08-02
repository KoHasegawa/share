import io
import unittest

from deepseek_mail_bot.attachments import (
    extract_attachment,
    sanitize_filename,
    split_file_blocks,
)

try:
    import openpyxl
except ImportError:  # 任意依存なので、無い環境ではその分のテストを飛ばす
    openpyxl = None


class SplitFileBlocksTest(unittest.TestCase):
    def test_extracts_single_file_block(self):
        text = "できました。\n\n```file:hello.py\nprint('hi')\n```\n\n以上です。"
        body, files = split_file_blocks(text)
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].filename, "hello.py")
        self.assertEqual(files[0].content, b"print('hi')\n")
        self.assertIn("［添付: hello.py］", body)
        self.assertNotIn("print('hi')", body)

    def test_keeps_plain_code_fences_in_body(self):
        text = "例:\n\n```python\nprint('hi')\n```"
        body, files = split_file_blocks(text)
        self.assertEqual(files, [])
        self.assertIn("```python", body)

    def test_handles_multiple_and_duplicate_names(self):
        text = (
            "```file:a.txt\none\n```\n"
            "```file:a.txt\ntwo\n```\n"
            "```attachment:b.csv\nx,y\n```\n"
        )
        _, files = split_file_blocks(text)
        self.assertEqual([f.filename for f in files], ["a.txt", "a-2.txt", "b.csv"])
        self.assertEqual(files[1].content, b"two\n")

    def test_supports_japanese_label_and_longer_fence(self):
        text = "````添付: メモ.md\n# タイトル\n\n```py\ncode\n```\n````"
        _, files = split_file_blocks(text)
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].filename, "メモ.md")
        self.assertIn("```py", files[0].content.decode())

    def test_unclosed_block_stays_in_body(self):
        text = "```file:broken.txt\nno closing fence"
        body, files = split_file_blocks(text)
        self.assertEqual(files, [])
        self.assertIn("no closing fence", body)

    def test_path_traversal_in_filename_is_neutralised(self):
        text = "```file:../../etc/passwd\nx\n```"
        _, files = split_file_blocks(text)
        self.assertEqual(files[0].filename, "passwd")

    def test_empty_input(self):
        body, files = split_file_blocks("")
        self.assertEqual(body, "")
        self.assertEqual(files, [])


class SanitizeFilenameTest(unittest.TestCase):
    def test_strips_directories_and_control_characters(self):
        self.assertEqual(sanitize_filename("dir/sub/report.md"), "report.md")
        self.assertEqual(sanitize_filename("bad name;rm -rf.txt"), "bad_name_rm_-rf.txt")

    def test_falls_back_when_empty(self):
        self.assertEqual(sanitize_filename("///"), "attachment.txt")
        self.assertEqual(sanitize_filename("   "), "attachment.txt")


class ExtractAttachmentTest(unittest.TestCase):
    def test_plain_text(self):
        result = extract_attachment("notes.txt", "text/plain", "こんにちは".encode("utf-8"))
        self.assertEqual(result.text, "こんにちは")
        self.assertIn("notes.txt", result.as_prompt_block())

    def test_cp932_text_is_decoded(self):
        result = extract_attachment("sjis.csv", "application/octet-stream", "日本語".encode("cp932"))
        self.assertEqual(result.text, "日本語")

    def test_image_is_reported_as_unsupported(self):
        result = extract_attachment("photo.png", "image/png", b"\x89PNG\r\n")
        self.assertIsNone(result.text)
        self.assertIn("画像", result.note or "")

    def test_unknown_binary(self):
        result = extract_attachment("blob.bin", "application/octet-stream", b"\x00\x01\x02\xff")
        self.assertIsNone(result.text)
        self.assertIn("バイナリ", result.note or "")

    def test_long_text_is_truncated_in_prompt_block(self):
        result = extract_attachment("big.txt", "text/plain", ("a" * 5000).encode())
        block = result.as_prompt_block(char_limit=100)
        self.assertIn("省略", block)
        self.assertLess(len(block), 500)

    def test_legacy_office_format_is_reported(self):
        result = extract_attachment("old.xls", "application/vnd.ms-excel", b"\xd0\xcf\x11\xe0")
        self.assertIsNone(result.text)
        self.assertIn("未対応", result.note or "")


@unittest.skipIf(openpyxl is None, "openpyxl がインストールされていません")
class ExcelExtractionTest(unittest.TestCase):
    def _workbook_bytes(self, rows, title="売上"):
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = title
        for row in rows:
            sheet.append(row)
        buffer = io.BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()

    def test_converts_sheet_to_csv(self):
        data = self._workbook_bytes([("月", "売上"), ("2026-01", 1200), ("2026-02", 1450)])
        result = extract_attachment("sales.xlsx", "application/octet-stream", data)
        self.assertIsNotNone(result.text)
        self.assertIn("シート: 売上", result.text)
        self.assertIn("2026-01,1200", result.text)
        self.assertIn("CSV", result.note or "")

    def test_empty_workbook_is_reported(self):
        result = extract_attachment("empty.xlsx", "application/octet-stream", self._workbook_bytes([]))
        self.assertIsNone(result.text)
        self.assertIn("見つかりません", result.note or "")

    def test_row_cap_is_applied(self):
        data = self._workbook_bytes([(index, index * 2) for index in range(700)])
        result = extract_attachment("long.xlsx", "application/octet-stream", data)
        self.assertIn("先頭 500 行のみ", result.text)

    def test_corrupt_file_does_not_raise(self):
        result = extract_attachment("broken.xlsx", "application/octet-stream", b"PK\x03\x04garbage")
        self.assertIsNone(result.text)
        self.assertIn("失敗", result.note or "")


if __name__ == "__main__":
    unittest.main()
