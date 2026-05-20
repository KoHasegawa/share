/* AWS 早押しクイズ — 問題バンク (CLF / SAA)
 *
 * フィールド:
 *   id       : 一意ID
 *   cert     : 対象資格 ["clf"] / ["saa"] / ["clf","saa"]
 *   domain   : 分野ID (DOMAINS と対応)
 *   level    : 1=易 2=中 3=難
 *   q        : 問題文 (早押しでは1文字ずつ表示)
 *   choices  : 選択肢 (4つ)
 *   a        : 正解インデックス (0-3)
 *   explain  : 解説
 */
window.AWSQUIZ = window.AWSQUIZ || { domains: [], questions: [] };

window.AWSQUIZ.domains = [
  { id: "iam",        emoji: "🔐", name: "IAM / 認証認可" },
  { id: "compute",    emoji: "🖥",  name: "コンピューティング" },
  { id: "storage",    emoji: "💾", name: "ストレージ" },
  { id: "database",   emoji: "🛢", name: "データベース" },
  { id: "network",    emoji: "🌐", name: "ネットワーク / VPC" },
  { id: "scaling",    emoji: "⚖",  name: "可用性 / スケーリング / 配信" },
  { id: "integration",emoji: "📨", name: "アプリ統合 / 疎結合" },
  { id: "serverless", emoji: "⚡", name: "サーバーレス" },
  { id: "security",   emoji: "🛡",  name: "セキュリティ / 暗号化" },
  { id: "monitoring", emoji: "📈", name: "監視 / 運用 / ガバナンス" },
  { id: "billing",    emoji: "💵", name: "料金 / サポート / 全体像" },
  { id: "warch",      emoji: "🏛",  name: "Well-Architected / 設計原則" },
];

const Q = window.AWSQUIZ.questions;

/* ===================== IAM / 認証認可 ===================== */
Q.push(
  { id:"iam-1", cert:["clf","saa"], domain:"iam", level:1,
    q:"AWSアカウント作成時に自動で作られ、すべての操作が可能なため日常利用を避けるべき認証情報は？",
    choices:["ルートユーザー","IAMユーザー","IAMロール","アクセスキー"], a:0,
    explain:"ルートユーザーは全権限を持つ。MFAを有効化し金庫にしまい、日常はIAMユーザー/ロールを使うのがベストプラクティス。" },
  { id:"iam-2", cert:["clf","saa"], domain:"iam", level:1,
    q:"EC2インスタンス上のアプリにS3へのアクセス権を渡す際、アクセスキーを埋め込まずに推奨される方法は？",
    choices:["IAMロールをインスタンスにアタッチ","ルートのアクセスキーを使う","IAMユーザーのパスワードを共有","セキュリティグループで許可"], a:0,
    explain:"EC2にはIAMロール(インスタンスプロファイル)を付与する。一時認証情報が自動で配布・ローテーションされ、キーの漏洩リスクがない。" },
  { id:"iam-3", cert:["clf","saa"], domain:"iam", level:1,
    q:"複数のIAMユーザーに同じ権限をまとめて付与・管理するのに最も適した仕組みは？",
    choices:["IAMグループ","IAMロール","SCP","タグ"], a:0,
    explain:"IAMグループにポリシーを付け、ユーザーを所属させる。個々のユーザーに個別付与するより管理が容易。" },
  { id:"iam-4", cert:["clf","saa"], domain:"iam", level:2,
    q:"権限の最終判定で、明示的なDenyと明示的なAllowが衝突した場合に優先されるのは？",
    choices:["明示的Deny","明示的Allow","新しく評価された方","リソース側の設定"], a:0,
    explain:"IAMの評価ロジックでは明示的Denyが常に最優先。デフォルトは暗黙Deny、Allowで許可、しかしDenyがあれば必ず拒否。" },
  { id:"iam-5", cert:["saa"], domain:"iam", level:2,
    q:"別AWSアカウントのユーザーに自社リソースへの一時アクセスを与える、クロスアカウントで最も適切な方法は？",
    choices:["IAMロールをAssumeRoleで引き受けさせる","IAMユーザーを相手に作って渡す","ルートのアクセスキーを共有","パブリックアクセスを有効化"], a:0,
    explain:"信頼ポリシーで相手アカウントを許可したIAMロールを用意し、STS AssumeRoleで一時認証情報を取得させる。キー共有は不要。" },
  { id:"iam-6", cert:["clf","saa"], domain:"iam", level:1,
    q:"ログイン時にパスワードに加えて使い捨てコード等を要求し、不正ログインを防ぐ機能は？",
    choices:["MFA(多要素認証)","IAMポリシー","KMS","CloudTrail"], a:0,
    explain:"MFAはパスワード+所持/生体要素で認証を強化。特にルートユーザーでは必ず有効化が推奨される。" },
  { id:"iam-7", cert:["saa"], domain:"iam", level:2,
    q:"AWS Organizations配下のアカウント群に対し、許可される操作の上限(ガードレール)を一括設定する機能は？",
    choices:["SCP(サービスコントロールポリシー)","IAMグループ","アクセス許可境界","リソースポリシー"], a:0,
    explain:"SCPはOU/アカウントに適用する上限ポリシー。SCPで許可されていない操作はIAMで許可しても実行できない。" }
);

