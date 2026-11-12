/* 02 사내 인트라넷 (prd.md 3단계) — 시안: 사내 인트라넷.jpg / 사내 메신저(창).png·jpg / 사원정보.jpg / 래미.jpg
   진행: 래미 첫 등장·안내 → 메신저 전임자 메시지 → 래미에게 보안코드 질문 → 십자말풀이 → REMAIN → 브리핑 → [제한 시스템 접속] (= 1차 수색 시작) */
window.R01 = window.R01 || {};
(function (R) {
  const { h, button, dialogue, toast } = R.ui;
  const L = R.logic;
  const I = R.INTRANET, RA = R.RAMI, CW = R.CROSSWORD, M = R.MESSENGER, O = R.OPENING;
  const commit = (fn) => R.app.commit(fn);
  const fill = (t, s) => t.replace(/\{name\}/g, s.player_name);

  /* 화면에만 있는 상태 (저장하지 않음) */
  const ui = { tab: 'home', panel: null, room: null, roomTab: 'all', search: '', profileTab: 'profile', talking: false, notice: null };

  /* 고정 SVG 아이콘 (플레이어 입력 없음) */
  const SVG = {
    rami: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="7" width="34" height="26" rx="12" fill="#eef1f6" stroke="#0b0b0b" stroke-width="2"/><rect x="9" y="13" width="22" height="14" rx="5" fill="#0a1636"/><ellipse cx="15" cy="20" rx="3.4" ry="2.6" fill="#2f4bff"/><ellipse cx="25" cy="20" rx="3.4" ry="2.6" fill="#2f4bff"/></svg>',
    mail: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="9" width="30" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 10l15 12 15-12M5 30l11-10M35 30L24 20" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    user: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 31c3-6 7-8 11-8s8 2 11 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    logo: '<svg viewBox="0 0 40 44" aria-hidden="true"><rect x="2" y="0" width="5" height="5" fill="currentColor"/><rect x="2" y="9" width="5" height="25" fill="currentColor"/><path d="M11 9l24 25H11z" fill="none" stroke="currentColor" stroke-width="4"/><rect x="2" y="38" width="5" height="5" fill="currentColor"/><path d="M11 38h18l4 5H11z" fill="currentColor"/></svg>'
  };
  // 메신저 보내기 버튼의 종이비행기 (입력칸은 사용할 수 없어 장식으로만 둔다)
  SVG.send = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 20.6 3.6c.5-.2 1 .3.8.8L13.8 22c-.2.5-.9.5-1.1 0l-2.6-6.9L3 12.4c-.5-.2-.5-1 0-1.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10.1 15.1 20.9 3.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const icon = (name, cls) => { const el = h('span', { class: 'ico ' + (cls || '') }); el.innerHTML = SVG[name]; return el; };

  /* ---------- 래미 말하기 (대화창 + 기록, R-18) ---------- */
  function ramiSay(lines, onDone) {
    ui.talking = true;
    dialogue(lines.map((t) => [RA.name, t]), () => { ui.talking = false; if (onDone) onDone(); else R.app.render(); }, {
      portrait: R.ASSETS.ramiBasic,             // 인트라넷의 래미는 기본 표정
      onLine: (i) => { R.app.state.rami_log.push(lines[i]); R.store.saveCase(R.app.state); }
    });
  }

  /* 진입 시 자동으로 나오는 래미 대사 (새로고침해도 끝나지 않은 장면은 다시 나온다) */
  function autoScenes(s) {
    if (ui.talking) return;
    if (!s.intranet_intro_done) {
      ui.talking = true;
      setTimeout(() => ramiSay([fill(RA.firstAppear, s), ...RA.intro, RA.findMe], () => commit((st) => L.finishIntro(st))), 50);
    } else if (s.security_code_correct && !s.briefing_done) {
      ui.talking = true;
      setTimeout(() => ramiSay(RA.briefing.map((t) => fill(t, s)), () => commit((st) => L.finishBriefing(st))), 50);
    }
  }

  function openPanel(name) { ui.panel = name; R.app.render(); }
  function closePanel() { ui.panel = null; R.app.render(); }

  /* ---------- 상단 메뉴 ---------- */
  function top(s) {
    const unread = s.intranet_intro_done && !s.predecessor_msg_read;
    const iconBtn = (name, label, panel, dot) => h('button', { type: 'button', class: 'in-icon ' + name + (ui.panel === panel ? ' on' : ''),
      'aria-label': label, title: label, onClick: () => openPanel(panel) }, icon(name), dot ? h('span', { class: 'dot', 'aria-hidden': 'true' }) : null);
    return h('header', { class: 'in-top' },
      h('div', { class: 'in-logo' }, icon('logo'), h('span', null, 'REMNANT', h('br'), 'ARCHIVE')),
      h('nav', { class: 'in-nav', 'aria-label': '인트라넷 메뉴' }, I.tabs.map(([k, label]) => h('button', {
        type: 'button', class: 'in-tab' + (ui.tab === k ? ' on' : ''), 'aria-current': ui.tab === k ? 'page' : null,
        onClick: () => { ui.tab = k; R.app.render(); } }, label))),
      h('div', { class: 'in-icons' },
        iconBtn('rami', '래미 AI', 'rami', s.intranet_intro_done && s.predecessor_msg_read && !s.crossword_open),
        iconBtn('mail', '사내 메신저', 'messenger', unread),
        iconBtn('user', '사원 정보', 'profile')),
      h('span', { class: 'in-date mono' }, I.date));
  }

  /* ---------- 홈 ---------- */
  function startButton(s) {
    return s.briefing_done ? button(RA.startSearch, () => commit((st) => L.go(st, '03')), { primary: true }) : null;
  }
  function home(s) {
    const hero = I.hero;
    const count = s.clue_order.length;
    return h('div', null,
      h('section', { class: 'in-hero', style: 'background-image:url(' + R.ASSETS.intranetHero + ')' },
        h('div', { class: 'in-hero-text' },
          h('h1', null, hero.title),
          h('p', { class: 'in-hero-sub' }, h('em', null, hero.subAccent), hero.sub),
          h('p', { class: 'in-hero-desc' }, hero.desc),
          h('div', { class: 'row' },
            button(hero.more, () => {}, { small: true })))),   // 회사 소개 화면은 아직 없음 (누르면 반응 없음)
      h('section', { class: 'in-cards' },
        h('article', { class: 'in-card light' },
          h('div', { class: 'in-card-head' }, h('h2', null, '사내 공지사항'),
            h('button', { type: 'button', class: 'link', onClick: () => openNotice(null) }, '더보기 >')),
          h('ul', { class: 'in-list' }, I.notices.map((n, i) => n.home ? h('li', null,
            h('button', { type: 'button', class: 'in-list-btn', onClick: () => openNotice(i) },
              h('span', { class: 'mono' }, n.date), h('span', null, n.title))) : null))),
        h('article', { class: 'in-card light' },
          h('div', { class: 'in-card-head' }, h('h2', null, '근무 일정'),
            h('button', { type: 'button', class: 'link', onClick: () => { ui.tab = 'schedule'; R.app.render(); } }, '더보기 >')),
          h('div', { class: 'in-sched' },
            h('div', { class: 'in-sched-date' }, h('strong', null, '04. 12'), h('span', null, '(Thu)')),
            h('div', { class: 'in-sched-time' },
              h('strong', { class: 'js-clock mono' }, L.workClock(s)), h('span', { class: 'mono' }, I.workHours),
              button('상세 일정 보기', () => { ui.tab = 'schedule'; R.app.render(); }, { small: true })))),
        h('button', { type: 'button', class: 'in-card dark in-card-btn', 'aria-label': 'My Archive 열기', onClick: () => openPanel('archive') },
          h('div', { class: 'in-card-head' }, h('h2', null, 'My Archive'), h('span', { class: 'muted' }, '총 ' + count + '건')),
          h('div', { class: 'in-mini-tabs' }, h('span', { class: 'on' }, '전체'), h('span', null, '문서'), h('span', null, 'CCTV')),
          count ? h('ul', { class: 'in-list' }, s.clue_order.slice(-3).map((k) => h('li', null, L.clue(k).name)))
            : h('p', { class: 'muted' }, I.archiveEmpty))));
  }

  function openNotice(i) { ui.tab = 'notice'; ui.notice = i; R.app.render(); }

  /* 근무 일정: 지금 시각까지 지난 일정은 흐리게, 가장 최근 일정은 ‘지금’으로 강조 */
  const toMin = (t) => { const [hh, mm] = t.slice(0, 5).split(':').map(Number); return hh * 60 + mm; };
  function scheduleTab(s) {
    const now = toMin(L.workClock(s));
    let cur = -1;
    I.schedule.forEach(([t], i) => { if (toMin(t) <= now) cur = i; });
    return h('section', { class: 'in-page' },
      h('div', { class: 'in-page-head' }, h('h2', null, '근무 일정'), h('span', { class: 'mono muted' }, '4XXX.04.12 (Thu)')),
      h('div', { class: 'in-now' }, h('span', null, '현재 시각'), h('strong', { class: 'js-clock mono' }, L.workClock(s)),
        h('span', { class: 'muted' }, '근무 시간 ' + I.workHours)),
      h('ol', { class: 'in-timeline' }, I.schedule.map(([t, what, who], i) => h('li', { class: i < cur ? 'past' : i === cur ? 'now' : '' },
        h('span', { class: 'mono t' }, t), h('span', { class: 'what' }, what), h('span', { class: 'who' }, who),
        i === cur ? h('span', { class: 'now-tag mono' }, 'NOW') : null))),
      h('h3', null, '이번 주 일정'),
      h('ul', { class: 'in-rows' }, I.week.map(([d, txt]) => h('li', null, h('span', { class: 'mono' }, d), h('span', null, txt)))));
  }

  /* 공지사항: 목록에서 누르면 본문이 펼쳐진다 */
  function noticeTab() {
    return h('section', { class: 'in-page' },
      h('div', { class: 'in-page-head' }, h('h2', null, '공지사항'), h('span', { class: 'muted' }, '총 ' + I.notices.length + '건')),
      h('ul', { class: 'in-notices' }, I.notices.map((n, i) => {
        const open = ui.notice === i;
        return h('li', { class: open ? 'open' : '' },
          h('button', { type: 'button', class: 'in-notice-row', 'aria-expanded': String(open),
            onClick: () => { ui.notice = open ? null : i; R.app.render(); } },
          h('span', { class: 'mono' }, n.date), h('span', { class: 'title' }, n.title), h('span', { class: 'who' }, n.dept)),
          open ? h('div', { class: 'in-notice-body' }, n.body.map((t) => h('p', null, t))) : null);
      })));
  }

  function tabBody(s) {
    if (ui.tab === 'home') return home(s);
    if (ui.tab === 'schedule') return scheduleTab(s);
    if (ui.tab === 'notice') return noticeTab();
    return h('section', { class: 'in-page' }, h('h2', null, '업무 기록'),
      h('p', null, s.player_name + ' · ' + O.dept + ' · ', h('span', { class: 'mono accent' }, O.employeeNo)));
  }

  /* ---------- 사내 메신저 (사내 메신저.png 시안) ---------- */
  function messenger(s) {
    const p = M.predecessor;
    // 공용 채팅방 5개를 위에, 전임자(RA-H) 방을 그 아래에 둔다 (D38)
    const rooms = M.groups.map((g) => ({ id: g.id, name: g.name })).concat([{ id: p.id, name: p.name, personal: true }]);
    const visible = () => rooms.filter((r) => (ui.roomTab === 'all' || (ui.roomTab === 'personal') === !!r.personal) &&
      (!ui.search || r.name.includes(ui.search.trim())));
    /* 검색: 화면 전체를 다시 그리지 않고 목록만 바꾼다 (한글 조합 중 글자가 쪼개지지 않게) */
    const search = h('input', { class: 'msgr-search', placeholder: '대화방 검색', 'aria-label': '대화방 검색', value: ui.search });
    search.addEventListener('input', () => { ui.search = search.value; fillRooms(); });
    const pick = (r) => {
      ui.room = r.id;
      if (r.id === p.id) commit((st) => L.readPredecessor(st)); else R.app.render();
    };
    /* 표시용 보조 정보 (기존 데이터에서만 뽑는다) */
    const lastMsg = (g) => { const th = g.threads[g.threads.length - 1]; return th.msgs[th.msgs.length - 1]; };
    const preview = (r) => {
      if (r.personal) return p.lines[0];
      const [who, t] = lastMsg(M.groups.find((g) => g.id === r.id));
      return R.staffName(who) + ': ' + t;
    };
    const ava = (label, cls) => h('span', { class: 'msgr-ava ' + (cls || ''), 'aria-hidden': 'true' }, label);
    const whoCls = (who) => ({ A: 'a', B: 'b', C: 'c', '관리자': 'admin' })[who] || '';
    const whoAva = (who) => ava(who === '관리자' ? '관' : (R.STAFF[who] ? R.STAFF[who].initial : who), whoCls(who));
    const whoName = (who) => R.staffName(who);                                 // 발신자는 이름으로 (D44)

    const roomBtn = (r) => h('button', {
      type: 'button', class: 'msgr-room' + (r.personal ? ' pinned' : '') + (ui.room === r.id ? ' on' : ''), onClick: () => pick(r) },
    r.personal ? ava('RA', 'ra') : ava(r.name[0], 'room'),
    h('span', { class: 'msgr-room-text' },
      h('span', { class: 'msgr-room-top' }, h('span', { class: 'msgr-room-name' }, r.name),
        r.personal ? h('span', { class: 'msgr-label mono' }, p.label) : h('span', { class: 'msgr-label' }, '그룹')),
      h('span', { class: 'msgr-preview' }, preview(r))),
    r.personal && !s.predecessor_msg_read ? h('span', { class: 'dot', 'aria-label': '읽지 않음' }) : null);
    const roomsBox = h('div', { class: 'msgr-rooms' });
    function fillRooms() {
      roomsBox.textContent = '';
      const v = visible();
      roomsBox.append(...(v.length ? v.map(roomBtn) : [h('p', { class: 'muted msgr-none' }, '검색 결과가 없습니다.')]));
    }
    fillRooms();

    /* 메시지: 같은 사람이 이어서 말하면 한 묶음(아바타·이름 한 번, 말풍선 여러 개), 묶음의 마지막 말풍선 옆에 시각 */
    const clock = (base, add) => {
      const [hh, mm] = base.split(':').map(Number); const t = hh * 60 + mm + add;
      const H = Math.floor(t / 60) % 24, M2 = t % 60;
      return (H < 12 ? '오전 ' : '오후 ') + ((H % 12) || 12) + ':' + String(M2).padStart(2, '0');
    };
    const msgRows = (msgs, base, startGroup) => {
      const groups = [];
      msgs.forEach(([who, t]) => { const last = groups[groups.length - 1]; if (last && last.who === who) last.lines.push(t); else groups.push({ who, lines: [t] }); });
      return groups.map((g, gi) => h('div', { class: 'msgr-group' },
        whoAva(g.who),
        h('div', { class: 'msgr-group-body' },
          h('span', { class: 'msgr-who ' + whoCls(g.who) }, whoName(g.who)),
          g.lines.map((t, li) => h('div', { class: 'msgr-line' }, h('p', { class: 'msgr-bubble' }, t),
            li === g.lines.length - 1 && base ? h('span', { class: 'msgr-time' }, clock(base, (startGroup || 0) + gi)) : null)))));
    };
    const calIco = () => { const e = h('span', { class: 'msgr-cal', 'aria-hidden': 'true' }); e.innerHTML = '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 6h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.4"/></svg>'; return e; };

    let view;
    let headSub = '';
    if (!ui.room) view = h('div', { class: 'msgr-empty muted' }, '대화방을 선택하세요');
    else if (ui.room === p.id) {
      headSub = '개인 · ' + p.label;
      view = h('div', { class: 'msgr-thread' },
        h('div', { class: 'msgr-msg pinned' }, ava('RA', 'ra'),
          h('div', { class: 'msgr-msg-body' },
            h('span', { class: 'msgr-who' }, p.name, h('span', { class: 'msgr-label mono' }, p.label)),
            p.lines.map((t) => (t === '' ? h('p', { class: 'msgr-gap', 'aria-hidden': 'true' })
              : typeof t === 'string' ? h('p', null, t)                     // 문자열에는 옛 .bold() 메서드가 있어 t.bold로 가리면 안 된다
                : h('p', t.bold ? { class: 'msgr-strong' } : null, t.text))))));
    } else {
      const g = M.groups.find((x) => x.id === ui.room);
      headSub = '그룹 · 메시지 ' + g.threads.reduce((n, th) => n + th.msgs.length, 0) + '건';
      const times = R.MESSENGER_TIMES[g.id] || [];
      view = h('div', { class: 'msgr-thread' }, h('div', { class: 'msgr-date' }, h('span', null, calIco(), R.MESSENGER_DATE)), g.threads.map((th, ti) => {
        if (!th.title) return h('div', { class: 'msgr-block' }, msgRows(th.msgs, times[ti]));
        // 공지: 첫 메시지(관리자)를 카드로, 이어지는 대화는 그 아래 일반 흐름으로
        const [who, t] = th.msgs[0];
        return h('div', { class: 'msgr-block notice' },
          h('div', { class: 'msgr-notice' },
            h('div', { class: 'msgr-notice-head' }, h('span', { class: 'msgr-badge mono' }, 'NOTICE'), h('p', { class: 'msgr-title' }, th.title)),
            h('div', { class: 'msgr-msg' }, whoAva(who),
              h('div', { class: 'msgr-msg-body' }, h('span', { class: 'msgr-who ' + whoCls(who) }, whoName(who)), h('p', null, t)),
              times[ti] ? h('span', { class: 'msgr-time' }, clock(times[ti], 0)) : null)),
          msgRows(th.msgs.slice(1), times[ti], 1));
      }));
    }
    const roomName = ui.room ? rooms.find((r) => r.id === ui.room).name : '';
    return h('div', { class: 'msgr', role: 'dialog', 'aria-label': '사내 메신저' },
      h('div', { class: 'msgr-side' },
        h('div', { class: 'msgr-head' }, icon('mail'), h('strong', null, '사내 메신저'),
          h('button', { type: 'button', class: 'msgr-x', 'aria-label': '닫기', onClick: closePanel }, '×')),
        search,
        h('div', { class: 'msgr-tabs' }, [['all', '전체'], ['personal', '개인'], ['group', '그룹']].map(([k, l]) =>
          h('button', { type: 'button', class: ui.roomTab === k ? 'on' : '', onClick: () => { ui.roomTab = k; R.app.render(); } }, l))),
        roomsBox),
      h('div', { class: 'msgr-main' },
        h('div', { class: 'msgr-main-head' }, h('strong', null, roomName), headSub ? h('span', null, headSub) : null),
        view,
        h('div', { class: 'msgr-input' }, h('input', { disabled: true, 'aria-label': '메시지 입력 (사용할 수 없음)' }), h('span', { class: 'msgr-send', 'aria-hidden': 'true' }, icon('send')))));
  }

  /* ---------- 사원 정보 (사원정보.jpg 시안) ---------- */
  function profile(s) {
    return h('div', { class: 'prof', role: 'dialog', 'aria-label': '사원 정보' },
      h('div', { class: 'prof-head' }, icon('logo'), h('strong', null, '사원 정보'),
        h('button', { type: 'button', class: 'msgr-x', 'aria-label': '닫기', onClick: closePanel }, '×')),
      ui.profileTab === 'profile'
        ? h('div', { class: 'prof-body' }, R.pages.avatar(s.player_avatar, 140),
          h('div', null, h('p', { class: 'prof-name' }, s.player_name), h('p', null, O.dept), h('p', null, O.deptEn),
            h('p', { class: 'small' }, '사원 번호 ', h('span', { class: 'mono accent' }, O.employeeNo))))
        : h('ul', { class: 'in-rows prof-body' }, h('li', null, h('span', { class: 'mono' }, '4XXX.04.12'), h('span', null, '입사 · ' + O.dept + ' 배정'))),
      h('div', { class: 'prof-tabs' },
        h('button', { type: 'button', class: ui.profileTab === 'profile' ? 'on' : '', onClick: () => { ui.profileTab = 'profile'; R.app.render(); } }, '내 프로필'),
        h('button', { type: 'button', class: ui.profileTab === 'history' ? 'on' : '', onClick: () => { ui.profileTab = 'history'; R.app.render(); } }, '근무 내역')));
  }

  /* ---------- 래미 AI 창 + 보안 교육 자료(십자말풀이) ---------- */
  function crossword(s) {
    const K = Math.max(...CW.words.map((w) => w.star));
    const width = Math.max(...CW.words.map((w) => K - w.star + w.answer.length));
    const grid = h('div', { class: 'cw-grid', style: 'grid-template-columns:repeat(' + (width + 1) + ',var(--cw))' });
    CW.words.forEach((w, i) => {
      const off = K - w.star;
      const solved = s.crossword_solved.includes(i);
      grid.append(h('span', { class: 'cw-num mono' }, String(i + 1)));
      for (let c = 0; c < width; c += 1) {
        const j = c - off;
        if (j < 0 || j >= w.answer.length) { grid.append(h('span', { class: 'cw-blank' })); continue; }
        grid.append(h('span', { class: 'cw-cell mono' + (j === w.star ? ' star' : '') }, solved ? w.answer[j] : (j === w.star ? '★' : '')));
      }
    });
    const clues = CW.words.map((w, i) => {
      const solved = s.crossword_solved.includes(i);
      const input = h('input', { class: 'input mono cw-in', maxlength: String(w.answer.length + 2), 'aria-label': '가로 ' + (i + 1) + ' 답' });
      const check = () => {
        let ok = false;
        commit((st) => { ok = L.solveWord(st, i, input.value); });
        if (!ok) toast('[초안] 다시 생각해 보세요');
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      return h('li', { class: solved ? 'done' : '' },
        h('p', null, h('strong', null, '가로 ' + (i + 1) + '. '), w.clue, h('span', { class: 'muted' }, ' (' + w.answer.length + ')')),
        solved ? h('p', { class: 'mono accent' }, w.answer + ' ✓') : h('div', { class: 'row' }, input, button('확인', check, { small: true })));
    });
    const code = h('input', { class: 'input mono', maxlength: '12', placeholder: CW.codeLabel, 'aria-label': CW.codeLabel });
    const submit = () => {
      let ok = false;
      commit((st) => { ok = L.submitCode(st, code.value); });
      if (!ok) ramiSay([RA.codeWrong]);
    };
    code.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    return h('section', { class: 'cw' },
      h('p', { class: 'cw-title' }, CW.title), h('p', { class: 'small' }, CW.intro),
      grid, h('ol', { class: 'cw-clues' }, clues),
      s.security_code_correct ? h('p', { class: 'mono accent' }, CW.codeLabel + ' ' + CW.code + ' ✓')
        : h('div', { class: 'row' }, code, button('입력', submit, { primary: true })));
  }

  /* 래미 AI 창 (래미_대화창_1.png 시안): 위로 내민 래미 + 이름 줄([대화기록]·닫기) + 대화 영역 + 질문 칩 + 입력 줄 */
  function ramiPanel(s) {
    const chips = RA.questions.filter((q) => !q.needs || s[q.needs]).map((q) => h('button', { type: 'button', class: 'rami-chip', onClick: () => {
      ramiSay(q.a.map((t) => fill(t, s)), () => {
        if (q.opens === 'crossword') commit((st) => L.openCrossword(st)); else R.app.render();
      });
    } }, q.chip || q.q));
    const chat = ui.ramiLog
      ? h('div', { class: 'rami-chat' }, h('p', { class: 'rami-chat-label mono' }, '대화 기록'),
        s.rami_log.length ? s.rami_log.map((t) => h('p', { class: 'rami-bubble' }, t)) : h('p', { class: 'muted' }, '아직 대화가 없습니다.'))
      : h('div', { class: 'rami-chat' },
        h('p', { class: 'rami-bubble' }, RA.greeting),                       // 첫 등장 뒤 인사 (D37)
        s.crossword_open ? crossword(s) : null);
    // 브리핑 뒤 [제한 시스템 접속]은 질문 칩 옆에 보안 경고 색으로 둔다
    const access = s.briefing_done ? h('button', { type: 'button', class: 'rami-chip rami-access', onClick: () => commit((st) => L.go(st, '03')) },
      h('span', { class: 'rami-access-ico', 'aria-hidden': 'true' }, '!'), RA.startSearch) : null;
    return h('aside', { class: 'rami-card', role: 'dialog', 'aria-label': '래미 AI' },
      h('div', { class: 'rami-peek', style: 'background-image:url(' + R.ASSETS.ramiChat + ')', 'aria-hidden': 'true' }),
      h('div', { class: 'rami-box' },
        h('div', { class: 'rami-top' },
          h('strong', { class: 'rami-name' }, '래미'), h('span', { class: 'rami-role' }, 'AI비서'),
          h('button', { type: 'button', class: 'rami-logbtn' + (ui.ramiLog ? ' on' : ''), 'aria-pressed': String(!!ui.ramiLog),
            onClick: () => { ui.ramiLog = !ui.ramiLog; R.app.render(); } }, '대화기록'),
          h('button', { type: 'button', class: 'rami-x', 'aria-label': '닫기', onClick: closePanel }, '×')),
        chat,
        h('div', { class: 'rami-chips' }, chips, access),
        h('div', { class: 'rami-input' },
          h('input', { disabled: true, placeholder: '래미에게 물어보기', 'aria-label': '래미에게 물어보기 (위 질문을 눌러 물어볼 수 있습니다)' }),
          h('span', { class: 'rami-send', 'aria-hidden': 'true' }, '▶'))));
  }

  /* ---------- 페이지 ---------- */
  R.pages['02'] = function (s) {
    autoScenes(s);
    let over = null;
    if (ui.panel === 'messenger') over = messenger(s);
    else if (ui.panel === 'profile') over = profile(s);
    else if (ui.panel === 'rami') over = ramiPanel(s);
    else if (ui.panel === 'archive') over = R.pages.archivePanel(s, closePanel);
    const side = ui.panel === 'rami' || ui.panel === 'archive';
    // 브리핑이 끝나면 화면 위쪽에 고정된 안내 줄로 [제한 시스템 접속]을 크게 보여 준다
    const cta = s.briefing_done ? h('div', { class: 'in-cta' },
      h('span', { class: 'in-cta-text' }, h('span', { class: 'mono accent' }, 'ACCESS GRANTED'), '사내 기록 열람 권한이 열렸습니다.'),
      startButton(s)) : null;
    return h('div', { class: 'intra' },
      top(s), cta,
      h('main', { class: 'in-main' }, tabBody(s)),
      over ? h('div', { class: 'in-over' + (side ? ' side' : ''), onClick: (e) => { if (e.target === e.currentTarget) closePanel(); } }, over) : null);
  };

  /* 근무 일정 시각: 화면을 다시 그리지 않고 글자만 갱신 */
  setInterval(() => {
    if (!R.app || !R.app.state) return;
    const t = L.workClock(R.app.state);
    document.querySelectorAll('.js-clock').forEach((el) => { el.textContent = t; });
  }, 15000);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.panel && R.app.state.page === '02') closePanel(); });
})(window.R01);
