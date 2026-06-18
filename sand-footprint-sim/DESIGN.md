# 犬の足跡付き砂浜シミュレーター 設計書

> Three.js による、ブラウザ単体で動作するスマホ向けリアルタイム砂浜足跡シミュレーター

---

## 1. 概要

### 1.1 目的
ブラウザ単体（外部サーバー・外部アセット不要）で動作する、スマホ向けのリアルな砂浜足跡シミュレーターを実装する。ユーザーが画面を指でなぞると、その軌跡に沿って犬の足跡が連続生成され、砂面が実際に3D的に凹んで見える。

### 1.2 体験のコアバリュー
- **触覚的な気持ちよさ**: 指でなぞるだけで足跡が自然な向き・間隔で生まれる。
- **物理的なリアリティ**: 足跡は単なる画像オーバーレイではなく、砂面の高さが実際に変位し、斜光で凹凸が立体的に見える。
- **時間変化**: 新しい足跡は深く濃く、時間とともに浅く・薄くなる。
- **リセット演出**: 「Wash」ボタンで波が流れ、足跡を洗い流す。

### 1.3 非目標（スコープ外）
- 海・常時の波アニメーション表現（Washボタンの一回限りの演出のみ）。
- 複数足跡タイプの初期実装（差し替え可能な構造のみ用意し、初期は犬1種）。
- マルチプレイ・永続化・バックエンド連携。

---

## 2. 技術スタック・前提

| 項目 | 採用 |
|------|------|
| 言語 | TypeScript |
| ビルド | Vite |
| 3D | Three.js (r0.16x 以降想定) |
| レンダラ | WebGPURenderer 優先 / WebGLRenderer (WebGL2) フォールバック |
| UI | lil-gui |
| フレームワーク | React 不使用（バニラ TS + DOM） |
| 対象端末 | iPhone Safari を主ターゲット、目標 30FPS 前後 |

> **【実装決定 2026-06-18】**: 初期実装は **WebGL2 専用（`WebGLRenderer` 固定）** とする。理由は (1) iPhone Safari の WebGPU が現状不安定、(2) 砂シェーダーを `MeshStandardMaterial + onBeforeCompile`(GLSL) で実装したため WebGPU では効かない、(3) 実ターゲット端末で確実に正しく描画することを優先。将来 TSL 化すれば本節の WebGPU 優先方針へ戻せる構造は維持する。

### 2.1 WebGPU / WebGL2 フォールバック方針（将来方針・現状未使用）
- 起動時に `navigator.gpu` の有無と `WebGPURenderer` の初期化成否を判定。
- 成功すれば WebGPU、失敗・非対応なら WebGL2 (`WebGLRenderer`) を使用。
- **シェーダー記述の二重化を避けるため、Three.js の TSL（Three Shading Language / node materials）を第一候補とする。** TSL は WebGPU/WebGL2 双方に同一記述からコンパイルされるため、フォールバックでもシェーダーを書き直す必要がない。
- TSL が困難な箇所（既存 `onBeforeCompile` 流用など）が出た場合のみ、GLSL を WebGL 専用フォールバックとして併記する設計余地を残す。

---

## 3. 画面構成・カメラ

### 3.1 レイアウト
- 砂浜はビューポート全体（`100vw × 100vh`）に表示。
- 砂浜自体はスクロール・パン・ズームしない「壁紙」固定表示。
- 画面右下（または下部中央）に「Wash」ボタンを HTML オーバーレイで配置。
- 左上に lil-gui パネル（スマホでは折りたたみ可能）。

### 3.2 カメラ
- **OrthographicCamera** を採用し、真上から見下ろす（top-down）。
- カメラは Y 軸正方向から原点を見下ろす（`position = (0, H, 0)`, `lookAt(0,0,0)`、up を Z 方向に設定）。
- 砂平面は XZ 平面に配置（`rotation.x = -π/2`）。
- 画面リサイズ時にアスペクト比へ追従して `left/right/top/bottom` を再計算し、砂面が常に画面を満たすようにする。
- 足跡サイズは画面高さの約 **10vh** 相当。orthographic のワールド高さ（`top - bottom`）に対し 0.1 倍をワールド単位の足跡サイズとして算出。

### 3.3 座標変換
- ポインタ座標（CSS px）→ NDC (-1..1) → orthographic 逆投影でワールド XZ へ変換するユーティリティを `PointerTrail` に持たせる。

---

## 4. 砂面の表現