/* ===================== コンピューティング ===================== */
Q.push(
  { id:"cmp-1", cert:["clf","saa"], domain:"compute", level:1,
    q:"使った分だけ秒/時間単位で課金され、いつでも起動・停止できる仮想サーバーのサービスは？",
    choices:["Amazon EC2","AWS Lambda","Amazon S3","Amazon RDS"], a:0,
    explain:"EC2は再販可能な仮想サーバー。オンデマンドでは使用量に応じて課金される。" },
  { id:"cmp-2", cert:["clf","saa"], domain:"compute", level:1,
    q:"最大の割引(最大90%)が得られるが、AWS側の都合で中断される可能性があるEC2の購入オプションは？",
    choices:["スポットインスタンス","オンデマンド","リザーブドインスタンス","Dedicated Host"], a:0,
    explain:"スポットは余剰キャパを安価に利用。中断耐性のあるバッチ/ステートレス処理向き。中断は2分前に通知される。" },
  { id:"cmp-3", cert:["clf","saa"], domain:"compute", level:2,
    q:"1〜3年の利用を確約することで大幅割引を受けられ、長期安定稼働のサーバーに向く購入オプションは？",
    choices:["リザーブドインスタンス / Savings Plans","スポット","オンデマンド","ハードウェア専有"], a:0,
    explain:"RIやSavings Plansは1/3年コミットで割引。常時稼働の本番ワークロードに最適。" },
  { id:"cmp-4", cert:["clf","saa"], domain:"compute", level:1,
    q:"サーバーの管理不要でコードを実行し、実行時間とリクエスト数だけで課金されるサービスは？",
    choices:["AWS Lambda","Amazon EC2","AWS Batch","Elastic Beanstalk"], a:0,
    explain:"Lambdaはサーバーレス。イベント駆動でコードを実行し、アイドル時は課金されない。" },
  { id:"cmp-5", cert:["saa"], domain:"compute", level:2,
    q:"Dockerコンテナをサーバー(EC2)管理なしで実行したい。最もサーバーレスに近い実行基盤は？",
    choices:["AWS Fargate","Amazon EC2","Amazon Lightsail","AWS Batch on EC2"], a:0,
    explain:"FargateはECS/EKSのサーバーレス起動タイプ。EC2インスタンスを管理せずコンテナを実行できる。" },
  { id:"cmp-6", cert:["clf"], domain:"compute", level:1,
    q:"小規模Webサイトを定額・簡単に立ち上げたい初心者向けの、まとめて使えるサービスは？",
    choices:["Amazon Lightsail","Amazon EC2","AWS Outposts","AWS Batch"], a:0,
    explain:"Lightsailは仮想サーバー+ストレージ+ネットワークを定額で提供する、シンプルな入門向けサービス。" },
  { id:"cmp-7", cert:["saa"], domain:"compute", level:2,
    q:"Auto Scalingグループで複数AZにインスタンスを分散させる主な目的は？",
    choices:["可用性向上(単一AZ障害に耐える)","課金を下げる","レイテンシをゼロにする","暗号化のため"], a:0,
    explain:"複数AZへ分散すると、1つのAZが障害でもサービス継続が可能。高可用性設計の基本。" }
);

