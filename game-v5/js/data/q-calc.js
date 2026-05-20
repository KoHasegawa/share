/* 計算ドリル (数値入力) — 40+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== EC2 月額 =====
  { id: "calc-001", topic: "calc", type: "fill", numeric: true, difficulty: 1,
    q: "EC2 m5.large の Linux オンデマンド単価を $0.10/h と仮定。24h × 730 時間動かした月額 (USD) を整数で。",
    a: 73, tolerance: 1, unit: "USD",
    explain: "$0.10 × 730 = $73。月額は概ね 730 時間で計算するのが慣例 (8760/12)。"
  },
  { id: "calc-002", topic: "calc", type: "fill", numeric: true, difficulty: 1,
    q: "上記 EC2 を 2 台 24h 動かす場合の月額は (USD)?",
    a: 146, tolerance: 1, unit: "USD",
    explain: "$73 × 2 = $146。インスタンス数に対して比例。"
  },
  { id: "calc-003", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EC2 m5.large の単価 $0.10/h を 40% Off の Standard RI で 1 年契約。実効単価は $0.06/h。730 時間動かした月額は (USD)?",
    a: 44, tolerance: 1, unit: "USD",
    explain: "$0.06 × 730 = $43.8 → $44。$73 - $44 = $29/月の削減。"
  },
  { id: "calc-004", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "m5.large を 3 年 All Upfront RI で 60% Off。実効単価 $0.04/h × 730h の月額 (USD)。",
    a: 29, tolerance: 1, unit: "USD",
    explain: "$0.04 × 730 = $29.2 → $29。3 年確実に使う前提なら最大削減。"
  },

  // ===== EBS =====
  { id: "calc-010", topic: "calc", type: "fill", numeric: true, difficulty: 1,
    q: "gp3 単価 $0.08/GB-月 で 500 GB を 1 ヶ月。容量だけの月額は (USD)?",
    a: 40, tolerance: 1, unit: "USD",
    explain: "500 × 0.08 = $40。追加 IOPS / スループットを設定しなければベースライン (3000 IOPS / 125 MB/s) を含む。"
  },
  { id: "calc-011", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "gp3 500 GB に IOPS 6000 (3000 ベース + 3000 追加) を設定。追加 IOPS 単価 $0.005/IOPS-月 として追加 IOPS 課金は (USD)?",
    a: 15, tolerance: 1, unit: "USD",
    explain: "3000 × $0.005 = $15/月。容量 $40 + IOPS 追加 $15 = $55/月のストレージ。"
  },
  { id: "calc-012", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "同じ 500 GB を gp2 で取った場合、単価 $0.10/GB-月 として容量料金は (USD)?",
    a: 50, tolerance: 1, unit: "USD",
    explain: "500 × 0.10 = $50。gp3 (40 + 必要に応じ追加 IOPS) との比較で gp3 のほうが多くのケースで安い。"
  },
  { id: "calc-013", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "gp2 500 GB の IOPS は (3 IOPS/GB として) 何 IOPS か。",
    a: 1500, tolerance: 0, unit: "IOPS",
    explain: "500 × 3 = 1500 IOPS。gp3 ベースライン 3000 にも届かない。IOPS 要件があれば gp3 が有利。"
  },
  { id: "calc-014", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EBS スナップショット 1000 GB を保管。単価 $0.05/GB-月 として月額 (USD)。",
    a: 50, tolerance: 2, unit: "USD",
    explain: "1000 × 0.05 = $50。長期世代を貯めるとここに直接乗る。"
  },
  { id: "calc-015", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "上記スナップショットを Archive 層に移し 75% 安くした場合 (単価 $0.0125/GB-月) の月額 (USD)。",
    a: 13, tolerance: 1, unit: "USD",
    explain: "1000 × 0.0125 = $12.5 → $13。長期保管は Snapshot Archive で 75% 削減。ただし最小 90 日保持と復元コストに注意。"
  },

  // ===== Data Transfer =====
  { id: "calc-020", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EC2 → Internet エグレス、月 5 TB (5120 GB) を $0.09/GB 単価で。月額 (USD) (Free 100 GB 控除前) は概ね。",
    a: 461, tolerance: 5, unit: "USD",
    explain: "5120 × 0.09 = $460.8 → $461。100 GB の Free Tier を引くと 5020 × $0.09 = $452。階段式割引で大量配信は単価が下がる。"
  },
  { id: "calc-021", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "クロス AZ 通信 月 1 TB (1024 GB)、送信 $0.01/GB + 受信 $0.01/GB。総額 (USD) を整数で。",
    a: 20, tolerance: 1, unit: "USD",
    explain: "1024 × 0.01 + 1024 × 0.01 = $20.48 → $20。AZ 間通信は双方向課金。"
  },
  { id: "calc-022", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "NAT Gateway の固定時間料金が $0.045/h。1 ヶ月 (730h) の固定料金 (USD) は？",
    a: 33, tolerance: 1, unit: "USD",
    explain: "$0.045 × 730 = $32.85 → $33。データ処理料 ($0.045/GB) が別途。"
  },
  { id: "calc-023", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "NAT Gateway を月 500 GB 通したデータ処理料金 ($0.045/GB) は (USD)?",
    a: 23, tolerance: 1, unit: "USD",
    explain: "500 × 0.045 = $22.5 → $23。固定 $33 + 処理 $23 = $56/月の NAT GW コスト。"
  },
  { id: "calc-024", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "NAT GW を 3 AZ にそれぞれ配置 (固定料金 × 3、データ処理は AZ 合計 1.5 TB ≒ 1536 GB)。固定 $33 × 3 + データ 1536 × $0.045 を整数 (USD) で。",
    a: 168, tolerance: 5, unit: "USD",
    explain: "$33×3=$99 + 1536×0.045=$69.12 → 合計 $168。3 AZ NAT GW は冗長性を取りつつ固定費が増える典型例。"
  },

  // ===== Elastic IP / Public IPv4 =====
  { id: "calc-030", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "Public IPv4 課金 $0.005/h × 730h × 10 個。月額 (USD)。",
    a: 37, tolerance: 1, unit: "USD",
    explain: "$0.005 × 730 × 10 = $36.5 → $37。EIP / EC2 Public IP / NAT GW IP など合算で意外と効く。"
  },

  // ===== ALB =====
  { id: "calc-040", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "ALB 固定時間料金 $0.025/h × 730h の月額 (USD)。",
    a: 18, tolerance: 1, unit: "USD",
    explain: "$0.025 × 730 = $18.25 → $18。LCU は別途。Idle ALB は最低でもこの額が無駄になる。"
  },
  { id: "calc-041", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "ALB の LCU 課金 $0.008/LCU-h × 730h × 10 LCU 平均。月額 (USD)。",
    a: 58, tolerance: 2, unit: "USD",
    explain: "$0.008 × 730 × 10 = $58.4 → $58。LCU の支配軸 (新規接続/アクティブ接続/処理バイト/ルール評価) のうち最大値の累計。"
  },

  // ===== RDS =====
  { id: "calc-050", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "db.m5.large Multi-AZ の単価が Single-AZ の 2 倍。Single-AZ が $0.20/h なら Multi-AZ で 730h の月額 (USD)。",
    a: 292, tolerance: 5, unit: "USD",
    explain: "$0.20 × 2 × 730 = $292。Multi-AZ はインスタンス料金 2 倍が基本。"
  },
  { id: "calc-051", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "上記の RDS で 3 年 All Upfront Reserved DB Instance (約 60% off) を購入。実効単価 $0.16/h、730h の月額 (USD)。",
    a: 117, tolerance: 3, unit: "USD",
    explain: "$0.16 × 730 = $116.8 → $117。Multi-AZ 用 RI を購入する必要あり。"
  },
  { id: "calc-052", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "RDS gp3 ストレージ単価 $0.115/GB-月、200 GB を Multi-AZ で持つ月額 (USD)。",
    a: 46, tolerance: 2, unit: "USD",
    explain: "200 × 0.115 × 2 = $46。Multi-AZ ストレージ料金は 2 倍。"
  },
  { id: "calc-053", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "RDS ストレージ 200 GB の DB に、月平均バックアップ 300 GB (Auto Backup)。100 GB が超過分。$0.095/GB-月 として超過料金 (USD)。",
    a: 10, tolerance: 1, unit: "USD",
    explain: "100 × 0.095 = $9.5 → $10。DB ストレージ 200 GB の無料枠を超えた 100 GB が課金対象。"
  },
  { id: "calc-054", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "RDS の Read Replica (db.m5.large Single-AZ $0.20/h × 730h) を 1 台追加した時の月額追加 (USD)。",
    a: 146, tolerance: 5, unit: "USD",
    explain: "$0.20 × 730 = $146。Replica は別 RDS インスタンスとして全額発生。RI 適用範囲なら割引対象。"
  },

  // ===== 比較問題 =====
  { id: "calc-060", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "Compute SP $5/h コミット × 730h を 1 ヶ月、All Upfront で総額が $30000 だった。実効単価 ($/h) は (小数 2 桁)。",
    a: 3.42, tolerance: 0.05, unit: "USD/h",
    explain: "$30000 / (730 × 12) = $3.4246 → $3.42/h。1 年契約 (8760h) で割って実効単価を算出する考え方。"
  },
  { id: "calc-061", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "1 年 All Upfront RI で $876 前払い (オンデマンド $0.20/h × 8760h = $1752 相当)。割引率 (%) を整数で。",
    a: 50, tolerance: 2, unit: "%",
    explain: "$876 / $1752 = 50%。実効単価 $0.10/h で運用できる。"
  },
  { id: "calc-062", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "上記 RI を 1 年確実に使った場合、オンデマンド比の節約額 (USD) は？",
    a: 876, tolerance: 5, unit: "USD",
    explain: "$1752 - $876 = $876/年の節約。3 年契約ならさらに大きな節約。"
  },

  // ===== サイズ柔軟性 =====
  { id: "calc-070", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "m5.large 1 台分の Standard RI (normalization factor 4) は、m5.small (factor 1) 何台ぶんに按分されるか (整数で)。",
    a: 4, tolerance: 0,
    explain: "4 / 1 = 4 台。Linux/UNIX + default + Regional 条件下でサイズ柔軟性が効く。"
  },
  { id: "calc-071", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "m5.4xlarge (factor 32) 1 台分の Standard RI は、m5.xlarge (factor 8) 何台ぶんカバーできるか。",
    a: 4, tolerance: 0,
    explain: "32 / 8 = 4 台。大きく取って小さく分けるパターン。"
  },

  // ===== Free Tier =====
  { id: "calc-080", topic: "calc", type: "fill", numeric: true, difficulty: 1,
    q: "EC2 Free Tier 12 ヶ月、t2.micro / t3.micro が月 750h 無料。1 台 24h 動かすと月 720h でフリー枠内。500 GB ストレージはどうなるか。20 GB Free Tier 超過 → 480 GB が gp2 $0.10/GB-月 で何ドル課金？",
    a: 48, tolerance: 1, unit: "USD",
    explain: "480 × 0.10 = $48。Free Tier 中も超過分は通常課金。"
  },

  // ===== クロスリージョン =====
  { id: "calc-090", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "us-east-1 → ap-northeast-1 のリージョン間転送、月 500 GB を $0.02/GB として。月額 (USD)。",
    a: 10, tolerance: 1, unit: "USD",
    explain: "500 × 0.02 = $10。クロスリージョン RDS レプリカ等で継続発生する典型例。"
  },

  // ===== シナリオ系単純計算 =====
  { id: "calc-100", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EC2 m5.large × 5 台 24h、$0.10/h。月額 (USD)。",
    a: 365, tolerance: 5, unit: "USD",
    explain: "0.10 × 730 × 5 = $365。"
  },
  { id: "calc-101", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "上記 EC2 を全て 50% Off Standard RI 1 年でカバー。月額 (USD)。",
    a: 183, tolerance: 5, unit: "USD",
    explain: "$365 × 0.5 = $182.5 → $183。"
  },
  { id: "calc-102", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "ALB 1 台 + EC2 5 台 + Multi-AZ db.m5.large + 200 GB gp3 + Snapshot 100 GB + NAT GW (固定のみ) の月額概算 (USD)。値を順に: ALB $18, EC2 $365, RDS $292+$46, Snap $5, NAT $33。総額。",
    a: 759, tolerance: 10, unit: "USD",
    explain: "$18 + $365 + $292 + $46 + $5 + $33 = $759。データ転送 / LCU / 追加 IOPS / バックアップ等が別途乗る。"
  },

  // ===== 追加 =====
  { id: "calc-110", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "1 TB の S3 (Standard) を 1 ヶ月、$0.023/GB-月。月額 (USD) を整数で。",
    a: 24, tolerance: 1, unit: "USD",
    explain: "1024 × 0.023 = $23.55 → $24。比較対象として知っておくと EBS / Snapshot との差を実感できる。"
  },
  { id: "calc-111", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "CloudWatch Logs 取り込み $0.50/GB × 月 100 GB の月額 (USD)。",
    a: 50, tolerance: 1, unit: "USD",
    explain: "100 × 0.5 = $50。ログをじゃぶじゃぶ流すと意外と高い。アプリログのレベル制御も重要。"
  },
  { id: "calc-112", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "CloudWatch Logs 保管 $0.03/GB-月 × 1 TB (1024 GB)。月額 (USD)。",
    a: 31, tolerance: 1, unit: "USD",
    explain: "1024 × 0.03 = $30.72 → $31。長期保管は S3 にエクスポートのほうが安いケース多し。"
  },
  { id: "calc-113", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EC2 t3.micro $0.0104/h × 730h を 12 ヶ月、Free Tier 適用なし。年額 (USD) を整数で。",
    a: 91, tolerance: 2, unit: "USD",
    explain: "$0.0104 × 730 × 12 = $91.1 → $91。安いインスタンスでも年額にすると馬鹿にならない。"
  },
  { id: "calc-114", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "EC2 m5.large 1 台 vs m5.xlarge 1 台 (m5.large の倍)。$0.10/h で large、xlarge で 730h の月額差 (USD)。",
    a: 73, tolerance: 1, unit: "USD",
    explain: "xlarge = $0.20/h、730h = $146、large $73 との差は $73。サイズアップで月額が顕著に増える。"
  },
  { id: "calc-115", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "Public IPv4 1 個 × $0.005/h × 24h × 30日 (= 720h 想定)。月額 (USD) を小数 2 桁で。",
    a: 3.60, tolerance: 0.2, unit: "USD",
    explain: "0.005 × 720 = $3.6。1 個では小さいが、複数あると効く。"
  },
  { id: "calc-116", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "VPC Interface Endpoint 1 ENI $0.01/h × 730h × 3 AZ の固定費 (USD) は？",
    a: 22, tolerance: 1, unit: "USD",
    explain: "0.01 × 730 × 3 = $21.9 → $22。NAT GW 1 個より安く済む場合があるが AZ 数と Endpoint 数で増える。"
  },
  { id: "calc-117", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "ALB $18 + LCU $58 と NLB $22 + NLCU $40 のどちらが安いか。差額 (USD) を整数で (NLB が安い場合は正、ALB が安い場合は負の符号で答えても良いが本問は単純差を答える)。",
    a: 14, tolerance: 2, unit: "USD",
    explain: "ALB: $76、NLB: $62。差は $14 (NLB が安い)。要件 (L7 機能 vs L4 高速) で選択は決まるが料金差はこの程度のオーダー。"
  },
  { id: "calc-118", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "リードレプリカ db.m5.large Single-AZ $0.20/h、730h、3 台。月額 (USD)。",
    a: 438, tolerance: 5, unit: "USD",
    explain: "$0.20 × 730 × 3 = $438。リードレプリカ複数は意外と効く。"
  },
  { id: "calc-119", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "RDS Multi-AZ Cluster (3 ノード) で各ノード db.m5.large Single 単価 $0.20/h、730h を 3 ノードぶんの月額 (USD)。",
    a: 438, tolerance: 5, unit: "USD",
    explain: "$0.20 × 730 × 3 = $438。従来 Multi-AZ (2 ノード = $292) より高いが Reader が活用可能なので使い方次第。"
  },
  { id: "calc-120", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EC2 6 台 + RDS Multi-AZ + 200 GB gp3 を全てオンデマンドで、月 EC2 $0.10/h、RDS $0.20/h、ストレージ $0.115/GB-月。月額 (USD) 概算。",
    a: 776, tolerance: 20, unit: "USD",
    explain: "EC2: $0.10×730×6=$438、RDS: $0.20×730×2=$292、ストレージ: 200×0.115×2=$46。合計 $776。"
  },
  { id: "calc-121", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "上記 EC2 を全て 1 年 50% Off RI、RDS を 1 年 40% Off Reserved DB Instance にした時の月額 (USD) 概算 (ストレージは同額)。",
    a: 440, tolerance: 20, unit: "USD",
    explain: "EC2: $438×0.5=$219、RDS: $292×0.6=$175、ストレージ $46 → 合計 $440。RI 適用だけで $336/月の削減 ($4032/年)。"
  },
  { id: "calc-122", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "gp2 1 TB を月額 $0.10/GB として 12 ヶ月持つと年額 (USD)。",
    a: 1229, tolerance: 30, unit: "USD",
    explain: "1024 × 0.10 × 12 = $1228.8 → $1229。gp3 にすれば概ね 20% 削減で年間 $250 程度の節約。"
  },
  { id: "calc-123", topic: "calc", type: "fill", numeric: true, difficulty: 2,
    q: "EC2 (t3.micro × 1) を Free Tier 範囲を超えて 12 ヶ月使うと年額 (USD)、24h 稼働。$0.0104/h で。",
    a: 91, tolerance: 5, unit: "USD",
    explain: "$0.0104 × 730 × 12 = $91.1。最小級でも年額 $91。"
  },
  { id: "calc-124", topic: "calc", type: "fill", numeric: true, difficulty: 3,
    q: "RDS gp3 200 GB Multi-AZ + 追加 3000 IOPS + 追加 250 MB/s スループット。容量 $46, IOPS $0.02×3000×2=$120, スループット $0.04×250×2=$20。月額 (USD)。",
    a: 186, tolerance: 5, unit: "USD",
    explain: "46 + 120 + 20 = $186。Multi-AZ では IOPS / スループットも 2 倍課金。"
  }
);