### 4.1 ジオメトリ
- 高分割の平面メッシュ（`PlaneGeometry`）。
- **中密度の実ジオメトリ**: 例として 256×256 〜 384×384 セグメント（端末性能に応じて調整可能なパラメータ）。スマホで破綻しないよう実変形は中密度に抑える。
- 見た目の細かさ（砂粒感）は **シェーダー側のプロシージャル表現で補完**する。

### 4.2 高さの合成（Displacement）
砂面の最終的な高さ `h(x,z)` は以下の合成：

```
h = baseSand(x,z)               // 砂全体のうねり（低周波ノイズ）
  + Σ footprintDepression_i     // 各足跡による凹み（中央肉球+指球）
  + Σ footprintRim_i            // 各足跡の縁の盛り上がり
  + grainDetail(x,z)            // 砂粒の高周波ディテール（法線生成用、頂点には乗せず主に法線で表現）
```

- **凹み（depression）/ 縁（rim）** は「足跡データ（後述の固定長バッファ）」を uniform でシェーダーに渡し、頂点シェーダー（または height へ書き込むオフスクリーンパス）で評価する。
- 頂点数が多く全足跡を頂点シェーダーでループ評価すると重いため、**高さマップ（Render Target / DataTexture）方式を基本採用**する（4.3 参照）。

### 4.3 ハイトマップ方式（採用アーキテクチャ）
リアルタイムに足跡を「砂に焼き込む」ため、ハイトフィールドをテクスチャで管理する：

1. **HeightField RenderTarget（R16F/R32F、例 1024×1024）**を1枚保持。
2. 足跡を追加するとき、その足跡スタンプを HeightField に**加算合成（accumulate）**する小さな全画面/部分矩形パスを実行（毎フレームではなく、足跡生成イベント時のみ）。
3. 砂面メッシュはこの HeightField を `displacementMap` 的に頂点で参照して凹む。
4. 法線は HeightField の微分（Sobel/隣接サンプリング）＋プロシージャル砂粒ノイズから合成。

> この方式により、「同じ場所を踏むと凹みが自然に重なる」「足跡15個ぶんを毎フレーム個別評価しない」を両立する。

#### 時間減衰の扱い
- 足跡の加算は「焼き込み」だが、時間経過で薄くする（decay）要件があるため、**HeightField への一括焼き込み（永続化）」と「アクティブ足跡の動的減衰レイヤー」を分離**する：
  - 案A（採用）: 各アクティブ足跡（最大15個）の `age` を CPU/uniform で保持し、毎フレーム HeightField を再構成（15スタンプを1パスで合成）。15個なら1パスで描けるため軽量。Wash はこのレイヤーをクリア。
  - これにより decay / darkening / 重なりを毎フレーム正しく反映でき、なおかつ評価対象は最大15スタンプに限定される。

### 4.4 シェーダーによる質感
`sandShader.ts` で以下を合成：
- **プロシージャルノイズ**（fbm / value noise / simplex 近似）で砂粒の微細凹凸 → **法線マップ的に法線を摂動**。
- **アルベド（色）**: 湿り気で暗く・彩度変化、凹み内部はわずかに暗く湿った色。新しい足跡は `darkeningStrength` で周囲より濃く。
- **ラフネス**: 湿った砂は低ラフネス（てかり）、乾いた砂は高ラフネス。`moisture` で制御。
- **法線**: HeightField 微分（マクロな凹凸）＋ noise（ミクロな砂粒）の合成。
- 物理パラメータ（moisture, grainSize, noiseStrength 等）を uniform として受け取り、見た目に反映。

---

## 5. 足跡の仕様

### 5.1 スタンプ定義（差し替え可能設計）
`footprintTypes.ts` に足跡タイプのインターフェースを定義：

```ts
interface FootprintType {
  id: string;                 // "dog"
  generateStampTexture(opts): THREE.Texture; // プロシージャル or 画像
  pads: PadShape[];           // 中央肉球+指球+爪のレイアウト（正規化座標）
  aspect: number;             // 縦横比
  // 物理応答プロファイル（沈み込みカーブ等）も将来差し替え可能に
}
```

- 初期実装は `dogFootprint: FootprintType` のみ登録。
- `FootprintSystem` は `FootprintType` を注入で受け取り、内部はタイプ非依存。
- 将来、AI生成テクスチャ／砂テクスチャ／ノーマルマップを `generateStampTexture` 差し替えやテクスチャ URL 指定で導入可能。

### 5.2 犬の足跡形状（`pawStamp.ts`）
プロシージャルに生成（外部アセット不要）：
- **中央の肉球（メタカルパルパッド）**: 大きめの三角〜ハート型ブロブ。
- **4つの指球（トウパッド）**: 中央上方に扇状に配置した4つの楕円ブロブ。
- **（任意）浅い爪跡**: 各指球の先に小さく浅いマーク。`hardness` 等で表出度を調整。
- 生成物は「高さ寄与（凹み深さの分布）」を表すグレースケールマスク（Canvas2D もしくはシェーダー）として作る。
  - 値が深さの重み（0=変化なし, 1=最深部）。
