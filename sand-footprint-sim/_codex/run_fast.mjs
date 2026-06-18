// Constrained review driver: medium effort, smaller output cap, prints progress.
import fs from 'node:fs';
import path from 'node:path';
const PRICES = { 'gpt-5.5-pro': { in: 30, out: 180 }, 'gpt-5.5': { in: 5, out: 30 }, 'gpt-5.3-codex': { in: 1.75, out: 14 } };
const COST_LOG = path.join(import.meta.dirname, 'cost.log');
function logCost(model, usage) {
  const p = PRICES[model] || { in: 5, out: 30 };
  const cost = ((usage.input_tokens ?? 0) / 1e6) * p.in + ((usage.output_tokens ?? 0) / 1e6) * p.out;
  fs.appendFileSync(COST_LOG, `${new Date().toISOString()}\t${model}\tin=${usage.input_tokens ?? 0}\tout=${usage.output_tokens ?? 0}\t$${cost.toFixed(4)}\n`);
  let total = 0; for (const l of fs.readFileSync(COST_LOG, 'utf8').trim().split('\n')) { const m = l.match(/\$([0-9.]+)$/); if (m) total += parseFloat(m[1]); }
  return { cost, total };
}
function extractText(resp) {
  if (typeof resp.output_text === 'string' && resp.output_text.length) return resp.output_text;
  let out = ''; for (const item of resp.output ?? []) if (item.type === 'message') for (const c of item.content ?? []) if (c.type === 'output_text' && c.text) out += c.text;
  return out;
}
const [model, systemFile, userFile, outFile, effort, maxTok] = process.argv.slice(2);
const body = {
  model,
  input: [ { role: 'developer', content: fs.readFileSync(systemFile, 'utf8') }, { role: 'user', content: fs.readFileSync(userFile, 'utf8') } ],
  reasoning: { effort: effort || 'medium' },
  max_output_tokens: parseInt(maxTok || '9000', 10),
};
const r = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.OPEN_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const j = await r.json();
if (!r.ok) { console.error('HTTP', r.status, JSON.stringify(j.error || j).slice(0, 300)); process.exit(1); }
const text = extractText(j);
fs.writeFileSync(outFile, text);
const { cost, total } = logCost(model, j.usage || {});
console.error(`[${model}] status=${j.status} out=${text.length}ch cost=$${cost.toFixed(4)} cumulative=$${total.toFixed(4)}`);
