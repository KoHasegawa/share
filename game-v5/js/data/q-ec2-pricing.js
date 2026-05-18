/* EC2 料金モデル — 60+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== On-Demand 基礎 =====
  { id: "ec2p-001", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 のオンデマンド料金は、Linux インスタンスでは何秒単位で課金されるか。",
    choices: ["1秒単位 (最小60秒)", "1分単位", "1時間単位 (端数切り上げ)", "1日単位"],
    a: 0,
    explain: "Linux/Ubuntu/Amazon Linux は秒単位課金で、最小利用時間は 60 秒。60 秒未満で停止しても 60 秒分は課金される。Windows と多くの商用 Linux (RHEL, SLES) は時間単位課金。"
  },
  { id: "ec2p-002", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "Windows の EC2 オンデマンドの課金単位は？",
    choices: ["秒単位 (最小60秒)", "1時間単位 (端数切り上げ)", "1分単位", "1日単位"],
    a: 1,
    explain: "Windows と RHEL/SLES などライセンス料込みの OS は時間単位課金。1 時間 1 分使えば 2 時間分課金される。Amazon Linux / Ubuntu などは秒単位。"
  },
  { id: "ec2p-003", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 インスタンスを「停止 (stop)」した状態で課金されるものはどれか。",
    choices: ["インスタンス時間料金", "EBS ボリュームのストレージ料金", "AMI のスナップショット料金とは別に EBS は課金されない", "停止中は全て無課金"],
    a: 1,
    explain: "停止中はインスタンス時間料金は止まるが、アタッチされている EBS は通常通り課金され続ける。さらに 2024 年 2 月以降は Elastic IP が紐づいていなくても Public IPv4 アドレスが課金対象。"
  },
  { id: "ec2p-004", topic: "ec2-pricing", type: "multi", difficulty: 2,
    q: "EC2 を「停止 (stop)」した時に課金が止まる/止まらない要素として正しいものを 2 つ以上選べ。",
    choices: [
      "インスタンス時間料金は停止する",
      "EBS ストレージ料金は停止する",
      "EBS ストレージ料金は引き続き発生する",
      "アタッチ済み EIP の料金は停止する"
    ],
    a: [0, 2],
    explain: "停止で止まるのは EC2 のインスタンス時間。EBS は付与されたままなので課金継続。EIP は停止インスタンスに紐づけていても 2024 年 2 月以降は課金対象 (Public IPv4 課金) になっている。"
  },
  { id: "ec2p-005", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 を「終了 (terminate)」した時、ルート EBS ボリュームはデフォルトでどうなるか。",
    choices: ["保持される", "削除される (DeleteOnTermination=true)", "スナップショット化されて保持", "断片化されて再利用"],
    a: 1,
    explain: "ルートボリュームはデフォルトで DeleteOnTermination=true。追加データボリュームはデフォルト false。残ったボリュームは課金対象なので、削除し忘れたボリュームのコスト無駄に注意。"
  },
  { id: "ec2p-006", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 を 1 ヶ月 (730h) 24h 連続で稼働させる場合、オンデマンドより明確に安くなる代表的な購入オプションは？",
    choices: ["Spot", "Reserved Instance / Savings Plans", "Dedicated Host", "Capacity Reservation"],
    a: 1,
    explain: "24h 連続稼働ではコミットメント型 (RI または SP) で割引が効く。Spot は安いが中断リスクがあり 24h 安定稼働には不向き。"
  },
  { id: "ec2p-007", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "On-Demand 料金は基本的に何を基準に決まるか (3 つ以上の代表要素)。",
    choices: [
      "リージョン / インスタンスタイプ / OS",
      "AWS Organizations の規模 / リージョン / OS",
      "前払いの有無 / インスタンスタイプ / リージョン",
      "Spot の市場価格 / OS / リージョン"
    ],
    a: 0,
    explain: "オンデマンド単価はリージョン × インスタンスタイプ × OS で決まる。前払いは RI/SP の概念。"
  },

  // ===== Reserved Instance =====
  { id: "ec2p-010", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 Standard RI と Convertible RI の最大の違いは？",
    choices: [
      "Standard はインスタンスファミリやサイズ等を変更できないが、Convertible は変更可能",
      "Standard は前払いができない",
      "Convertible は 1 年契約しか選べない",
      "Convertible は割引率が高い"
    ],
    a: 0,
    explain: "Standard RI はファミリ・OS・テナンシー等の属性が固定。Convertible RI は契約期間中に同等以上の値段に交換可能。割引率は Standard の方が高い (最大 72% vs Convertible 最大 66%)。"
  },
  { id: "ec2p-011", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "RI の契約期間は次のうちどれか。",
    choices: ["1年または3年", "1年のみ", "3年のみ", "6ヶ月または1年"],
    a: 0,
    explain: "RI は 1 年または 3 年。3 年の方が割引率が高い。Convertible は 3 年契約のときに変換の柔軟性メリットが最大化される。"
  },
  { id: "ec2p-012", topic: "ec2-pricing", type: "multi", difficulty: 2,
    q: "EC2 RI の支払いオプションを 2 つ以上選べ。",
    choices: ["All Upfront (全額前払い)", "Partial Upfront (一部前払い)", "No Upfront (前払いなし)", "Monthly Postpaid (後払い分割)"],
    a: [0, 1, 2],
    explain: "RI は全額前払い / 一部前払い / 前払いなし の 3 種類。全額前払いが最も割引率が高い。月次後払い分割は存在しない (利用分は通常の月次請求にまとまる)。"
  },
  { id: "ec2p-013", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI のスコープ (適用範囲) における Regional と Zonal の違いを正しく説明したものは？",
    choices: [
      "Regional はリージョン内のどの AZ にも適用でき、サイズ柔軟性も享受できる。Zonal は特定 AZ に固定されるがキャパシティ予約が伴う",
      "Regional は AZ 固定で安く、Zonal は柔軟",
      "Regional は Convertible 専用、Zonal は Standard 専用",
      "両者は同じで名称だけ違う"
    ],
    a: 0,
    explain: "Regional RI: 課金割引のみだが AZ 自由・サイズ柔軟性 (Linux/UNIX, default tenancy 条件) あり。Zonal RI: AZ 固定だがキャパシティ予約が付く (起動枠の確保)。"
  },
  { id: "ec2p-014", topic: "ec2-pricing", type: "multi", difficulty: 3,
    q: "RI のインスタンスサイズ柔軟性 (Instance Size Flexibility) が適用される条件として正しいものを全て選べ。",
    choices: [
      "OS が Linux/UNIX であること",
      "テナンシーが default であること",
      "Regional scope であること",
      "1 年契約であること"
    ],
    a: [0, 1, 2],
    explain: "サイズ柔軟性は (1) Linux/UNIX, (2) default tenancy, (3) Regional scope の 3 つを満たすと有効。期間 1/3 年は無関係。Windows や Dedicated tenancy では適用されない。"
  },
  { id: "ec2p-015", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI のサイズ柔軟性において m5.large 1台分の RI は、たとえば m5.xlarge を何台分カバーするか。",
    choices: ["1台分", "0.5台分", "2台分", "4台分"],
    a: 1,
    explain: "サイズ柔軟性は normalization factor で按分される。large = 4, xlarge = 8 ... に対応するので、m5.large 1 台分 (factor 4) は m5.xlarge (factor 8) の 0.5 台分をカバー。逆に m5.xlarge 1 台分は m5.large 2 台分をカバー。"
  },
  { id: "ec2p-016", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Convertible RI ができる「交換 (exchange)」のルールとして正しいものは？",
    choices: [
      "新しい RI の総支払い額が同等以上であれば、ファミリ・OS・テナンシー・支払い方式を変更可能",
      "新しい RI の総支払い額が同等以下であれば、ファミリ等を変更可能",
      "ファミリの変更は不可、サイズ・OS のみ変更可",
      "1 ヶ月に 1 度しか交換できない"
    ],
    a: 0,
    explain: "Convertible RI は契約期間中に何度でも交換できるが、交換後の総支払い額は元と同等以上である必要がある (安いものに換えて差額返金は不可)。"
  },
  { id: "ec2p-017", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI の Marketplace で売却可能なのはどの種類か。",
    choices: ["Standard RI のみ", "Convertible RI のみ", "Standard / Convertible 両方", "売却は不可"],
    a: 0,
    explain: "AWS RI Marketplace で売却できるのは Standard RI のみ。Convertible は売却不可。売却の条件: 米国の銀行口座、米国住所、購入後 30 日経過、有効期限まで 1 ヶ月以上残っているなど。"
  },
  { id: "ec2p-018", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "AWS Organizations / 一括請求 (Consolidated Billing) において RI / SP の共有はデフォルトで何が起きるか。",
    choices: [
      "Organizations 配下のアカウント間で RI / SP の割引が自動的に共有される",
      "RI は共有されるが SP は共有されない",
      "SP は共有されるが RI は共有されない",
      "どちらも共有されない"
    ],
    a: 0,
    explain: "デフォルトで Reserved Instance / Savings Plans の割引は組織内アカウント間で共有される。RI Discount Sharing / Savings Plans Discount Sharing を個別にオフにすることもできる。"
  },
  { id: "ec2p-019", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 の Capacity Reservation と Zonal RI の違いとして正しいものは？",
    choices: [
      "Capacity Reservation はキャパシティ予約だけ提供し、料金割引はない (RI / SP と組み合わせ可能)",
      "Capacity Reservation はキャパシティ予約と最大割引を提供する",
      "Zonal RI はキャパシティ予約を含まない",
      "両者は完全に同義"
    ],
    a: 0,
    explain: "Capacity Reservation はオンデマンド料金でのキャパシティ枠の確保。割引は別途 RI/SP の購入で得る。Zonal RI は両方の効果 (キャパシティ + 割引)。"
  },
  { id: "ec2p-020", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 RI / SP を購入したのに対象インスタンスを停止したままだとどうなるか。",
    choices: [
      "割引が無駄になる (RI/SP の料金は発生し続ける)",
      "自動的に契約が一時停止される",
      "未使用分は返金される",
      "自動で別アカウントに割り振られる"
    ],
    a: 0,
    explain: "RI / SP は購入した時点で料金が発生する。対象リソースがなければ割引が当たらないだけで、料金は発生し続ける。買ったら使うこと。"
  },

  // ===== Savings Plans =====
  { id: "ec2p-030", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "Savings Plans (SP) と Reserved Instance (RI) の「コミット単位」の違いを正しく述べたものは？",
    choices: [
      "SP は $/h コミット、RI は対象インスタンス 1 台単位のコミット",
      "SP は対象インスタンス 1 台単位、RI は $/h コミット",
      "両者とも $/h コミット",
      "両者とも対象インスタンス 1 台単位"
    ],
    a: 0,
    explain: "SP は『1 時間あたり $X 使う』というコミットメント。RI は特定インスタンスファミリ・サイズ・OS など属性ベース。SP のほうが柔軟。"
  },
  { id: "ec2p-031", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Compute Savings Plans と EC2 Instance Savings Plans の主な違いは？",
    choices: [
      "Compute SP は EC2 / Fargate / Lambda、全リージョン横断で適用、割引率は最大 66%。EC2 Instance SP は特定リージョン × 特定ファミリに固定で割引率は最大 72%",
      "EC2 Instance SP は Lambda にも適用される",
      "Compute SP は EC2 のみ",
      "両者の割引率は同じ"
    ],
    a: 0,
    explain: "Compute SP: 柔軟性最強 (EC2 / Fargate / Lambda、リージョン横断)。EC2 Instance SP: 柔軟性低い (特定リージョン + ファミリ) が割引率最大。"
  },
  { id: "ec2p-032", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "Savings Plans の契約期間は？",
    choices: ["1 年または 3 年", "1 年のみ", "3 年のみ", "6 ヶ月単位"],
    a: 0,
    explain: "SP は RI と同じく 1 年または 3 年。支払いも All Upfront / Partial Upfront / No Upfront の 3 種類。"
  },
  { id: "ec2p-033", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 Instance Savings Plans が割引対象とするのは？",
    choices: [
      "特定リージョン × 特定インスタンスファミリ (サイズ・OS・テナンシーは柔軟)",
      "全リージョン × 全ファミリ",
      "特定リージョン × 特定インスタンスサイズ",
      "Lambda と Fargate"
    ],
    a: 0,
    explain: "EC2 Instance SP は『リージョン (例: us-east-1) × ファミリ (例: m5)』にコミット。同じファミリ内でサイズ・OS・テナンシーは自由。"
  },
  { id: "ec2p-034", topic: "ec2-pricing", type: "multi", difficulty: 2,
    q: "Compute Savings Plans が割引対象として適用されるサービスを 2 つ以上選べ。",
    choices: ["EC2 (オンデマンド)", "AWS Fargate", "AWS Lambda", "Amazon RDS"],
    a: [0, 1, 2],
    explain: "Compute SP は EC2 / Fargate / Lambda が対象。RDS には適用されない (RDS には Reserved DB Instance がある)。"
  },
  { id: "ec2p-035", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI と Savings Plans が同時に存在する場合、AWS が割引を適用する優先順位は？",
    choices: [
      "RI を先に適用 → 残りに SP を適用 → 残りはオンデマンド",
      "SP を先に適用 → 残りに RI",
      "オンデマンドを先に適用",
      "任意のユーザ指定順"
    ],
    a: 0,
    explain: "AWS は (1) RI による割引 → (2) Savings Plans (Instance SP → Compute SP の順で割引率の高いほうから) → (3) オンデマンド の順に適用する。"
  },
  { id: "ec2p-036", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Savings Plans を購入した後にコミットメント額を変更したい場合の正しい対応は？",
    choices: [
      "既存 SP は変更不可。追加で新しい SP を購入するか、期間満了を待つ",
      "コミットメント額はいつでも増減可能",
      "Convertible SP に切り替えれば変更可能",
      "AWS Support に依頼すれば返金される"
    ],
    a: 0,
    explain: "SP のコミットメント額は契約後に変更不可。足りなければ追加購入、過剰なら期間満了を待つしかない。最初のコミット額は控えめに、追加購入で積み上げるのが安全。"
  },

  // ===== Spot =====
  { id: "ec2p-040", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "Spot インスタンスの最大割引率は通常どの程度か。",
    choices: ["最大 90%", "最大 30%", "最大 50%", "最大 99%"],
    a: 0,
    explain: "オンデマンド比で最大 90% 程度割引。容量不足や Spot 価格上昇により AWS 側で中断される可能性があり、24h 常時稼働の本番 Web サーバには適さない。"
  },
  { id: "ec2p-041", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Spot で「中断 (interruption)」が発生する場合、ユーザに通知されるリードタイムは？",
    choices: ["2 分前", "5 分前", "10 分前", "通知なし"],
    a: 0,
    explain: "Spot Interruption Notice はインスタンスメタデータと EventBridge 経由で 2 分前に通知される。2 分以内にチェックポイントや退避を実施する設計が必要。"
  },
  { id: "ec2p-042", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Spot ブロック (Spot Block, 1〜6 時間の中断なし枠) は現在の AWS でどうなっているか。",
    choices: [
      "新規利用は廃止されており、推奨されない",
      "1〜6 時間まで指定可能で広く利用されている",
      "最大 24 時間まで延長された",
      "Reserved Spot として置き換えられた"
    ],
    a: 0,
    explain: "Spot Block は 2021 年に新規利用が終了している。中断を許容できないワークロードは Spot 以外を使う。"
  },
  { id: "ec2p-043", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "24h 安定稼働の Web サーバを Spot で全て賄うのは推奨されない理由として最も適切なものは？",
    choices: [
      "中断リスクがあり、SLA を保てない",
      "Spot は 1 時間しか使えない",
      "Spot はインスタンスタイプを 1 つしか選べない",
      "Spot には EBS をアタッチできない"
    ],
    a: 0,
    explain: "Spot は 2 分前通知で中断される可能性があり、24h 単独稼働には不適。Auto Scaling Group の混在 (オンデマンド + Spot) ならフォールバック構成として有効。"
  },

  // ===== Dedicated Host / Dedicated Instance =====
  { id: "ec2p-050", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Dedicated Host と Dedicated Instance の違いとして正しいものは？",
    choices: [
      "Dedicated Host は物理サーバ単位で予約・可視化されコア数や Socket 数も把握できる。Dedicated Instance は他テナントと物理サーバを共有しないだけで Host 情報は隠蔽される",
      "Dedicated Host は仮想化レイヤ上のサンドボックス",
      "Dedicated Instance は BYOL に必要",
      "両者は同義"
    ],
    a: 0,
    explain: "Dedicated Host: 物理サーバ 1 台を専有・コア/ソケット可視。Socket / Core ベースの BYOL に必要 (Oracle, Windows Server など)。Dedicated Instance: 物理サーバ共有しないが Host は見えない。"
  },
  { id: "ec2p-051", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "BYOL (Bring Your Own License) で物理コア単位のソフトウェアライセンスを使いたい場合に必要な EC2 オプションは？",
    choices: ["Dedicated Host", "Dedicated Instance", "Default Tenancy", "Spot"],
    a: 0,
    explain: "コア/ソケット課金のライセンス (Oracle DB EE BYOL など) は物理サーバの構成情報が必要なので Dedicated Host が必要。Dedicated Instance では足りないケースが多い。"
  },
  { id: "ec2p-052", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "Default tenancy で起動した EC2 が他のテナントと「同じ物理サーバを共有する」ことがあるか。",
    choices: ["共有することがある", "絶対に共有しない", "リージョンによる", "AZ による"],
    a: 0,
    explain: "Default tenancy では物理ホストを他テナントと共有することがある。コンプライアンス上 NG なら Dedicated Instance または Dedicated Host を選択。"
  },

  // ===== その他 =====
  { id: "ec2p-060", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 をオンデマンドで 1 ヶ月 24h 動かした場合、料金は 720h か 730h で計算されることが多いか。",
    choices: [
      "730h (1年 8760h / 12 ヶ月の平均)",
      "720h (30日 × 24h 固定)",
      "744h (31日 × 24h)",
      "8760h (1 年分)"
    ],
    a: 0,
    explain: "AWS の月額表示は 730 時間 (8760 / 12) で計算するのが慣例。実際には 28〜31 日で月によって時間数は変わる。"
  },
  { id: "ec2p-061", topic: "ec2-pricing", type: "fill", numeric: false, difficulty: 1,
    q: "オンデマンドより最大 72% 割引、特定インスタンス属性に縛られる代表的な購入オプションを日本語または英語で答えよ。",
    a: ["Standard RI", "スタンダード RI", "Standard Reserved Instance", "リザーブドインスタンス", "Reserved Instance"],
    explain: "Standard Reserved Instance。Convertible は最大 66%。SP は Compute SP で最大 66%、EC2 Instance SP で最大 72%。"
  },
  { id: "ec2p-062", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI 購入時にキャパシティ予約 (起動枠の確保) がデフォルトで付くスコープは？",
    choices: ["Zonal (AZ 指定)", "Regional", "両方", "どちらも付かない"],
    a: 0,
    explain: "Zonal RI のみキャパシティ予約あり。Regional RI は割引のみで起動枠を確約しない。AZ レベルのキャパシティ確保が要件なら Zonal RI または Capacity Reservation を併用。"
  },
  { id: "ec2p-063", topic: "ec2-pricing", type: "multi", difficulty: 2,
    q: "EC2 RI の支払い方式で「割引率が高いほうから」並べると正しい順序になるのはどれか (複数選択: 高い順に当てはまるものを全て選べ)。",
    choices: [
      "All Upfront が一番高い割引",
      "Partial Upfront が二番目に高い",
      "No Upfront が最も低い割引 (3 つの中では)",
      "No Upfront が All Upfront より割引率が高い"
    ],
    a: [0, 1, 2],
    explain: "割引率は概ね All Upfront > Partial Upfront > No Upfront。前払いが多いほうがアップフロント割引が大きい。No Upfront が最も高いことはない。"
  },
  { id: "ec2p-064", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI Marketplace でユーザが自分の RI を売却するための主な条件として正しくないものは？",
    choices: [
      "アメリカ合衆国の有効な銀行口座および住所が必要",
      "売却対象は購入後 30 日以上経過していること",
      "残り契約期間が 1 ヶ月以上であること",
      "Convertible RI も売却対象に含まれる"
    ],
    a: 3,
    explain: "Convertible RI は売却できない。Standard RI のみ売却可能。米国銀行口座 / 30 日 / 残期間 1 ヶ月以上などの条件は要件。"
  },
  { id: "ec2p-065", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "SP の Hourly Commitment が時間あたり一部しか使われなかった場合、未消費分の扱いは？",
    choices: [
      "未消費分はその時間で失効する (繰り越し不可)",
      "翌時間に繰り越せる",
      "翌月末まで繰り越せる",
      "返金される"
    ],
    a: 0,
    explain: "SP のコミットメントは時間ごとに切り出され、その時間に使い切らなかった分は失効する。コミット額は実需より控えめに設定するのが基本。"
  },
  { id: "ec2p-066", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "AWS Organizations 配下で、特定アカウントだけ RI / SP の共有から除外したい場合の正しい操作は？",
    choices: [
      "管理アカウントの請求設定で当該アカウントの RI / SP 共有を無効化する",
      "アカウントを Organizations から外す",
      "新しいアカウントを別の Organizations に作る",
      "RI / SP の共有はオンオフできない"
    ],
    a: 0,
    explain: "管理アカウントの請求コンソールから RI Discount Sharing / Savings Plans Discount Sharing をアカウント単位でオフにできる。"
  },
  { id: "ec2p-067", topic: "ec2-pricing", type: "single", difficulty: 3,
    q: "RI のサイズ柔軟性で normalization factor の説明として正しいものは？",
    choices: [
      "nano=0.25, micro=0.5, small=1, medium=2, large=4, xlarge=8 …というように倍々で割り当てられる",
      "全てのサイズで 1 として扱われる",
      "small=1, medium=1, large=1 と固定",
      "リージョンごとに異なる"
    ],
    a: 0,
    explain: "サイズ柔軟性の按分用係数 (Linux/UNIX + default tenancy + Regional 条件下)。large 1 台 = factor 4 = small 4 台 = medium 2 台 にカバレッジを按分できる。"
  },
  { id: "ec2p-068", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI の購入後に「やっぱり要らなくなった」場合の正しい対応は (Standard RI、Marketplace 売却の条件は満たしているとする)？",
    choices: [
      "Marketplace で売却を試みる、または満了まで使い切る",
      "AWS サポートに連絡すれば返金される",
      "Convertible に変換してから返却する",
      "ストップしておけば課金されない"
    ],
    a: 0,
    explain: "RI 購入は基本的にキャンセル/返金不可。Standard RI なら Marketplace 売却を検討。Convertible は売却不可なので満了まで使い切るか交換する。"
  },
  { id: "ec2p-069", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "次のうち「短期 (数時間〜数日) のスポット稼働」が向く用途はどれか。",
    choices: [
      "夜間バッチや CI ビルドエージェント",
      "本番 24h Web フロントエンド (シングル AZ)",
      "本番 RDS のプライマリ",
      "ライセンス必須のシステム"
    ],
    a: 0,
    explain: "Spot は中断耐性が必要なバッチ / CI / レンダリング / ステートレスな分散処理向け。24h 本番フロントエンドの単独稼働は推奨されない。"
  },

  // ===== EC2 課金単位の細部 =====
  { id: "ec2p-070", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "AWS Marketplace から提供される RHEL 等の AMI で起動した EC2 の課金単位は？",
    choices: ["時間単位 (端数切り上げ)", "秒単位 (最小 60 秒)", "分単位", "コア単位のみ"],
    a: 0,
    explain: "Amazon Linux / Ubuntu / SUSE は秒単位課金。RHEL / Windows / 商用 AMI 多くは時間単位課金。Marketplace AMI の場合は AMI 提供元の課金単位に従う点に注意。"
  },
  { id: "ec2p-071", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 を 5 秒だけ起動して停止した場合の課金時間は？ (Linux の例)",
    choices: ["60 秒分 (最小)", "5 秒分", "1 時間分", "0 秒"],
    a: 0,
    explain: "秒単位課金でも最小 60 秒は課金される。テストや短時間起動でも 60 秒は払うことになる。"
  },
  { id: "ec2p-072", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Hibernate (ハイバネート) 機能を使った EC2 を「ハイバネート中」にしたとき、課金されるものはどれか。",
    choices: [
      "EBS ストレージ (RAM 状態の保存先含む) は課金、インスタンス時間は無料",
      "インスタンス時間も継続課金",
      "RAM の永続保存だけは無料",
      "EIP 以外は全て無料"
    ],
    a: 0,
    explain: "Hibernate は RAM 状態を root EBS に書き戻して停止。インスタンス時間は止まるが、EBS は通常通り課金。RAM ダンプ分のディスク使用量が増える点に注意。"
  },
  { id: "ec2p-073", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Instance Store (Ephemeral) ボリュームの「停止 (stop)」操作との関係として正しいものは？",
    choices: [
      "Instance Store はインスタンス停止/終了時にデータが失われる。EBS-backed であっても Instance Store ボリュームは保持されない",
      "停止しても Instance Store は保持される",
      "Instance Store は EBS と同じくスナップショット可能",
      "Instance Store だけ別料金体系で停止中も課金される"
    ],
    a: 0,
    explain: "Instance Store は物理サーバ直結ストレージで、停止/終了/障害でデータが消える。停止操作で消えるため永続保存には不向き。EBS スナップショット相当の機能はない。"
  },
  { id: "ec2p-074", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Instance Store のみのインスタンスは「Stop」操作ができるか。",
    choices: ["できない (Reboot か Terminate のみ)", "できる (停止中も Instance Store は保持)", "できる (停止中はデータ消失)", "EBS-only にすればできる"],
    a: 0,
    explain: "Instance Store-only のインスタンスは Stop できない。Reboot か Terminate のみ。Stop は EBS-backed 専用の挙動。"
  },
  { id: "ec2p-075", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 を「再起動 (Reboot)」したときの課金挙動は？",
    choices: [
      "再起動中も継続して課金される (連続稼働扱い)",
      "再起動中は無料",
      "Reboot は 1 時間分課金される",
      "Reboot で課金時間がリセットされる"
    ],
    a: 0,
    explain: "Reboot は OS の再起動相当で、AWS から見ると同じインスタンス稼働の継続。秒単位/時間単位の課金は止まらない。"
  },

  // ===== 削減アクション基礎 =====
  { id: "ec2p-080", topic: "ec2-pricing", type: "multi", difficulty: 2,
    q: "オンデマンド単独で 24h 動かしている EC2 を「契約変更だけ」で割引する手段を 2 つ以上選べ (構成変更なし)。",
    choices: [
      "Standard RI を購入する",
      "Compute Savings Plans を購入する",
      "EC2 Instance Savings Plans を購入する",
      "Spot に切り替える"
    ],
    a: [0, 1, 2],
    explain: "RI / SP はインスタンスを変えずに購入だけで割引が適用される。Spot は構成変更 (中断対応設計) が必要。"
  },
  { id: "ec2p-081", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "夜間に止めても問題ない開発用 EC2 を 24h 稼働させているとき、最も簡単なコスト削減策は？",
    choices: [
      "夜間に Stop して朝に Start する (Instance Scheduler 等で自動化)",
      "Spot 化する",
      "RI を 3 年契約で買う",
      "Dedicated Host 化する"
    ],
    a: 0,
    explain: "止めて良い時間に止めるのが最大の削減。AWS Instance Scheduler や EventBridge + Lambda で自動化できる。停止中も EBS は課金される点には注意。"
  },
  { id: "ec2p-082", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "ある EC2 が 90% の時間 CPU 5% 未満で動いている。最も効果的な最初のアクションは？",
    choices: [
      "リサイズ (例: m5.large → t3.small) を検討",
      "Multi-AZ にする",
      "Reserved Instance を 3 年契約する",
      "Spot に切り替える"
    ],
    a: 0,
    explain: "CPU 余剰なら Right-Sizing が最優先。AWS Compute Optimizer や CloudWatch メトリクスで判断。サイズダウンしてから RI/SP を購入するのが正しい順序。"
  },
  { id: "ec2p-083", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "EC2 起動状態の「料金が一番安くなりやすい OS」は？",
    choices: ["Amazon Linux / Ubuntu (オープンソース)", "Red Hat Enterprise Linux (ライセンス込)", "Windows Server", "SUSE Linux Enterprise"],
    a: 0,
    explain: "Amazon Linux / Ubuntu はライセンス費用がない。RHEL / Windows / SLES などはライセンス料が乗るので同じ vCPU でも高い。同じワークロードなら OS 選定もコスト最適化のうち。"
  },
  { id: "ec2p-084", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "1 年契約の Standard RI と 1 年契約の Compute SP では、同じ EC2 利用に対してどちらが「変更耐性」が高いか。",
    choices: [
      "Compute SP のほうが圧倒的に高い (リージョン / ファミリ / OS / サービス横断で柔軟)",
      "Standard RI のほうが高い",
      "ほぼ同じ",
      "Compute SP は 1 年契約できない"
    ],
    a: 0,
    explain: "Compute SP は EC2 / Fargate / Lambda、リージョン横断、ファミリ・サイズ自由。RI は属性に縛られる。柔軟さは Compute SP > Convertible RI > Standard RI。"
  },
  { id: "ec2p-085", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "「Reserved Instance を購入したが、対象インスタンスを別ファミリに変更したくなった」場合、構成変更後も割引を活かす方法として最も実務的なのは？",
    choices: [
      "Convertible RI なら同等以上の価値で交換できる。Standard RI は Marketplace 売却 / 期間満了待ち",
      "Standard RI でもファミリ変更可能",
      "全 RI は自由にファミリ変更可能",
      "RI は変更できないので諦める"
    ],
    a: 0,
    explain: "Convertible RI: 交換可能 (同等以上の価値)。Standard RI: ファミリ等変更不可、Marketplace 売却を検討するか期間まで持つ。最初から変動を見込むなら SP のほうが楽。"
  },
  { id: "ec2p-086", topic: "ec2-pricing", type: "single", difficulty: 3,
    q: "「3 年 All Upfront の Compute Savings Plans」と「3 年 No Upfront の EC2 Instance Savings Plans」を比較したとき、最大割引率が高いのはどちらか。",
    choices: [
      "3 年 All Upfront の EC2 Instance SP が組み合わせとしては最大級になりやすい",
      "Compute SP のほうが常に高い",
      "両者は全く同じ",
      "支払い方法の違いは割引率に影響しない"
    ],
    a: 0,
    explain: "割引率は『EC2 Instance SP > Compute SP』、『All Upfront > Partial > No Upfront』、『3 年 > 1 年』。最も柔軟さを諦めた組み合わせが最大割引。逆に Compute SP No Upfront 1 年は最も柔軟だが割引控えめ。"
  },
  { id: "ec2p-087", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 RI の「適用範囲」は購入後に変更できるか。",
    choices: [
      "Regional ↔ Zonal の変更は AWS サポートに依頼すれば可能",
      "購入後は一切変更不可",
      "ボタン 1 つで自由に変更できる",
      "Marketplace 経由で売って買い直すしかない"
    ],
    a: 0,
    explain: "AWS Support 経由で Regional ↔ Zonal の変更を依頼できる (条件あり)。インスタンスファミリやサイズの変更は Convertible のみ可能。Standard は属性変更不可。"
  },
  { id: "ec2p-088", topic: "ec2-pricing", type: "multi", difficulty: 3,
    q: "RI と SP を組み合わせる戦略として、24h EC2 を運用する企業に対して妥当なアドバイスを 2 つ以上選べ。",
    choices: [
      "確実に使う最低限の量は 3 年 EC2 Instance SP または 3 年 Standard RI でカバーする",
      "変動余地のある分は 1 年 Compute SP でカバーする",
      "全て 3 年 No Upfront の Standard RI に賭ける",
      "コミットメントは一切せず全てオンデマンドにしておく"
    ],
    a: [0, 1],
    explain: "ベースラインを高割引の長期コミット、変動分を柔軟な短期 SP でカバーする層構造が定石。全量 3 年は変動リスクが大きい。全量オンデマンドは最大の支払い。"
  },

  // ===== 細かい知識 =====
  { id: "ec2p-090", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Standard RI の最大割引率 (3 年 All Upfront) は概ねどれくらいか。",
    choices: ["最大 72%", "最大 50%", "最大 90%", "最大 25%"],
    a: 0,
    explain: "Standard RI 3 年 All Upfront でオンデマンド比 最大 72% 程度。Convertible RI 3 年 All Upfront で最大 66%。SP では EC2 Instance SP 3 年 All Upfront が最大 72%、Compute SP は最大 66%。"
  },
  { id: "ec2p-091", topic: "ec2-pricing", type: "fill", numeric: true, difficulty: 2,
    q: "RI のサイズ柔軟性で normalization factor: large = 4 のとき、xlarge は何になるか (整数で)。",
    a: 8, tolerance: 0,
    explain: "倍々: nano 0.25 / micro 0.5 / small 1 / medium 2 / large 4 / xlarge 8 / 2xlarge 16 / 4xlarge 32 / 8xlarge 64 / 16xlarge 128。"
  },
  { id: "ec2p-092", topic: "ec2-pricing", type: "single", difficulty: 3,
    q: "Dedicated Host Reservation (1 年 / 3 年) の特徴として正しいものは？",
    choices: [
      "Host そのものに対する予約割引で、ホスト上のインスタンスの起動には別途料金がかからない (BYOL 前提)",
      "Host 上のインスタンス起動料は通常通り発生する",
      "Dedicated Host は予約購入できない",
      "Marketplace でいつでも売却可能"
    ],
    a: 0,
    explain: "Dedicated Host Reservation はホスト単位の予約。ホスト上のインスタンスについては BYOL なので AWS の OS ライセンス料はかからない。"
  },
  { id: "ec2p-093", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 で Bring Your Own License (BYOL) を運用するとき、ライセンス遵守を AWS 側で支援する仕組みは？",
    choices: [
      "AWS License Manager",
      "AWS Compute Optimizer",
      "AWS Trusted Advisor",
      "AWS Health Dashboard"
    ],
    a: 0,
    explain: "AWS License Manager は BYOL ライセンスのトラッキング、Dedicated Host での自動アサインなどを管理する。コスト面では超過調達を防ぐ効果がある。"
  },
  { id: "ec2p-094", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "Convertible RI を「現在の RI の総支払い額より安価な別 RI」に交換できるか。",
    choices: ["できない (同等以上の額のみ)", "できる (差額は次月相殺)", "できる (返金あり)", "Marketplace 経由なら可能"],
    a: 0,
    explain: "Convertible RI 交換のルール: 交換後の総支払い額は元と『同等以上』である必要がある。安いものへの交換 / 差額返金はできない。"
  },
  { id: "ec2p-095", topic: "ec2-pricing", type: "single", difficulty: 1,
    q: "1 年 EC2 Instance SP (No Upfront) を購入後、対象ファミリのインスタンスを一切起動しなかった場合の課金は？",
    choices: [
      "コミットメント時間料金は毎時請求され続ける",
      "未使用なら課金は発生しない",
      "1 年後にまとめて請求される",
      "AWS Support が自動キャンセル"
    ],
    a: 0,
    explain: "SP は使うかどうかに関係なく時間あたりのコミットメント額が請求される。No Upfront でも毎時で請求が積み上がるので、購入前のサイジングが重要。"
  },
  { id: "ec2p-096", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 の OS 種別の中で「割引適用条件」が緩いものに該当するのは？",
    choices: [
      "Linux/UNIX (RI のサイズ柔軟性が効く)",
      "Windows (サイズ柔軟性なし)",
      "RHEL with HA (サイズ柔軟性なし)",
      "SQL Server Standard (BYOL なし)"
    ],
    a: 0,
    explain: "Linux/UNIX は RI のサイズ柔軟性が効くため運用が柔軟。Windows / RHEL などはサイズ柔軟性が効かないため、サイズや OS のミスマッチで割引が無駄になりやすい。"
  },
  { id: "ec2p-097", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "AWS が公式に「24h 連続稼働のワークロードに対する最初の最適化ステップ」として推奨することが多いのは？",
    choices: [
      "Right-Sizing → Reserved Instance / Savings Plans → Auto Scaling 設計",
      "Spot 100% 化",
      "Dedicated Host 化",
      "全てを別リージョンに移動"
    ],
    a: 0,
    explain: "公式手順は概ね (1) 不要リソース削除 (2) Right-Sizing (3) RI / SP のコミット (4) 自動停止・スケジューリング (5) アーキ最適化 の順番。最初に過剰サイズを直してからコミットメントに行くのが鉄則。"
  },
  { id: "ec2p-098", topic: "ec2-pricing", type: "single", difficulty: 3,
    q: "3 年 All Upfront RI を購入したインスタンスを 1 年で AWS 側 (またはユーザ都合) で別ファミリに変えたい。最もダメージが小さい初動は？",
    choices: [
      "Convertible RI なら別ファミリへ交換、Standard RI なら Marketplace 売却を検討し、新ファミリ用に SP を購入",
      "Standard RI は無理矢理にでも交換する",
      "オンデマンドで動かし続ければ問題ない",
      "Dedicated Host にすれば回避できる"
    ],
    a: 0,
    explain: "Standard RI は交換できないため、Marketplace で売却して新規 SP を購入し直すのが現実解。最初から不確実性が高ければ Convertible RI / SP を選ぶ判断が重要。"
  },
  { id: "ec2p-099", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "RI / SP は「適用されなかった時間」は割引なしでオンデマンド料金が請求される。これに対する最大の対策は？",
    choices: [
      "コミットメント量を実使用に対して過小に設定し、追加購入で積み上げる",
      "コミットメント量を実使用より多めに買って余裕を持たせる",
      "毎月コミットメントを再購入する",
      "AWS Support に毎月レビューを依頼する"
    ],
    a: 0,
    explain: "コミットの取り過ぎは未使用分を払い続けるリスク。最低利用量に対して購入して、利用が安定したら追加購入。Compute SP は柔軟なので積み上げに向く。"
  },
  { id: "ec2p-100", topic: "ec2-pricing", type: "single", difficulty: 2,
    q: "EC2 オンデマンドで「リージョンを跨いで稼働を分けている」場合、Compute Savings Plans の適用としてどうなるか。",
    choices: [
      "リージョン横断で適用される (Compute SP の特徴)",
      "リージョンごとに別個に購入が必要",
      "AZ ごとに別個に購入が必要",
      "適用不可"
    ],
    a: 0,
    explain: "Compute SP はリージョン横断・サービス横断 (EC2 / Fargate / Lambda)。マルチリージョン構成にはまず Compute SP を検討する。"
  }
);
