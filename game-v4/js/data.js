// Cloud Career Architect data

(function (global) {
  'use strict';

  function freeze(o) { return Object.freeze(o); }

  var AXES = freeze(['func', 'avail', 'sec', 'perf', 'cost', 'ops']);
  var AXIS_LABEL = freeze({
    func: '機能',
    avail: '可用性',
    sec: 'セキュリティ',
    perf: '性能',
    cost: 'コスト',
    ops: '運用負荷'
  });

  var TYPE_LABEL = freeze({
    design: '新規設計',
    incident: '障害対応',
    cost_cut: 'コスト改善',
    harden: '防御強化',
    migrate: '移行設計'
  });

  var TYPE_HINT = freeze({
    design: '要件から構成の主役を選ぶ',
    incident: 'いま足すべき復旧・観測・緩衝材を選ぶ',
    cost_cut: '過剰構成を避け、安価な代替を選ぶ',
    harden: '監査・暗号化・検知・統制を強める',
    migrate: 'オンプレの役割をAWSサービスへ読み替える'
  });

  var TYPE_WEIGHTS = freeze({
    design: {func: 1.25, avail: 1.1, sec: 1, perf: 1.1, cost: 0.95, ops: 1},
    incident: {func: 1, avail: 1.35, sec: 0.95, perf: 1.1, cost: 0.85, ops: 1.25},
    cost_cut: {func: 0.95, avail: 0.9, sec: 0.9, perf: 0.9, cost: 1.45, ops: 1.25},
    harden: {func: 0.95, avail: 1, sec: 1.45, perf: 0.85, cost: 0.9, ops: 1.2},
    migrate: {func: 1.25, avail: 1.2, sec: 1.15, perf: 0.95, cost: 0.9, ops: 1.05}
  });

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
    service('route53', 'Route 53', '🌐', 'DNS', {func: 13, avail: 9, perf: 4, ops: 4}, ['dns', 'edge'], 'ドメイン名をAWSリソースへ向けるDNSサービス。'),
    service('cloudfront', 'CloudFront', '🚀', 'CDN', {func: 7, avail: 9, perf: 18, cost: 7, ops: 4}, ['cdn', 'edge', 'cache'], '静的コンテンツやAPIをエッジで高速配信する。'),
    service('waf', 'WAF', '🛡', 'Web防御', {sec: 18, avail: 5, ops: 3}, ['security', 'edge', 'web'], 'SQLiやBotなどのWeb攻撃をルールで防ぐ。'),
    service('vpc', 'VPC', '🧱', '仮想ネットワーク', {func: 9, sec: 12, ops: 3}, ['network', 'isolation'], 'AWS内に隔離されたネットワーク境界を作る。'),
    service('alb', 'ALB', '↔', 'ロードバランサ', {func: 8, avail: 15, perf: 8, ops: 3}, ['lb', 'web'], 'HTTP/HTTPSリクエストを複数ターゲットへ分散する。'),
    service('natgateway', 'NAT Gateway', '🚪', 'アウトバウンド', {func: 7, sec: 7, avail: 6, ops: 5}, ['network', 'private'], 'プライベートサブネットから外部へ安全に出る経路。'),
    service('directconnect', 'Direct Connect', '🔌', '専用線', {func: 12, perf: 12, sec: 7, cost: -4}, ['network', 'hybrid'], 'オンプレとAWSを専用線で安定接続する。'),
    service('transitgateway', 'Transit Gateway', '🚉', '集約ルーティング', {func: 12, ops: 10, sec: 5}, ['network', 'hybrid'], '複数VPCやオンプレ接続を集約するハブ。'),
    service('globalaccelerator', 'Global Accelerator', '🧭', 'グローバル経路', {avail: 13, perf: 15, ops: 5}, ['edge', 'network'], 'AWSグローバルネットワークで動的アプリへの経路を最適化する。'),
    service('shield', 'Shield', '🛡️', 'DDoS防御', {sec: 15, avail: 10, ops: 4}, ['security', 'ddos'], 'DDoS攻撃から公開サービスを守る。'),
    service('ec2', 'EC2', '🖥', '仮想サーバ', {func: 15, perf: 8, ops: -4}, ['compute', 'server'], '自由度の高い仮想サーバ。OS運用は自分で担う。'),
    service('lambda', 'Lambda', 'λ', 'サーバレス', {func: 10, perf: 6, cost: 13, ops: 13}, ['compute', 'serverless', 'event'], 'イベント駆動の処理をサーバ管理なしで実行する。'),
    service('apigateway', 'API Gateway', '🚪', 'API入口', {func: 15, sec: 5, ops: 8, cost: 4}, ['api', 'serverless'], 'API公開、認証連携、スロットリングを担う。'),
    service('ecs', 'ECS Fargate', '📦', 'コンテナ', {func: 13, perf: 8, ops: 8}, ['container', 'compute'], 'サーバ管理を抑えてコンテナを動かす。'),
    service('eks', 'EKS', '☸', 'Kubernetes', {func: 14, perf: 8, ops: -5}, ['container', 'kubernetes'], 'KubernetesワークロードをAWSで運用する。'),
    service('stepfunctions', 'Step Functions', '🧩', 'ワークフロー', {func: 13, avail: 6, ops: 12}, ['workflow', 'serverless'], '複数処理の順序、分岐、リトライを管理する。'),
    service('sns', 'SNS', '📣', 'Pub/Sub通知', {func: 10, avail: 9, ops: 8}, ['messaging', 'pubsub'], '複数購読者へイベントや通知を配信する。'),
    service('sqs', 'SQS', '📬', 'キュー', {func: 9, avail: 17, perf: 8, ops: 9}, ['messaging', 'queue'], '非同期化し、スパイクや一時障害を吸収する。'),
    service('eventbridge', 'EventBridge', '🔔', 'イベントバス', {func: 12, avail: 8, ops: 10}, ['event', 'messaging'], 'サービス間をイベントで疎結合に連携する。'),
    service('appsync', 'AppSync', '🔗', 'GraphQL API', {func: 13, perf: 7, ops: 8}, ['api', 'graphql'], 'GraphQL APIとリアルタイム同期をマネージドで提供する。'),
    service('kinesis', 'Kinesis Data Streams', '🌊', 'ストリーム', {func: 14, avail: 10, perf: 14, ops: 4}, ['stream', 'analytics'], '大量の時系列イベントを継続的に取り込む。'),
    service('s3', 'S3', '🪣', 'オブジェクト保存', {func: 11, avail: 11, cost: 15, ops: 10}, ['storage', 'object', 'static'], '静的サイトやオブジェクト保存に向く高耐久ストレージ。'),
    service('efs', 'EFS', '📁', '共有ファイル', {func: 11, avail: 8, ops: 7, cost: 2}, ['storage', 'file', 'linux'], '複数Linuxサーバから共有できるNFSファイルストレージ。'),
    service('fsx', 'FSx', '🗂', '高機能ファイル', {func: 12, perf: 10, ops: 6, cost: -2}, ['storage', 'file', 'windows'], 'Windowsや高性能ファイルワークロード向けストレージ。'),
    service('rds', 'RDS', '🗄', 'RDB', {func: 15, ops: 7, avail: 5}, ['database', 'rdb'], 'マネージドなリレーショナルデータベース。'),
    service('aurora', 'Aurora', '🌌', '高性能RDB', {func: 15, avail: 14, perf: 13, ops: 8, cost: -3}, ['database', 'rdb'], '高性能・高可用なAWS向けリレーショナルDB。'),
    service('rds_multi', 'RDS Multi-AZ', '🏛', '冗長RDB', {func: 13, avail: 18, ops: 8, cost: -4}, ['database', 'rdb', 'multi-az'], 'RDSをAZ障害に備えた冗長構成にする。'),
    service('dynamodb', 'DynamoDB', '⚡', 'NoSQL', {func: 13, avail: 14, perf: 18, ops: 11}, ['database', 'nosql', 'serverless'], '高スループットで自動スケールするNoSQLデータベース。'),
    service('elasticache', 'ElastiCache', '🧠', 'キャッシュ', {perf: 18, avail: 4, ops: 3}, ['cache', 'database'], 'DB負荷とレイテンシを下げるインメモリキャッシュ。'),
    service('redshift', 'Redshift', '📊', 'DWH', {func: 15, perf: 12, ops: 5, cost: -2}, ['analytics', 'warehouse'], '大規模な構造化データ分析向けデータウェアハウス。'),
    service('opensearch', 'OpenSearch', '🔎', '検索/ログ分析', {func: 14, perf: 10, ops: 4}, ['search', 'analytics'], '検索、ログ分析、可視化基盤に使う。'),
    service('athena', 'Athena', '🧮', 'S3クエリ', {func: 11, cost: 12, ops: 11}, ['analytics', 'serverless'], 'S3上のデータをサーバレスにSQL分析する。'),
    service('glue', 'Glue', '🧬', 'ETL/カタログ', {func: 13, ops: 8, cost: 5}, ['analytics', 'etl'], 'データカタログとETLジョブを管理する。'),
    service('iam', 'IAM', '👤', '権限管理', {sec: 18, ops: 6}, ['identity', 'security'], 'ユーザー、ロール、ポリシーで権限を制御する。'),
    service('kms', 'KMS', '🗝', '鍵管理', {sec: 17, ops: 6}, ['encryption', 'security'], '暗号化キーをマネージドに作成・管理する。'),
    service('secrets', 'Secrets Manager', '🤫', '秘密情報', {sec: 17, ops: 9}, ['secret', 'security'], 'DBパスワードやAPIキーを保存・ローテーションする。'),
    service('cloudwatch', 'CloudWatch', '📈', '監視', {avail: 6, ops: 18, perf: 4}, ['monitoring', 'observability'], 'メトリクス、ログ、アラームで状態を監視する。'),
    service('cloudtrail', 'CloudTrail', '🧾', '監査ログ', {sec: 15, ops: 11}, ['audit', 'observability'], 'AWS API操作を記録し、監査証跡を残す。'),
    service('guardduty', 'GuardDuty', '🕵', '脅威検知', {sec: 18, ops: 7}, ['security', 'detect'], 'AWS環境の不審な挙動や脅威を検知する。'),
    service('securityhub', 'Security Hub', '🏢', 'セキュリティ集約', {sec: 16, ops: 12}, ['security', 'posture'], 'セキュリティ検出結果と基準準拠を集約する。'),
    service('config', 'Config', '📋', '構成監査', {sec: 10, ops: 15}, ['governance', 'audit'], 'リソース構成の変更履歴とルール評価を行う。'),
    service('ssm', 'Systems Manager', '🔧', '運用管理', {sec: 6, ops: 16, cost: 4}, ['ops', 'patch'], 'サーバ管理、パッチ、Run Commandを統合する。'),
    service('xray', 'X-Ray', '🩻', '分散トレース', {perf: 9, ops: 14}, ['observability', 'trace'], 'リクエスト経路を可視化し、遅延箇所を追う。'),
    service('organizations', 'Organizations', '🏛️', 'アカウント統制', {sec: 12, ops: 13, cost: 5}, ['governance', 'account'], '複数AWSアカウントとSCPを集中管理する。'),
    service('costexplorer', 'Cost Explorer', '💰', 'コスト分析', {cost: 18, ops: 7}, ['cost', 'finance'], 'AWS利用料を可視化し、削減箇所を探す。')
  ]);

  var SYNERGIES = freeze([
    {ids: ['s3', 'cloudfront'], label: 'S3 x CloudFront', axes: {perf: 10, cost: 6}, note: '静的配信の王道。'},
    {ids: ['route53', 'cloudfront'], label: 'Route 53 x CloudFront', axes: {avail: 6, perf: 5}, note: '名前解決とエッジ配信がそろう。'},
    {ids: ['waf', 'cloudfront'], label: 'WAF x CloudFront', axes: {sec: 9, avail: 4}, note: 'エッジで攻撃を止める。'},
    {ids: ['shield', 'waf'], label: 'Shield x WAF', axes: {sec: 10, avail: 7}, note: 'DDoSとWeb攻撃を合わせて守る。'},
    {ids: ['apigateway', 'lambda'], label: 'API Gateway x Lambda', axes: {func: 9, ops: 7, cost: 4}, note: 'サーバレスAPIの定番。'},
    {ids: ['lambda', 'dynamodb'], label: 'Lambda x DynamoDB', axes: {perf: 7, ops: 7, cost: 5}, note: 'スケールしやすいサーバレス構成。'},
    {ids: ['sqs', 'lambda'], label: 'SQS x Lambda', axes: {avail: 9, ops: 6}, note: '非同期処理でスパイクを吸収する。'},
    {ids: ['sns', 'sqs'], label: 'SNS x SQS', axes: {func: 7, avail: 8}, note: 'Pub/Subとキューでファンアウトする。'},
    {ids: ['eventbridge', 'stepfunctions'], label: 'EventBridge x Step Functions', axes: {func: 9, ops: 8}, note: 'イベント起点で業務フローを制御する。'},
    {ids: ['kinesis', 'lambda'], label: 'Kinesis x Lambda', axes: {func: 8, perf: 9}, note: 'ストリーム処理を小さく実装する。'},
    {ids: ['glue', 'athena'], label: 'Glue x Athena', axes: {func: 8, cost: 9, ops: 6}, note: 'S3データレイク分析の基本。'},
    {ids: ['s3', 'athena'], label: 'S3 x Athena', axes: {func: 7, cost: 9}, note: '保存したデータを直接SQL分析する。'},
    {ids: ['glue', 'redshift'], label: 'Glue x Redshift', axes: {func: 8, perf: 7}, note: 'ETLからDWHへつなぐ。'},
    {ids: ['opensearch', 'cloudwatch'], label: 'OpenSearch x CloudWatch', axes: {ops: 8, perf: 4}, note: 'ログ検索と監視をつなげる。'},
    {ids: ['aurora', 'rds_multi'], label: 'Aurora x Multi-AZ', axes: {avail: 11, perf: 5}, note: '重要RDBを高可用化する。'},
    {ids: ['rds', 'secrets'], label: 'RDS x Secrets Manager', axes: {sec: 8, ops: 5}, note: 'DB認証情報を安全に扱う。'},
    {ids: ['iam', 'kms'], label: 'IAM x KMS', axes: {sec: 9}, note: '権限と暗号化キーを分けて制御する。'},
    {ids: ['secrets', 'kms'], label: 'Secrets Manager x KMS', axes: {sec: 9, ops: 4}, note: '秘密情報を暗号化して管理する。'},
    {ids: ['cloudtrail', 'config'], label: 'CloudTrail x Config', axes: {sec: 8, ops: 8}, note: '操作履歴と構成履歴がそろう。'},
    {ids: ['guardduty', 'securityhub'], label: 'GuardDuty x Security Hub', axes: {sec: 10, ops: 8}, note: '検知結果を集約して対応しやすくする。'},
    {ids: ['organizations', 'securityhub'], label: 'Organizations x Security Hub', axes: {sec: 8, ops: 9}, note: '複数アカウントの統制が効く。'},
    {ids: ['vpc', 'natgateway'], label: 'VPC x NAT Gateway', axes: {sec: 6, func: 5}, note: 'プライベート配置と外向き通信を両立する。'},
    {ids: ['directconnect', 'transitgateway'], label: 'Direct Connect x Transit Gateway', axes: {func: 10, perf: 8, ops: 6}, note: 'ハイブリッド接続を集約できる。'},
    {ids: ['alb', 'ecs'], label: 'ALB x ECS Fargate', axes: {avail: 7, ops: 6, perf: 5}, note: 'コンテナWebアプリを分散公開する。'},
    {ids: ['alb', 'eks'], label: 'ALB x EKS', axes: {func: 7, avail: 6}, note: 'KubernetesアプリをHTTP公開する。'},
    {ids: ['cloudwatch', 'xray'], label: 'CloudWatch x X-Ray', axes: {ops: 10, perf: 6}, note: 'メトリクスとトレースで原因を絞る。'}
  ]);

  function conflict(ids, reason, penalty) {
    return freeze({ids: ids, reason: reason, penalty: penalty || 14});
  }

  function anti(ids, reason, penalty) {
    return freeze({ids: ids, reason: reason, penalty: penalty || 10});
  }

  function challenge(cfg) {
    return freeze({
      id: cfg.id,
      chapter: cfg.chapter,
      type: cfg.type,
      industry: cfg.industry,
      title: cfg.title,
      brief: cfg.brief,
      focusAxes: cfg.focusAxes,
      difficulty: cfg.difficulty || 2,
      maxSelect: cfg.maxSelect || 4,
      candidateCount: cfg.candidateCount || 12,
      required: cfg.required,
      support: cfg.support || [],
      traps: cfg.traps || [],
      conflicts: cfg.conflicts || [],
      antiPatterns: cfg.antiPatterns || [],
      boss: !!cfg.boss,
      explanation: cfg.explanation
    });
  }

  var CHALLENGES = freeze([
    challenge({id: 'static_brand_site', chapter: 'web', type: 'design', industry: 'B2B', title: '静的ブランドサイトを海外公開', brief: '低コストな会社サイトを公開したい。海外アクセスがあり、配信速度と運用負荷を抑えたい。', focusAxes: ['cost', 'perf', 'ops'], difficulty: 1, maxSelect: 3, candidateCount: 10, required: ['s3', 'cloudfront', 'route53'], support: ['waf'], traps: ['rds', 'ec2', 'redshift'], antiPatterns: [anti(['s3', 'rds'], '静的サイトにRDBは不要でコスト過剰。')], explanation: '静的サイトはS3をオリジンにし、CloudFrontとRoute 53で配信する。WAFは公開面の防御として支援になる。'}),
    challenge({id: 'public_mobile_api', chapter: 'web', type: 'design', industry: 'モバイル', title: 'モバイルアプリAPIの初期構成', brief: '小規模チームがAPIを公開する。急なアクセス増に耐えつつ、サーバ運用は増やしたくない。', focusAxes: ['func', 'ops', 'perf'], difficulty: 2, maxSelect: 4, candidateCount: 12, required: ['apigateway', 'lambda', 'dynamodb'], support: ['cloudwatch'], traps: ['ec2', 'rds_multi', 'directconnect'], explanation: 'API Gateway、Lambda、DynamoDBでサーバレスに構成すると、初期運用を抑えつつスケールしやすい。'}),
    challenge({id: 'web_attack_edge', chapter: 'web', type: 'harden', industry: 'EC', title: '公開Webに不審な攻撃波形', brief: '海外から大量アクセスと攻撃パターンが来ている。アプリ本体より前段で止めたい。', focusAxes: ['sec', 'avail', 'ops'], difficulty: 2, maxSelect: 4, candidateCount: 12, required: ['waf', 'cloudfront', 'cloudwatch'], support: ['shield', 'route53'], traps: ['rds', 'glue', 'efs'], explanation: 'CloudFront前段にWAFを置き、CloudWatchで状況を監視する。DDoSの懸念が強い場合はShieldも支援になる。'}),
    challenge({id: 'image_latency_incident', chapter: 'web', type: 'incident', industry: 'メディア', title: '画像配信が海外で遅い', brief: '画像表示だけが海外ユーザーに遅い。アプリ改修より配信経路を先に改善したい。', focusAxes: ['perf', 'cost', 'avail'], difficulty: 2, maxSelect: 4, candidateCount: 12, required: ['s3', 'cloudfront', 'route53'], support: ['cloudwatch'], traps: ['redshift', 'fsx', 'rds_multi'], conflicts: [conflict(['cloudfront', 'globalaccelerator'], '静的画像配信ではGlobal AcceleratorよりCloudFrontが主役。', 10)], explanation: '画像はS3に置き、CloudFrontでエッジ配信する。Route 53で名前解決を安定させる。'}),
    challenge({id: 'web_boss_launch', chapter: 'web', type: 'design', industry: 'SaaS', title: 'ボス: 新規SaaSの公開初日', brief: '静的フロント、公開API、基本防御を同時に整えたい。初日は利用者数が読めない。', focusAxes: ['func', 'sec', 'perf'], difficulty: 3, maxSelect: 6, candidateCount: 14, required: ['s3', 'cloudfront', 'apigateway', 'lambda', 'dynamodb'], support: ['waf', 'route53', 'cloudwatch'], traps: ['redshift', 'directconnect', 'fsx'], boss: true, explanation: 'フロントはS3とCloudFront、APIはAPI GatewayとLambda、データはDynamoDBで受ける。WAFと監視は公開初日の守りになる。'}),

    challenge({id: 'order_spike_queue', chapter: 'data', type: 'incident', industry: 'EC', title: '注文処理のスパイクで詰まる', brief: 'セール時だけ注文後処理が詰まり、後続DBまで影響する。落とさず順次処理したい。', focusAxes: ['avail', 'perf', 'ops'], difficulty: 2, maxSelect: 4, candidateCount: 12, required: ['sqs', 'lambda', 'dynamodb'], support: ['cloudwatch', 'sns'], traps: ['redshift', 'directconnect', 'efs'], explanation: 'SQSで注文を受け止め、Lambdaで処理し、DynamoDBで高い書き込みを受ける。'}),
    challenge({id: 'iot_stream_factory', chapter: 'data', type: 'design', industry: '製造IoT', title: '工場センサーの連続データ', brief: '数千台のセンサーから秒単位でデータが届く。リアルタイム処理と後続分析に回したい。', focusAxes: ['func', 'perf', 'avail'], difficulty: 3, maxSelect: 5, candidateCount: 14, required: ['kinesis', 'lambda', 's3'], support: ['glue', 'athena', 'cloudwatch'], traps: ['rds_multi', 'efs', 'route53'], explanation: 'Kinesisでストリームを受け、Lambdaで処理し、S3に蓄積する。GlueとAthenaで後続分析へつなげられる。'}),
    challenge({id: 'bi_lake_low_cost', chapter: 'data', type: 'cost_cut', industry: 'BI', title: '月次BIのDWH費用が重い', brief: '月数回の分析なのにDWHを常時動かしている。データはS3に置けるため、安価に分析したい。', focusAxes: ['cost', 'ops', 'func'], difficulty: 3, maxSelect: 4, candidateCount: 12, required: ['s3', 'glue', 'athena'], support: ['costexplorer'], traps: ['redshift', 'rds_multi', 'eks'], antiPatterns: [anti(['redshift', 'athena'], '低頻度分析なら常時DWHを併用すると費用が残る。')], explanation: '低頻度分析はS3、Glue、Athenaのサーバレス寄り構成で費用と運用を抑えやすい。'}),
    challenge({id: 'relational_core_bank', chapter: 'data', type: 'design', industry: '金融', title: '取引台帳のRDBを止めたくない', brief: '整合性が必要な取引台帳。SQL互換が必要で、AZ障害にも備えたい。', focusAxes: ['func', 'avail', 'sec'], difficulty: 3, maxSelect: 4, candidateCount: 13, required: ['aurora', 'rds_multi', 'kms'], support: ['secrets', 'cloudwatch'], traps: ['dynamodb', 'athena', 'kinesis'], conflicts: [conflict(['aurora', 'dynamodb'], '強いRDB要件ではDynamoDBは主役ではない。', 12)], explanation: 'SQL互換と高可用性が主題なのでAuroraとMulti-AZが軸。KMSとSecrets Managerで保護を強める。'}),
    challenge({id: 'data_boss_realtime_bi', chapter: 'data', type: 'design', industry: 'ゲーム', title: 'ボス: ゲーム内イベント分析基盤', brief: '大量のプレイイベントを受け、即時集計と翌日のBI分析に使いたい。スパイクにも耐えたい。', focusAxes: ['func', 'perf', 'ops'], difficulty: 4, maxSelect: 6, candidateCount: 15, required: ['kinesis', 'lambda', 's3', 'glue', 'athena'], support: ['cloudwatch', 'dynamodb'], traps: ['rds_multi', 'efs', 'directconnect'], boss: true, explanation: 'Kinesisでイベントを取り込み、Lambdaで処理し、S3に保存する。GlueとAthenaでデータレイク分析に展開する。'}),

    challenge({id: 'secrets_leak', chapter: 'security', type: 'harden', industry: '医療', title: 'APIキーをコードから追放', brief: 'DBパスワードと外部APIキーがコードに直書きされていた。安全に保存し、アクセス権も絞りたい。', focusAxes: ['sec', 'ops'], difficulty: 2, maxSelect: 4, candidateCount: 12, required: ['secrets', 'kms', 'iam'], support: ['cloudtrail'], traps: ['cloudfront', 'elasticache', 'athena'], explanation: 'Secrets Managerで秘密情報を保管し、KMSで暗号化、IAMでアクセス範囲を絞る。'}),
    challenge({id: 'multi_account_governance', chapter: 'security', type: 'harden', industry: 'エンタープライズ', title: '子会社アカウントをまとめて統制', brief: '複数AWSアカウントで設定のばらつきが出ている。ガードレールと検出結果の集約が必要。', focusAxes: ['sec', 'ops', 'func'], difficulty: 3, maxSelect: 5, candidateCount: 14, required: ['organizations', 'securityhub', 'config'], support: ['cloudtrail', 'guardduty'], traps: ['globalaccelerator', 'efs', 'redshift'], explanation: 'Organizationsでアカウント統制、Security Hubで検出集約、Configで構成準拠を評価する。'}),
    challenge({id: 'threat_detection', chapter: 'security', type: 'incident', industry: '金融', title: '不審な認証と探索行動', brief: '深夜に不審なAPI操作とポート探索の兆候がある。検知と監査証跡をそろえたい。', focusAxes: ['sec', 'ops', 'avail'], difficulty: 3, maxSelect: 5, candidateCount: 14, required: ['guardduty', 'cloudtrail', 'securityhub'], support: ['cloudwatch', 'iam'], traps: ['s3', 'kinesis', 'appsync'], explanation: 'GuardDutyで脅威を検知し、CloudTrailで操作証跡を残し、Security Hubで対応を集約する。'}),
    challenge({id: 'audit_trail_compliance', chapter: 'security', type: 'harden', industry: '公共', title: '監査で操作履歴と暗号化を要求', brief: '監査で誰が何を変更したか、重要データが暗号化されているかを説明する必要がある。', focusAxes: ['sec', 'ops'], difficulty: 3, maxSelect: 5, candidateCount: 14, required: ['cloudtrail', 'config', 'kms', 'iam'], support: ['securityhub'], traps: ['cloudfront', 'elasticache', 'fsx'], explanation: 'CloudTrailで操作、Configで構成、KMSで暗号化、IAMで権限を管理する。'}),
    challenge({id: 'security_boss_healthcare', chapter: 'security', type: 'harden', industry: '医療', title: 'ボス: 医療データ基盤の監査対応', brief: '患者データを扱う基盤。暗号化、権限、秘密情報、操作履歴、脅威検知をまとめて整えたい。', focusAxes: ['sec', 'ops', 'avail'], difficulty: 4, maxSelect: 6, candidateCount: 16, required: ['iam', 'kms', 'secrets', 'cloudtrail', 'guardduty'], support: ['securityhub', 'config'], traps: ['globalaccelerator', 'redshift', 'elasticache'], boss: true, explanation: '機密情報ではIAM、KMS、Secrets Manager、CloudTrail、GuardDutyが土台。Security HubとConfigが統制を強める。'}),

    challenge({id: 'private_subnet_patch', chapter: 'network', type: 'migrate', industry: '業務アプリ', title: 'プライベート配置でも外部更新したい', brief: 'アプリサーバはプライベートサブネットに置くが、OS更新や外部APIへのアウトバウンドは必要。', focusAxes: ['sec', 'func', 'ops'], difficulty: 3, maxSelect: 4, candidateCount: 12, required: ['vpc', 'natgateway', 'ssm'], support: ['cloudwatch'], traps: ['cloudfront', 'redshift', 'appsync'], explanation: 'VPCで分離し、NAT Gatewayで外向き通信を確保する。Systems Managerで運用管理を楽にする。'}),
    challenge({id: 'onprem_dedicated_link', chapter: 'network', type: 'migrate', industry: '製造', title: 'オンプレ工場とAWSを安定接続', brief: '工場ネットワークとAWS間で大容量データを安定転送したい。複数VPCにも広げる予定。', focusAxes: ['func', 'perf', 'avail'], difficulty: 3, maxSelect: 5, candidateCount: 14, required: ['directconnect', 'transitgateway', 'vpc'], support: ['cloudwatch'], traps: ['cloudfront', 'apigateway', 'athena'], explanation: 'Direct Connectで専用線接続し、Transit Gatewayで複数VPCや拠点接続を集約する。'}),
    challenge({id: 'global_game_api', chapter: 'network', type: 'design', industry: 'ゲーム', title: '世界向けゲームAPIの経路最適化', brief: '動的APIの応答が地域でばらつく。静的配信ではなく、アプリ入口への経路を改善したい。', focusAxes: ['perf', 'avail', 'func'], difficulty: 4, maxSelect: 5, candidateCount: 14, required: ['globalaccelerator', 'alb', 'ecs'], support: ['route53', 'cloudwatch'], traps: ['athena', 's3', 'redshift'], conflicts: [conflict(['globalaccelerator', 'cloudfront'], '動的TCP/UDP系の経路最適化ではGlobal Acceleratorが主役。', 10)], explanation: 'Global Acceleratorでグローバル経路を最適化し、ALBとECSでアプリを分散公開する。'}),
    challenge({id: 'windows_file_migration', chapter: 'network', type: 'migrate', industry: '医療', title: 'Windowsファイルサーバ移行', brief: '部門共有のWindowsファイルサーバをAWSへ移す。既存アプリはSMB前提で、性能も必要。', focusAxes: ['func', 'perf', 'ops'], difficulty: 3, maxSelect: 4, candidateCount: 12, required: ['fsx', 'vpc', 'directconnect'], support: ['ssm'], traps: ['s3', 'dynamodb', 'kinesis'], conflicts: [conflict(['fsx', 's3'], 'SMBファイルサーバ互換が必要ならS3単体は代替にならない。', 13)], explanation: 'Windowsファイル共有はFSxが適する。VPCとDirect Connectで既存ネットワークに近い形へ移行する。'}),
    challenge({id: 'network_boss_hybrid', chapter: 'network', type: 'migrate', industry: '金融', title: 'ボス: 基幹系ハイブリッド移行', brief: 'オンプレ基幹系を段階移行する。専用線、VPC分離、共有経路、RDB、運用監視が必要。', focusAxes: ['func', 'avail', 'sec'], difficulty: 4, maxSelect: 6, candidateCount: 16, required: ['directconnect', 'transitgateway', 'vpc', 'aurora', 'cloudwatch'], support: ['kms', 'ssm'], traps: ['cloudfront', 'athena', 'appsync'], boss: true, explanation: 'ハイブリッド移行はDirect Connect、Transit Gateway、VPCが土台。基幹RDBはAurora、監視はCloudWatchで支える。'}),

    challenge({id: 'unknown_latency_trace', chapter: 'ops', type: 'incident', industry: 'SaaS', title: '原因不明の遅延を追いたい', brief: 'たまにAPIが遅くなるが再現しない。メトリクス、ログ、リクエスト経路を追いたい。', focusAxes: ['ops', 'perf', 'avail'], difficulty: 3, maxSelect: 4, candidateCount: 12, required: ['cloudwatch', 'xray', 'apigateway'], support: ['lambda'], traps: ['directconnect', 'redshift', 'fsx'], explanation: 'CloudWatchでメトリクスとログ、X-Rayで分散トレースを取り、API Gateway入口から調査する。'}),
    challenge({id: 'patch_fleet_ops', chapter: 'ops', type: 'harden', industry: '製造', title: 'EC2群のパッチ運用を標準化', brief: '複数部門のEC2でパッチ適用状況がばらつく。SSH手作業を減らし、状況を見える化したい。', focusAxes: ['ops', 'sec', 'cost'], difficulty: 3, maxSelect: 4, candidateCount: 12, required: ['ssm', 'config', 'cloudwatch'], support: ['iam'], traps: ['cloudfront', 'kinesis', 'appsync'], explanation: 'Systems ManagerでパッチとRun Command、Configで構成確認、CloudWatchで運用状態を監視する。'}),
    challenge({id: 'overspend_static_fix', chapter: 'ops', type: 'cost_cut', industry: 'メディア', title: '静的LPをEC2で過剰運用', brief: 'ランディングページだけなのにEC2とRDSを常時動かしている。低コストで同等の公開をしたい。', focusAxes: ['cost', 'ops', 'perf'], difficulty: 2, maxSelect: 4, candidateCount: 12, required: ['costexplorer', 's3', 'cloudfront'], support: ['route53'], traps: ['rds_multi', 'eks', 'fsx'], antiPatterns: [anti(['rds_multi', 'cloudfront'], '静的LPに冗長DBは過剰。', 16)], explanation: 'Cost Explorerで現状を見て、S3とCloudFrontへ寄せると静的公開の費用と運用を下げられる。'}),
    challenge({id: 'container_platform_choice', chapter: 'ops', type: 'design', industry: 'SaaS', title: 'コンテナ基盤を小さく始めたい', brief: 'コンテナ化したWebアプリを公開する。Kubernetes専門運用者はいないため、運用負荷は抑えたい。', focusAxes: ['ops', 'func', 'avail'], difficulty: 3, maxSelect: 4, candidateCount: 13, required: ['ecs', 'alb', 'cloudwatch'], support: ['vpc'], traps: ['eks', 'redshift', 'athena'], conflicts: [conflict(['ecs', 'eks'], '小規模で運用者が少ないならEKS併用は複雑化しやすい。', 14)], explanation: 'Kubernetesが必須でなければECS FargateとALBで公開し、CloudWatchで監視するのが軽い。'}),
    challenge({id: 'ops_boss_finops', chapter: 'ops', type: 'cost_cut', industry: '全社IT', title: 'ボス: 全社AWS費用と運用の立て直し', brief: '請求が増え、構成差分も追えていない。費用可視化、構成監査、パッチ、監視をまとめて整えたい。', focusAxes: ['cost', 'ops', 'sec'], difficulty: 4, maxSelect: 6, candidateCount: 16, required: ['costexplorer', 'config', 'ssm', 'cloudwatch', 'organizations'], support: ['securityhub'], traps: ['globalaccelerator', 'redshift', 'fsx'], boss: true, explanation: 'Cost Explorerで費用、Organizationsで範囲、Configで構成、SSMで運用、CloudWatchで状態を押さえる。'}),

    challenge({id: 'final_ecommerce_platform', chapter: 'final', type: 'design', industry: 'EC', title: '最終試験: 大規模ECプラットフォーム', brief: 'セール、静的配信、API、注文非同期化、監視、防御を一度に設計する。', focusAxes: ['func', 'avail', 'sec'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['cloudfront', 'waf', 'apigateway', 'lambda', 'sqs', 'dynamodb'], support: ['cloudwatch', 'route53'], traps: ['redshift', 'directconnect', 'fsx'], boss: true, explanation: 'CloudFrontとWAFで入口を守り、API GatewayとLambdaでAPI、SQSとDynamoDBで注文スパイクを受ける。'}),
    challenge({id: 'final_health_data', chapter: 'final', type: 'harden', industry: '医療', title: '最終試験: 医療データ連携', brief: '機密データを扱うAPIと分析基盤。暗号化、秘密情報、監査、低頻度分析を両立したい。', focusAxes: ['sec', 'ops', 'cost'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['kms', 'secrets', 'cloudtrail', 's3', 'glue', 'athena'], support: ['iam', 'config'], traps: ['globalaccelerator', 'efs', 'eks'], boss: true, explanation: '機密保護はKMS、Secrets Manager、CloudTrail。分析はS3、Glue、Athenaで低運用にまとめる。'}),
    challenge({id: 'final_streaming_service', chapter: 'final', type: 'incident', industry: '動画配信', title: '最終試験: 配信サービスの障害復旧', brief: '動画サムネイルが遅く、APIも一部地域で遅い。攻撃波形もあるため入口防御と経路改善が必要。', focusAxes: ['perf', 'avail', 'sec'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['cloudfront', 'waf', 'globalaccelerator', 'alb', 'cloudwatch'], support: ['shield', 'route53'], traps: ['redshift', 'athena', 'fsx'], boss: true, explanation: '静的配信はCloudFront、動的API経路はGlobal AcceleratorとALB。WAFとCloudWatchで防御と観測を行う。'}),
    challenge({id: 'final_manufacturing_iot', chapter: 'final', type: 'design', industry: '製造IoT', title: '最終試験: 工場IoTと本社BI', brief: '工場から大量イベントを収集し、本社BIへ渡す。オンプレ接続とデータレイク分析も必要。', focusAxes: ['func', 'perf', 'ops'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['directconnect', 'kinesis', 'lambda', 's3', 'glue', 'athena'], support: ['transitgateway', 'cloudwatch'], traps: ['rds_multi', 'appsync', 'elasticache'], boss: true, explanation: 'Direct Connectで工場と接続し、KinesisとLambdaで取り込み、S3、Glue、Athenaで分析へつなげる。'}),
    challenge({id: 'final_governed_multi_account', chapter: 'final', type: 'harden', industry: 'グループ会社', title: '最終試験: マルチアカウント統制', brief: 'グループ会社のAWS利用を安全に拡大する。統制、監査、検知、構成準拠を標準化したい。', focusAxes: ['sec', 'ops', 'func'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['organizations', 'securityhub', 'guardduty', 'cloudtrail', 'config'], support: ['iam', 'kms'], traps: ['cloudfront', 'kinesis', 'efs'], boss: true, explanation: 'Organizationsを土台にSecurity Hub、GuardDuty、CloudTrail、Configを組み合わせて全体を統制する。'}),
    challenge({id: 'final_legacy_modernize', chapter: 'final', type: 'migrate', industry: '基幹業務', title: '最終試験: レガシー基幹の段階モダナイズ', brief: 'オンプレRDBアプリをAWSへ段階移行し、一部処理を非同期化する。専用線と監視も必須。', focusAxes: ['func', 'avail', 'ops'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['directconnect', 'transitgateway', 'aurora', 'sqs', 'lambda', 'cloudwatch'], support: ['vpc', 'kms'], traps: ['cloudfront', 'athena', 'appsync'], boss: true, explanation: '専用線と経路集約、AuroraへのRDB移行、SQSとLambdaの非同期化、CloudWatch監視を組み合わせる。'}),
    challenge({id: 'final_architect_board', chapter: 'final', type: 'cost_cut', industry: '経営会議', title: '昇格面談: 経営会議への改善案', brief: '費用、信頼性、セキュリティを同時に説明する。過剰投資を避け、全社標準として運用できる案が必要。', focusAxes: ['cost', 'sec', 'ops'], difficulty: 5, maxSelect: 6, candidateCount: 16, required: ['costexplorer', 'organizations', 'config', 'securityhub', 'cloudwatch'], support: ['ssm', 'iam'], traps: ['eks', 'redshift', 'fsx'], boss: true, explanation: '全社改善はCost Explorer、Organizations、Config、Security Hub、CloudWatchで可視化と統制を先に固める。'})
  ]);

  var CHAPTERS = freeze([
    freeze({id: 'web', title: 'Webフロント基礎', career: '新人クラウド見習い', blurb: 'DNS、CDN、API、公開面の防御を固める。', requiredAvg: 68, challengeIds: ['static_brand_site', 'public_mobile_api', 'web_attack_edge', 'image_latency_incident', 'web_boss_launch']}),
    freeze({id: 'data', title: 'データと非同期化', career: 'ジュニアクラウド設計者', blurb: 'RDB、NoSQL、キュー、分析基盤を使い分ける。', requiredAvg: 70, challengeIds: ['order_spike_queue', 'iot_stream_factory', 'bi_lake_low_cost', 'relational_core_bank', 'data_boss_realtime_bi']}),
    freeze({id: 'security', title: 'セキュリティ強化', career: 'セキュリティ実践者', blurb: '暗号化、監査、検知、マルチアカウント統制を扱う。', requiredAvg: 72, challengeIds: ['secrets_leak', 'multi_account_governance', 'threat_detection', 'audit_trail_compliance', 'security_boss_healthcare']}),
    freeze({id: 'network', title: 'ネットワークと移行', career: 'シニア移行設計者', blurb: 'VPC、専用線、経路集約、ファイル移行を設計する。', requiredAvg: 72, challengeIds: ['private_subnet_patch', 'onprem_dedicated_link', 'global_game_api', 'windows_file_migration', 'network_boss_hybrid']}),
    freeze({id: 'ops', title: '運用とコスト最適化', career: 'シニアクラウド設計者', blurb: '監視、パッチ、構成監査、FinOpsをまとめる。', requiredAvg: 74, challengeIds: ['unknown_latency_trace', 'patch_fleet_ops', 'overspend_static_fix', 'container_platform_choice', 'ops_boss_finops']}),
    freeze({id: 'final', title: 'アーキテクト昇格試験', career: 'クラウドアーキテクト候補', blurb: '複合要件のボス案件だけで構成された最終章。', requiredAvg: 76, challengeIds: ['final_ecommerce_platform', 'final_health_data', 'final_streaming_service', 'final_manufacturing_iot', 'final_governed_multi_account', 'final_legacy_modernize', 'final_architect_board']})
  ]);

  global.V4_DATA = freeze({
    axes: AXES,
    axisLabel: AXIS_LABEL,
    typeLabel: TYPE_LABEL,
    typeHint: TYPE_HINT,
    typeWeights: TYPE_WEIGHTS,
    services: SERVICES,
    synergies: SYNERGIES,
    challenges: CHALLENGES,
    chapters: CHAPTERS
  });
})(typeof window !== 'undefined' ? window : globalThis);
