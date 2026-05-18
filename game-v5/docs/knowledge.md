# AWS Cost Optimizer Dojo — ナレッジ集

500 問の元ネタを 1 ページに凝縮したリファレンス。各セクションの「数字」を覚えると本問の半分は解ける。

## 1. EC2 料金モデル

### 1.1 課金単位
- Linux / Ubuntu / Amazon Linux: **秒単位**、最小 60 秒
- Windows / RHEL / SLES: **時間単位** (端数切り上げ)
- Reboot は連続稼働扱いで課金継続
- Stop でインスタンス時間は止まる、EBS は継続課金
- Terminate でルート EBS は DeleteOnTermination=true により削除、追加 EBS は残る

### 1.2 オンデマンド以外の購入オプション
| 種類 | 期間 | 柔軟性 | 最大割引 |
|---|---|---|---|
| Standard RI | 1/3 年 | 属性固定 (サイズ柔軟性は条件あり) | ~72% |
| Convertible RI | 1/3 年 | 同等以上の RI に交換可 | ~66% |
| Compute SP | 1/3 年 | EC2/Fargate/Lambda 横断 | ~66% |
| EC2 Instance SP | 1/3 年 | 特定リージョン × ファミリ | ~72% |
| Spot | なし | 中断あり (2分前通知) | ~90% |
| Dedicated Host | 物理サーバ専有 (BYOL 対応) | - | - |

### 1.3 RI のサイズ柔軟性
- 条件: **Linux/UNIX + default tenancy + Regional**
- normalization factor: nano=0.25, micro=0.5, small=1, medium=2, large=4, xlarge=8, 2xlarge=16, ...
- m5.large 1 台 RI = m5.small 4 台ぶんに按分可能

### 1.4 RI / SP 適用順序
1. **Reserved Instance**
2. **EC2 Instance Savings Plans**
3. **Compute Savings Plans**
4. **オンデマンド**

### 1.5 RI Marketplace
- **Standard RI のみ** 売却可、Convertible は不可
- 売却条件: 米国の銀行口座・住所、購入後 30 日経過、残期間 1 ヶ月以上

### 1.6 730 時間ルール
- 月額表示は概ね 8760h / 12 = **730 時間**
- 24h × 30 日は 720h、24h × 31 日は 744h で月により若干異なる

## 2. EC2 インスタンス選定

### 2.1 ファミリ
- t: バーストパフォーマンス
- m: 汎用 (1 vCPU : 4 GiB)
- c: コンピュート最適化 (1 vCPU : 2 GiB)
- r: メモリ最適化 (1 vCPU : 8 GiB)
- x / x1e / x2idn: メモリ拡張 (1 vCPU : 16+ GiB)
- i / d: ストレージ最適化 (NVMe / HDD)

### 2.2 プロセッサ
- `i` Intel
- `a` AMD (約 10% 安)
- `g` AWS Graviton (ARM、約 20% 安)

### 2.3 サイズ倍率
- 1 段階アップで vCPU / RAM / 価格が **概ね 2 倍**
- m5.large → m5.xlarge は 2 倍、m5.2xlarge は 4 倍 (vs large)

### 2.4 T 系の Unlimited / Standard
- Unlimited: クレジット切れでもバースト可能、超過分は **vCPU 時間あたり追加課金**
- Standard: クレジット切れたらベースラインに張り付き、超過課金なし
- T3 以降は **Unlimited がデフォルト**

### 2.5 OS のコスト差
- Linux/Ubuntu (OSS): 安い
- RHEL/SLES: ライセンス込みで割高
- Windows: ライセンス込みで割高、サイズ柔軟性なし

## 3. EBS / スナップショット

### 3.1 タイプ
| Type | 用途 | IOPS | スループット |
|---|---|---|---|
| gp3 | 汎用 (推奨) | 3000 baseline、最大 16000 | 125 MB/s baseline、最大 1000 |
| gp2 | 汎用 (旧) | 3 IOPS/GB (最小100、最大16000) | 容量連動 |
| io1 | 高 IOPS | 最大 64000 (Nitro) | - |
| io2 | 高 IOPS + 高耐久 | 最大 64000 (Block Express で 256K) | - |
| st1 | スループット最適 HDD | - | 最大 500 MB/s |
| sc1 | コールド HDD | - | - |
| Magnetic (standard) | 旧世代非推奨 | - | - |

### 3.2 gp3 のベースライン
- **3000 IOPS / 125 MB/s** が容量料金に含まれる
- 超過分は IOPS / Throughput それぞれ独立課金
- RDS gp3 は **400 GB 以上**で追加プロビジョン可能 (エンジン依存)

### 3.3 Snapshot
- 保管先は AWS 管理 S3 (見えない)
- **増分式** (初回フル、以降変更ブロック)
- AMI deregister でも Snapshot は残る → 孤児スナップショット
- Snapshot Archive: 75% 安い、最小 90 日保持
- Recycle Bin: 誤削除リカバリ (保持料金は発生)
- DLM (Data Lifecycle Manager) で自動世代管理

