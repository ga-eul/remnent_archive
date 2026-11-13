/* 앱에 넣을 게임 파일을 desktop/app-content/에 복사한다 (원본 파일은 고치지 않는다).
   - 실행에 필요한 파일만: 허브·플레이 전 안내·로딩·데모 종료 페이지, shinip/ 전체
   - 글꼴: 복사본 HTML에서만 Google Fonts <link>를 앱에 넣은 fonts/fonts.css로 바꾼다
     (Fontsource = Google Fonts와 같은 woff2·unicode-range 조각, OFL). 쓰는 굵기만 넣는다 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');          // 저장소 루트
const DESK = path.resolve(__dirname, '..');
const OUT = path.join(DESK, 'app-content');

const PAGES = ['index (1).html', 'first-launch-notice-terminal.html', 'loading.html', 'shinip_demo_complete.html'];
const DIRS = ['shinip'];
const FONT_CSS_LINK = /<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>/g;
const PRECONNECT = /[ \t]*<link[^>]+rel="preconnect"[^>]+href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\r?\n?/g;
/* 페이지에서 Google Fonts로 부르던 굵기와 같게 */
const FONTS = [
  { pkg: '@fontsource/noto-sans-kr', weights: [400, 500, 700, 900] },
  { pkg: '@fontsource/jetbrains-mono', weights: [400, 500] },
];

function fail(msg) { console.error('[stage] ' + msg); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const p of PAGES) fs.copyFileSync(path.join(ROOT, p), path.join(OUT, p));
for (const d of DIRS) fs.cpSync(path.join(ROOT, d), path.join(OUT, d), { recursive: true });

/* 글꼴 */
const fontDir = path.join(OUT, 'fonts');
fs.mkdirSync(path.join(fontDir, 'files'), { recursive: true });
let css = '/* Noto Sans KR, JetBrains Mono — SIL Open Font License 1.1 (LICENSE-*.txt). Fontsource 패키지에서 복사 */\n';
const licenses = [];
for (const f of FONTS) {
  const base = path.join(DESK, 'node_modules', f.pkg);
  if (!fs.existsSync(base)) fail(f.pkg + ' 이 없습니다. desktop/에서 npm install을 먼저 실행하세요.');
  for (const w of f.weights) {
    let c = fs.readFileSync(path.join(base, w + '.css'), 'utf8');
    c = c.replace(/,\s*url\([^)]+\.woff\) format\('woff'\)/g, '');           // woff2만 쓴다
    c = c.replace(/url\(\.\/files\/([^)]+\.woff2)\)/g, (m, file) => {
      fs.copyFileSync(path.join(base, 'files', file), path.join(fontDir, 'files', file));
      return 'url(./files/' + file + ')';
    });
    css += c + '\n';
  }
  const lic = path.join(base, 'LICENSE');
  if (fs.existsSync(lic)) { const name = 'LICENSE-' + path.basename(f.pkg) + '.txt'; fs.copyFileSync(lic, path.join(fontDir, name)); licenses.push(name); }
}
fs.writeFileSync(path.join(fontDir, 'fonts.css'), css);

/* 복사본 HTML의 Google Fonts 링크를 앱 글꼴로 */
const htmlTargets = PAGES.map((p) => ({ file: p, rel: 'fonts/fonts.css' }))
  .concat([{ file: 'shinip/index.html', rel: '../fonts/fonts.css' }]);
for (const t of htmlTargets) {
  const fp = path.join(OUT, t.file);
  let h = fs.readFileSync(fp, 'utf8');
  const n = (h.match(FONT_CSS_LINK) || []).length;
  if (n !== 1) fail(t.file + ': Google Fonts 링크가 ' + n + '개입니다 (1개여야 함).');
  h = h.replace(PRECONNECT, '').replace(FONT_CSS_LINK, '<link href="' + t.rel + '" rel="stylesheet">');
  if (/fonts\.(googleapis|gstatic)\.com/.test(h)) fail(t.file + ': Google Fonts 주소가 남아 있습니다.');
  fs.writeFileSync(fp, h);
}
/* 다른 HTML에 Google Fonts가 남아 있지 않은지 */
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) scan(fp);
    else if (/\.(html|css|js)$/.test(e.name) && /fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(fp, 'utf8'))) fail(path.relative(OUT, fp) + ': Google Fonts 주소가 남아 있습니다.');
  }
})(OUT);

const count = fs.readdirSync(path.join(fontDir, 'files')).length;
console.log('[stage] app-content 준비 완료: 페이지 ' + PAGES.length + '개 + shinip/, 글꼴 파일 ' + count + '개, 라이선스 ' + licenses.join(', '));
