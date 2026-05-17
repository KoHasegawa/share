// Cloud Sprint Architect data

(function (global) {
  'use strict';

  function freeze(o) { return Object.freeze(o); }

  var AXES = ['func', 'avail', 'sec', 'perf', 'cost', 'ops'];
  var AXIS_LABEL = {
    func: '機能',
    avail: '可用性',
    sec: 'セキュリティ',
    perf: '性能',
    cost: 'コスト',
    ops: '運用負荷'
  };

  function service(id, name, icon, role, axes, tags, desc) {
    return freeze({
      id: id,
      name: name,
      icon: icon,
      role: role,
      axes: axes || {},
      tags: tags || [],
      desc: desc
    });
  }

  var SERVICES = freeze([
    service('route53', 'Route 53', '🌐', 'DNS', {func: 14, avail: 8, perf: 4, ops: 4}, ['dns', 'edge'], 'ドメイン名をAWSリソースへ向けるDNSサービス。'),
    service('cloudfront', 'CloudFront', '🚀', 'CDN', {perf: 18, avail: 8, cost: 5, func: 5}, ['cdn', 'edge', 'cache'], '静的コンテンツをエッジでキャッシュして高速配信する。'),
    service('waf', 'WAF', '🛡', 'Web防御', {sec: 18, avail: 5}, ['security', 'edge'], 'SQLiやDDoSなどWeb攻撃をルールで防ぐ。'),
    service('acm', 'ACM', '🔐', 'TLS証明書', {sec: 12, ops: 8, cost: 4}, ['tls', 'edge'], 'TLS証明書を発行・更新しHTTPS化を支える。'),
    service('vpc', 'VPC', '🧱', 'ネットワーク', {sec: 10, func: 6}, ['network', 'isolation'], 'AWS内に隔離された仮想ネットワークを作る。'),
    service('alb', 'ALB', '↔', 'ロードバランサ', {avail: 14, perf: 8, func: 6}, ['lb', 'network'], '複数のアプリにHTTPリクエストを分散する。'),
    service('ec2', 'EC2', '🖥', '仮想サーバ', {func: 14, perf: 8}, ['compute', 'server'], '自由度の高い仮想サーバ。運用は自分で管理する。'),
    service('autoscaling', 'Auto Scaling', '📈', '自動増減', {avail: 14, perf: 14, cost: 4}, ['scale', 'compute'], '負荷に応じてEC2台数を自動調整する。'),
    service('lambda', 'Lambda', 'λ', 'サーバレス', {func: 10, cost: 12, ops: 12, perf: 6}, ['compute', 'serverless'], 'サーバ管理なしでイベント駆動の処理を実行する。'),
    service('apigateway', 'API Gateway', '🚪', 'API入口', {func: 14, ops: 8, sec: 5}, ['api', 'serverless'], 'APIの公開、認証連携、スロットリングを担う入口。'),
    service('ecs', 'ECS Fargate', '📦', 'コンテナ', {func: 12, ops: 8, perf: 8}, ['container', 'compute'], 'サーバ管理を抑えてコンテナを実行する。'),
    service('s3', 'S3', '🪣', 'オブジェクト保存', {func: 10, avail: 10, cost: 14, ops: 10}, ['storage', 'object', 'static'], '静的サイトやオブジェクト保存に向く高耐久ストレージ。'),
    service('rds', 'RDS', '🗄', 'RDB', {func: 14, ops: 7, avail: 5}, ['database', 'rdb'], 'マネージドなリレーショナルデータベース。'),
    service('rds_multi', 'RDS Multi-AZ', '🏛', '冗長RDB', {func: 14, avail: 18, ops: 8}, ['database', 'rdb', 'multi-az'], 'AZ障害に備えた冗長構成のRDS。'),
    service('dynamodb', 'DynamoDB', '⚡', 'NoSQL', {perf: 18, avail: 14, ops: 10}, ['database', 'nosql', 'serverless'], '高スループットで自動スケールするNoSQLデータベース。'),
    service('elasticache', 'ElastiCache', '🧠', 'キャッシュ', {perf: 18, avail: 4}, ['cache', 'database'], 'DB負荷とレイテンシを下げるインメモリキャッシュ。'),
    service('sqs', 'SQS', '📬', 'キュー', {avail: 16, perf: 8, ops: 8}, ['queue', 'messaging'], '処理を非同期化し、スパイクを吸収するキュー。'),
    service('eventbridge', 'EventBridge', '🔔', 'イベント連携', {func: 10, avail: 8, ops: 10}, ['event', 'messaging'], 'AWSサービスやアプリ間をイベントで疎結合に連携する。'),
    service('iam', 'IAM', '👤', '権限管理', {sec: 18, ops: 5}, ['identity', 'security'], 'ユーザー・ロール・ポリシーで権限を制御する。'),
    service('kms', 'KMS', '🗝', '鍵管理', {sec: 16, ops: 5}, ['encryption', 'security'], '暗号化キーを管理するマネージドサービス。'),
    service('secrets', 'Secrets Manager', '🤫', '秘密情報', {sec: 16, ops: 8}, ['secret', 'security'], 'DBパスワードやAPIキーを安全に保存・ローテーションする。'),
    service('cloudwatch', 'CloudWatch', '📊', '監視', {ops: 18, avail: 6}, ['monitoring', 'observability'], 'メトリクス、ログ、アラームでサービス状態を監視する。'),
    service('cloudtrail', 'CloudTrail', '🧾', '監査ログ', {sec: 14, ops: 10}, ['audit', 'observability'], 'AWS API操作を記録し、監査証跡を残す。'),
    service('backup', 'AWS Backup', '💾', 'バックアップ', {avail: 18, ops: 6}, ['backup', 'resilience'], '複数サービスのバックアップを集中管理する。'),
    service('costexplorer', 'Cost Explorer', '💰', 'コスト分析', {cost: 18, ops: 6}, ['cost'], 'AWS利用料を可視化し、コスト削減箇所を探す。')
  ]);

  function challenge(id, title, brief, focusAxes, required, support, traps, explanation) {
    return freeze({
      id: id,
      title: title,
      brief: brief,
      focusAxes: focusAxes,
      required: required,
      support: support || [],
      traps: traps || [],
      explanation: explanation
    });
  }

  var CHALLENGES = freeze([
    challenge('static_site', '静的サイトを世界に公開', '会社サイトを低コストで公開。海外アクセスもあり、HTTPSと名前解決が必要。', ['cost', 'perf', 'ops'], ['s3', 'cloudfront', 'route53'], ['acm'], ['ec2', 'rds'], '静的サイトはS3をオリジンにし、CloudFrontとRoute 53で配信すると低コストで速い。ACMでHTTPSも整う。'),
    challenge('sale_spike', 'セール時の注文スパイク', 'ECサイトの注文処理が一気に増える。落とさず、後段処理を詰まらせたくない。', ['avail', 'perf', 'ops'], ['sqs', 'lambda', 'dynamodb'], ['cloudwatch'], ['ec2', 'rds'], 'SQSで注文をキューイングし、Lambdaで処理を分散、DynamoDBで高い書き込みを受ける。'),
    challenge('admin_audit', '社内管理画面の監査対応', '従業員だけが利用する管理画面。権限、暗号化、操作記録が監査で求められた。', ['sec', 'ops', 'func'], ['iam', 'kms', 'cloudtrail'], ['secrets'], ['cloudfront', 'elasticache'], '監査ではIAMの最小権限、KMSの暗号化、CloudTrailの操作ログが主役になる。'),
    challenge('global_media', '画像配信が海外で遅い', '画像サービスの表示が海外から遅い。アプリ本体より配信経路を改善したい。', ['perf', 'cost', 'avail'], ['s3', 'cloudfront', 'route53'], ['acm'], ['rds', 'sqs'], '画像はS3に置き、CloudFrontでエッジ配信する。Route 53で安定して名前解決する。'),
    challenge('db_resilience', 'DBを止めたくない', '24時間稼働の業務アプリ。AZ障害や誤削除に備えて復旧手段も必要。', ['avail', 'ops', 'sec'], ['rds_multi', 'backup', 'cloudwatch'], ['kms'], ['dynamodb', 'costexplorer'], 'RDS Multi-AZでAZ障害に備え、AWS Backupで復旧手段を作り、CloudWatchで異常を検知する。'),
    challenge('secret_leak', 'APIキーをコードから追放', 'DBパスワードや外部APIキーがソースに直書きされている。安全に管理したい。', ['sec', 'ops'], ['secrets', 'kms', 'iam'], ['cloudtrail'], ['s3', 'alb'], 'Secrets Managerで秘密情報を保存し、KMSで暗号化、IAMでアクセス権を絞る。'),
    challenge('unknown_failure', '原因不明の障害調査', 'たまに遅くなるが再現しない。メトリクス、ログ、操作履歴を追えるようにしたい。', ['ops', 'avail'], ['cloudwatch', 'cloudtrail', 'alb'], ['route53'], ['kms', 'costexplorer'], 'CloudWatchでメトリクスとログ、CloudTrailで操作履歴を残す。ALBのログも原因調査に役立つ。'),
    challenge('public_api', 'モバイルアプリAPIを公開', 'モバイルアプリ向けAPI。急なアクセス増に耐え、サーバ運用は減らしたい。', ['func', 'ops', 'perf'], ['apigateway', 'lambda', 'dynamodb'], ['cloudwatch'], ['ec2', 'rds'], 'API Gatewayを入口にしてLambdaで処理し、DynamoDBでスケールしやすいデータ層にする。'),
    challenge('cost_cut', '今月のAWS請求が高い', '予算を超えた。まず何に費用が出ているかを見て、低コスト構成へ寄せたい。', ['cost', 'ops'], ['costexplorer', 's3', 'lambda'], ['cloudwatch'], ['rds_multi', 'ecs'], 'Cost Explorerで支出を可視化し、S3やLambdaのような従量・低運用の選択肢を検討する。'),
    challenge('web_attack', 'Web攻撃を受けている', '公開Webサービスに不審な大量アクセスと攻撃パターンが来ている。入口で守りたい。', ['sec', 'avail'], ['waf', 'cloudfront', 'cloudwatch'], ['route53'], ['rds', 'backup'], 'WAFで攻撃をブロックし、CloudFrontの前段配信とCloudWatch監視で状態を把握する。'),
    challenge('legacy_migration', '基幹システムをAWSへ移行', '既存RDBを使う業務アプリをAWSへ移す。ネットワーク分離、LB、DBが必要。', ['func', 'avail', 'sec'], ['vpc', 'alb', 'rds_multi'], ['iam'], ['lambda', 'dynamodb'], '移行系はVPCで分離し、ALBでアプリを受け、RDS Multi-AZでRDBを安定運用する。'),
    challenge('event_workflow', 'ファイル到着で後続処理', 'S3にファイルが置かれたら複数の後続処理へ通知したい。結合をゆるくしたい。', ['func', 'ops', 'avail'], ['s3', 'eventbridge', 'lambda'], ['sqs'], ['rds', 'waf'], 'S3イベントをEventBridgeで受け、LambdaやSQSへつなぐと疎結合なイベント駆動になる。')
  ]);

  var SYNERGIES = freeze([
    {ids: ['s3', 'cloudfront'], label: 'S3 x CloudFront', axes: {perf: 10, cost: 5}},
    {ids: ['route53', 'cloudfront'], label: 'Route 53 x CloudFront', axes: {avail: 6, perf: 5}},
    {ids: ['apigateway', 'lambda'], label: 'API Gateway x Lambda', axes: {func: 8, ops: 6}},
    {ids: ['sqs', 'lambda'], label: 'SQS x Lambda', axes: {avail: 8, ops: 5}},
    {ids: ['iam', 'kms'], label: 'IAM x KMS', axes: {sec: 8}},
    {ids: ['secrets', 'kms'], label: 'Secrets Manager x KMS', axes: {sec: 8, ops: 4}},
    {ids: ['cloudwatch', 'cloudtrail'], label: 'CloudWatch x CloudTrail', axes: {ops: 8, sec: 5}},
    {ids: ['alb', 'autoscaling'], label: 'ALB x Auto Scaling', axes: {avail: 8, perf: 8}},
    {ids: ['rds_multi', 'backup'], label: 'RDS Multi-AZ x Backup', axes: {avail: 10}},
    {ids: ['eventbridge', 'lambda'], label: 'EventBridge x Lambda', axes: {func: 7, ops: 6}},
    {ids: ['waf', 'cloudfront'], label: 'WAF x CloudFront', axes: {sec: 8, avail: 4}}
  ]);

  global.SPRINT_DATA = freeze({
    axes: AXES,
    axisLabel: AXIS_LABEL,
    services: SERVICES,
    challenges: CHALLENGES,
    synergies: SYNERGIES
  });
})(typeof window !== 'undefined' ? window : globalThis);