/* ===================== ストレージ ===================== */
Q.push(
  { id:"st-1", cert:["clf","saa"], domain:"storage", level:1,
    q:"容量無制限・99.999999999%(イレブンナイン)の耐久性を持つオブジェクトストレージは？",
    choices:["Amazon S3","Amazon EBS","Amazon EFS","Amazon FSx"], a:0,
    explain:"S3はオブジェクトストレージで11ナインの耐久性。静的ファイル、バックアップ、データレイクなどに利用。" },
  { id:"st-2", cert:["clf","saa"], domain:"storage", level:1,
    q:"EC2インスタンスにアタッチして使う、単一AZ内のブロックストレージは？",
    choices:["Amazon EBS","Amazon S3","Amazon Glacier","Amazon EFS"], a:0,
    explain:"EBSはEC2にアタッチするブロックボリューム。同一AZ内に複製され、スナップショットはS3に保存される。" },
  { id:"st-3", cert:["saa"], domain:"storage", level:2,
    q:"複数のEC2インスタンスから同時にマウントできる、フルマネージドな共有ファイルシステムは？",
    choices:["Amazon EFS","Amazon EBS","インスタンスストア","S3 Glacier"], a:0,
    explain:"EFSはNFSベースで複数インスタンスから同時アクセス可能。複数AZにまたがり自動でスケールする。" },
  { id:"st-4", cert:["clf","saa"], domain:"storage", level:2,
    q:"ほとんどアクセスしないアーカイブデータを最安で長期保管するのに適したS3ストレージクラスは？",
    choices:["S3 Glacier Deep Archive","S3 Standard","S3 Standard-IA","S3 One Zone-IA"], a:0,
    explain:"Glacier Deep Archiveは取り出しに時間がかかる代わり最安。コンプライアンス用の長期保管に最適。" },
  { id:"st-5", cert:["saa"], domain:"storage", level:2,
    q:"アクセス頻度が読めないデータで、自動的に最適なクラスへ移して費用を抑えるS3クラスは？",
    choices:["S3 Intelligent-Tiering","S3 Standard","S3 Glacier","S3 One Zone-IA"], a:0,
    explain:"Intelligent-Tieringはアクセスパターンを監視して自動でアクセス層/低頻度層へ移動。予測困難なワークロード向き。" },
  { id:"st-6", cert:["saa"], domain:"storage", level:2,
    q:"古いオブジェクトを一定日数後に自動で別クラスへ移行・削除するS3の機能は？",
    choices:["ライフサイクルポリシー","バージョニング","レプリケーション","イベント通知"], a:0,
    explain:"ライフサイクルルールで『30日後にIA、365日後にGlacier、730日後に削除』のような自動管理ができる。" },
  { id:"st-7", cert:["clf","saa"], domain:"storage", level:1,
    q:"オンプレミスから大容量データをAWSへ物理デバイスで移送するサービス(ペタバイト級)は？",
    choices:["AWS Snowball","AWS DataSync","Direct Connect","S3 Transfer Acceleration"], a:0,
    explain:"Snowball/Snowファミリは物理アプライアンスでデータを輸送。回線が細い/超大容量の移行に有効。" }
);

/* ===================== データベース ===================== */
Q.push(
  { id:"db-1", cert:["clf","saa"], domain:"database", level:1,
    q:"MySQLやPostgreSQLなどのリレーショナルDBを、パッチ/バックアップ込みでマネージド提供するサービスは？",
    choices:["Amazon RDS","Amazon DynamoDB","Amazon Redshift","Amazon ElastiCache"], a:0,
    explain:"RDSはリレーショナルDBのマネージドサービス。OS/DBのパッチ、バックアップ、Multi-AZを自動化する。" },
  { id:"db-2", cert:["clf","saa"], domain:"database", level:1,
    q:"ミリ秒未満の応答とほぼ無制限のスケールを持つ、フルマネージドなNoSQL(キーバリュー)DBは？",
    choices:["Amazon DynamoDB","Amazon RDS","Amazon Aurora","Amazon Neptune"], a:0,
    explain:"DynamoDBはサーバーレスNoSQL。任意規模で一桁ミリ秒の応答。スキーマレスでスパイクに強い。" },
  { id:"db-3", cert:["saa"], domain:"database", level:2,
    q:"RDSで書き込みプライマリの障害時に自動フェイルオーバーし、可用性を高める構成は？",
    choices:["Multi-AZ配置","リードレプリカ","シングルAZ+スナップショット","スタンバイなしのクラスタ"], a:0,
    explain:"Multi-AZは別AZに同期スタンバイを保持し、障害時に自動フェイルオーバー。可用性向上が目的(性能向上ではない)。" },
  { id:"db-4", cert:["saa"], domain:"database", level:2,
    q:"RDSで読み取り負荷を分散・スケールさせたいときに追加するものは？",
    choices:["リードレプリカ","Multi-AZスタンバイ","スナップショット","Auto Scalingグループ"], a:0,
    explain:"リードレプリカは非同期複製の読み取り専用コピー。読み取りスループットを水平にスケールできる(最大15)。" },
  { id:"db-5", cert:["saa"], domain:"database", level:2,
    q:"DBへの繰り返しクエリ結果やセッションをメモリにキャッシュし、レイテンシを下げるサービスは？",
    choices:["Amazon ElastiCache","Amazon RDS","Amazon Athena","Amazon EMR"], a:0,
    explain:"ElastiCache(Redis/Memcached)はインメモリキャッシュ。読み取り負荷の軽減とミリ秒未満応答を実現。" },
  { id:"db-6", cert:["clf","saa"], domain:"database", level:2,
    q:"ペタバイト級のデータを高速集計するためのフルマネージドなデータウェアハウスは？",
    choices:["Amazon Redshift","Amazon DynamoDB","Amazon RDS","Amazon Aurora"], a:0,
    explain:"Redshiftは列指向の分析用DWH。OLAP(集計/BI)向けで、トランザクション処理(OLTP)用途とは異なる。" },
  { id:"db-7", cert:["saa"], domain:"database", level:2,
    q:"MySQL/PostgreSQL互換で、標準の最大5倍/3倍の性能とストレージ自動拡張を持つAWS独自DBは？",
    choices:["Amazon Aurora","Amazon DynamoDB","Amazon Neptune","Amazon DocumentDB"], a:0,
    explain:"AuroraはAWS製のクラウドネイティブRDB。6つの複製を3AZに保持し、高性能・高可用。" }
);