- **縁の崩れ（edgeCollapse）**: マスク輪郭にノイズを乗せ、完全な輪郭にせずランダムに崩す。

### 5.3 軌跡に沿った生成ロジック（`FootprintSystem` + `PointerTrail`）
- ポインタ移動を追跡し、**前回の足跡から一定距離（stride）進むたびに新しい足跡を1つ生成**。
- `stride` は足跡サイズ（≒10vh）に比例して自動調整（自然な歩幅）。
- **向き**: ドラッグ方向（移動ベクトル）に足跡の前方を向ける（yaw 回転）。方向は平滑化（スムージング）して急な震えを抑える。
- **左右交互**: 進行方向に対して左右の法線方向へ小さくオフセットし、左→右→左…と交互に足を置く。オフセット量は足跡サイズに比例。
- **ランダム性**: 各足跡に微小な角度・位置・スケールゆらぎ、輪郭崩れシード（`edgeCollapse`）を付与。

### 5.4 足跡データ構造（固定長バッファ）
```ts
const MAX_FOOTPRINTS = 15;

interface Footprint {
  active: boolean;
  worldPos: Vec2;     // XZ
  yaw: number;        // 向き
  scale: number;
  side: -1 | 1;       // 左右
  seed: number;       // 崩れ・ゆらぎ用
  bornTime: number;   // 生成時刻
  // age は bornTime と現在時刻から算出
}
```
- 固定長配列 `Footprint[MAX_FOOTPRINTS]` をリングバッファ運用。15個を超えたら最古を上書き。
- 毎フレームのオブジェクト生成（GC圧）を避け、配列を再利用。
- 足跡情報は uniform 配列（`vec4 footprints[15]` 等、pos.xy / yaw / age をパック）として HeightField 合成パスへ渡す。

---

## 6. 物理パラメーター（GUI調整）

`sandParams.ts` で一元管理。lil-gui からバインド。

| パラメータ | 意味 | 主な影響先 |
|-----------|------|-----------|
| `moisture` | 砂の湿り気 | 色の暗さ・彩度、ラフネス、cohesion との相互作用、縁の保持 |
| `hardness` | 砂の硬さ | 最大沈み込みの抑制、爪跡の出やすさ |
| `grainSize` | 砂粒の大きさ | ノイズの周波数（粒の見た目） |
| `cohesion` | まとまりやすさ | 縁の盛り上がり保持、崩れにくさ |
| `bodyWeight` | 足跡を作る重さ | 沈み込み深さの全体スケール |
| `footprintDepth` | 最大沈み込み量 | depression の最大振幅 |
| `rimHeight` | 縁の盛り上がり | rim の高さ |
| `edgeCollapse` | 縁の崩れやすさ | 輪郭ノイズ強度、rim の不連続性 |
| `decaySpeed` | 薄くなる速さ | age に対する深さ・色の減衰率 |
| `darkeningStrength` | 新しい足跡の濃さ | 足跡内部のアルベド暗化強度 |
| `noiseStrength` | 砂粒ノイズの強さ | 法線・色の微細変化量 |

- パラメータはリアクティブに uniform へ反映（変更時に dirty フラグ → 必要なら HeightField 再焼き込み）。
- パラメータ間の相互作用（例: `moisture × cohesion` が縁の保持を決める）を `FootprintSystem` 内のヘルパで合成。

---

## 7. 時間変化

- 足跡は最大 **15個**（`MAX_FOOTPRINTS`）。
- 各足跡は `bornTime` を持ち、`age = now - bornTime`。
- **深さ**: `depth = baseDepth * weightFactor * decayCurve(age, decaySpeed)`。新しいほど深く、古いほど浅い。
- **色**: 内部の暗化量を `age` で減衰（`darkeningStrength × decayCurve`）。
- **重なり**: HeightField への合成は加算（min合成 or 加算）なので、同一箇所の凹みは自然に重畳。
- 15個を超えると最古を解放し、その凹みは「残留焼き込み（任意で baseSand に薄く溶け込ませる）」または単純消滅。初期実装は単純にアクティブから外す（軽量優先）。

---

## 8. Wash（波リセット）演出（`WashWave.ts`）

