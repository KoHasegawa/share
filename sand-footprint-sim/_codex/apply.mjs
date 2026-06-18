// Parses Codex output containing files delimited by:
//   ===FILE: relative/path===
//   <content>
//   ===ENDFILE===
// and writes them under the project root (parent of _codex).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(process.argv[2], 'utf8');

const re = /===FILE:\s*(.+?)\s*===\r?\n([\s\S]*?)\r?\n===ENDFILE===/g;
let m, count = 0;
while ((m = re.exec(src)) !== null) {
  const rel = m[1].trim();
  if (rel.includes('..')) { console.error('skip unsafe', rel); continue; }
  let content = m[2];
  // strip accidental leading ```lang / trailing ``` fences inside a block
  content = content.replace(/^```[a-zA-Z0-9]*\r?\n/, '').replace(/\r?\n```\s*$/, '');
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.endsWith('\n') ? content : content + '\n');
  console.error('wrote', rel, `(${content.length}ch)`);
  count++;
}
console.error(`applied ${count} files`);
if (count === 0) process.exit(2);
