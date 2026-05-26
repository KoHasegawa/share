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
  { id: "warch",      emoji: "🏛",  name: "設計 / 全体像" },
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

/* =========================================================
 *  追加バンク — サービス名以外も含む多様な正解
 * ========================================================= */

/* ----- IAM / 認証認可 ----- */
Q.push(
  { id:"iam-4", cert:["saa"], domain:"iam", level:2,
    q:"AssumeRoleで一時的な認証情報を発行する、セキュリティトークンサービスの略称は？",
    answer:"STS", name:"AWS STS (Security Token Service)",
    explain:"STSは期限付きの一時認証情報を払い出す。クロスアカウントやフェデレーションの基盤。" },
  { id:"iam-5", cert:["clf","saa"], domain:"iam", level:1,
    q:"IAMの設計で、職務に必要な最小限だけ権限を与える原則を英語2語(続けて)で？",
    answer:"LEASTPRIVILEGE", name:"Least Privilege（最小権限の原則）",
    explain:"必要最小限の権限のみ付与してリスクを抑える。IAM設計の根幹。" },
  { id:"iam-6", cert:["saa"], domain:"iam", level:2,
    q:"複数アカウントへのシングルサインオンと権限割り当てを担う後継サービスの略称(旧SSO)は？",
    answer:"SSO", name:"AWS IAM Identity Center（旧 AWS SSO）",
    explain:"IAM Identity Center(旧SSO)は複数アカウント/アプリへのSSOと権限セット割り当てを提供する。" }
);

/* ----- コンピューティング ----- */
Q.push(
  { id:"cmp-5", cert:["clf","saa"], domain:"compute", level:1,
    q:"コミットなしでいつでも起動・停止でき、最も柔軟な(割高な)EC2購入オプションを英語1語で？",
    answer:"ONDEMAND", name:"オンデマンド",
    explain:"オンデマンドは事前コミット不要で従量課金。短期/予測困難なワークロード向き。" },
  { id:"cmp-6", cert:["saa"], domain:"compute", level:2,
    q:"1〜3年の使用量コミットで割引を受ける、RIより柔軟な購入プランの英語名(2語続けて)は？",
    answer:"SAVINGSPLANS", name:"Savings Plans",
    explain:"Savings Plansは時間あたりの利用額をコミットして割引。Compute SPはサービス横断で柔軟。" },
  { id:"cmp-7", cert:["saa"], domain:"compute", level:2,
    q:"負荷に応じてEC2台数を自動で増減させる仕組み、Auto Scaling グループの略称は？",
    answer:"ASG", name:"Auto Scaling Group",
    explain:"ASGは需要に応じスケールアウト/イン。希望/最小/最大台数とポリシーで自動調整する。" },
  { id:"cmp-8", cert:["saa"], domain:"compute", level:2,
    q:"AWS製のARMベースCPUで、価格性能比に優れるプロセッサの名前は？",
    answer:"GRAVITON", name:"AWS Graviton",
    explain:"Graviton(ARM)はコスト性能比に優れる。インスタンス名末尾の'g'がGraviton搭載を示す。" },
  { id:"cmp-9", cert:["saa"], domain:"compute", level:2,
    q:"Kubernetesをマネージドで提供するAWSのコンテナサービスの略称は？",
    answer:"EKS", name:"Amazon EKS (Elastic Kubernetes Service)",
    explain:"EKSはマネージドKubernetes。ECSはAWS独自のオーケストレーションで両者は別物。" }
);

/* ----- ストレージ ----- */
Q.push(
  { id:"st-6", cert:["saa"], domain:"storage", level:2,
    q:"現在の汎用SSD EBSで推奨される、IOPSとスループットを独立指定できる世代の名前は？",
    answer:"GP3", name:"EBS gp3",
    explain:"gp3はgp2の後継。容量と独立してIOPS/スループットを設定でき、コスト効率も良い。" },
  { id:"st-7", cert:["saa"], domain:"storage", level:2,
    q:"S3で誤削除や上書きから守るため、オブジェクトの複数世代を保持する機能を英語1語で？",
    answer:"VERSIONING", name:"S3 バージョニング",
    explain:"バージョニングは過去バージョンを保持し、誤削除/上書きから復旧できる。MFA Deleteと併用も可。" },
  { id:"st-8", cert:["saa"], domain:"storage", level:2,
    q:"古いオブジェクトを一定日数後に別クラスへ移行・削除する自動ルールを英語1語で？",
    answer:"LIFECYCLE", name:"S3 ライフサイクル",
    explain:"ライフサイクルルールでIA/Glacierへの移行や期限切れ削除を自動化しコストを抑える。" },
  { id:"st-9", cert:["clf","saa"], domain:"storage", level:2,
    q:"S3標準の耐久性「イレブンナイン」は9がいくつ並ぶ？数字で答えよ。",
    answer:"11", name:"99.999999999%（イレブンナイン）",
    explain:"S3標準は99.999999999%(9が11個)の耐久性を設計目標とする。" }
);