### 3.4 容量とプロビジョン
- EBS は **プロビジョン容量で課金** (中身が空でも同じ)
- 未使用 EBS / 停止インスタンスの EBS は課金継続
- EC2 Terminate 時、追加データ EBS はデフォルトで残る (DeleteOnTermination=false)

## 4. データ転送 / VPC

### 4.1 Internet 転送
- IN (Inbound): **無料**
- OUT (Outbound): $0.09/GB 前後 (リージョン差・階段式割引)
- 永続 Free Tier: **月 100 GB アウト無料** (アカウント全体)

### 4.2 リージョン内通信
- 同 AZ + プライベート IP: 無料
- 同 AZ + Public IP / EIP: **課金あり** (リージョン内データ転送)
- クロス AZ: **双方向**で $0.01/GB 程度
- クロスリージョン: GB 単価で課金 ($0.02〜$0.09)

### 4.3 Public IPv4 課金 (2024-02 〜)
- **使っているだけで** $0.005/h
- EIP 関連付け有無に関わらず
- 対象: EC2 / NAT GW / ALB / NLB / RDS Public / EIP すべて

### 4.4 NAT Gateway
- 時間料金 ~$0.045/h
- データ処理 ~$0.045/GB
- AZ ごとに置く必要があれば固定費 × AZ 数
- 代替: VPC Endpoint (Gateway 型 S3/DynamoDB は無料、Interface 型は ENI 課金)

### 4.5 VPC Endpoint
- Gateway 型 (S3 / DynamoDB): **無料**
- Interface 型 (PrivateLink): **AZ × ENI 時間 + データ処理 GB**
- 損益分岐は『データ量 × NAT GW 単価』vs『Endpoint 時間 × AZ 数』

### 4.6 VPC Peering / TGW
- Peering: 接続無料、データ転送に GB 単価
- TGW: アタッチメント時間 + データ処理

## 5. ELB

### 5.1 タイプ
- ALB: L7 (HTTP/HTTPS), 時間 + LCU
- NLB: L4 (TCP/UDP), 時間 + NLCU、静的 IP / EIP 可
- CLB: 旧世代、新規非推奨
- GWLB: ネットワーク仮想アプライアンス用

### 5.2 ALB の LCU
- 4 軸 (新規接続/秒, アクティブ接続, 処理バイト, ルール評価) のうち **最大値** で算出
- 1 LCU の目安: 25 NCPS / 3000 アクティブ接続 / 1 GB-h / 1000 ルール評価
- LCU 単価 ~$0.008/LCU-h

### 5.3 Cross-Zone
- ALB: デフォルト **ON**、追加課金なし (データ転送は別)
- NLB: デフォルト **OFF**、有効化でリージョン内転送料

## 6. RDS 基礎

### 6.1 インスタンスクラス
- db.t (バースト), db.m (汎用), db.r (メモリ最適化), db.x (大メモリ)
- Graviton (db.*.g) は ~20% 安
- サイズアップで料金約 2 倍

### 6.2 エンジン
- MySQL / PostgreSQL / MariaDB: OSS、追加ライセンス料なし
- Oracle: SE2 (LI / BYOL)、EE (BYOL のみ)
- SQL Server: Express (無料) / Web / Standard / Enterprise

### 6.3 Multi-AZ
- 従来 Multi-AZ: 2 ノード、Standby は Read 不可、料金約 **2 倍**
- Multi-AZ Cluster (MySQL/PostgreSQL): 3 ノード、Reader 活用可能、料金約 **3 倍**

### 6.4 停止 (Stop)
- 最大 **7 日** で自動起動
- リードレプリカ付きは Stop 不可
- Stop 中も ストレージ・バックアップ・PI 等は課金継続

### 6.5 Reserved DB Instance
- 1 年 / 3 年、最大 ~69% 割引
- All / Partial / No Upfront
- サイズ柔軟性: 同一エンジン × 同一ファミリ内で按分 (Oracle LI / SQL Server LI は対象外)
- Single-AZ / Multi-AZ で SKU 別 (Multi-AZ 用は Single-AZ にも按分可)
- **Convertible / Marketplace 売却なし**

## 7. RDS ストレージ

### 7.1 タイプ
- gp3 (新規推奨), gp2 (旧汎用), io1, io2, Magnetic (非推奨)
- HDD (st1/sc1) は RDS では基本提供されない

### 7.2 ベースライン
- gp3: 3000 IOPS / 125 MB/s
- gp2: 3 IOPS/GB (最小 100, 最大 16000)

### 7.3 Multi-AZ
- ストレージも同期されるため料金は **2 倍**
- 容量 × 2 + 追加 IOPS × 2 + スループット × 2

