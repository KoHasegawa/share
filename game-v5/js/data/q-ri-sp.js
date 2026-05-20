/* RI / Savings Plans 応用 — 30+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  { id: "risp-001", topic: "ri-sp", type: "single", difficulty: 2,
    q: "「24h 稼働の EC2 m5.large 10 台 / Linux」に対する最適なコミットメント戦略の例として妥当なのは？",
    choices: [
      "確実に使う 7〜8 台ぶんは 3 年 EC2 Instance SP (or Standard RI) / 残り 2〜3 台分は 1 年 Compute SP",
      "10 台全部を 3 年 No Upfront Standard RI",
      "全てオンデマンド",
      "全て Spot"
    ],
    a: 0,
    explain: "ベースを長期・高割引でカバー、変動分を柔軟な短期 SP で。Compute SP のリージョン横断 / サービス横断 (EC2 / Fargate / Lambda) 柔軟性も活用。"
  },
  { id: "risp-002", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RDS (db.m5.large × Multi-AZ) と EC2 (m5.large × 10台) に同時にコミットするとき、両方カバーする手段は？",
    choices: [
      "EC2 側は Compute SP / RI、RDS 側は Reserved DB Instance を別途購入する (RDS は SP 対象外)",
      "Compute SP で RDS もカバー",
      "Reserved DB Instance で EC2 もカバー",
      "Aurora にすればまとめてカバー"
    ],
    a: 0,
    explain: "Savings Plans は EC2 / Fargate / Lambda が対象で RDS はカバーしない。RDS には Reserved DB Instance がある。両側で別個に購入する必要がある。"
  },
  { id: "risp-003", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RI と SP の同時保有時の AWS 内部割引適用の順序として正しいのは？",
    choices: [
      "RI → EC2 Instance SP → Compute SP → オンデマンド",
      "Compute SP → EC2 Instance SP → RI",
      "オンデマンド → RI → SP",
      "ランダム"
    ],
    a: 0,
    explain: "AWS は『RI → Instance SP → Compute SP → オンデマンド』の順で適用 (おおむね高い割引から)。RI と SP が両方ある場合、購入バランスを誤ると未消費が出やすい。"
  },
  { id: "risp-004", topic: "ri-sp", type: "single", difficulty: 2,
    q: "Standard RI を保有しているのに、対象インスタンスをサイズダウンしてしまった。Linux/UNIX + Regional + default tenancy の場合の挙動は？",
    choices: [
      "サイズ柔軟性で按分適用 (normalization factor)、無駄にはなりにくい",
      "完全に失効",
      "サイズダウンは禁止される",
      "Marketplace 売却必須"
    ],
    a: 0,
    explain: "サイズ柔軟性で按分される。例えば m5.large RI → m5.small (factor 1) なら 4 倍に分割適用される。逆に xlarge にすれば 0.5 台分のみカバー。"
  },
  { id: "risp-005", topic: "ri-sp", type: "single", difficulty: 3,
    q: "Windows EC2 を Standard RI で買った後、サイズ違いに切り替えた時の影響は？",
    choices: [
      "Windows はサイズ柔軟性の対象外なので、サイズが完全一致しないと適用されない",
      "サイズ柔軟性が自動で効く",
      "Convertible に自動変換",
      "Marketplace 売却が義務化"
    ],
    a: 0,
    explain: "サイズ柔軟性は Linux/UNIX + Regional + default tenancy が条件。Windows / RHEL / SQL Server LI などは完全一致が必要。"
  },
  { id: "risp-006", topic: "ri-sp", type: "single", difficulty: 2,
    q: "Compute SP を $5/h でコミットし、実際の対象消費が $4/h だった時間がある。残りの $1 はどうなるか。",
    choices: [
      "未消費分は失効 (毎時単位)",
      "翌時間に繰り越せる",
      "翌月相殺",
      "返金される"
    ],
    a: 0,
    explain: "SP のコミットメントは時間単位で消費評価。未使用は失効。"
  },
  { id: "risp-007", topic: "ri-sp", type: "single", difficulty: 2,
    q: "AWS Organizations で複数アカウントが RI / SP を共有している。新しいアカウントを追加した時、割引はすぐ共有されるか。",
    choices: [
      "管理アカウントで RI / SP 共有設定が有効になっていれば、追加アカウントにも自動適用される",
      "手動で各アカウントに割り当てが必要",
      "新アカウントは初月のみ無料",
      "新アカウントは共有対象外"
    ],
    a: 0,
    explain: "RI Discount Sharing / SP Discount Sharing がデフォルト ON のままなら、Organizations 配下のアカウントに共有される。特定アカウントを除外したい場合は明示設定。"
  },
  { id: "risp-008", topic: "ri-sp", type: "single", difficulty: 2,
    q: "Compute SP と EC2 Instance SP を「同時に」購入することは可能か。",
    choices: [
      "可能。AWS は割引適用順序 (Instance SP → Compute SP) に従って自動適用",
      "1 種類しか保有できない",
      "同時購入には AWS Support 承認が必要",
      "両者は重複して購入禁止"
    ],
    a: 0,
    explain: "両者は同時保有できる。Instance SP が優先適用され、余りに Compute SP が当たる。"
  },
  { id: "risp-009", topic: "ri-sp", type: "single", difficulty: 3,
    q: "EC2 Instance SP を購入しているが、対象ファミリ / リージョンの利用が想定より少なく未消費が多い。最適なリカバリは？",
    choices: [
      "対象ファミリの利用を増やせない場合、満了まで持つしかない。今後の購入は Compute SP に倒すことで柔軟性を確保",
      "AWS Support に依頼すれば返金",
      "Convertible に切替",
      "Marketplace で売却"
    ],
    a: 0,
    explain: "SP はキャンセル不可。EC2 Instance SP はファミリ・リージョン固定のため変化に弱い。将来の購入は Compute SP に寄せる戦略修正が現実解。"
  },
  { id: "risp-010", topic: "ri-sp", type: "single", difficulty: 3,
    q: "Standard RI から Convertible RI への乗り換えは可能か。",
    choices: [
      "不可。Standard RI はそのまま使うか Marketplace 売却するしかない",
      "AWS Support 経由で乗り換え可能",
      "Convertible に自由に変更",
      "毎月乗り換え可能"
    ],
    a: 0,
    explain: "Standard ↔ Convertible の変更は不可。最初の購入時に判断が必要。長期間使うインスタンスは Standard、変動が読めないなら Convertible / SP。"
  },
  { id: "risp-011", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RI / SP の購入対象を 1 年契約と 3 年契約で組み合わせる戦略は妥当か。",
    choices: [
      "妥当。長期で確実に使う部分は 3 年、変動見込みは 1 年、と層を分ける",
      "1 種類に絞らないとならない",
      "1 年と 3 年は同時保有不可",
      "両者は同価格"
    ],
    a: 0,
    explain: "需要の確実性に応じて層を分けて買うのが定石。AWS Cost Explorer の Recommendations を参考にする。"
  },
  { id: "risp-012", topic: "ri-sp", type: "single", difficulty: 2,
    q: "Cost Explorer の SP / RI Recommendations の特徴は？",
    choices: [
      "過去 7 / 30 / 60 日の利用実績から、購入推奨額と回収期間を提示",
      "未来予測を無料で実施",
      "1 度しか使えない",
      "AWS Support のみ閲覧可能"
    ],
    a: 0,
    explain: "Cost Explorer の Recommendations は無料機能。利用パターンを元に SP / RI の推奨を出してくれる。トレンドが安定している部分から購入していくのが基本。"
  },
  { id: "risp-013", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RI の利用率 / カバレッジを継続モニタする AWS 機能は？",
    choices: [
      "Cost Explorer の RI Utilization / Coverage Report",
      "CloudTrail のイベントログ",
      "VPC Flow Logs",
      "AWS Config"
    ],
    a: 0,
    explain: "Utilization (購入した割引枠のうち実消費率) / Coverage (利用のうち割引対象になっている割合) を見て、利用率 < 100% なら買いすぎ、Coverage が低ければ追加検討。"
  },
  { id: "risp-014", topic: "ri-sp", type: "single", difficulty: 2,
    q: "SP の Utilization (使用率) が 60% に低下した時の典型的な原因は？",
    choices: [
      "対象 EC2 を Spot に移した / インスタンスを Stop した / SP コミット額が需要より大きい",
      "AWS の障害",
      "リージョンの料金値下げ",
      "OS のアップデート"
    ],
    a: 0,
    explain: "Utilization が落ちる原因はコミット量過剰 or 利用減少。コミット側は調整不可なので、需要側 (Stop/Spot 化) を巻き戻すか満了を待つ。"
  },
  { id: "risp-015", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RDS の Reserved DB Instance を Single-AZ 用で買ったが、Multi-AZ に変更した。",
    choices: [
      "Single-AZ 用 RI は Multi-AZ には適用されない (Multi-AZ 用 RI が必要)",
      "そのまま自動で Multi-AZ に流用される",
      "Multi-AZ 化で 2 倍適用",
      "Convertible になる"
    ],
    a: 0,
    explain: "RDS Reserved は Single-AZ / Multi-AZ で SKU が違う。Multi-AZ 用は Single-AZ にも按分適用できるが、逆は不可。"
  },
  { id: "risp-016", topic: "ri-sp", type: "single", difficulty: 2,
    q: "EC2 RI を購入したのち、対象が Stop しっぱなしになっている。最初のアクションは？",
    choices: [
      "そもそも本当に停止しっぱなしで良いか業務確認 → 必要なら別ファミリの利用に充てる (RI 流用) / Marketplace 売却",
      "RI は自動キャンセル",
      "Stop で RI が休止される",
      "RI の課金が止まる"
    ],
    a: 0,
    explain: "RI は『買ったら使うかに関係なく毎時の割引枠を消費 (= 課金)』。Stop で使われない場合は別インスタンスの利用に振り向けるか Marketplace を検討。"
  },
  { id: "risp-017", topic: "ri-sp", type: "single", difficulty: 2,
    q: "Compute SP は Lambda / Fargate / EC2 のうちどれを対象とするか。",
    choices: ["全て", "EC2 と Lambda のみ", "Fargate のみ", "Lambda のみ"],
    a: 0,
    explain: "Compute SP は EC2 / Fargate / Lambda の 3 サービス対象。リージョン / ファミリ / OS / テナンシー横断で柔軟。"
  },
  { id: "risp-018", topic: "ri-sp", type: "single", difficulty: 2,
    q: "ある月にコンピューティング利用が大きく減って Compute SP のコミット未消費が増えた。来期に向けて取るべき戦略は？",
    choices: [
      "現 SP は満了まで持ち、次回購入時はベースラインに絞った金額に下げる",
      "現 SP を解約",
      "Convertible に切替",
      "更に SP を買い増し"
    ],
    a: 0,
    explain: "SP はキャンセル不可。需要が大きく落ちる時は次回購入を抑えるしかない。コミット量は『絶対に使う最低限』に。"
  },
  { id: "risp-019", topic: "ri-sp", type: "single", difficulty: 3,
    q: "1 年 SP と 3 年 SP を混在させた時の AWS による適用ロジックは？",
    choices: [
      "割引率が高いもの (3 年 / 高 Upfront) から優先適用される",
      "1 年から優先適用",
      "ランダム",
      "アカウント番号順"
    ],
    a: 0,
    explain: "AWS は割引率の高い枠から消費して、ユーザのメリット最大化を狙う。低い割引枠ほど未消費になりやすい。"
  },
  { id: "risp-020", topic: "ri-sp", type: "single", difficulty: 2,
    q: "AWS Organizations で 4 つのアカウントが稼働中。RI / SP の購入はどこから行うのが管理上自然か。",
    choices: [
      "管理アカウントから一元購入し、Discount Sharing で配下アカウントに割引を共有する",
      "アカウントごとに個別購入する",
      "Marketplace 経由でのみ可能",
      "RI / SP は Organizations に対応していない"
    ],
    a: 0,
    explain: "管理アカウントで一元化が定石。アカウントが消費した分に対して割引が再配分される。配分計算は『Lump Sum』か『Tiered Sharing』で行われ、CUR / Cost Explorer で確認可能。"
  },
  { id: "risp-021", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RI / SP 購入時に推奨される最初のステップは？",
    choices: [
      "Right-Sizing を済ませてから、安定した利用ベースに対して購入",
      "全てを 3 年 All Upfront でコミット",
      "Spot に切り替えてから購入",
      "Multi-AZ にしてから購入"
    ],
    a: 0,
    explain: "サイジング前のコミットは無駄を生む。Right-Sizing → 利用安定化 → 控えめのコミット → 利用確認しつつ追加購入。"
  },
  { id: "risp-022", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RI / SP のコミット率を上げすぎたときのリスクは？",
    choices: [
      "未消費分が毎時失効し続け、想定削減効果が出ない",
      "AWS から罰金",
      "リージョン外に転出させられる",
      "オンデマンドが無料化"
    ],
    a: 0,
    explain: "買いすぎは最大の落とし穴。Compute SP の場合は柔軟性で吸収余地があるが、EC2 Instance SP / Standard RI は柔軟性が低く未消費になりやすい。"
  },
  { id: "risp-023", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RI / SP の購入時期として最適と言われやすいタイミングは？",
    choices: [
      "Right-Sizing と稼働安定化を経た後、利用が読める時期",
      "プロジェクト立ち上げ直後",
      "繁忙期のピーク",
      "AWS 料金値下げ発表直後"
    ],
    a: 0,
    explain: "利用予測が立たないうちはコミットすると裏目に出る。AWS の利用が安定してからが買い時。"
  },
  { id: "risp-024", topic: "ri-sp", type: "single", difficulty: 3,
    q: "AWS Compute Optimizer / Cost Explorer Recommendations / CUR を使う優先順としてコスト最適化に効果が出やすい流れは？",
    choices: [
      "Compute Optimizer で Right-Sizing → CUR / Cost Explorer で実利用を確認 → SP / RI Recommendations を参照して購入",
      "RI 購入 → Right-Sizing → 利用確認",
      "CUR をエクスポート → SP を全額 3 年 All Upfront → 後で調整",
      "順序は関係ない"
    ],
    a: 0,
    explain: "リサイズ → 利用確認 → コミット の流れが王道。CUR は詳細分析 (例: アカウント・タグ別配賦) に効く。"
  },
  { id: "risp-025", topic: "ri-sp", type: "single", difficulty: 2,
    q: "AWS Marketplace で Standard RI を売却するには？",
    choices: [
      "米国の銀行口座 + 米国住所 + 購入後 30 日経過 + 残期間 1 ヶ月以上の条件を満たし、AWS Marketplace 出品",
      "出品は不可",
      "Convertible RI 限定で出品",
      "Marketplace 出品料金が必要"
    ],
    a: 0,
    explain: "Standard RI のみ Marketplace で売却可能 (Convertible は不可)。米国の銀行口座が必要なため日本のアカウントだけでは売却ハードルが高い。"
  },
  { id: "risp-026", topic: "ri-sp", type: "single", difficulty: 2,
    q: "RDS の Reserved DB Instance を購入した後、PostgreSQL → MySQL のようなエンジン変更はどうなるか。",
    choices: [
      "エンジンが違う RI は別 SKU。MySQL に変えると PostgreSQL 用 RI は適用されない",
      "自動で適用",
      "Convertible に変換",
      "AWS Support で交換可能"
    ],
    a: 0,
    explain: "RDS RI はエンジン (MySQL / PostgreSQL / Oracle / SQL Server / MariaDB) ごとに分かれる。エンジンを変える可能性があれば購入を控えるか SP では補えない (RDS は SP 対象外)。"
  },
  { id: "risp-027", topic: "ri-sp", type: "single", difficulty: 2,
    q: "AWS の RI Recommendations が 1 年 No Upfront を推奨する典型シーン。",
    choices: [
      "前払いを避けたい / 利用予測の確度が中程度の場合",
      "全額前払いしたいとき",
      "Convertible にしたいとき",
      "Spot に切り替えたいとき"
    ],
    a: 0,
    explain: "No Upfront は初期投資 0 で月次支払い、割引率は最も控えめ。資金繰り重視か、需要予測の確度が中くらいの時に。"
  },
  { id: "risp-028", topic: "ri-sp", type: "single", difficulty: 3,
    q: "Compute SP を導入したことで EC2 の Auto Scaling のサイズが柔軟に動かせる。注意点は？",
    choices: [
      "ASG でファミリやサイズを変えても Compute SP は適用されるが、コミットメント時間額を超えるとオンデマンド料金になる",
      "SP は ASG を無効化する",
      "ASG では SP が使えない",
      "SP は Multi-AZ 必須"
    ],
    a: 0,
    explain: "Compute SP は柔軟だがコミット時間額に上限がある。スケールアウトで需要が大きく超えるとオンデマンド料金がそのまま乗る。需要予測とコミット量のバランス。"
  },
  { id: "risp-029", topic: "ri-sp", type: "single", difficulty: 2,
    q: "Reserved DB Instance を購入していたが、Aurora に移行した。",
    choices: [
      "RDS の Reserved DB Instance は RDS 用 SKU で、Aurora 用 RI とは別。Aurora 用は別途購入が必要 (本問では Aurora はスコープ外だが知識として)",
      "Aurora にそのまま流用される",
      "Convertible に変換可能",
      "AWS Support で返金"
    ],
    a: 0,
    explain: "RDS Reserved DB Instance は通常 RDS エンジン (MySQL/PostgreSQL/Oracle/SQL Server/MariaDB) 用。Aurora は別 SKU で、別途購入が必要。"
  },
  { id: "risp-030", topic: "ri-sp", type: "single", difficulty: 3,
    q: "3 年 All Upfront Compute SP の最大割引率は概ねどれくらいか。",
    choices: [
      "最大 66%",
      "最大 90%",
      "最大 25%",
      "最大 50%"
    ],
    a: 0,
    explain: "Compute SP の 3 年 All Upfront で最大 66% 程度。EC2 Instance SP は最大 72%、Standard RI も最大 72%。"
  },
  { id: "risp-031", topic: "ri-sp", type: "multi", difficulty: 3,
    q: "EC2 と RDS が同じファミリ (m5) を 24h 動かしている。コミット戦略として正しい組み合わせを 2 つ以上選べ。",
    choices: [
      "EC2 側は Compute SP / EC2 Instance SP / Standard RI のいずれかでカバー",
      "RDS 側は Reserved DB Instance を別途購入",
      "RDS は Compute SP でカバーされる",
      "EC2 は Reserved DB Instance でカバーされる"
    ],
    a: [0, 1],
    explain: "Compute SP は RDS に効かない、Reserved DB Instance は EC2 に効かない。両方買う必要がある。"
  },
  { id: "risp-032", topic: "ri-sp", type: "single", difficulty: 3,
    q: "毎月予算が±10% ぶれる EC2 ワークロードに対し、最も柔軟性とコスト削減のバランスが取れる選択は？",
    choices: [
      "ベースを 3 年 Standard RI / EC2 Instance SP、変動を 1 年 No Upfront Compute SP でカバー",
      "全てオンデマンド",
      "全て Spot",
      "全て 3 年 All Upfront EC2 Instance SP"
    ],
    a: 0,
    explain: "需要 90% 部分は長期高割引、10% 変動部分は短期柔軟枠。コミット量を 90% 想定に抑えると未消費リスクも下がる。"
  }
);