/* ----- データベース ----- */
Q.push(
  { id:"db-5", cert:["saa"], domain:"database", level:2,
    q:"RDSで読み取り負荷を分散・スケールさせるために追加する非同期コピーを英語2語(続けて)で？",
    answer:"READREPLICA", name:"リードレプリカ",
    explain:"リードレプリカは読み取り専用の非同期複製。読み取りスループットを水平にスケールする。" },
  { id:"db-6", cert:["saa"], domain:"database", level:2,
    q:"RDSで別AZに同期スタンバイを持ち自動フェイルオーバーする高可用構成を英語で(続けて)？",
    answer:"MULTIAZ", name:"Multi-AZ 配置",
    explain:"Multi-AZは可用性向上が目的(性能向上ではない)。障害時に自動でスタンバイへ切替える。" },
  { id:"db-7", cert:["saa"], domain:"database", level:3,
    q:"RDSの自動バックアップで任意の時点に復元できる機能、ポイントインタイムリカバリの略称は？",
    answer:"PITR", name:"PITR (Point-In-Time Recovery)",
    explain:"PITRは保持期間内の任意秒へ復元可能。自動バックアップ+トランザクションログで実現する。" },
  { id:"db-8", cert:["saa"], domain:"database", level:2,
    q:"頻繁な読み取りやセッションをメモリにキャッシュし応答を高速化するマネージドサービスの名前は？",
    answer:"ELASTICACHE", name:"Amazon ElastiCache",
    explain:"ElastiCache(Redis/Memcached)はインメモリキャッシュ。DB負荷軽減とミリ秒未満応答を実現。" },
  { id:"db-9", cert:["saa"], domain:"database", level:3,
    q:"トランザクション処理(更新中心)のワークロード種別を表す略語は？",
    answer:"OLTP", name:"OLTP（オンライントランザクション処理）",
    explain:"OLTPは細かい更新が多い処理(RDS/Aurora向き)。集計中心のOLAPはRedshift向き。" },
  { id:"db-10", cert:["saa"], domain:"database", level:2,
    q:"S3上のデータに標準SQLで直接クエリできる、サーバーレスな分析サービスの名前は？",
    answer:"ATHENA", name:"Amazon Athena",
    explain:"AthenaはS3に対しSQLでクエリするサーバーレスサービス。事前のロード不要で従量課金。" }
);

/* ----- ネットワーク / VPC ----- */
Q.push(
  { id:"net-6", cert:["saa"], domain:"network", level:2,
    q:"「10.0.0.0/16」のようにIPアドレス範囲を表す表記法の略称は？",
    answer:"CIDR", name:"CIDR 表記",
    explain:"CIDRは『アドレス/プレフィックス長』でIP範囲を表す。VPCやサブネットの設計で使う。" },
  { id:"net-7", cert:["saa"], domain:"network", level:2,
    q:"VPCにインターネットへの双方向到達性を与えるゲートウェイの略称は？",
    answer:"IGW", name:"インターネットゲートウェイ",
    explain:"IGWはVPCとインターネットを結ぶ。パブリックサブネットのルートに設定して使う。" },
  { id:"net-8", cert:["saa"], domain:"network", level:2,
    q:"2つのVPCを1対1でプライベート接続する機能を英語1語で？",
    answer:"PEERING", name:"VPC ピアリング",
    explain:"VPCピアリングは2VPC間の非推移的なプライベート接続。多数を束ねるならTransit Gateway。" },
  { id:"net-9", cert:["clf","saa"], domain:"network", level:1,
    q:"HTTPS通信で使われる標準のポート番号は？数字で答えよ。",
    answer:"443", name:"ポート 443 (HTTPS)",
    explain:"HTTPSは443。HTTPは80、SSHは22。セキュリティグループの設計で頻出。" }
);

