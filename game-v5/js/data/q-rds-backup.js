/* RDS バックアップ / リードレプリカ — 50+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== 自動バックアップ =====
  { id: "rdsbk-001", topic: "rds-backup", type: "single", difficulty: 1,
    q: "RDS の自動バックアップが「無料」で保管できる範囲は？",
    choices: [
      "DB の現在のアロケート済みストレージサイズと同じ容量まで",
      "100 GB まで一律無料",
      "全リージョン無料",
      "1 ヶ月分のみ無料"
    ],
    a: 0,
    explain: "自動バックアップは『DB ストレージサイズの 100% 以内』が無料。例えば 200 GB DB なら 200 GB ぶんのバックアップが無料、それを超えた分が GB-month で課金。"
  },
  { id: "rdsbk-002", topic: "rds-backup", type: "single", difficulty: 1,
    q: "自動バックアップを取らない設定 (Backup Retention = 0 日) にすると、料金面でどうなるか。",
    choices: [
      "バックアップストレージ課金がゼロになる代わりに PITR ができなくなる",
      "バックアップ料金は同じ",
      "Multi-AZ が無効化される",
      "Snapshot も自動削除"
    ],
    a: 0,
    explain: "Backup Retention = 0 で自動バックアップ無効。Point-in-Time Recovery 不可。本番では基本 7〜35 日に。"
  },
  { id: "rdsbk-003", topic: "rds-backup", type: "single", difficulty: 1,
    q: "RDS 自動バックアップの最大保持期間は？",
    choices: ["35 日", "7 日", "90 日", "365 日"],
    a: 0,
    explain: "自動バックアップは最大 35 日。長期保持はクロスリージョン Backup / 手動 Snapshot に切り出す。"
  },
  { id: "rdsbk-004", topic: "rds-backup", type: "single", difficulty: 2,
    q: "自動バックアップ保持期間を延ばすとバックアップストレージ料金はどう変わるか。",
    choices: [
      "保持期間 × 変更ブロック量に比例して増える (世代が多いほど多く保管)",
      "保持期間に関係なく一定",
      "延ばすほど割引",
      "保持期間が長くなると Snapshot が無料化"
    ],
    a: 0,
    explain: "保持日数を増やすほど世代が増え保管量も増える。書込みが多い DB は保持を伸ばすと急増する。"
  },
  { id: "rdsbk-005", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS の自動バックアップは『手動 Snapshot』と何が異なるか。",
    choices: [
      "自動バックアップは DB と運命を共にし、DB を削除すると保持期間内に消える (Final Snapshot を除く)。手動 Snapshot は明示削除しない限り残る",
      "自動バックアップは無期限保存",
      "手動 Snapshot は無料",
      "両者は完全に同じ"
    ],
    a: 0,
    explain: "自動バックアップ: DB の寿命と紐づく。手動 Snapshot: 別ライフサイクル、明示削除まで残る。長期保管は手動 Snapshot or Backup 機能を使う。"
  },
  { id: "rdsbk-006", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS の DB を削除する時に Final Snapshot を取った場合の料金は？",
    choices: [
      "通常の手動 Snapshot として保管料が発生し続ける",
      "Final Snapshot は完全無料",
      "30 日後に自動削除",
      "Final Snapshot は AWS が無料で保管"
    ],
    a: 0,
    explain: "Final Snapshot も手動 Snapshot 扱い。明示削除しない限り課金。誤って数百 GB の Snapshot を残し続けると無視できない料金になる。"
  },
  { id: "rdsbk-007", topic: "rds-backup", type: "multi", difficulty: 2,
    q: "RDS バックアップストレージ料金として課金されないものを 2 つ以上選べ。",
    choices: [
      "DB と同じリージョンの自動バックアップで、DB ストレージサイズと同等以下の容量分",
      "新規 RDS の起動直後 (バックアップ未取得)",
      "DB ストレージサイズを超えた自動バックアップ部分",
      "クロスリージョンにコピーした Snapshot"
    ],
    a: [0, 1],
    explain: "DB サイズ以下の自動バックアップは無料。新規 RDS のバックアップ未取得時点は当然無料。超過分やクロスリージョンは課金。"
  },

  // ===== PITR =====
  { id: "rdsbk-010", topic: "rds-backup", type: "single", difficulty: 1,
    q: "RDS の Point-in-Time Recovery (PITR) は何に依存するか。",
    choices: [
      "自動バックアップ + 取り込み中のトランザクションログ",
      "手動 Snapshot のみ",
      "Multi-AZ のスタンバイ",
      "リードレプリカ"
    ],
    a: 0,
    explain: "PITR は『最後の自動バックアップ』+『トランザクションログ』で構成。Backup Retention > 0 が必要。"
  },
  { id: "rdsbk-011", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS PITR の復元先は元の DB か。",
    choices: [
      "新しい DB インスタンスとして復元される (元の DB は触らない)",
      "元の DB を上書き",
      "別リージョンに自動復元",
      "Multi-AZ にしか復元できない"
    ],
    a: 0,
    explain: "PITR は新しい DB を作成。料金面では復元先 DB のインスタンス・ストレージが新規発生。動作確認後に旧 DB を廃止する流れ。"
  },
  { id: "rdsbk-012", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS のトランザクションログ保管料は？",
    choices: [
      "バックアップ保持期間中のトランザクションログ容量に応じて、超過分が課金対象",
      "完全無料",
      "Multi-AZ では無料",
      "リージョン外でしか保管されない"
    ],
    a: 0,
    explain: "トランザクションログは自動バックアップの構成要素として保管される。書き込み量が多いと自動バックアップ無料枠を圧迫しやすい。"
  },
  { id: "rdsbk-013", topic: "rds-backup", type: "single", difficulty: 3,
    q: "高頻度書き込みの RDS で保持 35 日にした場合のバックアップ料金が膨らんだ。最初の対策は？",
    choices: [
      "保持期間を必要要件に応じて短縮 (例: 14 日)、または高頻度更新テーブルを別 DB に分離",
      "保持を 35 日のまま放置",
      "Multi-AZ をやめる",
      "RDS を Spot 化"
    ],
    a: 0,
    explain: "Retention が長いほどログが積み上がる。要件に合わせた短縮 / 高更新テーブル分離 / アーカイブ別経路化を検討。"
  },

  // ===== 手動 Snapshot =====
  { id: "rdsbk-020", topic: "rds-backup", type: "single", difficulty: 1,
    q: "手動 RDS Snapshot を取った場合の料金は？",
    choices: [
      "リージョン × 容量 GB × 月の保管料",
      "1 Snapshot 固定 $0.10",
      "完全無料",
      "Multi-AZ なら無料"
    ],
    a: 0,
    explain: "手動 Snapshot は GB-month で課金。S3 上の AWS 管理ストレージで保管。"
  },
  { id: "rdsbk-021", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS 手動 Snapshot を別リージョンにコピーした場合の料金は？",
    choices: [
      "リージョン間データ転送料 + コピー先リージョンでの保管料",
      "コピー元リージョンの料金のみ",
      "完全無料",
      "コピー先のみ無料"
    ],
    a: 0,
    explain: "クロスリージョンコピーはデータ転送費 + 保管料の二重発生。DR 用途では必要だが、不要なものは削除を。"
  },
  { id: "rdsbk-022", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot を S3 にエクスポート (Parquet 形式) する機能のコストは？",
    choices: [
      "エクスポート時のリクエスト課金 + S3 保管料",
      "完全無料",
      "Snapshot 自体が無料化",
      "Multi-AZ なら無料"
    ],
    a: 0,
    explain: "RDS Snapshot Export to S3 はエクスポート操作 (GB あたり) + S3 保管料。エクスポートすると Athena / Glue で分析できる。長期保管しつつ分析する用途で便利。"
  },
  { id: "rdsbk-023", topic: "rds-backup", type: "single", difficulty: 2,
    q: "手動 Snapshot を 1000 個放置している。コスト最適化の典型アクションは？",
    choices: [
      "DLM / AWS Backup などで世代管理し、不要 Snapshot を削除",
      "Multi-AZ にする",
      "Snapshot を Spot 化",
      "リージョン外に移す"
    ],
    a: 0,
    explain: "Snapshot 大量放置はバックアップストレージ料金の最大の原因。世代管理ポリシーとライフサイクルで自動削除する仕組みを整える。"
  },
  { id: "rdsbk-024", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS 自動バックアップは、DB を削除した後どうなるか。",
    choices: [
      "保持された自動バックアップは Retention 期間が過ぎたら自動削除 (オプションで保持を維持することも可能)",
      "永久に残る",
      "即削除",
      "別リージョンに自動移動"
    ],
    a: 0,
    explain: "DB を削除すると、自動バックアップは保持期間に従って整理される。『Retain automated backups』を有効にすると自動バックアップを別レコードとして保持できる (有料)。"
  },
  { id: "rdsbk-025", topic: "rds-backup", type: "single", difficulty: 2,
    q: "AWS Backup の RDS 統合の料金は？",
    choices: [
      "Backup Vault に保管された Snapshot のストレージ料金 (RDS 標準 Snapshot 単価ベース) + クロスリージョン / クロスアカウントコピー料金",
      "AWS Backup は完全無料",
      "RDS 内蔵バックアップより高い固定費",
      "RDS のバックアップは AWS Backup から外せる"
    ],
    a: 0,
    explain: "AWS Backup は Snapshot として裏で持つ。料金は通常の Snapshot 単価 + Vault の管理ストレージ。横断管理メリットで採用する企業が多い。"
  },

  // ===== Read Replica =====
  { id: "rdsbk-030", topic: "rds-backup", type: "single", difficulty: 1,
    q: "RDS のリードレプリカの料金は？",
    choices: [
      "通常の RDS インスタンス 1 台分の料金 (ストレージ含む) が別途発生する",
      "完全無料",
      "プライマリの 10% の料金",
      "Multi-AZ なら無料"
    ],
    a: 0,
    explain: "Read Replica は新しい RDS インスタンスとして起動・課金。プライマリと同等の料金体系。"
  },
  { id: "rdsbk-031", topic: "rds-backup", type: "single", difficulty: 2,
    q: "リードレプリカは Reserved DB Instance の割引対象になるか。",
    choices: [
      "なる (RI を購入していてサイズ・リージョン等が一致すれば適用)",
      "ならない",
      "Multi-AZ レプリカのみ対象",
      "リードレプリカは Spot 専用"
    ],
    a: 0,
    explain: "RI は RDS インスタンスに対する割引なので、プライマリ / レプリカ / Multi-AZ ノード問わず適用される (サイズ柔軟性のルールに従う)。"
  },
  { id: "rdsbk-032", topic: "rds-backup", type: "single", difficulty: 2,
    q: "クロスリージョンのリードレプリカで発生するコストは？",
    choices: [
      "リードレプリカのインスタンス料金 + ストレージ料金 + クロスリージョン転送料 (Source → Replica のレプリ転送)",
      "リードレプリカ料金のみ",
      "完全無料",
      "リージョン外の Snapshot 料金のみ"
    ],
    a: 0,
    explain: "クロスリージョン Read Replica は転送料が継続的に発生する点に注意。DR 兼用なら検討に値するが、転送量の試算は必須。"
  },
  { id: "rdsbk-033", topic: "rds-backup", type: "single", difficulty: 2,
    q: "MySQL / MariaDB の RDS で持てるリードレプリカは最大いくつか。",
    choices: [
      "5 つ (RDS for MySQL / MariaDB / PostgreSQL)",
      "1 つ",
      "15 つ",
      "100 つ"
    ],
    a: 0,
    explain: "RDS for MySQL / MariaDB / PostgreSQL のリードレプリカは最大 5。Aurora は最大 15 だが本問のスコープ外。"
  },
  { id: "rdsbk-034", topic: "rds-backup", type: "multi", difficulty: 2,
    q: "リードレプリカでコスト最適化に有効な使い方を 2 つ以上選べ。",
    choices: [
      "重い分析クエリをプライマリから逃がす",
      "Read 専用 API のスケールアウトを Replica に分散",
      "プライマリの Stop でレプリカも 0 円にする",
      "クロスリージョン DR の足がかりに使う"
    ],
    a: [0, 1, 3],
    explain: "プライマリ Stop でも Replica は動き続ける (= 課金継続)。Stop が前提なら Replica を先に削除すべき。"
  },
  { id: "rdsbk-035", topic: "rds-backup", type: "single", difficulty: 2,
    q: "Read Replica を 1 つ削除した時、コスト面の影響は？",
    choices: [
      "Replica の月額分が削減される。プライマリのレプリケーション負荷も若干軽くなる",
      "Replica は無料なので影響なし",
      "プライマリも停止する",
      "Snapshot が削除される"
    ],
    a: 0,
    explain: "Replica は 1 台ぶんの RDS。不要なら削除で月数万円規模の削減になり得る。プライマリには影響しない。"
  },
  { id: "rdsbk-036", topic: "rds-backup", type: "single", difficulty: 3,
    q: "古い Replica を放置していると気付きにくいコストは？",
    choices: [
      "Replica 用のストレージ料金 (プライマリと同等の容量) と Multi-AZ 化されている場合の二重課金",
      "Replica は EBS を持たない",
      "Replica は OS ライセンスが無料",
      "Replica は時間料金がかからない"
    ],
    a: 0,
    explain: "Replica は別 RDS インスタンスでストレージも別に持つ。Multi-AZ Replica にしていればさらに 2 倍。不要 Replica は即削除。"
  },
  { id: "rdsbk-037", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Read Replica を Multi-AZ にすると料金は？",
    choices: [
      "Replica の Multi-AZ 化でレプリカ料金も Multi-AZ 価格 (約 2 倍) に",
      "Multi-AZ 化で半額",
      "プライマリと共有",
      "Multi-AZ Replica は無料"
    ],
    a: 0,
    explain: "Replica を Multi-AZ にすれば Replica 自身もスタンバイを持つ。SLA 要件と費用を見て判断。"
  },

  // ===== 削減アクション =====
  { id: "rdsbk-040", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS のバックアップ料金が突然増えた時の調査ステップとして妥当な順序は？",
    choices: [
      "Cost Explorer で『Backup Storage』使用量を確認 → 該当 DB の Retention / 手動 Snapshot 数 / クロスリージョンコピーをチェック",
      "とりあえず Multi-AZ をやめる",
      "RDS を全削除",
      "AWS Support に丸投げ"
    ],
    a: 0,
    explain: "Backup Storage の請求項目を見て、どの DB / Snapshot が原因かを特定するのが先。やみくもに削減しない。"
  },
  { id: "rdsbk-041", topic: "rds-backup", type: "multi", difficulty: 2,
    q: "RDS バックアップ系コスト最適化として有効な手段を 2 つ以上選べ。",
    choices: [
      "保持期間を要件に合わせて短縮",
      "古い手動 Snapshot を削除",
      "クロスリージョン Snapshot コピーを必要最小限に",
      "RDS バックアップを完全停止"
    ],
    a: [0, 1, 2],
    explain: "保持期間 / Snapshot 数 / クロスリージョンコピーの最適化は王道。バックアップ完全停止は事業継続的に NG。"
  },
  { id: "rdsbk-042", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS のバックアップウィンドウ (1 日数十分間) でパフォーマンスが落ちる時の料金面の対策は？",
    choices: [
      "料金は変わらない。マルチ AZ にすればパフォーマンス影響は軽減 (代わりにインスタンス料金が 2 倍)",
      "バックアップウィンドウを止めれば無料",
      "ウィンドウ中だけ Spot に切替",
      "RDS の時間料金が上がる"
    ],
    a: 0,
    explain: "バックアップウィンドウのパフォーマンス影響は Single-AZ で出やすい。Multi-AZ はスタンバイ側でバックアップを取るのでプライマリへの影響が少ない。コスト増との比較で判断。"
  },

  // ===== 詳細 =====
  { id: "rdsbk-050", topic: "rds-backup", type: "single", difficulty: 3,
    q: "RDS の『Retain automated backups』オプションを有効化した場合の料金影響は？",
    choices: [
      "DB を削除しても自動バックアップを別レコードとして保持し、保管料が引き続き発生",
      "完全無料",
      "AWS が無料で永久保管",
      "Snapshot に変換される"
    ],
    a: 0,
    explain: "DB 削除後に自動バックアップを保持する設定。コンプライアンスや誤削除リカバリ用。期間中は通常の Backup Storage 料金が発生。"
  },
  { id: "rdsbk-051", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot の暗号化を有効にしたとき、料金変化は？",
    choices: [
      "Snapshot のストレージ料金は同じ。KMS の API 課金は別途",
      "暗号化 Snapshot は 50% 安い",
      "暗号化 Snapshot は無料",
      "暗号化すると保管できない"
    ],
    a: 0,
    explain: "Snapshot 暗号化はストレージ単価には影響しない。KMS Customer Managed Key を使うとキー月額 + API リクエスト料金が発生する。"
  },
  { id: "rdsbk-052", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot を別アカウントに共有した時の料金は？",
    choices: [
      "共有自体は無料。コピーすれば宛先アカウントで保管料が発生",
      "共有時に GB あたり $0.05",
      "両アカウントで二重課金",
      "共有不可"
    ],
    a: 0,
    explain: "Snapshot のアカウント間シェアは『参照を許可』のみ。コピーすると宛先アカウントで保管料が発生。"
  },
  { id: "rdsbk-053", topic: "rds-backup", type: "single", difficulty: 2,
    q: "暗号化された RDS Snapshot を別アカウントに共有する場合の追加要件は？",
    choices: [
      "KMS Key も共有する必要あり。共有先で KMS API 課金が発生",
      "暗号化 Snapshot は共有不可",
      "AWS Support に毎回依頼",
      "Multi-AZ なら共有不可"
    ],
    a: 0,
    explain: "暗号化 Snapshot のシェアには KMS キーの権限共有が必要。Cross-account シェアで KMS の API 課金が発生。"
  },
  { id: "rdsbk-054", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot からの復元先で DB Instance Class やストレージタイプを変更できるか。",
    choices: [
      "変更可能 (クラスダウン / ストレージ変更で復元時点で最適化できる)",
      "完全に同一構成のみ",
      "Multi-AZ にしか復元できない",
      "リージョン外復元のみ可能"
    ],
    a: 0,
    explain: "Snapshot Restore のタイミングでサイズ / クラス / ストレージタイプを変えられる。Right-Sizing の絶好のタイミング。"
  },
  { id: "rdsbk-055", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS の Multi-AZ Cluster (3 ノード) のバックアップ料金の特徴は？",
    choices: [
      "クラスタ全体としてのバックアップが取得される。3 ノードぶんではなくクラスタとしての保管料が発生",
      "ノード数だけバックアップ料金が増える",
      "Multi-AZ Cluster はバックアップ不可",
      "Multi-AZ Cluster は Snapshot 無料"
    ],
    a: 0,
    explain: "Multi-AZ Cluster は内部 3 ノードでもバックアップは『クラスタとして 1 系統』。ノード単位の課金にはならない。"
  },
  { id: "rdsbk-056", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS リードレプリカが昇格 (Promote) されてプライマリ化した時の料金は？",
    choices: [
      "Promote 後は通常のスタンドアロン DB として課金。Promote 操作そのものは無料",
      "Promote 時に手数料 $100",
      "Promote 後は無料化",
      "Promote すると Multi-AZ になる"
    ],
    a: 0,
    explain: "Promote は無料操作。Promote 後は独立 DB として通常の料金体系。バックアップ保持も別途設定。"
  },
  { id: "rdsbk-057", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot を取りすぎて『DB ストレージサイズの 100% 超え』になった時、課金単価は？",
    choices: [
      "超過分は GB-month の Backup Storage 単価 (リージョンによる、例: $0.095/GB-月程度) が課金",
      "完全無料",
      "1 Snapshot $0.50 固定",
      "倍額"
    ],
    a: 0,
    explain: "DB ストレージ 100% 以下: 無料。100% 超過分: GB-month 課金。自動 + 手動 + ログを合算して判断する。"
  },
  { id: "rdsbk-058", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS for SQL Server の Native Backup の保管先は？",
    choices: [
      "S3 (顧客の S3 バケットへ出力可)",
      "Snapshot ストレージ",
      "EBS",
      "保管不可"
    ],
    a: 0,
    explain: "RDS for SQL Server / Oracle はネイティブバックアップを S3 に書き出す機能あり。S3 ストレージ料金として課金。長期保管は S3 のライフサイクルで Glacier 等へ移行できる。"
  },
  { id: "rdsbk-059", topic: "rds-backup", type: "single", difficulty: 3,
    q: "RDS for Oracle のネイティブ RMAN バックアップを S3 に保管するときの料金構造は？",
    choices: [
      "S3 のストレージ料金 + リクエスト料金。RDS 側の Snapshot とは別に課金される",
      "完全無料",
      "Oracle ライセンスに含まれる",
      "Multi-AZ で無料"
    ],
    a: 0,
    explain: "Oracle RMAN / SQL Server Native Backup を S3 に出力する場合、S3 ストレージ + リクエスト課金が乗る。RDS Snapshot とは別費用。長期保存目的なら S3 ライフサイクルでアーカイブ化。"
  },

  // ===== Backup ベストプラクティス =====
  { id: "rdsbk-070", topic: "rds-backup", type: "single", difficulty: 2,
    q: "Read Replica が複数あって運用が重い時、料金最適化の第一歩は？",
    choices: [
      "アクセスログ / メトリクスでアクセスが少ないレプリカを特定し統廃合",
      "全部 Multi-AZ 化",
      "全部 Spot 化",
      "全部 Stop"
    ],
    a: 0,
    explain: "未使用 / 低利用 Replica は削減のチャンス。アプリ側の接続先を整理してから削減する。"
  },
  { id: "rdsbk-071", topic: "rds-backup", type: "single", difficulty: 2,
    q: "Replica のレプリラグ (Replica Lag) が大きいときコスト面で考慮すべきは？",
    choices: [
      "Replica のスペック不足ならサイズアップ (= 料金増)。プライマリの書込み負荷を抑えると Replica にも有利",
      "Replica は無料なので無視",
      "Replica を Stop すれば無料化",
      "RDS の RI が無効化される"
    ],
    a: 0,
    explain: "Replica の遅延はインスタンス・ストレージ性能不足や書込み量過剰が原因。コスト最適化と性能のバランスで判断。"
  },
  { id: "rdsbk-072", topic: "rds-backup", type: "single", difficulty: 3,
    q: "AWS Backup のクロスアカウント / クロスリージョンコピーをすべて有効化した時の料金構造は？",
    choices: [
      "コピー先での保管料 + リージョン間転送料が二重に発生。要件レベルを満たす最小限で",
      "クロスリージョンコピーは無料",
      "クロスアカウントコピーは無料",
      "AWS Backup 経由は無料"
    ],
    a: 0,
    explain: "DR 要件で本当に必要なら採用、不要なら片方で十分。やみくもに二重コピーするとコストが跳ねる。"
  },
  { id: "rdsbk-073", topic: "rds-backup", type: "single", difficulty: 2,
    q: "Backup ストレージは『無料枠の DB ストレージサイズ』を変更したら追従するか。",
    choices: [
      "DB ストレージを増やせば無料枠も拡大する (アロケート GB 連動)",
      "無料枠は固定",
      "ストレージを増やしても無料枠は減る",
      "Multi-AZ で無料枠が倍"
    ],
    a: 0,
    explain: "無料枠は『現在の DB ストレージサイズ』。アロケート GB を増やせば無料枠も増える。ただし容量の無駄プロビジョニングは別途コスト。"
  },
  { id: "rdsbk-074", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS の Multi-AZ で『バックアップウィンドウ中はスタンバイ側でバックアップが取られる』のはどの構成？",
    choices: [
      "従来 Multi-AZ (Standby ノード型)",
      "Single-AZ",
      "Read Replica のみ構成",
      "Multi-AZ ではバックアップが取れない"
    ],
    a: 0,
    explain: "従来 Multi-AZ ではバックアップはスタンバイから取得 → プライマリへの影響低減。コストは Multi-AZ で 2 倍だが、性能・運用負荷の観点で価値が出る。"
  },
  { id: "rdsbk-075", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot を「ある時点に固定して長期保管」するときの料金面の最適解は？",
    choices: [
      "手動 Snapshot として S3 Export し、S3 ライフサイクルで Glacier に移行",
      "自動バックアップを 35 日保持し続ける",
      "Read Replica として保管",
      "Multi-AZ で常に持つ"
    ],
    a: 0,
    explain: "長期保管は Snapshot Export + S3 Glacier への階層化が経済的。Snapshot 保管は長期になるほど料金が増えるため、S3 階層を活用。"
  },
  { id: "rdsbk-076", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot を 100 個放置していたが、ほとんどが古くて使う見込みなし。最短の削減アクションは？",
    choices: [
      "古い Snapshot をまとめて削除 (要件に応じて事前承認)",
      "Multi-AZ にする",
      "別リージョンに移す",
      "AMI に変換する"
    ],
    a: 0,
    explain: "Snapshot 削除は最も直接的な削減。世代ポリシーを決めて、DLM / Backup Vault ライフサイクルで自動運用するのが本来の姿。"
  },
  { id: "rdsbk-077", topic: "rds-backup", type: "single", difficulty: 3,
    q: "Backup Vault Lock (AWS Backup) を有効にした場合のコスト面の影響は？",
    choices: [
      "ロック自体に追加料金はないが、ロックされた Backup は保持期間中削除できないため保管料が継続発生する",
      "ロック中は無料",
      "ロックで保管料が半額",
      "ロックは Spot Backup 限定"
    ],
    a: 0,
    explain: "Backup Vault Lock は WORM。コンプライアンス上の改竄防止。料金は保管料がロック期間中発生し続けるため、対象と保持期間の選定が重要。"
  },
  { id: "rdsbk-078", topic: "rds-backup", type: "single", difficulty: 2,
    q: "リードレプリカを別リージョンに作って DR にするとき、コスト最適化のテクニックとして妥当なのは？",
    choices: [
      "DR 用 Replica のサイズはプライマリより小さくしておき、本番昇格時にスケールアップ",
      "DR 用 Replica はプライマリと同サイズ必須",
      "DR 用 Replica は Spot 必須",
      "DR 用 Replica は無料化される"
    ],
    a: 0,
    explain: "DR 用は普段アクセス少ないので小型 OK。災害時にスケールアップ。クロスリージョン転送量とのバランスで判断。"
  },
  { id: "rdsbk-079", topic: "rds-backup", type: "single", difficulty: 2,
    q: "リードレプリカに対する CloudWatch メトリクスの料金は？",
    choices: [
      "標準メトリクスは無料 / Enhanced や PI 長期保持はインスタンスごとに別途課金",
      "Replica は全メトリクス無料",
      "Replica は CloudWatch を使えない",
      "Multi-AZ Replica は無料"
    ],
    a: 0,
    explain: "Replica も別 RDS インスタンスなので、Enhanced Monitoring / PI 長期保持の課金もインスタンス単位。複数 Replica で安易に PI 24 ヶ月にすると意外と高い。"
  },
  { id: "rdsbk-080", topic: "rds-backup", type: "single", difficulty: 2,
    q: "RDS Snapshot を別アカウントの DR バケットへコピーするユースケースで気をつけるべきは？",
    choices: [
      "コピー先アカウントで保管料が発生 + KMS キー共有・コピー時の暗号化変換料が発生",
      "完全無料",
      "コピー先は AWS が無料で保管",
      "DR バケットでは Snapshot は保管できない"
    ],
    a: 0,
    explain: "Snapshot のクロスアカウントコピー: KMS Key 共有 + 暗号化変換時の KMS API + 保管料 + 転送料。設計を確実にしないとコストが膨らむ。"
  }
);