/* ===================== ネットワーク / VPC ===================== */
Q.push(
  { id:"net-1", cert:["clf","saa"], domain:"network", level:1,
    q:"AWS上に論理的に分離した自分専用の仮想ネットワーク空間を作るサービスは？",
    choices:["Amazon VPC","AWS Direct Connect","Amazon Route 53","AWS Transit Gateway"], a:0,
    explain:"VPCは仮想プライベートクラウド。サブネット、ルートテーブル、ゲートウェイ等を自分で設計できる。" },
  { id:"net-2", cert:["saa"], domain:"network", level:2,
    q:"インスタンス単位で適用され、ステートフルに通信を許可するファイアウォールは？",
    choices:["セキュリティグループ","ネットワークACL","WAF","NATゲートウェイ"], a:0,
    explain:"セキュリティグループはENI(インスタンス)単位・ステートフルで許可ルールのみ。NACLはサブネット単位・ステートレスで許可/拒否両方。" },
  { id:"net-3", cert:["saa"], domain:"network", level:2,
    q:"サブネット単位で適用され、許可と拒否の両方をステートレスで設定できる制御は？",
    choices:["ネットワークACL","セキュリティグループ","IAMポリシー","ルートテーブル"], a:0,
    explain:"NACLはサブネット境界のステートレスFW。戻り通信も明示的に許可が必要。SGの補助層として使う。" },
  { id:"net-4", cert:["saa"], domain:"network", level:2,
    q:"プライベートサブネットのインスタンスからインターネットへ送信(アウトバウンド)させるが、外部からの開始接続は防ぐには？",
    choices:["NATゲートウェイ","インターネットゲートウェイ","VPCピアリング","VPCエンドポイント"], a:0,
    explain:"NAT GWは内→外の通信を可能にしつつ外→内の開始接続を遮断。IGWはパブリックサブネット用で双方向の到達性を持つ。" },
  { id:"net-5", cert:["saa"], domain:"network", level:2,
    q:"VPC内からインターネットを経由せずにS3やDynamoDBへ接続するための仕組みは？",
    choices:["VPCエンドポイント","NATゲートウェイ","インターネットゲートウェイ","Direct Connect"], a:0,
    explain:"VPCエンドポイント(Gateway/Interface)でAWSサービスへプライベート接続。データ転送がインターネットを通らず安全。" },
  { id:"net-6", cert:["clf","saa"], domain:"network", level:2,
    q:"オンプレミスとAWSの間に専用線で安定した低レイテンシ接続を確立するサービスは？",
    choices:["AWS Direct Connect","Site-to-Site VPN","Transit Gateway","CloudFront"], a:0,
    explain:"Direct Connectは専用線接続で帯域と品質が安定。VPNはインターネット経由で安価だが品質はベストエフォート。" },
  { id:"net-7", cert:["clf","saa"], domain:"network", level:1,
    q:"ドメイン名の名前解決(DNS)とドメイン登録、ヘルスチェックを行うサービスは？",
    choices:["Amazon Route 53","Amazon CloudFront","Amazon VPC","AWS Global Accelerator"], a:0,
    explain:"Route 53はマネージドDNS。レイテンシ/加重/フェイルオーバー等のルーティングポリシーを提供する。" }
);

