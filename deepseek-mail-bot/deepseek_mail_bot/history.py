"""スレッドごとの会話履歴を JSON で保存する。"""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

log = logging.getLogger(__name__)


class ThreadHistory:
    """メールスレッド単位で user / assistant のやり取りを覚えておく。

    履歴が失われても動作自体は壊れない（毎回 1 往復として扱われるだけ）ので、
    読み書きの失敗は警告に留める。
    """

    def __init__(self, state_dir: Path, max_turns: int = 12) -> None:
        self.dir = Path(state_dir) / "threads"
        self.max_turns = max_turns

    def _path(self, thread_root: str) -> Path:
        digest = hashlib.sha1(thread_root.encode("utf-8")).hexdigest()[:20]
        return self.dir / f"{digest}.json"

    def load(self, thread_root: str) -> list[dict[str, str]]:
        path = self._path(thread_root)
        if not path.exists():
            return []
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            log.warning("会話履歴の読み込みに失敗しました（%s）: %s", path, exc)
            return []
        messages = data.get("messages") if isinstance(data, dict) else None
        if not isinstance(messages, list):
            return []
        return [
            {"role": str(item["role"]), "content": str(item["content"])}
            for item in messages
            if isinstance(item, dict) and item.get("role") in {"user", "assistant"} and item.get("content")
        ]

    def append(self, thread_root: str, user_content: str, assistant_content: str, subject: str = "") -> None:
        messages = self.load(thread_root)
        messages.append({"role": "user", "content": user_content})
        messages.append({"role": "assistant", "content": assistant_content})
        messages = messages[-self.max_turns * 2:]
        path = self._path(thread_root)
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            payload = {"thread_root": thread_root, "subject": subject, "messages": messages}
            tmp = path.with_suffix(".json.tmp")
            tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            tmp.replace(path)
        except OSError as exc:
            log.warning("会話履歴の保存に失敗しました（%s）: %s", path, exc)

    def clear(self, thread_root: str) -> None:
        try:
            self._path(thread_root).unlink(missing_ok=True)
        except OSError as exc:
            log.warning("会話履歴の削除に失敗しました: %s", exc)
