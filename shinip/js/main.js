/* 시작·복원·저장 연결
   허브에서 들어오는 방법 (R-84·R-85):
     shinip/index.html?mode=new       → 진행 칸만 비우고 새로 시작 (status: in_progress)
     shinip/index.html?mode=continue  → 저장된 진행 복원
     (주소에 mode가 없으면 저장이 있으면 복원, 없으면 새로 시작)
   ?dev=1 을 붙이면 개발용 패널이 나온다 (연결 성공 상태를 바로 켜서 엔딩 판정을 확인하는 용도). */
window.R01 = window.R01 || {};
(function (R) {
  /* 허브 주소. 저장소에서는 인트로 파일 이름이 `index (1).html`이다. 배포할 때 '../index.html'로 바꾼다. */
  const HUB_URL = '../index (1).html';

  const L = R.logic;
  const S = R.store;
  const { h, button } = R.ui;
  const params = new URLSearchParams(location.search);
  const DEV = params.get('dev') === '1';

  /* 허브 [보존 기록] (?view=records): 진행 칸·status를 건드리지 않고 엔딩 수집만 보여 준다 (R-83) */
  const RECORDS_ONLY = params.get('view') === 'records';
  function bootRecords() {
    const root = document.getElementById('app');
    root.append(
      h('header', { class: 'top' }, h('div', null,
        h('p', { class: 'eyebrow mono' }, 'REMNANT ARCHIVE'), h('p', { class: 'page-label' }, '보존 기록'))),
      R.pages.collection());
  }

  /* 연출 줄이기: 허브에서 정한 설정(remnant.global.settings.reduced) 또는 기기 설정을 따른다 */
  function applyReduced() {
    const saved = S.loadGlobal().settings.reduced;
    const sys = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.toggle('reduced', typeof saved === 'boolean' ? saved : sys);
  }

  function boot() {
    const mode = params.get('mode');
    // 허브 [이어서 출근하기]에서 중간 세이브 파일을 고르면 ?mode=load&save=<id> (D43)
    let state = mode === 'load' ? S.loadSave(params.get('save')) : mode === 'new' ? null : S.loadCase();
    if (mode === 'load' && !state) state = S.loadCase();
    if (!state) {
      S.clearCase();                 // R-84: 진행 칸만 비운다. remnant.global은 그대로
      state = L.recompute(L.newState());
      S.setStatus('in_progress');    // R-81: 시작할 때 in_progress
      S.saveCase(state);
    }
    if (state.ending_evaluation && state.page !== 'collection') state.page = 'collection'; // R-82
    // 새로고침했을 때 ?mode=new 가 다시 적용되지 않도록 주소에서 지운다
    if (mode) {
      params.delete('mode'); params.delete('save');
      const q = params.toString();
      try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '')); } catch (e) { /* file:// 등 */ }
    }
    return state;
  }

  const app = (R.app = {
    state: null,
    commit(fn) {
      fn(app.state);
      S.saveCase(app.state);         // 모든 변경을 바로 저장 (R-80)
      app.render();
    },
    render() {
      const s = app.state;
      const root = document.getElementById('app');
      root.textContent = '';
      // 01 오프닝·02 인트라넷은 화면 전체를 쓴다 (자체 머리줄)
      const full = s.page === '01' || s.page === '02' || s.page === 'ending';  // 엔딩 연출도 화면 전체
      root.classList.toggle('full', full);
      if (full) { root.append(R.pages[s.page](s)); if (DEV) root.append(devPanel(s)); return; }
      const canArchive = !['ending', 'collection'].includes(s.page);
      root.append(
        h('header', { class: 'top' },
          h('div', null,
            h('p', { class: 'eyebrow mono' }, 'PRESENT · CASE 01'),
            h('p', { class: 'page-label' }, R.pages.LABELS[s.page] || s.page)),
          h('div', { class: 'row' },
            s.id_card_issued ? h('span', { class: 'me' }, R.pages.avatar(s.player_avatar, 28),
              h('span', null, s.player_name), h('span', { class: 'mono accent' }, R.OPENING.employeeNo)) : null,
            canArchive ? h('button', { type: 'button', class: 'btn small archive-btn', onClick: () => R.pages.archive(s) },
              'My Archive', h('span', { class: 'archive-count mono' }, String(s.clue_order.length))) : null)),
        stepBar(s),
        R.pages[s.page](s));
      if (DEV) root.append(devPanel(s));
    },
    goHub() { location.href = encodeURI(HUB_URL); }
  });

  /* ---------- 상단 진행 단계 표시줄 (수색 1부터). 이미 진행한 단계는 눌러서 돌아갈 수 있다 ---------- */
  function stepBar(s) {
    if (!L.STEPS.some(([p]) => p === s.page)) return null;
    return h('nav', { class: 'steps', 'aria-label': '진행 단계' }, L.STEPS.map(([p, label], i) => {
      const cur = p === s.page;
      const reached = L.stepReached(s, p);
      const can = L.canJump(s, p);
      return h('button', { type: 'button', class: 'step-tab' + (cur ? ' on' : '') + (reached ? ' reached' : '') + (can ? ' can' : ''),
        disabled: !can, 'aria-current': cur ? 'step' : null, title: can ? label + '(으)로 돌아가기' : null,
        onClick: () => app.commit((st) => L.jump(st, p)) },
      h('span', { class: 'step-no mono' }, String(i + 1).padStart(2, '0')), h('span', null, label));
    }));
  }

  /* ---------- 개발용 패널 (?dev=1) ---------- */
  function devPanel(s) {
    const allClues = () => app.commit((st) => {
      R.CLUES.filter((c) => c.search && c.search <= L.searchStage(st)).forEach((c) => L.openClue(st, c.key));
    });
    const toggle = (id) => app.commit((st) => { st['connection_' + id] = !st['connection_' + id]; L.recompute(st); });
    return h('aside', { class: 'dev' },
      h('p', { class: 'mono' }, 'DEV · ' + s.page),
      button('이 단계 자료 모두 열람', allClues, { small: true }),
      h('div', { class: 'dev-conns' }, R.NORMAL_CONNECTIONS.map((id) =>
        button(id + (s['connection_' + id] ? ' ✓' : ''), () => toggle(id), { small: true, primary: s['connection_' + id], disabled: s.board_locked }))),
      button('진행 칸 지우기', () => { S.clearCase(); S.setStatus('none'); location.reload(); }, { small: true }));
  }

  applyReduced();
  if (RECORDS_ONLY) bootRecords();
  else { app.state = boot(); app.render(); }
})(window.R01);