/* ===================== 可用性 / スケーリング / 配信 ===================== */
Q.push(
  { id:"sc-1", cert:["clf","saa"], domain:"scaling", level:1,
    q:"複数のEC2インスタンスへトラフィックを分散し、異常なインスタンスを切り離すサービスは？",
    choices:["Elastic Load Balancing","Auto Scaling","CloudFront","Route 53"], a:0,
    explain:"ELBは受信トラフィックを正常なターゲットへ分散。ヘルスチェックで異常を検知し振り分けから外す。" },
  { id:"sc-2", cert:["saa"], domain:"scaling", level:2,
    q:"HTTP/HTTPSのパスやホスト名で振り分ける(レイヤー7)ロードバランサーは？",
    choices:["Application Load Balancer","Network Load Balancer","Gateway Load Balancer","Classic Load Balancer"], a:0,
    explain:"ALBはL7でパス/ホストベースルーティングが可能。NLBはL4で超低レイテンシ・固定IPが必要な場合に使う。" },
  { id:"sc-3", cert:["clf","saa"], domain:"scaling", level:1,
    q:"負荷に応じてEC2インスタンス数を自動で増減し、コストと可用性を両立する機能は？",
    choices:["Auto Scaling","Elastic Load Balancing","CloudWatch","Lambda"], a:0,
    explain:"Auto Scalingは需要に応じてスケールアウト/インを自動化。過剰プロビジョニングを避けつつ可用性を維持する。" },
  { id:"sc-4", cert:["clf","saa"], domain:"scaling", level:1,
    q:"世界中のエッジロケーションから静的/動的コンテンツを低レイテンシで配信するCDNは？",
    choices:["Amazon CloudFront","Amazon S3","AWS Global Accelerator","Route 53"], a:0,
    explain:"CloudFrontはエッジでコンテンツをキャッシュ配信。オリジン負荷軽減とユーザー近接配信を実現する。" },
  { id:"sc-5", cert:["saa"], domain:"scaling", level:3,
    q:"非HTTPの全トラフィックをAWSのエッジ網経由で最寄り入口に取り込み、グローバルに高速化する固定IPサービスは？",
    choices:["AWS Global Accelerator","Amazon CloudFront","Route 53レイテンシルーティング","Transit Gateway"], a:0,
    explain:"Global AcceleratorはAnycastの2つの固定IPでエッジに入れ、AWSバックボーンで転送。TCP/UDP全般を高速化する。" },
  { id:"sc-6", cert:["saa"], domain:"scaling", level:2,
    q:"独立して障害を許容する設計の基本単位として、複数を跨いでデプロイすべきものは？",
    choices:["アベイラビリティゾーン(AZ)","リージョン","エッジロケーション","サブネット番号"], a:0,
    explain:"1リージョン内の複数AZにデプロイすると、AZ単位の障害に耐える高可用構成になる。" }
);

/* ===================== アプリ統合 / 疎結合 ===================== */
Q.push(
  { id:"int-1", cert:["clf","saa"], domain:"integration", level:1,
    q:"コンポーネント間でメッセージを一時保管し、処理を非同期・疎結合にするフルマネージドなキューサービスは？",
    choices:["Amazon SQS","Amazon SNS","Amazon Kinesis","AWS Step Functions"], a:0,
    explain:"SQSはメッセージキュー。送信側と受信側を分離し、急な負荷をバッファして処理を平準化する。" },
  { id:"int-2", cert:["clf","saa"], domain:"integration", level:2,
    q:"1つのメッセージを複数の購読者(メール/Lambda/SQS等)へ同時に配信するパブサブ型サービスは？",
    choices:["Amazon SNS","Amazon SQS","Amazon MQ","AWS Batch"], a:0,
    explain:"SNSはpub/sub。1つのトピックへの発行を多数のサブスクライバーへファンアウトできる。SQSと組み合わせる構成が定番。" },
  { id:"int-3", cert:["saa"], domain:"integration", level:2,
    q:"SQSで『同じ順序・重複なし』を厳密に保証したい場合に選ぶキュー種別は？",
    choices:["FIFOキュー","標準キュー","遅延キュー","デッドレターキュー"], a:0,
    explain:"FIFOキューは順序保証と重複排除(exactly-once)を提供。標準キューは高スループットだが順序はベストエフォート。" },
  { id:"int-4", cert:["saa"], domain:"integration", level:3,
    q:"複数のLambdaやサービスを状態遷移として可視化・オーケストレーションするワークフローサービスは？",
    choices:["AWS Step Functions","Amazon SQS","Amazon EventBridge","Amazon SWF"], a:0,
    explain:"Step Functionsはステートマシンで処理フローを定義。リトライ/分岐/並列を組み込みで管理できる。" },
  { id:"int-5", cert:["saa"], domain:"integration", level:2,
    q:"多数のSaaS/AWSサービスのイベントをルールでフィルタし、ターゲットへ配送するイベントバスは？",
    choices:["Amazon EventBridge","Amazon SQS","AWS Step Functions","Amazon Kinesis Data Streams"], a:0,
    explain:"EventBridgeはイベント駆動アーキの中核。イベントパターンでルーティングし、サードパーティ連携も容易。" }
);

