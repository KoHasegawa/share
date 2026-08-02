# DeepSeek Mail Bot

決めたアドレスにメールを送ると、DeepSeek が本文（と添付ファイルの中身）を読んで返信するボットです。
添付ファイルは送受信の両方に対応しています。

```
  あなた ──メール──▶ bot 用アドレス
                        │  IMAP で未読を取得
                        ▼
                     本文＋添付テキストを DeepSeek API へ
                        │
                        ▼
  あなた ◀──返信──── SMTP（同じスレッドに、必要なら添付付きで）
```

## できること

- **本文への回答** — 送ったメールの本文を読んで、同じスレッドに返信します。
- **添付を読む** — PDF / Word (.docx) / Excel (.xlsx) / CSV / テキスト・ソースコードを
  テキストに変換して DeepSeek に渡します。
- **添付を返す** — DeepSeek が長い成果物を返すときは、本文に貼らずファイルとして添付します。
- **会話の継続** — 返信にそのまま返信すれば、同じスレッドの文脈を覚えたまま続けられます。
- **送信元の制限** — 許可したアドレス以外は無視します。From の詐称対策に DKIM/SPF も確認します。

DeepSeek のモデルは画像を読めないため、画像の添付は「読めなかった」旨を添えてスキップします。

## セットアップ

### 1. ボット用のメールアドレスを用意する

**自分の普段のアドレスとは別に、ボット専用の Gmail アカウントを作ってください。**
ボットは受信箱の未読メールをすべて処理対象として見るため、専用アカウントのほうが安全で分かりやすいです。

Gmail を使う場合:

1. Google アカウントで 2 段階認証を有効にする（アプリパスワードの前提条件）。
2. [アプリ パスワード](https://myaccount.google.com/apppasswords) で 16 桁のパスワードを発行する。
   これを `IMAP_PASSWORD` に設定します（通常のログインパスワードでは接続できません）。
3. Gmail の設定 → 「メール転送と POP/IMAP」で **IMAP を有効** にする。

Gmail 以外（iCloud, Outlook, さくらのメール等）でも、IMAP と SMTP が使えれば動きます。
ホスト名とポートを `.env` に書き換えてください。

### 2. DeepSeek の API キーを取る

[platform.deepseek.com](https://platform.deepseek.com/) でアカウントを作り、API キーを発行して
残高をチャージします。キーは `sk-` で始まる文字列です。

### 3. 設定ファイルを作る

```bash
cd deepseek-mail-bot
cp .env.example .env
$EDITOR .env          # IMAP / SMTP / DEEPSEEK_API_KEY / ALLOWED_SENDERS を埋める
```

`ALLOWED_SENDERS` には**自分のアドレス**を書きます（例: `haseko.86@gmail.com`）。
ここに無いアドレスからのメールは、API を呼ばずに無視されます。

### 4. インストールして動作確認

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python -m deepseek_mail_bot --check      # IMAP と DeepSeek に繋がるか確認
python -m deepseek_mail_bot --dry-run    # 実際には送らず、生成結果をログに出す
python -m deepseek_mail_bot              # 未読を処理して返信する
```

## 動かし方

用途に合わせて 3 通りあります。

### A. 手元・サーバで常駐させる（応答が速い）

```bash
python -m deepseek_mail_bot --loop --interval 60
```

60 秒ごとに受信箱を確認します。サーバや Raspberry Pi に置くなら、同梱の
`deepseek-mail-bot.service` を systemd ユニットとして使えます（ファイル冒頭に手順あり）。

### B. cron で回す

```cron
*/5 * * * * cd /opt/deepseek-mail-bot && .venv/bin/python -m deepseek_mail_bot >> bot.log 2>&1
```

### C. GitHub Actions で回す（サーバ不要）

`.github/workflows/deepseek-mail-bot.yml` が 5 分ごとに実行します。
リポジトリの Settings → Secrets and variables → Actions で以下の Secret を登録してください。

| Secret | 例 |
| --- | --- |
| `IMAP_HOST` | `imap.gmail.com` |
| `IMAP_PORT` | `993` |
| `IMAP_USER` | `deepseek.bot@gmail.com` |
| `IMAP_PASSWORD` | Gmail のアプリパスワード |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `deepseek.bot@gmail.com` |
| `SMTP_PASSWORD` | 同上（アプリパスワード） |
| `BOT_ADDRESS` | `deepseek.bot@gmail.com` |
| `ALLOWED_SENDERS` | `haseko.86@gmail.com` |
| `DEEPSEEK_API_KEY` | `sk-...` |

GitHub の cron は最短 5 分間隔で、混雑時は十数分遅れることがあります。返信の速さを求めるなら A を選んでください。
また、スケジュール実行はリポジトリが 60 日間更新されないと自動停止します。

**このリポジトリは公開されています。** Secrets 自体はログに出ませんが、`.env` や
アプリパスワードを誤ってコミットしないよう注意してください（`.gitignore` で除外済みです）。

## 使い方

### 普通に質問する

件名でも本文でも構いません。届いたメールの本文がそのまま質問として渡されます。

```
To: deepseek.bot@gmail.com
件名: 正規表現について
本文: Python でメールアドレスを検証する正規表現を書いて、注意点も教えて。
```

### 添付を読ませる

CSV や PDF を添付して「この資料を要約して」と書けば、抽出したテキストが本文と一緒に渡されます。

```
To: deepseek.bot@gmail.com
件名: 売上の分析
本文: 添付の CSV を月別に集計して、傾向を教えて。
添付: sales.csv
```

### ファイルで返してもらう

長いコードや表は、DeepSeek 側が判断して添付ファイルとして返します。
明示したいときは「〜をファイルで返して」と書いてください。
仕組みとしては、DeepSeek が次の形式で出力したブロックを、ボットが添付に変換しています。

````
```file:summary.csv
月,売上
2026-01,1200
```
````

この部分は本文から取り除かれ、`［添付: summary.csv］` という目印だけが残ります。

### 件名のタグで挙動を変える

件名の先頭に付けたタグは、指示として解釈されて件名からは取り除かれます。

| タグ | 効果 |
| --- | --- |
| `[r1]` `[reasoner]` | 推論モデル `deepseek-reasoner` を使う（難しい問題向け、遅くて高価） |
| `[v3]` `[chat]` | 通常モデル `deepseek-chat` を使う（既定） |
| `[new]` `[reset]` | そのスレッドの会話履歴を捨てて、新しい話として始める |

例: `件名: [r1] この設計のトレードオフを整理して`

### 会話を続ける

返信にそのまま返信すれば、直近 12 往復まで文脈を保ったまま続きます
（`MAX_HISTORY_TURNS` で変更可）。履歴は `state/threads/` に JSON で保存されます。

## 設定項目

`.env`（または環境変数）で指定します。主なものは以下のとおりです。全項目は `.env.example` を参照してください。

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `ALLOWED_SENDERS` | （必須） | 返信を許可する送信元。カンマ区切り。`@example.com` でドメイン全体も指定可 |
| `REQUIRE_AUTH_RESULTS` | `true` | 受信サーバの DKIM/SPF 判定を確認する |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 既定のモデル |
| `DEEPSEEK_MAX_TOKENS` | `4096` | 1 回の返信の最大出力トークン数 |
| `MAX_INPUT_CHARS` | `120000` | 本文＋添付をあわせた入力の上限文字数 |
| `MAX_ATTACHMENT_BYTES` | `20 MB` | これより大きい受信添付は読まずにスキップ |
| `MAX_OUTGOING_ATTACHMENT_BYTES` | `10 MB` | 返信に付ける添付の合計上限 |
| `MAX_MESSAGES_PER_RUN` | `10` | 1 回の実行で処理する最大件数 |
| `SYSTEM_PROMPT` | （既定文） | DeepSeek に渡すシステムプロンプト |
| `DRY_RUN` | `false` | `true` にすると送信せずログ出力のみ |

## セキュリティについて

- **送信元の制限は必須です。** `ALLOWED_SENDERS` が空だと起動しません。これが無いと、
  アドレスを知った誰でもあなたの API 残高を使えてしまいます。
- **From ヘッダは詐称できます。** そのため既定では、受信サーバが付けた
  `Authentication-Results` を見て、送信元ドメインの DKIM か SPF が pass しているかを確認します。
  自前のメールサーバなどでこのヘッダが付かない場合は `REQUIRE_AUTH_RESULTS=false` にできますが、
  許可リストだけが防御になる点は理解しておいてください。
- **自動応答のループ対策** として、返信には `Auto-Submitted: auto-replied` と
  `X-DeepSeek-Mail-Bot` を付け、これらが付いたメールやボット自身からのメールには応答しません。
- **アプリパスワードと API キーは `.env` にのみ書き**、リポジトリにはコミットしないでください。

## 動作の詳細

- 未読（`UNSEEN`）のメールだけを処理し、返信し終えたら既読にします。これが重複処理の防止になっています。
- 取得は `BODY.PEEK[]` で行うため、処理前に既読になることはありません。
- DeepSeek の呼び出しが失敗したメールには、エラー内容を書いた通知メールを返し、
  そのメールに `\Flagged` を付けて既読にします（無限にリトライしないため）。
- 本文は `text/plain` を優先し、無ければ HTML から抽出します。引用部分（`> ` や
  「〜さんは書きました」以降）は落としてから渡します。

## テスト

```bash
python -m unittest discover -s tests -t . -v
```

外部サービスには一切接続しません（IMAP・SMTP・DeepSeek API はすべてスタブに差し替えています）。

## トラブルシューティング

| 症状 | 確認すること |
| --- | --- |
| `IMAP への接続に失敗しました` | アプリパスワードを使っているか、Gmail 側で IMAP が有効か |
| 返信が来ない | `ALLOWED_SENDERS` に自分のアドレスがあるか。ログに「許可されていない送信元」が出ていないか |
| 「認証に失敗」でスキップされる | `--verbose` でログを確認。自前サーバなら `REQUIRE_AUTH_RESULTS=false` を検討 |
| `HTTP 402` | DeepSeek の残高不足。プラットフォームでチャージする |
| 添付が読まれない | PDF/docx/xlsx は `requirements.txt` の依存が必要。画像は非対応 |
| 返信が途中で切れる | `DEEPSEEK_MAX_TOKENS` を増やす |
