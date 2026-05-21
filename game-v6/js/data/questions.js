/* AWS 早押しクイズ — 問題バンク (CLF / SAA)  ※1文字ずつ綴る方式
 *
 * フィールド:
 *   id     : 一意ID
 *   cert   : 対象資格 ["clf"] / ["saa"] / ["clf","saa"]
 *   domain : 分野ID (DOMAINS と対応)
 *   level  : 1=易 2=中 3=難
 *   q      : 問題文 (早押しでは1文字ずつ表示)
 *   answer : 綴る正解。大文字 A-Z / 0-9 のみ（1文字ずつ4択で入力させる）
 *   name   : 解説で表示する正式名称
 *   explain: 解説
 */
window.AWSQUIZ = window.AWSQUIZ || { domains: [], questions: [] };

window.AWSQUIZ.domains = [
  { id: "iam",        emoji: "🔐", name: "IAM / 認証認可" },
  { id: "compute",    emoji: "🖥",  name: "コンピューティング" },
  { id: "storage",    emoji: "💾", name: "ストレージ" },
  { id: "database",   emoji: "🛢", name: "データベース" },
  { id: "network",    emoji: "🌐", name: "ネットワーク / VPC" },
  { id: "scaling",    emoji: "⚖",  name: "可用性 / 配信" },
  { id: "integration",emoji: "📨", name: "アプリ統合 / 疎結合" },
  { id: "serverless", emoji: "⚡", name: "サーバーレス" },
  { id: "security",   emoji: "🛡",  name: "セキュリティ" },
  { id: "monitoring", emoji: "📈", name: "監視 / 運用" },
  { id: "billing",    emoji: "💵", name: "料金 / 管理" },
];

const Q = window.AWSQUIZ.questions;

/* ===== IAM / 認証認可 ===== */
Q.push(
  { id:"iam-1", cert:["clf","saa"], domain:"iam", level:1,
    q:"ユーザー・グループ・ロールとポリシーで、AWSへの認証と権限を一元管理するサービスの略称は？",
    answer:"IAM", name:"AWS IAM (Identity and Access Management)",
    explain:"IAMはユーザー/グループ/ロールにポリシーを割り当てて権限を制御する。追加料金なしの基盤サービス。" },
  { id:"iam-2", cert:["clf","saa"], domain:"iam", level:1,
    q:"パスワードに加えワンタイムコード等を要求し、不正ログインを防ぐ多要素認証の略称は？",
    answer:"MFA", name:"MFA (多要素認証)",
    explain:"MFAは「知識(パスワード)＋所持/生体」で認証を強化。特にルートユーザーは必ず有効化する。" },
  { id:"iam-3", cert:["saa"], domain:"iam", level:2,
    q:"AWS Organizations配下のアカウント群に対し、許可される操作の上限を一括設定するポリシーの略称は？",
    answer:"SCP", name:"SCP (サービスコントロールポリシー)",
    explain:"SCPはOU/アカウントのガードレール。SCPで許可されない操作はIAMで許可しても実行できない。" }
);

/* ===== コンピューティング ===== */
Q.push(
  { id:"cmp-1", cert:["clf","saa"], domain:"compute", level:1,
    q:"オンデマンドで起動・停止でき、使った分だけ課金される代表的な仮想サーバーの略称は？",
    answer:"EC2", name:"Amazon EC2 (Elastic Compute Cloud)",
    explain:"EC2は再販可能な仮想サーバー。インスタンスタイプと購入オプションを選んで柔軟に使う。" },
  { id:"cmp-2", cert:["clf","saa"], domain:"compute", level:1,
    q:"サーバー管理不要でコードを実行し、実行時間とリクエスト数だけで課金されるサービス名は？",
    answer:"LAMBDA", name:"AWS Lambda",
    explain:"Lambdaはサーバーレス実行基盤。イベント駆動で動き、アイドル時は課金されない。" },
  { id:"cmp-3", cert:["saa"], domain:"compute", level:2,
    q:"ECS/EKSでEC2を管理せずコンテナを動かせる、サーバーレスのコンテナ実行基盤の名前は？",
    answer:"FARGATE", name:"AWS Fargate",
    explain:"FargateはコンテナのサーバーレスエンジンでEC2の管理が不要。" },
  { id:"cmp-4", cert:["clf","saa"], domain:"compute", level:2,
    q:"中断耐性のある処理向けに、余剰キャパを最大90%引きで使えるEC2購入オプションは？",
    answer:"SPOT", name:"スポットインスタンス",
    explain:"スポットは大幅割引だがAWS都合で中断され得る(2分前通知)。バッチやステートレス処理向き。" }
);

