# AWS学習ゲーム v3 ゲームデザイン書

## 1. ゲームモード / ステージ構成

タイトル: **Cloud Sprint Architect**

モード:

- スプリント: 8ラウンド。標準モード。1問14秒。
- クイック: 5ラウンド。短時間確認用。1問12秒。

ステージ構成:

1. 案件カード表示
2. 8個のAWSサービス候補を表示
3. 最大3個を選択
4. 提出または時間切れ
5. 即採点と短い解説
6. 次ラウンドへ
7. 最終結果と復習テーマ表示

## 2. AWSサービス数とリスト

使用サービスは25種類。v1/v2の語彙を中心に、初心者が用途を区別しやすい範囲に絞る。

- Route 53
- CloudFront
- WAF
- ACM
- VPC
- ALB
- EC2
- Auto Scaling
- Lambda
- API Gateway
- ECS Fargate
- S3
- RDS
- RDS Multi-AZ
- DynamoDB
- ElastiCache
- SQS
- EventBridge
- IAM
- KMS
- Secrets Manager
- CloudWatch
- CloudTrail
- AWS Backup
- Cost Explorer

出題ごとに8件だけ候補として出す。

## 3. スコアリングルール / 勝敗条件

ラウンドスコア:

- 正解サービス1個につき +24点
- サポートサービス1個につき +12点
- 正解サービスを全て含むと +12点
- シナジー成立ごとに +8点
- 罠または要件に合わないサービスは -10〜-18点
- 時間ボーナスは残り秒数 x 2点
- 最終的に0〜100点へ丸める

ランク:

- S: 90点以上
- A: 75点以上
- B: 60点以上
- C: 40点以上
- D: 39点以下

勝敗条件:

- 8ラウンド終了でラン完了
- 平均75点以上でクリア
- 平均90点以上でSクリア
- クリア失敗でも、復習テーマと再挑戦導線を表示する

## 4. UIワイヤーフレーム

```text
┌──────────────────────────────────────────────┐
│ ☁ Cloud Sprint Architect       Score / Streak │
├──────────────────────────────────────────────┤
│ Round 3/8   残り 10.4s                         │
│ [案件タイトル]                                │
│ 要件本文                                      │
│ 重要軸: セキュリティ / 運用負荷 / 可用性       │
├──────────────────────────────────────────────┤
│ 候補サービス                                  │
│ [S3] [CloudFront] [RDS] [IAM]                 │
│ [WAF] [Lambda] [CloudTrail] [Cost Explorer]   │
├──────────────────────────────────────────────┤
│ 選択中: 2/3              [提出] [リセット]     │
└──────────────────────────────────────────────┘

提出後:

┌──────────────────────────────────────────────┐
│ Rank A  82点                                  │
│ 6軸バー                                      │
│ 正解: IAM / KMS / CloudTrail                  │
│ 不足: Secrets Manager                         │
│ 解説: 監査・暗号化・権限管理が主題。           │
│ [次へ] [リトライ]                             │
└──────────────────────────────────────────────┘
```

## 5. データ構造の概要

```js
service = {
  id: 'cloudfront',
  name: 'CloudFront',
  icon: '🌐',
  role: 'CDN',
  axes: { perf: 18, avail: 8, cost: 5 },
  tags: ['cdn', 'edge', 'cache'],
  desc: '静的コンテンツをエッジにキャッシュして高速配信する。'
}

challenge = {
  id: 'static_site',
  title: '静的サイトを世界に公開',
  brief: '低コストで会社サイトを公開。海外アクセスもある。',
  focusAxes: ['cost', 'perf', 'ops'],
  required: ['s3', 'cloudfront', 'route53'],
  support: ['acm'],
  traps: ['ec2', 'rds'],
  explanation: '静的サイトはS3をオリジンにし、CloudFrontとRoute 53で配信する。'
}

state = {
  mode: 'sprint',
  roundIndex: 0,
  score: 0,
  streak: 0,
  selected: [],
  roundResult: null,
  history: [],
  timeLeft: 14
}
```
