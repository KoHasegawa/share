# AWS Cost Auditor Dojo — 仕様書 (v5)

## コンセプト
- プレイヤーは新人 FinOps コンサルタント。
- EC2 / RDS を 24h そのまま動かしているクライアントの請求書を読み解き、コスト最適化の判断ができるよう「徹底的に細かい知識」を覚える。
- モダン化（コンテナ化、サーバレス化）は範囲外。**実例として「EC2 + EBS + RDS + ALB + NAT GW + S3」程度の一般的な3層Webサービスを 24h 稼働させたまま、どうコスト最適化していくか**だけにフォーカスする。
- 500問以上のリファレンス書並みのボリューム。1問ごとに「なぜそうなるのか」を解説。

## トピック (Topic) 構成
| ID | 表示名 | 想定問題数 | 主な狙い |
|---|---|---|---|
| ec2-pricing | EC2 料金モデル | 60+ | On-Demand / RI (Std/Conv) / Savings Plans / Dedicated / 課金単位 |
| ec2-instance | EC2 インスタンス選定 | 50+ | ファミリ・世代・Graviton・T系バースト・テナンシー |
| ebs | EBS / スナップショット | 60+ | gp2/gp3/io1/io2/st1/sc1, Snapshot, Archive, AMI |
| network | データ転送 / VPC エンドポイント | 60+ | IN/OUT, 同AZ/クロスAZ/クロスリージョン, NAT GW, VPC Endpoint, Public IPv4 |
| elb | ELB と関連 | 30+ | ALB(LCU) / NLB(NLCU) / CLB |
| rds-basic | RDS 基礎 | 60+ | エンジン / ライセンス / Single-AZ vs Multi-AZ / インスタンスクラス / 停止 |
| rds-storage | RDS ストレージ | 30+ | gp2/gp3/io1 (RDS) / 自動スケーリング / IOPS |
| rds-backup | RDS バックアップ・レプリカ | 50+ | 自動バックアップ / PITR / 手動スナップ / リードレプリカ / クロスリージョン |
| ri-sp | RI / SP 横断応用 | 30+ | RI と SP の使い分け、共有・適用順、Marketplace |
| cost-tools | コスト管理ツール | 40+ | Cost Explorer / Budgets / CUR / Trusted Advisor / Compute Optimizer / Tags |
| region-free | リージョン・Free Tier | 20+ | リージョン価格差 / 12ヶ月無料 / 永続無料 |
| calc | 計算ドリル (数値入力) | 40+ | 月額、転送費、ストレージ、RI 実効単価 |
| scenario | シナリオ診断 | 40+ | 構成図/月次請求から無駄を見抜く総合問題 |

合計目安: **520〜560問**

## 問題タイプ

### `single` 4択
```js
{ id, topic, type: "single", q, choices: [string,string,string,string], a: <index>, explain, difficulty: 1|2|3, tags?: [] }
```

### `multi` 複数選択 (2つ以上正解)
```js
{ ..., type: "multi", choices: [...], a: [<index>, <index>, ...], explain }
```
- 過剰選択・不足選択ともに不正解。
- UI には「2つ以上選んでください」を表示。

### `fill` 数値 / 文字列入力
```js
{ ..., type: "fill",
  q,
  // 数値の場合
  numeric: true, a: 0.045, tolerance: 0.005, unit: "USD/GB",
  // 文字列の場合
  numeric: false, a: ["NAT Gateway", "NATゲートウェイ"], // 大文字小文字を無視して一致判定
  explain
}
```

### `scenario` 構成診断 (複問)
```js
{ ..., type: "scenario",
  q,                // 状況説明 (Markdown 風プレーンテキスト)
  context: [...],   // 構成や月次明細の箇条書き
  parts: [
    { q, choices, a, explain, type: "single"|"multi" },
    ...
  ],
  explain: "総括解説"
}
```

## 画面 / モード

### Home
- ヘッダ: 道場ロゴ、累計 XP、レベル、連続正解
- クイックモード:
  - **ドリル**: トピックを選んでそのトピックの全問題を順番に
  - **10問 / 30問 / 50問 ランダム**: 全トピック横断
  - **間違いノート**: これまでに間違えた問題のみ
  - **計算特訓**: type=fill のみ
  - **シナリオ診断**: type=scenario のみ
  - **最終試験**: 100問 + 制限時間
- トピックグリッド: 各トピックの正答率 / 既出問題数 / 全問題数を表示

### Quiz
- 上部: 進捗 (3 / 30)、現在のトピック、難易度
- 中央: 問題文 (改行尊重)、必要なら context 表示
- 入力エリア: タイプ別に切り替え
- アクション: 「回答する」 → 解説 + 「次へ」
- 解説には: 正解の根拠、誤答ごとの解説、関連知識リンク (内部ジャンプ)

### Result
- スコア (%, 問題数)
- XP 加算量と新レベル到達演出
- 問題ごとの正誤と解説（折りたたみ）
- 「間違いをノートに保存」自動 → ボタンで再挑戦

### 統計
- トピック別正答率 (棒グラフ)
- 累計プレイ問題数、ユニーク問題数
- ベストストリーク

## 永続化 (localStorage)
キー: `aws-cost-dojo:v1`
```json
{
  "xp": 1234,
  "level": 5,
  "answered": { "ec2p-001": { "correct": true, "attempts": 2 }, ... },
  "wrongIds": ["ec2p-003", "rds-007", ...],
  "streakBest": 14,
  "lastPlayed": "ISO"
}
```

## XP / レベル
- 正解: 難易度 × 10 XP
- 連続正解 5 回ごとに +20 ボーナス
- 不正解: +0、ただし「間違いノート」で再挑戦して正解 → +5
- レベル閾値: L1=0, L2=100, L3=300, L4=600, L5=1000, L6=1500, L7=2200, L8=3000, L9=4000, L10=5200, 以降+1500/レベル
- レベル称号: 見習い → 駆け出し請求アナリスト → コスト探偵 → 削減コンサル → AZ ハンター → リザーブド軍曹 → タグマスター → スポット格闘家 → グラビトン使い → コスト道場師範

## 配色 / トーン
- ダークテーマ。背景 `#0d1117`、アクセント `#f59e0b` (請求・お金) と `#3fb950` (節約) のツートン。
- 既存 game-v* と統一感のあるカード UI。

## ファイル構成
```
game-v5/
  index.html
  css/style.css
  js/
    app.js          // ルーティング / モード起動 / Home
    state.js        // localStorage 永続化、XP/レベル計算
    quiz.js         // 出題、採点、解説表示
    util.js         // shuffle, format
    data/
      topics.js     // トピックメタ
      q-ec2-pricing.js
      q-ec2-instance.js
      q-ebs.js
      q-network.js
      q-elb.js
      q-rds-basic.js
      q-rds-storage.js
      q-rds-backup.js
      q-ri-sp.js
      q-cost-tools.js
      q-region-free.js
      q-calc.js
      q-scenario.js
  docs/
    spec.md
    knowledge.md
```

## 注意 / 範囲外
- 料金は **2024〜2025 の典型値** を前提に設定し、解説の冒頭で「概算」と明記する。
- Aurora は RDS の一形態だが、Aurora 特有 (I/O 課金、Serverless v2 ACU) は今回スコープ外。Multi-AZ / リードレプリカは通常 RDS で扱う。
- モダン化系 (Lambda、Fargate、ECS/EKS、コンテナ化、サーバレス化) は出さない。比較として一文触れる程度に留める。
- リージョン: 主にバージニア北部 (us-east-1) と東京 (ap-northeast-1) の値を採用。
