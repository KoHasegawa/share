"""DeepSeek Chat Completions API の薄いクライアント。"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import requests

log = logging.getLogger(__name__)

RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}


class DeepSeekError(RuntimeError):
    """API 呼び出しが最終的に失敗したときに投げる。"""


@dataclass
class Completion:
    """API から返ってきた 1 応答。"""

    content: str
    reasoning: str | None
    model: str
    prompt_tokens: int
    completion_tokens: int
    finish_reason: str

    @property
    def truncated(self) -> bool:
        return self.finish_reason == "length"


class DeepSeekClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.deepseek.com",
        timeout: int = 300,
        max_retries: int = 4,
        session: requests.Session | None = None,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = session or requests.Session()

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str = "deepseek-chat",
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> Completion:
        url = f"{self.base_url}/chat/completions"
        payload: dict[str, object] = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": False,
        }
        # deepseek-reasoner は temperature を受け付けない（指定すると無視 or エラー）。
        if not model.endswith("reasoner"):
            payload["temperature"] = temperature

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            if attempt:
                delay = min(2 ** attempt, 60)
                log.warning("DeepSeek API を %d 秒後に再試行します（%d 回目）。", delay, attempt)
                time.sleep(delay)
            try:
                response = self.session.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=self.timeout,
                )
            except requests.RequestException as exc:
                last_error = exc
                log.warning("DeepSeek API への接続に失敗しました: %s", exc)
                continue

            if response.status_code in RETRYABLE_STATUS:
                last_error = DeepSeekError(
                    f"HTTP {response.status_code}: {response.text[:500]}"
                )
                log.warning("DeepSeek API が %s を返しました。", response.status_code)
                continue

            if response.status_code >= 400:
                raise DeepSeekError(
                    f"DeepSeek API がエラーを返しました（HTTP {response.status_code}）: "
                    f"{response.text[:1000]}"
                )

            return _parse_completion(response.json(), fallback_model=model)

        raise DeepSeekError(f"DeepSeek API の呼び出しに失敗しました: {last_error}")


def _parse_completion(data: dict, fallback_model: str) -> Completion:
    choices = data.get("choices") or []
    if not choices:
        raise DeepSeekError(f"応答に choices が含まれていません: {str(data)[:500]}")

    choice = choices[0]
    message = choice.get("message") or {}
    content = (message.get("content") or "").strip()
    reasoning = message.get("reasoning_content")
    if not content:
        raise DeepSeekError("DeepSeek から空の応答が返りました。")

    usage = data.get("usage") or {}
    return Completion(
        content=content,
        reasoning=reasoning.strip() if isinstance(reasoning, str) and reasoning.strip() else None,
        model=data.get("model") or fallback_model,
        prompt_tokens=int(usage.get("prompt_tokens") or 0),
        completion_tokens=int(usage.get("completion_tokens") or 0),
        finish_reason=choice.get("finish_reason") or "stop",
    )
