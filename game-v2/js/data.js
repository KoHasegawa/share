// game-v2/js/data.js - Cloud Architect Simulator data

(function (global) {
  'use strict';

  var LAYERS = [
    {id: 'edge', name: 'エッジ', desc: 'インターネット境界。DNS・CDN・WAF。'},
    {id: 'network', name: 'ネットワーク', desc: '内部ネットワーク。LB・VPC。'},
    {id: 'compute', name: '計算', desc: 'アプリ実行。サーバ・関数・スケール。'},
    {id: 'data', name: 'データ', desc: 'DB・ストレージ・キャッシュ。'},
    {id: 'security', name: 'セキュリティ', desc: '認証・鍵管理・秘密情報。'},
    {id: 'observability', name: '観測', desc: 'ログ・メトリクス・監査。'}
  ];

  // cap: 1秒あたり処理可能リクエスト数 (Infinity = 無制限)
  // latency: その層を通過するときの追加ms
  // cost: 月額$
  // features: タグセット
  var SERVICES = [
    // edge
    {id: 'route53', name: 'Route 53', layer: 'edge', cap: Infinity, latency: 0, cost: 5,
     features: ['dns'], desc: 'DNS。インターネット公開には必須。'},
    {id: 'cloudfront', name: 'CloudFront', layer: 'edge', cap: Infinity, latency: -20, cost: 30,
     features: ['cdn'], desc: 'CDN。静的コンテンツをエッジでキャッシュし応答を高速化。'},
    {id: 'waf', name: 'WAF', layer: 'edge', cap: Infinity, latency: 3, cost: 25,
     features: ['waf'], desc: 'Webアプリ防御。DDoS・SQLi等の悪意あるトラフィックを遮断。'},
    {id: 'acm', name: 'ACM', layer: 'edge', cap: Infinity, latency: 0, cost: 0,
     features: ['tls'], desc: '無料のTLS証明書。HTTPS化に必要。'},

    // network
    {id: 'vpc', name: 'VPC', layer: 'network', cap: Infinity, latency: 0, cost: 0,
     features: ['vpc'], desc: '仮想ネットワーク。EC2/RDS等を内部に隔離。'},
    {id: 'alb', name: 'ALB', layer: 'network', cap: 5000, latency: 3, cost: 25,
     features: ['lb'], desc: 'L7ロードバランサ。複数台のサーバへ振り分け。'},
    {id: 'nat', name: 'NAT Gateway', layer: 'network', cap: Infinity, latency: 1, cost: 35,
     features: ['nat'], desc: 'プライベートサブネットから外部へ出る経路。'},

    // compute
    {id: 'ec2_small', name: 'EC2 t3.small', layer: 'compute', cap: 80, latency: 60, cost: 18,
     features: ['server'], desc: '小型サーバ。RPS80程度まで。'},
    {id: 'ec2_medium', name: 'EC2 t3.medium', layer: 'compute', cap: 200, latency: 55, cost: 40,
     features: ['server'], desc: '中型サーバ。RPS200程度まで。'},
    {id: 'ec2_large', name: 'EC2 c5.large', layer: 'compute', cap: 500, latency: 45, cost: 80,
     features: ['server'], desc: '大型サーバ。RPS500程度まで。CPU重視。'},
    {id: 'autoscaling', name: 'Auto Scaling', layer: 'compute', cap: 0, latency: 0, cost: 0,
     features: ['autoscale'], desc: '負荷に応じてEC2を自動増減。計算容量x3。要ALB。'},
    {id: 'lambda', name: 'Lambda', layer: 'compute', cap: Infinity, latency: 80, cost: 15,
     features: ['serverless'], desc: 'サーバレス関数。スパイクに強い。低トラフィック時は格安。'},
    {id: 'ecs_fargate', name: 'ECS Fargate', layer: 'compute', cap: 400, latency: 50, cost: 60,
     features: ['container'], desc: 'コンテナ実行基盤。サーバ管理不要。'},

    // data
    {id: 'rds', name: 'RDS (Single)', layer: 'data', cap: 400, latency: 15, cost: 70,
     features: ['rdb'], desc: 'マネージドRDB。シングル構成。AZ障害で落ちる。'},
    {id: 'rds_multi', name: 'RDS Multi-AZ', layer: 'data', cap: 400, latency: 18, cost: 140,
     features: ['rdb', 'multi-az'], desc: 'RDS冗長構成。AZ障害でも自動フェイルオーバ。'},
    {id: 'dynamodb', name: 'DynamoDB', layer: 'data', cap: 5000, latency: 8, cost: 60,
     features: ['nosql', 'multi-az'], desc: 'NoSQL。標準で多重化。超高スループット。'},
    {id: 's3', name: 'S3', layer: 'data', cap: Infinity, latency: 25, cost: 10,
     features: ['object', 'multi-az'], desc: 'オブジェクトストレージ。静的配信に最適。耐久性99.999999999%。'},
    {id: 'elasticache', name: 'ElastiCache', layer: 'data', cap: 20000, latency: 1, cost: 50,
     features: ['cache'], desc: 'インメモリキャッシュ。DBの負荷を70%削減。'},
    {id: 'backup', name: 'AWS Backup', layer: 'data', cap: Infinity, latency: 0, cost: 15,
     features: ['backup'], desc: '日次バックアップ。データ損失イベントから復旧可能。'},

    // security
    {id: 'iam', name: 'IAM', layer: 'security', cap: Infinity, latency: 0, cost: 0,
     features: ['iam'], desc: 'アクセス制御。本番運用では必須。'},
    {id: 'kms', name: 'KMS', layer: 'security', cap: Infinity, latency: 0, cost: 5,
     features: ['encryption'], desc: 'マネージド鍵管理。データ暗号化の基盤。'},
    {id: 'secrets', name: 'Secrets Manager', layer: 'security', cap: Infinity, latency: 0, cost: 5,
     features: ['secret'], desc: 'DBパスワード等の安全な保管・自動ローテーション。'},

    // observability
    {id: 'cloudwatch', name: 'CloudWatch', layer: 'observability', cap: Infinity, latency: 0, cost: 12,
     features: ['monitoring'], desc: 'メトリクス・ログ。障害検知の基盤。'},
    {id: 'cloudtrail', name: 'CloudTrail', layer: 'observability', cap: Infinity, latency: 0, cost: 8,
     features: ['audit'], desc: 'API監査ログ。コンプライアンス要件に対応。'}
  ];

  // baselineRPS: 想定平均RPS
  // peakRPS:    ピーク時のRPS
  // staticRatio: 静的コンテンツ比率 (CDNでキャッシュ可能な割合)
  // budget:    月額予算 ($)
  // targetSLA: 目標稼働率 (%)
  // targetLatency: 目標応答時間 (ms)
  // required:  必須feature。1つでも欠けると失格
  // events:    30日間に発生するイベント [{day, type}]
  var CASES = [
    {
      id: 'corp_site',
      title: 'コーポレートサイト公開',
      brief: '会社の顔となる純粋に静的なサイト。アクセスは少ないが落ちると恥ずかしい。コスト最小化重視。',
      baselineRPS: 30, peakRPS: 80, staticRatio: 1.0,
      budget: 80, targetSLA: 99.5, targetLatency: 300,
      required: ['dns'],
      events: [{day: 12, type: 'spike'}],
      hints: ['100%静的 → S3+CloudFrontでサーバ不要', 'Route53でDNS、ACMでHTTPS化']
    },
    {
      id: 'ec_site',
      title: 'ECサイト',
      brief: '通常RPS300、セール時2000まで急増。決済を扱うのでセキュリティ・可用性が重要。',
      baselineRPS: 300, peakRPS: 2000, staticRatio: 0.3,
      budget: 600, targetSLA: 99.9, targetLatency: 250,
      required: ['dns', 'lb', 'iam', 'encryption'],
      events: [
        {day: 7, type: 'spike'},
        {day: 15, type: 'ddos'},
        {day: 22, type: 'az_down'}
      ],
      hints: ['スパイク対策 → Auto Scaling or Lambda', 'DDoS対策 → WAF', 'AZ障害 → Multi-AZのDB']
    },
    {
      id: 'api_backend',
      title: 'モバイルアプリAPI',
      brief: 'モバイルアプリ向けAPI。突発的なバズで10倍トラフィックが来ることがある。',
      baselineRPS: 100, peakRPS: 1500, staticRatio: 0.1,
      budget: 350, targetSLA: 99.5, targetLatency: 200,
      required: ['dns', 'monitoring'],
      events: [
        {day: 5, type: 'spike'},
        {day: 18, type: 'spike'}
      ],
      hints: ['予測不能なスパイク → サーバレスが向く', 'DB読み取りが多い → キャッシュで負荷軽減']
    },
    {
      id: 'core_system',
      title: '基幹システム移行',
      brief: 'オンプレからAWSへ移行。RPS自体は中程度だが、止まると会社が止まる。監査要件あり。',
      baselineRPS: 200, peakRPS: 400, staticRatio: 0.05,
      budget: 700, targetSLA: 99.9, targetLatency: 300,
      required: ['dns', 'lb', 'rdb', 'multi-az', 'iam', 'encryption', 'audit', 'backup'],
      events: [
        {day: 10, type: 'az_down'},
        {day: 20, type: 'data_loss'},
        {day: 25, type: 'ddos'}
      ],
      hints: ['高SLA → Multi-AZ DB + Auto Scaling', 'データ損失 → Backup必須', '監査 → CloudTrail必須']
    }
  ];

  global.SIM_DATA = {
    LAYERS: LAYERS,
    SERVICES: SERVICES,
    CASES: CASES,
    SIM_DAYS: 30
  };
})(typeof window !== 'undefined' ? window : globalThis);