/* ===== ストレージ ===== */
Q.push(
  { id:"st-1", cert:["clf","saa"], domain:"storage", level:1,
    q:"容量無制限・イレブンナインの耐久性を持つ、AWS代表のオブジェクトストレージの略称は？",
    answer:"S3", name:"Amazon S3 (Simple Storage Service)",
    explain:"S3はオブジェクトストレージで11ナインの耐久性。静的配信・バックアップ・データレイク基盤に使う。" },
  { id:"st-2", cert:["clf","saa"], domain:"storage", level:1,
    q:"EC2にアタッチして使う、単一AZ内のブロックストレージの略称は？",
    answer:"EBS", name:"Amazon EBS (Elastic Block Store)",
    explain:"EBSはEC2用ブロックボリューム。スナップショットはS3に保存される。" },
  { id:"st-3", cert:["saa"], domain:"storage", level:2,
    q:"複数EC2から同時マウントできる、フルマネージドな共有ファイルシステムの略称は？",
    answer:"EFS", name:"Amazon EFS (Elastic File System)",
    explain:"EFSはNFSベースで複数AZ・複数インスタンスから同時アクセスでき、自動でスケールする。" },
  { id:"st-4", cert:["clf","saa"], domain:"storage", level:2,
    q:"滅多に使わないデータを最安で長期アーカイブするS3のクラス名（氷河の意味の語）は？",
    answer:"GLACIER", name:"S3 Glacier",
    explain:"Glacierは取り出しに時間がかかる代わり最安。コンプライアンス保管に最適。" },
  { id:"st-5", cert:["clf","saa"], domain:"storage", level:2,
    q:"回線が細い環境で、物理デバイスにデータを入れて郵送しAWSへ移送するサービス名は？",
    answer:"SNOWBALL", name:"AWS Snowball",
    explain:"Snowballは物理アプライアンスで大容量データを輸送。ネットワーク転送が非現実的な移行に有効。" }
);

/* ===== データベース ===== */
Q.push(
  { id:"db-1", cert:["clf","saa"], domain:"database", level:1,
    q:"MySQLやPostgreSQL等のリレーショナルDBを、パッチ/バックアップ込みで提供するサービスの略称は？",
    answer:"RDS", name:"Amazon RDS (Relational Database Service)",
    explain:"RDSはRDBのマネージドサービス。Multi-AZやバックアップを自動化する。" },
  { id:"db-2", cert:["clf","saa"], domain:"database", level:2,
    q:"一桁ミリ秒で応答し、ほぼ無制限にスケールするフルマネージドNoSQL(キーバリュー)の名前は？",
    answer:"DYNAMODB", name:"Amazon DynamoDB",
    explain:"DynamoDBはサーバーレスNoSQL。スキーマレスでスパイクに強く、任意規模で高速。" },
  { id:"db-3", cert:["saa"], domain:"database", level:2,
    q:"MySQL/PostgreSQL互換で標準の数倍の性能を持つ、AWS独自のクラウドネイティブRDBの名前は？",
    answer:"AURORA", name:"Amazon Aurora",
    explain:"Auroraは6複製を3AZに保持し高性能・高可用。標準MySQLの最大5倍/PostgreSQLの3倍の性能。" },
  { id:"db-4", cert:["clf","saa"], domain:"database", level:2,
    q:"ペタバイト級データを高速集計する、列指向のフルマネージドなデータウェアハウスの名前は？",
    answer:"REDSHIFT", name:"Amazon Redshift",
    explain:"Redshiftは分析(OLAP)用DWH。トランザクション処理(OLTP)用途のRDSとは目的が異なる。" }
);

