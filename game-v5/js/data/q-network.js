/* データ転送 / VPC / NAT GW / Endpoint — 60+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== Inbound / Outbound 基礎 =====
  { id: "net-001", topic: "network", type: "single", difficulty: 1,
    q: "インターネットから AWS リージョン内へのデータ転送 (Inbound) の料金は？",
    choices: [
      "基本的に無料",
      "GB あたり一律 $0.09",
      "リージョンによって $0.01〜$0.05",
      "全リージョンで $0.02"
    ],
    a: 0,
    explain: "AWS への Inbound は無料が基本。逆に Outbound (Internet 向けエグレス) は GB 単価で課金される。"
  },
  { id: "net-002", topic: "network", type: "single", difficulty: 1,
    q: "リージョン内・同一 AZ 内・プライベート IP を使った EC2 間通信の料金は？",
    choices: [
      "基本的に無料",
      "GB あたり $0.01",
      "GB あたり $0.02",
      "AZ をまたがなくても課金"
    ],
    a: 0,
    explain: "同 AZ・プライベート IP で通信する分は基本無料。Public IP / Elastic IP 経由だと AWS 内であっても課金されることがある (リージョン内 IP 通信料)。"
  },
  { id: "net-003", topic: "network", type: "single", difficulty: 2,
    q: "リージョン内・別 AZ 間 EC2 通信の料金は？",
    choices: [
      "送信 / 受信 双方向に GB 単価が発生 (合計で 1 GB あたり $0.02 程度)",
      "完全無料",
      "片方向のみ課金",
      "1 ヶ月最大 $1 まで"
    ],
    a: 0,
    explain: "クロス AZ は双方向で課金 (例: 米国リージョンで送信 $0.01/GB + 受信 $0.01/GB)。Multi-AZ 構成にすると通信料が無視できないコストになりやすい。"
  },
  { id: "net-004", topic: "network", type: "single", difficulty: 2,
    q: "別リージョン間のデータ転送料金は概ね？",
    choices: [
      "GB あたり $0.02〜$0.09 程度 (リージョンペアと方向で異なる)",
      "完全無料",
      "GB あたり $0.001",
      "GB あたり $0.50"
    ],
    a: 0,
    explain: "リージョン間転送は GB 単価で課金。たとえば us-east-1 → ap-northeast-1 は GB あたり $0.02 前後。日米欧でレートが異なる。"
  },
  { id: "net-005", topic: "network", type: "single", difficulty: 1,
    q: "EC2 から S3 (同一リージョン) へのデータ転送料は？",
    choices: [
      "基本的に無料",
      "GB あたり $0.09",
      "リクエスト数による",
      "1 GB あたり $0.005"
    ],
    a: 0,
    explain: "同一リージョンの EC2 → S3 は転送料金は無料 (S3 のリクエスト料金 / ストレージ料金は別途)。クロスリージョン S3 アクセスは転送料金あり。"
  },
  { id: "net-006", topic: "network", type: "single", difficulty: 2,
    q: "EC2 から CloudFront へのデータ転送 (Origin → CloudFront) の料金は？",
    choices: [
      "Origin → CloudFront はリージョン外 Internet エグレスより安く、しばしば無料相当",
      "通常の Internet エグレスと同額",
      "GB あたり $0.20",
      "CloudFront は同リージョン EC2 と接続不可"
    ],
    a: 0,
    explain: "CloudFront をオリジンに使う場合、EC2 / S3 オリジンから CloudFront への転送は割安。エンドユーザへのエグレスを CloudFront 経由にして総コストを下げるのが定番。"
  },

  // ===== Public IPv4 課金 =====
  { id: "net-010", topic: "network", type: "single", difficulty: 2,
    q: "2024 年 2 月以降、AWS の Public IPv4 アドレスは原則として？",
    choices: [
      "アタッチ状態に関係なく時間あたり $0.005/h で課金される",
      "Elastic IP のときだけ課金",
      "完全に無料",
      "リージョンによって有料/無料"
    ],
    a: 0,
    explain: "2024-02-01 から Public IPv4 アドレスは『使っているだけで』時間課金。EIP の有無や紐づけ状態によらない。"
  },
  { id: "net-011", topic: "network", type: "single", difficulty: 2,
    q: "Public IPv4 課金を抑える代表的な施策として正しくないものは？",
    choices: [
      "Public IPv4 を持つ EC2 をすべて Reboot する",
      "Public IPv4 が必要ない EC2 はプライベートサブネットへ移し Public IPv4 を解除",
      "クライアント / バックエンドを IPv6 化する",
      "ALB / NLB の Public 化で Public IPv4 の本数を集約する"
    ],
    a: 0,
    explain: "Reboot は Public IPv4 課金とは無関係。不要 IPv4 を外す / IPv6 化 / Public IP を集約する、が王道。"
  },
  { id: "net-012", topic: "network", type: "single", difficulty: 1,
    q: "Elastic IP (EIP) の課金として正しいものは？",
    choices: [
      "確保している間 (関連付けの有無に関わらず) $0.005/h 課金される",
      "EC2 に関連付けている時のみ無料",
      "EIP は EC2 に紐づいていれば常に無料",
      "EIP は永久に無料"
    ],
    a: 0,
    explain: "2024-02 改定で Public IPv4 全般が時間課金。EIP も例外なく確保時間で課金される。古い情報 (関連付けなしのみ課金) は通用しない。"
  },
  { id: "net-013", topic: "network", type: "single", difficulty: 2,
    q: "1 つのアカウントに長らく確保したまま使っていない EIP がある。最初に取るべきアクションは？",
    choices: [
      "本当に不要であれば解放 (release)",
      "Stop / Start を繰り返す",
      "別リージョンにコピー",
      "別 AZ に移動"
    ],
    a: 0,
    explain: "未使用 EIP は最も簡単に削れる無駄。Trusted Advisor の『Unassociated Elastic IP Addresses』、Cost Explorer の Public IPv4 行から発見可能。"
  },

  // ===== NAT Gateway =====
  { id: "net-020", topic: "network", type: "single", difficulty: 1,
    q: "NAT Gateway の課金構造として正しいものは？",
    choices: [
      "時間料金 ($0.045/h 程度) + データ処理料金 ($0.045/GB 程度) の 2 軸",
      "時間料金のみ",
      "データ処理料金のみ",
      "1 GB あたり固定 $0.10"
    ],
    a: 0,
    explain: "NAT GW は『常設時間料金 + 通過データ処理料金』。両方発生するため、データ量が多い場合は VPC Endpoint への置換でデータ処理料を削減するのが有効。"
  },
  { id: "net-021", topic: "network", type: "single", difficulty: 2,
    q: "NAT Gateway を AZ ごとに 1 つずつ置くケースで、Multi-AZ 化したときのコスト挙動として正しいものは？",
    choices: [
      "NAT GW の固定時間料金が AZ 数だけ倍に。さらにクロス AZ を避ける配線にしないと AZ 間転送料が乗る",
      "Multi-AZ にしても料金は変わらない",
      "NAT GW は無料",
      "クロス AZ 配線は無料"
    ],
    a: 0,
    explain: "可用性のために AZ ごとに NAT GW を置くと固定費が AZ 数倍。クロス AZ で NAT を通すとさらに AZ 間転送料も乗る。可用性とコストのバランスが必要。"
  },
  { id: "net-022", topic: "network", type: "single", difficulty: 2,
    q: "NAT Gateway の代替として NAT Instance を使うとコスト面でどう変わるか。",
    choices: [
      "EC2 料金体系になり安くなる場合もあるが、可用性 / スループット / 運用工数 / セキュリティパッチ責任は自前",
      "NAT Instance は無料",
      "NAT Instance のほうがスループットが必ず高い",
      "NAT Instance は冗長化が AWS 標準機能で自動化される"
    ],
    a: 0,
    explain: "NAT Instance は OS 管理が自分。Cookpad などの大規模事例で削減効果はあるが、可用性とスループット (現代は 5 Gbps+ が必要なケースも) を自前で担保する責任が増える。"
  },
  { id: "net-023", topic: "network", type: "single", difficulty: 2,
    q: "ある月の NAT GW のデータ処理料金が突然 2 倍に増えた。最も疑うべき原因は？",
    choices: [
      "プライベートサブネット内のサービスが大量に S3 / DynamoDB / ECR 等にアクセスし、NAT GW を経由している",
      "EBS の容量が増えた",
      "EC2 のインスタンスサイズが大きくなった",
      "AWS Support のチケット数が増えた"
    ],
    a: 0,
    explain: "プライベートサブネットから AWS マネージドサービスにインターネット経由でアクセスすると NAT GW のデータ処理料が積み上がる。Gateway 型 VPC Endpoint (S3/DynamoDB 無料) や Interface VPC Endpoint への置換で削減。"
  },

  // ===== VPC Endpoint =====
  { id: "net-030", topic: "network", type: "single", difficulty: 1,
    q: "VPC Endpoint の Gateway 型 (S3 / DynamoDB) の課金は？",
    choices: [
      "Endpoint そのものは無料 (S3 / DynamoDB アクセスに対する追加料金もなし)",
      "時間あたり $0.01",
      "1 GB あたり $0.01",
      "Endpoint 1 つあたり $1/月"
    ],
    a: 0,
    explain: "Gateway 型 VPC Endpoint (S3/DynamoDB) は無料。NAT GW のデータ処理料を 0 に置き換えられる典型的なコスト最適化。"
  },
  { id: "net-031", topic: "network", type: "single", difficulty: 2,
    q: "Interface VPC Endpoint (PrivateLink) の課金構造は？",
    choices: [
      "ENI 1 つあたり時間料金 (約 $0.01/h 程度) + データ処理 (約 $0.01/GB)。AZ 数ぶん必要",
      "完全無料",
      "GB あたり固定 $0.05",
      "Endpoint 1 つあたり $100/月"
    ],
    a: 0,
    explain: "Interface Endpoint は AZ ごとに ENI 課金 + データ処理。NAT GW より安くなる場合とそうでない場合があるので、データ量から損益分岐を見極める。"
  },
  { id: "net-032", topic: "network", type: "multi", difficulty: 2,
    q: "VPC Endpoint Gateway 型でアクセスできる AWS サービスを 2 つ以上選べ。",
    choices: ["S3", "DynamoDB", "SQS", "Lambda"],
    a: [0, 1],
    explain: "Gateway 型 Endpoint は S3 と DynamoDB だけ。それ以外の AWS サービスにプライベート経路で繋ぐなら Interface Endpoint (PrivateLink) を使う。"
  },
  { id: "net-033", topic: "network", type: "single", difficulty: 2,
    q: "NAT GW 経由 vs Interface VPC Endpoint の損益分岐を判断する考え方として正しいものは？",
    choices: [
      "月のデータ量 × NAT GW のデータ処理単価 と、Endpoint の時間料金 × AZ 数 + データ処理を比較する",
      "EC2 の vCPU 数を比較する",
      "AZ の番号を比較する",
      "リージョンの ID を比較する"
    ],
    a: 0,
    explain: "Endpoint は固定費 (ENI 時間)、NAT GW はデータ量に比例。データ量が多いほど Endpoint が有利。少量なら NAT GW のまま。"
  },
  { id: "net-034", topic: "network", type: "single", difficulty: 2,
    q: "EC2 から SSM (Systems Manager) にプライベートサブネットからアクセスしたい。NAT GW 経由とどちらが望ましいか。",
    choices: [
      "Interface Endpoint (com.amazonaws.<region>.ssm 等) を作成すれば NAT GW 経由のデータ処理料を回避できる",
      "NAT GW 必須",
      "Direct Connect が必須",
      "VPN が必須"
    ],
    a: 0,
    explain: "SSM / SSMMessages / EC2Messages 用の 3 つの Interface Endpoint を作るとプライベートサブネットから SSM が使える。NAT GW を撤去できれば固定費を削減できる。"
  },

  // ===== VPC Peering / Transit Gateway =====
  { id: "net-040", topic: "network", type: "single", difficulty: 2,
    q: "VPC Peering のデータ転送料金の特徴は？",
    choices: [
      "同 AZ でもクロス AZ でもピアリング経由のリージョン内転送は GB 単価が発生する",
      "Peering は無料",
      "クロスリージョンは無料",
      "Peering を使うと EC2 のオンデマンドが半額"
    ],
    a: 0,
    explain: "VPC Peering は接続自体は無料だが、流れたデータには GB 単価がかかる。リージョン内・同 AZ でも (※同 AZ 間は安いが) 完全無料にはならない。"
  },
  { id: "net-041", topic: "network", type: "single", difficulty: 2,
    q: "Transit Gateway (TGW) の課金構造は？",
    choices: [
      "アタッチメント 1 つあたり時間料金 + データ処理 (GB 単価)",
      "完全無料",
      "GB 単価のみ",
      "アタッチメント時間料金のみ"
    ],
    a: 0,
    explain: "TGW は接続 1 つあたり時間料金とデータ処理量で課金。中央集約で運用は楽になるが、PeeringFlat より高くつくケースがあるので比較が必要。"
  },
  { id: "net-042", topic: "network", type: "single", difficulty: 2,
    q: "オンプレと AWS を結ぶ VPN / Direct Connect のうち、データ転送のエグレス単価がより安くなりやすいのは？",
    choices: [
      "AWS Direct Connect (DX)",
      "Site-to-Site VPN",
      "両者の単価は同じ",
      "Internet 経由のほうが安い"
    ],
    a: 0,
    explain: "Direct Connect 経由のエグレスは Internet エグレスより GB 単価が大幅に安い。ただし DX の物理回線 / ポート料金は別途。利用量が大きいなら DX が経済的。"
  },

  // ===== ALB / NLB / CLB =====
  { id: "net-050", topic: "network", type: "single", difficulty: 1,
    q: "Application Load Balancer (ALB) の課金単位は？",
    choices: [
      "稼働時間 (時間あたり) + LCU (Load Balancer Capacity Units)",
      "リクエスト 1 件あたり固定",
      "AZ 数のみ",
      "EC2 ターゲット数のみ"
    ],
    a: 0,
    explain: "ALB は『時間料金 + LCU』。LCU は新規接続 / アクティブ接続 / 処理バイト / ルール評価のうち最大のものから算出。"
  },
  { id: "net-051", topic: "network", type: "single", difficulty: 2,
    q: "ALB の LCU の構成要素として正しい組み合わせは？",
    choices: [
      "新規接続 / アクティブ接続 / 処理バイト / ルール評価",
      "EC2 ターゲット数 / Multi-AZ / IP 数 / TLS バージョン",
      "リージョン / AZ / VPC / Subnet",
      "RPS / Latency / Error / Memory"
    ],
    a: 0,
    explain: "LCU = max(新規接続/秒, アクティブ接続, 処理バイト, ルール評価) を集計したもの。トラフィック特性によって支配的な要素が変わる。"
  },
  { id: "net-052", topic: "network", type: "single", difficulty: 2,
    q: "Network Load Balancer (NLB) の課金単位は？",
    choices: [
      "稼働時間 + NLCU (NLB 用 LCU)",
      "リクエスト数のみ",
      "完全無料",
      "AZ 数のみ"
    ],
    a: 0,
    explain: "NLB は ALB と同じく『時間料金 + NLCU』。NLCU の構成要素は新規 TCP/UDP コネクション / アクティブフロー / 処理バイト等。"
  },
  { id: "net-053", topic: "network", type: "single", difficulty: 2,
    q: "Classic Load Balancer (CLB) の現状として最も適切なのは？",
    choices: [
      "新規には推奨されず ALB / NLB への移行が望ましい",
      "全リージョンで完全廃止",
      "CLB のほうが ALB より新しい",
      "Spot 専用"
    ],
    a: 0,
    explain: "CLB は旧世代。リクエスト処理あたりの料金が ALB/NLB より高めで機能も限定的。コスト面でも基本 ALB / NLB に移行。"
  },
  { id: "net-054", topic: "network", type: "multi", difficulty: 2,
    q: "LB のコスト最適化として有効な手段を 2 つ以上選べ。",
    choices: [
      "未使用 LB を削除する",
      "ALB と NLB を不要に二重に置かない",
      "ALB を 1 リージョンに必ず 10 個以上配置する",
      "余分な AZ をターゲットから外す"
    ],
    a: [0, 1, 3],
    explain: "未使用 LB / 二重配置の整理 / ターゲット AZ の最適化が基本。AZ 数は冗長性要件次第。"
  },

  // ===== CloudFront / WAF =====
  { id: "net-060", topic: "network", type: "single", difficulty: 2,
    q: "CloudFront のエッジ → エンドユーザの転送料金は AWS リージョン → Internet の転送料金と比べてどうか。",
    choices: [
      "リージョン直 Internet より GB 単価が安いことが多い",
      "完全に同じ単価",
      "CloudFront のほうが高い",
      "CloudFront は転送料無料"
    ],
    a: 0,
    explain: "CloudFront 経由のほうがエッジロケーションでキャッシュしつつ単価も控えめ。大量配信は CloudFront 経由でコスト最適化。"
  },
  { id: "net-061", topic: "network", type: "single", difficulty: 2,
    q: "CloudFront のリクエスト課金は？",
    choices: [
      "HTTPS リクエスト数 × $0.0075〜 / 1万リクエスト 程度 (リージョンと方式で変動)",
      "完全無料",
      "1 リクエスト $0.01",
      "1 リクエスト $1"
    ],
    a: 0,
    explain: "CloudFront はリクエスト数 + データ転送量 + (Edge 機能利用時) Lambda@Edge / CloudFront Functions の料金。"
  },

  // ===== Direct Connect =====
  { id: "net-070", topic: "network", type: "single", difficulty: 2,
    q: "AWS Direct Connect (DX) の主な課金は？",
    choices: [
      "DX ポート時間料金 + データエグレス (Internet エグレスより安い単価)",
      "完全無料",
      "1 リージョン $1000/月固定",
      "オンプレ側で別請求"
    ],
    a: 0,
    explain: "DX は専用線/ホスト型接続のポート料金 (Speed 単位) + データ送信 (DX 単価)。長距離・大容量のオンプレ - AWS 通信を持つなら経済的。"
  },

  // ===== Multi-AZ コスト =====
  { id: "net-080", topic: "network", type: "single", difficulty: 2,
    q: "EC2 を Multi-AZ で冗長配置する時、データ転送コスト面の典型的なポイントは？",
    choices: [
      "AZ 間通信が双方向で課金されるため、頻繁な AZ 跨ぎ通信はコスト増の要因",
      "AZ 数が増えるほど EBS 容量料金が下がる",
      "Multi-AZ は完全に無料",
      "AZ を増やすと EC2 オンデマンドが安くなる"
    ],
    a: 0,
    explain: "Multi-AZ で冗長性は上がるが、AZ 跨ぎ通信が増えるとデータ転送料が積み上がる。AZ アフィニティ (同 AZ のターゲットを優先) や Cross-Zone LB の設計が重要。"
  },
  { id: "net-081", topic: "network", type: "single", difficulty: 2,
    q: "ALB の『Cross-Zone Load Balancing』 (デフォルト ON) は料金面でどう影響するか。",
    choices: [
      "ターゲットが少ない AZ にも均等にトラフィックを振るため、AZ 跨ぎ通信が増えてコスト増になり得る",
      "Cross-Zone を有効化すると料金が半額",
      "Cross-Zone は AZ 内に閉じる",
      "Cross-Zone は無料"
    ],
    a: 0,
    explain: "ALB は Cross-Zone がデフォルト有効 (追加課金なし)。NLB は AZ 越えに追加課金あり (リージョン内データ転送として)。Cross-Zone の方針はトラフィック量とコストで判断。"
  },
  { id: "net-082", topic: "network", type: "single", difficulty: 3,
    q: "NLB の Cross-Zone Load Balancing を有効にした場合のコスト影響は？",
    choices: [
      "AZ 間データ転送が NLB 経由でも発生するため、データ転送料が上乗せされ得る",
      "NLB の Cross-Zone は無料",
      "NLB は Cross-Zone を切れない",
      "NLB の Cross-Zone はデフォルト ON"
    ],
    a: 0,
    explain: "NLB は Cross-Zone デフォルト OFF。明示的に有効化するとリージョン内データ転送料がかかる。AZ 跨ぎが多い設計ならコストを試算してから ON にすること。"
  },

  // ===== IPv6 =====
  { id: "net-090", topic: "network", type: "single", difficulty: 2,
    q: "AWS の IPv6 アドレスの料金は？",
    choices: [
      "IPv6 アドレス自体には料金は発生しない (転送料 / NAT 料は別)",
      "IPv6 でも IPv4 同様 $0.005/h",
      "1 アドレスあたり $1/月",
      "リージョン外で課金"
    ],
    a: 0,
    explain: "IPv6 アドレスは確保自体に料金がない。Public IPv4 課金からの逃避策として IPv6 化は有効。データ転送料は通常通り発生。"
  },
  { id: "net-091", topic: "network", type: "single", difficulty: 2,
    q: "Egress-only Internet Gateway (IPv6 専用、Outbound 限定) の課金は？",
    choices: [
      "Gateway 自体は無料 (流れたデータの転送料金は通常通り発生)",
      "NAT Gateway と同額",
      "完全に無料 (転送料も)",
      "1 つあたり月 $0.10"
    ],
    a: 0,
    explain: "Egress-only IGW (IPv6) は IGW と同様に GW 自体無料。NAT GW の固定費を回避できる。IPv6 でアプリが動くなら有力なコスト削減策。"
  },

  // ===== その他細部 =====
  { id: "net-100", topic: "network", type: "single", difficulty: 2,
    q: "リージョン内で『同一 AZ・プライベート IP 同士の通信』が安いことを利用したコスト最適化として正しくないのはどれか。",
    choices: [
      "RDS と Web サーバを別 AZ に配置することで冗長化のためコストも下がる",
      "RDS と Web サーバを同 AZ に置く (耐障害は Multi-AZ で別途確保)",
      "アプリ間通信をプライベート IP に統一する",
      "VPC 内通信を Public IP 経由にしない"
    ],
    a: 0,
    explain: "別 AZ 配置はクロス AZ 課金を増やす。冗長性は『Multi-AZ かつ各 AZ 内で完結する経路』を設計することが多い。"
  },
  { id: "net-101", topic: "network", type: "single", difficulty: 2,
    q: "S3 への大量アップロードを行う際にコスト削減として有効なのは？",
    choices: [
      "同一リージョンの EC2 / Lambda から S3 を使う (転送料無料)",
      "リージョンを跨いだ EC2 から S3 にアップする",
      "NAT GW 経由で S3 を呼ぶ",
      "Internet 経由で外部から S3 に直接アップロード"
    ],
    a: 0,
    explain: "同一リージョンの EC2 → S3 は転送料なし。プライベートサブネットなら Gateway VPC Endpoint で NAT GW のデータ処理料も発生しない。"
  },
  { id: "net-102", topic: "network", type: "single", difficulty: 2,
    q: "VPC ピアリング先のリソース (別 VPC) へ EC2 から大量にデータ送信した。コスト最適化として最も妥当な視点は？",
    choices: [
      "ピアリング経由のリージョン内データ転送料が想定以上に積み上がっていないかを確認",
      "ピアリングは無料なので確認不要",
      "TGW に変えれば必ず安くなる",
      "Direct Connect に変えれば必ず安くなる"
    ],
    a: 0,
    explain: "Peering は接続自体は無料だが、転送量に応じて課金。AZ 間とリージョン内 / リージョン間で単価が異なる。トラフィック分析が出発点。"
  },
  { id: "net-103", topic: "network", type: "single", difficulty: 2,
    q: "NAT Gateway を撤去できるかを検討する典型的なチェックポイントは？",
    choices: [
      "プライベートサブネットからのアウトバウンドが主に AWS マネージドサービス (S3 / DynamoDB / SSM / ECR / CloudWatch Logs 等) であれば VPC Endpoint で代替可能",
      "プライベートサブネットがあるなら必ず NAT GW",
      "Internet エグレスが少ないなら EIP に置換",
      "Multi-AZ なら NAT GW は無料"
    ],
    a: 0,
    explain: "AWS マネージドサービス系のエグレスは VPC Endpoint (Gateway か Interface) で内向きに閉じられる。外部 Internet エグレスがほぼ無いケースなら NAT GW 撤去で大幅削減。"
  },
  { id: "net-104", topic: "network", type: "single", difficulty: 3,
    q: "NAT Gateway を 3 AZ にひとつずつ置く構成と、1 AZ に 1 つだけ置いて他 AZ から共有する構成のコストとリスクの比較として正しいものは？",
    choices: [
      "1 つに集約すると NAT GW の固定費は減るが、他 AZ → NAT GW のクロス AZ 転送料 + 単一障害点リスクが増える",
      "3 個構成のほうが常に安い",
      "1 個構成のほうが Multi-AZ 耐性が高い",
      "両者は同じコスト・同じ可用性"
    ],
    a: 0,
    explain: "コスト最適化と可用性のトレードオフ。低負荷の開発環境では 1 個構成、業務環境では 3 個 (またはマネージドの代替) が一般的。"
  },
  { id: "net-105", topic: "network", type: "single", difficulty: 2,
    q: "AWS PrivateLink を使った SaaS / 自社サービス公開でコスト最適化として留意すべきは？",
    choices: [
      "Endpoint Service の利用者側に Interface Endpoint 課金 (ENI 時間 + データ処理) が発生する",
      "Endpoint Service 提供者だけが課金される",
      "PrivateLink は完全無料",
      "PrivateLink は Lambda 限定"
    ],
    a: 0,
    explain: "PrivateLink で他社サービスに接続する側 (Consumer) が ENI 時間 + データ処理を支払う。提供側 (Provider) は NLB 等の通常コスト。"
  },
  { id: "net-106", topic: "network", type: "single", difficulty: 2,
    q: "S3 へのアクセスを Gateway VPC Endpoint 経由にしたとき、誤って消した時の挙動は？",
    choices: [
      "VPC Endpoint が消えると S3 アクセスは NAT GW 経由などに代わり、NAT GW のデータ処理料が突然発生する可能性",
      "S3 は接続できなくなり完全停止",
      "S3 は AWS Support 経由でしかアクセス不可になる",
      "EC2 が自動で停止する"
    ],
    a: 0,
    explain: "Endpoint が無くなると S3 トラフィックは Internet 経由 (NAT GW / IGW) にフォールバック。コストモニタリングで突然 NAT GW の請求が増えたら Endpoint 削除を疑う。"
  },

  // ===== 細部 =====
  { id: "net-110", topic: "network", type: "single", difficulty: 2,
    q: "EC2 と RDS が異なる AZ にあるとき、毎クエリ発生する AZ 間データ転送料を抑える施策として最も有効なのは？",
    choices: [
      "アプリ EC2 と RDS プライマリを同じ AZ に配置 (Multi-AZ スタンバイは別 AZ)",
      "EC2 を Spot にする",
      "RDS を Stop する",
      "RDS の Storage を gp2 にする"
    ],
    a: 0,
    explain: "RDS Primary とアプリを同 AZ にすると DB クエリの AZ 跨ぎ転送料がほぼゼロに。Multi-AZ のスタンバイは別 AZ で問題なし (フェイルオーバ時のみ AZ が変わる)。"
  },
  { id: "net-111", topic: "network", type: "single", difficulty: 2,
    q: "VPC Endpoint Policy を厳しく書いた時、コスト面の副作用としてあり得るのは？",
    choices: [
      "正しい接続まで弾かれて、フォールバック経路の NAT GW のデータ処理料が増えることがある",
      "Endpoint Policy で料金が割引される",
      "Endpoint Policy で AZ 数が増える",
      "Endpoint Policy で Spot に切替"
    ],
    a: 0,
    explain: "ポリシーで Endpoint が使えなくなると別経路 (NAT GW 等) に行く。Policy 変更時はトラフィックメトリクスで NAT GW 利用量を観測する。"
  },
  { id: "net-112", topic: "network", type: "single", difficulty: 2,
    q: "Egress 帯域コストを抑えるために CDN を使うときの代表的なアンチパターンは？",
    choices: [
      "CDN を介さず Origin の EC2 から直接配信し続ける",
      "静的アセットを CloudFront から配信する",
      "TLS ハンドシェイクを CDN エッジで終端する",
      "CDN のキャッシュ TTL を適切に設定する"
    ],
    a: 0,
    explain: "Origin 直接配信は GB 単価が高い Internet エグレスのまま。CDN を挟むと安い CloudFront 単価で配信できる + キャッシュでオリジン負荷も下がる。"
  },
  { id: "net-113", topic: "network", type: "single", difficulty: 2,
    q: "AWS Backup での DR コピー (リージョン間) で考慮すべきコストは？",
    choices: [
      "クロスリージョンのデータ転送 + コピー先での保管料",
      "コピー元の EBS が無料化",
      "AWS Backup 自体が無料",
      "Backup Vault の数で割引"
    ],
    a: 0,
    explain: "Backup のクロスリージョン / クロスアカウントは通常のデータ転送と保管料に基づく。DR 目的でやみくもに頻度を上げないこと。"
  },
  { id: "net-114", topic: "network", type: "single", difficulty: 2,
    q: "S3 へのアウトバウンドで PrivateLink (Interface Endpoint) と Gateway Endpoint のコスト比較として正しいものは？",
    choices: [
      "S3 は Gateway Endpoint が無料なので、リージョン内アクセスでは基本 Gateway Endpoint を選ぶ",
      "Interface Endpoint のほうが常に安い",
      "両者は同額",
      "S3 は Gateway Endpoint が使えない"
    ],
    a: 0,
    explain: "S3 / DynamoDB は Gateway Endpoint がコスト的に最強 (無料)。クロスリージョンや他 VPC へのプライベート配線が要件の時のみ Interface Endpoint。"
  },
  { id: "net-115", topic: "network", type: "single", difficulty: 2,
    q: "リージョン内で『AZ-a の EC2 から AZ-b の RDS (Multi-AZ) のプライマリ』へ通信する場合の課金は？",
    choices: [
      "AZ 間転送料が双方向で発生 ($0.01/GB×2 程度)",
      "完全無料",
      "リージョン外転送料",
      "EBS スループット課金"
    ],
    a: 0,
    explain: "プライマリが別 AZ にあれば AZ 跨ぎコストが発生。常時クロス AZ が発生する設計はトラフィック次第で月数千〜数万円の差。"
  },
  { id: "net-116", topic: "network", type: "single", difficulty: 1,
    q: "EC2 同士の同一 AZ 内通信でも『パブリック IP / Elastic IP』を経由した場合は？",
    choices: [
      "リージョン内データ転送料が発生する (Internet 経由扱いではないが課金)",
      "完全無料",
      "倍額になる",
      "Spot のみ無料"
    ],
    a: 0,
    explain: "同 AZ でも Public IP 経由だと AWS の課金は発生 (Internet 経由ではなく『リージョン内データ転送』扱い)。プライベート IP で通信するのが基本。"
  },
  { id: "net-117", topic: "network", type: "single", difficulty: 3,
    q: "AWS Cost Explorer で『データ転送料の異常な増加』を発見した時、原因究明に有効な分析軸を 1 つ選べ。",
    choices: [
      "Usage Type グループ (DataTransfer-Out-Bytes, DataTransfer-Regional-Bytes 等)",
      "EC2 タイプ数",
      "RI 数",
      "Region 数"
    ],
    a: 0,
    explain: "Cost Explorer の Usage Type / Operation / API 別フィルタが原因特定の鍵。InterZone vs Internet vs InterRegion を区別して見る。"
  },
  { id: "net-118", topic: "network", type: "single", difficulty: 2,
    q: "EC2 から外部 API (例: 自社外の REST API) を 24h 大量に叩いている。最初に効くコスト最適化は？",
    choices: [
      "可能ならキャッシュ層 (CloudFront / ElastiCache / アプリ内) を挟みアウトバウンド量を減らす",
      "EC2 を Spot にする",
      "EC2 を別リージョンに移す",
      "ELB を増やす"
    ],
    a: 0,
    explain: "外部 API 呼び出しは AWS から見ると Internet エグレス + DNS 解決などのトラフィック。アプリ層でキャッシュして件数を減らすのが最も直接的。"
  },
  { id: "net-119", topic: "network", type: "single", difficulty: 2,
    q: "リージョン (us-east-1) からインターネットへ 1 TB アウトバウンドした場合の概算 (階段式割引前の単価で $0.09/GB 想定) は？",
    choices: [
      "$90 前後",
      "$9 前後",
      "$900 前後",
      "$0.90 前後"
    ],
    a: 0,
    explain: "1 TB ≒ 1024 GB ≒ 1000 GB として 1000 × $0.09 ≒ $90。階段式割引で大量配信時には単価が下がるが、まずはこのオーダー感を覚える。"
  },
  { id: "net-120", topic: "network", type: "fill", numeric: true, difficulty: 2,
    q: "リージョン内別 AZ 間で 100 GB 流した場合の概算料金は？ 送信 $0.01/GB + 受信 $0.01/GB として総額を整数の USD で。",
    a: 2, tolerance: 0.5,
    explain: "送信側 100 × $0.01 = $1、受信側 100 × $0.01 = $1、合計 $2。クロス AZ は双方向課金になりやすい。"
  }
);
