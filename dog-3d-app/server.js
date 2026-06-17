import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPEN_API_KEY = process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY || '';

const systemPrompt = `あなたは犬用3Dアプリのコマンド変換エンジンです。次のコマンドタイプとターゲットだけを使い、JSONのみで回答してください。\n\n- move_to: target=ball|bed|bowl|user, speed=walk|run\n- play_animation: name=idle|walk|run|sit|lie_down|bark|wag_tail|sniff|jump\n- look_at: target=ball|bed|bowl|user\n- wait: duration=秒数(数値)\n- bark\n- wag_tail\n- return_to_user\n\nレスポンスは常に次のJSON Schemaに一致させてください。\n{ "commands": [ { "type": string, "target": string|null, "name": string|null, "speed": string|null, "duration": number|null } ] }\n\n不明な指示は安全な代替(look_at user など)に変換し、説明や文章は一切返さないでください。`;

app.post('/api/parse', async (req, res) => {
  const { text = '' } = req.body || {};
  const trimmed = String(text || '').trim();

  if (!trimmed) {
    return res.json({ commands: [], error: '入力が空です。', fallback: true, source: 'llm-fallback' });
  }

  if (!OPEN_API_KEY) {
    return res.json({ commands: [], error: 'APIキーが設定されていません。', fallback: true, source: 'llm-fallback' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: trimmed },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.json({ commands: [], error, fallback: true, source: 'llm-fallback' });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.json({ commands: [], error: '応答が空でした。', fallback: true, source: 'llm-fallback' });
    }

    let payload = { commands: [] };
    try {
      payload = JSON.parse(content);
    } catch (err) {
      return res.json({ commands: [], error: 'JSON解析に失敗しました。', fallback: true, source: 'llm-fallback' });
    }

    if (!Array.isArray(payload.commands)) {
      return res.json({ commands: [], error: 'commands配列が見つかりません。', fallback: true, source: 'llm-fallback' });
    }

    const normalized = payload.commands
      .filter(Boolean)
      .map((item) => ({
        type: item.type || '',
        target: item.target ?? null,
        name: item.name ?? null,
        speed: item.speed ?? null,
        duration: typeof item.duration === 'number' ? item.duration : null,
      }));

    return res.json({ commands: normalized, source: 'llm' });
  } catch (error) {
    return res.json({ commands: [], error: error.message, fallback: true, source: 'llm-fallback' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
