// game/js/data.js - Cloud Deck Architect static data

(function (global) {
  'use strict';

  function freeze(o) { return Object.freeze(o); }

  function card(id, name, type, effects, penalties, meta) {
    meta = meta || {};
    return freeze({
      id: id,
      name: name,
      type: type,
      desc: meta.desc || '',
      tags: meta.tags || [],
      effects: effects || {},
      penalties: penalties || {}
    });
  }

  var conceptCards = [
    card('CPU', 'CPU', 'concept', {perf: 10}, {}, {tags: ['compute']}),
    card('メモリ', 'メモリ', 'concept', {perf: 8}, {}, {tags: ['compute']}),
    card('ストレージ', 'ストレージ', 'concept', {func: 7, avail: 4}, {}, {tags: ['storage']}),
    card('HTTP', 'HTTP', 'concept', {func: 8}, {}, {tags: ['web']}),
    card('DNS', 'DNS', 'concept', {func: 6, perf: 4}, {}, {tags: ['network', 'dns']}),
    card('DB', 'DB', 'concept', {func: 10}, {}, {tags: ['database']}),
    card('認証', '認証', 'concept', {sec: 10}, {}, {tags: ['identity']}),
    card('TLS', 'TLS', 'concept', {sec: 9}, {}, {tags: ['security', 'encryption']}),
    card('ログ', 'ログ', 'concept', {ops: 10}, {}, {tags: ['observability']}),
    card('バックアップ', 'バックアップ', 'concept', {avail: 10}, {}, {tags: ['backup']}),
    card('キャッシュ', 'キャッシュ', 'concept', {perf: 10}, {}, {tags: ['cache']}),
    card('キュー', 'キュー', 'concept', {avail: 7, perf: 7}, {}, {tags: ['queue']}),
    card('スケール', 'スケール', 'concept', {avail: 8, perf: 8}, {}, {tags: ['scale']}),
    card('暗号化', '暗号化', 'concept', {sec: 10}, {}, {tags: ['security', 'encryption']}),
    card('認可', '認可', 'concept', {sec: 10}, {}, {tags: ['identity']})
  ];

  var awsCards = [
    card('EC2', 'EC2', 'aws', {func: 14}, {avail: -4, cost: -6, ops: -5}, {tags: ['compute', 'server']}),
    card('S3', 'S3', 'aws', {func: 9, cost: 10, ops: 8, avail: 4}, {}, {tags: ['storage', 'managed']}),
    card('RDS', 'RDS', 'aws', {func: 13, avail: 4, ops: 4}, {cost: -6}, {tags: ['database', 'managed']}),
    card('Lambda', 'Lambda', 'aws', {func: 10, cost: 10, perf: 7, ops: 7}, {}, {tags: ['compute', 'serverless', 'managed']}),
    card('VPC', 'VPC', 'aws', {sec: 10, func: 3}, {}, {tags: ['network', 'security']}),
    card('IAM', 'IAM', 'aws', {sec: 15, ops: 2}, {}, {tags: ['identity', 'security']}),
    card('CloudFront', 'CloudFront', 'aws', {perf: 15, func: 7, avail: 4}, {}, {tags: ['cdn', 'cache', 'managed']}),
    card('SQS', 'SQS', 'aws', {avail: 10, perf: 8, ops: 4}, {}, {tags: ['queue', 'managed']}),
    card('SNS', 'SNS', 'aws', {func: 7, avail: 8, ops: 4}, {}, {tags: ['messaging', 'managed']}),
    card('DynamoDB', 'DynamoDB', 'aws', {perf: 15, avail: 10, ops: 7}, {cost: -2}, {tags: ['database', 'serverless', 'managed']}),
    card('ALB', 'ALB', 'aws', {avail: 10, perf: 8, func: 4}, {cost: -2}, {tags: ['network', 'scale']}),
    card('AutoScaling', 'Auto Scaling', 'aws', {avail: 10, perf: 10, cost: 3}, {}, {tags: ['scale']}),
    card('Route53', 'Route 53', 'aws', {func: 10, avail: 8, perf: 3}, {}, {tags: ['dns', 'network', 'managed']}),
    card('CloudWatch', 'CloudWatch', 'aws', {ops: 15, avail: 3}, {}, {tags: ['observability', 'managed']}),
    card('CloudTrail', 'CloudTrail', 'aws', {sec: 15, ops: 5}, {}, {tags: ['audit', 'security', 'managed']}),
    card('KMS', 'KMS', 'aws', {sec: 13, ops: 3}, {cost: -1}, {tags: ['encryption', 'security', 'managed']}),
    card('SecretsManager', 'Secrets Manager', 'aws', {sec: 13, ops: 6}, {cost: -2}, {tags: ['secret', 'security', 'managed']}),
    card('WAF', 'WAF', 'aws', {sec: 15, avail: 3}, {cost: -5}, {tags: ['security', 'edge']}),
    card('CostExplorer', 'Cost Explorer', 'aws', {cost: 15, ops: 3}, {}, {tags: ['cost', 'managed']}),
    card('EBS', 'EBS', 'aws', {func: 8, perf: 8}, {ops: -2}, {tags: ['storage']}),
    card('APIGateway', 'API Gateway', 'aws', {func: 10, ops: 8, sec: 3}, {}, {tags: ['web', 'serverless', 'managed']}),
    card('EventBridge', 'EventBridge', 'aws', {avail: 9, ops: 8, func: 5}, {}, {tags: ['messaging', 'event', 'managed']}),
    card('Backup', 'Backup', 'aws', {avail: 15, ops: 4}, {cost: -2}, {tags: ['backup', 'managed']}),
    card('ACM', 'ACM', 'aws', {sec: 10, ops: 8}, {}, {tags: ['tls', 'encryption', 'managed']}),
    card('Subnet', 'Subnet', 'aws', {sec: 8, avail: 3}, {}, {tags: ['network', 'security']})
  ];

  var principleCards = [
    card('最小権限', '最小権限', 'principle', {sec: 16, ops: 3}, {}, {tags: ['identity', 'security']}),
    card('疎結合', '疎結合', 'principle', {avail: 12, perf: 9, ops: 4}, {}, {tags: ['queue', 'architecture']}),
    card('冗長化', '冗長化', 'principle', {avail: 16}, {cost: -3}, {tags: ['resilience']}),
    card('マネージド化', 'マネージド化', 'principle', {ops: 16, avail: 4}, {cost: -2}, {tags: ['managed']}),
    card('水平スケール', '水平スケール', 'principle', {perf: 16, avail: 10}, {cost: -3}, {tags: ['scale']})
  ];

  var trapCards = [
    card('EC2で全部やる', 'EC2で全部やる', 'trap', {func: 16}, {avail: -16, cost: -16, ops: -12}, {tags: ['server']}),
    card('公開S3', '公開S3', 'trap', {func: 9, ops: 3}, {sec: -24}, {tags: ['storage']}),
    card('長期アクセスキー', '長期アクセスキー', 'trap', {func: 7}, {sec: -20, ops: -4}, {tags: ['identity']}),
    card('ログなし運用', 'ログなし運用', 'trap', {cost: 7}, {ops: -24, sec: -4}, {tags: ['observability']}),
    card('バックアップ後回し', 'バックアップ後回し', 'trap', {func: 6, cost: 4}, {avail: -24}, {tags: ['backup']})
  ];

  var cases = freeze([
    {id: 1, title: '静的サイト公開', theme: 'S3、CloudFront、Route 53', weights: {func: 1, avail: 1, sec: 1, perf: 2, cost: 3, ops: 1}, sp: 3, required: ['S3', 'CloudFront', 'Route53'], desc: 'コーポレートサイトを低コストで全世界に公開したい。'},
    {id: 2, title: '小規模Webアプリ', theme: 'EC2、ALB、RDS', weights: {func: 3, avail: 2, sec: 2, perf: 1, cost: 1, ops: 1}, sp: 3, required: ['EC2', 'ALB', 'RDS'], desc: '社内向けWebアプリ。ユーザー数100人程度でDBが必要。'},
    {id: 3, title: '注文処理の混雑', theme: 'SQS、Lambda、DynamoDB', weights: {func: 2, avail: 3, sec: 1, perf: 3, cost: 1, ops: 1}, sp: 4, required: ['SQS', 'Lambda', 'DynamoDB'], desc: 'ECサイトのセール時に注文が集中する。処理遅延を防ぎたい。'},
    {id: 4, title: '画像配信の高速化', theme: 'S3、CloudFront、キャッシュ', weights: {func: 1, avail: 1, sec: 1, perf: 4, cost: 2, ops: 1}, sp: 3, required: ['S3', 'CloudFront', 'キャッシュ'], desc: '画像サービスが遅い。海外ユーザーからの不満が多い。'},
    {id: 5, title: '社内管理画面', theme: 'IAM、認証、監査', weights: {func: 2, avail: 1, sec: 4, perf: 1, cost: 1, ops: 1}, sp: 4, required: ['IAM', '認証', 'CloudTrail'], desc: '従業員のみアクセス可。外部公開厳禁。監査ログが必要。'},
    {id: 6, title: 'DBを止めたくない', theme: 'RDS Multi-AZ、バックアップ', weights: {func: 2, avail: 4, sec: 1, perf: 1, cost: 1, ops: 1}, sp: 4, required: ['RDS', 'Backup', '冗長化'], desc: '24時間稼働のサービス。DBが落ちると大問題。復旧手段も必要。'},
    {id: 7, title: '原因不明の障害調査', theme: 'CloudWatch、CloudTrail', weights: {func: 1, avail: 2, sec: 1, perf: 1, cost: 1, ops: 4}, sp: 3, required: ['CloudWatch', 'CloudTrail', 'ログ'], desc: 'サービスが時々遅くなるが原因不明。監視と分析の仕組みが必要。'},
    {id: 8, title: 'コスト削減依頼', theme: 'Cost Explorer、S3ライフサイクル', weights: {func: 1, avail: 1, sec: 1, perf: 1, cost: 4, ops: 2}, sp: 3, required: ['CostExplorer', 'S3'], desc: 'クラウドコストが予想以上に高い。削減できる箇所を分析したい。'},
    {id: 9, title: '秘密情報の安全管理', theme: 'Secrets Manager、KMS、IAM', weights: {func: 1, avail: 1, sec: 4, perf: 1, cost: 1, ops: 2}, sp: 4, required: ['SecretsManager', 'KMS', 'IAM'], desc: 'DB接続情報やAPIキーをコードに記述。セキュリティ監査で指摘。'},
    {id: 10, title: '海外ユーザー対応', theme: 'CloudFront、Route 53', weights: {func: 1, avail: 2, sec: 1, perf: 4, cost: 1, ops: 1}, sp: 3, required: ['CloudFront', 'Route53', 'DNS'], desc: '海外からのアクセスが増加。レイテンシ問題でグローバル対応が必要。'},
    {id: 11, title: 'スタートアップWebサービス', theme: 'Lambda、API Gateway、DynamoDB', weights: {func: 2, avail: 2, sec: 1, perf: 1, cost: 3, ops: 1}, sp: 3, required: ['Lambda', 'APIGateway', 'DynamoDB'], desc: '初期費用を最小にしながらスケール可能なWebサービスを構築したい。'},
    {id: 12, title: '基幹システム移行', theme: 'EC2、RDS、VPC', weights: {func: 3, avail: 3, sec: 2, perf: 1, cost: 1, ops: 1}, sp: 4, required: ['EC2', 'RDS', 'VPC'], desc: 'オンプレミスの基幹システムをAWSへ移行する。安定性が最優先。'},
    {id: 13, title: 'ログ分析システム', theme: 'CloudWatch、S3', weights: {func: 1, avail: 1, sec: 1, perf: 1, cost: 2, ops: 4}, sp: 3, required: ['CloudWatch', 'S3', 'ログ'], desc: '大量アクセスログを分析してユーザー行動を把握したい。'},
    {id: 14, title: '自動スケールアプリ', theme: 'Auto Scaling、ALB', weights: {func: 1, avail: 3, sec: 1, perf: 3, cost: 1, ops: 1}, sp: 4, required: ['AutoScaling', 'ALB', '水平スケール'], desc: 'アクセス数が読めないアプリ。急増時も安定して動かしたい。'},
    {id: 15, title: 'セキュリティ強化', theme: 'WAF、CloudTrail、KMS', weights: {func: 1, avail: 1, sec: 5, perf: 1, cost: 1, ops: 1}, sp: 5, required: ['WAF', 'CloudTrail', 'KMS'], desc: '外部の脆弱性診断で問題が発覚。全面的なセキュリティ対策が必要。'}
  ]);

  var constraints = freeze([
    {id: 'budget', name: '予算制限', desc: 'コスト評価 x0.7', axis: 'cost', multiplier: 0.7},
    {id: 'security_audit', name: 'セキュリティ監査中', desc: 'セキュリティ不足で追加ペナルティ', axis: 'sec', min: 55, penalty: 15},
    {id: 'small_team', name: '少人数チーム', desc: '運用負荷不足で追加ペナルティ', axis: 'ops', min: 50, penalty: 12},
    {id: 'short_deadline', name: '短納期', desc: '罠・手動運用カードがあると運用負荷低下', type: 'simple'},
    {id: 'global', name: 'グローバル要件', desc: '性能評価 x0.8', axis: 'perf', multiplier: 0.8},
    {id: 'legacy', name: 'レガシー連携', desc: '機能評価 x0.85', axis: 'func', multiplier: 0.85},
    {id: 'compliance', name: 'コンプライアンス要件', desc: '監査・暗号化不足でセキュリティ低下', type: 'compliance'},
    {id: 'night_batch', name: '深夜バッチ処理', desc: '可用性評価 x0.85', axis: 'avail', multiplier: 0.85},
    {id: 'peak', name: 'ピークトラフィック', desc: '性能評価 x0.75', axis: 'perf', multiplier: 0.75},
    {id: 'multi_region', name: 'マルチリージョン', desc: 'コストペナルティ増加。Route 53/冗長化で緩和', type: 'multi_region'}
  ]);

  var incidents = freeze([
    {id: 'service_down', name: 'サービス障害', desc: '可用性カードの効果50%減', type: 'halve_axis_effect', axis: 'avail'},
    {id: 'breach', name: 'セキュリティ侵害', desc: 'セキュリティ評価-20', axis: 'sec', penalty: 20},
    {id: 'cost_alert', name: 'コスト超過アラート', desc: 'コスト評価-15', axis: 'cost', penalty: 15},
    {id: 'traffic_spike', name: 'アクセス急増', desc: '性能評価-20', axis: 'perf', penalty: 20},
    {id: 'db_down', name: 'DB障害', desc: 'DB系カードの効果50%減', type: 'halve_tag_effect', tag: 'database'},
    {id: 'permission_error', name: '権限ミス', desc: 'セキュリティ評価-20', axis: 'sec', penalty: 20},
    {id: 'unknown_error', name: '原因不明エラー', desc: '運用負荷評価-20', axis: 'ops', penalty: 20},
    {id: 'data_loss', name: 'データ損失', desc: 'バックアップ系がなければ可用性-25', type: 'requires_tag', tag: 'backup', axis: 'avail', penalty: 25},
    {id: 'ddos', name: 'DDoS攻撃', desc: 'WAF未使用ならセキュリティ-30', type: 'requires_card', card: 'WAF', axis: 'sec', penalty: 30},
    {id: 'region_down', name: 'リージョン障害', desc: '冗長化・Route 53がなければ可用性-20', type: 'requires_any', cards: ['冗長化', 'Route53'], axis: 'avail', penalty: 20}
  ]);

  var relics = freeze([
    {id: 'iam_seal', name: '最小権限の印章', desc: 'IAM系カードのセキュリティ効果+30%'},
    {id: 'wa_lens', name: 'Well-Architected Lens', desc: '各案件の弱点評価が見える'},
    {id: 'incident_book', name: '障害対応手順書', desc: '障害カードの初回ダメージを軽減'},
    {id: 'cost_bell', name: 'コスト警報ベル', desc: 'コスト評価+10ボーナス'},
    {id: 'cache_glass', name: 'キャッシュの砂時計', desc: '性能評価+5ボーナス'},
    {id: 'audit_pen', name: '監査ログの羽ペン', desc: 'セキュリティ評価+10ボーナス'},
    {id: 'managed_faith', name: 'マネージド信仰', desc: 'マネージドサービスの運用負荷効果+30%'},
    {id: 'loose_chain', name: '疎結合の鎖', desc: 'SQS・SNS・EventBridgeのコンボ強化'},
    {id: 'startup_soul', name: 'スタートアップの魂', desc: 'コスト重視案件で+15ボーナス'},
    {id: 'ops_notebook', name: '運用職人の手帳', desc: '運用負荷評価+10ボーナス'},
    {id: 'arch_glasses', name: 'アーキテクトの眼鏡', desc: '手札を1枚追加でドロー'},
    {id: 'cloud_wisdom', name: 'クラウドの知恵', desc: '知識タグの効果+50%'}
  ]);

  var ascensions = freeze([
    {level: 0, name: 'A0 - 通常', desc: '基本構成を覚える。'},
    {level: 1, name: 'A1 - コスト評価が厳しくなる', desc: '過剰構成を避ける判断が必要。'},
    {level: 2, name: 'A2 - セキュリティ事故が増える', desc: 'IAM・暗号化・監査の重要性が増す。'},
    {level: 3, name: 'A3 - 障害イベントが増える', desc: '可用性・バックアップ・監視が重要。'},
    {level: 4, name: 'A4 - 市場価格が上がる', desc: 'SPの使い道を計画する必要がある。'},
    {level: 5, name: 'A5 - 案件条件が曖昧になる', desc: '問題文から条件を読み取る力が問われる。'}
  ]);

  var market = freeze([
    {id: 'buy_card', name: 'サービスカード購入', cost: 5, desc: '新しいAWSサービスをデッキに追加'},
    {id: 'buy_lecture', name: '基礎講座購入', cost: 3, desc: '知識タグを獲得'},
    {id: 'delete_card', name: 'カード削除', cost: 2, desc: '不要カード・罠カードを削除'},
    {id: 'upgrade', name: 'カード強化', cost: 4, desc: 'サービスカードに追加効果を付ける'},
    {id: 'scout', name: 'アーキテクチャ診断', cost: 3, desc: '次の案件の傾向を少し見られる'},
    {id: 'mock_exam', name: '模擬試験パック', cost: 2, desc: 'ボス前に試験形式カードを獲得'},
    {id: 'cost_review', name: 'コストレビュー', cost: 2, desc: 'コスト評価を次回1回改善'},
    {id: 'wa_review', name: 'Well-Architectedレビュー', cost: 0, desc: '6評価軸の弱点を診断'}
  ]);

  global.GAME_DATA = freeze({
    axes: ['func', 'avail', 'sec', 'perf', 'cost', 'ops'],
    axisLabel: {func: '機能', avail: '可用性', sec: 'セキュリティ', perf: '性能', cost: 'コスト', ops: '運用負荷'},
    cards: freeze(conceptCards.concat(awsCards, principleCards, trapCards)),
    cases: cases,
    constraints: constraints,
    incidents: incidents,
    relics: relics,
    ascensions: ascensions,
    market: market,
    initialDeck: freeze(['CPU', 'メモリ', 'ストレージ', 'HTTP', 'DNS', 'DB', '認証', 'TLS', 'ログ', 'バックアップ'])
  });
})(typeof window !== 'undefined' ? window : globalThis);