/* ===== ネットワーク / VPC ===== */
Q.push(
  { id:"net-1", cert:["clf","saa"], domain:"network", level:1,
    q:"AWS上に論理的に分離した自分専用の仮想ネットワークを作るサービスの略称は？",
    answer:"VPC", name:"Amazon VPC (Virtual Private Cloud)",
    explain:"VPCはサブネット/ルートテーブル/ゲートウェイを自分で設計できる仮想ネットワーク空間。" },
  { id:"net-2", cert:["saa"], domain:"network", level:2,
    q:"プライベートサブネットから外への通信は許し、外からの開始接続は防ぐゲートウェイの略称は？",
    answer:"NAT", name:"NAT ゲートウェイ",
    explain:"NAT GWは内→外を可能にしつつ外→内の開始接続を遮断。IGWは双方向到達性を持つ点で異なる。" },
  { id:"net-3", cert:["clf","saa"], domain:"network", level:1,
    q:"ドメイン登録とDNS、ヘルスチェックを行うAWSのマネージドDNSサービスの名前は？",
    answer:"ROUTE53", name:"Amazon Route 53",
    explain:"Route 53はマネージドDNS。レイテンシ/加重/フェイルオーバー等のルーティングを提供。" },
  { id:"net-4", cert:["saa"], domain:"network", level:2,
    q:"サブネット単位で許可と拒否の両方をステートレスに設定するアクセス制御の略称は？",
    answer:"NACL", name:"ネットワークACL",
    explain:"NACLはサブネット境界のステートレスFW。戻り通信も明示許可が必要。SGの補助層。" },
  { id:"net-5", cert:["clf","saa"], domain:"network", level:2,
    q:"オンプレミスとAWSを専用線で安定接続するサービス（よく2文字で略される）の略称は？",
    answer:"DX", name:"AWS Direct Connect (DX)",
    explain:"Direct Connect(DX)は専用線で帯域と品質が安定。VPNはインターネット経由で安価だがベストエフォート。" }
);

/* ===== 可用性 / 配信 ===== */
Q.push(
  { id:"sc-1", cert:["clf","saa"], domain:"scaling", level:1,
    q:"複数のターゲットへトラフィックを分散し、異常なものを切り離すロードバランサーの総称(略称)は？",
    answer:"ELB", name:"Elastic Load Balancing",
    explain:"ELBは受信を正常ターゲットへ分散。種類にALB(L7)/NLB(L4)/GLB/CLBがある。" },
  { id:"sc-2", cert:["saa"], domain:"scaling", level:2,
    q:"HTTP/HTTPSのパスやホスト名で振り分ける(レイヤー7)ロードバランサーの略称は？",
    answer:"ALB", name:"Application Load Balancer",
    explain:"ALBはL7でパス/ホストベースルーティング。NLBはL4で超低レイテンシ・固定IP用途。" },
  { id:"sc-3", cert:["saa"], domain:"scaling", level:2,
    q:"超低レイテンシで固定IPを提供する、レイヤー4のロードバランサーの略称は？",
    answer:"NLB", name:"Network Load Balancer",
    explain:"NLBはL4(TCP/UDP)で高スループット・低レイテンシ。静的IPやPrivateLink連携に向く。" },
  { id:"sc-4", cert:["clf","saa"], domain:"scaling", level:1,
    q:"世界中のエッジから静的/動的コンテンツを低遅延配信するAWSのCDNサービスの名前は？",
    answer:"CLOUDFRONT", name:"Amazon CloudFront",
    explain:"CloudFrontはエッジでキャッシュ配信し、オリジン負荷軽減とユーザー近接配信を実現する。" }
);

/* ===== アプリ統合 / 疎結合 ===== */
Q.push(
  { id:"int-1", cert:["clf","saa"], domain:"integration", level:1,
    q:"メッセージを一時保管して送受信を非同期・疎結合にする、フルマネージドなキューの略称は？",
    answer:"SQS", name:"Amazon SQS (Simple Queue Service)",
    explain:"SQSはメッセージキュー。負荷をバッファし送信側と受信側を分離する。" },
  { id:"int-2", cert:["clf","saa"], domain:"integration", level:2,
    q:"1つのメッセージを複数の購読者へ同時配信する、パブサブ型サービスの略称は？",
    answer:"SNS", name:"Amazon SNS (Simple Notification Service)",
    explain:"SNSはpub/sub。1トピックへの発行を多数のサブスクライバーへファンアウトできる。" },
  { id:"int-3", cert:["saa"], domain:"integration", level:2,
    q:"多数のSaaS/AWSのイベントをルールでフィルタしターゲットへ配送するイベントバスの名前は？",
    answer:"EVENTBRIDGE", name:"Amazon EventBridge",
    explain:"EventBridgeはイベント駆動アーキの中核。イベントパターンでルーティングし外部連携も容易。" }
);

/* ===== サーバーレス ===== */
Q.push(
  { id:"srv-1", cert:["saa"], domain:"serverless", level:2,
    q:"REST/HTTP APIを作成・公開し、認可・スロットリング・キャッシュを担うサービスの略称は？",
    answer:"APIGATEWAY", name:"Amazon API Gateway",
    explain:"API GatewayはAPIのフロントドア。Lambda等へルーティングし認証/レート制限/キャッシュを提供。" },
  { id:"srv-2", cert:["saa"], domain:"serverless", level:2,
    q:"DB資格情報などの秘密を暗号化保存し、自動ローテーションできるサービス名(2語)は？",
    answer:"SECRETSMANAGER", name:"AWS Secrets Manager",
    explain:"Secrets Managerはシークレットを安全に保存し自動ローテーション。コードへの直書きを避ける。" }
);

