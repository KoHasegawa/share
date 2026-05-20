/* リージョン / Free Tier — 20+ 問 */
window.QUIZ = window.QUIZ || { topics: [], questions: [] };
window.QUIZ.questions.push(

  // ===== リージョン価格差 =====
  { id: "rgf-001", topic: "region-free", type: "single", difficulty: 1,
    q: "AWS リージョン間で同じ EC2 インスタンスタイプの料金は？",
    choices: [
      "リージョンごとに単価が異なる (おおむね 10〜30% の差)",
      "全リージョン同一",
      "AZ ごとに異なる",
      "差は 1% 未満"
    ],
    a: 0,
    explain: "EC2 / RDS / EBS / 転送費などはリージョンによって単価が異なる。同じ要件で安いリージョンに置くことで節約できる場合がある (法令・レイテンシ要件と要バランス)。"
  },
  { id: "rgf-002", topic: "region-free", type: "single", difficulty: 1,
    q: "代表的な AWS リージョンのうち、一般に最安に近い傾向があるのは？",
    choices: [
      "us-east-1 (N. Virginia)",
      "ap-northeast-1 (Tokyo)",
      "eu-west-1 (Ireland)",
      "sa-east-1 (Sao Paulo)"
    ],
    a: 0,
    explain: "us-east-1 は最古かつインフラが大規模で安い傾向。ap-northeast-1 (東京) はその 10〜30% 高、sa-east-1 (サンパウロ) は他リージョンより高い傾向。"
  },
  { id: "rgf-003", topic: "region-free", type: "single", difficulty: 2,
    q: "災害復旧 (DR) サイトを別リージョンに置く際のコスト最適化として妥当な発想は？",
    choices: [
      "DR は普段アクセス少ないので、より安いリージョン + 小型インスタンス + Pilot Light / Warm Standby で待機",
      "DR はメインと同じスペックを常時動かす",
      "DR は Spot 専用",
      "DR は Multi-AZ Cluster で 3 倍コスト"
    ],
    a: 0,
    explain: "DR は『何かあった時だけフル稼働』。普段は小さく、必要時にスケールアップ。安いリージョンを使うとさらに費用効率が良い。"
  },
  { id: "rgf-004", topic: "region-free", type: "single", difficulty: 2,
    q: "ap-northeast-1 (東京) の利用がレイテンシ要件で必須でない場合、コスト面で検討に値する候補は？",
    choices: [
      "us-east-1 / us-west-2 / ap-south-1 (Mumbai) など安いリージョン (要件次第)",
      "全リージョンで同額なので無関係",
      "Marketplace のリージョン",
      "アジアでも ap-southeast-1 は東京より高い"
    ],
    a: 0,
    explain: "レイテンシ・データ主権・運用拠点などの条件を満たせば、安いリージョンへの移設で純粋にコスト削減できる。日本国内法的要件があれば東京 / 大阪一択。"
  },
  { id: "rgf-005", topic: "region-free", type: "single", difficulty: 2,
    q: "リージョン間データ転送費を抑える設計として推奨されるのは？",
    choices: [
      "アプリ・DB・キャッシュ・主要データを同一リージョン内に閉じる",
      "アクセスのたびに別リージョンの S3 を呼ぶ",
      "クロスリージョン Multi-AZ にする",
      "全リージョンに同時展開する"
    ],
    a: 0,
    explain: "クロスリージョン通信は GB 単価で課金。アプリの主要経路をリージョン内に閉じるだけで大幅削減になる。"
  },

  // ===== AZ =====
  { id: "rgf-010", topic: "region-free", type: "single", difficulty: 2,
    q: "リージョン内 AZ 間の料金として正しいものは？",
    choices: [
      "EC2 のオンデマンド単価そのものは AZ 間で同じ。AZ 跨ぎ通信に GB 単価のデータ転送費が乗る",
      "AZ ごとに EC2 料金が異なる",
      "AZ A だけ EC2 が無料",
      "AZ 数で割引"
    ],
    a: 0,
    explain: "EC2 や RDS の単価は AZ 間で差なし。クロス AZ 通信のデータ転送費が追加される。"
  },
  { id: "rgf-011", topic: "region-free", type: "single", difficulty: 1,
    q: "AZ 数を絞り Single-AZ にしたときの典型的なメリット / リスクは？",
    choices: [
      "Multi-AZ 比でインスタンス料金 / 転送料金が下がる代わりに、AZ 障害で全停止リスク",
      "Single-AZ は AWS で禁止",
      "Single-AZ は AZ 数で割引",
      "Single-AZ は SLA が高い"
    ],
    a: 0,
    explain: "コストと可用性のトレードオフ。本番は基本 Multi-AZ、検証 / 開発は Single-AZ で許容。"
  },

  // ===== Free Tier =====
  { id: "rgf-020", topic: "region-free", type: "single", difficulty: 1,
    q: "AWS Free Tier には大きく分けて 3 種類ある。組み合わせとして正しいものは？",
    choices: [
      "12 ヶ月無料 / 永続無料 / お試し (Trial)",
      "1 ヶ月無料 / 3 ヶ月無料 / 1 年無料",
      "Enterprise 限定 / Marketplace 限定 / 一般",
      "EC2 のみ / RDS のみ / S3 のみ"
    ],
    a: 0,
    explain: "Free Tier: (1) 新規アカウント 12 ヶ月の無料枠 (EC2 t2/t3.micro 750h など) (2) 永続無料 (Lambda 100 万リクエスト/月 など) (3) Trial (Inspector など)。"
  },
  { id: "rgf-021", topic: "region-free", type: "single", difficulty: 2,
    q: "EC2 の 12 ヶ月無料の代表的な内容は？",
    choices: [
      "t2.micro または t3.micro を月 750 時間 (1 インスタンス相当)",
      "全インスタンスタイプ無料",
      "Multi-AZ で 750 時間",
      "Spot 専用で無料"
    ],
    a: 0,
    explain: "750h / 月 = 1 台ぶん相当を 12 ヶ月。OS は Linux/Windows 両対応。RHEL / SLES など Marketplace 課金がある AMI を選ぶと OS ライセンス料は別途発生。"
  },
  { id: "rgf-022", topic: "region-free", type: "single", difficulty: 2,
    q: "RDS の 12 ヶ月無料の典型は？",
    choices: [
      "db.t3.micro / db.t4g.micro 750h + ストレージ 20 GB + バックアップ 20 GB",
      "全 RDS タイプ無料",
      "Multi-AZ db.t3.micro が 750h",
      "Oracle BYOL が 12 ヶ月無料"
    ],
    a: 0,
    explain: "RDS の 12 ヶ月無料: db.t3.micro / db.t4g.micro 750h + ストレージ 20 GB + 自動バックアップ 20 GB。Multi-AZ は対象外 (2 倍消費)。"
  },
  { id: "rgf-023", topic: "region-free", type: "single", difficulty: 2,
    q: "EBS の Free Tier として有名なのは？",
    choices: [
      "gp2 を月 30 GB",
      "io1 を月 30 GB",
      "st1 を月 100 GB",
      "Magnetic を月 50 GB"
    ],
    a: 0,
    explain: "EBS Free Tier: gp2 30 GB + 200 万 I/O + Snapshot 1 GB。12 ヶ月。"
  },
  { id: "rgf-024", topic: "region-free", type: "single", difficulty: 2,
    q: "EC2 のデータ転送アウト (Internet) のフリー枠は？",
    choices: [
      "月 100 GB まで永続無料 (アカウント全体合算、リージョン横断)",
      "月 1 GB のみ",
      "12 ヶ月無料",
      "完全に無料"
    ],
    a: 0,
    explain: "永続無料 100 GB / 月 (アカウント全体合算)。これを超えるとリージョン別単価で課金。"
  },
  { id: "rgf-025", topic: "region-free", type: "single", difficulty: 2,
    q: "Free Tier を超えた時に AWS から通知させる方法は？",
    choices: [
      "Billing Console で『Free Tier 使用アラート』を有効化 (デフォルト ON のことが多い)",
      "AWS Support に毎月問い合わせ",
      "Marketplace で購入",
      "CloudWatch アラームのみ"
    ],
    a: 0,
    explain: "Billing コンソールの Free Tier ページから閾値ベースの通知設定可能。請求アラート + Cost Anomaly Detection と組み合わせると安心。"
  },
  { id: "rgf-026", topic: "region-free", type: "single", difficulty: 2,
    q: "Free Tier 適用中の RDS で Multi-AZ にした場合の料金は？",
    choices: [
      "Multi-AZ にした分は Free Tier の対象外で課金される",
      "Multi-AZ も 12 ヶ月無料",
      "Single-AZ より安くなる",
      "Free Tier が無効化される"
    ],
    a: 0,
    explain: "Free Tier は Single-AZ db.t3.micro 1 台分。Multi-AZ にすると 2 台ぶんになり、超過分が課金。"
  },
  { id: "rgf-027", topic: "region-free", type: "single", difficulty: 2,
    q: "Free Tier の対象になるリージョンは？",
    choices: [
      "ほとんどの商用リージョン (一部、AWS GovCloud や中国は対象外 / 別ルール)",
      "us-east-1 のみ",
      "ap-northeast-1 のみ",
      "全リージョン同じ条件で対象"
    ],
    a: 0,
    explain: "Free Tier は商用リージョンで利用可能。GovCloud / China などは扱いが異なる。"
  },

  // ===== 通貨 / 税 =====
  { id: "rgf-030", topic: "region-free", type: "single", difficulty: 2,
    q: "AWS の請求通貨を変更できるか。",
    choices: [
      "アカウントの請求通貨は変更可能 (例: USD → JPY)。為替変動の影響を受けつつ請求書通貨で受け取る",
      "通貨は USD 固定",
      "リージョンによって自動決定",
      "AWS Support 経由のみ"
    ],
    a: 0,
    explain: "Billing Preferences で請求通貨を切替可能。JPY 受領にすると経理は楽だが為替差損益が生じることがある。"
  },
  { id: "rgf-031", topic: "region-free", type: "single", difficulty: 2,
    q: "日本のアカウントで AWS を利用した時の消費税の扱いは？",
    choices: [
      "日本居住者向けの請求には消費税が課税される (リバースチャージ等のルールに従う)",
      "AWS は非課税",
      "消費税は AWS が負担",
      "海外利用扱いで免税"
    ],
    a: 0,
    explain: "日本居住者向けは消費税対象 (10%)。コスト見積もりには税込で考えるのを忘れずに。"
  },
  { id: "rgf-032", topic: "region-free", type: "single", difficulty: 2,
    q: "AWS Local Zones / Wavelength の料金は？",
    choices: [
      "標準リージョンより高めの単価。レイテンシ要件が極端な場合のみ採用",
      "全て無料",
      "Spot 専用",
      "Free Tier 対象"
    ],
    a: 0,
    explain: "Local Zones / Wavelength は特殊ロケーション。標準より高いことが多い。一般 24h Web 用途では基本リージョンを使う。"
  },

  // ===== その他 =====
  { id: "rgf-040", topic: "region-free", type: "single", difficulty: 2,
    q: "新規 AWS アカウントを 12 ヶ月の Free Tier 期間中にコスト最適化する典型的な視点は？",
    choices: [
      "無料枠を意識して t3.micro と 20 GB ストレージ程度で抑える / 12 ヶ月後の本番運用を見据えてサイジングを学ぶ",
      "Free Tier 中は何台でも無料",
      "Multi-AZ を最大限活用",
      "全リージョンに展開"
    ],
    a: 0,
    explain: "学習・PoC 用途なら Free Tier の範囲内に収めるのが基本。Free Tier 終了後は突然請求が増えるので事前の準備が大事。"
  },
  { id: "rgf-041", topic: "region-free", type: "single", difficulty: 2,
    q: "AWS リージョンを 1 つ追加して二拠点化する時、コスト最適化の観点で最初に確認すべきは？",
    choices: [
      "リージョン間のデータ転送量 / レプリケーション転送料を見積もる",
      "AWS Support のサブスクリプション",
      "AMI の数",
      "Lambda の同時実行数"
    ],
    a: 0,
    explain: "二拠点化はリージョン間転送の固定費を生む。要件次第で『非常時のみ起動』『コールドスタンバイ』も検討。"
  },
  { id: "rgf-042", topic: "region-free", type: "single", difficulty: 2,
    q: "Free Tier 適用中のアカウントで EC2 を停止しても課金されるか。",
    choices: [
      "EBS / Public IPv4 / Snapshot 等が Free Tier 枠を超えていれば停止中も課金される",
      "Free Tier 中はすべて停止中無料",
      "停止すると 12 ヶ月が延長",
      "停止しても EC2 時間料金は発生"
    ],
    a: 0,
    explain: "Free Tier は『枠の範囲内まで』。Free Tier 枠を超えた利用は停止していても課金。"
  },
  { id: "rgf-043", topic: "region-free", type: "single", difficulty: 2,
    q: "新規アカウント作成 12 ヶ月の起算日は？",
    choices: [
      "アカウントを作成した日から 12 ヶ月後",
      "請求書発行日から 12 ヶ月",
      "最初に EC2 を起動した日から 12 ヶ月",
      "Free Tier は永続"
    ],
    a: 0,
    explain: "アカウント作成日が起点。期限が近づくと請求が跳ねるので、終了 1〜2 ヶ月前から見積もり直し。"
  }
);
