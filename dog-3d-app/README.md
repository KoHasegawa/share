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
  vendor/three/   Three.js 本体と OrbitControls（ローカル同梱・CDN不要）
```

Three.js は `public/vendor/three/` に同梱しているため、外部CDNに接続できない環境でもオフラインで動作します（`index.html` の importmap がローカルパスを参照します）。

## アーキテクチャ

```
User Input → Command Parser → Command JSON → Action Queue → Dog Controller → Three.js Scene
```

- **Command Parser (`public/parser.js`)**: 完全一致ルールやキーワード判定でコマンドを即時生成。未解決の場合のみサーバに `POST /api/parse` を送り LLM を利用します。入力正規化キーを `localStorage` にキャッシュし、同じ自然文は再解析を省略します。
- **Action Queue (`public/actionQueue.js`)**: 新しい指令でキューを置き換え、コマンドを順番に実行します。実行中・待機中の状態を UI に通知します。
- **Dog Controller (`public/dog.js`)**: プリミティブ形状で組んだ犬モデルをコード駆動でアニメーション。移動、姿勢切替、しっぽ振り、ジャンプ、匂いを嗅ぐ等の挙動を制御します。
- **Three.js Scene (`public/scene.js`)**: 庭とボール・ベッド・餌皿・ユーザーマーカーを配置し、OrbitControls とライティングを設定します。
- **Express サーバ (`server.js`)**: 静的ファイル配信と `POST /api/parse` のみを提供。OpenAI `gpt-4o-mini` に JSON-only で問い合わせ、失敗時はフォールバックレスポンスを返します。

## API コスト最適化

1. **完全一致ルール**: 「おすわり」「吠えて」など頻出指示は即時コマンド化。
2. **キーワード判定**: 「ボール」「走って」→ `move_to(ball, run)` 等、複文は読点や「して」で分割して複数コマンドに変換。
3. **キャッシュ**: 正規化テキストをキーに `localStorage` へ保存し、同じ指示は LLM を利用せずに再実行。
4. **LLM 呼び出し**: 上記で解決できない場合だけ `POST /api/parse` で LLM を使用。
5. **フォールバック**: LLM 応答が空またはエラーの場合はコマンドなしで「もう一度言ってもらえる？」と表示し、安全に待機します。

## 検証

- `npm install`
- `node --check server.js`
- `node --check public/parser.js`
- `node --check public/actionQueue.js`
- `node --check public/dog.js`
- `node --check public/scene.js`
- `node --check public/main.js`

上記コマンドがすべて成功することを確認してください。