/* ===== セキュリティ ===== */
Q.push(
  { id:"sec-1", cert:["clf","saa"], domain:"security", level:1,
    q:"暗号鍵の作成・管理・利用を一元化し、多くのAWSサービスと統合する鍵管理サービスの略称は？",
    answer:"KMS", name:"AWS KMS (Key Management Service)",
    explain:"KMSはマネージド鍵管理。S3/EBS/RDS等の保管時暗号化と統合する。" },
  { id:"sec-2", cert:["clf","saa"], domain:"security", level:1,
    q:"SQLインジェクションやXSSなどWebアプリへの攻撃をルールで遮断するサービスの略称は？",
    answer:"WAF", name:"AWS WAF (Web Application Firewall)",
    explain:"WAFはL7のWebアプリFW。CloudFront/ALB/API Gatewayに適用し悪意あるリクエストを防ぐ。" },
  { id:"sec-3", cert:["clf","saa"], domain:"security", level:2,
    q:"DDoS攻撃から守り、Standardが全顧客に無料適用されるサービスの名前は？",
    answer:"SHIELD", name:"AWS Shield",
    explain:"Shield StandardはL3/L4のDDoS防御を無償提供。Advancedは有償で高度防御と24時間対応を追加。" },
  { id:"sec-4", cert:["saa"], domain:"security", level:2,
    q:"ログを機械学習で分析し、不審なアクティビティを検知する脅威検知サービスの名前は？",
    answer:"GUARDDUTY", name:"Amazon GuardDuty",
    explain:"GuardDutyはVPCフローログやCloudTrail等を継続分析し、脅威や異常な振る舞いを検知する。" },
  { id:"sec-5", cert:["saa"], domain:"security", level:2,
    q:"S3内の個人情報(PII)などの機微データを機械学習で発見・分類するサービスの名前は？",
    answer:"MACIE", name:"Amazon Macie",
    explain:"MacieはS3の機微データ(PIIやカード番号)を検出・分類し、データ保護リスクを可視化する。" },
  { id:"sec-6", cert:["saa"], domain:"security", level:2,
    q:"Webやモバイルアプリにサインアップ/サインインとユーザー管理を提供するサービスの名前は？",
    answer:"COGNITO", name:"Amazon Cognito",
    explain:"Cognitoはユーザー認証(User Pools)とフェデレーション/一時認証(Identity Pools)を提供する。" }
);

/* ===== 監視 / 運用 ===== */
Q.push(
  { id:"mon-1", cert:["clf","saa"], domain:"monitoring", level:1,
    q:"メトリクス・ログ・アラームでリソースとアプリを監視するサービスの名前は？",
    answer:"CLOUDWATCH", name:"Amazon CloudWatch",
    explain:"CloudWatchはメトリクス収集/ログ集約/アラーム/ダッシュボードを提供する監視サービス。" },
  { id:"mon-2", cert:["clf","saa"], domain:"monitoring", level:2,
    q:"「誰が・いつ・どのAPIを呼んだか」を記録し、監査に使うサービスの名前は？",
    answer:"CLOUDTRAIL", name:"AWS CloudTrail",
    explain:"CloudTrailはAPIコール履歴を記録する監査ログ。性能監視のCloudWatchとは役割が異なる。" },
  { id:"mon-3", cert:["saa"], domain:"monitoring", level:2,
    q:"リソース構成の変更履歴を記録し、あるべき設定からの逸脱を評価するサービスの名前は？",
    answer:"CONFIG", name:"AWS Config",
    explain:"Configは構成変更の追跡と準拠性評価を行う。API操作記録のCloudTrailとは目的が違う。" }
);

/* ===== 料金 / 管理 ===== */
Q.push(
  { id:"bil-1", cert:["clf"], domain:"billing", level:1,
    q:"予算額を設定し、超過しそうな時にアラート通知するコスト管理サービスの名前は？",
    answer:"BUDGETS", name:"AWS Budgets",
    explain:"Budgetsはコスト/使用量の予算と閾値を設定し、超過(または予測超過)時に通知する。" },
  { id:"bil-2", cert:["clf","saa"], domain:"billing", level:1,
    q:"コスト最適化・セキュリティ・耐障害性などをチェックし改善提案する助言ツールの名前は？(2語)",
    answer:"TRUSTEDADVISOR", name:"AWS Trusted Advisor",
    explain:"Trusted Advisorは5本柱でベストプラクティスを点検し推奨事項を提示する。" }
);