/* ----- 可用性 / 配信 ----- */
Q.push(
  { id:"sc-5", cert:["clf","saa"], domain:"scaling", level:1,
    q:"需要に応じてリソースを自動で増減できるクラウドの性質を英語1語で？",
    answer:"ELASTICITY", name:"弾力性 (Elasticity)",
    explain:"弾力性は需要に追従して即時に増減できる性質。過剰投資と容量不足の両方を避けられる。" },
  { id:"sc-6", cert:["saa"], domain:"scaling", level:2,
    q:"インスタンスを大きくするのでなく台数を増やすスケール方向を英語1語で(scale ___)?",
    answer:"OUT", name:"スケールアウト (scale out)",
    explain:"スケールアウト(水平)は台数を増やし単一障害点を避け弾力性を高める。垂直はscale up。" },
  { id:"sc-7", cert:["saa"], domain:"scaling", level:3,
    q:"TCP/UDP全般をAWSエッジ網経由で高速化し2つの固定IPを持つサービスの名前は？",
    answer:"GLOBALACCELERATOR", name:"AWS Global Accelerator",
    explain:"Global AcceleratorはAnycastの固定IPでエッジに取り込み、バックボーンで転送。非HTTPも高速化。" }
);

/* ----- アプリ統合 / 疎結合 ----- */
Q.push(
  { id:"int-4", cert:["saa"], domain:"integration", level:2,
    q:"SQSで順序保証と重複排除を行うキュー種別の名前は？",
    answer:"FIFO", name:"FIFO キュー",
    explain:"FIFOは順序保証＋exactly-once処理。標準キューは高スループットだが順序はベストエフォート。" },
  { id:"int-5", cert:["saa"], domain:"integration", level:2,
    q:"処理に繰り返し失敗したメッセージを退避させる、デッドレターキューの略称は？",
    answer:"DLQ", name:"DLQ (Dead Letter Queue)",
    explain:"DLQは処理失敗メッセージの隔離先。原因調査や再処理に使い、本流の詰まりを防ぐ。" },
  { id:"int-6", cert:["saa"], domain:"integration", level:3,
    q:"大量のストリーミングデータをリアルタイム取り込み・処理するサービスの名前は？",
    answer:"KINESIS", name:"Amazon Kinesis",
    explain:"Kinesisはストリーミングデータの収集/処理。ログ/クリックストリーム/IoT等のリアルタイム基盤。" }
);

/* ----- サーバーレス ----- */
Q.push(
  { id:"srv-3", cert:["saa"], domain:"serverless", level:3,
    q:"複数サービスの処理を状態遷移として可視化・連携するワークフロー、ステップ◯◯の英語名(続けて)は？",
    answer:"STEPFUNCTIONS", name:"AWS Step Functions",
    explain:"Step Functionsはステートマシンで処理を定義。リトライ/分岐/並列を組み込みで扱える。" },
  { id:"srv-4", cert:["saa"], domain:"serverless", level:3,
    q:"インフラをコード(テンプレート)で構築・管理するAWSのIaCサービスの名前は？",
    answer:"CLOUDFORMATION", name:"AWS CloudFormation",
    explain:"CloudFormationはテンプレートからリソースを宣言的に構築。再現性のあるIaCを実現する。" }
);

/* ----- セキュリティ ----- */
Q.push(
  { id:"sec-7", cert:["clf","saa"], domain:"security", level:2,
    q:"S3でサーバー側暗号化を指す略語(Server-Side Encryption)は？",
    answer:"SSE", name:"SSE (Server-Side Encryption)",
    explain:"SSEは保管時にサーバー側で暗号化。SSE-S3/SSE-KMS/SSE-Cの方式があり鍵管理が異なる。" },
  { id:"sec-8", cert:["clf","saa"], domain:"security", level:1,
    q:"AWSと顧客で担当範囲を分ける考え方、英語で「Shared ◯◯◯◯ Model」の◯部分(1語)は？",
    answer:"RESPONSIBILITY", name:"責任共有モデル (Shared Responsibility Model)",
    explain:"『クラウドのセキュリティ』はAWS、『クラウド内のセキュリティ』は顧客。境界の理解が重要。" }
);

