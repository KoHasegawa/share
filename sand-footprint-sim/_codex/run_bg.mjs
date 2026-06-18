// Background-mode driver for slow models (gpt-5.5-pro). Creates a background response,
// then polls until completion — avoids undici headers/body timeouts on long reasoning.
// Usage: node run_bg.mjs <model> <systemFile> <userFile> <outFile> <effort> <maxTok>
import fs from 'node:fs';
import path from 'node:path';

const PRICES = { 'gpt-5.5-pro': { in: 30, out: 180 }, 'gpt-5.5': { in: 5, out: 30 }, 'gpt-5.3-codex': { in: 1.75, out: 14 } };
const COST_LOG = path.join(import.meta.dirname, 'cost.log');
const KEY = process.env.OPEN_API_KEY;
const H = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const [model, systemFile, userFile, outFile, effort, maxTok] = process.argv.slice(2);
const body = {
  model,
  input: [ { role: 'developer', content: fs.readFileSync(systemFile, 'utf8') }, { role: 'user', content: fs.readFileSync(userFile, 'utf8') } ],
  reasoning: { effort: effort || 'high' },
  max_output_tokens: parseInt(maxTok || '45000', 10),
  background: true,
};

const create = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: H, body: JSON.stringify(body) });
const created = await create.json();
if (!create.ok) { console.error('CREATE FAIL', create.status, JSON.stringify(created.error || created).slice(0, 300)); process.exit(1); }
const id = created.id;
console.error(`[${model}] background id=${id} status=${created.status}`);

let resp = created;
const started = Date.now();
while (resp.status === 'queued' || resp.status === 'in_progress') {
  await sleep(10000);
  const r = await fetch(`https://api.openai.com/v1/responses/${id}`, { headers: H });
  resp = await r.json();
  if (!r.ok) { console.error('POLL FAIL', r.status, JSON.stringify(resp.error || resp).slice(0, 200)); process.exit(1); }
  process.stderr.write(`  ...${resp.status} ${Math.round((Date.now() - started) / 1000)}s\n`);
  if ((Date.now() - started) > 30 * 60 * 1000) { console.error('TIMEOUT 30min'); process.exit(1); }
}

const text = extractText(resp);
fs.writeFileSync(outFile, text);
const { cost, total } = logCost(model, resp.usage || {});
console.error(`[${model}] FINAL status=${resp.status} out=${text.length}ch cost=$${cost.toFixed(4)} cumulative=$${total.toFixed(4)}`);
if (resp.status !== 'completed') console.error('WARNING: not completed:', resp.status, resp.incomplete_details ? JSON.stringify(resp.incomplete_details) : '');
