/* シナリオ診断 — 40+ 問 (複問形式) */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== シナリオ 1: 過剰サイズ + Multi-AZ =====
  { id: "sce-001", topic: "scenario", type: "scenario", difficulty: 2,
    q: "EC2 過剰サイズの典型ケース",
    context: [
      "本番 24h Web サイト (us-east-1)",
      "EC2: m5.4xlarge × 4 台 (Linux)",
      "CloudWatch: 平均 CPU 8%, ピーク 25%, メモリ 35%",
      "RDS: db.m5.xlarge Multi-AZ, MySQL, データ 100 GB",
      "現状全てオンデマンド契約"
    ],
    parts: [
      {
        q: "まず最初に取るべきアクションは？",
        type: "single",
        choices: [
          "Right-Sizing 検証 (Compute Optimizer の推奨を確認)",
          "全インスタンスを Spot に切替",
          "全インスタンスを RI 3 年で購入",
          "Multi-AZ を即解除"
        ],
        a: 0,
        explain: "サイジング前のコミットは無駄。Compute Optimizer / CloudWatch で過剰スペックを確認 → リサイズ → 安定確認 → コミット の流れ。"
      },
      {
        q: "Right-Sizing 後に検討する『契約』として最も妥当なのは？",
        type: "single",
        choices: [
          "確実に使うベース台数を Standard RI 1〜3 年 または EC2 Instance SP でカバー",
          "全台を 3 年 No Upfront Convertible RI",
          "全台を 1 ヶ月単位の Spot",
          "全台 Dedicated Host"
        ],
        a: 0,
        explain: "安定運用部分は Standard RI / EC2 Instance SP で最大割引。変動は Compute SP で。"
      },
      {
        q: "RDS Multi-AZ をやめるべきか。",
        type: "single",
        choices: [
          "本番要件次第。SLA や RPO/RTO 要件を満たすなら Multi-AZ 維持し、別軸 (gp3 化 / RI / Right-Sizing) で削減",
          "即解除",
          "Multi-AZ Cluster に強制変更",
          "Aurora に強制移行"
        ],
        a: 0,
        explain: "Multi-AZ は可用性のために維持。コスト削減は他軸で行う。Single-AZ 化はビジネス影響と比較して個別判断。"
      }
    ],
    explain: "総合: Right-Sizing → 安定確認 → RI/SP コミット → ストレージ最適化 (gp3) という流れ。本番の Multi-AZ は基本維持。"
  },

  // ===== シナリオ 2: NAT GW 月額爆発 =====
  { id: "sce-002", topic: "scenario", type: "scenario", difficulty: 3,
    q: "NAT GW のデータ処理料金が急増",
    context: [
      "プライベートサブネットの EC2 × 10 台 (バッチ処理)",
      "Cost Explorer で『NAT Gateway』が前月比 3 倍",
      "EC2 → S3 への大量データ書き出しを最近開始",
      "S3 Bucket は同リージョン"
    ],
    parts: [
      {
        q: "最も効果的な最初の打ち手は？",
        type: "single",
        choices: [
          "S3 用の Gateway VPC Endpoint を作成し、S3 へのトラフィックを NAT GW から分離",
          "NAT Gateway を 3 つに増やす",
          "EC2 を Spot に変える",
          "S3 を別リージョンに移す"
        ],
        a: 0,
        explain: "Gateway 型 Endpoint (S3 / DynamoDB) は無料で、NAT GW のデータ処理料を 0 に置き換えできる。"
      },
      {
        q: "他に併用すべき施策を 2 つ以上 (複数選択)。",
        type: "multi",
        choices: [
          "ECR / SSM / CloudWatch Logs 等への Interface Endpoint 追加",
          "Cost Explorer の Usage Type で NAT GW の内訳を継続監視",
          "全インスタンスを Public Subnet に移す",
          "NAT GW を物理的に増やす"
        ],
        a: [0, 1],
        explain: "(0) AWS マネージドサービス向け Interface Endpoint で NAT GW 経由を削減 (1) 監視で再発防止。Public Subnet 移動はセキュリティ上 NG、NAT GW を増やすのは別軸の話。"
      }
    ],
    explain: "NAT GW データ処理料は VPC Endpoint への置換が王道。S3 / DynamoDB は Gateway 型で無料、他は Interface 型を併用。"
  },

  // ===== シナリオ 3: EBS スナップショット爆発 =====
  { id: "sce-003", topic: "scenario", type: "scenario", difficulty: 2,
    q: "EBS スナップショット保管料が積み上がっている",
    context: [
      "毎日 cron で取った Snapshot が 800 個",
      "AMI を作って後で deregister したケース多数",
      "Cost Explorer: EBS Snapshot コストが月 $400 → $1500 に増加",
      "保持ポリシー未整備"
    ],
    parts: [
      {
        q: "最初にすべきアクションは？",
        type: "single",
        choices: [
          "古い Snapshot / 孤児スナップショット (AMI deregister 後の残骸) の棚卸しと削除",
          "Snapshot を gp3 に切り替える",
          "Snapshot を全件 Multi-AZ 化",
          "Snapshot を別アカウントにコピー"
        ],
        a: 0,
        explain: "孤児スナップショットや古い世代の整理が最大の即効薬。"
      },
      {
        q: "再発防止のために導入すべきは？",
        type: "single",
        choices: [
          "Amazon Data Lifecycle Manager (DLM) で保持世代数とライフサイクルを自動化",
          "AWS Support に毎月依頼",
          "Snapshot を取らないようにする",
          "EBS を全て io2 に変える"
        ],
        a: 0,
        explain: "DLM で『取る・保持・アーカイブ移行・削除』を自動化。"
      },
      {
        q: "長期保管必要な世代の対応は？",
        type: "single",
        choices: [
          "Snapshot Archive (75% 安い、最小 90 日) に階層化",
          "全て Multi-AZ にする",
          "全て Standard に保持",
          "S3 Standard に移行"
        ],
        a: 0,
        explain: "長期保管は Archive 層が最安。コンプラ目的の数年保管に最適。"
      }
    ],
    explain: "EBS Snapshot コスト最適化は『棚卸し → DLM 自動化 → 長期保管は Archive』。"
  },

  // ===== シナリオ 4: アプリと RDS が別 AZ =====
  { id: "sce-004", topic: "scenario", type: "scenario", difficulty: 3,
    q: "AZ 間データ転送料が高い",
    context: [
      "EC2 (アプリ): AZ-a × 3 台",
      "RDS Multi-AZ: プライマリ AZ-c / スタンバイ AZ-a",
      "月次データ転送: クロス AZ 課金が異常に多い",
      "業務 SQL クエリは毎秒数千件、結果セットは大きめ"
    ],
    parts: [
      {
        q: "クロス AZ 課金を抑える最も効果的な打ち手は？",
        type: "single",
        choices: [
          "アプリ EC2 と RDS プライマリの AZ を揃える (今回はプライマリを AZ-a 配置)",
          "RDS を Single-AZ にする",
          "EC2 を別リージョンに移す",
          "ALB を新規追加"
        ],
        a: 0,
        explain: "アプリと RDS プライマリを同一 AZ にすると毎クエリの AZ 跨ぎが消える。Multi-AZ のスタンバイは別 AZ で問題なし (フェイルオーバ時のみ別 AZ プライマリ)。"
      },
      {
        q: "AZ 揃え変更を実施する際の注意点として正しいのは？",
        type: "single",
        choices: [
          "RDS のフェイルオーバ操作 / 再起動でプライマリ AZ を切替可能。短時間の停止を見込む",
          "AZ 配置は変更不可",
          "AWS Support に申請のみ可能",
          "リージョン外移行が必要"
        ],
        a: 0,
        explain: "RDS の Failover で AZ を切替可能。Maintenance Window で安全に。長期的にはアプリの AZ 配置を Multi-AZ にする設計も検討。"
      }
    ],
    explain: "アプリと DB プライマリの AZ 揃えはコスト最適化の見落としがちな鉄板施策。"
  },

  // ===== シナリオ 5: Public IPv4 多数 =====
  { id: "sce-005", topic: "scenario", type: "scenario", difficulty: 2,
    q: "2024 年 2 月以降の Public IPv4 課金で請求が増えた",
    context: [
      "EIP 12 個 (うち 5 個は未関連付け)",
      "EC2 30 台が Public IP を持つ (実際は ALB 経由でアクセス)",
      "NAT GW 3 個 (それぞれ Public IP)",
      "月次 Public IPv4 課金が新たに $150 発生"
    ],
    parts: [
      {
        q: "最初の削減アクションは？",
        type: "single",
        choices: [
          "未関連付け EIP 5 個を解放",
          "全 EIP を Static IP に変換",
          "全 EC2 を Multi-AZ 化",
          "NAT GW を 6 個に増やす"
        ],
        a: 0,
        explain: "未使用 EIP 5 個は最も簡単な削減。$0.005/h × 730h × 5 = $18/月の即時削減。"
      },
      {
        q: "Public IP を持つ EC2 30 台の対応として妥当なのは？",
        type: "single",
        choices: [
          "プライベートサブネットに移し、必要なものだけ ALB 経由でアクセス。Public IP は外す",
          "全 EC2 に EIP を割り当てる",
          "全 EC2 を Multi-AZ にする",
          "全 EC2 を 3 年 RI で固定"
        ],
        a: 0,
        explain: "Public IP が不要な EC2 はプライベートサブネット化。Public IPv4 課金を集約 (ALB / NAT GW) に絞れる。"
      },
      {
        q: "中長期的に検討に値する選択肢は？",
        type: "single",
        choices: [
          "アプリ / 通信を IPv6 化して Public IPv4 課金から逃れる",
          "全 Public IP を CloudFront 経由にする",
          "EC2 を全て Spot 化",
          "全 EBS を Multi-AZ 化"
        ],
        a: 0,
        explain: "IPv6 アドレスは課金されない。アプリ層 / クライアント / DNS の IPv6 化が中長期の本格対策。"
      }
    ],
    explain: "Public IPv4 課金は『不要 EIP 解放』『Public IP の集約』『IPv6 化』の 3 段階で攻める。"
  },

  // ===== シナリオ 6: Reserved 買いすぎ =====
  { id: "sce-006", topic: "scenario", type: "scenario", difficulty: 3,
    q: "Standard RI を 3 年 All Upfront で買いすぎた",
    context: [
      "m5.large の Standard RI を 3 年 All Upfront で 20 台分購入",
      "購入から半年後、ビジネス縮小で実使用が 12 台に減少",
      "Cost Explorer: RI Utilization が 60%",
      "未使用枠が継続発生"
    ],
    parts: [
      {
        q: "最初に試せる現実的な対応は？",
        type: "single",
        choices: [
          "Marketplace で余剰 RI の売却を検討 (Standard RI は売却可能)",
          "RI を Convertible に変換",
          "AWS Support に返金依頼",
          "Convertible RI で代替"
        ],
        a: 0,
        explain: "Standard RI は Marketplace 売却可能 (米国銀行口座等の条件あり)。Convertible への変換や返金は不可。"
      },
      {
        q: "売却が難しい場合の次善策は？",
        type: "single",
        choices: [
          "余剰枠を別ワークロード (検証 / バッチ) に活用し Utilization を 100% に近づける",
          "RI を破棄",
          "Stop で停止",
          "Spot に切替"
        ],
        a: 0,
        explain: "サイズ柔軟性 (Linux/UNIX + Regional + default tenancy) なら他のサイズに按分適用される。Utilization を上げる工夫が最後の砦。"
      },
      {
        q: "今後の購入戦略として妥当なのは？",
        type: "single",
        choices: [
          "ベース部分を 3 年で取り、変動分は Compute SP 1 年で柔軟に",
          "全て 3 年 All Upfront Standard RI",
          "全てオンデマンド",
          "全て Convertible RI 3 年 All Upfront"
        ],
        a: 0,
        explain: "層別にコミットを組むことが過剰投資のリスクを下げる。"
      }
    ],
    explain: "コミットは『絶対に使う最低限から』。買いすぎは取り返しが付きにくい。"
  },

  // ===== シナリオ 7: gp2 → gp3 =====
  { id: "sce-007", topic: "scenario", type: "scenario", difficulty: 1,
    q: "gp2 を使い続けている EC2",
    context: [
      "EC2 25 台、各 EC2 に 200 GB の gp2 EBS",
      "CloudWatch: 平均 IOPS 500、ピーク 2000",
      "gp3 のベースライン (3000 IOPS / 125 MB/s) で十分",
      "gp2 単価 $0.10/GB-月、gp3 単価 $0.08/GB-月"
    ],
    parts: [
      {
        q: "移行の最初のステップは？",
        type: "single",
        choices: [
          "Elastic Volumes でオンラインに gp2 → gp3 に変換",
          "EC2 を停止して再構築",
          "Snapshot を取って別 EBS で復元",
          "Multi-AZ に変更"
        ],
        a: 0,
        explain: "オンラインで gp2 → gp3 に切替可能。短時間のパフォーマンス低下に注意するが、本番でも実施可能。"
      },
      {
        q: "25 台 × 200 GB = 5000 GB を移行した時の容量料金削減は (USD/月)?",
        type: "single",
        choices: [
          "$100",
          "$50",
          "$200",
          "$10"
        ],
        a: 0,
        explain: "5000 × ($0.10 - $0.08) = $100/月。年間 $1200。IOPS 要件がベースライン内なら追加課金なし。"
      }
    ],
    explain: "gp2 → gp3 は典型的な『すぐ効くコスト削減』。要件が範囲内なら無条件で実施。"
  },

  // ===== シナリオ 8: Read Replica 多すぎ =====
  { id: "sce-008", topic: "scenario", type: "scenario", difficulty: 2,
    q: "リードレプリカ管理されていない",
    context: [
      "RDS for MySQL Multi-AZ プライマリ + リードレプリカ 5 台",
      "アプリの DB アクセス先確認: リードレプリカ 5 台中、実利用 2 台",
      "3 台はテスト用に作って放置",
      "各 Replica は db.m5.large 単価 $0.20/h"
    ],
    parts: [
      {
        q: "最初のアクションは？",
        type: "single",
        choices: [
          "未使用 Replica 3 台を削除 (アプリ接続先を再確認した上で)",
          "全 Replica を Multi-AZ 化",
          "全 Replica を Spot 化",
          "全 Replica を別リージョンに移動"
        ],
        a: 0,
        explain: "未使用 Replica 3 台 = $0.20×730×3 = $438/月の削減。利用確認は CloudWatch DatabaseConnections / Performance Insights で。"
      },
      {
        q: "残す 2 台に対するコスト最適化は？",
        type: "multi",
        choices: [
          "Reserved DB Instance を購入 (Replica にも RI 適用)",
          "Storage を gp3 に",
          "全て Multi-AZ 必須にする",
          "Public Accessible にする"
        ],
        a: [0, 1],
        explain: "Replica にも RI が効く。gp3 切替も有効。Multi-AZ 化は SLA 要件次第、Public は逆にコスト増。"
      }
    ],
    explain: "Replica は『使われていない』ものを放置しがち。月数回の棚卸しを習慣化。"
  },

  // ===== シナリオ 9: 開発環境 24h =====
  { id: "sce-009", topic: "scenario", type: "scenario", difficulty: 1,
    q: "開発環境を 24h 動かしっぱなし",
    context: [
      "開発 EC2 m5.large × 5 台 24h 稼働 (実際の利用は平日 9-19 時)",
      "開発 RDS db.m5.large Single-AZ も 24h",
      "週末誰もアクセスしていない",
      "本番ではない"
    ],
    parts: [
      {
        q: "最も簡単な削減策は？",
        type: "single",
        choices: [
          "夜間と週末を停止 (EventBridge Scheduler + Lambda で自動化)",
          "Multi-AZ にする",
          "全てを 3 年 RI",
          "Public IP を解放"
        ],
        a: 0,
        explain: "平日 10h × 5 日 = 50h/週、月 ≒ 215h で 24h 稼働 (730h) の約 30%。コストも 30% 弱に。"
      },
      {
        q: "RDS の停止 / 起動を自動化する時の注意点は？",
        type: "single",
        choices: [
          "RDS は Stop しても 7 日後に自動起動するため、再 Stop を毎週スケジュール",
          "RDS は永久に Stop 可能",
          "リードレプリカ付きでも Stop 可能",
          "Multi-AZ は Stop 不可"
        ],
        a: 0,
        explain: "RDS Stop は最大 7 日。EventBridge Cron で『毎週月曜 Stop』を再実行。リードレプリカ付き RDS は Stop 不可。Multi-AZ は Stop 可能。"
      }
    ],
    explain: "開発環境の自動停止 / 起動はコスト最適化の王道。Multi-AZ や RI より先に検討する。"
  },

  // ===== シナリオ 10: バックアップ過剰 =====
  { id: "sce-010", topic: "scenario", type: "scenario", difficulty: 2,
    q: "RDS バックアップが膨れ上がっている",
    context: [
      "RDS for PostgreSQL Multi-AZ, データ 500 GB",
      "自動バックアップ Retention = 35 日 (最大)",
      "手動 Snapshot 100 個 (テスト時に取って放置)",
      "Cost Explorer: RDS Backup Storage が月 $400"
    ],
    parts: [
      {
        q: "最初に着手する整理は？",
        type: "single",
        choices: [
          "手動 Snapshot 100 個のうち不要なものを削除 (関係者確認後)",
          "自動バックアップを 0 日に",
          "Multi-AZ を解除",
          "Aurora に移行"
        ],
        a: 0,
        explain: "手動 Snapshot の放置は典型的な漏れ。世代管理ポリシーを決めて削除。AWS Backup / DLM で自動化。"
      },
      {
        q: "自動バックアップの保持期間の見直しとして妥当なのは？",
        type: "single",
        choices: [
          "業務要件 (例: 14 日 PITR で十分) を確認して短縮",
          "35 日のまま固定",
          "0 日に変更",
          "1 日に変更"
        ],
        a: 0,
        explain: "Retention 長いほどログ含めバックアップが増える。要件レベルに合わせる。短縮で月数十〜数百ドル削減になり得る。"
      }
    ],
    explain: "RDS バックアップ系コストは『手動 Snapshot 整理 + Retention 見直し』が定番。"
  },

  // ===== シナリオ 11: ALB 二重 =====
  { id: "sce-011", topic: "scenario", type: "scenario", difficulty: 2,
    q: "ALB が無駄に増えている",
    context: [
      "本番アカウントに ALB が 18 個",
      "うち 5 個はテスト用で放置 (アクセス 0)",
      "ALB 単独固定料金 $18/月 = $90/月の無駄",
      "Trusted Advisor で『Idle Load Balancers』警告"
    ],
    parts: [
      {
        q: "最初の対応は？",
        type: "single",
        choices: [
          "Idle ALB 5 個を削除 (関係者確認後)",
          "Idle ALB を Spot に変換",
          "Idle ALB を Multi-AZ に変更",
          "Idle ALB を ECR にコピー"
        ],
        a: 0,
        explain: "Idle ALB は最も即効性のある削減。Trusted Advisor の警告は『そのまま着手すべき宝』。"
      },
      {
        q: "再発防止策として妥当なのは？",
        type: "multi",
        choices: [
          "タグポリシーで Owner / Project / Environment を必須化",
          "AWS Config Rules で『未使用 7 日経過の LB』を検知",
          "全ての ALB を Reserved にする",
          "全ての ALB を NLB に変換"
        ],
        a: [0, 1],
        explain: "タグ + 監査で『誰が作って何が使っているか』を明確化。Reserved や NLB 変換は本質的な解ではない。"
      }
    ],
    explain: "LB 系は常駐課金が累積しやすい。月次棚卸しでチェック。"
  },

  // ===== シナリオ 12: 大量データ転送 =====
  { id: "sce-012", topic: "scenario", type: "scenario", difficulty: 3,
    q: "Internet エグレスが急増",
    context: [
      "Web サービス、月次 Internet エグレス 5 TB → 30 TB",
      "Origin = EC2 + ALB",
      "クライアントは画像 / 動画を大量にダウンロード",
      "CloudFront 未使用"
    ],
    parts: [
      {
        q: "最も効果的な対策は？",
        type: "single",
        choices: [
          "CloudFront を導入し静的アセットをエッジ配信 (オリジン → CloudFront 間は安価、エッジ → ユーザは CloudFront 単価)",
          "EC2 を別リージョンに移動",
          "EC2 を Spot 化",
          "RDS をリードレプリカ化"
        ],
        a: 0,
        explain: "大量配信は CDN が王道。CloudFront 経由でエッジキャッシュ + 単価削減。"
      },
      {
        q: "CloudFront の料金構造として正しいものは？",
        type: "single",
        choices: [
          "Edge → ユーザのデータ転送 (GB 単価) + リクエスト数",
          "完全無料",
          "オリジン (S3 / EC2) と同じ料金",
          "リージョンごとの固定費"
        ],
        a: 0,
        explain: "CloudFront は『エッジロケーションごとの転送料 + リクエスト料』。リージョン直 Internet エグレスより GB 単価が安い。"
      }
    ],
    explain: "大量 Internet エグレス → CDN 導入が定石。"
  },

  // ===== シナリオ 13: t系 unlimited 高負荷 =====
  { id: "sce-013", topic: "scenario", type: "scenario", difficulty: 3,
    q: "T 系 Unlimited で意外と高い請求",
    context: [
      "t3.medium × 10 台",
      "CPU 平均 70%、ピーク 95%",
      "T 系 Unlimited モード",
      "CPU Surplus Credits Charged が高い"
    ],
    parts: [
      {
        q: "最も妥当な是正は？",
        type: "single",
        choices: [
          "m5 / c5 などの定格インスタンスに切り替え (常時高 CPU の用途には T 系不向き)",
          "T 系 Standard モードに切替",
          "Multi-AZ にする",
          "Snapshot を取る"
        ],
        a: 0,
        explain: "T 系は『たまにバースト』向け。常時高 CPU では Unlimited の超過課金で結果的に m / c より高くなる。"
      },
      {
        q: "判断のための監視メトリクスとして妥当なのは？",
        type: "multi",
        choices: [
          "CPUUtilization",
          "CPUSurplusCreditsCharged",
          "BurstBalance (T 系の CPU クレジット残)",
          "RDS DatabaseConnections"
        ],
        a: [0, 1, 2],
        explain: "CPU 使用率 + Surplus Credits Charged + クレジット残量で T 系の費用効率を判定。"
      }
    ],
    explain: "T 系 Unlimited の過剰課金は気付きにくい。常時負荷の高いものは m/c に。"
  },

  // ===== シナリオ 14: クロスリージョン Replica =====
  { id: "sce-014", topic: "scenario", type: "scenario", difficulty: 2,
    q: "クロスリージョン Read Replica の課金",
    context: [
      "プライマリ: ap-northeast-1 (Tokyo) RDS Multi-AZ",
      "DR: us-east-1 (N. Virginia) に Read Replica × 1 (Single-AZ)",
      "Replica は災害時のみ使う想定で平時アクセスゼロ",
      "クロスリージョンの転送費が月 $200"
    ],
    parts: [
      {
        q: "DR コストを下げる最初のアプローチは？",
        type: "single",
        choices: [
          "Replica のサイズを小さく (例: db.m5.large → db.t3.medium) して災害時にスケールアップ",
          "Replica を Multi-AZ に",
          "Replica を Public Accessible に",
          "プライマリを Stop"
        ],
        a: 0,
        explain: "平時は小さくしておき、災害時にスケールアップ。DR 用の典型パターン (Pilot Light)。"
      },
      {
        q: "クロスリージョン Replica vs 定期 Snapshot コピーのコスト比較は？",
        type: "single",
        choices: [
          "RPO (許容データ損失) が短い (秒〜分) なら Replica、長くて良い (日次) なら Snapshot コピー",
          "両者は同額",
          "Replica が常に安い",
          "Snapshot コピーは無料"
        ],
        a: 0,
        explain: "Replica は同期コストと常時稼働費が乗る代わりに RPO が短い。Snapshot コピーは日次 RPO だが安価。"
      }
    ],
    explain: "DR は要件レベル (RTO / RPO) でコスト構成が大きく変わる。"
  },

  // ===== シナリオ 15: 未タグリソース =====
  { id: "sce-015", topic: "scenario", type: "scenario", difficulty: 2,
    q: "誰が作ったかわからない高額リソース",
    context: [
      "EC2 m5.4xlarge × 2 台が 6 ヶ月稼働、誰も把握していない",
      "タグなし",
      "Cost Explorer で発見、月 $584 (オンデマンド)",
      "Owner / Project / Environment が不明"
    ],
    parts: [
      {
        q: "最初の対応として最も適切なのは？",
        type: "single",
        choices: [
          "Stop して 1 週間様子見 (利用者の連絡を待つ) → 連絡なければ Terminate",
          "即 Terminate",
          "EIP を割り当て直す",
          "Multi-AZ にする"
        ],
        a: 0,
        explain: "Stop で『動いていることに依存している誰か』が分かる。問題なければ Terminate。EBS 課金は継続するので長引かせない。"
      },
      {
        q: "再発防止として組織で導入すべき仕組みは？",
        type: "multi",
        choices: [
          "Tag Policies で必須タグ強制 (Owner / Project / Environment)",
          "AWS Config Rules で未タグリソースを継続監視",
          "Service Control Policy でタグ無しリソース作成を拒否",
          "Multi-AZ を全リソースに強制"
        ],
        a: [0, 1, 2],
        explain: "タグ強制 + 監査 + SCP の組み合わせ。Multi-AZ 強制は無関係。"
      }
    ],
    explain: "出所不明リソースはどの組織でも発生する。タグガバナンスと棚卸しを習慣化。"
  },

  // ===== シナリオ 16: Aurora 検討 =====
  { id: "sce-016", topic: "scenario", type: "scenario", difficulty: 3,
    q: "RDS for MySQL Aurora 移行検討 (参考)",
    context: [
      "RDS for MySQL Multi-AZ db.r5.2xlarge × プライマリ + Read Replica × 3",
      "ストレージ 1 TB",
      "I/O は中程度",
      "本問では Aurora は『参考知識』として整理する"
    ],
    parts: [
      {
        q: "Aurora と従来 RDS のコスト面の最大の違いは？",
        type: "single",
        choices: [
          "Aurora は I/O リクエスト課金がある (標準モード) / Aurora I/O-Optimized なら I/O 無料の代わりインスタンス単価が高い",
          "Aurora は Multi-AZ できない",
          "Aurora は永久無料",
          "Aurora はストレージ自動拡張不可"
        ],
        a: 0,
        explain: "Aurora 標準: I/O リクエスト課金 ($0.20 / 100 万 I/O 程度)。Aurora I/O-Optimized: I/O 無料だがインスタンス料金 +30% 程度。書込み重視か否かで選ぶ。"
      },
      {
        q: "本問のスコープ (そのまま RDS で運用) で押さえるべきポイントは？",
        type: "single",
        choices: [
          "Aurora 移行は範囲外。RDS のままで Right-Sizing / RI / gp3 / Replica 整理を優先",
          "Aurora を即導入",
          "Aurora は無料なので即移行",
          "Aurora は廃止された"
        ],
        a: 0,
        explain: "本コースのスコープは RDS そのまま運用。Aurora は別軸の選択肢として知っておくだけで良い。"
      }
    ],
    explain: "Aurora は I/O 課金の有無で 2 モード。RDS で十分な場合は移行コストと比較。"
  },

  // ===== シナリオ 17: クロスアカウントコピー =====
  { id: "sce-017", topic: "scenario", type: "scenario", difficulty: 3,
    q: "クロスアカウントスナップショット",
    context: [
      "本番アカウント A: 毎日 RDS / EBS Snapshot 自動取得",
      "DR アカウント B: 自動コピーされた Snapshot を保持",
      "暗号化: A で CMK を使い、B で別の CMK にリキー",
      "コスト増加: KMS API 課金と Backup Storage 双方"
    ],
    parts: [
      {
        q: "コスト最適化として検討すべきは？",
        type: "multi",
        choices: [
          "DR 用 Snapshot の保持本数を要件分まで絞る",
          "B 側で不要になった Snapshot は速やかに削除",
          "KMS の CMK を統一して API コール数を減らす",
          "全 Snapshot を Multi-AZ にする"
        ],
        a: [0, 1, 2],
        explain: "DR Snapshot は『枚数 × 保管料 + KMS API + 転送料』。本数 / Key / 不要分掃除で複合的に削減。"
      },
      {
        q: "全 Snapshot を A → B にコピーすべきか。",
        type: "single",
        choices: [
          "業務要件 (RTO/RPO) と照らして必要分のみコピーするのが最適",
          "全 Snapshot 必ずコピー",
          "コピー不要",
          "コピーは 1 ヶ月 1 回でよい"
        ],
        a: 0,
        explain: "DR 要件と費用のバランス。重要度低のリソースは A だけで持つ判断もあり。"
      }
    ],
    explain: "クロスアカウント DR は『枚数 × 単価 × 期間 × Key』の積で増える。設計時に上限を切る。"
  },

  // ===== シナリオ 18: AMI 蓄積 =====
  { id: "sce-018", topic: "scenario", type: "scenario", difficulty: 2,
    q: "AMI が大量に溜まっている",
    context: [
      "AMI 500 個、紐づくスナップショットも保管",
      "毎週のリリースで新 AMI を作成、古い AMI を deregister するが Snapshot は残る",
      "EBS Snapshot 料金が高い",
      "孤児スナップショット多数"
    ],
    parts: [
      {
        q: "最初の整理アクションは？",
        type: "single",
        choices: [
          "Deregister された AMI の Snapshot (孤児) を抽出して削除",
          "全 AMI を再登録",
          "全 AMI を Spot 化",
          "全 AMI を Multi-AZ 化"
        ],
        a: 0,
        explain: "孤児 Snapshot の削除が最も効く。AMI 一覧と Snapshot 一覧の突き合わせで抽出。"
      },
      {
        q: "再発防止策として最も妥当なのは？",
        type: "single",
        choices: [
          "AMI 作成時の Tag に世代情報を付与し、DLM / Lambda で deregister + Snapshot 削除を一括実行",
          "全 AMI を保持し続ける",
          "AMI を作らない",
          "AMI を AWS Support に管理してもらう"
        ],
        a: 0,
        explain: "AMI deregister と Snapshot 削除を必ずペアで実行する自動化が必要。"
      }
    ],
    explain: "AMI / Snapshot は時間とともに増え続ける典型例。ライフサイクル自動化が必須。"
  },

  // ===== シナリオ 19: SLA 過剰 =====
  { id: "sce-019", topic: "scenario", type: "scenario", difficulty: 3,
    q: "過剰な可用性設計",
    context: [
      "社内ツール (利用者 30 人)、平日 9-19 時のみ利用",
      "RDS Multi-AZ Cluster (3 ノード)",
      "EC2 m5.large × 3 台 (3 AZ 冗長)",
      "ALB / NAT GW 3 AZ"
    ],
    parts: [
      {
        q: "コスト最適化として妥当な見直しは？",
        type: "multi",
        choices: [
          "RDS を Single-AZ または Multi-AZ (2 ノード) に変更",
          "EC2 を 2 台に削減",
          "NAT GW を 1 個に集約",
          "平日 9-19 時以外は Stop"
        ],
        a: [0, 1, 2, 3],
        explain: "社内ツールは可用性要件が緩い。過剰な冗長性を削り、運用時間に合わせて停止。"
      },
      {
        q: "SLA 要件を顧客向け本番と同じレベルにすべきか。",
        type: "single",
        choices: [
          "業務影響度に応じて層別に決める。社内ツールはレベルを落としてコスト削減",
          "全システムを最高 SLA に",
          "Multi-AZ Cluster を全システムに",
          "全システムを Multi-Region に"
        ],
        a: 0,
        explain: "全システムを最高品質にするとコストが膨らむ。業務影響度ベースで階層化するのが現代の SRE / FinOps の基本。"
      }
    ],
    explain: "可用性は要件に応じて。コスト最適化は『要件レベルを正しく決める』ところから始まる。"
  },

  // ===== シナリオ 20: 月次レビュー =====
  { id: "sce-020", topic: "scenario", type: "scenario", difficulty: 2,
    q: "月次コストレビューでの典型チェック",
    context: [
      "毎月 1 回のコストレビューを始めたい",
      "Cost Explorer / Trusted Advisor / Compute Optimizer は使える",
      "目標: 月次で 3〜5% 削減",
      "規模: 月額 $20,000"
    ],
    parts: [
      {
        q: "月次レビューで最初に見るべきトピックは？",
        type: "single",
        choices: [
          "Cost Explorer の前月比 / 異常検知 + Trusted Advisor の Cost Optimization 結果",
          "EC2 起動時間",
          "RDS Multi-AZ の数",
          "ALB のレスポンス時間"
        ],
        a: 0,
        explain: "前月比の変化点 + Trusted Advisor の警告を最初の入口に。Cost Anomaly Detection の発報があればそちらを優先。"
      },
      {
        q: "削減アクションの優先順として妥当な並びは？",
        type: "single",
        choices: [
          "Right-Sizing → Idle 削除 → RI/SP 適用 → ストレージ最適化 → データ転送最適化",
          "Multi-AZ 解除 → 全 Spot 化 → 削減完了",
          "全リージョン移転 → 全 Reserved",
          "ランダムに削減"
        ],
        a: 0,
        explain: "効きやすく副作用の小さい順に。Right-Sizing と Idle 削除が一番効きやすく、その上でコミットメント。"
      },
      {
        q: "削減目標を継続的に達成するための仕組みとして妥当なのは？",
        type: "multi",
        choices: [
          "毎月の定例レビュー会で削減アクション一覧と進捗を共有",
          "Cost Anomaly Detection で異常を即検知",
          "タグ強制と棚卸しを四半期で実施",
          "Multi-AZ をやめる"
        ],
        a: [0, 1, 2],
        explain: "プロセス化 + 自動検知 + 棚卸し が三本柱。コスト最適化は単発の施策ではなく継続的な営み。"
      }
    ],
    explain: "FinOps は『可視化 → 最適化 → 運用化』のサイクル。月次レビューを定着させるのが王道。"
  },

  // ===== シナリオ 21: 簡易判定問題 (短め) =====
  { id: "sce-021", topic: "scenario", type: "scenario", difficulty: 2,
    q: "EBS 未使用ボリューム",
    context: [
      "Cost Explorer: EBS の容量料金が増加傾向",
      "EC2 を削減したのに EBS は減っていない"
    ],
    parts: [
      {
        q: "原因として最も可能性が高いのは？",
        type: "single",
        choices: [
          "EC2 終了時に DeleteOnTermination=false だったデータボリュームが残存",
          "EBS が自動拡張",
          "EBS のスナップショットが取り過ぎ",
          "Multi-AZ EBS が増えた"
        ],
        a: 0,
        explain: "DeleteOnTermination=false で付け足したデータ用 EBS は EC2 終了後も残る。棚卸しで発見し削除。"
      }
    ],
    explain: "未使用 EBS は典型的な見落とし。Trusted Advisor / Cost Explorer で定期的に確認。"
  },

  // ===== シナリオ 22: =====
  { id: "sce-022", topic: "scenario", type: "scenario", difficulty: 2,
    q: "Performance Insights 長期保持コスト",
    context: [
      "RDS Multi-AZ db.r5.4xlarge × 5 台 (8 vCPU)",
      "全インスタンスで Performance Insights 24 ヶ月リテンション有効",
      "Cost Explorer に PI 料金が新たに $560/月",
    ],
    parts: [
      {
        q: "原因と最初の削減策は？",
        type: "single",
        choices: [
          "PI 長期保持は vCPU 単位で課金。要件のない DB は 7 日無料リテンションに戻す",
          "全 RDS を Spot 化",
          "全 RDS を Single-AZ 化",
          "PI を CloudWatch に切替"
        ],
        a: 0,
        explain: "PI 長期保持は vCPU × 月額単価。大きい RDS で複数 DB だと月額が大きくなる。要件のない DB は 7 日に戻す。"
      }
    ],
    explain: "PI 長期保持は『vCPU × 月額』。気軽に全 DB で 24 ヶ月にすると効く。"
  }
);
