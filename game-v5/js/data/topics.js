/* トピック定義 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.topics = [
  { id: "ec2-pricing",  emoji: "💵", name: "EC2 料金モデル",      description: "On-Demand / RI (Std/Conv) / Savings Plans / Dedicated / 課金単位" },
  { id: "ec2-instance", emoji: "🖥",  name: "EC2 インスタンス選定", description: "ファミリ・世代・Graviton・T系バースト・テナンシー" },
  { id: "ebs",          emoji: "💾", name: "EBS / スナップショット", description: "gp2 / gp3 / io1 / io2 / st1 / sc1 / Snapshot / AMI" },
  { id: "network",      emoji: "🌐", name: "データ転送 / VPC",      description: "リージョン内外 / NAT GW / VPC Endpoint / Public IPv4" },
  { id: "elb",          emoji: "⚖",  name: "ELB",                  description: "ALB / NLB / CLB / LCU / NLCU" },
  { id: "rds-basic",    emoji: "🛢", name: "RDS 基礎",              description: "エンジン / ライセンス / Single-AZ vs Multi-AZ / 停止" },
  { id: "rds-storage",  emoji: "📦", name: "RDS ストレージ",        description: "gp2 / gp3 / io1 (RDS) / IOPS / 自動拡張" },
  { id: "rds-backup",   emoji: "🗄",  name: "RDS バックアップ / レプリカ", description: "自動バックアップ / PITR / Snapshot / Read Replica" },
  { id: "ri-sp",        emoji: "🎟", name: "RI / Savings Plans 応用", description: "Std vs Conv, Compute vs EC2 Instance SP, Marketplace" },
  { id: "cost-tools",   emoji: "🔧", name: "コスト管理ツール",     description: "Cost Explorer / Budgets / CUR / Trusted Advisor / Compute Optimizer / Tags" },
  { id: "region-free",  emoji: "🌏", name: "リージョン / Free Tier", description: "リージョン価格差 / 12 ヶ月無料 / 永続無料" },
  { id: "calc",         emoji: "🧮", name: "計算ドリル",            description: "月額・転送費・ストレージ・RI 実効単価などの数値計算" },
  { id: "scenario",     emoji: "🕵", name: "シナリオ診断",          description: "構成 / 月次明細を見て無駄を見抜く総合問題" },
];
