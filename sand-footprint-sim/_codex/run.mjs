// Codex orchestration driver.
// Calls the OpenAI Responses API, extracts text + token usage, tracks $ cost.
// Usage: node run.mjs <model> <systemFile> <userFile> <outFile>
import fs from 'node:fs';
import path from 'node:path';

const PRICES = {
  // $/M tokens (input, output)
  'gpt-5.3-codex': { in: 1.75, out: 14 },
  'gpt-5-codex':   { in: 1.75, out: 14 },
  'gpt-5.5':       { in: 5,    out: 30 },
  'gpt-5.5-2026-04-23': { in: 5, out: 30 },
  'gpt-5.5-pro':   { in: 30,   out: 180 },
  'gpt-5.5-pro-2026-04-23': { in: 30, out: 180 },
};

const COST_LOG = path.join(import.meta.dirname, 'cost.log');

function logCost(model, usage) {
  const p = PRICES[model] || { in: 2, out: 14 };
  const inTok = usage.input_tokens ?? 0;
  const outTok = usage.output_tokens ?? 0;
  const cost = (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
  const line = `${new Date().toISOString()}\t${model}\tin=${inTok}\tout=${outTok}\t$${cost.toFixed(4)}\n`;
  fs.appendFileSync(COST_LOG, line);
  // cumulative
  let total = 0;
  for (const l of fs.readFileSync(COST_LOG, 'utf8').trim().split('\n')) {
    const m = l.match(/\$([0-9.]+)$/);
    if (m) total += parseFloat(m[1]);
  }
  return { cost, total };
}

function extractText(resp) {
  if (typeof resp.output_text === 'string' && resp.output_text.length) return resp.output_text;
  let out = '';
  for (const item of resp.output ?? []) {
    if (item.type === 'message') {
      for (const c of item.content ?? []) {
        if (c.type === 'output_text' && c.text) out += c.text;
      }
    }
  }
  return out;
}

async function main() {
  const [model, systemFile, userFile, outFile] = process.argv.slice(2);
  const system = fs.readFileSync(systemFile, 'utf8');
  const user = fs.readFileSync(userFile, 'utf8');

  const body = {
    model,
    input: [
      { role: 'developer', content: system },
      { role: 'user', content: user },
    ],
    reasoning: { effort: model.includes('pro') ? 'high' : 'medium' },
    max_output_tokens: 32000,
  };

  let resp, lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) { lastErr = JSON.stringify(j.error || j);
        if (r.status >= 500 || r.status === 429) { await new Promise(s=>setTimeout(s, attempt*2000)); continue; }
        throw new Error(lastErr); }
      resp = j; break;
    } catch (e) {
      lastErr = e.message; await new Promise(s=>setTimeout(s, attempt*2000));
    }
  }
  if (!resp) { console.error('FAILED:', lastErr); process.exit(1); }

  const text = extractText(resp);
  fs.writeFileSync(outFile, text);
  const { cost, total } = logCost(model, resp.usage || {});
  console.error(`[${model}] status=${resp.status} out=${text.length}ch cost=$${cost.toFixed(4)} cumulative=$${total.toFixed(4)}`);
  if (resp.status === 'incomplete') console.error('WARNING: response incomplete (token cap?)');
}
main();
