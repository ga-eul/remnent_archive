/* 효과음 재생 (D83) — 허브 `index (1).html`, 게임 `shinip/index.html`, 데모 종료 페이지가 함께 쓴다
   설정·볼륨: data/sfx.js (R01.SFX, R01.SFX_FILES, R01.SFX_MIX)
   - 소리 켜짐/꺼짐: remnant.global.settings.sound (값이 없으면 켜짐). 꺼짐이면 효과음·BGM 모두 음소거
   - 브라우저 자동 재생 정책: 첫 클릭·키 입력 전에는 울리지 않는다(그 전 요청은 버린다)
   - http(s): Web Audio — 이벤트 볼륨 GainNode(1보다 크면 증폭) → 효과음 묶음(마스터) → 출력(켜짐/꺼짐) → 리미터 → 스피커
     BGM 묶음도 같은 출력·리미터를 지나게 해 두 소리가 겹쳐도 출력이 지나치게 커지지 않게 한다(아직 BGM 없음)
   - file://: Web Audio로 파일을 읽을 수 없어 HTMLAudio로 재생한다(볼륨은 1에서 멈춘다)
   - 재생 중인 소리는 이 모듈이 들고 있어 화면을 다시 그려도 끊기지 않는다(페이지를 떠나면 브라우저가 정리한다) */
