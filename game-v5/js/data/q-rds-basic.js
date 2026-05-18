/* RDS 基礎 — 60+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== インスタンスクラス =====
  { id: "rdsb-001", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS のインスタンスクラスでよく使われるカテゴリは？",
    choices: [
      "汎用 (db.m) / メモリ最適化 (db.r) / バーストパフォーマンス (db.t) / メモリ拡張 (db.x)",
      "汎用 (db.c) / メモリ最適化 (db.s) / バースト (db.b)",
      "Standard / Premium / Enterprise",
      "Free / Pro / Enterprise"
    ],
    a: 0,
    explain: "RDS は db.t (バースト), db.m (汎用), db.r (メモリ最適化), db.x (大メモリ) を主に使う。EC2 と同じ命名規則だが先頭に `db.` が付く。"
  },
  { id: "rdsb-002", topic: "rds-basic", type: "single", difficulty: 1,
    q: "db.t3.micro / db.t4g.micro の特徴は？",
    choices: [
      "バーストパフォーマンス。常時高負荷では不向き。フリーティアやテスト環境に向く",
      "メモリ特化",
      "Enterprise 専用",
      "Multi-AZ 必須"
    ],
    a: 0,
    explain: "db.t 系はバースト CPU 構造。EC2 の T と同じく『普段は低負荷、たまにバースト』向け。本番でクエリ負荷が常時高いと CPU クレジット枯渇でレスポンスが落ちる。"
  },
  { id: "rdsb-003", topic: "rds-basic", type: "single", difficulty: 2,
    q: "db.r6g.large の `r` と `g` の意味は？",
    choices: [
      "r = メモリ最適化、g = AWS Graviton (ARM)",
      "r = Reserved、g = General",
      "r = Read Replica、g = Gateway",
      "r = Region、g = Group"
    ],
    a: 0,
    explain: "EC2 と同じく r がメモリ最適化、g が Graviton。RDS の Graviton (db.*.g) は同等性能で 20% 程度安いことが多い。"
  },
  { id: "rdsb-004", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Graviton インスタンス (db.m6g / db.r6g など) を採用する典型的なメリットは？",
    choices: [
      "オンデマンドで 10〜20% 程度安く、エンジン (MySQL / PostgreSQL / MariaDB) も Graviton 対応で互換性高",
      "Oracle / SQL Server BYOL が無料になる",
      "Multi-AZ が無料化される",
      "リードレプリカ数が無制限になる"
    ],
    a: 0,
    explain: "Graviton は MySQL / PostgreSQL / MariaDB で利用可能。Oracle / SQL Server は限定的。EC2 と異なりアプリのアーキ互換は不要 (DB エンジン自体が ARM 対応していれば OK)。"
  },
  { id: "rdsb-005", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS のインスタンスサイズアップ時の料金倍率の感覚は？",
    choices: [
      "1 段階アップで概ね 2 倍 (EC2 と同様)",
      "1 段階アップで 1.2 倍",
      "1 段階アップで 4 倍",
      "サイズはコストに無関係"
    ],
    a: 0,
    explain: "RDS も同じファミリで 1 段階アップで vCPU / RAM / 価格が約 2 倍。大きすぎる場合は 1 サイズ落とすだけで月数万円規模の削減になり得る。"
  },

  // ===== エンジン / ライセンス =====
  { id: "rdsb-010", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS で「OSS で追加ライセンス料がかからない」エンジンの組み合わせは？",
    choices: [
      "MySQL / PostgreSQL / MariaDB",
      "Oracle / SQL Server",
      "MySQL / SQL Server",
      "DynamoDB / Redshift"
    ],
    a: 0,
    explain: "MySQL / PostgreSQL / MariaDB はオープンソースで追加料金なし。Oracle / SQL Server は License Included (LI) で料金に含めるか、BYOL (Oracle のみ可) で持ち込み。"
  },
  { id: "rdsb-011", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Oracle 利用での License Included と BYOL の違いは？",
    choices: [
      "LI は AWS が Oracle のライセンスを提供 (SE2 限定)。BYOL は自社契約のライセンスを持ち込む (SE2 / EE)",
      "LI と BYOL は同じ",
      "LI は EE のみ",
      "BYOL は MySQL 専用"
    ],
    a: 0,
    explain: "Oracle SE2 は LI と BYOL の両方が可能。EE は BYOL のみ。SQL Server は LI のみ (BYOL は License Mobility 経由で Dedicated Host が必要だが RDS では基本 LI)。"
  },
  { id: "rdsb-012", topic: "rds-basic", type: "single", difficulty: 2,
    q: "SQL Server の RDS で選べるエディションのうち、最も安いものは？",
    choices: [
      "Express (機能制限あり)",
      "Standard",
      "Web (Webサイト用途限定)",
      "Enterprise"
    ],
    a: 0,
    explain: "Express は無料エディションで容量/メモリ等に制限あり。Web は Web サイト・アプリ用途限定。Standard / Enterprise は機能・性能が上で料金も上がる。"
  },
  { id: "rdsb-013", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS for SQL Server Web エディションのライセンス的な制約は？",
    choices: [
      "Webサイト / Webアプリケーション目的に限定 (社内システムには使えない)",
      "全機能フリー",
      "Multi-AZ 不可",
      "リードレプリカ不可"
    ],
    a: 0,
    explain: "Web エディションはマイクロソフトのライセンスに準拠して『Web 向け』限定。内部業務システムは Standard / Enterprise が必要。"
  },

  // ===== Multi-AZ =====
  { id: "rdsb-020", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS の Single-AZ と Multi-AZ (従来の Standby 構成) の料金差は？",
    choices: [
      "Multi-AZ はスタンバイインスタンスがある分、インスタンス料金が概ね 2 倍",
      "Multi-AZ のほうが安い",
      "両者は同額",
      "Multi-AZ はストレージ料金が 1/2"
    ],
    a: 0,
    explain: "Single-AZ vs Multi-AZ (1 standby) は基本『インスタンス料金 ≒ 2 倍』。ストレージも 2 倍ぶん確保される。可用性 SLA を必要としない開発環境では Single-AZ で十分。"
  },
  { id: "rdsb-021", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Multi-AZ Cluster (PostgreSQL / MySQL 対応) の特徴は？",
    choices: [
      "2 つのリーダブルなスタンバイ (合計 3 ノード) を持ち、フェイルオーバが速い。料金はインスタンス料金が 3 倍規模",
      "Standby はリーダブル不可",
      "1 つの DB に統合される",
      "Multi-AZ Cluster は無料"
    ],
    a: 0,
    explain: "Multi-AZ Cluster (DB Cluster) は 3 ノード構成。RDS for MySQL / PostgreSQL の新方式。フェイルオーバ 1 分以内、Standby も Read 用に使える。料金はノード × 3 で従来 Multi-AZ より高い。"
  },
  { id: "rdsb-022", topic: "rds-basic", type: "multi", difficulty: 2,
    q: "Multi-AZ (従来) の特徴として正しいものを 2 つ以上選べ。",
    choices: [
      "同期レプリケーションで RPO ≒ 0",
      "Standby はリードに使えない",
      "Standby は別 AZ に配置される",
      "Standby は無料"
    ],
    a: [0, 1, 2],
    explain: "従来 Multi-AZ は同期レプリ、Standby は Read 不可。Standby も別 AZ で動いているのでインスタンス料金は 2 倍。Read 負荷を逃したいならリードレプリカが別途必要。"
  },
  { id: "rdsb-023", topic: "rds-basic", type: "single", difficulty: 2,
    q: "Multi-AZ にすると EBS 相当のストレージ料金は？",
    choices: [
      "Multi-AZ (従来) でもストレージ料金は別 AZ にレプリ用に確保されるため約 2 倍",
      "ストレージは Single-AZ と同じ",
      "ストレージは無料化",
      "Single-AZ より安くなる"
    ],
    a: 0,
    explain: "ストレージも別 AZ に同期されるため料金は 2 倍。Single-AZ → Multi-AZ で『おおむね 2 倍』とざっくり覚える。"
  },
  { id: "rdsb-024", topic: "rds-basic", type: "single", difficulty: 2,
    q: "本番 24h 稼働でビジネス要件として SLA 高めだが、コスト最適化したい。Multi-AZ の判断は？",
    choices: [
      "本番では Multi-AZ を維持し、削減はストレージ最適化 (gp3) や Reserved DB Instance で行う",
      "Multi-AZ を即無効化",
      "Multi-AZ Cluster に切替必須",
      "Aurora に強制移行"
    ],
    a: 0,
    explain: "Multi-AZ は本番の RPO/RTO 要件を満たすために残す。削減は他軸 (RI / SP / gp3 / リードレプリカ統廃合) でやる。"
  },

  // ===== 停止 / 起動 =====
  { id: "rdsb-030", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS インスタンスの停止 (Stop) について正しいものは？",
    choices: [
      "Stop しても最大 7 日後に AWS 側で自動起動する",
      "Stop は永久に維持される",
      "Stop すると Snapshot が削除される",
      "Stop でインスタンスは消える"
    ],
    a: 0,
    explain: "RDS の Stop は最大 7 日。再 Stop には CLI / Lambda / EventBridge で自動化が必要。"
  },
  { id: "rdsb-031", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS 停止中も発生し続けるコストは？",
    choices: [
      "ストレージ料金 + 自動バックアップ料金 + 手動 Snapshot 料金",
      "全て無料",
      "インスタンス時間料金のみ",
      "Snapshot 料金のみ"
    ],
    a: 0,
    explain: "Stop で止まるのはインスタンス時間料金。ストレージ・バックアップ・手動スナップショットは課金継続。長期停止なら Snapshot を取って Terminate のほうが安い。"
  },
  { id: "rdsb-032", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS Stop が許可されない構成は？",
    choices: [
      "リードレプリカを持っている RDS インスタンス",
      "Single-AZ の小規模 DB",
      "Multi-AZ の DB",
      "停止は常に可能"
    ],
    a: 0,
    explain: "リードレプリカを持つ RDS は Stop 不可。Multi-AZ は Stop 可能。Cluster (Multi-AZ Cluster) は別途の挙動。"
  },
  { id: "rdsb-033", topic: "rds-basic", type: "single", difficulty: 2,
    q: "開発環境の RDS を夜間停止したい。最も実務的な実装は？",
    choices: [
      "EventBridge Scheduler + Lambda (または Step Functions) で stop / start を自動化",
      "毎晩手動で停止する",
      "Spot RDS に切り替える",
      "AWS Support に依頼する"
    ],
    a: 0,
    explain: "EventBridge / Instance Scheduler / CDK で自動化が定番。7 日制約があるので Cron スケジュールで再停止が必要。"
  },

  // ===== 料金構造 =====
  { id: "rdsb-040", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS の課金要素として正しいのは？",
    choices: [
      "インスタンス時間 + ストレージ容量 + 追加 IOPS / Throughput + バックアップストレージ + データ転送 + (LI なら) ライセンス + オプション (PI など)",
      "インスタンス時間のみ",
      "ストレージ容量のみ",
      "リクエスト数のみ"
    ],
    a: 0,
    explain: "RDS は複数の課金要素を持つ。コスト最適化では分野別 (インスタンス / ストレージ / バックアップ / 転送) に分けて見るのが基本。"
  },
  { id: "rdsb-041", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS のインスタンス時間料金の課金単位は？",
    choices: [
      "1 秒単位 (最小 10 分)",
      "1 時間単位 (端数切り上げ)",
      "1 ヶ月単位",
      "起動回数単位"
    ],
    a: 0,
    explain: "RDS は秒単位課金 (最小 10 分)。起動・停止の頻度が高い開発環境で課金感覚を理解しておく。"
  },

  // ===== Reserved DB =====
  { id: "rdsb-050", topic: "rds-basic", type: "single", difficulty: 1,
    q: "Reserved DB Instance の契約期間は？",
    choices: ["1 年または 3 年", "1 年のみ", "3 年のみ", "6 ヶ月"],
    a: 0,
    explain: "RI と同じく 1 年 / 3 年。最大 69% 程度割引 (3 年 All Upfront)。RDS には EC2 のような Savings Plans はないので、コミット手段は基本 Reserved DB Instance。"
  },
  { id: "rdsb-051", topic: "rds-basic", type: "multi", difficulty: 2,
    q: "Reserved DB Instance の支払いオプションを 2 つ以上選べ。",
    choices: ["All Upfront", "Partial Upfront", "No Upfront", "Monthly Postpaid"],
    a: [0, 1, 2],
    explain: "Reserved DB Instance も全額前払い / 一部前払い / 前払いなしの 3 種類。All Upfront が最大割引。"
  },
  { id: "rdsb-052", topic: "rds-basic", type: "single", difficulty: 2,
    q: "Reserved DB Instance のサイズ柔軟性 (Size Flexibility) は？",
    choices: [
      "同じファミリ内であればサイズ違いに按分適用される (Aurora / MySQL / PostgreSQL / MariaDB / Oracle / SQL Server BYOL)。SQL Server LI は対象外",
      "全てのエンジンで対象外",
      "全てのエンジンで完全自由",
      "サイズ柔軟性は Convertible RI 限定"
    ],
    a: 0,
    explain: "RDS Reserved DB Instance は同一エンジン+同一ファミリ内でサイズ柔軟性あり。SQL Server LI / Oracle LI は対象外で完全一致が必要。"
  },
  { id: "rdsb-053", topic: "rds-basic", type: "single", difficulty: 2,
    q: "Reserved DB Instance は Single-AZ と Multi-AZ で別商品か。",
    choices: [
      "別商品。Multi-AZ 用 RI は Single-AZ よりも高いが Single-AZ にも適用 (按分) 可能、Single-AZ 用 RI は Multi-AZ には不足",
      "完全に同一",
      "Multi-AZ には RI を購入不可",
      "Single-AZ には RI を購入不可"
    ],
    a: 0,
    explain: "Single-AZ / Multi-AZ ごとに別 SKU。Multi-AZ 用 RI を購入すると Multi-AZ + Single-AZ 両対応 (按分) になる。逆は不可。"
  },
  { id: "rdsb-054", topic: "rds-basic", type: "single", difficulty: 3,
    q: "Reserved DB Instance を購入したあとに Convertible のように変更したい。可能か。",
    choices: [
      "RDS の RI には Convertible 概念はない。変更不可。需要が変わるならコミット量を控えめに",
      "Convertible にいつでも変更可能",
      "AWS Support に依頼すれば交換可能",
      "Marketplace で売却可能"
    ],
    a: 0,
    explain: "RDS RI は EC2 の Convertible のような交換機能なし。Marketplace 売却もない。柔軟性を持つには Compute SP ではカバーできないので、コミット量を最小限に絞る運用が無難。"
  },

  // ===== ライセンス / 細部 =====
  { id: "rdsb-060", topic: "rds-basic", type: "single", difficulty: 2,
    q: "Oracle Database Enterprise Edition (EE) を RDS で使う方法は？",
    choices: [
      "BYOL のみ (License Included では SE2 のみ提供)",
      "License Included でも EE が選べる",
      "Aurora と同じ料金体系",
      "RDS for Oracle は廃止された"
    ],
    a: 0,
    explain: "RDS for Oracle EE は BYOL のみ。SE2 は LI / BYOL 両対応。SE1 / SE は新規不可。"
  },
  { id: "rdsb-061", topic: "rds-basic", type: "single", difficulty: 3,
    q: "RDS for SQL Server で『SQL Server Enterprise Edition』を選べる方法は？",
    choices: [
      "License Included として AWS から提供 (高価)、または直接 EC2 上に SQL Server EE BYOL 構築",
      "Marketplace 経由でのみ可能",
      "Aurora の Enterprise として提供",
      "EE は使えない"
    ],
    a: 0,
    explain: "RDS for SQL Server は基本 LI。EE は時間料金が高い。BYOL は License Mobility を使い EC2 + Dedicated Host で構築するが RDS マネージドの範囲外。"
  },

  // ===== モニタリング =====
  { id: "rdsb-070", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS Performance Insights の料金について正しいものは？",
    choices: [
      "7 日間のリテンション + 標準項目は無料。長期保持 (24 ヶ月) や Long-Term Retention は別途課金",
      "全て無料",
      "全て有料",
      "1 ヶ月 $100 固定"
    ],
    a: 0,
    explain: "Performance Insights は 7 日間ベーシック無料。長期保持で課金が始まる。標準パッケージ + ロングタームでコスト判断。"
  },
  { id: "rdsb-071", topic: "rds-basic", type: "single", difficulty: 2,
    q: "Enhanced Monitoring の料金構造は？",
    choices: [
      "メトリクスの収集はインスタンス OS 上のエージェントで行い、CloudWatch Logs にメトリクスを送るためその容量で課金",
      "完全無料",
      "1 分あたり $0.10",
      "Multi-AZ では無料"
    ],
    a: 0,
    explain: "Enhanced Monitoring (1〜60 秒粒度) は CloudWatch Logs の保管料金として課金される。長期保持は容量に注意。"
  },
  { id: "rdsb-072", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の CloudWatch 標準メトリクスは何分粒度で無料か。",
    choices: [
      "60 秒粒度のメトリクスが基本料金に含まれる",
      "1 秒粒度",
      "5 分粒度のみ",
      "標準メトリクスはない"
    ],
    a: 0,
    explain: "RDS の標準 CloudWatch メトリクスは 60 秒粒度 (1 分) で無料。Enhanced は更に細かく取れるが Logs 課金。"
  },

  // ===== その他 =====
  { id: "rdsb-080", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS のインスタンスタイプを変更 (スケールアップ/ダウン) するときの典型的なダウンタイムは？",
    choices: [
      "Single-AZ は数分のダウンタイム。Multi-AZ ならフェイルオーバ経由でほぼ無停止 (秒〜分)",
      "完全無停止",
      "数時間必要",
      "再構築が必要"
    ],
    a: 0,
    explain: "Multi-AZ は Standby に変更を適用してフェイルオーバする方式で短停止。Single-AZ は変更中ダウンする。ダウンタイム要件と料金影響をセットで考える。"
  },
  { id: "rdsb-081", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Storage Autoscaling を有効にしたとき、コスト面で起こりうることは？",
    choices: [
      "ストレージが自動拡張されて使用済み GB が増え、月額が想定より上がる可能性。最大値 (Maximum allocated storage) を設定して上限を抑える",
      "勝手に無料化される",
      "拡張時に AWS が割引",
      "自動縮小もしてくれる"
    ],
    a: 0,
    explain: "Storage Autoscaling は拡張のみ (縮小しない)。上限を設定しないと際限なく増える。期間内で要らない領域は手動で別 DB に移すか、Right-Sizing を行う。"
  },
  { id: "rdsb-082", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の自動拡張は『縮小もしてくれる』か。",
    choices: [
      "縮小はしない (拡張のみ)。縮小は基本不可で、再作成 (Dump → Restore) が必要",
      "縮小も自動",
      "Multi-AZ なら自動縮小",
      "AWS Support に依頼すれば縮小可能"
    ],
    a: 0,
    explain: "RDS のストレージは縮小操作が公式に提供されない。最初から過剰に確保しないこと。"
  },
  { id: "rdsb-083", topic: "rds-basic", type: "single", difficulty: 3,
    q: "RDS ストレージを大幅に縮小したい場合の現実的な手順は？",
    choices: [
      "新インスタンス (小さいストレージ) を作り、Dump / Restore またはレプリ → スイッチオーバ",
      "Storage Autoscaling を OFF にする",
      "Multi-AZ を OFF にする",
      "縮小は AWS Console から 1 クリック"
    ],
    a: 0,
    explain: "RDS のストレージ縮小は再構築が必要。Blue/Green Deployments (RDS for MySQL/PostgreSQL) を使えば切替を安全に。"
  },
  { id: "rdsb-084", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS Blue/Green Deployments のコスト面の特徴は？",
    choices: [
      "切替期間中、Blue と Green の 2 系統が動くため一時的にコストが倍近くになる",
      "切替で料金が無料化",
      "切替で料金が半額",
      "切替は AWS Support にしか依頼できない"
    ],
    a: 0,
    explain: "Blue/Green は新環境を作ってからカットオーバするため一時的に 2 系統並走でコスト増。長期に Blue を残さないこと。"
  },

  // ===== コスト最適化アクション =====
  { id: "rdsb-090", topic: "rds-basic", type: "multi", difficulty: 2,
    q: "RDS の代表的なコスト最適化アクションを 2 つ以上選べ。",
    choices: [
      "Right-Sizing (CPU/メモリ未使用ぶんを下げる)",
      "Reserved DB Instance の購入",
      "ストレージを gp3 化",
      "Multi-AZ を直ちに無効化"
    ],
    a: [0, 1, 2],
    explain: "本番では Multi-AZ を維持するのが基本 (可用性要件)。Right-Sizing / RI / gp3 / バックアップ整理 / 不要レプリカ削減 が典型施策。"
  },
  { id: "rdsb-091", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS インスタンスのスペックは過剰だが Multi-AZ は維持したい。最初の手は？",
    choices: [
      "サイズダウン → 安定確認 → Reserved DB Instance を購入 (Multi-AZ 用)",
      "Multi-AZ を即解除",
      "ストレージを sc1 にする",
      "リードレプリカを Spot 化"
    ],
    a: 0,
    explain: "Right-Sizing → 安定確認 → RI の流れが定石。Multi-AZ のままサイズダウンも可能。"
  },
  { id: "rdsb-092", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の課金とリージョン差として正しいものは？",
    choices: [
      "リージョンごとに単価が異なる。日本 (ap-northeast-1) は米国東 (us-east-1) より高い傾向",
      "全リージョン同額",
      "ap-northeast-1 が最安",
      "リージョン差は無関係"
    ],
    a: 0,
    explain: "EC2 同様 RDS のインスタンス単価もリージョン差あり。災害復旧サイトは安価リージョンに置くと節約できる場合がある。"
  },
  { id: "rdsb-093", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS にデフォルトで含まれる無料機能は？",
    choices: [
      "自動バックアップ (DB ストレージサイズの 100% 以内は無料) / 自動マイナーバージョンアップ / CloudWatch 60s メトリクス",
      "Performance Insights 全機能",
      "Enhanced Monitoring 全機能",
      "クロスリージョン Snapshot コピー"
    ],
    a: 0,
    explain: "基本機能は無料 / 標準。PI 長期保持や Enhanced Monitoring / クロスリージョンコピーは別課金。"
  },

  // ===== 細部 =====
  { id: "rdsb-100", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の AZ 配置として『シングル AZ + クロス AZ アプリ』の場合のコスト課題は？",
    choices: [
      "アプリ側 EC2 と RDS が AZ をまたぐと、毎クエリで AZ 間転送料が発生し続ける",
      "コスト課題はない",
      "RDS が Multi-AZ になる",
      "ストレージが半額になる"
    ],
    a: 0,
    explain: "クライアントの EC2 と RDS が別 AZ にあるとクエリのたびに AZ 間データ転送料が発生。アプリと RDS プライマリを同 AZ に揃える設計が重要。"
  },
  { id: "rdsb-101", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS Snapshot をクロスアカウントで共有する場合の課金は？",
    choices: [
      "共有自体は無料、参照する側がコピーすれば自アカウントにストレージ課金が発生",
      "共有時に $0.10/GB",
      "両アカウントで二重に課金",
      "共有不可"
    ],
    a: 0,
    explain: "Snapshot のアカウント間シェアは参照だけなら無料。コピーすれば宛先アカウントで通常のストレージ課金。"
  },
  { id: "rdsb-102", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の終了時に自動取得される最終 Snapshot を残し続けると料金は？",
    choices: [
      "Snapshot のストレージ料金として保管され続ける。不要なら削除",
      "終了時の最終 Snapshot は永久無料",
      "最終 Snapshot は自動で 30 日後に消える",
      "最終 Snapshot はリージョン外保存のみ"
    ],
    a: 0,
    explain: "終了時に Final Snapshot を取った場合、ストレージとして残り続ける。コンプラ要件で残すなら別途規定、不要なら削除。"
  },
  { id: "rdsb-103", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Public Accessible 設定を有効にした場合の料金面の影響は？",
    choices: [
      "RDS のエンドポイントに Public IPv4 が必要となり、2024-02 以降は時間料金で課金される",
      "全て無料",
      "Multi-AZ が無料化",
      "リージョン外転送が無料化"
    ],
    a: 0,
    explain: "Public Accessible にすると Public IPv4 が割り当てられ、$0.005/h ベースで課金。必要ない場合は Private Subnet 配置で SSM / Bastion 経由がコスト効率良い。"
  },
  { id: "rdsb-104", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の IAM 認証は追加料金が発生するか。",
    choices: [
      "IAM 認証そのものに直接の料金はないが、API リクエスト数や接続数に応じてアプリ側で考慮",
      "1 回 $0.01",
      "Multi-AZ 限定で無料",
      "IAM 認証は廃止された"
    ],
    a: 0,
    explain: "IAM database authentication 自体は無料。STS の API コール頻度の関係でアプリ実装に注意する必要がある (DB 接続プーリングなど)。"
  },
  { id: "rdsb-105", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Multi-AZ をやめて Single-AZ にした時の典型的なコスト変動は？",
    choices: [
      "インスタンス料金 + ストレージ料金が概ね半額になる代わりに、AZ 障害時にダウンタイムが発生",
      "全て無料化",
      "Multi-AZ より高くなる",
      "リージョン間で課金される"
    ],
    a: 0,
    explain: "Single-AZ 化は半額削減のチャンスだが本番 SLA への影響大。開発・検証では Single-AZ で十分。"
  },
  { id: "rdsb-106", topic: "rds-basic", type: "single", difficulty: 3,
    q: "MySQL / PostgreSQL の Multi-AZ Cluster (DB Cluster) は従来の Multi-AZ と比べてコスト面で？",
    choices: [
      "ノードが 3 つになる分、インスタンス料金は約 1.5 倍 (従来 2 倍 → 3 倍だが Reader が活用可能で実コスパは改善)",
      "従来より安い",
      "従来と全く同額",
      "Cluster は無料"
    ],
    a: 0,
    explain: "従来 Multi-AZ: 2 ノード (Standby Read 不可)。Multi-AZ Cluster: 3 ノード (Standby Read 可能)。価格はノード数増えるが Read 用途で価値を出せる。"
  },
  { id: "rdsb-107", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS for MySQL の Aurora 移行を検討するときのコスト面の比較ポイントは？",
    choices: [
      "Aurora は I/O 課金 (リクエスト数 × 単価) があり、書き込みが多いとコスト増。逆にストレージは課金は容量だけで自動拡張、Multi-AZ も簡単",
      "Aurora は完全無料",
      "Aurora は Multi-AZ できない",
      "Aurora は RDS と全く同じ料金"
    ],
    a: 0,
    explain: "Aurora は I/O リクエスト課金が乗る点に注意 (旧 Aurora の話)。Aurora I/O-Optimized なら I/O 課金なしでインスタンス料金が高めの体系。本問のスコープは『そのまま RDS で運用』なので参考までに。"
  },
  { id: "rdsb-108", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の AWS Backup 統合料金は？",
    choices: [
      "AWS Backup から取得する Snapshot は RDS 標準の Snapshot 料金と同等。Vault / 監査機能などのオーバーヘッドあり",
      "AWS Backup 経由は無料",
      "AWS Backup 経由は別建ての固定費",
      "AWS Backup は使えない"
    ],
    a: 0,
    explain: "AWS Backup は RDS / EBS / DynamoDB / EFS / FSx などを統一管理。料金は基本『取った Snapshot の保管料』。複雑な構成でも一箇所で管理できる利点が大きい。"
  },
  { id: "rdsb-109", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS で『不要だが削除権限がない』DB が残っていることに気づいた。最も妥当なアクションは？",
    choices: [
      "棚卸し → 関係者承認 → 最終 Snapshot を取得 → 削除",
      "黙って削除",
      "停止して放置 (7 日で勝手に起動して料金発生し続ける)",
      "リージョン外に移す"
    ],
    a: 0,
    explain: "停止しても 7 日後に勝手に起動 + ストレージ・バックアップは課金継続。本当に不要なら最終 Snapshot を取って Terminate。"
  },
  { id: "rdsb-110", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS Performance Insights を 24 ヶ月リテンションにした場合の課金単位は？",
    choices: [
      "vCPU あたりの月額料金 (例: $7/vCPU-月) で課金される",
      "GB あたりの月額",
      "リクエスト数あたり",
      "完全無料"
    ],
    a: 0,
    explain: "Performance Insights 長期保持は vCPU 単位で月額。大きい RDS で全期間有効にすると意外と高い。要らないなら 7 日ベーシックで止める。"
  },
  { id: "rdsb-111", topic: "rds-basic", type: "single", difficulty: 2,
    q: "オンプレ → RDS への移行で大量の初期データを送るとき、データ転送費の最適解は？",
    choices: [
      "AWS Direct Connect 経由、または AWS Snowball (物理デバイス) の利用検討",
      "Internet 経由で一度に送る",
      "NAT Gateway 経由で送る",
      "EBS スナップショットとして送る"
    ],
    a: 0,
    explain: "数 TB 以上ならネット転送料 (および時間) より Snowball / DX の経済性が勝つ場合がある。DMS でも初期スナップ + CDC で安全に移送。"
  },
  { id: "rdsb-112", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の自動マイナーバージョンアップグレード (Auto Minor Version Upgrade) の料金は？",
    choices: [
      "オプション自体は無料。アップグレード中は通常のインスタンス料金が発生",
      "オプションを有効化すると追加課金",
      "アップグレード中は無料",
      "AWS Support に課金される"
    ],
    a: 0,
    explain: "オプションは無料。マイナーバージョンに自動追随することで脆弱性対応工数が下がるためむしろ TCO が下がる。"
  },
  { id: "rdsb-113", topic: "rds-basic", type: "single", difficulty: 2,
    q: "古いエンジンバージョン (例: MySQL 5.7) を使い続けると料金面で起きうることは？",
    choices: [
      "Extended Support (拡張サポート) が始まると追加料金が請求される",
      "古いエンジンほど安くなる",
      "AWS が無料でサポートし続ける",
      "Multi-AZ が解除される"
    ],
    a: 0,
    explain: "AWS は EOL になったメジャーバージョンに対し Extended Support を提供 (有料)。料金は vCPU 単位で上乗せされ、長期化するとかなりのコスト増。バージョンアップが結果的に最大のコスト最適化。"
  },
  { id: "rdsb-114", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Maintenance Window 内に変更が走った場合の課金は？",
    choices: [
      "通常の RDS インスタンス料金が継続。短時間のフェイルオーバ等で料金構造は変わらない",
      "ウィンドウ中は無料",
      "ウィンドウ外は無料",
      "ウィンドウ中は倍額"
    ],
    a: 0,
    explain: "Maintenance Window は変更のタイミング指定。課金構造には影響しない。"
  },
  { id: "rdsb-115", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS の Single-AZ → Multi-AZ への切替時のコスト挙動は？",
    choices: [
      "切替後はインスタンス料金 + ストレージ料金が概ね 2 倍に。バックアップに変化はない",
      "切替後は無料化",
      "Single-AZ より安くなる",
      "切替できない"
    ],
    a: 0,
    explain: "Multi-AZ 化 = ノード追加で約 2 倍。スタンバイ用ストレージも同期される。"
  },
  { id: "rdsb-116", topic: "rds-basic", type: "single", difficulty: 1,
    q: "RDS の最小インスタンスサイズは現実的にどれか (2025 年現在の代表)。",
    choices: [
      "db.t3.micro / db.t4g.micro (フリーティア対象)",
      "db.m5.large が最小",
      "db.r5.xlarge が最小",
      "db.x1e.32xlarge が最小"
    ],
    a: 0,
    explain: "db.t3.micro / db.t4g.micro はフリーティア対象 (12 ヶ月 × 750h / 月)。テスト用途には十分。"
  },
  { id: "rdsb-117", topic: "rds-basic", type: "single", difficulty: 2,
    q: "RDS のタグはコスト面でどう活用するのが良いか。",
    choices: [
      "Cost Allocation Tag として有効化し、Cost Explorer / Budgets でフィルタ・分析する",
      "タグは無料化のためのキー",
      "タグを付けると割引",
      "タグは廃止された"
    ],
    a: 0,
    explain: "コスト配賦タグを有効化 → 翌月以降の請求でフィルタ可。プロジェクト・環境・所有者などで標準化すると追跡が容易。"
  },
  { id: "rdsb-118", topic: "rds-basic", type: "single", difficulty: 3,
    q: "RDS のセキュリティパッチや CVE 対応に伴うアップグレードを継続することはコスト最適化と矛盾するか。",
    choices: [
      "矛盾しない。Extended Support 料金や事故対応コストを避ける意味でアップグレードは長期的に最大の節約",
      "アップグレードは常にコスト増",
      "脆弱性が出てから対応する方が安い",
      "RDS は脆弱性が出ない"
    ],
    a: 0,
    explain: "セキュリティアップグレードを放置すると Extended Support 課金やインシデント対応で結局高くつく。長期 TCO で見るのが原則。"
  }
);
