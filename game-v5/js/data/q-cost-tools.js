/* コスト管理ツール — 40+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== Cost Explorer =====
  { id: "ct-001", topic: "cost-tools", type: "single", difficulty: 1,
    q: "AWS Cost Explorer の基本機能 (グラフ表示・フィルタ) は？",
    choices: [
      "無料で利用可能 (API 呼び出しのみ別料金)",
      "月額 $10",
      "Enterprise Support 必須",
      "Business Support 限定"
    ],
    a: 0,
    explain: "Cost Explorer の UI / 標準レポートは無料。API ($0.01/リクエスト) のみ有料。コスト分析のホームベース。"
  },
  { id: "ct-002", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Explorer で『時系列でコスト変化を見たい』時に使える典型的なディメンジョンは？",
    choices: [
      "Service / Linked Account / Tag / Usage Type / Region",
      "EC2 タイプのみ",
      "アカウント数のみ",
      "AZ 数のみ"
    ],
    a: 0,
    explain: "Cost Explorer は多次元分析。Service / Account / Tag / Usage Type で内訳を細かく見られる。タグはコスト配賦タグの有効化が前提。"
  },
  { id: "ct-003", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Explorer の予測 (Forecast) 機能は？",
    choices: [
      "過去の傾向から月末までの予測値を表示。無料",
      "AWS Support 経由でのみ閲覧可能",
      "月額 $100",
      "Enterprise Support 限定"
    ],
    a: 0,
    explain: "Forecast 機能は無料。月の途中で着地予測を確認できる。コスト急増時のキャッチに有効。"
  },

  // ===== Budgets =====
  { id: "ct-010", topic: "cost-tools", type: "single", difficulty: 1,
    q: "AWS Budgets の料金は？",
    choices: [
      "月 2 つまで無料、それ以上は 1 Budget あたり月 $0.02 程度",
      "全 Budgets が無料",
      "1 Budgets 月 $10",
      "Budget は廃止された"
    ],
    a: 0,
    explain: "最初の 2 つは無料、3 つ目以降は 1 Budget あたり日 $0.02 / 月 $0.6 程度 (リージョン差あり)。安いので積極的に使うのが標準。"
  },
  { id: "ct-011", topic: "cost-tools", type: "multi", difficulty: 2,
    q: "AWS Budgets で監視できるものを 2 つ以上選べ。",
    choices: [
      "コスト (USD)",
      "使用量 (例: EC2 時間)",
      "RI / SP の Utilization・Coverage",
      "EC2 の CPU 使用率"
    ],
    a: [0, 1, 2],
    explain: "Budgets はコスト・使用量・RI/SP の利用率/カバレッジ・予約済み量を監視できる。CPU 使用率は CloudWatch アラームの守備範囲。"
  },
  { id: "ct-012", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Budgets Actions の機能は？",
    choices: [
      "閾値超過時に IAM ポリシー適用 / EC2 停止 / SNS 通知などのアクションを自動実行",
      "月次レポートを PDF 出力",
      "毎月予算を自動倍に増やす",
      "AWS Support に自動連絡"
    ],
    a: 0,
    explain: "Budgets Actions は閾値超過時の自動アクション (IAM Deny ポリシー / EC2 / RDS の Stop / SCP 適用 など)。コスト暴走を止める仕組み。"
  },

  // ===== CUR =====
  { id: "ct-020", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Cost and Usage Reports (CUR) は何を提供するか。",
    choices: [
      "請求情報を最も詳細な粒度 (1 時間 / リソース ID) で S3 に出力するレポート",
      "EC2 の起動ログ",
      "VPC の通信履歴",
      "CloudWatch のメトリクスダンプ"
    ],
    a: 0,
    explain: "CUR は AWS 課金の生データ (約 150+ カラム)。S3 に置かれ、Athena / Glue / QuickSight で分析。CUR 自体は無料 (S3 ストレージ料のみ)。"
  },
  { id: "ct-021", topic: "cost-tools", type: "single", difficulty: 2,
    q: "CUR で『どのリソース ID にどれだけの請求が出ているか』を見るには？",
    choices: [
      "`includeResourceIds` を有効にして出力された CUR を Athena / QuickSight で分析",
      "Cost Explorer の Service ビュー",
      "CloudTrail のイベント",
      "AWS Config の履歴"
    ],
    a: 0,
    explain: "CUR にリソース ID を含めると、リソース単位の課金を Athena で抽出できる。Cost Explorer よりさらに詳細。"
  },
  { id: "ct-022", topic: "cost-tools", type: "single", difficulty: 3,
    q: "CUR の使い道として典型的でないのは？",
    choices: [
      "リアルタイムでアプリ内に表示する",
      "プロジェクト / 部門ごとのコスト按分",
      "RI / SP の利用率を細かく追跡",
      "コスト異常の原因をリソース ID 単位で深掘り"
    ],
    a: 0,
    explain: "CUR は日次出力 (リアルタイムではない)。リアルタイム表示なら Cost Explorer の API か Cost Anomaly Detection を活用。"
  },

  // ===== Trusted Advisor =====
  { id: "ct-030", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Trusted Advisor の Cost Optimization カテゴリで提示される代表的なチェックは？",
    choices: [
      "Idle Load Balancers / Underutilized EBS / Underutilized EC2 / Unassociated EIP / RI Optimization",
      "AZ 数の最適化",
      "OS の脆弱性スキャン",
      "Web ページの SEO"
    ],
    a: 0,
    explain: "Trusted Advisor は『Cost Optimization』『Security』『Fault Tolerance』『Performance』『Service Limits』『Operational Excellence』の 6 カテゴリ。コストは未使用 LB、未関連 EIP、未使用 EBS など。"
  },
  { id: "ct-031", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Trusted Advisor のフルチェックを利用するには？",
    choices: [
      "Business / Enterprise / Enterprise On-Ramp Support 加入が必要 (Core サポートは限定的)",
      "Free 版でも全チェック使える",
      "Marketplace で別途購入",
      "1 度きりのスポット課金"
    ],
    a: 0,
    explain: "Core (Basic / Developer) ではセキュリティと制限の一部のみ。フル機能は Business 以上が必要。"
  },

  // ===== Compute Optimizer =====
  { id: "ct-040", topic: "cost-tools", type: "single", difficulty: 1,
    q: "AWS Compute Optimizer の料金は？",
    choices: [
      "標準推奨は無料。Enhanced 推奨 (拡張) は別料金",
      "完全無料",
      "Enterprise Support 限定",
      "Marketplace で購入"
    ],
    a: 0,
    explain: "Compute Optimizer の基本推奨は無料。Enhanced Infrastructure Metrics (有料オプション) は CloudWatch Agent などのメトリクスを使った精度向上版。"
  },
  { id: "ct-041", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Compute Optimizer の対象リソースは？",
    choices: [
      "EC2 / EBS / Lambda / Auto Scaling Group / ECS on Fargate",
      "S3 / DynamoDB / CloudFront",
      "RDS / Aurora",
      "VPC / Direct Connect"
    ],
    a: 0,
    explain: "Compute Optimizer は『Compute』向け。EC2 / ASG / EBS / Lambda / Fargate ECS。RDS には Compute Optimizer 推奨はない (代わりに CloudWatch / Performance Insights を使う)。"
  },
  { id: "ct-042", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Compute Optimizer が EC2 リサイズ提案を出す根拠は？",
    choices: [
      "CloudWatch メトリクス (CPU / メモリ※ / ネットワーク / ディスク) を 14 日分以上学習",
      "AWS Support のレビュー",
      "Marketplace のレビュー",
      "Twitter のトレンド"
    ],
    a: 0,
    explain: "標準メトリクスから学習。メモリは CloudWatch Agent を入れないと取れないので、入れたほうが精度が上がる。"
  },

  // ===== Pricing Calculator =====
  { id: "ct-050", topic: "cost-tools", type: "single", difficulty: 1,
    q: "AWS Pricing Calculator の料金は？",
    choices: ["完全無料", "Enterprise Support 限定", "Marketplace 経由", "月 $10"],
    a: 0,
    explain: "Pricing Calculator は無料。アカウント未取得でも使える。設計段階の見積もりに最適。"
  },
  { id: "ct-051", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Pricing Calculator で見積もる時にやりがちな見落としは？",
    choices: [
      "データ転送 (Internet エグレス / クロス AZ / NAT GW 通過) を低めに見積もる",
      "EC2 オンデマンド単価を間違える",
      "Region を変える",
      "通貨を JPY にする"
    ],
    a: 0,
    explain: "見積もり実務でよく抜けるのが転送費 / NAT GW / Public IPv4 課金 / CloudWatch Logs / バックアップ。Pricing Calculator では明示入力が必要。"
  },

  // ===== Cost Allocation Tags =====
  { id: "ct-060", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Allocation Tag を使うために必要な操作は？",
    choices: [
      "Billing Console で『コスト配賦タグの有効化』を実施 (有効化以降の請求から反映)",
      "S3 に保存する",
      "毎日有効化が必要",
      "AWS Support の承認が必要"
    ],
    a: 0,
    explain: "コスト配賦タグは Billing Console で有効化。AWS マネージドタグ (aws:*) とユーザ定義タグ (user:*) があり、有効化したものだけ Cost Explorer / CUR に出る。"
  },
  { id: "ct-061", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Allocation Tag が有効化された後の挙動は？",
    choices: [
      "有効化以降の請求データから反映され、過去には遡らない",
      "全期間遡って反映される",
      "翌月分のみ反映",
      "Multi-AZ なら遡及反映"
    ],
    a: 0,
    explain: "Tag 有効化は前向き反映。プロジェクト立ち上げ時に早めに設計するのが鉄則。"
  },
  { id: "ct-062", topic: "cost-tools", type: "single", difficulty: 2,
    q: "コスト配賦タグの最大個数 (アカウントあたり) は？",
    choices: ["最大 500", "最大 50", "最大 10", "上限なし"],
    a: 0,
    explain: "コスト配賦タグは Active 化できる上限が 500 個。タグキーの設計を統一して使い切らないように。"
  },
  { id: "ct-063", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Organizations 配下で組織として『必須タグ』を強制する仕組みは？",
    choices: [
      "Tag Policies (Organizations) で必須タグキー / 値のルールを定義",
      "SCP で『タグなしリソース禁止』",
      "AWS Config Rules で監査",
      "上記のいずれも組み合わせて使う (Tag Policies + Config + SCP)"
    ],
    a: 3,
    explain: "Tag Policies で構造化、Config Rules で監査、SCP で『タグ未付与の作成を禁止』など、複合的に組むのが実務。"
  },

  // ===== Cost Anomaly Detection =====
  { id: "ct-070", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Cost Anomaly Detection の料金は？",
    choices: [
      "無料 (機械学習でコスト異常を検知)",
      "月 $50",
      "Enterprise Support 限定",
      "S3 ストレージ課金が発生"
    ],
    a: 0,
    explain: "Cost Anomaly Detection は無料。サービス・アカウント・タグ・コストカテゴリ単位でモニタを作成 → 異常時にメール / SNS / Chatbot 通知。"
  },
  { id: "ct-071", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Anomaly Detection で『異常』と判定される条件は？",
    choices: [
      "AWS 側の機械学習モデルが過去パターンから外れた支出を検出",
      "前月比 50% 増だけを検出",
      "毎日の支出が増えるたびに検出",
      "クリスマスのみ検出"
    ],
    a: 0,
    explain: "ML で『通常の支出傾向』を学習し、想定外の支出を異常としてアラート。閾値は AWS が決める (ユーザ設定で感度調整可)。"
  },

  // ===== AWS Organizations =====
  { id: "ct-080", topic: "cost-tools", type: "single", difficulty: 1,
    q: "AWS Organizations 配下の Consolidated Billing で得られる効果は？",
    choices: [
      "アカウント間で RI / SP の割引共有・階段式割引のまとめ (例: データ転送量を合算して上位レンジに到達)",
      "アカウントごとに別請求書",
      "アカウント数で月額固定",
      "Multi-AZ が無料化"
    ],
    a: 0,
    explain: "一括請求のメリット: (1) 1 つの請求書、(2) RI/SP の共有、(3) 階段式割引 (Bulk Discount) の合算、(4) コスト分析の一元化。"
  },
  { id: "ct-081", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Organizations 配下のメンバーアカウントが個別に Budget や Cost Anomaly Detection を作る場合の料金は？",
    choices: [
      "メンバーアカウント毎に同じ無料枠 / 課金体系が適用される",
      "管理アカウントのみ無料",
      "メンバーアカウントは追加料金 $5/月",
      "Organizations では Budget が使えない"
    ],
    a: 0,
    explain: "各アカウントで Budgets / Anomaly Detection を作成可能、無料枠もアカウント単位。管理アカウントで全体ビューを作るのが標準。"
  },

  // ===== Cost Categories =====
  { id: "ct-090", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Cost Categories の主な使い道は？",
    choices: [
      "複数の Account / Tag / Service / Region などを束ねて『業務単位の見出し』にまとめ、Cost Explorer や Budgets で利用",
      "EC2 を Spot に変換",
      "Multi-AZ を有効化",
      "リージョンを切替"
    ],
    a: 0,
    explain: "Cost Categories は『プロジェクト A の合計』『本番だけ』のような業務的なグループ化を後付けで作る機能。タグの設計が完璧でない時に有用。"
  },

  // ===== AWS Billing Conductor =====
  { id: "ct-100", topic: "cost-tools", type: "single", difficulty: 3,
    q: "AWS Billing Conductor は何のための機能か。",
    choices: [
      "Organizations 配下で『カスタム請求書』を作成し、再販事業者などが内部部門に独自レートで請求する仕組み",
      "Multi-AZ の自動切替",
      "EC2 の自動リサイズ",
      "EBS の暗号化"
    ],
    a: 0,
    explain: "Billing Conductor は再販事業者 (パートナー) や社内チャージバックに使うサービス。実コストと提示レートを切り分ける。一般企業の用途は限定的。"
  },

  // ===== その他 =====
  { id: "ct-110", topic: "cost-tools", type: "single", difficulty: 2,
    q: "請求書 (Bills) と Cost Explorer の関係は？",
    choices: [
      "請求書は AWS が確定した請求金額。Cost Explorer は分析ビューでほぼ同等の値を提示するが、丸めや反映タイミングで誤差あり",
      "Cost Explorer は使うと請求書が増える",
      "両者は全く別データソース",
      "Cost Explorer は無料、Bills は有料"
    ],
    a: 0,
    explain: "請求書が『確定値』。Cost Explorer は分析寄り。Linked Account を含む集計や、税の表示が若干異なる。CUR を直接見るのが最も詳細。"
  },
  { id: "ct-111", topic: "cost-tools", type: "single", difficulty: 1,
    q: "AWS Free Tier の利用状況を見るには？",
    choices: [
      "Billing Console の Free Tier ページで利用率を確認",
      "Cost Explorer の専用画面のみ",
      "AWS Support に問い合わせ",
      "Free Tier の利用率は見られない"
    ],
    a: 0,
    explain: "Billing コンソール → 『Free Tier』で月次利用率が見える。閾値超過時にメール通知も設定可。"
  },
  { id: "ct-112", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Service Quotas の意味は？",
    choices: [
      "リソース数の上限 (EC2 / EIP / EBS 等)。直接の料金には影響しないが、緩和要求の前に運用を見直すことでコスト最適化につながる",
      "リージョンごとの料金",
      "AWS の SLA",
      "オンデマンド単価の上限"
    ],
    a: 0,
    explain: "Service Quotas はリソース上限管理。不要なリソースが溜まって上限に達すると緩和申請しがちだが、まず棚卸し → 削減が先。"
  },
  { id: "ct-113", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Optimization Hub (AWS の新しい統合ダッシュボード) は何を提供するか。",
    choices: [
      "RI / SP / Right-Sizing / Idle / Storage 最適化など複数の推奨を 1 つの画面に集約",
      "Multi-AZ 自動化",
      "Lambda の実行ログ",
      "EBS の暗号化"
    ],
    a: 0,
    explain: "AWS Cost Optimization Hub は推奨機能の統合表示。Organizations 全体の最適化機会を可視化する。"
  },
  { id: "ct-114", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Billing Conductor / Cost Categories の違いとして正しいものは？",
    choices: [
      "Cost Categories は『分析の見出し』。Billing Conductor は『カスタム請求書発行のための擬似請求』",
      "両者は同義",
      "Billing Conductor は完全無料",
      "Cost Categories は Marketplace 限定"
    ],
    a: 0,
    explain: "Cost Categories: 分析的グルーピング (無料)。Billing Conductor: 内部請求のためのレートカスタマイズ (請求総額の % 課金)。"
  },
  { id: "ct-115", topic: "cost-tools", type: "single", difficulty: 1,
    q: "コスト管理の役割分担として、組織内で『請求書を確認する人』が見るべき主なツールは？",
    choices: [
      "Billing コンソール (請求書 / 過去明細) と Cost Explorer (分析)",
      "CloudTrail と CloudWatch",
      "AWS Config と Trusted Advisor",
      "AWS WAF と Shield"
    ],
    a: 0,
    explain: "請求担当: Billing + Cost Explorer + Budgets。エンジニア: Cost Explorer + Cost Anomaly Detection + Trusted Advisor + Compute Optimizer。"
  },
  { id: "ct-116", topic: "cost-tools", type: "single", difficulty: 2,
    q: "ChatGPT 等の AI で AWS 請求を分析するときの最適なソースは？",
    choices: [
      "CUR (S3) を CSV / Parquet で抽出して投入。AI に課金ロジック (RI / SP 適用順、データ転送ルール) を学習させて分析させる",
      "Cost Explorer の画面キャプチャ",
      "AWS Support の回答",
      "Marketplace の口コミ"
    ],
    a: 0,
    explain: "CUR が最も詳細。AI 系プロダクト (例: AWS の自然言語コスト分析) も CUR ベース。データ品質は CUR に依存する。"
  },
  { id: "ct-117", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Budgets の通知 (アラート) の受信先として正しくないのは？",
    choices: [
      "EC2 のローカルメタデータ",
      "メール",
      "SNS トピック",
      "AWS Chatbot 経由で Slack / Teams"
    ],
    a: 0,
    explain: "Budgets の通知は Email / SNS / Chatbot (Slack/Teams)。EC2 のメタデータは通知先ではない。"
  },
  { id: "ct-118", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Budgets Actions で『IAM Deny ポリシー適用』を有効にすると何が起きるか。",
    choices: [
      "閾値超過時に対象 IAM ユーザ / グループ / ロールに Deny ポリシーが付与され、新規リソース作成を抑制",
      "全アカウントが削除",
      "EC2 が無料化",
      "Multi-AZ が有効化"
    ],
    a: 0,
    explain: "Deny ポリシー適用で作成系 API を止め、コスト暴走を抑止する仕組み。閾値解除時に手動 or 自動で外す設計が必要。"
  },
  { id: "ct-119", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Marketplace で購入した SaaS の料金は AWS の請求書にどう載るか。",
    choices: [
      "AWS の請求書に統合され、Cost Explorer / CUR にも Marketplace カテゴリとして反映",
      "別請求書が郵送される",
      "Marketplace 経由は無料",
      "Marketplace は AWS と無関係"
    ],
    a: 0,
    explain: "Marketplace 購入は AWS 請求に統合。配賦タグや CUR でも追跡可。Marketplace ライセンスもコスト最適化の対象。"
  },
  { id: "ct-120", topic: "cost-tools", type: "single", difficulty: 3,
    q: "毎月のコスト最適化レビューで重点的に見るべき視点として優先度が高いのは？",
    choices: [
      "(1) Right-Sizing 候補 (2) Idle Resource (3) RI/SP の Utilization・Coverage (4) Data Transfer 異常 (5) Storage 整理",
      "(1) EC2 OS バージョン (2) 通貨 (3) AZ 数",
      "(1) Marketplace の人気商品 (2) SLA (3) サポート利用回数",
      "(1) AWS のサービス数 (2) アカウント数"
    ],
    a: 0,
    explain: "コストレビューの王道チェックリスト。月次でこれを回すと『気付かないうちの請求増』が抑えられる。"
  },
  { id: "ct-121", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Trusted Advisor の『Underutilized EBS Volumes』チェックの示すものは？",
    choices: [
      "IOPS / Throughput の使用率が低いボリュームを提案 (gp3 化 or 容量縮小の機会)",
      "AMI の未使用",
      "EBS の暗号化未実施",
      "EBS の Multi-AZ 構成"
    ],
    a: 0,
    explain: "Underutilized EBS は使用率が低いボリュームを抽出。タイプ変更・サイズ最適化のヒント。"
  },
  { id: "ct-122", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Trusted Advisor の『Low Utilization EC2 Instances』チェックの基準は？",
    choices: [
      "過去 14 日間平均 CPU 10% 未満 + ネットワーク I/O 5MB 未満などの条件",
      "EC2 が Spot かどうか",
      "Multi-AZ かどうか",
      "AZ 数"
    ],
    a: 0,
    explain: "Trusted Advisor は CPU / Network の低利用率で『過剰サイズ候補』を提示。Compute Optimizer と併用が定石。"
  },
  { id: "ct-123", topic: "cost-tools", type: "single", difficulty: 2,
    q: "Cost Explorer の『Resource Optimization Recommendations』は何を提示するか。",
    choices: [
      "Compute Optimizer 由来の EC2 Right-Sizing 推奨が Cost Explorer 内にも表示される",
      "請求書の自動修正",
      "Multi-AZ の自動切替",
      "AWS Support のチャット"
    ],
    a: 0,
    explain: "Cost Explorer の Recommendations は Compute Optimizer / SP / RI / Idle 等の推奨をハブ的に集約表示。"
  },
  { id: "ct-124", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS Application Cost Profiler の用途は？",
    choices: [
      "SaaS 事業者などが『テナント単位でリソースの利用率』を計測し請求按分するための仕組み",
      "Multi-AZ の比較",
      "EC2 タイプの比較",
      "EBS の最適化"
    ],
    a: 0,
    explain: "Application Cost Profiler はマルチテナント SaaS の按分用。一般企業の標準的コスト最適化ではあまり登場しない。"
  },
  { id: "ct-125", topic: "cost-tools", type: "single", difficulty: 2,
    q: "AWS の請求アラートを CloudWatch から飛ばす場合の必要条件は？",
    choices: [
      "Billing メトリクスは us-east-1 でのみ取得可能。リージョン固定でアラームを設定",
      "全リージョンで取得可能",
      "Multi-AZ 必須",
      "Marketplace 経由のみ"
    ],
    a: 0,
    explain: "Billing メトリクス (EstimatedCharges) は us-east-1 のみ。CloudWatch アラームを設定するときは us-east-1 を選ぶ。"
  }
);
