"""環境変数からボットの設定を読み込む。"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


class ConfigError(RuntimeError):
    """設定が足りない / 壊れているときに投げる。"""


def _require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ConfigError(f"環境変数 {name} が設定されていません。")
    return value


def _get(name: str, default: str = "") -> str:
    value = os.environ.get(name)
    return default if value is None or value.strip() == "" else value.strip()


def _get_int(name: str, default: int) -> int:
    raw = _get(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigError(f"環境変数 {name} は整数で指定してください（現在の値: {raw!r}）。") from exc


def _get_float(name: str, default: float) -> float:
    raw = _get(name)
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise ConfigError(f"環境変数 {name} は数値で指定してください（現在の値: {raw!r}）。") from exc


def _get_bool(name: str, default: bool) -> bool:
    raw = _get(name).lower()
    if not raw:
        return default
    if raw in {"1", "true", "yes", "on"}:
        return True
    if raw in {"0", "false", "no", "off"}:
        return False
    raise ConfigError(f"環境変数 {name} は true / false で指定してください（現在の値: {raw!r}）。")


def _get_list(name: str) -> list[str]:
    raw = _get(name)
    if not raw:
        return []
    return [item.strip().lower() for item in raw.replace("\n", ",").split(",") if item.strip()]


DEFAULT_SYSTEM_PROMPT = """あなたはメール経由で呼び出されるアシスタントです。
受け取った本文（および添付ファイルから抽出したテキスト）を読み、日本語で簡潔かつ具体的に回答してください。

出力のルール:
- 返信はプレーンテキストのメール本文として読まれます。過剰な装飾は避けてください。
- 長い成果物（コード、CSV、レポート、設定ファイルなど）を返すときは、本文に貼らずに
  次の形式のコードフェンスで囲むと、そのままメールの添付ファイルとして送られます。

  ```file:analysis.py
  print("hello")
  ```

  情報文字列は `file:` に続けてファイル名を書いてください（例: `file:report.md`）。
- 添付にするほどでもない短い断片は、通常どおり本文に書いて構いません。
- 情報が足りない場合は、憶測で埋めずに何が必要かを明記してください。
"""


@dataclass
class Config:
    """ボット 1 回分の実行に必要な設定一式。"""

    imap_host: str
    imap_port: int
    imap_user: str
    imap_password: str
    imap_folder: str
    imap_ssl: bool

    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    smtp_starttls: bool

    bot_address: str
    bot_name: str
    allowed_senders: list[str]
    require_auth_results: bool

    api_key: str
    base_url: str
    model: str
    reasoner_model: str
    temperature: float
    max_tokens: int
    request_timeout: int
    max_retries: int

    system_prompt: str
    max_input_chars: int
    max_attachment_bytes: int
    max_outgoing_attachment_bytes: int
    max_history_turns: int
    max_messages_per_run: int

    state_dir: Path
    dry_run: bool
    mark_seen: bool
    error_notice: bool

    extra_headers: dict[str, str] = field(default_factory=dict)

    @classmethod
    def from_env(cls) -> "Config":
        imap_user = _require("IMAP_USER")
        smtp_user = _get("SMTP_USER") or imap_user
        bot_address = _get("BOT_ADDRESS") or smtp_user

        allowed = _get_list("ALLOWED_SENDERS")
        if not allowed:
            raise ConfigError(
                "ALLOWED_SENDERS が空です。返信先を限定しないと誰でもボットを起動できてしまうため、"
                "許可する送信元アドレスをカンマ区切りで指定してください。"
            )

        return cls(
            imap_host=_require("IMAP_HOST"),
            imap_port=_get_int("IMAP_PORT", 993),
            imap_user=imap_user,
            imap_password=_require("IMAP_PASSWORD"),
            imap_folder=_get("IMAP_FOLDER", "INBOX"),
            imap_ssl=_get_bool("IMAP_SSL", True),
            smtp_host=_require("SMTP_HOST"),
            smtp_port=_get_int("SMTP_PORT", 587),
            smtp_user=smtp_user,
            smtp_password=_get("SMTP_PASSWORD") or _require("IMAP_PASSWORD"),
            smtp_starttls=_get_bool("SMTP_STARTTLS", True),
            bot_address=bot_address,
            bot_name=_get("BOT_NAME", "DeepSeek Mail Bot"),
            allowed_senders=allowed,
            require_auth_results=_get_bool("REQUIRE_AUTH_RESULTS", True),
            api_key=_require("DEEPSEEK_API_KEY"),
            base_url=_get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
            model=_get("DEEPSEEK_MODEL", "deepseek-chat"),
            reasoner_model=_get("DEEPSEEK_REASONER_MODEL", "deepseek-reasoner"),
            temperature=_get_float("DEEPSEEK_TEMPERATURE", 0.3),
            max_tokens=_get_int("DEEPSEEK_MAX_TOKENS", 4096),
            request_timeout=_get_int("DEEPSEEK_TIMEOUT", 300),
            max_retries=_get_int("DEEPSEEK_MAX_RETRIES", 4),
            system_prompt=_get("SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT),
            max_input_chars=_get_int("MAX_INPUT_CHARS", 120_000),
            max_attachment_bytes=_get_int("MAX_ATTACHMENT_BYTES", 20 * 1024 * 1024),
            max_outgoing_attachment_bytes=_get_int("MAX_OUTGOING_ATTACHMENT_BYTES", 10 * 1024 * 1024),
            max_history_turns=_get_int("MAX_HISTORY_TURNS", 12),
            max_messages_per_run=_get_int("MAX_MESSAGES_PER_RUN", 10),
            state_dir=Path(_get("STATE_DIR", "state")).expanduser(),
            dry_run=_get_bool("DRY_RUN", False),
            mark_seen=_get_bool("MARK_SEEN", True),
            error_notice=_get_bool("ERROR_NOTICE", True),
        )
