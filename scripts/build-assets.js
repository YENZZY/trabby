// assets/characters/ 의 그림을 찾아 src/data/generated/characterArt.ts 를 만들어요.
// 파일 이름 규칙:  <캐릭터id>.png (대기) · <id>_walk.png 또는 <id>_walk1.png,<id>_walk2.png… (걷기 프레임) · <id>_cheer.png (도착/기쁨)
//   npm run build:assets     (run.bat 에서도 자동 실행)
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const dir = arg('dir', path.join(__dirname, '../assets/characters'));
const out = arg('out', path.join(__dirname, '../src/data/generated/characterArt.ts'));
const rewards = arg('rewards', path.join(__dirname, '../src/data/rewards.ts'));

const known = [...fs.readFileSync(rewards, 'utf8').matchAll(/id: '([a-z0-9]+)', name:/g)].map((m) => m[1]);
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|webp|jpe?g)$/i.test(f)).sort() : [];

const art = {};
for (const f of files) {
  const m = path.parse(f).name.match(/^([a-z0-9]+)(?:_(idle|walk(\d*)|cheer))?$/);
  if (!m || !known.includes(m[1])) {
    console.warn(`  ⚠ '${f}' 은(는) 이름 규칙에 안 맞아요 (건너뜀). 예: tiger.png, tiger_walk1.png, tiger_cheer.png / 쓸 수 있는 id: ${known.join(', ')}`);
    continue;
  }
  const [, id, st, num] = m;
  const e = (art[id] = art[id] || { walk: [] });
  if (!st || st === 'idle') e.idle = f;
  else if (st === 'cheer') e.cheer = f;
  else e.walk.push({ n: num === '' ? 0 : Number(num), f });
  const kb = Math.round(fs.statSync(path.join(dir, f)).size / 1024);
  if (kb > 500) console.warn(`  ⚠ '${f}' 용량이 ${kb}KB 예요. 300KB 이하로 줄이면 앱이 가벼워져요`);
}
const rel = path.relative(path.dirname(out), dir).split(path.sep).join('/');
const req = (f) => `require('${rel}/${f}')`;
const body = [
  '// 자동 생성 파일 — scripts/build-assets.js 가 assets/characters 를 읽어 만들어요. 직접 수정하지 마세요.',
  "import type { ImageSourcePropType } from 'react-native';",
  '',
  'export type CharacterArt = { idle?: ImageSourcePropType; walk?: ImageSourcePropType[]; cheer?: ImageSourcePropType };',
  'export const CHARACTER_ART: Record<string, CharacterArt | undefined> = {',
  ...Object.entries(art).flatMap(([id, e]) => {
    const parts = [];
    if (e.idle) parts.push(`idle: ${req(e.idle)}`);
    if (e.walk.length) parts.push(`walk: [${e.walk.sort((a, b) => a.n - b.n).map((w) => req(w.f)).join(', ')}]`);
    if (e.cheer) parts.push(`cheer: ${req(e.cheer)}`);
    return [`  ${id}: { ${parts.join(', ')} },`];
  }),
  '};',
  '',
].join('\n');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body, 'utf8');

const label = (e) => [e.idle && '대기', e.walk.length && `걷기${e.walk.length}장`, e.cheer && '기쁨'].filter(Boolean).join('·');
const ids = Object.keys(art);
console.log(`캐릭터 그림 ${ids.length}/${known.length}종 연결: ${ids.map((id) => `${id}(${label(art[id])})`).join(', ') || '(없음 — 모두 이모지)'}`);
for (const id of ids) if (!art[id].idle) console.warn(`  ⚠ ${id}: 대기 그림(${id}.png)이 없어요. 대기 상태는 이모지로 보여요`);
const missing = known.filter((id) => !art[id]);
if (missing.length) console.log(`그림이 아직 없는 캐릭터: ${missing.join(', ')}`);
