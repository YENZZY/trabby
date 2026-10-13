// npm test — 계산 로직(연속 걷기, 걸음 저장소) 테스트. 처음 실행하면 tsx 를 내려받아요.
const { spawnSync } = require('child_process');
const path = require('path');
const r = spawnSync('npx', ['--yes', 'tsx', '--require', path.join(__dirname, 'preload.js'), path.join(__dirname, 'test-logic.ts')], { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
