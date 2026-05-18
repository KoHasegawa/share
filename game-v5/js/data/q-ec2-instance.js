/* EC2 インスタンス選定 — 50+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== ファミリ基礎 =====
  { id: "ec2i-001", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "EC2 の汎用ファミリで「t / m」を比較したとき正しい説明は？",
    choices: [
      "t 系はバーストCPU でベースライン以下なら低価格。m 系はベースライン固定で常時 100% に近い CPU が使える",
      "t 系のほうがベースライン CPU が常に高い",
      "m 系はバーストできないため t 系より高い",
      "両者は同じ性能特性"
    ],
    a: 0,
    explain: "t (burstable) は普段 CPU を抑え、必要時にクレジットを消費してバースト。m (general purpose) は常時定格 CPU。継続的に高 CPU が必要なら m、普段は低い負荷なら t。"
  },
  { id: "ec2i-002", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "コンピュート最適化、メモリ最適化、ストレージ最適化の代表的なファミリの組み合わせとして正しいものは？",
    choices: [
      "c / r / i (または d)",
      "c / m / t",
      "r / t / x",
      "m / x / d"
    ],
    a: 0,
    explain: "c = Compute Optimized (高 CPU)、r = Memory Optimized (RAM 多め)、i / d = Storage Optimized (NVMe / HDD 大容量)。x もメモリ特化。"
  },
  { id: "ec2i-003", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "m5.large の vCPU と RAM の比率の基準は？",
    choices: [
      "1 vCPU あたり 4 GiB",
      "1 vCPU あたり 2 GiB",
      "1 vCPU あたり 8 GiB",
      "1 vCPU あたり 16 GiB"
    ],
    a: 0,
    explain: "m 系 (汎用) は概ね 1 vCPU : 4 GiB の比。c 系は 1 : 2、r 系は 1 : 8、x 系は 1 : 16 以上。比に対してアプリ要件が偏っていれば別ファミリへ。"
  },
  { id: "ec2i-004", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "あるアプリが「メモリ多く CPU は少なめ」で動く。コスト最適化として最も妥当な選択は？",
    choices: [
      "r 系 (1 vCPU:8 GiB)",
      "c 系 (1 vCPU:2 GiB)",
      "t 系の最小サイズに無理矢理載せる",
      "Dedicated Host を確保する"
    ],
    a: 0,
    explain: "メモリ多めなら r 系。c 系を増やしてメモリを稼ぐと CPU が過剰でコスト無駄。比率に合わせたファミリ選択は重要。"
  },
  { id: "ec2i-005", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 ファミリにおける数字 (例: m5, m6i, m6g) の意味として正しいものは？",
    choices: [
      "数字は世代を示し、新しい世代ほど性能/価格比が良い傾向にある",
      "数字はリージョン番号",
      "数字は AZ 番号",
      "数字は CPU コア数"
    ],
    a: 0,
    explain: "m5 → m6i → m7i のように世代が上がるほど価格対性能が改善する傾向。'i' は Intel, 'a' は AMD, 'g' は AWS Graviton (ARM)。"
  },
  { id: "ec2i-006", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "サフィックス `g` (例: m6g) と `i` (例: m6i)、`a` (例: m6a) のプロセッサベンダの違いは？",
    choices: [
      "g = AWS Graviton (ARM)、i = Intel、a = AMD",
      "g = Google、i = Intel、a = Apple",
      "g = General、i = Intensive、a = Advanced",
      "g = Graphics、i = Intel、a = AWS"
    ],
    a: 0,
    explain: "g: Graviton (ARM)、i: Intel、a: AMD。Graviton は同等性能で 20% 程度安く、エネルギー効率も良い。ARM 対応が確認できるアプリは Graviton 化で削減効果大。"
  },
  { id: "ec2i-007", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "AWS Graviton インスタンスをコスト最適化目線で導入する代表的なメリットは？",
    choices: [
      "概ね 20% 程度オンデマンド料金が下がる + 電力効率良好",
      "Windows ライセンスが無料",
      "RI / SP の割引率が常に倍になる",
      "リージョン間データ転送が無料になる"
    ],
    a: 0,
    explain: "Graviton はオンデマンドで Intel/AMD 比 20% 程度安いことが多い。アプリの ARM 対応が前提。Java / Python / Node など主要言語は対応進んでおり移行ハードルは下がっている。"
  },
  { id: "ec2i-008", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "次のうち Graviton 移行の前提条件として「最も重要」なものは？",
    choices: [
      "アプリケーション / ミドルウェアが ARM (aarch64) で動作すること",
      "AWS Organizations を有効化していること",
      "Multi-AZ にしていること",
      "Reserved Instance を購入していること"
    ],
    a: 0,
    explain: "Graviton は ARM アーキ。x86 専用バイナリ (商用エージェント / 古い C++ ライブラリ等) があると動かない。事前に検証必須。"
  },

  // ===== T 系バーストの詳細 =====
  { id: "ec2i-010", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "T 系バーストインスタンスの「ベースライン CPU」とは何か。",
    choices: [
      "CPU クレジットを消費せずに継続的に使える CPU 性能の割合",
      "起動直後の CPU 使用率",
      "AZ 内の CPU 上限",
      "vCPU 数の半分"
    ],
    a: 0,
    explain: "ベースラインを下回る CPU 使用率の時間にクレジットが貯まり、それを超える瞬発的な負荷でクレジットを消費する。t3.micro なら ベースライン約 20%/vCPU。"
  },
  { id: "ec2i-011", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "T3 / T3a / T4g 系の「Unlimited モード」と「Standard モード」のコスト面の違いは？",
    choices: [
      "Unlimited は CPU クレジット切れでもバースト可能だが超過分は時間あたりの追加料金。Standard はクレジット切れでベースラインまで自動でスロットル",
      "Unlimited は無料、Standard は有料",
      "両者の挙動は同じ",
      "Unlimited は Spot 専用"
    ],
    a: 0,
    explain: "Unlimited (デフォルト): 24h 平均でクレジット内ならタダ、超過分は追加料金。Standard: クレジット切れたらベースラインに張り付き、追加料金なし。高 CPU が断続的に必要なら Unlimited、コスト上限を強く絞りたいなら Standard。"
  },
  { id: "ec2i-012", topic: "ec2-instance", type: "multi", difficulty: 2,
    q: "T 系インスタンスを 24h 稼働させる場合に「不適切な使い方」を 2 つ以上選べ。",
    choices: [
      "常時 CPU 80% を超えるワークロードを T3 Unlimited で運用 (常時超過料金が発生)",
      "常時 CPU 5% 程度の Web 管理画面を t3.micro で動かす",
      "常時高負荷バッチを t3.small Standard で動かす (クレジット切れで遅延)",
      "Auto Scaling で複数台を冗長化する"
    ],
    a: [0, 2],
    explain: "T 系は『たまにバースト』向け。常時高負荷は Unlimited の超過課金で結局 m/c より高くなる、または Standard でスロットルされ性能不足になる。常時高負荷なら m / c に。"
  },
  { id: "ec2i-013", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "CPU クレジットは最大で何時間分まで貯められるか (T3 系の例)。",
    choices: [
      "24 時間分のクレジットを上限に貯められる",
      "1 時間分まで",
      "48 時間分まで",
      "上限なし"
    ],
    a: 0,
    explain: "T3 系は 24 時間分の CPU クレジットを蓄積上限とする。T2 は世代ごとに上限が異なり (例: t2.micro は 288 = 24h 分相当)。古い T2 起動クレジットの仕様もあったが今はあまり気にしない。"
  },
  { id: "ec2i-014", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "T 系 Unlimited で CPU 超過分が課金されるとき、典型的な単価の単位は？",
    choices: [
      "vCPU 時間あたり追加料金",
      "GB あたり",
      "リクエストあたり",
      "ストレージ GB あたり"
    ],
    a: 0,
    explain: "vCPU 時間あたりの追加料金 (例: Linux で $0.05/vCPU-hour 前後)。CloudWatch の CPUSurplusCreditsCharged を監視すると過剰使用を検知できる。"
  },

  // ===== サイズの倍率 =====
  { id: "ec2i-020", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "m5.large から m5.xlarge にサイズアップしたとき、オンデマンド料金は概ね何倍になるか。",
    choices: ["2 倍", "1.5 倍", "4 倍", "等倍"],
    a: 0,
    explain: "EC2 は同一ファミリ内でサイズが 1 段階上がるとリソース・料金とも約 2 倍。例: m5.large → m5.xlarge → m5.2xlarge → m5.4xlarge。"
  },
  { id: "ec2i-021", topic: "ec2-instance", type: "fill", numeric: true, difficulty: 2,
    q: "m5.2xlarge は m5.large に対して概ね何倍の料金か (整数で)。",
    a: 4, tolerance: 0,
    explain: "large → xlarge → 2xlarge と 2 段階上がるので 2 × 2 = 4 倍。RAM・vCPU・料金とも基本的にこの倍率。"
  },
  { id: "ec2i-022", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "「大きいインスタンス 1 台」と「半分のサイズ 2 台」を比較したとき、オンデマンド料金は？",
    choices: [
      "ほぼ同じ (vCPU/RAM 合計が同じため)",
      "大きい 1 台のほうが安い",
      "小さい 2 台のほうが安い",
      "リージョンによって全く異なる"
    ],
    a: 0,
    explain: "倍々の倍率なので vCPU・RAM 合計が同じなら時間料金もほぼ同じ。ただし冗長性 (2 台のほうが SPOF 回避) や OS ライセンス費 (Windows は台数課金) の差はある。"
  },

  // ===== Tenancy =====
  { id: "ec2i-030", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Default tenancy と Dedicated tenancy の料金差として正しいものは？",
    choices: [
      "Dedicated は割増料金 + 物理サーバ共有なし",
      "Dedicated のほうが安い",
      "Default は AZ 単位課金、Dedicated はリージョン単位課金",
      "Default と Dedicated は同額"
    ],
    a: 0,
    explain: "Dedicated Instance / Host は物理サーバ専有のため割増。要件 (規制 / BYOL) がなければ default が安い。"
  },
  { id: "ec2i-031", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "VPC のデフォルトテナンシー設定を「dedicated」にしてしまったときの問題は？",
    choices: [
      "その VPC で起動する全インスタンスが Dedicated Instance になり料金が上がる",
      "リージョン外に起動できない",
      "Spot 起動が無料になる",
      "S3 アクセスが遅くなる"
    ],
    a: 0,
    explain: "VPC のデフォルトテナンシーが dedicated になっていると、明示的に default を指定しない限り全インスタンスが Dedicated 課金に。意図しない時はトラブルのもと。"
  },

  // ===== サイズ選定 / Right-Sizing =====
  { id: "ec2i-040", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の Right-Sizing 推奨を出してくれる AWS の標準サービスは？",
    choices: [
      "AWS Compute Optimizer",
      "AWS Health Dashboard",
      "AWS Trusted Advisor (Core)",
      "AWS CloudTrail"
    ],
    a: 0,
    explain: "Compute Optimizer は CloudWatch メトリクスから機械学習で EC2 / EBS / Lambda / ASG のリサイズ案を提示。無料で使える基本機能。"
  },
  { id: "ec2i-041", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "Right-Sizing で CloudWatch の標準メトリクスだけでは判断しにくいリソースは？",
    choices: [
      "メモリ使用率 (CloudWatch Agent のインストールが必要)",
      "CPU 使用率",
      "ネットワーク Throughput",
      "ディスク IOPS (EBS メトリクスから取得可能)"
    ],
    a: 0,
    explain: "メモリと、Linux のディスク使用率 (file system level) は CloudWatch 標準では収集されない。CloudWatch Agent を導入してカスタムメトリクスとして取る必要がある。"
  },
  { id: "ec2i-042", topic: "ec2-instance", type: "multi", difficulty: 2,
    q: "EC2 の「過剰サイズ」を発見するために有効な指標を 2 つ以上選べ。",
    choices: [
      "CPU 使用率が長期間 10% 未満",
      "メモリ使用率が常時 30% 未満 (CloudWatch Agent で取得)",
      "起動からの経過時間",
      "AMI のサイズ"
    ],
    a: [0, 1],
    explain: "CPU / メモリ / ネットワーク / EBS IOPS の利用率が継続的に低ければサイズダウン候補。経過時間や AMI サイズは過剰サイズの判定には無関係。"
  },
  { id: "ec2i-043", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Right-Sizing 後に Reserved Instance / SP を購入する順序が推奨される理由は？",
    choices: [
      "過剰サイズのまま RI/SP を買うと、後でサイズダウンしても割引が無駄になる可能性があるため",
      "RI は後からしか買えないため",
      "AWS の請求書がリサイズ先の値で出ないため",
      "順序は関係ない"
    ],
    a: 0,
    explain: "サイズダウン前に大きいインスタンス向けに RI/SP を買うと、減らした分の割引が使われずに余る。リサイズ → 安定運用 → コミットメント、が王道。"
  },

  // ===== 世代切替 =====
  { id: "ec2i-050", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "m4 → m5 → m6i といった世代更新の典型的なメリットは？",
    choices: [
      "同価格〜やや安い価格でより高い性能 (価格性能比の向上)",
      "古い世代の方が安い",
      "新しい世代は Spot にしか使えない",
      "新しい世代は Multi-AZ 必須"
    ],
    a: 0,
    explain: "世代を上げると価格性能比が改善する傾向。同じ料金で速くなる、または同じ性能で安くなる。RHEL / Windows の OS ライセンス料金は別途固定なのでむしろ世代を上げる利点が大きいことも。"
  },
  { id: "ec2i-051", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "古い世代の RI を持っているが、新世代に移行したい。Standard RI でできる最も近い対応は？",
    choices: [
      "Marketplace で旧 RI を売却し、新世代向けに新規購入",
      "Standard RI でもファミリ・世代変更は自由",
      "AWS Support に申請すれば交換可能",
      "Convertible に途中変更してから交換"
    ],
    a: 0,
    explain: "Standard RI は世代変更不可。Marketplace 売却を試す or 期間満了まで持つ、または新規 SP に切り替える。Convertible RI なら交換可能。"
  },

  // ===== EBS / IO の考慮 =====
  { id: "ec2i-060", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 のインスタンスタイプによって「EBS 最適化 (EBS-optimized)」がデフォルト有効/無効が変わる。料金面で正しい説明は？",
    choices: [
      "新世代の多くは EBS 最適化がデフォルト有効で追加料金は不要",
      "EBS 最適化は常に追加料金が発生する",
      "EBS 最適化は Spot では使えない",
      "EBS 最適化は Multi-AZ 必須"
    ],
    a: 0,
    explain: "m5 以降など新世代は EBS 最適化がデフォルト有効・追加料金なし。旧世代では追加料金がかかる場合があった。"
  },
  { id: "ec2i-061", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Local NVMe ストレージ付きの i / d / x2i 系の「ローカル NVMe」と EBS の費用面の違いは？",
    choices: [
      "ローカル NVMe はインスタンス料金に込み (停止/終了で消える) / EBS は別料金で永続",
      "ローカル NVMe は EBS と同じく永続的に課金",
      "ローカル NVMe は EBS より高価",
      "ローカル NVMe は AWS S3 と同じ料金体系"
    ],
    a: 0,
    explain: "Instance Store はインスタンス料金に含まれ、永続性はない (停止で消える)。EBS は別料金で永続。データを残す必要があるなら EBS、消える前提でディスク特化型なら i / d 系のローカル NVMe を活用するとコスト効率が良い。"
  },

  // ===== Hibernate / Sleep =====
  { id: "ec2i-070", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の Hibernate 機能を使うとき、コスト面で注意すべきことは？",
    choices: [
      "RAM 状態を root EBS に書き戻すため、RAM サイズ分の EBS 容量が必要 + EBS は停止中も課金",
      "Hibernate は完全無料",
      "EBS は不要",
      "EIP が無料になる"
    ],
    a: 0,
    explain: "Hibernate は OS の状態を root EBS に保存。停止中もそのストレージは課金され続ける。1 ヶ月以上の長期停止なら、AMI を取って Terminate するほうが安いこともある。"
  },

  // ===== OS / ライセンス =====
  { id: "ec2i-080", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "AWS Marketplace 経由の有償 AMI を使うとき、料金は AWS の請求書に統合されるか別請求か。",
    choices: [
      "Marketplace 料金は AWS 請求書に統合される (購入者の AWS アカウントへ請求)",
      "別途クレジットカードに直接請求",
      "AMI ベンダから別請求書が郵送",
      "AWS 内利用なら一切無料"
    ],
    a: 0,
    explain: "Marketplace の従量料金 / 月額料金は AWS の通常請求に統合される。コスト割り当てタグや CUR でも追跡可能。"
  },
  { id: "ec2i-081", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Windows EC2 と Linux EC2 で「インスタンス時間料金」が同じファミリ・サイズでも違う主な理由は？",
    choices: [
      "Windows には Microsoft への OS ライセンス料金が乗っているから",
      "Windows のほうがメモリを多く使うから",
      "AWS が Windows の保守を提供するから",
      "Windows は Multi-AZ 必須だから"
    ],
    a: 0,
    explain: "Windows / RHEL / SLES は OS / 追加 SW のライセンス料が時間あたりに乗っている。Linux と比べて 10〜30% 程度高くなる。Windows は秒単位課金もない (時間単位)。"
  },

  // ===== ASG / 自動化 =====
  { id: "ec2i-090", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Auto Scaling Group そのものの料金は？",
    choices: [
      "ASG 自体は無料 (起動された EC2 / EBS / ELB / CloudWatch 等が課金対象)",
      "ASG は月額固定料金",
      "ASG は ASG 数 × $5/月",
      "ASG はインスタンス数 × $0.005/h"
    ],
    a: 0,
    explain: "ASG は無料。コストはあくまでスケールアウトで増えた EC2・EBS・ELB に乗る。スケジュールスケーリングで夜間台数を絞れば月額削減効果は大きい。"
  },
  { id: "ec2i-091", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Mixed Instances Policy (ASG) でコスト最適化に有効な使い方は？",
    choices: [
      "オンデマンド最小ベースラインを確保しつつ、Spot を組み合わせて平均コストを下げる",
      "Spot 100% にすれば常に最安",
      "オンデマンド 100% にしても効果がある",
      "Reserved Instance 100% で組む"
    ],
    a: 0,
    explain: "ASG の Mixed Instances Policy はオンデマンド + Spot を比率で混在可能。サービス継続性は最低オンデマンドで確保、変動分を Spot で安価に。"
  },
  { id: "ec2i-092", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "ASG のスケジュールスケーリングで「夜間と土日のみ容量を半分」にするのが向いている用途は？",
    choices: [
      "業務時間中心の社内 Web ツール",
      "24h 全世界相手の SaaS フロントエンド",
      "数秒で完了するバッチ",
      "夜間の方が利用が増えるサービス"
    ],
    a: 0,
    explain: "曜日・時間帯で利用が読めるサービスでは予測スケジューリングが効く。Predictive Scaling は機械学習で自動予測してくれる。"
  },

  // ===== HW詳細 =====
  { id: "ec2i-100", topic: "ec2-instance", type: "single", difficulty: 3,
    q: "Nitro Hypervisor / Nitro System の特徴をコスト面で最も適切に説明したものは？",
    choices: [
      "オーバーヘッドが小さく、新世代 (m5/c5 以降) は性能 / 価格比が改善している",
      "全リソースが従量課金になる",
      "EBS が無料になる",
      "Nitro は Dedicated Host 限定"
    ],
    a: 0,
    explain: "Nitro System はハイパーバイザの軽量化、専用ハードウェア (Nitro Card) でネットワーク / EBS をオフロード。世代更新の性能向上の核。"
  },

  // ===== 各種詳細 =====
  { id: "ec2i-110", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Burstable Instance (T3/T3a/T4g) の Unlimited / Standard モード切り替えは可能か。",
    choices: [
      "起動後でも切り替え可能",
      "起動時にしか選べない",
      "Standard から Unlimited のみ可能",
      "Unlimited から Standard のみ可能"
    ],
    a: 0,
    explain: "Unlimited / Standard は実行中のインスタンスでも変更可能。コスト監視の結果に応じて切替で運用できる。"
  },
  { id: "ec2i-111", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "T2 系と T3 系で挙動・コスト面の違いとして正しいものは？",
    choices: [
      "T3 は Nitro ベースで EBS スループット改善 + Unlimited がデフォルト。T2 は旧世代でデフォルト Standard",
      "T3 は Spot 限定",
      "T3 は Multi-AZ 必須",
      "T2 のほうが新しい"
    ],
    a: 0,
    explain: "T3 系は Nitro ベース。Unlimited がデフォルト (T2 は Standard デフォルト)。性能・コスト効率とも T3 / T3a / T4g のほうが優れる。"
  },
  { id: "ec2i-112", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "t3.micro と t3a.micro のコスト面の違いは？",
    choices: [
      "t3a は AMD ベースで t3 (Intel) より概ね 10% 程度安い",
      "両者は同価格",
      "t3a は Spot 専用",
      "t3a は Windows 専用"
    ],
    a: 0,
    explain: "t3a (AMD EPYC) は同性能で約 10% 安い。互換性が問題なければ t3 → t3a で削減可能。"
  },
  { id: "ec2i-113", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "t4g.micro はどのプロセッサベースか。",
    choices: ["AWS Graviton2 (ARM)", "Intel Xeon", "AMD EPYC", "Apple Silicon"],
    a: 0,
    explain: "t4g は Graviton2 ベース。t3 比で約 20% 安い。ARM 対応アプリなら最有力の小型ファミリ。"
  },
  { id: "ec2i-114", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "t4g 系インスタンスは特定の期間「無料トライアル」が提供されたが、現在は？",
    choices: [
      "通常課金 (フリートライアルは 2023 年に終了)",
      "現在も全リージョンで無料",
      "1 ヶ月だけ無料",
      "東京リージョンでは依然無料"
    ],
    a: 0,
    explain: "t4g.small の 750h / 月 無料 (2021〜2023) は終了。現在は通常課金。Graviton 移行検討時の検証コストは別途見積もる。"
  },

  // ===== コア数 / ハイパースレッディング =====
  { id: "ec2i-120", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の Optimize CPUs 機能でコスト面に効くケースとして適切なものは？",
    choices: [
      "コア課金ライセンス (Oracle DB EE BYOL など) で物理コア数を絞り、ライセンス本数を減らす",
      "EC2 オンデマンド料金が下がる",
      "EBS 料金が下がる",
      "ネットワーク帯域が下がる"
    ],
    a: 0,
    explain: "Optimize CPUs で物理コア数 / スレッド数を減らせる。AWS 課金は変わらないが、コア課金ライセンスのコストを下げられる。"
  },

  // ===== その他 =====
  { id: "ec2i-130", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 で稼働する MySQL / PostgreSQL を、運用負荷とコストの観点で見直す場合、最初に検討すべき選択肢は？",
    choices: [
      "Amazon RDS への移行 (運用工数削減 / Multi-AZ など管理機能込み)",
      "S3 への移行",
      "DynamoDB への移行",
      "EBS のスナップショット停止"
    ],
    a: 0,
    explain: "DB 自己運用は OS / バックアップ / パッチ / レプリケーション運用にエンジニアコストがかかる。総コストでは RDS のほうが安いケースが多い。ただし RDS は OS への shell ログインがない等の制約あり。"
  },
  { id: "ec2i-131", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の AMI を新しいものに切り替える際にコスト関係で注意すべきは？",
    choices: [
      "古い AMI / スナップショットが残ると EBS スナップショット料金が積み上がる",
      "新 AMI は必ず Marketplace 経由",
      "AMI 切替で EC2 料金が上がる",
      "AMI は無料でいくつでも持てる"
    ],
    a: 0,
    explain: "AMI 自体は無料だが、AMI の中身 (スナップショット) は EBS Snapshot 料金がかかる。世代管理で古い AMI を捨てる仕組みが必要。"
  },
  { id: "ec2i-132", topic: "ec2-instance", type: "single", difficulty: 1,
    q: "EC2 を「終了して再起動」ではなく「停止して起動」する利点は？",
    choices: [
      "EBS / IP / インスタンス ID / プライベート IP が維持される",
      "オンデマンド料金が安くなる",
      "RI 割引が自動で当たる",
      "ライセンス料が変わる"
    ],
    a: 0,
    explain: "Stop/Start は同じインスタンスを止めて起動。Terminate は破棄。再起動目的なら Stop/Start のほうが状態保存され運用が楽。"
  },
  { id: "ec2i-133", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "停止しても EBS は課金されることへの対策として「最も削減効果が大きい」のは？",
    choices: [
      "長期停止する EC2 は AMI を取って Terminate し、EBS を消す",
      "停止後すぐに Start し直す",
      "EBS を gp2 から io1 にする",
      "Multi-AZ にする"
    ],
    a: 0,
    explain: "1 ヶ月以上止める EC2 は、AMI 化して Terminate するのが現実的な節約。AMI のスナップショット料金は通常の EBS より安い (gp3 等の容量単価より低い)。"
  },

  // ===== ライセンス込みインスタンス =====
  { id: "ec2i-140", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "RHEL の EC2 料金には何が含まれるか。",
    choices: [
      "OS ライセンスと Red Hat サブスクリプション料金",
      "EBS ストレージ料金",
      "ELB 料金",
      "リージョン間データ転送"
    ],
    a: 0,
    explain: "AWS Marketplace 由来の RHEL/SLES は OS ライセンス + サブスクリプションを時間料金に含む。Amazon Linux は無料、必要なら yum でパッケージ追加。"
  },
  { id: "ec2i-141", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "Windows EC2 のコストを下げる現実的な選択肢として最初に考えるのは？",
    choices: [
      "可能なら Linux に移行 (アプリ依存の確認は必要)",
      "Windows のままで Dedicated Host を導入",
      "Windows ライセンスを別途購入する",
      "Spot で 24h 稼働させる"
    ],
    a: 0,
    explain: "Windows は OS ライセンス込みで割高。Linux 化が可能なら最大の削減。Linux 化が無理なら Reserved Instance / SP の長期コミットで割引、Mixed Instances Policy で柔軟性を確保。"
  },
  { id: "ec2i-142", topic: "ec2-instance", type: "single", difficulty: 3,
    q: "「License Mobility through Software Assurance」を活用した Windows BYOL は、どの EC2 オプションで実現するか。",
    choices: [
      "Dedicated Host (License Manager と組み合わせて管理)",
      "Default Tenancy で任意のホストに展開",
      "Spot Instance のみ",
      "Capacity Reservation"
    ],
    a: 0,
    explain: "Microsoft の License Mobility 規約で BYOL したい場合は Dedicated Host が必要 (Server / Core 単位のライセンス管理)。AWS License Manager で配賦を追跡する。"
  },

  // ===== その他細部 =====
  { id: "ec2i-150", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の「Stop → Start」を繰り返したときに変わる可能性のあるものは？",
    choices: [
      "Public IP (EIP を割り当てていない場合は再起動で変わる)",
      "インスタンス ID",
      "プライベート IP",
      "ENI の MAC"
    ],
    a: 0,
    explain: "EIP を付けていない場合の Public IP は Stop で解放、Start で別の IP に。プライベート IP / インスタンス ID / ENI MAC は維持される。"
  },
  { id: "ec2i-151", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 を「Reboot (再起動)」しても基本的に変わらないものは？",
    choices: [
      "Public IP / Private IP / インスタンス ID 全て同じ",
      "Public IP のみ変わる",
      "インスタンス ID が変わる",
      "EBS ボリュームが新規アタッチされる"
    ],
    a: 0,
    explain: "Reboot は OS レベルの再起動のみで AWS 側は連続稼働扱い。IP / ID / ストレージ全て維持。"
  },
  { id: "ec2i-152", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の OS パッチ適用や AMI 切替を強制するために停止→再起動する作業を「Reboot Type」のうち何と呼ぶか (AWS の指示する Maintenance Event 分類)。",
    choices: [
      "Reboot Required (System Reboot / Instance Reboot のスケジュール通知)",
      "Spot Interruption",
      "Stop Required",
      "Hibernation"
    ],
    a: 0,
    explain: "AWS が物理ホストのメンテナンスをするときに事前通知される Scheduled Event。System Reboot / Instance Reboot / Retirement などがある。コスト面では Retirement (廃止) で AMI 化と移行が必要になることがある。"
  },
  { id: "ec2i-153", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 インスタンスの Retirement (廃止) 予定が通知されたとき、料金面で取るべき最も無難な対応は？",
    choices: [
      "Stop / Start で別物理ホストに移し、必要なら新世代へリプレース検討",
      "終了して再構築",
      "そのまま放置",
      "Spot に切り替え"
    ],
    a: 0,
    explain: "Stop / Start で別ホストに移動 = 同じ EBS-backed インスタンスのまま物理ホストが変わる。料金面では同じだが、移し替えのタイミングで世代更新を検討するとさらに削減可能。"
  },
  { id: "ec2i-154", topic: "ec2-instance", type: "single", difficulty: 2,
    q: "EC2 の「インスタンスタイプ変更 (リサイズ)」操作のフローとして正しいものは？",
    choices: [
      "停止 → インスタンスタイプ変更 → 起動",
      "リブートだけでタイプ変更",
      "終了して別タイプで再作成のみ可能",
      "AWS Support に依頼"
    ],
    a: 0,
    explain: "EBS-backed なら Stop → Type 変更 → Start でリサイズ可能 (Convertible RI / Compute SP で割引は柔軟に追従)。Instance Store-only ではこのフロー不可。"
  },
  { id: "ec2i-155", topic: "ec2-instance", type: "single", difficulty: 3,
    q: "高 IOPS が必要なデータベースを EC2 + EBS で動かすとき、コスト最適化の判断軸として最初に確認すべきは？",
    choices: [
      "そもそも RDS / Aurora で同等性能を満たせないか (運用工数とトータルコスト比較)",
      "Spot 化",
      "Dedicated Host 化",
      "Public IPv4 を外す"
    ],
    a: 0,
    explain: "EC2 + EBS による DB 自己運用は IOPS / RAM チューニングに加え、バックアップ / DR / 監視のコストが大きい。要件が満たせるなら RDS / Aurora にしたほうが TCO が下がるケースが多い (今回スコープ外なので比較情報のみ)。"
  }
);