- 海・常時波は実装しない。**Washボタン押下時の一回限りの演出**のみ。
- 演出：画面の一方向（例: 上→下、または横）から**薄い水膜＋泡のような表現**がスイープ。
  - 進行する「波front」を表すラインを時間で移動。
  - water front 通過位置で：
    - HeightField のアクティブ足跡レイヤーを front 通過に合わせて 0 へ戻す（ワイプ）。
    - 砂面の色を一時的に濡れ色（暗く・光沢）に変え、泡（プロシージャル白ノイズ＋アルファ）を front 付近に表示。
- 波通過後：砂面はほぼ初期状態（足跡なし、濡れ色は数秒で乾いて戻す or 即時戻し）。
- 実装: 全画面オーバーレイのシェーダー or 砂シェーダー内に `washFront`/`washProgress` uniform を追加し、front より手前を「洗浄済み」として扱う。

---

## 9. ライティング（`createLights.ts`）

真上 orthographic でも凹凸が分かるよう、**斜め方向からの主光源**を設定：
- **DirectionalLight（太陽）**: 斜め上から（例 elevation 35°, azimuth 適度）差し込み、凹みに陰影を作る。柔らかい影（PCFSoft シャドウ、解像度は端末負荷に応じ調整）。
- **AmbientLight / HemisphereLight**: 空・地面の環境光で影が真っ黒にならないよう調整。
- **トーンマッピング**: `ACESFilmicToneMapping`、`outputColorSpace = SRGB`、適切な `exposure`。
- 砂は PBR（roughness/metalness=0 系）で、moisture によりラフネス・スペキュラを変調。
- 影は重い場合があるため、影は主光源のみ＋低解像度シャドウマップ、もしくは法線ベースの擬似陰影でフォールバック可能にする。

---

## 10. アセット方針

- **完全に外部アセットなしで起動可能**。
- 犬の足跡マスク・砂のノイズ・ノーマルは**コード内プロシージャル生成**（Canvas2D / シェーダー / TSL ノイズ）。
- 後から差し替えられる構造：
  - `FootprintType.generateStampTexture` を画像ローダ実装に差し替え。
  - 砂のアルベド/ノーマル/ラフネスを `texture?: Texture` オプションで上書き可能に（未指定ならプロシージャル）。
- これにより「AI生成した足跡テクスチャ・砂テクスチャ・ノーマルマップ」を後日ドロップインできる。

---

## 11. 操作（入力）

- **タッチ**（スマホ）と**マウスドラッグ**（PC）を同一の Pointer Events で統一処理。
- `pointerdown` で trail 開始、`pointermove` で軌跡更新＆足跡生成判定、`pointerup` で終了。
- タッチ中、指の移動方向に応じて足跡を連続生成（stride ごと）。
- 連続生成間隔（stride）は足跡サイズに応じて自動調整。
- マルチタッチは初期実装では先頭1ポインタのみ採用（将来拡張余地）。
- スクロール・ピンチによるページズームを防ぐため `touch-action: none` を設定。

---

## 12. パフォーマンス方針

- 目標 iPhone **30FPS 前後**。
- 足跡は **最大15個**に制限（固定長バッファ）。
- **毎フレームのオブジェクト生成を回避**（配列再利用、uniform 更新のみ）。
- HeightField 合成は「最大15スタンプを1パス」で、毎フレーム軽量に再構成（または足跡増減・age更新時のみ）。
- ジオメトリは中密度、見た目はシェーダーで補完。
- シャドウマップ解像度・砂面セグメント数・HeightField 解像度を**性能プリセット**で切替可能に（端末判定 or GUI）。
- WebGPU 経路では compute/storage を活用する余地（将来最適化）。

---

## 13. ディレクトリ構成

```
src/
  main.ts                  // 起動・ループ・各モジュール結線
  scene/
    createRenderer.ts      // WebGPU優先→WebGL2フォールバック、トーンマッピング設定
    createCamera.ts        // Orthographic top-down、リサイズ追従
    createLights.ts        // 太陽光・環境光・影
  sand/
    SandPlane.ts           // 砂メッシュ、HeightField RT、displacement結線
    sandShader.ts          // 砂のマテリアル/ノード（ノイズ・法線・色・ラフネス・wash）
    sandParams.ts          // 物理パラメータの型・既定値・store
  footprints/
    FootprintSystem.ts     // 軌跡→足跡生成、固定長バッファ、age更新、HeightField焼き込み
    pawStamp.ts            // 犬足跡マスクのプロシージャル生成
    footprintTypes.ts      // FootprintType IF と dog 定義（差し替え可能）
  interaction/
    PointerTrail.ts        // Pointer Events、座標変換、移動方向平滑化、stride判定
  effects/
    WashWave.ts            // Wash演出（波front・泡・足跡ワイプ）
  ui/
    createGui.ts           // lil-gui バインド、Washボタン、性能プリセット
  styles.css               // 全画面レイアウト、touch-action、UIスタイル
index.html
vite.config.ts
tsconfig.json
package.json
```

