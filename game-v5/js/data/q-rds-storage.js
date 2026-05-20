/* RDS ストレージ — 30+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  { id: "rdss-001", topic: "rds-storage", type: "single", difficulty: 1,
    q: "RDS で選べるストレージタイプは？",
    choices: [
      "汎用 SSD (gp2 / gp3) / プロビジョンド IOPS SSD (io1 / io2) / Magnetic (旧)",
      "gp3 / Magnetic のみ",
      "全リージョンで gp2 だけ",
      "Standard / Premium / Enterprise"
    ],
    a: 0,
    explain: "EC2 EBS と同様だが、RDS は HDD (st1/sc1) を提供しない (一部例外あり)。基本は gp2 / gp3 / io1 / io2。Magnetic は旧世代。"
  },
  { id: "rdss-002", topic: "rds-storage", type: "single", difficulty: 1,
    q: "新規 RDS で第一選択のストレージタイプは？",
    choices: ["gp3", "gp2", "io1", "io2"],
    a: 0,
    explain: "gp3 は容量 + IOPS + スループット独立課金で、gp2 比でストレージ単価が約 20% 安い。RDS でもデフォルトの推奨。"
  },
  { id: "rdss-003", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS gp3 のベースライン IOPS / スループットは？",
    choices: [
      "3000 IOPS / 125 MB/s (DB ストレージ 400 GB 以上から拡張可能)",
      "1000 IOPS / 100 MB/s",
      "16000 IOPS / 1000 MB/s",
      "100 IOPS / 50 MB/s"
    ],
    a: 0,
    explain: "RDS gp3 のベースラインも 3000 IOPS / 125 MB/s。容量によって追加 IOPS / スループットを設定できる閾値が異なる (RDS では 400 GB 以上が境界)。"
  },
  { id: "rdss-004", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS gp2 で IOPS を増やしたい場合の制約は？",
    choices: [
      "容量を増やすしか IOPS を増やす方法がない (3 IOPS/GB)。1 TB 以上でバースト相当 3000 IOPS",
      "IOPS だけを単独で増やせる",
      "Multi-AZ にすれば IOPS が倍",
      "Spot RDS なら IOPS が無料"
    ],
    a: 0,
    explain: "gp2 は容量連動。100 GB → 300 IOPS。1334 GB で 4000 IOPS、5334 GB で 16000 IOPS の上限。IOPS が足りないと容量を水増しする羽目になり結局割高。gp3 / io1 / io2 を検討。"
  },
  { id: "rdss-005", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS の io1 / io2 を選ぶ典型的なシーンは？",
    choices: [
      "高 IOPS が常時必要 (gp3 上限 16000 IOPS / 1000 MB/s を超える) / 高耐久性が必要",
      "アーカイブ用途",
      "開発環境",
      "Multi-AZ 不要な小規模"
    ],
    a: 0,
    explain: "io1/io2 は容量と独立に高 IOPS を設定。io2 は耐久性が io1 比 1000 倍。RDS には io2 Block Express が一部インスタンスで使え、さらに高性能。"
  },
  { id: "rdss-006", topic: "rds-storage", type: "single", difficulty: 1,
    q: "RDS の Magnetic ストレージは現在どうなっているか。",
    choices: [
      "新規には非推奨。既存 DB の引き継ぎで残存するのみ",
      "全リージョンで完全廃止",
      "RDS for Oracle のみで推奨",
      "Multi-AZ 専用"
    ],
    a: 0,
    explain: "Magnetic (旧 standard) は新規には基本選ばない。容量上限 (3 TB) や IOPS 上限が低い。gp3 が代替。"
  },
  { id: "rdss-007", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS の Storage Autoscaling を有効にしたとき、増分は何 % まで自動拡張されるか。",
    choices: [
      "閾値到達時に概ね 10% (または 10 GB) ずつ拡張、Maximum allocated storage まで",
      "100% 倍に拡張",
      "1 GB ずつ拡張",
      "拡張しない"
    ],
    a: 0,
    explain: "RDS Storage Autoscaling は段階的拡張。Maximum allocated storage を必ず設定して上限を絞ること。"
  },
  { id: "rdss-008", topic: "rds-storage", type: "single", difficulty: 1,
    q: "RDS のストレージ料金は『プロビジョン (確保) 容量』と『実使用量』のどちらで決まるか。",
    choices: [
      "プロビジョン容量 (確保した GB が満杯でなくても請求)",
      "実使用量のみ",
      "両者の平均",
      "Multi-AZ 時のみプロビジョン課金"
    ],
    a: 0,
    explain: "EBS と同じくプロビジョン課金。中身が空でも GB は払う。最初に大きく確保しすぎないこと。"
  },
  { id: "rdss-009", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS でストレージタイプを変更する操作は？",
    choices: [
      "Modify Instance でオンラインに gp2 → gp3 などの変更が可能 (短時間のパフォーマンス低下あり)",
      "再構築が必要",
      "Multi-AZ 限定で可能",
      "AWS Support 経由のみ"
    ],
    a: 0,
    explain: "gp2 → gp3 はオンライン変換 (ストレージ最適化中の I/O は一時的に影響を受け得る)。長時間影響が出る場合があるので非ピーク時間に。"
  },
  { id: "rdss-010", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS Multi-AZ のストレージ料金は Single-AZ の何倍か。",
    choices: [
      "概ね 2 倍 (Standby 用のストレージも確保される)",
      "等倍",
      "0.5 倍",
      "10 倍"
    ],
    a: 0,
    explain: "Multi-AZ ではスタンバイ AZ にも同じ容量を確保 → ストレージ料金は 2 倍。Multi-AZ Cluster (3 ノード) ではさらに増える。"
  },
  { id: "rdss-011", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS gp3 の追加 IOPS 課金単位は概ね？",
    choices: [
      "1 プロビジョン IOPS / 月 あたりの単価で課金される (3000 IOPS のベースラインを超えた分)",
      "1 リクエストごとに $0.001",
      "Multi-AZ なら無料",
      "全 IOPS 一律無料"
    ],
    a: 0,
    explain: "gp3 はベースライン 3000 IOPS を超える分のみ追加課金。スループット 125 MB/s 超え分も同様。RDS gp2 → gp3 移行は単価面で有利になることが多い。"
  },
  { id: "rdss-012", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS io1 と io2 の選び方として「同じ料金なら基本どちらが推奨」か。",
    choices: [
      "io2 (耐久性が高い)",
      "io1 (新世代)",
      "Magnetic",
      "gp2"
    ],
    a: 0,
    explain: "io2 は io1 比で耐久性が高く同じ料金帯。新規には io2 を選ぶ。さらに高い性能が必要なら io2 Block Express。"
  },
  { id: "rdss-013", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS の IOPS 不足を疑うときの典型的なメトリクスは？",
    choices: [
      "ReadIOPS / WriteIOPS / DiskQueueDepth / ReadLatency / WriteLatency が高い",
      "CPUUtilization が低い",
      "DatabaseConnections が 0",
      "FreeableMemory が大きい"
    ],
    a: 0,
    explain: "IOPS 不足は I/O 待ち時間 / キュー長で出る。CloudWatch / Performance Insights で確認、gp3 の追加 IOPS or io1/io2 への切替を検討。"
  },
  { id: "rdss-014", topic: "rds-storage", type: "single", difficulty: 3,
    q: "「IOPS が足りないので gp2 で容量を 3 TB に増やしている」状態のコスト面の課題は？",
    choices: [
      "容量過剰の浪費。gp3 に変えれば容量を抑えつつ IOPS を独立に設定でき、トータルで安くなることが多い",
      "gp2 のままが最安",
      "Multi-AZ にすれば自動的に最適化",
      "Spot RDS に切替"
    ],
    a: 0,
    explain: "gp2 は IOPS のために容量を肥大化させる定番アンチパターン。gp3 で IOPS / スループットを独立にプロビジョンすれば容量を本来サイズに戻せて節約。"
  },
  { id: "rdss-015", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS の Storage Throughput 設定 (gp3 で 125 MB/s 超え) の課金は？",
    choices: [
      "1 MB/s あたり月額単価で課金 (IOPS と独立)",
      "125 MB/s を超えると DB ごと無料",
      "1 GB あたり",
      "Multi-AZ で無料"
    ],
    a: 0,
    explain: "gp3 のスループットも独立課金。ベースライン 125 MB/s に対して最大 1000 MB/s まで。"
  },
  { id: "rdss-016", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS gp3 のベースライン IOPS / スループットがそのまま使える容量帯は？",
    choices: [
      "ストレージサイズが 400 GB 以下 (RDS gp3) では IOPS / スループットの追加プロビジョニング不可で、ベースラインのみ",
      "100 GB 以下のみ無料",
      "1 TB 以上のみ",
      "ベースラインは全容量で使えない"
    ],
    a: 0,
    explain: "RDS gp3 で追加 IOPS/スループットを設定できるのは 400 GB 以上 (エンジンによって閾値が異なる)。それ未満ではベースラインのみ。"
  },
  { id: "rdss-017", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS のディスク容量を増やす操作 (ScalingStorage) の料金面の挙動は？",
    choices: [
      "拡張中も通常のインスタンス料金 / ストレージ料金が発生。容量増加分は適用後すぐに新料金で課金",
      "拡張中は無料",
      "拡張で 50% 割引",
      "拡張は一切できない"
    ],
    a: 0,
    explain: "RDS のストレージ拡張は通常通り課金。注意点は『縮小不可』なので必要量に応じてアラインさせること。"
  },
  { id: "rdss-018", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS のストレージを 6 時間 のうちに 2 回連続で変更しようとするとどうなるか。",
    choices: [
      "6 時間に 1 回しか変更できない (制約あり)。再変更にはクールダウンが必要",
      "何度でも変更可能",
      "Multi-AZ なら無制限",
      "AWS Support に申請すれば回避"
    ],
    a: 0,
    explain: "RDS のストレージ変更は 6 時間に 1 回が原則 (公開ドキュメント参照)。設計時にこの制約を把握しておく。"
  },
  { id: "rdss-019", topic: "rds-storage", type: "single", difficulty: 3,
    q: "io1 から io2 への移行に伴うコストインパクトは？",
    choices: [
      "io1 と io2 はほぼ同価格帯。耐久性向上 / 性能向上のメリットを取りに行く移行に伴うコスト増は小さい",
      "io2 は io1 の半額",
      "io2 は io1 の 10 倍",
      "io2 への移行は無料"
    ],
    a: 0,
    explain: "io1 → io2 は同等料金帯で性能・耐久性が改善。移行作業 (停止または Read Replica 経由) の工数は別途。"
  },
  { id: "rdss-020", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS のスワップ領域 / 一時テーブル (tmpfs) はストレージ料金にどう影響するか。",
    choices: [
      "DB エンジン内部で扱われ、プロビジョンドストレージから消費される。空きが少ないと拡張が必要",
      "ストレージとは別に課金",
      "完全に無料",
      "Multi-AZ なら無料化"
    ],
    a: 0,
    explain: "RDS は内部の tmp / WAL も含めて『プロビジョン GB』内で利用。空き不足はストレージ拡張を引き起こすため、ベースサイズの見積もりに余裕を。"
  },
  { id: "rdss-021", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS のストレージ自動拡張で『追加分も RI 価格で安くなる』か。",
    choices: [
      "RDS Reserved DB Instance はインスタンス料金のみが対象。ストレージは Reserved 化できないので追加分は通常料金",
      "ストレージにも RI が適用",
      "Storage Autoscaling 中は無料",
      "ストレージは Spot 化可能"
    ],
    a: 0,
    explain: "RI でカバーできるのはインスタンス時間のみ。ストレージ / バックアップ / 転送は別建てで通常料金。"
  },
  { id: "rdss-022", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS for SQL Server で『ストレージタイプを後から変更』する場合の注意点は？",
    choices: [
      "DB によっては再起動 / 停止が伴う場合があるためメンテナンスウィンドウで実施を推奨",
      "全ストレージタイプ間が完全に無停止で切替可能",
      "リージョン外への移動が必須",
      "ストレージタイプ変更は SQL Server のみ不可"
    ],
    a: 0,
    explain: "ストレージ変更は基本オンラインだが、エンジン・サイズによっては影響が出る。Maintenance Window でやるのが安全。"
  },
  { id: "rdss-023", topic: "rds-storage", type: "fill", numeric: true, difficulty: 2,
    q: "RDS gp3 のストレージを 200 GB 確保した。$0.115/GB-月 の単価とした場合の月額容量料金は概ね何ドル (整数で)。",
    a: 23, tolerance: 1,
    explain: "200 × 0.115 = $23。Multi-AZ なら倍の $46。追加 IOPS / スループットを設定するとさらに加算される。"
  },
  { id: "rdss-024", topic: "rds-storage", type: "fill", numeric: true, difficulty: 3,
    q: "RDS gp3 でベースライン 3000 IOPS に加えて 1000 IOPS を追加した。1 IOPS あたり $0.02/月とした場合、追加 IOPS の月額は何ドル (整数で)。",
    a: 20, tolerance: 1,
    explain: "1000 × 0.02 = $20/月。Multi-AZ なら倍の $40。スループット追加も同様に独立加算。"
  },
  { id: "rdss-025", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS の Provisioned IOPS (io1/io2) の課金は？",
    choices: [
      "ストレージ GB の単価 + プロビジョンされた IOPS 単価 (1 IOPS / 月) で別建て",
      "ストレージのみ",
      "IOPS のみ",
      "完全に無料"
    ],
    a: 0,
    explain: "io1/io2 は容量 + IOPS で独立課金。IOPS が高いほど高い。"
  },
  { id: "rdss-026", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS の Magnetic と gp3 のコスト比較として正しいものは？",
    choices: [
      "GB 単価では Magnetic がやや安いが、IOPS / スループットが低く実用性が低い。gp3 のほうがコスパが高い",
      "Magnetic のほうが高い",
      "両者は同じ単価",
      "Magnetic は無料"
    ],
    a: 0,
    explain: "Magnetic は安いが性能が出ない。本番では gp3 がほぼ一択。"
  },
  { id: "rdss-027", topic: "rds-storage", type: "single", difficulty: 3,
    q: "RDS のディスク残量を CloudWatch でアラート監視する標準的なメトリクスは？",
    choices: [
      "FreeStorageSpace",
      "FreeableMemory",
      "DatabaseConnections",
      "CPUUtilization"
    ],
    a: 0,
    explain: "FreeStorageSpace を監視して残容量で発報。Storage Autoscaling と組み合わせて運用コストを最適化。"
  },
  { id: "rdss-028", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS のストレージ最適化として『ベースサイズを下げて削減した』後にやりがちな失敗は？",
    choices: [
      "縮小ができないため、何らかの理由で増やしすぎたまま放置するパターン",
      "ベースサイズを下げると Multi-AZ が解除される",
      "ストレージ縮小操作で AWS Support 経由で課金",
      "ベースサイズを下げると RI が無効"
    ],
    a: 0,
    explain: "RDS は『縮小不可』。最初の確保量を控えめにし、Storage Autoscaling で必要時に拡張するのが基本戦略。"
  },
  { id: "rdss-029", topic: "rds-storage", type: "single", difficulty: 2,
    q: "RDS で『データ圧縮』を有効化するとコスト面のメリットは？",
    choices: [
      "ストレージ容量を抑えられる → 容量課金が減る。代わりに CPU 使用率は上がる",
      "完全無料化",
      "Multi-AZ が自動で無料",
      "圧縮は RDS 非対応"
    ],
    a: 0,
    explain: "InnoDB ROW_FORMAT=COMPRESSED など、エンジン側の機能でストレージを節約できる。CPU とのトレードオフ。"
  },
  { id: "rdss-030", topic: "rds-storage", type: "multi", difficulty: 2,
    q: "RDS ストレージのコスト最適化の代表アクションを 2 つ以上選べ。",
    choices: [
      "gp2 → gp3 への切替",
      "アロケート容量の見直し (過大プロビジョニングを抑制)",
      "古いログ / 一時テーブルの整理",
      "Multi-AZ をやめる"
    ],
    a: [0, 1, 2],
    explain: "gp3 化 / 適切なサイジング / 不要データの掃除が王道。本番で Multi-AZ をやめるのは SLA とのトレードオフで個別判断。"
  },
  { id: "rdss-031", topic: "rds-storage", type: "single", difficulty: 2,
    q: "ストレージ容量を 2 倍に増やした時の料金影響として、Multi-AZ では概ねどう増えるか。",
    choices: [
      "ストレージ料金が 4 倍 (容量 2 倍 × Multi-AZ で 2 倍)",
      "2 倍",
      "1 倍 (変わらない)",
      "0.5 倍"
    ],
    a: 0,
    explain: "ストレージ容量 × Multi-AZ 係数 (2) で計算。Multi-AZ 環境で気軽に容量を増やすと請求書のインパクトが大きい。"
  }
);