/* ===================== サーバーレス ===================== */
Q.push(
  { id:"srv-1", cert:["saa"], domain:"serverless", level:2,
    q:"REST/HTTP APIを作成・公開し、認可・スロットリング・キャッシュを担うフルマネージドサービスは？",
    choices:["Amazon API Gateway","Elastic Load Balancing","AWS AppSync","CloudFront"], a:0,
    explain:"API GatewayはAPIのフロントドア。Lambdaや各種バックエンドへルーティングし、認証/レート制限/キャッシュを提供。" },
  { id:"srv-2", cert:["saa"], domain:"serverless", level:2,
    q:"Lambda + DynamoDB + API Gatewayのような構成が代表する、サーバー管理不要のアーキテクチャを何と呼ぶ?",
    choices:["サーバーレスアーキテクチャ","モノリス","オンプレミスハイブリッド","リフト&シフト"], a:0,
    explain:"サーバーレスはインフラ運用をAWSに任せ、コードとデータに集中。需要に応じ自動スケールし、アイドルは無課金。" },
  { id:"srv-3", cert:["clf"], domain:"serverless", level:1,
    q:"サーバーレスとは何が『不要』になることを主に指す?",
    choices:["サーバーのプロビジョニング/管理","プログラムコード","データの保存","ネットワーク設計のすべて"], a:0,
    explain:"サーバーレスはサーバーを意識せずに済む実行モデル。実際の物理サーバーはAWSが管理しており、利用者は運用から解放される。" },
  { id:"srv-4", cert:["saa"], domain:"serverless", level:2,
    q:"Lambda関数のコードに環境変数で渡したDB資格情報を、より安全に管理・自動ローテーションするサービスは？",
    choices:["AWS Secrets Manager","Amazon S3","AWS CloudTrail","Amazon CloudWatch Logs"], a:0,
    explain:"Secrets Managerは資格情報を暗号化保存し、自動ローテーションを提供。コードにシークレットを直書きしない。" }
);

/* ===================== セキュリティ / 暗号化 ===================== */
Q.push(
  { id:"sec-1", cert:["clf","saa"], domain:"security", level:1,
    q:"暗号鍵の作成・管理・利用を一元化し、多くのAWSサービスと統合される鍵管理サービスは？",
    choices:["AWS KMS","AWS Shield","Amazon Macie","AWS WAF"], a:0,
    explain:"KMSはマネージド鍵管理。S3/EBS/RDS等の保管時暗号化と統合し、CloudTrailで鍵の利用も記録できる。" },
  { id:"sec-2", cert:["clf","saa"], domain:"security", level:1,
    q:"SQLインジェクションやXSSなどWebアプリへの攻撃をルールでブロックするサービスは？",
    choices:["AWS WAF","AWS Shield","Amazon Inspector","Amazon GuardDuty"], a:0,
    explain:"WAFはL7のWebアプリケーションファイアウォール。CloudFront/ALB/API Gatewayに適用し悪意あるリクエストを遮断。" },
  { id:"sec-3", cert:["clf","saa"], domain:"security", level:2,
    q:"DDoS攻撃からの保護を提供し、Standardは無料で全顧客に適用されるサービスは？",
    choices:["AWS Shield","AWS WAF","Amazon GuardDuty","AWS Config"], a:0,
    explain:"Shield StandardはL3/L4のDDoS防御を無償提供。Advancedは有償で高度な防御とコスト保護、24時間対応を追加。" },
  { id:"sec-4", cert:["saa"], domain:"security", level:2,
    q:"VPCフローログやCloudTrail等を機械学習で分析し、不審なアクティビティを検知する脅威検知サービスは？",
    choices:["Amazon GuardDuty","AWS WAF","AWS Shield","Amazon Macie"], a:0,
    explain:"GuardDutyはログを継続分析し、異常な振る舞いや既知の脅威を検知するマネージド脅威検知サービス。" },
  { id:"sec-5", cert:["saa"], domain:"security", level:2,
    q:"S3内の個人情報(PII)など機微データを機械学習で発見・分類するサービスは？",
    choices:["Amazon Macie","Amazon GuardDuty","AWS Inspector","AWS Config"], a:0,
    explain:"MacieはS3の機微データ(クレジットカード番号やPII)を検出・分類し、データ保護のリスクを可視化する。" },
  { id:"sec-6", cert:["clf","saa"], domain:"security", level:2,
    q:"物理データセンターの安全やハードウェアはAWS、OS設定やデータ暗号化は顧客が担う、責任分担の考え方は？",
    choices:["責任共有モデル","Well-Architected","最小権限の原則","フォールトトレランス"], a:0,
    explain:"責任共有モデルでは『クラウドのセキュリティ』はAWS、『クラウド内のセキュリティ』は顧客が担う。" }
);

