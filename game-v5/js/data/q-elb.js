/* ELB (ALB / NLB / CLB / GWLB) — 30+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  { id: "elb-001", topic: "elb", type: "single", difficulty: 1,
    q: "現代の AWS で「HTTP/HTTPS ベース」のロードバランサとして第一選択になるのは？",
    choices: ["ALB", "CLB", "NLB", "GWLB"],
    a: 0,
    explain: "ALB はレイヤー 7。HTTP/HTTPS パス・ホストベースルーティング、HTTP/2、WebSocket、認証、CloudWatch メトリクス充実、Cognito 認証、Lambda ターゲットなど豊富。基本これを選ぶ。"
  },
  { id: "elb-002", topic: "elb", type: "single", difficulty: 1,
    q: "TCP / UDP の超低レイテンシ・高スループットが要件のロードバランサは？",
    choices: ["NLB", "ALB", "CLB", "GWLB"],
    a: 0,
    explain: "NLB はレイヤー 4。TLS パススルー / 静的 IP / 数百万 req/s に対応。ゲームや IoT、独自 TCP プロトコル向け。"
  },
  { id: "elb-003", topic: "elb", type: "single", difficulty: 2,
    q: "ALB の課金における時間料金 + LCU の特徴で正しいものは？",
    choices: [
      "LCU は新規接続 / アクティブ接続 / 処理バイト / ルール評価のうち最大の値で 1 LCU 換算される",
      "LCU は単純にリクエスト数",
      "LCU は AZ 数のみで決まる",
      "LCU は EC2 ターゲット数"
    ],
    a: 0,
    explain: "ALB は 4 つの軸の中で『支配的な』要素で課金される。たとえば短時間に新規接続が多い API ゲートウェイ用途なら新規接続軸が支配的。"
  },
  { id: "elb-004", topic: "elb", type: "single", difficulty: 2,
    q: "ALB の LCU 1 単位に相当する性能の目安として正しいものは？",
    choices: [
      "新規接続 25/s, アクティブ接続 3000/分, 処理 1 GB/h, ルール評価 1000/s のいずれか",
      "1 LCU = 1 リクエスト",
      "1 LCU = 1 EC2 ターゲット",
      "1 LCU = 1 ヶ月分の AZ 料金"
    ],
    a: 0,
    explain: "LCU 1 単位の換算 (概数): 新規接続 25 NCPS, アクティブ接続 3000/分, 処理 1 GB/h, ルール評価 1000 ER/s。実際の請求は最大の軸 × 時間あたり LCU 数 × $0.008 程度。"
  },
  { id: "elb-005", topic: "elb", type: "single", difficulty: 2,
    q: "ALB の Cross-Zone Load Balancing のデフォルトと料金影響は？",
    choices: [
      "デフォルト ON、追加課金なし (ただし AZ 跨ぎ通信は別途データ転送料が発生し得る)",
      "デフォルト OFF",
      "Cross-Zone を有効にすると LCU が倍",
      "Cross-Zone は有料の独自ライセンス"
    ],
    a: 0,
    explain: "ALB は Cross-Zone デフォルト ON。データ転送料そのものは AZ 間で発生し得るが、Cross-Zone 機能自体に追加料金はない。"
  },
  { id: "elb-006", topic: "elb", type: "single", difficulty: 3,
    q: "NLB の Cross-Zone Load Balancing のデフォルトとコスト面の特徴は？",
    choices: [
      "デフォルト OFF。有効化するとリージョン内データ転送料が乗る",
      "デフォルト ON で AZ 跨ぎが無料",
      "NLB は Cross-Zone を切れない",
      "NLB は Cross-Zone が必ず有料"
    ],
    a: 0,
    explain: "NLB は Cross-Zone デフォルト OFF。AZ 越え通信は別途リージョン内データ転送料金が乗るため、ON にすると課金される点に注意。"
  },
  { id: "elb-007", topic: "elb", type: "single", difficulty: 2,
    q: "ALB の固定時間料金は概ねどれくらいか (us-east-1 想定、概算)。",
    choices: [
      "$0.025/h 前後",
      "$0.0001/h 前後",
      "$1/h 前後",
      "$0.50/h 前後"
    ],
    a: 0,
    explain: "ALB の時間料金は約 $0.025/h (リージョンで変動)。1 ヶ月 24h ≒ $18 前後 + LCU 課金。NLB はやや高めだが同オーダー。"
  },
  { id: "elb-008", topic: "elb", type: "single", difficulty: 2,
    q: "NLB の処理バイトに対する課金単位 (NLCU) の特徴として正しいのは？",
    choices: [
      "TCP/UDP の新規フロー数 / アクティブフロー数 / 処理バイト数 / TLS 接続のうち最大値で計算される",
      "NLB は処理バイトに対する課金がない",
      "リクエスト 1 件あたり $0.10",
      "AZ 数のみで決まる"
    ],
    a: 0,
    explain: "NLB の NLCU も ALB の LCU と類似で、複数軸のうち支配的なもので時間あたり課金。"
  },
  { id: "elb-009", topic: "elb", type: "single", difficulty: 1,
    q: "ALB / NLB / CLB に共通する課金構造は？",
    choices: [
      "稼働時間料金 (常時 ON のあいだ発生)",
      "リクエスト 1 件あたり $1",
      "AZ あたり $5",
      "EC2 ターゲット数のみ"
    ],
    a: 0,
    explain: "LB はいずれも『時間料金 + キャパシティ系の従量』が基本構造。LB を作って放置するだけでも 1 ヶ月数千〜数万円かかる。未使用 LB は早めに削除。"
  },
  { id: "elb-010", topic: "elb", type: "multi", difficulty: 2,
    q: "ALB のコスト最適化として有効な手段を 2 つ以上選べ。",
    choices: [
      "未使用 ALB を削除する",
      "同一サービスで重複した ALB を統合する",
      "Lambda ターゲットを増やせば LCU は減る",
      "リスナールールを整理して評価回数を減らす"
    ],
    a: [0, 1, 3],
    explain: "ALB の数を減らす、無駄なルールを減らすことが直接削減。Lambda ターゲット数は LCU と無関係 (むしろ Lambda 自体の料金がかかる)。"
  },
  { id: "elb-011", topic: "elb", type: "single", difficulty: 2,
    q: "古い CLB を ALB / NLB に移行するメリットとして「コスト面」で最も大きいのは？",
    choices: [
      "ALB / NLB のほうがリクエストあたりの単価が改善されている (機能性も豊富)",
      "CLB はリクエストごとに $0.10 課金される",
      "CLB は Multi-AZ できないので可用性のために移行が必要",
      "ALB は無料"
    ],
    a: 0,
    explain: "CLB はリクエスト課金体系で、現在の ALB / NLB に比べると非効率になりやすい。機能・コスト両面で移行が一般的なお勧め。"
  },
  { id: "elb-012", topic: "elb", type: "single", difficulty: 2,
    q: "Gateway Load Balancer (GWLB) の用途と課金は？",
    choices: [
      "サードパーティのファイアウォール / IDS 等を VPC に挟むための仕組み。時間料金 + GLCU (GWLB 用 LCU) で課金",
      "汎用 Web アプリ用",
      "RDS のロードバランサ",
      "Lambda のロードバランサ"
    ],
    a: 0,
    explain: "GWLB はネットワーク仮想アプライアンスを透過に挟む特殊な LB。本問の範囲 (一般 24h Web サーバ) で出番は少ないが存在は知っておく。"
  },
  { id: "elb-013", topic: "elb", type: "single", difficulty: 2,
    q: "ALB / NLB の Multi-AZ 構成の料金面の特徴は？",
    choices: [
      "AZ 数を増やしても LB の固定時間料金は同じ。データ転送 (Cross-Zone) と LCU 課金で影響が出る",
      "AZ ごとに LB が別途課金される",
      "AZ 数によって時間料金が倍",
      "Multi-AZ は無料化される"
    ],
    a: 0,
    explain: "ALB / NLB は AZ 数を増やしても LB の時間料金そのものは増えない (1 LB として課金)。実コストは LCU と AZ 跨ぎデータ転送に出る。"
  },
  { id: "elb-014", topic: "elb", type: "single", difficulty: 2,
    q: "NLB に EIP / Public IPv4 を貼り付けた場合の課金は？",
    choices: [
      "2024-02 以降は Public IPv4 アドレス課金が NLB の Public IP に対しても発生する",
      "NLB の IP は無料化される",
      "EIP は無料",
      "NLB の Public IP は時間課金なし"
    ],
    a: 0,
    explain: "Public IPv4 課金は EC2 のみならず ALB / NLB / NAT GW / RDS Public 等の Public IP も対象。可能なら集約 / IPv6 化。"
  },
  { id: "elb-015", topic: "elb", type: "single", difficulty: 1,
    q: "LB なしで EC2 1 台にトラフィックを直接送る構成は、コスト面でどう評価すべきか。",
    choices: [
      "LB の時間料金を回避できるが、可用性 / 拡張性 / 終端 TLS / 監視メトリクスが大幅に下がる",
      "LB ありとコストは変わらない",
      "LB なしは AWS 規約違反",
      "LB なしのほうが高くなる"
    ],
    a: 0,
    explain: "コスト削減のために LB を外すのは小規模 / 開発環境では有効。本番 24h 運用では基本 LB あり。LB 1 台月 $20 程度は冗長性の保険として安い。"
  },
  { id: "elb-016", topic: "elb", type: "single", difficulty: 2,
    q: "LB の TLS 終端を ALB で行うときの追加課金は？",
    choices: [
      "TLS 終端そのものに固定料金はないが、新規 TLS 接続数 / 処理バイトが LCU に反映され料金に影響する",
      "TLS 接続ごとに $0.01",
      "TLS は完全無料",
      "TLS は EC2 側でしか終端できない"
    ],
    a: 0,
    explain: "ALB の TLS 終端は LCU の構成要素にすでに含まれる。証明書は ACM 経由なら無料 (パブリックドメイン用)。"
  },
  { id: "elb-017", topic: "elb", type: "single", difficulty: 2,
    q: "ALB のリスナールール (Listener Rule) を 100 個に増やすとコスト面の懸念は？",
    choices: [
      "ルール評価 (LCU のうち Rule Evaluations 軸) が支配的になり LCU が増える可能性",
      "ALB の時間料金が倍になる",
      "AZ 数が増える",
      "RDS の Multi-AZ が必須になる"
    ],
    a: 0,
    explain: "ルール数 × トラフィック量 が大きいと Rule Evaluations 軸が支配的になり LCU 課金に効く。ルールはまとめる / Path-based ルーティングを効率化。"
  },
  { id: "elb-018", topic: "elb", type: "single", difficulty: 1,
    q: "Application LB / Network LB は 1 つで複数 AZ をカバーできるか。",
    choices: [
      "サブネット (= AZ) を複数指定して 1 つの LB で複数 AZ にデプロイできる",
      "1 つの LB は 1 つの AZ のみ",
      "AZ ごとに別の LB を作る必要がある",
      "LB は AZ 横断不可"
    ],
    a: 0,
    explain: "1 LB で複数 AZ のサブネットを跨ぐデプロイ。Multi-AZ 構成の標準。LB 固定時間料金は 1 LB ぶんで済む。"
  },
  { id: "elb-019", topic: "elb", type: "single", difficulty: 2,
    q: "未使用 ALB を削除しないと月いくら程度の無駄になるか (us-east-1 想定、LCU 課金は最小と仮定)。",
    choices: [
      "$18〜20 程度の固定費 (時間料金) は最低でも発生",
      "完全無料",
      "$100/月以上",
      "$1/月"
    ],
    a: 0,
    explain: "ALB は時間料金だけで $18/月程度。LCU が乗ればさらに上乗せ。Trusted Advisor の『Idle Load Balancers』検査で発見可能。"
  },
  { id: "elb-020", topic: "elb", type: "single", difficulty: 2,
    q: "LB のターゲット EC2 を Spot 化するとコスト面のメリット / リスクは？",
    choices: [
      "EC2 単価は安いが、Spot 中断時はターゲットからドレインされる必要があり、Connection Draining (Deregistration Delay) を適切に設定しないと一時的に 5xx 増加",
      "Spot 化すると ALB も無料",
      "Spot は LB と併用不可",
      "LB の時間料金が下がる"
    ],
    a: 0,
    explain: "Spot 中断時の Graceful な退避のため、ALB の Deregistration Delay や ASG の Capacity Rebalance を活用。料金は下がるが運用設計が増える。"
  },
  { id: "elb-021", topic: "elb", type: "single", difficulty: 2,
    q: "ALB に対して WAF (AWS WAF) を関連付けた場合の追加課金は？",
    choices: [
      "WAF の Web ACL の固定月額 + ルール数 + Request 課金",
      "WAF は無料",
      "ALB の時間料金が倍",
      "WAF は CloudFront 限定"
    ],
    a: 0,
    explain: "WAF の課金: Web ACL ($5/月)、Rule ($1/月 × ルール数)、リクエスト ($0.6/百万 etc)。WAF 設置するなら年間で数百〜数千ドル増える前提。"
  },
  { id: "elb-022", topic: "elb", type: "single", difficulty: 2,
    q: "ALB のアクセスログを S3 に書き出した時の料金は？",
    choices: [
      "S3 のストレージ + PUT リクエスト料金。ALB 側は無料。S3 ライフサイクルでアーカイブが望ましい",
      "ALB 側で $0.01/GB",
      "完全無料",
      "CloudWatch Logs に転送される"
    ],
    a: 0,
    explain: "ALB アクセスログは S3 保存。ALB は無料、S3 側でストレージ + リクエスト料が発生。ログを長期保存するなら S3 Glacier 等にライフサイクル。"
  },
  { id: "elb-023", topic: "elb", type: "single", difficulty: 2,
    q: "ALB のメトリクスを CloudWatch で詳細に取り続けると料金面で気をつけるべきは？",
    choices: [
      "標準メトリクスは無料だが、カスタムメトリクスや 1 分粒度 / 1 秒粒度の高頻度メトリクスは別途課金されることがある",
      "ALB のメトリクスは全て無料",
      "ALB は CloudWatch を使えない",
      "CloudWatch Logs に課金が発生する"
    ],
    a: 0,
    explain: "標準 (5 分粒度) は無料。1 分粒度の Detailed Monitoring は EC2 では追加課金。ALB の標準メトリクスは無料だがログ / 高解像度のアラームは課金対象。"
  },
  { id: "elb-024", topic: "elb", type: "single", difficulty: 1,
    q: "ALB / NLB に対する DNS 名は固定 IP か。",
    choices: [
      "ALB は DNS 名のみ (IP は変動)、NLB は静的 IP / EIP を割り当て可能",
      "両者とも固定 IP",
      "両者とも DNS 名のみ",
      "両者とも IP 固定不可"
    ],
    a: 0,
    explain: "ALB は IP が AWS 側で動的に管理され、CNAME で参照。NLB は AZ ごとに静的 IP / EIP を割り当てられる。Public IPv4 課金の影響に留意。"
  },
  { id: "elb-025", topic: "elb", type: "single", difficulty: 2,
    q: "NLB と ALB の選定で『コストパフォーマンス』面に影響しやすい違いは？",
    choices: [
      "ALB は HTTP/HTTPS のリクエストヘッダー解析・パスベース・認証等が可能だがレイヤー 7 処理のためスループット当たり LCU が高くなりやすい。NLB は L4 で軽量。",
      "ALB のほうが常に安い",
      "NLB のほうが常に安い",
      "両者は同価格"
    ],
    a: 0,
    explain: "用途次第。HTTP の高度なルーティングなら ALB、純粋な高速転送なら NLB。誤って NLB を Web 用途に使うと WAF / 認証等が出来ず別途実装コストが増える。"
  },
  { id: "elb-026", topic: "elb", type: "single", difficulty: 2,
    q: "古い CLB を ALB に移行する作業のコストとして見落としやすいのは？",
    choices: [
      "DNS CNAME 切替 / クライアントの IP 直接利用見直し / セキュリティグループ整備など、移行に関わる作業工数",
      "ALB は別途月額 $500 の契約料金",
      "CLB は移行不可",
      "Marketplace から購入が必要"
    ],
    a: 0,
    explain: "ALB / NLB に移すと運用コストは下がるが、移行作業 (テスト・切替) の工数は無視できない。クライアントが IP 直接参照しているケースなど要確認。"
  },
  { id: "elb-027", topic: "elb", type: "single", difficulty: 1,
    q: "Multi-AZ 構成で『コスト最小化』を優先する場合、ALB / NLB の AZ 数として現実的な選択は？",
    choices: [
      "本番は最低 2 AZ。1 AZ にしてしまうと AZ 障害で全停止リスク",
      "1 AZ で十分",
      "5 AZ 以上必須",
      "AZ 数は LB 課金に直接影響する"
    ],
    a: 0,
    explain: "ALB / NLB の固定費は AZ 数で変わらないが、本番は 2 AZ 以上が常識。3 AZ 構成のほうが障害耐性は更に高いが、サブネット設計コストとデータ転送量の増加を考慮。"
  },
  { id: "elb-028", topic: "elb", type: "single", difficulty: 2,
    q: "ALB を Internal Scheme (内部 LB) にすると料金は変わるか。",
    choices: [
      "時間料金 / LCU 料金は基本同じ。Public IPv4 を使わない分だけ Public IPv4 課金を回避できる",
      "Internal は無料",
      "Internal は倍額",
      "Internal は LCU が 2 倍"
    ],
    a: 0,
    explain: "Internal LB は VPC 内通信のみ。Public IPv4 課金が発生しないのが利点。アーキ的にも Public 経路を絞れてセキュリティが上がる。"
  },
  { id: "elb-029", topic: "elb", type: "single", difficulty: 2,
    q: "ALB のリスナー数を増やすと料金に与える影響は？",
    choices: [
      "リスナー数自体には直接の課金はないが、TLS 接続数 / ルール数 経由で LCU に影響することがある",
      "リスナーごとに $0.01/h 課金",
      "リスナー 5 個以上で固定費が倍",
      "リスナー数で AZ 数が決まる"
    ],
    a: 0,
    explain: "リスナーは構成要素として無料。LCU への寄与経由でコスト影響が出る。"
  },
  { id: "elb-030", topic: "elb", type: "single", difficulty: 1,
    q: "EC2 が 1 台でも本番なら ALB を立てる意味はあるか (コスト面で)。",
    choices: [
      "TLS 終端 / セキュリティグループの集約 / WAF 連携 / 障害時切替などの保険として ALB の月 $20 程度は通常許容範囲",
      "ALB は無料",
      "1 台なら ALB 不要 (1 円も使わないため)",
      "ALB はターゲット 2 台以上必須"
    ],
    a: 0,
    explain: "ALB はターゲット 1 台でも可。月 $20〜 程度を払って TLS / WAF / 監視メリットを取るのが本番では一般的。"
  },
  { id: "elb-031", topic: "elb", type: "single", difficulty: 2,
    q: "ALB に対する HTTP リクエストが急激に増えたとき、LCU の構成要素のうち急増しやすいのは？",
    choices: [
      "新規接続 (NCPS) / 処理バイト",
      "AZ 数",
      "EC2 ターゲット数",
      "リスナー数"
    ],
    a: 0,
    explain: "急激な流入は新規接続と処理バイトに直結。アクセスログ + CloudWatch メトリクスで支配軸を把握すると最適化方針が立てやすい。"
  },
  { id: "elb-032", topic: "elb", type: "single", difficulty: 2,
    q: "ALB の HTTP/HTTPS 接続を Keep-Alive (再利用) する設計でコスト面のメリットは？",
    choices: [
      "新規接続 (NCPS) が減るので LCU 課金が下がる + クライアント遅延も改善",
      "Keep-Alive は LCU に無関係",
      "Keep-Alive は ALB で禁止",
      "Keep-Alive を切ったほうが安い"
    ],
    a: 0,
    explain: "Keep-Alive を活用するとコネクション再利用で新規接続軸が下がる → LCU 削減。ベンチや実トラフィックで NCPS が支配なら有効策。"
  }
);