### モジュール間データフロー
```
PointerTrail ──(world pos, dir)──▶ FootprintSystem ──(15 stamps uniforms)──▶ HeightField RT
                                          │                                        │
sandParams ──(uniforms)──────────────────┼───────────────▶ SandPlane / sandShader ◀┘
                                          │
createGui ──(param edits, Wash click)─────┴──▶ WashWave ──(washFront)──▶ sandShader / HeightField
```

---

## 14. 主要モジュール責務（API スケッチ）

```ts
// scene/createRenderer.ts
export async function createRenderer(canvas): Promise<{renderer, backend:'webgpu'|'webgl2'}>;

// scene/createCamera.ts
export function createCamera(viewport): { camera: OrthographicCamera, resize(w,h): void,
  worldHeight(): number /* 10vh算出用 */, screenToWorld(px,py): Vec2 };

// sand/SandPlane.ts
export class SandPlane {
  mesh: THREE.Mesh; heightField: RenderTarget;
  update(dt, params, footprints): void;   // HeightField再構成・uniform更新
  applyWash(front): void;
}

// footprints/FootprintSystem.ts
export class FootprintSystem {
  constructor(type: FootprintType, params);
  addAlongTrail(pos: Vec2, dir: Vec2): void;  // stride判定込み
  update(now): void;                          // age更新・期限切れ処理
  buffer: Footprint[];                        // 固定長15
  clear(): void;                              // Wash時
}

// footprints/footprintTypes.ts
export interface FootprintType { id; generateStampTexture; pads; aspect; }
export const dogFootprint: FootprintType;

// interaction/PointerTrail.ts
export class PointerTrail {
  onMove(cb: (pos: Vec2, dir: Vec2) => void): void;  // 平滑化済み方向
  attach(dom): void;
}

// effects/WashWave.ts
export class WashWave {
  trigger(): void; update(dt): void; get front(): number; get active(): boolean;
}

// ui/createGui.ts
export function createGui(params, { onWash }): GUI;
```

---

## 15. 受け入れ条件との対応

| 受け入れ条件 | 対応設計 |
|------------|---------|
| 画面いっぱいにリアルな砂浜 | §3.1, §4, §9 |
| なぞると自然な向きで足跡生成 | §5.3, §11 |
| 砂面が実際に凹んで見える | §4.2–4.3（HeightField変位）, §9（斜光） |
| 縁に盛り上がり・崩れ | §5.2（rim, edgeCollapse） |
| 時間経過で浅く・薄く | §7 |
| GUIで各パラメータ調整 | §6 |
| Washボタンでリセット演出 | §8 |
| iPhoneで30FPS前後 | §12 |

---

## 16. 実装フェーズ計画（マイルストーン）

1. **M1 足場**: Vite+TS+Three、Renderer(WebGPU/WebGL2分岐)、Orthographicカメラ、全画面リサイズ、砂平面（フラット）表示。
2. **M2 砂質感**: sandShader（ノイズ法線・色・ラフネス）、ライティング、トーンマッピング。
3. **M3 入力**: PointerTrail（タッチ/マウス統一、座標変換、方向平滑化、stride）。
4. **M4 足跡**: pawStamp プロシージャル生成、HeightField焼き込み、変位反映、左右交互・向き追従。
5. **M5 時間変化**: 固定長バッファ・age・decay・darkening・重なり。
6. **M6 GUI**: lil-gui で全パラメータ＋Washボタン＋性能プリセット。
7. **M7 Wash**: WashWave 演出と足跡ワイプ。
8. **M8 最適化**: iPhone実機で30FPS調整、解像度プリセット詰め。

---

## 17. リスクと対策

| リスク | 対策 |
|--------|------|
| WebGPU/WebGL2 二重シェーダー保守 | TSL/node materials で単一記述（§2.1） |
| iOS Safari の WebGPU 非対応/不安定 | WebGL2 フォールバックを一級市民として扱う |
| 高分割メッシュ＋影で重い | 中密度＋シェーダー補完、シャドウ低解像度、性能プリセット |
| HeightField の毎フレーム再構成コスト | 最大15スタンプ・部分矩形描画・dirty時のみ更新 |
| GC由来のフレーム落ち | 固定長バッファ・uniform更新のみ、毎フレーム new禁止 |
| float RTのモバイル精度/対応 | R16F優先、非対応時はRGBA8パック等のフォールバック |
```