/* ===================== 監視 / 運用 / ガバナンス ===================== */
Q.push(
  { id:"mon-1", cert:["clf","saa"], domain:"monitoring", level:1,
    q:"メトリクス・ログ・アラームでAWSリソースとアプリのパフォーマンスを監視するサービスは？",
    choices:["Amazon CloudWatch","AWS CloudTrail","AWS Config","AWS Trusted Advisor"], a:0,
    explain:"CloudWatchはメトリクス収集、ログ集約、アラーム、ダッシュボードを提供する監視サービス。" },
  { id:"mon-2", cert:["clf","saa"], domain:"monitoring", level:2,
    q:"『誰が・いつ・どのAPIを呼んだか』を記録し、監査やトラブルシュートに使うサービスは？",
    choices:["AWS CloudTrail","Amazon CloudWatch","AWS Config","Amazon Inspector"], a:0,
    explain:"CloudTrailはアカウント内のAPIコール履歴を記録する監査ログ。CloudWatchは性能監視で目的が異なる。" },
  { id:"mon-3", cert:["saa"], domain:"monitoring", level:2,
    q:"リソースの構成変更を時系列で記録し、あるべき設定(コンプライアンス)から逸脱していないか評価するサービスは？",
    choices:["AWS Config","AWS CloudTrail","Amazon CloudWatch","AWS Systems Manager"], a:0,
    explain:"Configはリソース構成の変更履歴と準拠性評価を行う。CloudTrailはAPI操作の記録で役割が違う。" },
  { id:"mon-4", cert:["clf","saa"], domain:"monitoring", level:1,
    q:"コスト最適化・セキュリティ・耐障害性・サービス制限などをチェックし改善提案する助言ツールは？",
    choices:["AWS Trusted Advisor","AWS Config","Amazon Inspector","AWS Health Dashboard"], a:0,
    explain:"Trusted Advisorは5つの柱でベストプラクティスを点検し推奨事項を提示する。" },
  { id:"mon-5", cert:["saa"], domain:"monitoring", level:2,
    q:"EC2やコンテナ上の多数のサーバーにパッチ適用やコマンド実行をエージェント経由で一元管理するサービスは？",
    choices:["AWS Systems Manager","AWS Config","Amazon CloudWatch","AWS OpsWorks"], a:0,
    explain:"Systems Manager(SSM)はパッチ管理、リモート実行、パラメータストア等の運用機能を統合提供する。" }
);

