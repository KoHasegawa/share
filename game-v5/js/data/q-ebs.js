/* EBS / スナップショット — 60+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== EBS タイプの基本 =====
  { id: "ebs-001", topic: "ebs", type: "single", difficulty: 1,
    q: "現行 EBS の汎用 SSD で「コスト最適化として通常まず検討すべき」タイプは？",
    choices: ["gp3", "gp2", "io1", "io2 Block Express"],
    a: 0,
    explain: "gp3 は gp2 後継。同等性能を維持しつつストレージ単価は約 20% 安く、ベースライン IOPS 3000 / スループット 125 MB/s が含まれる。"
  },
  { id: "ebs-002", topic: "ebs", type: "single", difficulty: 1,
    q: "gp3 と gp2 の最大の課金構造の違いは？",
    choices: [
      "gp3 はストレージ容量 / IOPS / スループットが独立課金。gp2 は容量に比例して IOPS が決まり、IOPS 単独追加課金は不可",
      "gp2 は分単位課金、gp3 は時間単位課金",
      "gp3 は AZ ごとに料金が違うが gp2 は均一",
      "両者は完全に同じ料金体系"
    ],
    a: 0,
    explain: "gp3: 容量 + 追加 IOPS (3000 超え分) + 追加スループット (125 超え分) の三軸独立。gp2: 容量のみ。GB あたりの IOPS は 3 (最大 16000) と容量依存。"
  },
  { id: "ebs-003", topic: "ebs", type: "fill", numeric: true, difficulty: 2,
    q: "gp3 のベースライン IOPS (追加料金なしで含まれる) はいくつか。",
    a: 3000, tolerance: 0,
    explain: "gp3 はベースライン 3000 IOPS / 125 MB/s が容量料金に含まれる。それを超える IOPS / スループットだけ追加課金。"
  },
  { id: "ebs-004", topic: "ebs", type: "fill", numeric: true, difficulty: 2,
    q: "gp3 のベースラインスループット (MB/s) はいくつか。",
    a: 125, tolerance: 0,
    explain: "ベースライン 125 MB/s が含まれる。最大 1000 MB/s まで増やせる。"
  },
  { id: "ebs-005", topic: "ebs", type: "single", difficulty: 2,
    q: "gp2 の IOPS は容量に対してどう決まるか。",
    choices: [
      "1 GB あたり 3 IOPS (最小 100 / 最大 16000 IOPS)",
      "1 GB あたり 1 IOPS",
      "容量に関係なく一律 3000 IOPS",
      "1 GB あたり 100 IOPS"
    ],
    a: 0,
    explain: "gp2 は 3 IOPS/GB が基本性能。33.3 GB 未満は最低 100 IOPS、5334 GB 以上で上限 16000 IOPS。gp3 はこの GB 連動を捨て、独立課金にしたのが進化点。"
  },
  { id: "ebs-006", topic: "ebs", type: "single", difficulty: 2,
    q: "gp2 で 100 GB を確保した場合のベースライン IOPS は？",
    choices: ["300 IOPS", "100 IOPS", "3000 IOPS", "16000 IOPS"],
    a: 0,
    explain: "100 GB × 3 = 300 IOPS。瞬発的に 3000 IOPS までバーストする「I/O クレジット」もある (小容量限定)。"
  },
  { id: "ebs-007", topic: "ebs", type: "single", difficulty: 2,
    q: "gp2 でバースト性能 3000 IOPS まで使えるのは概ねどの容量帯か。",
    choices: [
      "容量 1 GB から 1 TB 未満まで (バーストバケットあり)",
      "5 TB 以上",
      "容量に関係なく常時 3000",
      "10 GB 未満限定"
    ],
    a: 0,
    explain: "小容量の gp2 は『I/O クレジット』でバースト 3000 IOPS まで上がるが、長時間維持できない。1 TB を超えると常時 3000+ IOPS で動くがバースト概念は基本消える。"
  },

  // ===== io1 / io2 =====
  { id: "ebs-010", topic: "ebs", type: "single", difficulty: 2,
    q: "Provisioned IOPS SSD (io1/io2) を選ぶ典型的なユースケースは？",
    choices: [
      "高い IOPS が継続的に必要なミッションクリティカル DB",
      "アクセス頻度の低いアーカイブ",
      "起動ボリューム (OS) 専用",
      "EFS の代替"
    ],
    a: 0,
    explain: "io1/io2 は IOPS をプロビジョン (容量と独立) できる。gp3 でも 16000 IOPS まで届くので、それ以上 (例: 64K IOPS / 256K IOPS @ io2 Block Express) を必要とするとき。"
  },
  { id: "ebs-011", topic: "ebs", type: "single", difficulty: 2,
    q: "io2 が io1 に対して優れる点 (同価格帯) として最も重要なのは？",
    choices: [
      "耐久性 (Durability) が高い (99.999% vs 99.8〜99.9%)",
      "ベースライン IOPS が低い",
      "リージョン間複製が無料",
      "Spot 専用で安い"
    ],
    a: 0,
    explain: "io2 は io1 比で耐久性が桁違いに高い (1 ボリュームあたり 0.001% 以下の AFR)。同じ料金なら基本 io2 を選ぶ。io2 Block Express は NVMe で IOPS / スループットさらに高い。"
  },
  { id: "ebs-012", topic: "ebs", type: "single", difficulty: 3,
    q: "io2 Block Express の特徴で正しいものは？",
    choices: [
      "最大 256,000 IOPS / 4,000 MB/s / 64 TiB / sub-ms レイテンシ。Nitro ベース EC2 に限定",
      "全リージョンで gp3 と同じ料金で利用可能",
      "Multi-AZ 対応で 2 AZ にレプリカされる",
      "io1 と完全に同じ仕様"
    ],
    a: 0,
    explain: "io2 Block Express は最高峰の EBS。Nitro 世代の特定インスタンスに限定。価格は io2 と同等の構造だが用途が SAP HANA / Oracle / SQL Server 等の重 DB。"
  },

  // ===== HDD =====
  { id: "ebs-020", topic: "ebs", type: "single", difficulty: 2,
    q: "st1 (スループット最適化 HDD) のユースケースとして適切なのは？",
    choices: [
      "ビッグデータ / ログ / 動画など、シーケンシャルアクセスが多くスループット重視のワークロード",
      "ランダム IOPS が多いトランザクション DB",
      "ブートディスク",
      "Lambda の一時ストレージ"
    ],
    a: 0,
    explain: "st1 はシーケンシャルスループット重視。GP3 / IO に比べて GB 単価が安い。ブートディスクとしては使えない (NG)。"
  },
  { id: "ebs-021", topic: "ebs", type: "single", difficulty: 2,
    q: "sc1 (Cold HDD) の特徴は？",
    choices: [
      "EBS のうち最安。アクセス頻度が極めて低いコールドデータ向け",
      "全 EBS タイプ最速",
      "ブートディスク専用",
      "Multi-AZ 必須"
    ],
    a: 0,
    explain: "sc1 は最安 (GB あたり数 ¢/月)。アクセス頻度が低くたまにしか読まないデータ向け。st1 と同じくブートディスク不可。"
  },
  { id: "ebs-022", topic: "ebs", type: "multi", difficulty: 2,
    q: "st1 / sc1 (HDD) を「ブートボリュームに使えない」「ボリュームサイズの下限が大きい」など、SSD 系と異なる制約を 2 つ以上選べ。",
    choices: [
      "ブートボリュームとして使用不可",
      "最小サイズが 125 GB (st1/sc1) と大きめ",
      "スナップショット不可",
      "暗号化不可"
    ],
    a: [0, 1],
    explain: "st1 / sc1 はブートディスク不可・最小 125 GB。スナップショットや暗号化は可能。"
  },

  // ===== Magnetic =====
  { id: "ebs-030", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS の「standard (Magnetic)」ボリュームは現在どうなっているか。",
    choices: [
      "旧世代として残るが新規利用は非推奨",
      "全リージョンで完全廃止",
      "Aurora で唯一使われる",
      "Spot EC2 のみ利用可能"
    ],
    a: 0,
    explain: "Magnetic は旧世代。新規には推奨されない。明示しない限り選ばないように。"
  },

  // ===== スナップショット基礎 =====
  { id: "ebs-040", topic: "ebs", type: "single", difficulty: 1,
    q: "EBS スナップショットはどこに保管されるか。",
    choices: [
      "Amazon S3 上 (ただしユーザの S3 バケットには見えず管理対象外)",
      "EBS と同じ AZ のディスク",
      "S3 Glacier に直接書かれる",
      "ローカル NVMe"
    ],
    a: 0,
    explain: "EBS スナップショットは AWS 管理の S3 上にリージョン単位で保管される (ユーザの S3 バケットには見えない)。料金は『使用量 GB / 月』。"
  },
  { id: "ebs-041", topic: "ebs", type: "single", difficulty: 1,
    q: "EBS スナップショットの課金は「フルコピー」か「増分」か。",
    choices: [
      "増分 (初回フル、以降変更ブロックのみを保管)",
      "毎回フルコピー",
      "差分は無料",
      "リージョンあたり 1 枚しか持てない"
    ],
    a: 0,
    explain: "スナップショットは増分式。ただし内部ではブロック参照を持っているため、ある古いスナップショットを削除しても、依存していたブロックは新しいスナップショットに引き継がれる。"
  },
  { id: "ebs-042", topic: "ebs", type: "single", difficulty: 2,
    q: "古いスナップショットを 1 つ削除した時、料金はどうなる可能性が高いか。",
    choices: [
      "削除したスナップショット固有のブロックぶんだけ削減される (他に参照されているブロックは残る)",
      "100% 全部削減される",
      "削減されない",
      "課金が倍になる"
    ],
    a: 0,
    explain: "増分スナップは依存関係でブロックが共有される。古い 1 枚を消しても、新しいスナップで参照されているブロックは残り続け、削減は限定的なことがある。"
  },
  { id: "ebs-043", topic: "ebs", type: "single", difficulty: 2,
    q: "Snapshot を毎日取り続けた場合、料金面の挙動として正しいものは？",
    choices: [
      "変更されたブロック分しか増えない (変更が少なければ容量はほぼ増えない)",
      "毎日ボリューム容量分が積み上がる",
      "30 日後に自動でフルコピーになる",
      "Snapshot は無料"
    ],
    a: 0,
    explain: "変更ブロックのみ増分課金。書き込みが少ない DB なら毎日取っても GB 単位での増加は小さい。ただし保持本数が多すぎると依存ブロックの解放が起きにくくなり、削除しても削減効果が薄いことがある。"
  },

  // ===== Snapshot Archive =====
  { id: "ebs-050", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS Snapshot Archive (アーカイブ階層) の特徴として正しいものは？",
    choices: [
      "標準スナップショットの 75% 程度安い保管料、最小保持 90 日、フルコピー化されるので増分には戻れない",
      "標準より 10% 高い保管料",
      "保管料は同じだが復元料が無料",
      "Lambda からのみアクセス可能"
    ],
    a: 0,
    explain: "Snapshot Archive: 標準より大幅に安い保管料 (GB 単価) だが、保持最低 90 日、復元時にコストとリードタイム (24〜72h) が発生。長期保持のコンプライアンス用。"
  },
  { id: "ebs-051", topic: "ebs", type: "single", difficulty: 2,
    q: "Snapshot Archive を 90 日未満で削除した場合の課金は？",
    choices: [
      "残りの最低保持日数分が早期削除料金として請求される",
      "削除自体ができない",
      "標準スナップショット料金との差額のみ請求",
      "ペナルティはない"
    ],
    a: 0,
    explain: "最低保持 90 日。前倒しで消すと未達分の保管料が早期削除料として請求される。短期保持に Snapshot Archive を選ばないこと。"
  },
  { id: "ebs-052", topic: "ebs", type: "single", difficulty: 3,
    q: "Snapshot Archive 化に向く対象として最も妥当なのは？",
    choices: [
      "監査要件で数年残す必要がある、復元頻度がほぼゼロの古いスナップショット",
      "毎日復元している直近のバックアップ",
      "AMI 用の最新スナップショット",
      "Read Replica のソース"
    ],
    a: 0,
    explain: "復元するつもりがなく、規制目的で長期保管するスナップショット。毎日復元するものや AMI 用には不向き。"
  },

  // ===== AMI / Recycle Bin =====
  { id: "ebs-060", topic: "ebs", type: "single", difficulty: 2,
    q: "AMI を「登録解除 (deregister)」しただけで、紐づくスナップショットは消えるか。",
    choices: [
      "消えない (スナップショットは別途削除が必要)",
      "自動で消える",
      "30 日後に自動削除",
      "AMI 登録解除と同時に必ず削除"
    ],
    a: 0,
    explain: "AMI deregister は AMI のメタを外すだけで、実体のスナップショットは残り続け課金される。クリーンアップは AMI deregister + スナップショット削除をペアで。"
  },
  { id: "ebs-061", topic: "ebs", type: "single", difficulty: 2,
    q: "AMI を Deprecate (非推奨化) した場合の効果は？",
    choices: [
      "AMI 一覧から既定で非表示になり、ASG 等で誤って使われにくくなる (削除ではない / 課金は継続)",
      "AMI が削除される",
      "AMI のスナップショットだけ削除",
      "AMI のシェアが解除される"
    ],
    a: 0,
    explain: "Deprecate はリスト上の表示制御。コスト削減自体はしない (実体は残る)。世代切替のステップとして使う運用機能。"
  },
  { id: "ebs-062", topic: "ebs", type: "single", difficulty: 2,
    q: "Recycle Bin (EBS スナップショット / AMI 用) の主な役割は？",
    choices: [
      "誤削除した EBS スナップショット / AMI を一定期間 (1日〜1年) 保持して復元可能にする",
      "未使用 EBS を自動アーカイブ",
      "Cost Explorer のエクスポート機能",
      "EBS の Multi-AZ レプリカ"
    ],
    a: 0,
    explain: "Recycle Bin: 削除しても指定期間 (Retention) 保持。誤削除のリカバリ用。Retention 中も保管料金は通常通り発生する点に注意。"
  },

  // ===== ライフサイクル =====
  { id: "ebs-070", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS スナップショットの作成 / 保持 / 削除を自動化する AWS サービスは？",
    choices: [
      "Amazon Data Lifecycle Manager (DLM)",
      "AWS Lambda 必須",
      "AWS Glue",
      "AWS CloudHSM"
    ],
    a: 0,
    explain: "DLM はタグベースで対象を絞り込み、頻度 / 世代数 / アーカイブ移行 / クロスリージョンコピーまで自動化できる。古いスナップショットの放置によるコスト膨張を防ぐ基本ツール。"
  },
  { id: "ebs-071", topic: "ebs", type: "multi", difficulty: 2,
    q: "DLM ポリシーで設定できるアクションを 2 つ以上選べ。",
    choices: [
      "保持世代数の指定",
      "別リージョンへの自動コピー",
      "アーカイブ階層への移行",
      "EC2 オンデマンドを Spot に変換"
    ],
    a: [0, 1, 2],
    explain: "DLM は保持本数 / クロスリージョンコピー / クロスアカウント / アーカイブ移行などをサポート。Spot 変換は EC2 側の話で DLM の機能ではない。"
  },

  // ===== クロスリージョン =====
  { id: "ebs-080", topic: "ebs", type: "single", difficulty: 2,
    q: "スナップショットを別リージョンにコピーする時の課金として正しいものは？",
    choices: [
      "リージョン間データ転送料金 + コピー先リージョンでのスナップショット保管料金",
      "コピー先のスナップショット保管料金のみ",
      "完全に無料",
      "コピー元のスナップショット料金が倍になる"
    ],
    a: 0,
    explain: "クロスリージョンコピーはリージョン間転送 (GB 単価) + コピー先のスナップショット容量保管料の両方が発生。DR 用途で本当に必要か検討。"
  },
  { id: "ebs-081", topic: "ebs", type: "single", difficulty: 2,
    q: "スナップショットをクロスアカウントで共有した時の課金は？",
    choices: [
      "ソースアカウントが課金を負担 (スナップショット保管料は元のアカウント)",
      "宛先アカウントが保管料を負担",
      "両方のアカウントで二重課金",
      "シェアは無料"
    ],
    a: 0,
    explain: "クロスアカウントシェアは『参照を許可する』だけで実体はソース側。コピーしてもらえば宛先側に複製が出来てそちらの課金になる。"
  },

  // ===== Encryption =====
  { id: "ebs-090", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS 暗号化を有効にしたとき料金は？",
    choices: [
      "EBS 自体の追加料金はない (利用する KMS キーの API コール課金は別途)",
      "暗号化は 20% 追加料金",
      "Multi-AZ 必須",
      "リージョン間転送が無料になる"
    ],
    a: 0,
    explain: "EBS 暗号化は AWS Owned Key を使う限り EBS の追加料金なし。Customer Managed Key (KMS) を使うと KMS の API 課金やキー管理費が発生する。"
  },

  // ===== Multi-Attach =====
  { id: "ebs-100", topic: "ebs", type: "single", difficulty: 3,
    q: "EBS Multi-Attach (io1/io2) の特徴で正しいものは？",
    choices: [
      "同一 AZ 内の最大 16 台の Nitro ベース EC2 に同時アタッチ可能。クラスタファイルシステムで利用",
      "リージョン間 EC2 にもアタッチ可",
      "gp3 でも有効",
      "Spot インスタンスでも自動で利用可能"
    ],
    a: 0,
    explain: "Multi-Attach は同 AZ ・Nitro 系・io1/io2 限定。一般的な単一サーバ運用には不要。クラスタウェア (OCFS2, GFS2 等) で使う。料金は通常の io1/io2 と同じだが用途固有のためコスト計画も注意。"
  },

  // ===== Elastic Volumes =====
  { id: "ebs-110", topic: "ebs", type: "single", difficulty: 2,
    q: "Elastic Volumes 機能で「停止せず」できる操作は？",
    choices: [
      "容量拡張 / IOPS変更 / ボリュームタイプ変更 (例: gp2 → gp3)",
      "AZ 移動",
      "アカウント移動",
      "暗号化キー変更 (有効化はオンライン不可)"
    ],
    a: 0,
    explain: "Elastic Volumes はサイズアップ・IOPS 変更・タイプ変更がオンラインで可能。AZ や暗号化状態の変更は不可 (スナップショット経由で対応)。"
  },
  { id: "ebs-111", topic: "ebs", type: "single", difficulty: 2,
    q: "gp2 → gp3 への移行で押さえるべき注意点は？",
    choices: [
      "gp2 の容量とパフォーマンス特性 (3 IOPS/GB) を確認し、現状の IOPS が 3000 以下なら追加課金なしで gp3 に移行できる",
      "移行には EC2 停止が必要",
      "AMI を取り直す必要がある",
      "リージョン変更が必要"
    ],
    a: 0,
    explain: "gp2 → gp3 移行はオンライン可能。3000 IOPS / 125 MB/s 以下のワークロードならベースラインに収まり、容量単価の差だけで純粋に削減できる。性能要件が高ければ追加 IOPS / Throughput を設定。"
  },

  // ===== FSR / Fast Snapshot Restore =====
  { id: "ebs-120", topic: "ebs", type: "single", difficulty: 3,
    q: "EBS Fast Snapshot Restore (FSR) の課金的な特徴は？",
    choices: [
      "AZ × スナップショット × 時間で課金される高額機能。初回ブロックアクセス時の遅延を解消する用途",
      "完全無料の機能",
      "Spot Snapshot 専用",
      "リージョン間で 1 回だけ有効"
    ],
    a: 0,
    explain: "FSR は『DSU-hour』単位課金 (1 AZ あたり時間料金 + スナップショット数)。常時 ON だと月数万円〜数十万円になることもある。必要な時間帯だけ有効化推奨。"
  },

  // ===== 容量増減 / オーファン =====
  { id: "ebs-130", topic: "ebs", type: "single", difficulty: 1,
    q: "EC2 を terminate した後にデータ用 EBS を消し忘れた。料金はどうなるか。",
    choices: [
      "アタッチされていなくても容量 × 時間で課金され続ける",
      "アタッチされていない EBS は無料",
      "30 日後に自動削除",
      "AWS が自動で停止"
    ],
    a: 0,
    explain: "未アタッチ EBS も容量料金が発生し続ける。Trusted Advisor / Cost Explorer / Resource Explorer 等で定期的に棚卸しを。"
  },
  { id: "ebs-131", topic: "ebs", type: "single", difficulty: 2,
    q: "「使用率の低い EBS ボリューム」を検出する AWS サービスの組み合わせとして最も標準的なのは？",
    choices: [
      "AWS Compute Optimizer (EBS の推奨) + AWS Trusted Advisor (アイドル EBS)",
      "AWS CloudTrail のみ",
      "AWS Resource Groups のみ",
      "AWS Backup のみ"
    ],
    a: 0,
    explain: "Compute Optimizer は EBS のリサイズ / タイプ変更を提案。Trusted Advisor のコストカテゴリでもアイドル EBS / 過剰プロビジョンを検出。両方併用が標準。"
  },
  { id: "ebs-132", topic: "ebs", type: "single", difficulty: 2,
    q: "Snapshot から作成した AMI を削除した後に「孤児スナップショット (orphaned)」が残ることがある。これを見つける王道のやり方は？",
    choices: [
      "Snapshot 一覧で『AMI ID なし & 説明文に Created by CreateImage を含むが AMI 自体が存在しない』ものを抽出",
      "AWS Cost Explorer で AMI 名で絞る",
      "Auto Scaling Group 一覧から探す",
      "RDS スナップショットと突き合わせる"
    ],
    a: 0,
    explain: "AWS CLI で snapshot description を見れば AMI 経由かが分かる。AMI deregister 後に放置されたスナップショットがコスト無駄として残りやすい。"
  },

  // ===== 計算系 =====
  { id: "ebs-140", topic: "ebs", type: "fill", numeric: true, difficulty: 2,
    q: "gp3 ストレージ単価をおおむね $0.08/GB-月 と仮定する。100 GB の gp3 を 1 ヶ月維持した場合の容量料金は何ドルか (整数で)。",
    a: 8, tolerance: 0.5,
    explain: "100 × 0.08 = $8/月。追加 IOPS / スループットを設定しなければ容量料金のみ。"
  },
  { id: "ebs-141", topic: "ebs", type: "fill", numeric: true, difficulty: 2,
    q: "同じ条件で gp2 ストレージ単価を $0.10/GB-月 とした場合、100 GB gp2 と 100 GB gp3 の差額は何ドル/月か (整数で)。",
    a: 2, tolerance: 0.5,
    explain: "gp2: 100 × 0.10 = $10、gp3: 100 × 0.08 = $8。差額 $2/月。gp3 移行で 20% 削減。"
  },
  { id: "ebs-142", topic: "ebs", type: "fill", numeric: true, difficulty: 3,
    q: "gp3 に対し 1000 IOPS 分のみ追加した場合の追加料金を概算する。1 IOPS あたり概ね $0.005/月で計算した場合の月額は何ドルか (整数で)。",
    a: 5, tolerance: 0.5,
    explain: "1000 × 0.005 = $5/月。スループット追加 (1 MB/s あたり概ね $0.04/月) も同様に独立加算。"
  },

  // ===== ボリュームの細部 =====
  { id: "ebs-150", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS の「プロビジョンドサイズ vs 実使用」の関係として正しいものは？",
    choices: [
      "EBS はプロビジョン (確保) した容量に対して課金される (中身が空でも同じ)",
      "実使用分だけ課金",
      "中身が空なら無料",
      "圧縮されて課金"
    ],
    a: 0,
    explain: "EBS は確保した容量 × 時間。RDS のストレージもアロケート (確保) ベース。中身が空でも課金される点に注意。"
  },
  { id: "ebs-151", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS は AZ 単位のリソースである。料金面で気をつけるべきは？",
    choices: [
      "別 AZ に EBS は移動できず、スナップショット経由で複製を作る必要がある。複製は新たな EBS として課金",
      "EBS は AZ 横断で 1 つを 2 AZ から使える",
      "EBS は無料で AZ コピーできる",
      "リージョン横断で透過にアクセスできる"
    ],
    a: 0,
    explain: "EBS は AZ 固定。Multi-AZ 化したい時はスナップショットから別 AZ にボリュームを作る (2 つの EBS 課金)。Multi-Attach は同 AZ 限定。"
  },
  { id: "ebs-152", topic: "ebs", type: "single", difficulty: 1,
    q: "オンデマンド EC2 を稼働させずに EBS を維持し続けるだけのコストは？",
    choices: [
      "ボリュームの GB × 時間料金で発生し続ける",
      "アンマウント中は無料",
      "EC2 が起動している時間のみ課金",
      "AWS が 7 日で自動削除"
    ],
    a: 0,
    explain: "EBS は EC2 の稼働状態に関係なく『存在している限り』課金。停止しても削除しない限り料金が止まらない。"
  },

  // ===== シナリオ的細部 =====
  { id: "ebs-160", topic: "ebs", type: "single", difficulty: 2,
    q: "Snapshot の保管料は GB あたり何ベースで決まるか。",
    choices: [
      "リージョン × GB-month (各リージョンの単価で月次計算)",
      "AZ × GB-month",
      "1 スナップショットあたり固定",
      "EC2 インスタンス時間に比例"
    ],
    a: 0,
    explain: "スナップショットはリージョン単位で料金 (GB-month)。クロスリージョンコピーすると別リージョンでも料金が発生。"
  },
  { id: "ebs-161", topic: "ebs", type: "single", difficulty: 2,
    q: "あるアプリの EBS スナップショットを毎日取得し 30 世代保持している。1 年保持に変更した場合、料金はどうなる可能性が高いか。",
    choices: [
      "保持本数が増えるほど依存ブロック解放が遅くなり、料金は単純に世代数倍にはならないが増える傾向",
      "保持本数を増やしても料金は変わらない",
      "10 倍の料金になる",
      "保管期間が長いほど自動的に割引"
    ],
    a: 0,
    explain: "スナップショットは増分式だが、保持本数が増えると古いブロックの解放が起きにくくなる。実コストは『日々の変更ブロック量 × 保持期間』に近づく。Snapshot Archive 階層を検討。"
  },
  { id: "ebs-162", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS スナップショットの保管料を抑える最初のアクションとして妥当でないものはどれか。",
    choices: [
      "EC2 を Reboot する",
      "DLM で保持世代数を見直す",
      "古い AMI を deregister + スナップショットも削除",
      "長期保管対象を Snapshot Archive に移行"
    ],
    a: 0,
    explain: "Reboot はスナップショットコストと無関係。DLM 整理 / 孤児スナップショット削除 / Archive 移行 が王道。"
  },
  { id: "ebs-163", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS の I/O 操作 (リクエスト) に対して別途課金されるか。",
    choices: [
      "gp2 / gp3 / io1 / io2 などのプロビジョン型 SSD では I/O 操作ごとの追加課金はない (※プロビジョンドリソースとして I/O 能力を確保するため)。HDD はリージョンや種類によりプロビジョン課金構造が異なる",
      "全 EBS タイプで I/O 1 回ごとに課金",
      "gp3 のみ I/O ごとに $0.05",
      "Spot 専用 EBS のみ無料"
    ],
    a: 0,
    explain: "EBS 課金は『容量 + プロビジョンドリソース (IOPS / スループット)』。S3 のようなリクエスト課金はない (※Aurora の場合は I/O 課金がある、これはスコープ外)。"
  },
  { id: "ebs-164", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS Direct API (Snapshot 直接読み書き) の課金は？",
    choices: [
      "ListChangedBlocks / ListSnapshotBlocks / GetSnapshotBlock などの API 呼び出しと転送に対し従量課金",
      "完全無料",
      "EC2 を起動している間のみ無料",
      "AWS Backup ユーザは無料"
    ],
    a: 0,
    explain: "EBS Direct API はバックアップ製品が増分スナップショットを直接読み書きする API。API コール数と転送に従量課金。"
  },
  { id: "ebs-165", topic: "ebs", type: "single", difficulty: 2,
    q: "Snapshot Lock (スナップショットロック) を有効にした場合の課金は？",
    choices: [
      "ロックそのものに追加料金はないが、ロックされたスナップショットは保持され続けるためその保管料が発生",
      "ロック時に一括前払い",
      "ロックで保管料が半額になる",
      "ロックは Spot Snapshot 限定"
    ],
    a: 0,
    explain: "Snapshot Lock は WORM (Write Once Read Many) 機能で誤削除/改竄を防ぐ。料金そのものは追加でなく、長期保管分が継続して発生する点に注意。"
  },
  { id: "ebs-166", topic: "ebs", type: "single", difficulty: 1,
    q: "EBS Snapshot からの「ボリューム作成」操作自体の料金は？",
    choices: [
      "操作自体は無料。作成された EBS の容量課金は発生する",
      "操作ごとに $1",
      "ボリューム作成は不可",
      "Spot EBS としてしか作れない"
    ],
    a: 0,
    explain: "Snapshot からの Volume 作成は無料。作られた EBS の容量・IOPS 料金は通常通り発生。初回読み込み時はバックエンドから取得するため一時的に I/O 遅延がある (FSR で軽減)。"
  },
  { id: "ebs-167", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS のスループット課金が「ベースラインに含まれていない」のはどのボリュームタイプか。",
    choices: [
      "gp2 (容量に応じた性能特性で個別のスループットプロビジョンは存在しない)",
      "gp3",
      "io2 Block Express",
      "全タイプとも別建て"
    ],
    a: 0,
    explain: "gp2 は容量で性能が一意に決まる構造でスループット単独設定は不可。gp3 / io2 系は IOPS / スループットを独立に設定できる。"
  },

  // ===== 細かい挙動 =====
  { id: "ebs-170", topic: "ebs", type: "single", difficulty: 3,
    q: "Snapshot の『Owner: amazon』(公開スナップショット) を自アカウントにコピーした場合の課金は？",
    choices: [
      "コピー先アカウントで通常のスナップショット保管料が発生",
      "Amazon 提供のため無料",
      "コピー時に EC2 オンデマンド料金が発生",
      "リージョン間転送のみ無料"
    ],
    a: 0,
    explain: "他者所有スナップショットを参照だけしているうちは課金されないが、自アカウントにコピーすれば自アカウントの容量課金が始まる。"
  },
  { id: "ebs-171", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS の暗号化を後から「無効化」したいときの最も確実な方法は？",
    choices: [
      "スナップショットを別アカウント or 別キー扱いで作り直し、暗号化なしの新ボリュームに復元 (タイプ・サイズも見直し可能)",
      "EBS の設定画面でチェックを外すだけ",
      "AWS Support に依頼すれば無料で切り替え",
      "リブートだけで反映"
    ],
    a: 0,
    explain: "EBS 暗号化はボリューム属性。直接の切替不可。スナップショット経由で新ボリューム化し、用途に応じてリストアする。コスト的にもスナップショット保管・転送料が一時的に増える。"
  },
  { id: "ebs-172", topic: "ebs", type: "single", difficulty: 2,
    q: "リージョンのデフォルト暗号化 (Encryption by default) を有効にすると、料金面の変化は？",
    choices: [
      "EBS 自体は変わらない。KMS の API 課金や CMK の月額料金が発生する場合がある",
      "EBS 容量料金が 10% 増",
      "Snapshot 料金が無料化",
      "EIP が無料化"
    ],
    a: 0,
    explain: "AWS Owned Key 利用なら追加なし。Customer Managed Key (CMK) を使うとキーの月額 $1 + API リクエスト課金 ($0.03/10000) が発生し得る。"
  },
  { id: "ebs-173", topic: "ebs", type: "single", difficulty: 2,
    q: "EBS のスループット最適化 HDD (st1) を Web サーバの OS ディスクとして使えるか。",
    choices: [
      "ブートディスクとしては使用できない",
      "問題なく使える",
      "Windows なら使える",
      "Spot 専用なら使える"
    ],
    a: 0,
    explain: "st1 / sc1 は HDD でブート不可。Boot は SSD 系 (gp2/gp3/io1/io2)。"
  },
  { id: "ebs-174", topic: "ebs", type: "multi", difficulty: 3,
    q: "EBS コスト最適化の代表的なアクションを 2 つ以上選べ。",
    choices: [
      "gp2 を gp3 に切り替える",
      "孤児スナップショット / 未使用ボリュームを定期的に削除する",
      "長期保管のスナップショットを Snapshot Archive に移す",
      "全 EBS を Multi-AZ 化する"
    ],
    a: [0, 1, 2],
    explain: "Multi-AZ 化は EBS では基本『AZ 間複製』として 2 倍課金になるためコスト最適化の打ち手ではない (要件で必要なら別議論)。gp3 切替 / 棚卸し / Archive 移行 は鉄板施策。"
  }
);
