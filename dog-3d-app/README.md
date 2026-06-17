# 犬アクション3D Webアプリ

文章指令を解析し、3D空間の犬を動かすMVPアプリです。自然文の解析はローカルルール→キャッシュ→OpenAI API の順で行い、API利用を最小限に抑えます。UIはすべて日本語で構成されています。

## 動作環境

- Node.js 18 以上（組み込み `fetch` を利用します）
- OpenAI API キー：環境変数 `OPEN_API_KEY` または `OPENAI_API_KEY`

## セットアップと起動

```bash
npm install
OPEN_API_KEY=sk-... node server.js
```

デフォルトポートは `3000` です。ポートを変更したい場合は `PORT` 環境変数を指定してください。起動後、ブラウザで `http://localhost:3000` を開くとアプリが表示されます。

## ディレクトリ構成

```
server.js         Express サーバと OpenAI API プロキシ
public/
  index.html      日本語UIと importmap
  styles.css      UI スタイル
  main.js         UI ロジックとイベント制御
  parser.js       文章解析ロジック（ルール・キャッシュ・LLM）
  actionQueue.js  コマンド順次実行キュー
  scene.js        Three.js シーン構築
  dog.js          犬モデルとアニメーション制御
  vendor/three/   Three.js 本体（ローカル同梱・CDN不要）
```

Three.js は `public/vendor/three/` に同梱しているため、外部CDNに接続できない環境でもオフラインで動作します（`index.html` の importmap がローカルパスを参照します）。

## アーキテクチャ

```
User Input → Command Parser → Command JSON → Action Queue → Dog Controller → Three.js Scene
```

- **Command Parser (`public/parser.js`)**: 完全一致ルールやキーワード判定でコマンドを即時生成。未解決の場合のみサーバに `POST /api/parse` を送り LLM を利用します。入力正規化キーを `localStorage` にキャッシュし、同じ自然文は再解析を省略します。
- **Action Queue (`public/actionQueue.js`)**: 新しい指令でキューを置き換え、コマンドを順番に実行します。実行中・待機中の状態を UI に通知します。
- **Dog Controller (`public/dog.js`)**: プリミティブ形状で組んだ犬モデルをコード駆動でアニメーション。移動、姿勢切替、しっぽ振り、ジャンプ、匂いを嗅ぐ等の挙動を制御します。
- **Three.js Scene (`public/scene.js`)**: 庭とボール・ベッド・餌皿を配置し、**ユーザーの目線位置に固定した一人称カメラ**を設定します。ドラッグで視線（首振り）だけを回し、ユーザーの居場所は移動しません（ズーム無効）。
- **Express サーバ (`server.js`)**: 静的ファイル配信と `POST /api/parse` のみを提供。OpenAI `gpt-4o-mini` に JSON-only で問い合わせ、失敗時はフォールバックレスポンスを返します。

## API コスト最適化

1. **完全一致ルール**: 「おすわり」「吠えて」など頻出指示は即時コマンド化。
2. **キーワード判定**: 「ボール」「走って」→ `move_to(ball, run)` 等、複文は読点や「して」で分割して複数コマンドに変換。
3. **キャッシュ**: 正規化テキストをキーに `localStorage` へ保存し、同じ指示は LLM を利用せずに再実行。
4. **LLM 呼び出し**: 上記で解決できない場合だけ `POST /api/parse` で LLM を使用。
5. **フォールバック**: LLM 応答が空またはエラーの場合はコマンドなしで「もう一度言ってもらえる？」と表示し、安全に待機します。

## 公開（GitHub Pages）

このリポジトリは `.github/workflows/deploy-pages.yml` により `main` への push 時に
GitHub Pages へ自動デプロイされます。ワークフローは `dog-3d-app/public/` を
`dog-3d-app/` として静的配信します（Three.js はローカル同梱のためCDN不要）。

- 公開URL（例）: `https://<ユーザー名>.github.io/share/dog-3d-app/`
- ルートのトップページ（`index.html`）にも「🐕 犬アクション3D」カードからリンクしています。

**公開版の制約**: GitHub Pages は静的ホスティングのため Node サーバ(`server.js`)が動かず、
`/api/parse`（LLM解析）は利用できません。APIキーをブラウザに露出させない方針のため、
公開版では **ローカルルール／キーワード／キャッシュによる解析のみ** が動作します
（例文ボタンや「おすわり」「ボールまで走って」等の定型指示は問題なく遊べます）。
ルールで解決できない複雑な文章を送った場合は、AI解析が無効である旨を案内して安全に待機します。

複雑な文章のAI解析まで含めて動かしたい場合は、Node が動くホスト（自前サーバ、Render、
Fly.io、Railway 等）に `server.js` をデプロイし、環境変数 `OPEN_API_KEY` を設定してください。

## モデル再生成と検証

### 犬モデル（GLB）の再生成

低ポリ犬モデルは `tools/generate_dog_glb.mjs` でコードから生成しています。<br />
以下のコマンドで `public/models/dog.glb` を再生成できます。

```bash
npm run build:dog
```

三次元ソフトで編集したい場合は Blender 用スクリプト `tools/generate_dog_glb.py` を利用してください。ローカルの Blender 環境で次のように実行すると、同じ GLB を再出力できます（CI や本番環境では実行しません）。

```bash
blender -b -P tools/generate_dog_glb.py
```

### 実行前チェック

```
npm install
npm run build:dog
npm run check
```

### ローカル動作確認

```
OPEN_API_KEY=sk-... node server.js
```

ブラウザで `http://localhost:3000` を開き、犬モデルが表示されていること、既定で `idle` クリップが再生されること、サンプル指示「ボールまで走って」で `walk` が再生され移動後 `idle` に戻ることを確認してください。`DevTools` から `window.playDogAnimation('walk')` などを呼び出すとクリップ切替を直接確認できます。

上記コマンドがすべて成功することを確認してください。