/* ===================== 料金 / サポート / 全体像 ===================== */
Q.push(
  { id:"bil-1", cert:["clf"], domain:"billing", level:1,
    q:"クラウドの基本的なコストの考え方として正しいのは？",
    choices:["先行投資(CapEx)から使った分だけ払う従量課金(OpEx)へ","常に定額で使い放題","無料でいくらでも使える","契約期間中は解約不可"], a:0,
    explain:"クラウドは初期投資を抑え、使用量に応じて支払う従量課金が基本。需要に合わせ柔軟に増減できる。" },
  { id:"bil-2", cert:["clf"], domain:"billing", level:1,
    q:"組織全体のコストと使用状況を可視化・分析し、将来予測もできる無料ツールは？",
    choices:["AWS Cost Explorer","AWS Budgets","CUR(コスト/使用状況レポート)","Trusted Advisor"], a:0,
    explain:"Cost Explorerはコストの傾向をグラフで分析。Budgetsは閾値超過のアラート用途で、組み合わせて使う。" },
  { id:"bil-3", cert:["clf"], domain:"billing", level:1,
    q:"予算額を設定し、超過しそうな時にアラート通知するサービスは？",
    choices:["AWS Budgets","Cost Explorer","Trusted Advisor","Pricing Calculator"], a:0,
    explain:"Budgetsはコスト/使用量の予算と閾値を設定し、超過(または予測超過)時に通知する。" },
  { id:"bil-4", cert:["clf"], domain:"billing", level:2,
    q:"複数アカウントの請求をまとめ、ボリューム割引や一括支払いを可能にするOrganizationsの機能は？",
    choices:["一括請求(Consolidated Billing)","SCP","リザーブドインスタンス","タグ付け"], a:0,
    explain:"一括請求で支払いを集約し、使用量を合算してボリューム割引やRI/SP共有のメリットを得られる。" },
  { id:"bil-5", cert:["clf"], domain:"billing", level:2,
    q:"24時間365日のテクニカルサポートやインフライベント管理を含む、本番ワークロード向けの代表的サポートプランは？",
    choices:["ビジネス / エンタープライズ","ベーシック(無料)","デベロッパー","開発者プレビュー"], a:0,
    explain:"Basicは無料(ドキュメント/フォーラム中心)、Developerは営業時間内。本番はBusiness以上、専任TAMはEnterprise。" },
  { id:"bil-6", cert:["clf"], domain:"billing", level:1,
    q:"AWSの地理的な独立領域で、複数のAZを含む最上位の区分は？",
    choices:["リージョン","アベイラビリティゾーン","エッジロケーション","VPC"], a:0,
    explain:"リージョンは地理的な領域で、各リージョンに複数のAZがある。AZの中に1つ以上のデータセンターが存在する。" }
);

/* ===================== Well-Architected / 設計原則 ===================== */
Q.push(
  { id:"wa-1", cert:["clf","saa"], domain:"warch", level:1,
    q:"Well-Architectedフレームワークの『柱』に含まれないものは次のうちどれ？",
    choices:["市場シェア","運用上の優秀性","セキュリティ","コスト最適化"], a:0,
    explain:"6本の柱は運用上の優秀性/セキュリティ/信頼性/パフォーマンス効率/コスト最適化/持続可能性。市場シェアは含まれない。" },
  { id:"wa-2", cert:["saa"], domain:"warch", level:2,
    q:"システムをコンポーネントに分割し、互いの障害が波及しないようにする設計原則は？",
    choices:["疎結合(疎なカップリング)","密結合","垂直スケーリング一択","単一障害点の集約"], a:0,
    explain:"SQS/SNS等で疎結合にすると、片方の障害や負荷増が他へ波及しにくく、独立してスケール/復旧できる。" },
  { id:"wa-3", cert:["saa"], domain:"warch", level:2,
    q:"インスタンスを大きくする(垂直)のではなく台数を増やす(水平)スケーリングが推奨される主因は？",
    choices:["単一障害点を避け弾力性を高められる","常に安いから","設定が一切不要だから","暗号化が自動になるから"], a:0,
    explain:"水平スケールは複数台に分散でき、単一障害点の回避と需要追従(弾力性)に優れる。クラウド設計の基本姿勢。" },
  { id:"wa-4", cert:["saa"], domain:"warch", level:2,
    q:"必要最小限の権限だけを与えるセキュリティの基本原則を何と呼ぶ?",
    choices:["最小権限の原則","フェイルオープン","オープンデフォルト","信頼するが検証しない"], a:0,
    explain:"最小権限の原則は、職務に必要な権限だけを付与しリスクを最小化する。IAM設計の根幹。" },
  { id:"wa-5", cert:["clf","saa"], domain:"warch", level:1,
    q:"クラウドの利点である『弾力性(Elasticity)』を最もよく表すのは？",
    choices:["需要に応じて自動で増減できる","一度買えば固定容量で運用","常に最大容量を確保する","容量変更に数週間かかる"], a:0,
    explain:"弾力性は需要に応じてリソースを即時に増減できる性質。過剰投資と容量不足の両方を避けられる。" }
);