### 7.4 拡張・縮小
- 拡張: Modify でオンライン可、6 時間に 1 回まで
- **縮小: 不可** (再構築が必要)
- Autoscaling は拡張のみ、Max を設定して上限を絞る

## 8. RDS バックアップ / レプリカ

### 8.1 自動バックアップ
- 保持 0〜35 日
- DB ストレージサイズ以下までは **無料**、超過分が GB-month 課金
- DB 削除で保持期間に従い削除 (Retain で延長可)

### 8.2 PITR
- 自動バックアップ + トランザクションログから復元
- 復元は新インスタンスとして作成

### 8.3 手動 Snapshot
- 削除しない限り保管料が継続
- クロスリージョンコピー / S3 Export 可
- Final Snapshot も手動 Snapshot 扱い

### 8.4 リードレプリカ
- RDS for MySQL / MariaDB / PostgreSQL は最大 5
- インスタンス料金 + ストレージ料金が別途発生
- RI 適用対象 (条件一致時)
- クロスリージョン Replica は転送料金が継続

## 9. RI / SP 応用

### 9.1 戦略の組み立て
1. Right-Sizing → 利用安定化
2. ベースを長期 (3 年 Standard RI / EC2 Instance SP)
3. 変動分を短期 / 柔軟 (1 年 Compute SP)
4. Utilization / Coverage を継続監視

### 9.2 アカウント共有
- Organizations 配下で RI Discount Sharing / SP Discount Sharing がデフォルト有効
- アカウント単位で除外可

### 9.3 適用順 (再掲)
RI → EC2 Instance SP → Compute SP → オンデマンド

## 10. コスト管理ツール

| ツール | 料金 | 主用途 |
|---|---|---|
| Cost Explorer | 無料 (API のみ有料) | 時系列分析 |
| Budgets | 2 つまで無料、以降 1 Budget あたり ~$0.02/日 | 閾値通知 / Actions |
| Cost and Usage Report (CUR) | 無料 (S3 課金のみ) | 最詳細生データ |
| Trusted Advisor | フルは Business 以上 | Idle / 未利用検出 |
| Compute Optimizer | 基本無料 (Enhanced は有料) | Right-Sizing 推奨 |
| Pricing Calculator | 無料 | 見積もり |
| Cost Anomaly Detection | 無料 | 異常検知 |
| Cost Allocation Tags | タグ自体無料 (最大 500 Active) | 配賦 |
| Cost Optimization Hub | 無料 | 推奨集約 |

### 10.1 タグ運用
- Cost Allocation Tag は **有効化以降から反映** (遡及不可)
- Organizations の Tag Policies + AWS Config + SCP で必須化 / 監査

### 10.2 Billing メトリクス
- CloudWatch の EstimatedCharges は **us-east-1 限定**

## 11. リージョン / Free Tier

### 11.1 リージョン差
- us-east-1 が最安傾向
- ap-northeast-1 は 10〜30% 高
- sa-east-1 / Local Zones / Wavelength は更に高め

### 11.2 12 ヶ月 Free Tier
- EC2: t2/t3.micro 750h
- RDS: db.t3/t4g.micro 750h, ストレージ 20 GB, バックアップ 20 GB
- EBS: gp2 30 GB, スナップショット 1 GB

### 11.3 永続 Free Tier
- Internet 転送アウト: 月 100 GB
- Lambda: 月 100 万リクエスト + 40 万 GB-秒
- CloudWatch: 標準メトリクス 10 個 / 3 ダッシュボード等

## 12. その他の細かい数字

- ALB 時間料金: ~$0.025/h (us-east-1)
- NAT GW 時間料金: ~$0.045/h
- NAT GW データ処理: ~$0.045/GB
- VPC Interface Endpoint: ~$0.01/h × AZ + $0.01/GB
- gp3 単価: ~$0.08/GB-月、IOPS ~$0.005/IOPS-月、スループット ~$0.04/MB/s-月
- EBS Snapshot: ~$0.05/GB-月、Archive ~$0.0125/GB-月
- RDS gp3: ~$0.115/GB-月、Backup ~$0.095/GB-月 (超過)
- Public IPv4: $0.005/h

## 13. 「24h サーバを最適化する手順」要約

1. **見える化**: Cost Explorer / Cost Anomaly Detection / Budgets
2. **棚卸し**: Trusted Advisor / 未使用 EIP・EBS・Snapshot・AMI・ALB・Replica
3. **Right-Sizing**: Compute Optimizer + CloudWatch (メモリは Agent)
4. **構成最適化**: VPC Endpoint, gp3, AZ アフィニティ, Public IP 集約, CloudFront
5. **コミット**: Standard RI / EC2 Instance SP / Compute SP の層別購入
6. **継続運用**: タグ運用、月次レビュー、Cost Optimization Hub
