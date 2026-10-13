// 생성된 노선 데이터를 점검해요:  npm run check:data   (update-data.bat 이 자동으로 실행)
//  · 모든 코스: 역이 2개 이상, 첫 역 거리 0, 나머지는 0보다 크고 비정상적으로 길지 않은지, 같은 역이 연달아 나오지 않는지
//  · scripts/config/expected.json 에 기준이 있는 코스: 총 길이(그리고 역 개수)가 확인된 값과 맞는지
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/data/generated');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/expected.json'), 'utf8'));
const files = fs.readdirSync(dir).filter((f) => /^line\d+\.json$/.test(f));
let errors = 0;

console.log('코스'.padEnd(16) + '역'.padStart(4) + '길이(km)'.padStart(10) + '  결과');
for (const f of files.sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const id = d.line.id;
  const s = d.stations;
  const km = s.reduce((a, x) => a + x.distFromPrev, 0) / 1000;
  const problems = [];
  if (s.length < 2) problems.push('역이 2개 미만');
  if (s[0].distFromPrev !== 0) problems.push('첫 역 거리가 0이 아니에요');
  s.slice(1).forEach((x, i) => {
    if (!(x.distFromPrev > 0)) problems.push(`${s[i].name}→${x.name} 거리가 0 이하`);
    else if (x.distFromPrev > 15000) problems.push(`${s[i].name}→${x.name} ${x.distFromPrev / 1000}km 는 너무 길어요 (확인 필요)`);
    if (s[i].name === x.name) problems.push(`${x.name} 이(가) 연달아 두 번 나와요`);
  });
  const e = expected[id];
  let note = '기준 없음(기본 점검만)';
  if (e) {
    note = `기준 ${e.km}km`;
    if (Math.abs(km - e.km) > e.tol) problems.push(`길이 ${km.toFixed(1)}km 가 기준 ${e.km}km(±${e.tol}) 와 달라요`);
    if (e.stations && s.length !== e.stations) problems.push(`역 ${s.length}개 (기준 ${e.stations}개)`);
  }
  errors += problems.length;
  console.log(d.line.name.padEnd(14) + String(s.length).padStart(4) + km.toFixed(1).padStart(10) + '  ' + (problems.length ? '✗ ' + problems.join(' / ') : '✓ ' + note));
}
if (errors) { console.error(`\n문제 ${errors}건. 위 ✗ 를 확인하세요.`); process.exit(1); }
console.log('\n모든 점검 통과');
