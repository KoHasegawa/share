# AWS学習ゲーム v4 ゲームデザイン書

## 1. ゲームモード / 章構成

タイトル: **Cloud Career Architect**

モード:

- キャンペーン: 標準モード。章を順にクリアし、肩書きを上げる
- 復習導線: 独立モードではなく、誤答したサービスを次章候補へ混ぜる内部機能

章構成:

1. Webフロント基礎: DNS、CDN、静的ホスティング、公開API
2. データと非同期化: RDB、NoSQL、キュー、分析
3. セキュリティ強化: IAM、暗号化、監査、脅威検知
4. ネットワークと移行: VPC、Direct Connect、Transit Gateway、オンプレ移行
5. 運用とコスト: 監視、Config、Systems Manager、Cost Explorer
6. アーキテクト昇格試験: 複合要件のボス案件

各章は4〜7案件。章末にボス案件を置き、必須サービス数とシナジー要求を増やす。

## 2. AWSサービス一覧

使用サービスは45種類。

- Route 53
- CloudFront
- WAF
- VPC
- ALB
- NAT Gateway
- Direct Connect
- Transit Gateway
- Global Accelerator
- Shield
- EC2
- Lambda
- API Gateway
- ECS Fargate
- EKS
- Step Functions
- SNS
- SQS
- EventBridge
- AppSync
- Kinesis Data Streams
- S3
- EFS
- FSx
- RDS
- Aurora
- RDS Multi-AZ
- DynamoDB
- ElastiCache
- Redshift
- OpenSearch
- Athena
- Glue
- IAM
- KMS
- Secrets Manager
- CloudWatch
- CloudTrail
- GuardDuty
- Security Hub
- Config
- Systems Manager
- X-Ray
- Organizations
- Cost Explorer

表示候補は案件難易度に応じて10〜16枚。候補には required/support/trap を必ず含め、復習サービスを優先的に混ぜる。

## 3. 案件タイプ

- design: 新規構成を組む。機能、可用性、性能を重めに評価する
- incident: 障害中の構成に追加すべきサービスを選ぶ。可用性、運用負荷を重めに評価する
- cost_cut: コスト過剰な構成を改善する。コスト、運用負荷を重めに評価する
- harden: セキュリティ/コンプラを強化する。セキュリティ、運用負荷を重めに評価する
- migrate: オンプレ要件をAWSへ読み替える。機能、可用性、セキュリティを重めに評価する

UIではタイプごとにラベル、色、説明を切り替える。

## 4. スコアリング

データ構造:

```js
challenge = {
  id: 'global_streaming',
  chapter: 'web',
  type: 'design',
  difficulty: 4,
  maxSelect: 5,
  candidateCount: 14,
  required: ['s3', 'cloudfront', 'route53'],
  support: ['route53', 'waf'],
  traps: ['rds_multi', 'redshift'],
  conflicts: [
    { ids: ['cloudfront', 'globalaccelerator'], reason: '静的配信高速化ではCloudFrontが主役' }
  ],
  antiPatterns: [
    { ids: ['rds_multi', 's3'], reason: '静的配信に冗長RDBは過剰' }
  ]
}
```

採点:

- required 的中は最重要
- support は加点だが、必須不足を埋めるほど強くしない
- traps は見た目が近いほど重い減点を持つ
- conflicts は「正しいサービス同士でも同時に使うと要件とずれる」ケースを表す
- synergies は汎用データとして20件以上定義し、複数案件で効く
- antiPatterns は案件固有の組み合わせ減点

リソース変化:

- S/A: 評判と信頼を上げ、章タイプに応じて予算またはSLAも上げる
- B: 小幅増減
- C/D: 評判を下げ、罠や不足に応じて予算/信頼/SLAを下げる
- ボス案件D: 追加で全リソースを下げる

## 5. UIワイヤー

タイトル:

```text
┌──────────────────────────────────────────────┐
│ ☁ Cloud Career Architect                     │
│ 新人 → ジュニア → シニア → アーキテクト       │
│ [続きから] [最初から]                         │
│ 保存状況: 評判 / 予算 / 信頼 / SLA            │
└──────────────────────────────────────────────┘
```

キャリア画面:

```text
┌──────────────────────────────────────────────┐
│ 肩書き: ジュニアクラウド設計者                │
│ 評判 72 / 予算 61 / 信頼 68 / SLA 55          │
│ [Web基礎 完了] [データと非同期化 開始]        │
│ [セキュリティ強化 ロック]                    │
└──────────────────────────────────────────────┘
```

案件画面:

```text
┌──────────────────────────────────────────────┐
│ Chapter 2   Incident   残り 30s              │
│ 障害: 注文処理が詰まっている                  │
│ 要件本文 / 重要軸 / 選択上限 4                │
├──────────────────────────────────────────────┤
│ [SQS] [Lambda] [DynamoDB] ... 10〜16枚        │
├──────────────────────────────────────────────┤
│ 選択中 3/4     [提出] [リセット]              │
└──────────────────────────────────────────────┘
```

結果:

```text
┌──────────────────────────────────────────────┐
│ Rank A  82点  評判+3  SLA+2                  │
│ 6軸バー                                      │
│ 的中 / 支援 / 不足 / 罠 / 互換不可 / シナジー │
│ 解説: SQSでスパイクを吸収し...               │
│ [次へ]                                      │
└──────────────────────────────────────────────┘
```

## 6. ファイル構成

- `index.html`: v4本体のDOM
- `css/style.css`: ダーク基調UIとレスポンシブ
- `js/data.js`: axes、services、synergies、chapters、challenges
- `js/progression.js`: localStorage、メタ進行、リソース、昇進
- `js/game.js`: ラウンド生成、候補生成、採点
- `js/ui.js`: 描画、イベント、キーボード操作

## 7. 保存データ

```js
save = {
  version: 4,
  resources: { reputation: 55, budget: 70, trust: 60, sla: 60 },
  unlockedChapter: 0,
  currentChapter: 0,
  completedChapters: [],
  reviewFlags: { dynamodb: 2, waf: 1 },
  totals: { rounds: 14, clears: 2, bestRank: 'A' }
}
```

localStorage キーは `awsGameV4Save`。壊れた保存データは破棄して新規状態を作る。
