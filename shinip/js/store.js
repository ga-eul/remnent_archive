/* 저장 — 기준: case01-logic.md R-80~R-86, world.md 게임 전체 구조
   remnant.present-01        : CASE 01 진행 칸 (tried_pairs·C13 진행 상태 포함, R-80)
   remnant.present-01.saves  : 중간 세이브 칸 (최종 추론 직전 상태, 최대 3개, D43)
   remnant.global            : 공통 칸. 허브는 여기만 읽는다 (R-81, D21)
     { version, status: { 'present-01': 'none' | 'in_progress' | 'finished' },
       endings_seen: { 'present-01': { '1': 'PARTIAL', ... } }, unlocked: [...], settings: {},
       progress: { 'present-01': { saved_at, point } },                       // 진행 중 기록 카드용
       saves: { 'present-01': [ { id, saved_at, theme, point }, ... ] } }    // 중간 세이브 카드용 (내용은 없음) */
window.R01 = window.R01 || {};
(function (R) {
  const S = (R.store = {});
  const CASE_ID = 'present-01';
  const CASE_KEY = 'remnant.present-01';
  const SAVES_KEY = 'remnant.present-01.saves';
  const GLOBAL_KEY = 'remnant.global';
  const VERSION = 1;
  const MAX_SAVES = 3;                            // D43
  const THEME = '신입사원';
  const RANK = { INCOMPLETE: 0, PARTIAL: 1, COMPLETE: 2 };
  /* 파일 카드에 보이는 지점 이름 */
  S.POINT = { '01': '입사', '02': '사내 인트라넷', '03': '1차 수색', '04': '심문', '05': '2차 수색', '06': '3차 수색', '07': '최종 추론', ending: '엔딩', collection: '엔딩 수집' };

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  /* 저장된 상태를 기본값 위에 덮어 읽는다 (새로 생긴 상태값이 있어도 깨지지 않게) */
  function revive(state) {
    const s = Object.assign(R.logic.newState(), state);
    if (s.opening_step === 'welcome') s.opening_step = 'monologue'; // D36 이전 저장분: 환영 알림 단계 삭제
    return R.logic.recompute(s);
  }

  /* 진행 칸 */
  S.loadCase = function () {
    const saved = read(CASE_KEY);
    if (!saved || saved.version !== VERSION || !saved.state) return null;
    return revive(saved.state);
  };
  S.saveCase = function (s) {
    write(CASE_KEY, { version: VERSION, state: s });
    const g = S.loadGlobal();                     // 허브의 ‘진행 중 기록’ 카드용 요약
    g.progress[CASE_ID] = { saved_at: Date.now(), point: S.POINT[s.page] || s.page };
    write(GLOBAL_KEY, g);
  };
  S.clearCase = function () {
    try { localStorage.removeItem(CASE_KEY); } catch (e) { /* 무시 */ }
    const g = S.loadGlobal(); delete g.progress[CASE_ID]; write(GLOBAL_KEY, g);
  };

  /* 공통 칸 */
  S.loadGlobal = function () {
    const g = read(GLOBAL_KEY) || {};
    return {
      version: VERSION,
      status: g.status || {},
      endings_seen: g.endings_seen || {},
      unlocked: g.unlocked || [CASE_ID],
      settings: g.settings || {},
      progress: g.progress || {},
      saves: g.saves || {}
    };
  };
  S.status = () => S.loadGlobal().status[CASE_ID] || 'none';
  S.setStatus = function (value) {               // R-81: CASE 01이 직접 바꾼다
    const g = S.loadGlobal();
    g.status[CASE_ID] = value;
    write(GLOBAL_KEY, g);
  };
  S.recordEnding = function (id, grade) {        // 본 엔딩 + 엔딩별 최고 등급
    const g = S.loadGlobal();
    const seen = (g.endings_seen[CASE_ID] = g.endings_seen[CASE_ID] || {});
    const prev = seen[id];
    if (!prev || RANK[grade] > RANK[prev]) seen[id] = grade;
    g.status[CASE_ID] = 'finished';
    write(GLOBAL_KEY, g);
  };
  S.endingsSeen = () => S.loadGlobal().endings_seen[CASE_ID] || {};

  /* ---------- 중간 세이브 (D43): 최종 추론 직전 상태를 파일로, 최대 3개 ---------- */
  S.listSaves = () => (read(SAVES_KEY) || []);
  S.addSave = function (s, point) {
    const saves = S.listSaves();
    const meta = { id: 'cp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), // 겹치지 않는 파일 번호
      saved_at: Date.now(), theme: THEME, point: point || S.POINT[s.page] };
    saves.unshift(Object.assign({ state: JSON.parse(JSON.stringify(s)) }, meta));
    saves.splice(MAX_SAVES);                     // 가장 오래된 것부터 지운다
    write(SAVES_KEY, saves);
    const g = S.loadGlobal();                    // 허브는 내용 없이 요약만 읽는다
    g.saves[CASE_ID] = saves.map(({ id, saved_at, theme, point: p }) => ({ id, saved_at, theme, point: p }));
    write(GLOBAL_KEY, g);
    return meta;
  };
  /* 중간 세이브를 진행 칸으로 불러온다 (그 판은 다시 진행 중) */
  S.loadSave = function (id) {
    const hit = S.listSaves().find((x) => x.id === id);
    if (!hit) return null;
    const s = revive(hit.state);
    S.saveCase(s);
    S.setStatus('in_progress');
    return s;
  };
})(window.R01);
