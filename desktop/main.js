/* REMNANT ARCHIVE 데모 — Windows 앱(Electron) 시작 코드
   - 게임 파일은 app://game/ 으로 연다 (file://이면 sound.js가 HTMLAudio로 바뀌어 증폭이 사라진다)
   - 저장(localStorage)은 origin app://game 기준으로 userData 폴더에 남는다
   - 외부 주소: 데모 종료 화면의 X 링크만 기본 브라우저로 연다. 그 밖의 이동·외부 요청은 막는다 */
'use strict';
const { app, BrowserWindow, protocol, screen, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const APP_NAME = 'Remnant Archive Demo';
const SCHEME = 'app';
const HOST = 'game';
const ORIGIN = SCHEME + '://' + HOST;
const START_PAGE = 'index (1).html';                       // 허브 (처음이면 허브가 플레이 전 안내로 보낸다, D81)
const EXTERNAL_OK = ['https://x.com/remi_r_archive'];     // 기본 브라우저로 열어도 되는 주소
const GAME_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'game')
  : path.join(__dirname, 'app-content');
const DEV = !app.isPackaged;

app.setName(APP_NAME);
/* 첫 실행 안내의 타이핑 효과음(0번)이 첫 클릭 전에도 나도록 (D86 tryPlay) */
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true },
}]);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

/* app://game/<경로> → GAME_DIR/<경로>. 영상 탐색을 위해 Range 요청에 206으로 답한다 */
async function serve(request) {
  const u = new URL(request.url);
  if (u.host !== HOST) return new Response('Not found', { status: 404 });
  let rel;
  try { rel = decodeURIComponent(u.pathname); } catch (e) { return new Response('Bad request', { status: 400 }); }
  if (rel === '/' || rel === '') rel = '/' + START_PAGE;
  const fp = path.normalize(path.join(GAME_DIR, rel));
  if (fp !== GAME_DIR && !fp.startsWith(GAME_DIR + path.sep)) return new Response('Forbidden', { status: 403 });
  let st;
  try { st = await fs.promises.stat(fp); } catch (e) { return new Response('Not found', { status: 404 }); }
  if (!st.isFile()) return new Response('Not found', { status: 404 });
  const type = MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream';
  const size = st.size;
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  const range = request.headers.get('range');
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m && (m[1] || m[2])) {
    let start, end;
    if (m[1]) { start = +m[1]; end = m[2] ? Math.min(+m[2], size - 1) : size - 1; }
    else { start = Math.max(size - +m[2], 0); end = size - 1; }
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    const body = Readable.toWeb(fs.createReadStream(fp, { start, end }));
    return new Response(body, { status: 206, headers: { ...headers, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}` } });
  }
  return new Response(Readable.toWeb(fs.createReadStream(fp)), { status: 200, headers: { ...headers, 'Content-Length': String(size) } });
}

function isGameUrl(url) { return url.startsWith(ORIGIN + '/'); }

function createWindow() {
  /* 기본 1536×864. 화면(작업 영역)이 그보다 작으면(예: 1920×1080 125% 배율) 최대화해서 연다 */
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const W = 1536, H = 864;
  const fits = wa.width >= W + 16 && wa.height >= H + 39;
  const win = new BrowserWindow({
    width: Math.min(W, wa.width),
    height: Math.min(H, wa.height),
    minWidth: Math.min(1280, wa.width),
    minHeight: Math.min(720, wa.height),
    useContentSize: fits,
    center: true,
    title: APP_NAME,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      devTools: DEV,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.removeMenu();
  win.once('ready-to-show', () => { if (!fits) win.maximize(); win.show(); });
  /* 창 제목은 페이지 <title>을 따르지 않고 앱 이름으로 고정 */
  win.on('page-title-updated', (e) => e.preventDefault());

  const wc = win.webContents;
  /* 새 창: X 링크만 기본 브라우저로, 나머지는 막는다 */
  wc.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL_OK.some((ok) => url === ok || url.startsWith(ok + '?') || url.startsWith(ok + '/'))) shell.openExternal(url);
    return { action: 'deny' };
  });
  /* 페이지 이동: 게임 안(app://game/)만 허용 */
  const guard = (e, url) => { if (!isGameUrl(url)) e.preventDefault(); };
  wc.on('will-navigate', guard);
  wc.on('will-redirect', guard);
  wc.on('will-frame-navigate', (e) => { if (!isGameUrl(e.url)) e.preventDefault(); });
  /* F11 전체 화면 전환, 개발 중에는 F12 개발자 도구 */
  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
    else if (DEV && input.key === 'F12') { e.preventDefault(); wc.toggleDevTools(); }
  });

  win.loadURL(ORIGIN + '/' + encodeURI(START_PAGE));
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(() => {
    protocol.handle(SCHEME, serve);
    /* 게임 밖 요청(인터넷 포함)은 보내지 않는다. 글꼴은 앱 안에 있다 */
    session.defaultSession.webRequest.onBeforeRequest((details, cb) => {
      const u = details.url;
      const ok = u.startsWith(ORIGIN + '/') || u.startsWith('devtools://') || u.startsWith('data:') || u.startsWith('blob:') || u === 'about:blank';
      cb({ cancel: !ok });
    });
    session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false));
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
