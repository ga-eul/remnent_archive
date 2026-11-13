/* 진행 규칙 — 화면(DOM)과 저장소를 모르는 순수 로직. 기준: case01-logic.md 4·7·9·11·13·14절
   상태값 이름은 14절 표와 같다. 규칙 ID(R-xx)는 주석에 적는다. */
window.R01 = window.R01 || {};
(function (R) {
  const L = (R.logic = {});

  const REQUIRED_7 = ['03A', '03B', '03C', '04A', '05A', '05C', '05D']; // R-20
  const ORDER = ['A', 'B', 'C']; // R-13
  const SEARCH_STAGE = { '03': 1, '05': 2, '06': 3 };

  L.newState = function () {
    const s = {
      page: '01',
      game_started: true, resume_submitted: false, player_name: '',
      // 01 오프닝·입사 진행 (D35·D36): monologue → posting → resume → idcard → hired
      opening_step: 'monologue', player_avatar: null, id_card_issued: false,
      // 02 인트라넷 (3단계): 래미 첫 안내 → 전임자 메시지 → 십자말풀이 → 보안코드 → 브리핑
      work_started_at: null, intranet_intro_done: false, predecessor_msg_read: false,
      crossword_open: false, crossword_solved: [], briefing_done: false,
      rami_log: [],      // 래미 대사 기록 (R-18: 기록은 래미 AI 창)
      rami_events: [],   // 이미 나온 조사 중 래미 대사 (dialogue.md 3절, 각각 한 번)
      security_code_correct: false,
      interview_unlocked: false, interview_page_started: false,
      interview_A_done: false, interview_B_done: false, interview_C_done: false, interview_completed: false,
      interview_asked: { A: [], B: [], C: [] },
      second_investigation_unlocked: false, second_investigation_started: false,
      clue_05D_unlocked: false,
      restricted_unlocked: false, restricted_entered: false,
      human04_base_read: false,
      final_deduction_started: false, board_locked: false, identity_check_started: false,
      identity_revealed: false,
      c13_step_open: false, c13_step_done: false,
      disconnect_eligible: false, memory_transfer: false, identity_disconnect: false,
      c08_human03_confirmed: false,
      tried_pairs: [],   // R-37a·D26 — 시도한 조합 (순서 무관), C13 단계도 같은 방식 (D27)
      clue_order: [],    // 획득 순서 (My Archive·C13 후보 정렬, D28)
      memo: '',          // 추리 메모장 (플레이어가 직접 쓰는 메모, 진행 칸에 함께 저장)
      // 장소 조사 (D73): 하위 부분 열람 기록('03A:roster' 등), 보조자료 열람 기록, 눌러 본 오브젝트
      parts_seen: [], notes_read: [], spots_checked: [],
      ending_id: null, ending_evaluation: false, investigation_grade: null,
      human04_result_revealed: false
    };
    R.CLUES.forEach((c) => { s['clue_' + c.key + '_found'] = false; });
    Object.keys(R.CONNECTIONS).forEach((id) => { s['connection_' + id] = false; });
    return s;
  };

  L.has = (s, key) => !!s['clue_' + key + '_found'];
  L.clue = (key) => R.CLUES.find((c) => c.key === key);
  L.pairKey = (a, b) => [a, b].sort().join('+');
  L.connCount = (s) => R.NORMAL_CONNECTIONS.filter((id) => s['connection_' + id]).length; // D31: C13 제외

  /* 파생 상태값 다시 계산 */
  L.recompute = function (s) {
    s.interview_unlocked = L.has(s, '03A') && L.has(s, '03B') && L.has(s, '03C'); // R-12
    s.interview_completed = ORDER.every((w) => s['interview_' + w + '_done']);
    s.second_investigation_unlocked = L.has(s, '04A');                            // R-14
    s.clue_05D_unlocked = L.has(s, '05C');                                        // R-17
    s.restricted_unlocked = REQUIRED_7.every((k) => L.has(s, k));                 // R-20
    s.human04_base_read = L.has(s, '06A');                                        // R-22
    s.c08_human03_confirmed = !!s.connection_C08 && L.has(s, '05D');              // D17
    return s;
  };

  /* ---------- 페이지 이동 (R-03: 플레이어 버튼으로만) ---------- */
  L.canGo = function (s, page) {
    switch (page) {
      case '02': return s.resume_submitted && s.id_card_issued && s.opening_step === 'hired';
      case '03': return s.security_code_correct && s.briefing_done;
      case '04': return s.interview_unlocked;
      case '05': return s.interview_completed && s.second_investigation_unlocked;
      case '06': return s.restricted_unlocked;
      default: return false;
    }
  };
  L.go = function (s, page) {
    if (s.final_deduction_started || !L.canGo(s, page)) return false;
    if (page === '04') s.interview_page_started = true;
    if (page === '05') s.second_investigation_started = true;
    if (page === '06') s.restricted_entered = true;
    s.page = page;
    return true;
  };

  /* ---------- 상단 진행 단계 표시줄: 이미 진행한 단계로 돌아가기 ----------
     수색 1부터 표시한다. 단계를 옮겨도 모은 자료·연결은 그대로 (페이지만 바뀐다).
     최종 추론을 시작한 뒤에는 되돌릴 수 없다 (R-50·D29) */
  L.STEPS = [['03', '1차 수색'], ['04', '심문'], ['05', '2차 수색'], ['06', '3차 수색'], ['07', '최종 추론'], ['ending', '진상']];
  L.stepReached = function (s, page) {
    switch (page) {
      case '03': return s.briefing_done && s.security_code_correct && s.page !== '01' && s.page !== '02';
      case '04': return s.interview_page_started;
      case '05': return s.second_investigation_started;
      case '06': return s.restricted_entered;
      case '07': return s.final_deduction_started;
      case 'ending': return s.ending_evaluation;
      default: return false;
    }
  };
  L.canJump = (s, page) => page !== s.page && ['03', '04', '05', '06'].includes(page) &&
    !s.final_deduction_started && L.stepReached(s, page) && L.canGo(s, page);
  L.jump = (s, page) => (L.canJump(s, page) ? L.go(s, page) : false);

  /* ---------- 01 오프닝·입사 (prd.md 2단계, D35·D36) ----------
     monologue(독백) → posting(채용 공고) → resume(이력서) → idcard(사원증 만들기) → hired(‘입사를 축하합니다’)
     바탕화면 아이콘 없이 다음 창이 자동으로 이어진다 (D35). 시작하자마자 독백 (D36) */
  const OPENING_NEXT = { monologue: 'posting', posting: 'resume' };
  L.openingNext = function (s) {                      // 독백 끝 / 공고 [지원하기]
    if (s.page !== '01' || !OPENING_NEXT[s.opening_step]) return false;
    s.opening_step = OPENING_NEXT[s.opening_step];
    return true;
  };
  L.submitResume = function (s, name) {
    if (s.page !== '01' || s.opening_step !== 'resume' || s.resume_submitted) return false;
    s.player_name = (name || '').trim() || '신입사원'; // R-10
    s.resume_submitted = true;
    s.opening_step = 'idcard';                        // 사원증 만들기 창이 바로 열린다
    return true;
  };
  L.canUseIdCard = (s) => s.page === '01' && s.opening_step === 'idcard' && s.resume_submitted && !s.id_card_issued;
  L.issueIdCard = function (s, avatar) {
    if (!L.canUseIdCard(s) || !R.AVATARS.some((a) => a.id === avatar)) return false;
    s.player_avatar = avatar;
    s.id_card_issued = true;                         // 사원번호 DA-A 발급 (화면에 TEMP 없음, R-10)
    s.work_started_at = Date.now();                  // 근무 일정 카드의 흐르는 시각 기준 (09:00부터)
    s.opening_step = 'hired';                        // ‘입사를 축하합니다’ 알림
    return true;
  };

  /* ---------- 02 인트라넷 (prd.md 3단계) ---------- */
  const on02 = (s) => s.page === '02';
  L.finishIntro = function (s) {                     // 래미 첫 등장·인트라넷 안내 끝 (D36·D37)
    if (!on02(s) || s.intranet_intro_done) return false;
    s.intranet_intro_done = true;
    return true;
  };
  L.readPredecessor = function (s) {                 // 메신저 위젯 전임자(RA-H) 첫 메시지 (8절)
    if (!s.intranet_intro_done || s.predecessor_msg_read) return false; // 02 이후 언제든 위젯에서 열람
    s.predecessor_msg_read = true;
    return true;
  };
  /* 보안 교육 자료(십자말풀이)는 전임자 메시지를 읽은 뒤 래미에게 물어 연다 (신입사원 스토리 순서) */
  L.openCrossword = function (s) {
    if (!on02(s) || !s.predecessor_msg_read || s.crossword_open) return false;
    s.crossword_open = true;
    return true;
  };
  const norm = (t) => String(t || '').replace(/\s+/g, '').toUpperCase();
  L.solveWord = function (s, i, input) {
    const w = R.CROSSWORD.words[i];
    if (!on02(s) || !s.crossword_open || !w || s.crossword_solved.includes(i)) return false;
    if (norm(input) !== w.answer) return false;
    s.crossword_solved.push(i);
    return true;
  };
  L.crosswordDone = (s) => s.crossword_solved.length === R.CROSSWORD.words.length;
  /* 보안코드 입력은 래미 AI 창의 보안 교육 자료에서 (R-11). 문항을 다 풀지 않아도 코드는 입력할 수 있다 */
  L.submitCode = function (s, code) {
    if (!on02(s) || !s.crossword_open || s.security_code_correct) return false;
    const ok = norm(code) === R.CROSSWORD.code;
    if (ok) s.security_code_correct = true;
    return ok;
  };
  L.finishBriefing = function (s) {                  // 브리핑을 다 들으면 [제한 시스템 접속] 활성
    if (!on02(s) || !s.security_code_correct || s.briefing_done) return false;
    s.briefing_done = true;
    return true;
  };
  L.ramiLog = function (s, line) {                   // R-18: 래미 대사 기록
    s.rami_log.push(line);
    if (s.rami_log.length > 200) s.rami_log.splice(0, s.rami_log.length - 200);
  };
  /* 근무 일정의 흐르는 시각: 사원증 발급 시점을 09:00으로 보고 실제 흐른 시간만큼 더한다 */
  L.workClock = function (s, now) {
    const mins = s.work_started_at ? Math.floor(((now || Date.now()) - s.work_started_at) / 60000) : 0;
    const t = 9 * 60 + Math.max(0, mins);
    return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };

  /* ---------- 수색 ---------- */
  const PARTS = () => R.CLUE_PARTS || {};
  L.searchStage = (s) => SEARCH_STAGE[s.page] || 0;
  L.placeOpen = function (s, place) {
    const st = L.searchStage(s);
    if (place === 'lab') return st >= 2 && L.has(s, '05A');    // R-16
    if (place === 'restricted') return st >= 3;               // R-20 (R-21: 이전 장소도 계속 열림)
    return st >= 1;
  };
  L.clueAvailable = function (s, c) {
    return !!c.search && c.search <= L.searchStage(s) && L.placeOpen(s, c.place) &&
      (c.requires || []).every((k) => L.has(s, k));
  };
  L.openClue = function (s, key) {
    if (L.has(s, key)) return false;
    s['clue_' + key + '_found'] = true;
    s.clue_order.push(key);
    L.recompute(s);
    return true;
  };
  /* 수색에서 자료 하나를 연다 (하위 부분이 있으면 모두). 05-B는 VHS·PERSONNEL을 따로 연다 (R-18a, D73) */
  L.openFromSearch = function (s, key) {
    const parts = PARTS()[key];
    const items = parts ? parts.map(([p]) => ({ clue: key, part: p })) : [{ clue: key }];
    const before = L.has(s, key);
    items.forEach((it) => L.viewItem(s, it));
    return !before && L.has(s, key) ? [key] : [];
  };

  /* ---------- 장소 조사 (D73, investigation-map-rules.md) ----------
     오브젝트(클릭 영역) 하나 = 자료 하나(item). 상태는 clue_*_found·parts_seen·notes_read에서 계산한다 */
  L.partSeen = (s, key, part) => L.has(s, key) || s.parts_seen.includes(key + ':' + part);
  L.partsRead = (s, key) => (PARTS()[key] || []).filter(([p]) => L.partSeen(s, key, p)).length;
  L.note = (id) => (R.FIELD_NOTES || {})[id];
  L.itemRead = function (s, it) {
    if (it.note) return s.notes_read.includes(it.note);
    return it.part ? L.partSeen(s, it.clue, it.part) : L.has(s, it.clue);
  };
  L.itemAvailable = function (s, it) {
    if (it.note) {
      const n = L.note(it.note);
      return !!n && L.searchStage(s) >= (n.from || 1) && L.placeOpen(s, n.place);
    }
    const c = L.clue(it.clue);
    return !!c && L.clueAvailable(s, c);
  };
  /* 지금 열람할 수 있거나 이미 읽은 자료 (이전 단계로 돌아가도 다시 열람할 수 있게) */
  L.itemShown = (s, it) => L.itemAvailable(s, it) || L.itemRead(s, it);
  /* 자료 창을 열었을 때 기록. 이미 읽은 자료를 다시 열면 아무것도 바뀌지 않는다 (재열람은 새 획득·해금·조합 결과가 아니다) */
  L.viewItem = function (s, it) {
    if (s.final_deduction_started || L.itemRead(s, it) || !L.itemAvailable(s, it)) return false;
    if (it.note) { s.notes_read.push(it.note); return true; }
    if (it.part) {
      s.parts_seen.push(it.clue + ':' + it.part);
      if (L.partsRead(s, it.clue) === PARTS()[it.clue].length) L.openClue(s, it.clue); // 하위 부분을 모두 열람하면 획득
      return true;
    }
    return L.openClue(s, it.clue);
  };
  /* 오브젝트를 눌러 본 기록 (잠긴 상태에서 외형만 본 경우 포함). [새 자료] 판정에만 쓴다 */
  L.checkSpot = function (s, spotId) {
    if (!s.spots_checked.includes(spotId)) s.spots_checked.push(spotId);
  };
  /* 오브젝트 표시: null(표시 없음) / 'new'(눌러 본 뒤 새 내용이 열림) / 'done'(확인함) */
  L.spotBadge = function (s, spot) {
    if (!L.itemShown(s, spot.item)) return null;
    if (L.itemRead(s, spot.item)) return 'done';
    return s.spots_checked.includes(spot.id) ? 'new' : null;
  };
  /* 장소 완료 표시 (조사 UI 전용 — 해금·엔딩 조건에 쓰지 않는다). 지금 보고 있는 수색 단계 기준
     done / done-extra(선택 자료 남음) / progress(이전 단계는 마쳤고 이 단계 필수 자료가 남음) / null */
  L.placeStatus = function (s, placeId) {
    const st = L.searchStage(s);
    if (!st || !L.placeOpen(s, placeId)) return null;
    const inPlace = R.CLUES.filter((c) => c.place === placeId && c.search && c.search <= st);
    const req = inPlace.filter((c) => !c.optional);
    if (!req.length) return null;
    if (req.every((c) => L.has(s, c.key))) return inPlace.some((c) => c.optional && !L.has(s, c.key)) ? 'done-extra' : 'done';
    const earlier = req.filter((c) => c.search < st);
    return st >= 2 && earlier.length && earlier.every((c) => L.has(s, c.key)) ? 'progress' : null;
  };
  /* 이번 단계에 새로 생긴 보조자료가 남아 있는가 ([보조자료 있음]) */
  L.placeNewNotes = function (s, placeId) {
    const st = L.searchStage(s);
    return Object.keys(R.FIELD_NOTES || {}).some((id) => {
      const n = L.note(id);
      return n.place === placeId && (n.from || 1) >= 2 && (n.from || 1) <= st && L.itemAvailable(s, { note: id }) && !s.notes_read.includes(id);
    });
  };
  /* 이전 형식 저장 이전: 이미 획득한 03-A·03-C는 하위 부분을 모두 열람한 것으로 채운다 */
  L.migrate = function (s) {
    ['parts_seen', 'notes_read', 'spots_checked'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = []; });
    Object.keys(PARTS()).forEach((key) => {
      if (!L.has(s, key)) return;
      PARTS()[key].forEach(([p]) => { if (!s.parts_seen.includes(key + ':' + p)) s.parts_seen.push(key + ':' + p); });
    });
    return s;
  };

  /* ---------- 04 심문 (R-13: 한 번, A → B → C) ---------- */
  L.interviewTurn = (s) => ORDER.find((w) => !s['interview_' + w + '_done']) || null;
  L.ask = function (s, who, qi) {
    if (s.page !== '04' || L.interviewTurn(s) !== who) return false;
    const asked = s.interview_asked[who];
    if (!asked.includes(qi)) asked.push(qi);
    if (asked.length >= R.INTERVIEW[who].qa.length) s['interview_' + who + '_done'] = true;
    if (ORDER.every((w) => s['interview_' + w + '_done'])) L.openClue(s, '04A'); // 04-A 생성
    L.recompute(s);
    return true;
  };

  /* ---------- 조합 (R-35·R-37·R-37a, D26·D27) ---------- */
  L.findConnection = function (a, b) {
    const pk = L.pairKey(a, b);
    return Object.keys(R.CONNECTIONS).find((id) => L.pairKey(...R.CONNECTIONS[id].pair) === pk) || null;
  };
  /* 결과: success / wrong / blocked(이미 시도한 조합) / locked(보드 잠금) / invalid */
  L.tryConnect = function (s, a, b) {
    if (!a || !b || a === b || !L.has(s, a) || !L.has(s, b)) return { result: 'invalid' };
    if (s.board_locked) {
      const c13Pair = a === '06G' || b === '06G';
      if (!(s.c13_step_open && !s.connection_C13 && c13Pair)) return { result: 'locked' }; // R-51
    }
    const pk = L.pairKey(a, b);
    if (s.tried_pairs.includes(pk)) return { result: 'blocked' };
    s.tried_pairs.push(pk);
    const id = L.findConnection(a, b);
    if (!id) return { result: 'wrong' };
    s['connection_' + id] = true;
    L.recompute(s);
    return { result: 'success', id };
  };

  /* ---------- 07 최종 추론 (9절 의사코드) ---------- */
  L.canStartFinal = (s) => s.human04_base_read && !s.final_deduction_started; // R-22
  L.startFinal = function (s) {
    if (!L.canStartFinal(s) || s.ending_evaluation) return false;
    s.final_deduction_started = true;
    s.board_locked = true;                                    // R-51
    s.identity_check_started = true;
    s.identity_revealed = !!(s.connection_C06 && s.connection_C07); // R-52
    s.clue_06G_found = true;                                  // R-53: 항상 생성 (내용 한 가지)
    if (s.identity_revealed) {
      s.c13_step_open = true;                                 // R-54
      s.clue_order.push('06G');                               // 보관함에 ‘새로운 자료 추가’
    }
    s.page = '07';
    return true;
  };
  /* C13 후보 = 획득한 원자료 전체, 06-G·NEW 카드 제외, 획득 순서 (D28·D29) */
  L.c13Candidates = (s) => s.clue_order.filter((k) => k !== '06G');
  L.c13Try = (s, key) => L.tryConnect(s, '06G', key);
  L.finishC13 = function (s) {                               // 확인 창 [진행] 시 (D29)
    if (!s.c13_step_open || s.c13_step_done) return false;
    s.c13_step_done = true;
    s.c13_step_open = false;
    s.disconnect_eligible = !!(s.connection_C04 && s.connection_C08 && s.connection_C10 &&
      s.connection_C11 && s.connection_C13);                  // R-56
    return true;
  };
  L.finalChoice = function (s, choice) {
    if (!s.c13_step_done || s.ending_evaluation) return false;
    if (choice === 'transfer') { s.memory_transfer = true; return L.resolveEnding(s, 2); }      // R-61
    if (choice === 'disconnect' && s.disconnect_eligible) {                                  // R-62
      s.identity_disconnect = true; return L.resolveEnding(s, 3);
    }
    return false;
  };
  /* 정체 인식 실패 → 선택지 없이 엔딩 1 (R-60) */
  L.resolveEnding1 = (s) => (s.final_deduction_started && !s.identity_revealed ? L.resolveEnding(s, 1) : false);

  L.computeGrade = function (s, id) {                          // R-70~R-73
    const n = R.GRADE_KEYS[id].filter((k) => (k[0] === 'C' ? s['connection_' + k] : L.has(s, k))).length;
    return n === 4 ? 'COMPLETE' : n >= 2 ? 'PARTIAL' : 'INCOMPLETE';
  };
  L.resolveEnding = function (s, id) {
    if (s.ending_evaluation) return false;                   // R-64: 판정은 한 번
    s.ending_id = id;
    s.investigation_grade = L.computeGrade(s, id);
    s.ending_evaluation = true;
    s.human04_result_revealed = true;
    s.page = 'ending';
    return true;
  };
})(window.R01);