window.R01 = window.R01 || {};
(function (R) {
  const CFG = R.SFX || {};
  const MIX = R.SFX_MIX || { master: 0.8, bgm: 0.5, limiter: {} };
  const GKEY = 'remnant.global';
  const script = document.currentScript;
  const BASE = new URL('../assets/sfx/', script ? script.src : location.href).href;
  const url = (file) => BASE + encodeURIComponent(file) + '?v=' + (R.SFX_VER || '1');
  const RESTART_FADE = 0.015;   // 같은 소리를 다시 낼 때 앞의 것을 끊는 시간(초). 딸깍 잡음만 막을 만큼 짧게 (D86)
  const useWA = location.protocol !== 'file:' && !!(window.AudioContext || window.webkitAudioContext);

  function readGlobal() {
    try { return JSON.parse(localStorage.getItem(GKEY) || '{}') || {}; } catch (e) { return {}; }
  }
  let on = (function () { const v = (readGlobal().settings || {}).sound; return typeof v === 'boolean' ? v : true; })();

  let ctx = null, out = null, sfxBus = null, bgmBus = null;
  let unlocked = false;
  const raw = {};        // file → Promise<ArrayBuffer>
  const buf = {};        // file → Promise<AudioBuffer>
  const last = {};       // id → 마지막 재생 시각
  const active = {};     // id → 재생 중인 소리 (clip·loop 정리용)

  function buildGraph() {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    const lim = ctx.createDynamicsCompressor();
    const L = MIX.limiter || {};
    lim.threshold.value = L.threshold ?? -3; lim.knee.value = L.knee ?? 0; lim.ratio.value = L.ratio ?? 20;
    lim.attack.value = L.attack ?? 0.003; lim.release.value = L.release ?? 0.25;
    out = ctx.createGain(); out.gain.value = on ? 1 : 0;
    sfxBus = ctx.createGain(); sfxBus.gain.value = MIX.master;
    bgmBus = ctx.createGain(); bgmBus.gain.value = MIX.bgm;
    sfxBus.connect(out); bgmBus.connect(out); out.connect(lim); lim.connect(ctx.destination);
  }
  function fetchRaw(file) {
    if (!raw[file]) raw[file] = fetch(url(file)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
    return raw[file];
  }
  function decoded(file) {
    if (!ctx) return null;
    if (!buf[file]) buf[file] = fetchRaw(file).then((ab) => new Promise((ok, no) => ctx.decodeAudioData(ab.slice(0), ok, no)));
    return buf[file];
  }

  /* 첫 사용자 입력에서 소리를 연다 (pointerdown·keydown이 click보다 먼저 온다) */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (useWA) {
      try { if (!ctx) buildGraph(); ctx.resume(); Object.keys(raw).forEach(decoded); } catch (e) { /* Web Audio를 쓸 수 없으면 소리 없음 */ }
    }
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  /* ---------- Web Audio 재생 ---------- */
  function startWA(id, c, b) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = b;
    const g = ctx.createGain();
    g.gain.setValueAtTime(c.vol, t);
    src.connect(g); g.connect(sfxBus);
    const hnd = { stop(fade) {
      const n = ctx.currentTime, f = fade == null ? 0.05 : fade;
      try { g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0.0001, n + f); src.stop(n + f + 0.01); } catch (e) { /* 이미 멈춤 */ }
    } };
    if (c.loop) src.loop = true;
    src.start(t);
    if (c.clip) {                                            // 앞부분만: hold초 유지 → fade초 페이드아웃 → 정지
      const end = t + c.clip.hold + c.clip.fade;
      g.gain.setValueAtTime(c.vol, t + c.clip.hold);
      g.gain.linearRampToValueAtTime(0.0001, end);
      src.stop(end + 0.01);
    }
    src.onended = () => { if (active[id] === hnd) delete active[id]; };
    return hnd;
  }

  /* ---------- HTMLAudio 재생 (file://) ---------- */
  function startEl(id, c) {
    const a = new Audio(url(c.file));
    const vol = Math.min(1, c.vol * MIX.master);
    a.volume = on ? vol : 0;
    a.loop = !!c.loop;
    let timers = [];
    const clear = () => { timers.forEach(clearInterval); timers = []; };
    const hnd = { el: a, base: vol, stop(fade) {
      clear();
      const f = (fade == null ? 0.05 : fade) * 1000, v0 = a.volume, t0 = Date.now();
      const tick = setInterval(() => {
        const k = Math.min(1, (Date.now() - t0) / Math.max(1, f));
        a.volume = Math.max(0, v0 * (1 - k));
        if (k >= 1) { clearInterval(tick); a.pause(); a.currentTime = 0; }
      }, 30);
      timers.push(tick);
    } };
    const p = a.play();
    if (p && p.catch) p.catch(() => { /* 재생 거부·파일 없음은 조용히 넘어간다 */ });
    if (c.clip) {
      const t0 = Date.now(), hold = c.clip.hold * 1000, fade = c.clip.fade * 1000;
      const tick = setInterval(() => {
        const e = Date.now() - t0;
        if (e < hold) return;
        const k = Math.min(1, (e - hold) / fade);
        a.volume = on ? Math.max(0, vol * (1 - k)) : 0;
        if (k >= 1) { clear(); a.pause(); a.currentTime = 0; if (active[id] === hnd) delete active[id]; }
      }, 30);
      timers.push(tick);
    }
    a.addEventListener('ended', () => { clear(); if (active[id] === hnd) delete active[id]; });
    return hnd;
  }

  function start(id, c) {
    if (active[id]) { active[id].stop(RESTART_FADE); delete active[id]; }   // 같은 소리는 겹치지 않게 앞의 것을 정리
    if (useWA) {
      if (!ctx) return;
      const asked = Date.now();
      const p = decoded(c.file);
      if (!p) return;
      p.then((b) => {
        if (Date.now() - asked > 400) return;                   // 늦게 받은 소리는 버린다 (화면과 어긋나지 않게)
        if (active[id]) active[id].stop(RESTART_FADE);
        active[id] = startWA(id, c, b);
      }).catch(() => { /* 파일 없음 */ });
    } else {
      active[id] = startEl(id, c);
    }
  }

  const S = (R.sound = {});
  S.isOn = () => on;
  S.ready = () => unlocked;
  /* 이벤트 번호로 재생. 꺼짐·첫 입력 전·간격 제한이면 울리지 않는다 */
  S.play = function (id) {
    const c = CFG[id];
    if (!c || !on || !unlocked) return false;
    const now = Date.now();
    if (c.gap && last[id] && now - last[id] < c.gap) return false;
    last[id] = now;
    if (c.delay) setTimeout(() => { if (on) start(id, c); }, c.delay);
    else start(id, c);
    return true;
  };
  /* 첫 입력 전에도 브라우저가 허락하면 재생해 본다 (플레이 전 안내 타이핑, D86).
     허락하지 않으면 조용히 넘어간다. still()이 false가 되면(이미 넘겼거나 끝남) 늦게라도 시작하지 않는다 */
  S.tryPlay = function (id, still) {
    const c = CFG[id];
    if (!c || !on) return;
    if (unlocked) { S.play(id); return; }
    const asked = Date.now();
    const go = () => { if ((!still || still()) && Date.now() - asked < 800) { last[id] = Date.now(); start(id, c); } };
    if (useWA) {
      try {
        if (!ctx) buildGraph();
        decoded(c.file);
        ctx.resume().then(() => { if (ctx.state === 'running') go(); }).catch(() => {});
      } catch (e) { /* 소리 없음 */ }
    } else {
      if (!still || still()) { const h = startEl(id, c); active[id] = h; h.el.play().catch(() => { if (active[id] === h) delete active[id]; }); }
    }
  };
  S.stop = function (id, fade) { if (active[id]) { active[id].stop(fade == null ? 0.15 : fade); delete active[id]; } };
  S.playing = (id) => !!active[id];
  /* 미리 받아 두기 (첫 재생이 늦지 않게). Web Audio에서만 의미가 있다 */
  S.preload = function (ids) {
    if (!useWA) return;
    (ids || Object.keys(CFG)).forEach((id) => { const c = CFG[id]; if (c) fetchRaw(c.file).catch(() => {}); });
  };
  /* 소리 켜짐/꺼짐을 바꾸고 remnant.global.settings.sound에 저장 */
  S.setOn = function (v) {
    on = !!v;
    try { const g = readGlobal(); g.settings = g.settings || {}; g.settings.sound = on; localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) { /* 저장 불가 환경 */ }
    apply();
  };
  function apply() {
    if (out) out.gain.setValueAtTime(on ? 1 : 0, ctx.currentTime);
    Object.keys(active).forEach((id) => { const a = active[id]; if (a.el) a.el.volume = on ? a.base : 0; });
  }
  /* 다른 탭에서 바꾼 켜짐/꺼짐도 따른다 */
  window.addEventListener('storage', (e) => {
    if (e.key !== GKEY) return;
    const v = (readGlobal().settings || {}).sound;
    on = typeof v === 'boolean' ? v : true; apply();
  });
  /* 페이지 이동: 소리가 켜져 있으면 클릭음이 잘리지 않게 잠깐(0.16초) 기다렸다 이동한다. id가 있으면 그 소리를 낸다 */
  S.navigate = function (href, id) {
    if (id != null) S.play(id);
    if (on && unlocked) setTimeout(() => { location.href = href; }, 160); else location.href = href;
  };
})(window.R01);
