"""コマンドラインからの入口。

    python -m deepseek_mail_bot            # 未読を 1 回だけ処理する（cron / GitHub Actions 向け）
    python -m deepseek_mail_bot --loop     # 常駐して定期的に受信箱を確認する
    python -m deepseek_mail_bot --check    # 設定と接続を確認するだけ
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

from .bot import MailBot
from .config import Config, ConfigError
from .deepseek import DeepSeekClient, DeepSeekError
from .mailbox import Mailbox, MailboxError

log = logging.getLogger("deepseek_mail_bot")


def load_dotenv(path: Path) -> None:
    """.env を読んで環境変数に入れる（既存の環境変数は上書きしない）。"""

    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):].strip()
        key, sep, value = line.partition("=")
        if not sep:
            continue
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def check(config: Config) -> int:
    """IMAP・SMTP・DeepSeek API それぞれに到達できるか確認する。"""

    ok = True

    try:
        with Mailbox(
            host=config.imap_host,
            port=config.imap_port,
            user=config.imap_user,
            password=config.imap_password,
            folder=config.imap_folder,
            ssl=config.imap_ssl,
        ) as mailbox:
            unseen = mailbox.fetch_unseen(limit=1)
        print(f"[OK]   IMAP {config.imap_host}:{config.imap_port} / {config.imap_folder}"
              f"（未読 {'あり' if unseen else 'なし'}）")
    except MailboxError as exc:
        ok = False
        print(f"[NG]   IMAP: {exc}")

    try:
        client = DeepSeekClient(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=30,
            max_retries=0,
        )
        completion = client.chat(
            [{"role": "user", "content": "ping とだけ返してください。"}],
            model=config.model,
            max_tokens=16,
        )
        print(f"[OK]   DeepSeek API（{completion.model}）")
    except DeepSeekError as exc:
        ok = False
        print(f"[NG]   DeepSeek API: {exc}")

    print(f"[INFO] 返信元アドレス: {config.bot_address}")
    print(f"[INFO] 許可した送信元: {', '.join(config.allowed_senders)}")
    print(f"[INFO] DKIM/SPF の検証: {'有効' if config.require_auth_results else '無効'}")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="deepseek-mail-bot",
        description="メールで届いた質問を DeepSeek に投げ、添付ファイル付きで返信します。",
    )
    parser.add_argument("--loop", action="store_true", help="常駐して定期的に受信箱を確認する")
    parser.add_argument("--interval", type=int, default=60, help="--loop 時の確認間隔（秒、既定 60）")
    parser.add_argument("--check", action="store_true", help="設定と接続の確認だけを行う")
    parser.add_argument("--dry-run", action="store_true", help="返信を送らず、生成結果をログに出す")
    parser.add_argument("--env-file", default=".env", help="読み込む .env のパス（既定 .env）")
    parser.add_argument("-v", "--verbose", action="store_true", help="デバッグログを出す")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )

    load_dotenv(Path(args.env_file))
    if args.dry_run:
        os.environ["DRY_RUN"] = "true"

    try:
        config = Config.from_env()
    except ConfigError as exc:
        log.error("設定エラー: %s", exc)
        return 2

    if args.check:
        return check(config)

    bot = MailBot(config)
    try:
        if args.loop:
            bot.run_forever(args.interval)
            return 0
        replied = bot.run_once()
        log.info("処理を終了しました（返信 %d 件）。", replied)
        return 0
    except MailboxError as exc:
        log.error("%s", exc)
        return 1
    except KeyboardInterrupt:
        log.info("中断しました。")
        return 130


if __name__ == "__main__":
    sys.exit(main())