/* ----- 監視 / 運用 ----- */
Q.push(
  { id:"mon-4", cert:["saa"], domain:"monitoring", level:2,
    q:"複数AWSアカウントを統合管理し、一括請求やSCPを提供するサービスの名前は？",
    answer:"ORGANIZATIONS", name:"AWS Organizations",
    explain:"Organizationsは複数アカウントをOUで階層管理し、一括請求・SCPによるガバナンスを提供。" },
  { id:"mon-5", cert:["saa"], domain:"monitoring", level:2,
    q:"パッチ適用やリモートコマンド、パラメータ管理を統合する運用サービス、システムズ◯◯の略称は？",
    answer:"SSM", name:"AWS Systems Manager (SSM)",
    explain:"SSMはパッチ管理/リモート実行/パラメータストア等の運用機能を統合提供する。" }
);

/* ----- 料金 / 管理 ----- */
Q.push(
  { id:"bil-3", cert:["clf"], domain:"billing", level:1,
    q:"24時間365日の本番サポートが受けられる最小のサポートプラン名(英語1語)は？",
    answer:"BUSINESS", name:"ビジネスサポート",
    explain:"Basicは無料、Developerは営業時間内。24/7の本番サポートはBusiness以上、専任TAMはEnterprise。" },
  { id:"bil-4", cert:["clf"], domain:"billing", level:1,
    q:"課金前に構成の月額費用を見積もる無料ツール、Pricing ◯◯◯◯◯◯◯◯◯◯(英語1語)は？",
    answer:"CALCULATOR", name:"AWS Pricing Calculator",
    explain:"Pricing Calculatorは構成から月額見積りを作成する無料ツール。提案や予算策定に使う。" },
  { id:"bil-5", cert:["clf"], domain:"billing", level:2,
    q:"コストを部門/プロジェクト別に按分・可視化するためにリソースへ付ける『◯◯◯』(英語1語)は？",
    answer:"TAGS", name:"コスト配分タグ",
    explain:"タグでリソースを分類し、コスト配分タグを有効化すると部門/用途別にコストを分析できる。" }
);

/* ----- 設計 / 全体像 ----- */
Q.push(
  { id:"wa-1", cert:["clf","saa"], domain:"warch", level:1,
    q:"Well-Architectedフレームワークの『柱』はいくつ？数字で答えよ。",
    answer:"6", name:"6本の柱",
    explain:"運用上の優秀性/セキュリティ/信頼性/パフォーマンス効率/コスト最適化/持続可能性の6本。" },
  { id:"wa-2", cert:["saa"], domain:"warch", level:2,
    q:"冗長化されておらず、そこが壊れると全体が止まる箇所、単一障害点の略称は？",
    answer:"SPOF", name:"SPOF (Single Point Of Failure)",
    explain:"SPOFは単一障害点。多重化や複数AZ配置で排除し、信頼性を高めるのが設計の基本。" },
  { id:"wa-3", cert:["saa"], domain:"warch", level:3,
    q:"災害復旧で『どれだけ前の時点まで戻ってよいか(データ損失許容)』を表す目標値の略称は？",
    answer:"RPO", name:"RPO (Recovery Point Objective)",
    explain:"RPOは許容データ損失量(時点)。RTOは許容復旧時間。両者でDR戦略のコストと要件が決まる。" },
  { id:"wa-4", cert:["clf","saa"], domain:"warch", level:1,
    q:"複数のデータセンター群からなり、AZを内包するAWSの最上位の地理区分を英語1語で？",
    answer:"REGION", name:"リージョン",
    explain:"リージョンは地理的領域で複数AZを含む。AZの中に1つ以上のデータセンターが存在する。" },
  { id:"wa-5", cert:["saa"], domain:"warch", level:2,
    q:"コンポーネントの障害が波及しないよう独立させる設計、英語で『◯◯◯◯◯ coupling』の◯(1語)は？",
    answer:"LOOSE", name:"疎結合 (loose coupling)",
    explain:"疎結合はSQS/SNS等で依存を弱める設計。片方の障害や負荷が他へ波及しにくくなる。" }
);
