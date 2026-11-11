/* 페이지별 화면 (1단계 뼈대: 그림 없이 버튼으로 진행)
   "[1단계 임시]"가 붙은 문구는 뼈대용이며 2단계 이후 dialogue.md 원문·화면으로 바뀐다. */
window.R01 = window.R01 || {};
(function (R) {
  const { h, button, card, modal, dialogue, toast } = R.ui;
  const L = R.logic;
  const T = R.TEXT;
  const P = (R.pages = {});

  P.LABELS = {
    // 수색 1부터는 진행 단계 표시줄(L.STEPS)과 같은 번호·이름
    '01': '입사', '02': '사내 인트라넷', '03': '01 1차 수색', '04': '02 심문',
    '05': '03 2차 수색', '06': '04 3차 수색', '07': '05 최종 추론',
    ending: '엔딩', collection: '엔딩 수집'
  };

  P.stepNo = (page) => String(L.STEPS.findIndex(([p]) => p === page) + 1).padStart(2, '0'); // 진행 단계 표시줄 번호
  const temp = (text) => h('p', { class: 'temp' }, '[1단계 임시] ' + text);
  const section = (title, ...kids) => h('section', { class: 'panel' }, h('h2', null, title), kids);
  const commit = (fn) => R.app.commit(fn);
  const typeLabel = (c) => (c.type === 'cctv' ? 'CCTV' : '문서');

  /* ---------- 01 오프닝·입사 (prd.md 2단계) ---------- */
  const O = R.OPENING;
  const A = R.ASSETS;
  let pickedAvatar = null;
  let monoIndex = 0;

  /* 아바타: 고른 사원증 사진. 고르기 전이나 사진이 없는 인물(심문 상대 등)은 코드로 그린 실루엣 */
  P.avatar = function (id, size) {
    const a = R.AVATARS.find((x) => x.id === id);
    if (a && a.src) {
      return h('span', { class: 'avatar', style: 'width:' + size + 'px;height:' + size + 'px;background:' + a.tone },
        h('img', { src: a.src, alt: '' }));
    }
    const svg = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="' + (a ? a.tone : '#1f3a52') +
      '"/><circle cx="50" cy="40" r="17" fill="#8aa7b9"/><path d="M18 88c4-20 18-30 32-30s28 10 32 30" fill="#8aa7b9"/></svg>';
    const el = h('span', { class: 'avatar', style: 'width:' + size + 'px;height:' + size + 'px' });
    el.innerHTML = svg;   // 고정 SVG 문자열만 넣는다 (플레이어 입력 없음)
    return el;
  };

  /* 심문 화면 직원 사진 (A·B·C). 사진이 없으면 실루엣 */
  P.staffPhoto = function (who, size) {
    const src = R.STAFF_PHOTOS && R.STAFF_PHOTOS[who];
    if (!src) return P.avatar(null, size);
    return h('span', { class: 'avatar', style: 'width:' + size + 'px;height:' + size + 'px;background:#fff' },
      h('img', { src, alt: '' }));
  };

  /* 사원증 (사원증.jpg 시안을 코드로 다시 짠 것). TEMP·실험용 표기 없음 (R-10, D13) */
  P.idCard = function (name, avatar) {
    return h('div', { class: 'idcard' },
      h('span', { class: 'idcard-clip' }),
      h('p', { class: 'idcard-title' }, '사원증'),
      P.avatar(avatar, 120),
      h('p', { class: 'idcard-name' }, name || '이름'),
      h('p', { class: 'idcard-dept' }, O.dept),
      h('p', { class: 'idcard-dept-en' }, O.deptEn),
      h('p', { class: 'idcard-no mono' }, O.employeeNo),
      h('p', { class: 'idcard-logo' }, 'REMNANT', h('br'), 'ARCHIVE'));
  };

  function notice(text, onNext) {
    const el = h('button', { type: 'button', class: 'notice', style: 'background-image:url(' + A.openingNotice + ')', onClick: onNext },
      h('span', { class: 'notice-text' }, text), h('span', { class: 'notice-next', 'aria-hidden': 'true' }, '▶'));
    setTimeout(() => el.focus(), 0);
    return el;
  }

  /* 창: 닫기 없이 다음 단계로만 이어진다 (D35) */
  function win(title, ...kids) {
    return h('div', { class: 'win', role: 'dialog', 'aria-label': title },
      h('div', { class: 'win-bar' }, h('span', null, title)),
      h('div', { class: 'win-body' }, kids));
  }

  function openingWindow(s) {
    if (s.opening_step === 'posting') {
      const p = O.posting;
      const apply = button(p.apply, () => commit((st) => L.openingNext(st)), { primary: true });
      setTimeout(() => apply.focus(), 0);
      return win('인터넷',
        h('article', { class: 'posting' },
          h('h2', null, p.title),
          p.lead.map((t) => h('p', { class: 'posting-lead' }, t)),
          h('p', { class: 'muted' }, p.about),
          h('dl', null, p.items.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
          apply));
    }
    if (s.opening_step === 'resume') {
      const input = h('input', { class: 'input', maxlength: '16', placeholder: '이름', 'aria-label': '이름' });
      const submit = () => { pickedAvatar = null; commit((st) => L.submitResume(st, input.value)); };
      setTimeout(() => input.focus(), 0);
      return win('이력서',
        h('form', { class: 'resume', onSubmit: (e) => { e.preventDefault(); submit(); } },
          h('label', null, '이름', input),
          h('p', { class: 'muted small' }, O.dept + ' · ' + O.deptEn),
          button('제출', submit, { primary: true })));
    }
    if (s.opening_step === 'idcard') {
      const picks = R.AVATARS.map((a) => h('button', {
        type: 'button', class: 'avatar-pick' + (pickedAvatar === a.id ? ' on' : ''), 'aria-label': '사진 ' + (a.id + 1),
        'aria-pressed': String(pickedAvatar === a.id), onClick: () => { pickedAvatar = a.id; R.app.render(); }
      }, P.avatar(a.id, 64)));
      return win('사원증',
        h('div', { class: 'idcard-make' },
          P.idCard(s.player_name, pickedAvatar),
          h('div', { class: 'idcard-side' },
            h('p', null, '사진 선택'),
            h('div', { class: 'avatar-picks' }, picks),
            button('발급', () => commit((st) => L.issueIdCard(st, pickedAvatar)),
              { primary: true, disabled: pickedAvatar === null }))));
    }
    return null;
  }

  P['01'] = function (s) {
    if (s.opening_step === 'monologue') {
      const lines = O.monologue;
      const next = () => {
        if (monoIndex < lines.length - 1) { monoIndex += 1; R.app.render(); return; }
        monoIndex = 0;
        commit((st) => L.openingNext(st));
      };
      const line = lines[monoIndex];
      const box = h('button', { type: 'button', class: 'mono-box', style: 'background-image:url(' + A.dialogueFrame + ')', onClick: next },
        h('span', { class: 'mono-text' + (line.highlight ? ' highlight' : '') }, line.text || line), h('span', { class: 'notice-next', 'aria-hidden': 'true' }, '▶'));
      setTimeout(() => box.focus(), 0);
      return h('div', { class: 'scene', style: 'background-image:url(' + A.monologueBg + ')' }, box);
    }

    // 바탕화면 아이콘 없이 남색 배경 위에 알림·창만 띄운다 (D35)
    const overlay = s.opening_step === 'hired'
      ? notice(O.hired, () => commit((st) => L.go(st, '02')))
      : openingWindow(s);

    return h('div', { class: 'desk' }, h('div', { class: 'desk-over' }, overlay));
  };

  /* ---------- 래미 조사 중 대사 (dialogue.md 3절, 각각 한 번) ---------- */
  /* 장면별 래미 표정: ‘다른 선택을 하시네요’ = 의미심장, 제한구역 = 깨달음, 그 밖 = 기본 */
  const RAMI_FACE = { observe: 'ramiMeaningful', warn: 'ramiRealize' };
  P.ramiSay = function (lines, onDone, face) {
    dialogue(lines.map((t) => [R.RAMI.name, t]), onDone, {
      portrait: R.ASSETS[face || 'ramiBasic'],
      onLine: (i) => { R.app.state.rami_log.push(lines[i]); R.store.saveCase(R.app.state); }
    });
  };
  P.ramiEvent = function (key) {
    const st = R.app.state;
    if (st.rami_events.includes(key)) return;
    st.rami_events.push(key);
    R.store.saveCase(st);
    setTimeout(() => {
      if (key === 'warn') P.glitchBurst();                      // 3차 수색 진입: 대화창과 동시에 노이즈
      P.ramiSay([R.RAMI.events[key]], null, RAMI_FACE[key]);
    }, 120);
  };

  /* 3차 수색 진입 노이즈 (수정 요청/노이즈 연출.jpg): 이미지의 검은 부분은 원래 화면이 비치도록 screen 합성 */
  P.glitchBurst = function () {
    if (document.body.classList.contains('reduced')) return;   // 연출 줄이기
    const img = 'url(' + R.ASSETS.noiseGlitch + ')';
    const over = h('div', { class: 'glitch-over', 'aria-hidden': 'true' },
      h('i', { class: 'g1', style: 'background-image:' + img }),
      h('i', { class: 'g2', style: 'background-image:' + img }),
      h('i', { class: 'g3', style: 'background-image:' + img }));
    document.body.append(over);
    const app = document.getElementById('app');
    app.classList.add('glitch-shake');
    setTimeout(() => app.classList.remove('glitch-shake'), 900);
    setTimeout(() => over.remove(), 1800);
  };

  /* 02 인트라넷은 js/intranet.js */

  /* ---------- 03·05·06 수색: 장소 목록 → 장소 → 조사 지점 → 자료 창 → 다시 장소 ---------- */
  let curPlace = null;          // 화면에만 있는 상태 (새로고침하면 장소 목록부터)
  const placeName = (id) => R.PLACES.find((p) => p.id === id).name;
  const foundAt = (c) => (c.place ? placeName(c.place) : R.SOURCE_LABEL[c.source] || '');

  /* 장소 안의 조사 지점: 지금 수색 단계에서 열람할 수 있는 자료만, 묶음 자료(05-B)는 지점 하나 */
  function spotsIn(s, placeId) {
    const seen = {};
    return R.CLUES.filter((c) => c.place === placeId && L.clueAvailable(s, c))
      .filter((c) => !c.bundle || (seen[c.bundle] ? false : (seen[c.bundle] = true)));
  }
  /* [수색완료]: 그 장소에서 지금 볼 수 있는 단서를 모두 확인했을 때 (D39). 전체 개수는 보여 주지 않는다 */
  function placeDone(s, placeId) {
    const sp = spotsIn(s, placeId);
    return sp.length > 0 && sp.every((c) => R.CLUES.filter((x) => x === c || (c.bundle && x.bundle === c.bundle)).every((x) => L.has(s, x.key)));
  }
  const doneBadge = () => h('span', { class: 'done-badge mono' }, '수색완료');

  /* ---------- 자료 에셋 (D54): assets.js의 CLUE_ASSETS. 목록에 없으면 임시 화면 ---------- */
  const isReduced = () => document.body.classList.contains('reduced');
  const tempPhoto = (x, text) => h('div', { class: 'evi-photo' }, h('span', { class: 'mono' }, x.id),
    h('span', null, text || '[임시 화면] 자료 이미지는 에셋이 정해지면 들어갑니다'));

  /* HTML 문서 창. 로컬 서버(같은 출처)로 열면 문서 높이에 맞춰 늘어나고,
     파일을 바로 열면(file://) 정해진 높이 안에서 스크롤한다 */
  function docFrame(src, cls, title, fallback) {
    const f = h('iframe', { class: cls, src, title });
    const fit = () => {
      try {
        const d = f.contentDocument;
        if (!d || !d.body) return;
        if (fallback && !d.querySelector('.ra-document')) {           // 문서를 못 읽으면 대체 이미지
          f.replaceWith(h('img', { class: 'clue-fallback', src: fallback, alt: title }));
          return;
        }
        if (cls === 'clue-frame') f.style.height = d.documentElement.scrollHeight + 'px';  // 겹치기 창은 이미지 크기 고정
      } catch (e) { /* 다른 출처(file://): 기본 높이 유지 */ }
    };
    f.addEventListener('load', () => { fit(); setTimeout(fit, 400); });  // 글꼴이 늦게 붙는 경우 한 번 더
    return f;
  }

  /* 문서 이미지 + 이미지 안 글자를 설정에 맞게 덮는 HTML 글자 (03-A) */
  function imageView(a, x) {
    return h('figure', { class: 'clue-img', style: 'aspect-ratio:' + a.ratio },
      h('img', { src: a.img, alt: x.name }),
      (a.patches || []).map((p) => h('div', { class: 'clue-patch', 'aria-hidden': 'true',
        style: 'left:' + p.box[0] + '%;top:' + p.box[1] + '%;width:' + p.box[2] + '%;height:' + p.box[3] + '%;background:' + p.bg },
      p.lines.map((t, i) => h('span', { class: i ? 'sub' : '' }, t)))));
  }

  /* CCTV: 정지 화면은 시각이 16:39 → 16:40 → 16:41로 넘어가고, [영상 재생]을 누르면 영상 재생 위치에 맞춰 시각이 바뀐다 (03-B) */
  const toSec = (t) => t.split(':').reduce((n, v) => n * 60 + Number(v), 0);
  const fromSec = (n) => [Math.floor(n / 3600), Math.floor(n / 60) % 60, Math.floor(n) % 60].map((v) => String(v).padStart(2, '0')).join(':');
  function cctvView(a, x) {
    const clock = h('span', { class: 'cctv-clock mono' });
    const setClock = (t) => { clock.textContent = a.date + '  ' + t; };
    const img = h('img', { class: 'cctv-still', src: a.img, alt: x.name });
    const vid = h('video', { class: 'cctv-video', src: a.video, playsinline: true, preload: 'metadata', hidden: true });
    const play = button('▶ 영상 재생', () => {
      img.hidden = true; vid.hidden = false; vid.currentTime = 0; vid.play();
      play.textContent = '↻ 다시 재생';
    }, { small: true });
    const box = h('figure', { class: 'cctv', style: 'aspect-ratio:' + a.ratio },
      img, vid,
      h('div', { class: 'cctv-hud', 'aria-hidden': 'true' },
        h('span', { class: 'cctv-rec mono' }, h('i'), 'REC'), h('span', { class: 'cctv-cam mono' }, a.cam), clock),
      h('i', { class: 'cctv-scan', 'aria-hidden': 'true' }));
    // 정지 화면: 3장면 시각을 번갈아 표시 (연출 줄이기면 16:40 하나로 고정)
    let i = 0;
    setClock(a.still[isReduced() ? 1 : 0]);
    const timer = setInterval(() => {
      if (!box.isConnected) { clearInterval(timer); return; }
      if (!vid.hidden || isReduced()) return;
      i = (i + 1) % a.still.length; setClock(a.still[i]);
    }, 1400);
    vid.addEventListener('timeupdate', () => {
      const p = vid.duration ? vid.currentTime / vid.duration : 0;
      setClock(fromSec(toSec(a.from) + p * (toSec(a.to) - toSec(a.from))));
    });
    return h('div', { class: 'clue-cctv' }, box, h('div', { class: 'clue-tools' }, play));
  }

  /* 실물 이미지 위에 HTML 본문 (03-C). [본문 숨기기]로 아래 이미지만 볼 수 있다 */
  function overlayView(a, x) {
    const frame = docFrame(a.html, 'clue-over-frame', x.name);
    const box = h('figure', { class: 'clue-over', style: 'background-image:url(' + a.img + ')' }, frame);
    const toggle = button('본문 숨기기', () => {
      const off = box.classList.toggle('bare');
      toggle.textContent = off ? '본문 보기' : '본문 숨기기';
    }, { small: true });
    return h('div', null, box, h('div', { class: 'clue-tools' }, toggle));
  }

  function clueView(x) {
    const a = R.CLUE_ASSETS && R.CLUE_ASSETS[x.key];
    if (!a) return tempPhoto(x);
    if (a.kind === 'pending') return tempPhoto(x, '[에셋 준비 중]');
    if (a.kind === 'doc') return h('div', { class: 'clue-doc' }, docFrame(a.html, 'clue-frame', x.name, a.fallback));
    if (a.kind === 'image') return imageView(a, x);
    if (a.kind === 'cctv') return cctvView(a, x);
    if (a.kind === 'overlay') return overlayView(a, x);
    return tempPhoto(x);
  }

  /* 자료 창 (단서 노출). [닫기]를 누르면 그 장소 화면으로 돌아간다 */
  function showEvidence(c, opts) {
    const group = c.bundle ? R.CLUES.filter((x) => x.bundle === c.bundle) : [c];
    const wide = group.some((x) => R.CLUE_ASSETS && R.CLUE_ASSETS[x.key] && R.CLUE_ASSETS[x.key].kind !== 'pending');
    const over = h('div', { class: 'evi-over', role: 'dialog', 'aria-modal': 'true' });
    const close = () => { over.remove(); document.removeEventListener('keydown', esc); R.app.render(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const closeBtn = button('닫기', close, { small: true });
    over.append(h('div', { class: 'evi' + (wide ? ' wide' : '') },
      h('div', { class: 'evi-head' },
        h('span', { class: 'mono evi-label' }, 'EVIDENCE · ' + (c.bundle ? c.bundle : c.id), h('span', { class: 'muted' }, ' · ' + group.map(typeLabel).join(' / '))),
        closeBtn),
      h('div', { class: 'evi-meta' },
        h('div', null, h('span', null, '자료 번호'), h('strong', { class: 'mono' }, group.map((x) => x.id).join(' · '))),
        h('div', null, h('span', null, '발견 위치'), h('strong', null, foundAt(c))),
        h('div', null, h('span', null, '상태'), h('strong', null, 'My Archive 저장'))),
      group.map((x) => h('section', { class: 'evi-item' },
        h('h2', null, x.name),
        clueView(x),
        h('div', { class: 'evi-note' }, h('p', { class: 'mono evi-label' }, 'RECORD · 기록 요약'),
          (R.SPOTS[x.key] ? R.SPOTS[x.key].summary : []).map((t) => h('p', null, t)))))));
    over.addEventListener('click', (e) => { if (e.target === over) close(); });
    document.addEventListener('keydown', esc);
    document.body.append(over);
    closeBtn.focus();
  }

  /* 장소 목록 (사내 약도 격자, D22·prd 4-1). 전체 개수는 표시하지 않고 확보 수만 (R-30) */
  const foundIn = (s, placeId) => s.clue_order.filter((k) => (L.clue(k) || {}).place === placeId).length;
  function placeMap(s) {
    return h('div', { class: 'map-wrap' },
      h('div', { class: 'map-bar' }, h('span', { class: 'mono' }, 'SITE MAP'), h('span', null, 'REMNANT ARCHIVE 사내 약도'),
        h('span', { class: 'map-count' }, '확보한 자료 ', h('strong', { class: 'mono' }, String(s.clue_order.length)))),
      h('div', { class: 'map' },
        R.PLACES.map((pl) => {
          const open = L.placeOpen(s, pl.id);
          const n = foundIn(s, pl.id);
          return h('button', { type: 'button', class: 'map-room ' + pl.id + (open ? '' : ' closed'), disabled: !open,
            onClick: () => { curPlace = pl.id; R.app.render(); } },
          h('span', { class: 'map-name' }, pl.name),
          open ? h('span', { class: 'map-got' }, '확보 ' + n) : h('span', { class: 'map-lock' }, '출입 통제'),
          open && placeDone(s, pl.id) ? doneBadge() : null);
        })));
  }

  /* 장소 화면: 조사 지점을 누르면 자료 창, 자료 창을 닫으면 다시 이 화면 */
  function placeView(s, placeId) {
    const spots = spotsIn(s, placeId);
    return h('div', { class: 'room' },
      h('div', { class: 'room-head' },
        h('h3', null, placeName(placeId)), placeDone(s, placeId) ? doneBadge() : null,
        button('← 장소 목록', () => { curPlace = null; R.app.render(); }, { small: true })),
      spots.length ? h('div', { class: 'room-board' }, spots.map((c) => {
        const found = L.has(s, c.key);
        const sp = R.SPOTS[c.key];
        return h('button', { type: 'button', class: 'spot' + (found ? ' seen' : ''), onClick: () => {
          if (!found) commit((st) => L.openFromSearch(st, c.key));
          showEvidence(c);
        } }, h('span', { class: 'spot-name' }, sp ? sp.spot : c.name), found ? h('span', { class: 'spot-seen mono' }, '확인함') : null);
      })) : h('p', { class: 'muted room-empty' }, '지금은 더 살펴볼 곳이 없습니다.'));
  }

  P.showEvidence = showEvidence;
  let curPage = null;
  const SEARCH_GUIDE = '약도에서 장소를 고르고, 조사할 수 있는 곳을 눌러 단서를 찾으세요. 출입이 통제된 곳은 다음 수색에서 열립니다.'; // prd 4-1
  function searchPage(title, s, action) {
    if (curPage !== s.page) { curPage = s.page; curPlace = null; }  // 수색 단계가 바뀌면 장소 목록부터
    if (curPlace && !L.placeOpen(s, curPlace)) curPlace = null;
    if (s.page === '05') P.ramiEvent('observe');                  // 2차 조사 진입
    if (s.page === '05' && !P.glitchImg) { P.glitchImg = new Image(); P.glitchImg.src = R.ASSETS.noiseGlitch; } // 3차 수색 노이즈 미리 받기
    if (s.page === '06') P.ramiEvent('warn');                     // 제한구역 첫 진입
    return h('section', { class: 'panel' },
      h('p', { class: 'step mono' }, 'STEP ' + P.stepNo(s.page) + ' · SEARCH'),
      h('h2', null, title),
      h('p', { class: 'guide' }, SEARCH_GUIDE),
      curPlace ? placeView(s, curPlace) : placeMap(s),
      h('div', { class: 'row end' }, action));
  }
  P['03'] = (s) => searchPage('1차 수색', s,
    button('면담 시작', () => commit((st) => L.go(st, '04')), { primary: true, disabled: !s.interview_unlocked }));
  P['05'] = (s) => searchPage('2차 수색', s,
    button('제한구역으로', () => commit((st) => L.go(st, '06')), { primary: true, disabled: !s.restricted_unlocked }));
  P['06'] = (s) => searchPage('3차 수색', s,
    button('최종 추론', () => openFinalWarning(), { primary: true, disabled: !L.canStartFinal(s) }));

  function openFinalWarning() {
    const s = R.app.state;
    const fill = (t) => t.replace('{clues}', s.clue_order.length).replace('{conns}', L.connCount(s));
    modal({
      lines: T.finalWarn.map(fill),
      buttons: [
        { label: T.finalWarnCancel },
        { label: T.finalWarnOk, primary: true, onClick: () => {
          commit((st) => {
            R.store.addSave(st, R.store.POINT['06']);    // 최종 추론 직전 중간 세이브 (D43)
            const none = L.connCount(st) === 0;          // 조합을 하나도 못 했으면
            L.startFinal(st);
            // 신원 확인 화면 없이 바로 엔딩 1 (D41)
            if (none && !st.identity_revealed && L.resolveEnding1(st)) R.store.recordEnding(1, st.investigation_grade);
          });
          P.ramiEvent('final');
        } }
      ]
    });
  }

  /* ---------- 04 심문 (prd 4-3). A → B → C 고정 (R-13), 질문은 Q1~Q4 고정 버튼 ----------
     한 직원을 끝내도 자동으로 넘어가지 않는다. 플레이어가 다음 직원을 직접 누른다 (D44) */
  let viewWho = null;   // 기록을 보고 있는 직원 (완료한 직원은 다시 볼 수 있다)
  const INTERVIEW_GUIDE = '1차 수색에서 확인한 기록으로 질문할 수 있습니다. 받은 진술은 면담 기록에 남습니다.'; // prd 4-3
  P['04'] = function (s) {
    const turn = L.interviewTurn(s);
    const ORDER = ['A', 'B', 'C'];
    if (!viewWho || (!s['interview_' + viewWho + '_done'] && viewWho !== turn)) viewWho = turn || 'C';
    const total = Object.values(s.interview_asked).reduce((n, a) => n + a.length, 0);
    const list = ORDER.map((w) => {
      const st = R.STAFF[w];
      const done = s['interview_' + w + '_done'];
      const locked = !done && turn !== w;
      const isNext = turn === w && viewWho !== w;     // 앞 직원을 끝낸 뒤: 이 직원을 눌러 넘어간다
      const n = s.interview_asked[w].length;
      return h('button', { type: 'button', class: 'emp' + (viewWho === w ? ' on' : '') + (locked ? ' locked' : '') + (isNext ? ' next' : ''), disabled: locked,
        onClick: () => { viewWho = w; R.app.render(); } },
      P.staffPhoto(w, 44),
      h('span', { class: 'emp-text' },
        h('span', { class: 'emp-name' }, st.name),
        h('span', { class: 'emp-role' }, st.role),
        h('span', { class: 'emp-bar' }, h('span', { style: 'width:' + (n / 4 * 100) + '%' }))),
      h('span', { class: 'emp-state mono' }, done ? '완료' : locked ? '잠김' : isNext ? '다음 ▶' : '진행 중'));
    });
    const st = R.STAFF[viewWho];
    const d = R.INTERVIEW[viewWho];
    const asked = s.interview_asked[viewWho];
    /* 질문은 위, 대답은 안쪽으로 들여 구분 */
    const rec = asked.length ? asked.map((qi) => {
      const qa = d.qa[qi];
      return h('div', { class: 'rec' },
        h('p', { class: 'rec-q' }, h('span', { class: 'rec-mark mono' }, 'Q'), qa.q.replace(/^Q\d\.\s*/, '')),
        h('div', { class: 'rec-a' }, qa.lines.map(([who, line]) => h('p', { class: who === '플레이어' ? 'rec-me' : '' },
          h('strong', null, who === '플레이어' ? '나' : R.staffName(who)), ' ' + line))));
    }) : [h('p', { class: 'muted rec-empty' }, '아직 진술을 받지 않았습니다.')];
    setTimeout(() => { const box = document.querySelector('.iv-rec'); if (box) box.scrollTop = box.scrollHeight; }, 0);
    const canAsk = viewWho === turn;
    const qs = canAsk ? d.qa.map((qa, qi) => button(qa.q, () => commit((x) => L.ask(x, turn, qi)),
      { small: true, disabled: asked.includes(qi) })) : [];
    const nextHint = !canAsk && turn && s['interview_' + viewWho + '_done']
      ? h('p', { class: 'iv-next' }, '다음 직원: ', h('strong', null, R.STAFF[turn].name), ' — 왼쪽 목록에서 선택하세요.') : null;
    return h('section', { class: 'panel' },
      h('p', { class: 'step mono' }, 'STEP ' + P.stepNo('04') + ' · INTERROGATION'),
      h('h2', null, '심문'),
      h('p', { class: 'guide' }, INTERVIEW_GUIDE),
      h('div', { class: 'iv' },
        h('div', { class: 'iv-list' }, list),
        h('div', { class: 'iv-main' },
          h('div', { class: 'iv-head' }, h('span', { class: 'mono' }, 'INTERROGATION RECORD · REC'),
            h('span', { class: 'mono muted' }, 'STATEMENT ' + asked.length + ' / 4')),
          h('div', { class: 'iv-who' }, P.staffPhoto(viewWho, 72),
            h('div', null, h('p', { class: 'mono iv-tag' }, 'EMPLOYEE 0' + (ORDER.indexOf(viewWho) + 1) + ' · 심문'),
              h('p', { class: 'iv-name' }, st.name), h('p', { class: 'iv-meta' }, st.age + '세 · ' + st.role))),
          // 질문은 위에 고정, 받은 진술은 그 아래로 이어진다 (새 진술이 보이도록 아래로 스크롤)
          qs.length ? h('div', { class: 'qs' }, qs) : null,
          nextHint,
          h('div', { class: 'iv-rec' }, rec))),
      h('div', { class: 'row end' },
        h('span', { class: 'mono muted' }, 'STATEMENTS ' + total + ' / 12'),
        button('2차 조사 시작 →', () => commit((x) => L.go(x, '05')), { primary: true, disabled: !s.interview_completed })));
  };

  /* 07 최종 추론·엔딩은 js/finale.js */

  /* ---------- 엔딩·엔딩 수집 ---------- */
  /* 엔딩 수집: 본 엔딩은 제목·최고 등급, 보지 않은 엔딩은 번호와 자물쇠만 (D42) */
  const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  P.collection = function () {
    const seen = R.store.endingsSeen();
    const locked = (id) => {
      const ico = h('span', { class: 'lock-ico' }); ico.innerHTML = LOCK_SVG;   // 고정 SVG
      return h('div', { class: 'card ending-locked', 'aria-label': 'ENDING 0' + id + ' 잠김' }, ico, h('span', { class: 'card-title mono' }, 'ENDING 0' + id));
    };
    return section('엔딩 수집',
      [1, 2, 3].map((id) => seen[id]
        ? card('ENDING 0' + id + ' — ' + R.ENDINGS[id].title, { tag: seen[id], sub: R.ENDINGS[id].ko })
        : locked(id)),
      h('div', { class: 'row end' }, button('허브로 돌아가기', () => R.app.goHub(), { primary: true })));
  };

  /* ---------- My Archive — 오른쪽 사이드바 (래미 AI 창과 같은 형태). 조합 화면은 4단계 ---------- */
  let archiveTab = 'all';
  let slots = [null, null];      // 단서 조합 영역 두 칸 (화면에만 있는 상태)
  let comboMsg = null;           // 마지막 조합 결과 안내
  P.archivePanel = function (s, onClose) {
    const body = h('div', { class: 'side-body' });
    const canCombine = !s.board_locked && s.clue_order.length >= 2;   // 최종 추론 뒤에는 잠금 (R-51)
    /* 이미 칸에 놓인 자료와 이미 시도한 조합이면 회색 (R-37·R-37a) */
    const triedWith = (k) => slots.some((x) => x && x !== k && s.tried_pairs.includes(L.pairKey(x, k)));
    const put = (k) => {
      if (slots.includes(k)) return;
      const i = slots[0] === null ? 0 : slots[1] === null ? 1 : 1;
      slots[i] = k; comboMsg = null; draw();
    };
    const archCard = (title, meta, onClick, key) => {
      const gray = key && canCombine && triedWith(key);
      const row = h('div', { class: 'arch-row' + (gray ? ' tried' : '') + (key && slots.includes(key) ? ' picked' : '') },
        h('button', { type: 'button', class: 'arch-card', onClick, draggable: key && canCombine ? 'true' : null },
          h('span', { class: 'arch-title' }, title), h('span', { class: 'arch-meta' }, meta)),
        key && canCombine ? h('button', { type: 'button', class: 'arch-add', 'aria-label': title + ' 조합 칸에 놓기',
          disabled: gray || slots.includes(key), onClick: () => put(key) }, '+') : null);
      if (key && canCombine) row.firstChild.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', key); });
      return row;
    };
    const slotBox = (i) => {
      const k = slots[i];
      const box = h('div', { class: 'slot' + (k ? ' full' : '') },
        k ? h('span', { class: 'slot-name' }, L.clue(k).name) : h('span', { class: 'muted' }, '자료를 끌어 놓거나 + 를 누르세요'),
        k ? h('button', { type: 'button', class: 'slot-x', 'aria-label': '빼기', onClick: () => { slots[i] = null; draw(); } }, '×') : null);
      box.addEventListener('dragover', (e) => { e.preventDefault(); box.classList.add('over'); });
      box.addEventListener('dragleave', () => box.classList.remove('over'));
      box.addEventListener('drop', (e) => {
        e.preventDefault(); box.classList.remove('over');
        const key = e.dataTransfer.getData('text/plain');
        if (!key || slots.includes(key) || !L.has(s, key)) return;
        const other = slots[1 - i];
        if (other && s.tried_pairs.includes(L.pairKey(other, key))) return;
        slots[i] = key; comboMsg = null; draw();
      });
      return box;
    };
    const combine = () => {
      const [a, b] = slots;
      if (!a || !b) return;
      let res = null;
      commit((st) => { res = L.tryConnect(st, a, b); });
      slots = [null, null];
      if (res.result === 'success') {
        comboMsg = { ok: true, text: R.TEXT.newClue, card: R.CONNECTIONS[res.id].card };
        if (res.id === 'C01' && s.page === '03') P.ramiEvent('suspect');   // 1차 조사 중 C01 이후
        if (res.id === 'C07') P.ramiEvent('found');                         // C07 성공 시
      } else comboMsg = { ok: false, text: R.TEXT.wrongPair };
      draw();
    };
    function draw() {
      body.textContent = '';
      const raw = archiveTab === 'combo' ? [] : s.clue_order.map(L.clue)
        .filter((c) => archiveTab === 'all' || (archiveTab === 'cctv' ? c.type === 'cctv' : c.type === 'doc'));
      const news = archiveTab === 'all' || archiveTab === 'combo' ? R.NORMAL_CONNECTIONS.filter((id) => s['connection_' + id]) : [];
      body.append(
        h('div', { class: 'side-stats mono' },
          h('span', null, '획득 자료 ', h('strong', null, String(s.clue_order.length))),
          h('span', null, '연결 성공 ', h('strong', null, String(L.connCount(s)))),
          h('span', null, P.LABELS[s.page])),
        canCombine ? h('div', { class: 'combo' },
          h('p', { class: 'combo-title mono' }, '단서 조합'),
          h('div', { class: 'combo-slots' }, slotBox(0), h('span', { class: 'combo-plus' }, '+'), slotBox(1)),
          button('조합하기', combine, { primary: true, disabled: !(slots[0] && slots[1]) }),
          comboMsg ? h('div', { class: 'combo-msg' + (comboMsg.ok ? ' ok' : '') },
            comboMsg.ok ? [h('span', { class: 'mono new' }, 'NEW'), h('strong', null, comboMsg.card), h('span', null, comboMsg.text)] : comboMsg.text) : null) : null,
        h('div', { class: 'side-tabs' }, [['all', '전체'], ['doc', '문서'], ['cctv', 'CCTV'], ['combo', '단서 조합']].map(([k, label]) =>
          h('button', { type: 'button', class: archiveTab === k ? 'on' : '', onClick: () => { archiveTab = k; draw(); } }, label))),
        raw.length || news.length ? h('div', { class: 'side-list' },
          raw.map((c) => archCard(c.name, typeLabel(c) + ' · ' + foundAt(c), () => showEvidence(c), c.key === '06G' ? null : c.key)),
          news.map((id) => archCard(R.CONNECTIONS[id].card, '단서 조합', () => showConnection(s, id))))
          : h('p', { class: 'muted side-empty' }, R.INTRANET.archiveEmpty));
    }
    slots = slots.map((k) => (k && L.has(s, k) ? k : null));
    draw();
    return h('aside', { class: 'side-panel', role: 'dialog', 'aria-label': 'My Archive' },
      h('div', { class: 'side-head' }, h('strong', null, 'My Archive'), h('span', { class: 'muted mono' }, '총 ' + s.clue_order.length + '건'),
        h('button', { type: 'button', class: 'memo-btn', onClick: () => P.memo() }, '추리 메모장'),
        h('button', { type: 'button', class: 'msgr-x', 'aria-label': '닫기', onClick: onClose }, '×')),
      body);
  };

  /* 단서 조합 카드(NEW 카드)를 누르면: 조합한 두 자료와 추론 결과 문장 (7절) */
  function showConnection(s, id) {
    const cn = R.CONNECTIONS[id];
    const result = id === 'C08' && s.c08_human03_confirmed ? [cn.result, cn.resultAfter05D] : [cn.result]; // D17
    const over = h('div', { class: 'evi-over', role: 'dialog', 'aria-modal': 'true' });
    const close = () => { over.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const closeBtn = button('닫기', close, { small: true });
    over.append(h('div', { class: 'evi' },
      h('div', { class: 'evi-head' }, h('span', { class: 'mono evi-label' }, 'COMBINATION · ' + id, h('span', { class: 'muted' }, ' · 단서 조합')), closeBtn),
      h('div', { class: 'evi-meta two' },
        cn.pair.map((k) => h('div', null, h('span', null, '조합 자료'), h('strong', null, L.clue(k).name)))),
      h('section', { class: 'evi-item' }, h('h2', null, cn.card),
        h('div', { class: 'evi-note' }, h('p', { class: 'mono evi-label' }, 'RESULT · 추론 결과'), result.map((t) => h('p', null, t))))));
    over.addEventListener('click', (e) => { if (e.target === over) close(); });
    document.addEventListener('keydown', esc);
    document.body.append(over);
    closeBtn.focus();
  }
  /* 추리 메모장 (인트라넷 UI/추리 메모장.png 시안): My Archive에서 연다. 쓰는 대로 진행 칸에 저장 */
  P.memo = function () {
    if (document.querySelector('.memo-over')) return;
    const st = R.app.state;
    const area = h('textarea', { class: 'memo-text', placeholder: '여기에 메모를 입력하세요.', 'aria-label': '추리 메모', spellcheck: 'false' });
    area.value = st.memo || '';
    let timer = null;
    const save = () => { clearTimeout(timer); R.app.state.memo = area.value; R.store.saveCase(R.app.state); };
    area.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(save, 400); });
    const over = h('div', { class: 'memo-over', role: 'dialog', 'aria-modal': 'true', 'aria-label': '추리 메모장' });
    const close = () => { save(); over.remove(); window.removeEventListener('keydown', esc, true); };
    // Esc는 메모장만 닫는다 (뒤의 My Archive·인트라넷 창은 그대로)
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); } };
    over.append(h('div', { class: 'memo' },
      h('div', { class: 'memo-head' }, h('strong', null, '추리 메모장'),
        h('button', { type: 'button', class: 'memo-x', 'aria-label': '닫기', onClick: close }, '×')),
      area,
      h('div', { class: 'memo-foot' }, h('span', { class: 'memo-saved' }, '이 브라우저에 자동 저장'), h('span', { class: 'muted' }, 'Esc로 닫기'))));
    over.addEventListener('click', (e) => { if (e.target === over) close(); });
    window.addEventListener('keydown', esc, true);
    document.body.append(over);
    area.focus();
  };

  /* 수색 화면의 [My Archive] 버튼: 같은 사이드바를 화면 위에 띄운다 */
  P.archive = function (s) {
    const over = h('div', { class: 'in-over side' });
    const close = () => { over.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    over.addEventListener('click', (e) => { if (e.target === over) close(); });
    document.addEventListener('keydown', esc);
    over.append(P.archivePanel(s, close));
    document.body.append(over);
    const x = over.querySelector('.msgr-x'); if (x) x.focus();
  };
})(window.R01);
