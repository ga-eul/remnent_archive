// 진행 규칙(logic.js)·저장(store.js)을 브라우저 없이 검사한다. 사용: node tests/logic.test.js (저장소 루트에서)
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = process.argv[2] || path.join(__dirname, '..', 'shinip');
const mem = {};
const ctx = { window: {}, console,
  localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } } };
ctx.window = ctx; vm.createContext(ctx);
['data/clues.js', 'data/hotspots.js', 'data/fieldnotes.js', 'data/connections.js', 'data/text.js', 'data/intranet.js', 'data/finale.js', 'data/sfx.js', 'assets/assets.js', 'js/logic.js', 'js/store.js']
  .forEach((f) => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));
const R = ctx.R01, L = R.logic, S = R.store;
let fail = 0, pass = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL:', msg); } };

function playTo06(opts = {}) {
  const s = L.recompute(L.newState());
  ok(!L.go(s, '02'), '이력서 전 02 이동 불가');
  ok(!L.canUseIdCard(s) && !L.submitResume(s, 'x'), '오프닝 중 이력서·사원증 불가');
  ok(s.opening_step === 'monologue', 'D36 시작하자마자 독백');
  ok(L.openingNext(s) && s.opening_step === 'posting', 'D35 독백 → 채용 공고 바로');
  ok(!L.submitResume(s, 'x') && !L.issueIdCard(s, 0), '공고 단계에서 이력서·사원증 불가');
  ok(L.openingNext(s) && s.opening_step === 'resume', '[지원하기] → 이력서');
  ok(!L.openingNext(s), '이력서는 제출로만 넘어감');
  ok(L.submitResume(s, '') && s.player_name === '신입사원' && s.opening_step === 'idcard', 'R-10·D35 제출 → 사원증 만들기 자동');
  ok(!L.submitResume(s, '다른 이름') && s.player_name === '신입사원', '이력서 다시 제출 불가');
  ok(!L.go(s, '02'), '사원증 전 02 이동 불가');
  ok(!L.issueIdCard(s, 9) && L.issueIdCard(s, 2) && s.player_avatar === 2 && s.opening_step === 'hired', '사원증 발급');
  ok(L.go(s, '02'), '02 이동');
  ok(!L.readPredecessor(s) && !L.openCrossword(s), '래미 첫 안내 전 메신저·퍼즐 불가');
  ok(L.finishIntro(s) && !L.openCrossword(s), '래미 첫 안내 끝, 전임자 메시지 전 퍼즐 불가');
  ok(!L.submitCode(s, 'remain'), '퍼즐을 열기 전 코드 입력 불가 (R-11)');
  ok(L.readPredecessor(s) && L.openCrossword(s), '전임자 메시지 → 보안 교육 자료');
  ok(!L.solveWord(s, 0, 'recor') && L.solveWord(s, 0, ' re cord ') && !L.solveWord(s, 0, 'RECORD'), '십자말풀이 정답 판정');
  R.CROSSWORD.words.forEach((w, i) => L.solveWord(s, i, w.answer));
  ok(L.crosswordDone(s), '6문항 완료');
  ok(R.CROSSWORD.words.map((w) => w.answer[w.star]).join('') === 'REMAIN', '★ 글자 = REMAIN');
  ok(!L.submitCode(s, 'remainx') && L.submitCode(s, 'remain'), 'REMAIN 판정');
  ok(!L.go(s, '03'), '브리핑 전 03 이동 불가');
  ok(L.finishBriefing(s), '브리핑 끝');
  ok(L.workClock({ work_started_at: 1000 }, 1000 + 75 * 60000) === '10:15', '근무 시각 09:00 + 경과');
  ok(L.go(s, '03'), '03 이동');
  ok(!L.go(s, '04'), 'R-12 03 자료 전 면담 불가');
  ['03A', '03B'].forEach((k) => L.openFromSearch(s, k));
  ok(L.openFromSearch(s, '05A').length === 0, '수색1에서 05-A 열람 불가');
  ok(!L.canGo(s, '04'), '03-C 전 면담 불가');
  L.openFromSearch(s, '03C');
  if (opts.c01) ok(L.tryConnect(s, '03A', '03B').result === 'success', 'C01 성공');
  ok(L.tryConnect(s, '03A', '03C').result === 'wrong', '오답');
  ok(L.tryConnect(s, '03C', '03A').result === 'blocked', 'R-37a 같은 조합(순서 반대) 재시도 차단');
  ok(L.go(s, '04'), '04 이동');
  ok(!L.ask(s, 'B', 0), 'R-13 A 전에 B 불가');
  [0, 1, 2, 3].forEach((q) => L.ask(s, 'A', q));
  ok(s.interview_A_done && !s.interview_completed, 'A 완료');
  ok(!L.go(s, '05'), '심문 미완 2차 불가');
  ['B', 'C'].forEach((w) => [0, 1, 2, 3].forEach((q) => L.ask(s, w, q)));
  ok(s.clue_04A_found && s.interview_completed, '04-A 생성');
  ok(L.go(s, '05'), '05 이동');
  ok(L.openFromSearch(s, '05C').length === 0, 'R-16 05-A 전 업무실험실 닫힘');
  L.openFromSearch(s, '05A');
  ok(L.openFromSearch(s, '05D').length === 0, 'R-17 05-C 전 05-D 불가');
  L.openFromSearch(s, '05C');
  if (opts.c08Early) { L.openFromSearch(s, '05B_VHS'); ok(!s.clue_05B_PERSONNEL_found, 'D73 05-B-VHS만 열람 (PERSONNEL은 따로)');
    L.openFromSearch(s, '05B_PERSONNEL'); ok(s.clue_05B_PERSONNEL_found, 'R-18a 05-B-PERSONNEL 따로 열람');
    ok(L.tryConnect(s, '05B_VHS', '05B_PERSONNEL').result === 'success' && !s.c08_human03_confirmed, 'C08 05-D 전 성공, 갱신 전'); }
  ok(!s.restricted_unlocked, '05-D 전 제한구역 닫힘');
  L.openFromSearch(s, '05D');
  if (opts.c08Early) ok(s.c08_human03_confirmed, 'D17 05-D 열람 후 C08 갱신');
  ok(s.restricted_unlocked, 'R-20 필수 7개 → 제한구역');
  if (!opts.c08Early) { L.openFromSearch(s, '05B_VHS'); L.openFromSearch(s, '05B_PERSONNEL'); }
  if (opts.e05) L.openFromSearch(s, '05E');
  ok(L.go(s, '06'), '06 이동');
  ok(!L.canStartFinal(s), '06-A 전 최종 추론 불가');
  L.openFromSearch(s, '06A'); L.openFromSearch(s, '06B');
  if (opts.de !== false) L.openFromSearch(s, '06DE');
  if (opts.s06) L.openFromSearch(s, '06S');
  ok(L.canStartFinal(s), 'R-22 06-A → 최종 추론');
  return s;
}
const connect = (s, ids) => ids.forEach((id) => { const r = L.tryConnect(s, ...R.CONNECTIONS[id].pair); ok(r.result === 'success', id + ' 성공'); });

// 경로 1: 완벽 → 엔딩 3 COMPLETE
let s = playTo06({ c01: true, e05: true, s06: true });
connect(s, ['C04', 'C05', 'C06', 'C07', 'C08', 'C10', 'C11']);
ok(L.connCount(s) === 8, '연결 성공 8');
L.startFinal(s);
ok(s.board_locked && s.identity_revealed && s.c13_step_open, '최종 추론 → C13 단계');
ok(L.tryConnect(s, '05A', '05C').result === 'locked', 'R-51 보드 잠금');
ok(!L.c13Candidates(s).includes('06G'), 'D28 후보에서 06-G 제외');
ok(L.c13Try(s, '05E').result === 'wrong' && L.c13Try(s, '05E').result === 'blocked', 'D27 C13 오답 후 같은 조합 차단');
ok(L.c13Try(s, '06B').result === 'wrong', 'D27 다른 후보 계속 가능');
ok(L.c13Try(s, '06DE').result === 'success' && s.connection_C13, 'C13 성공');
ok(L.c13Try(s, '03A').result === 'locked', 'D29 성공 후 조합 영역 잠금');
ok(L.connCount(s) === 8, 'D31 연결 성공 n에 C13 미포함');
ok(!s.disconnect_eligible && L.finishC13(s) && s.disconnect_eligible, '확인 창 [진행] 때 엔딩 3 자격 판정');
ok(L.finalChoice(s, 'disconnect') && s.ending_id === 3 && s.investigation_grade === 'COMPLETE', '엔딩 3 COMPLETE');
ok(!L.finalChoice(s, 'transfer'), 'R-64 판정 1회');

// 경로 2: C07 실패 → 엔딩 1
s = playTo06({});
connect(s, ['C06']);
L.startFinal(s);
ok(!s.identity_revealed && !s.c13_step_open && s.clue_06G_found && !s.clue_order.includes('06G'), 'R-53 06-G 생성되나 보관함 비표시');
ok(L.resolveEnding1(s) && s.ending_id === 1, '엔딩 1');

// 경로 3: C10 미완 → 차단 비활성 → 엔딩 2
s = playTo06({ c08Early: true });
connect(s, ['C04', 'C06', 'C07', 'C11']);
L.startFinal(s); L.c13Try(s, '06DE'); L.finishC13(s);
ok(!s.disconnect_eligible && !L.finalChoice(s, 'disconnect'), 'R-56 차단 비활성');
ok(L.finalChoice(s, 'transfer') && s.ending_id === 2, '엔딩 2');

// 경로 4: 06-D/E 미열람 → C13 정답 후보 없음
s = playTo06({ de: false });
connect(s, ['C06', 'C07']);
L.startFinal(s);
ok(!L.c13Candidates(s).includes('06DE') && L.c13Try(s, '06DE').result === 'invalid', 'C13 순환 금지 (06-D/E 미열람)');

// 경로 5: C13 미시도 → 확인 창 [진행]
s = playTo06({});
connect(s, ['C06', 'C07']);
L.startFinal(s); L.finishC13(s);
ok(s.c13_step_done && !s.connection_C13 && !s.disconnect_eligible, 'C13 미시도 진행 가능');

// 저장·복원 (R-80~R-85)
S.setStatus('in_progress');
s = playTo06({}); connect(s, ['C06', 'C07']); L.startFinal(s); L.c13Try(s, '05A');
S.saveCase(s);
const r = S.loadCase();
ok(r.c13_step_open && r.tried_pairs.includes(L.pairKey('06G', '05A')) && r.page === '07', 'R-80 tried_pairs·C13 단계 복원');
ok(S.status() === 'in_progress', 'status in_progress');
S.recordEnding(2, 'PARTIAL'); S.recordEnding(2, 'INCOMPLETE'); S.recordEnding(1, 'COMPLETE');
ok(S.status() === 'finished' && S.endingsSeen()[2] === 'PARTIAL' && S.endingsSeen()[1] === 'COMPLETE', '엔딩 기록·최고 등급 유지');
S.clearCase();
ok(S.loadCase() === null && S.endingsSeen()[1] === 'COMPLETE', 'R-84 진행 칸만 비움, 공통 칸 유지');

// 중간 세이브 (D43): 최종 추론 직전, 최대 3개, 허브용 요약에는 진행 내용이 없다
for (const k of Object.keys(mem)) delete mem[k];
const cpState = playTo06({});
for (let i = 0; i < 4; i++) { cpState.player_name = '판' + i; S.addSave(cpState, '3차 수색'); }
const saves = S.listSaves();
ok(saves.length === 3 && saves[0].state.player_name === '판3', 'D43 중간 세이브 최대 3개, 최신이 앞');
const gsum = S.loadGlobal().saves['present-01'];
ok(gsum.length === 3 && gsum[0].point === '3차 수색' && gsum[0].theme === '신입사원' && !('state' in gsum[0]), 'D43 허브 요약: 날짜·테마·지점만');
const loaded = S.loadSave(saves[1].id);
ok(loaded && loaded.page === '06' && loaded.player_name === '판2' && !loaded.final_deduction_started && S.status() === 'in_progress', 'D43 불러오면 3차 수색, 진행 중');
ok(S.loadCase().player_name === '판2' && S.loadGlobal().progress['present-01'].point === '3차 수색', 'D43 진행 칸·진행 요약 갱신');
ok(R.STAFF.A.name === '엘리넛 쇼' && R.STAFF.B.age === 38 && R.STAFF.C.role === '보안 담당', 'D44 직원 이름·나이·직책');

// 상단 진행 단계 표시줄: 이미 진행한 단계로만 이동, 자료·연결은 그대로, 최종 추론 뒤에는 불가
{
  const s = playTo06({ c01: true });
  const clues = s.clue_order.length, c01 = s.connection_C01;
  ok(s.page === '06' && ['03', '04', '05'].every((p) => L.canJump(s, p)) && !L.canJump(s, '06') && !L.canJump(s, '07'), '단계 표시줄: 지난 단계만 이동 가능');
  ok(L.jump(s, '03') && s.page === '03' && s.clue_order.length === clues && s.connection_C01 === c01, '1차 수색으로 돌아가도 자료·연결 유지');
  ok(L.canJump(s, '06') && L.jump(s, '05') && L.jump(s, '06') && s.page === '06', '이미 진행한 뒤 단계로 다시 이동');
  const t = L.recompute(L.newState()); t.page = '03'; t.briefing_done = true; t.security_code_correct = true;
  ok(!L.canJump(t, '04') && !L.jump(t, '04'), '진행하지 않은 단계는 이동 불가');
  L.startFinal(s);
  ok(['03', '04', '05', '06'].every((p) => !L.canJump(s, p)) && s.page === '07', '최종 추론 뒤에는 되돌릴 수 없음 (R-50)');
  ok(L.newState().memo === '' && 'memo' in L.newState(), '추리 메모장 칸');
}

// 단서 에셋 연결 (D54~D58): 모든 자료에 에셋이 있고, 등록 경로의 파일이 실제로 있다
{
  const A = R.CLUE_ASSETS;
  ok(R.CLUES.every((c) => A[c.key] && A[c.key].kind !== 'pending'), 'D58 모든 자료에 에셋 연결 (에셋 준비 중 없음)');
  const files = Object.values(A).flatMap((a) => [a.html, a.img, a.video, a.fallback].filter(Boolean));
  ok(files.every((f) => fs.existsSync(path.join(dir, f))), 'CLUE_ASSETS 경로의 파일이 모두 있음');
  const g = fs.readFileSync(path.join(dir, A['06G'].html), 'utf8');
  ok(g.includes('계정과 실험 기록은 연결되어 있지만, 실제 사용자 신원은 확인할 수 없음'), 'R-07 06-G 본문');
  ok(!/인사 기록|미등록|TEMP|HUMAN-04|06-D\/E/.test(g), 'D28 ⑨ 06-G에 06-D/E 표기·지시 없음');
  ok(!R.SPOTS['06G'].summary.join('').includes('신원은 확인할 수 없음'), 'D40 ③ 06-G 기록 요약에 본문 없음');
  ok(L.clue('06G').name === '신원 확인 결과 보고서' && !/식별 실패|IDENTIFICATION FAILURE/.test(g + R.SPOTS['06G'].summary.join('')), 'D72 06-G 화면 표시명');
  const c = fs.readFileSync(path.join(dir, A['05C'].html), 'utf8');
  ok(!/HUMAN|중단|실패|04회차/.test(c) && c.includes('확인 불가'), 'D58 05-C 절차 기록만 (HUMAN 번호·판정 없음)');
}

// D62·R-32: 05-B-PERSONNEL 화면 표시명·문서 제목에 결론(삭제된 직원) 금지
{
  const c = L.clue('05B_PERSONNEL');
  const doc = fs.readFileSync(path.join(dir, R.CLUE_ASSETS['05B_PERSONNEL'].html), 'utf8');
  ok(c.name === '인사·업무 기록' && !/삭제/.test(c.name + R.SPOTS['05B_PERSONNEL'].summary.join('')), 'D62 05-B-PERSONNEL 표시명');
  ok(!doc.includes('삭제된 직원'), 'D62 05-B-PERSONNEL 문서 제목에 결론 없음');
}

// 장소 조사 도면·보조자료 (D73, case 01/investigation-map-rules.md)
{
  const HS = R.HOTSPOTS, NOTES = R.FIELD_NOTES;
  const allSpots = Object.keys(HS).flatMap((p) => HS[p].map((x) => Object.assign({ place: p }, x)));
  const spot = (id) => allSpots.find((x) => x.id === id);
  const cap = (id) => 'place' + id[0].toUpperCase() + id.slice(1);
  // 데이터 정합
  ok(R.PLACES.every((p) => HS[p.id] && R.ASSETS[cap(p.id)] && fs.existsSync(path.join(dir, R.ASSETS[cap(p.id)]))), 'D73 장소 5곳 도면 이미지·클릭 영역');
  ok(allSpots.every((x) => x.box.length === 4 && x.box[0] >= 0 && x.box[1] >= 0 && x.box[0] + x.box[2] <= 100 && x.box[1] + x.box[3] <= 100), 'D73 클릭 영역 좌표가 도면 안');
  ok(new Set(allSpots.map((x) => x.id)).size === allSpots.length, 'D73 오브젝트 id 중복 없음');
  const noteIds = Object.keys(NOTES);
  ok(noteIds.length === 13 && noteIds.every((id, i) => id === 'RA-S' + String(i + 1).padStart(2, '0')), 'D73 보조자료 RA-S01~RA-S13');
  ok(noteIds.every((id) => allSpots.filter((x) => x.item.note === id).length === 1 && spot(allSpots.find((x) => x.item.note === id).id).place === NOTES[id].place), 'D73 보조자료마다 오브젝트 하나, 문서 위치와 같은 장소');
  ok(noteIds.every((id) => NOTES[id].img && fs.existsSync(path.join(dir, NOTES[id].img)) && NOTES[id].img.endsWith(id.toLowerCase() + '.jpg')), 'D75 보조자료 이미지 13개 일대일 연결');
  const searchClues = R.CLUES.filter((c) => c.place);
  ok(searchClues.every((c) => {
    const parts = R.CLUE_PARTS[c.key];
    const hs = allSpots.filter((x) => x.item.clue === c.key);
    return hs.every((x) => x.place === c.place) && (parts ? parts.every(([p]) => hs.some((x) => x.item.part === p)) : hs.length === 1);
  }), 'D73 수색 자료마다 그 장소 오브젝트 (03-A·03-C는 하위 부분마다)');
  ok(!allSpots.some((x) => ['04A', '06G'].includes(x.item.clue)), 'D73 04-A·06-G는 오브젝트에 두지 않음');
  // 확정 문구 대조 (저장소 루트 원문이 있을 때)
  const src = path.join(dir, '..', '보조단서(단서명,자료번호,문서위치,MYARCIVE,기록요약).txt');
  if (fs.existsSync(src)) {
    const txt = fs.readFileSync(src, 'utf8').replace(/\r/g, '');
    const blocks = txt.split(/\n(?=\d+\. RA-S\d\d)/).slice(1);
    const placeKo = { archive: '기록보관실', control: '관제실', living: '생활공간', lab: '업무실험실', restricted: '제한구역' };
    ok(blocks.length === 13 && blocks.every((b) => {
      const id = b.match(/자료번호 : (RA-S\d\d)/)[1], n = NOTES[id];
      return n && b.includes('단서명(헤드제목) : ' + n.title + '\n') && b.includes('문서위치 : ' + placeKo[n.place] + '\n') &&
        b.includes('My Archive : 미보관') && b.includes('기록 요약 : ' + n.summary);
    }), 'D73 보조자료 제목·위치·기록 요약이 확정 원문과 같음');
  }
  const noteText = noteIds.map((id) => NOTES[id].title + NOTES[id].summary).join('\n');
  ok(!/RA-H|HUMAN|SEC-17|DA-A|TEMP|SELF ARCHIVE|엘리넛|마거릿|피터|\d{1,2}:\d{2}|01\.24|04\.12/.test(noteText), 'D73 보조자료 문구에 사건 식별자·실명·날짜 없음');

  // 진행: 1차 수색
  const s = L.recompute(L.newState());
  Object.assign(s, { page: '03', briefing_done: true, security_code_correct: true, opening_step: 'hired' });
  ok(!L.itemShown(s, spot('control-server').item), '1차: 서버 랙(05-B-VHS)은 아직 열리지 않음');
  L.checkSpot(s, 'control-server');
  ok(!L.viewItem(s, spot('control-server').item) && !L.has(s, '05B_VHS') && L.spotBadge(s, spot('control-server')) === null, '잠긴 오브젝트를 눌러도 획득·확인 처리 없음');
  ok(L.viewItem(s, spot('archive-shelf').item) && !L.has(s, '03A') && s.clue_order.length === 0, '03-A 명부만 열람: 아직 미획득');
  ok(L.spotBadge(s, spot('archive-shelf')) === 'done' && L.spotBadge(s, spot('archive-return')) === null && L.placeStatus(s, 'archive') === null, '명부 [확인함], 업무 기록 표시 없음, 기록보관실 미완료');
  L.viewItem(s, spot('archive-return').item);
  ok(L.has(s, '03A') && s.clue_order.join() === '03A' && L.placeStatus(s, 'archive') === 'done', '03-A 두 부분 열람 → 획득, 기록보관실 [수색완료]');
  L.viewItem(s, spot('control-cctv').item);
  L.viewItem(s, spot('living-burgundy').item);
  ok(L.partsRead(s, '03C') === 1 && !L.has(s, '03C') && !s.interview_unlocked && !L.canGo(s, '04'), '03-C 1/2 확인: 면담 버튼 비활성');
  ok(L.spotBadge(s, spot('living-burgundy')) === 'done' && L.placeStatus(s, 'living') === null, '버건디 수첩 [확인함], 생활공간 미완료');
  const before = JSON.stringify([s.clue_order, s.interview_unlocked]);
  ['RA-S01', 'RA-S02', 'RA-S03', 'RA-S04', 'RA-S05', 'RA-S06', 'RA-S08'].forEach((id) => ok(L.viewItem(s, { note: id }), id + ' 1차 열람'));
  ok(!L.viewItem(s, { note: 'RA-S07' }) && !L.viewItem(s, { note: 'RA-S09' }), 'RA-S07(2차부터)·업무실험실 보조자료는 1차에 열람 불가');
  ok(JSON.stringify([s.clue_order, s.interview_unlocked]) === before && !L.has(s, '03C'), '보조자료를 읽어도 자료·해금 변화 없음');
  L.viewItem(s, spot('living-black').item);
  ok(L.partsRead(s, '03C') === 2 && L.has(s, '03C') && s.interview_unlocked && L.placeStatus(s, 'living') === 'done', '03-C 2/2 → 획득, 면담 해금, 생활공간 [수색완료]');
  ok(!L.viewItem(s, spot('archive-shelf').item) && s.clue_order.length === 3, '이미 읽은 자료 재열람은 상태 변화 없음');

  // 2차 수색
  ['A', 'B', 'C'].forEach((w) => { s['interview_' + w + '_done'] = true; });
  L.openClue(s, '04A'); s.interview_page_started = true;
  ok(L.go(s, '05') && L.searchStage(s) === 2, '2차 수색');
  ok(L.placeStatus(s, 'archive') === 'progress' && L.placeStatus(s, 'control') === 'progress', '2차: 기록보관실·관제실 [2차 수색 중]');
  ok(L.placeStatus(s, 'living') === 'done' && L.placeNewNotes(s, 'living'), '2차: 생활공간은 1차 완료 유지 + [보조자료 있음]');
  L.viewItem(s, { note: 'RA-S07' });
  ok(!L.placeNewNotes(s, 'living') && L.placeStatus(s, 'living') === 'done', 'RA-S07 읽으면 [보조자료 있음] 사라짐');
  ok(L.spotBadge(s, spot('control-server')) === 'new', '1차에 눌러 본 서버 랙이 2차에 [새 자료]');
  L.viewItem(s, spot('control-server').item);
  ok(L.has(s, '05B_VHS') && !L.has(s, '05B_PERSONNEL') && L.spotBadge(s, spot('control-server')) === 'done', '05-B-VHS만 획득, [확인함]');
  ok(L.tryConnect(s, '05B_VHS', '05B_PERSONNEL').result === 'invalid', 'C08은 두 05-B 자료를 모두 얻어야 가능');
  L.viewItem(s, spot('control-cabinet').item);
  ok(L.placeStatus(s, 'control') === 'done-extra', '05-B 두 자료 → 관제실 [수색완료 · 추가 조사 가능] (05-E 남음)');
  ok(L.viewItem(s, spot('control-security').item) && L.placeStatus(s, 'control') === 'done' && !s.connection_C10, '05-E 직접 열람(해금 조건 없음) → [수색완료], C10과 무관');
  ok(!L.placeOpen(s, 'lab'), '05-A 전 업무실험실 닫힘 (R-16)');
  L.viewItem(s, spot('archive-cabinet').item);
  ok(L.placeOpen(s, 'lab') && L.placeStatus(s, 'archive') === 'done', '05-A → 업무실험실 개방, 기록보관실 [수색완료]');
  L.checkSpot(s, 'lab-desk');
  ok(!L.viewItem(s, spot('lab-desk').item) && L.spotBadge(s, spot('lab-desk')) === null, '05-C 전 분석 책상(05-D) 열람 불가');
  L.checkSpot(s, 'lab-chair'); L.viewItem(s, spot('lab-chair').item);
  ok(L.spotBadge(s, spot('lab-chair')) === 'done', '실험 의자(RA-S10) [확인함]');
  L.viewItem(s, spot('lab-console').item);
  ok(L.spotBadge(s, spot('lab-desk')) === 'new' && !s.connection_C05, '05-C 열람 후 분석 책상 [새 자료] (C05와 무관)');
  ok(L.viewItem(s, spot('lab-desk').item) && L.has(s, '05D') && L.placeStatus(s, 'lab') === 'done', '05-D 열람 → 업무실험실 [수색완료]');
  ok(s.restricted_unlocked && L.connCount(s) === 0, '제한구역 개방은 필수 7개만 (장소 완료·보조자료와 무관)');

  // 이전 단계로 돌아가기
  s.second_investigation_started = true;
  ok(L.jump(s, '03') && L.spotBadge(s, spot('archive-cabinet')) === 'done' && L.itemShown(s, spot('archive-cabinet').item), '1차로 돌아가도 05-A 캐비닛 [확인함]·다시 열람');
  ok(L.placeStatus(s, 'archive') === 'done' && L.placeStatus(s, 'control') === 'done' && L.placeStatus(s, 'lab') === null, '1차 기준 장소 완료 표시');
  const n0 = s.clue_order.length;
  ok(!L.viewItem(s, spot('archive-cabinet').item) && s.clue_order.length === n0, '재열람은 새 획득 없음');
  L.jump(s, '05');

  // 3차 수색
  ok(L.go(s, '06'), '3차 수색');
  L.viewItem(s, spot('restricted-locker').item);
  ok(L.canStartFinal(s) && L.placeStatus(s, 'restricted') === null, '06-A만: 최종 추론 버튼만 활성, [수색완료] 아님');
  L.viewItem(s, spot('restricted-glass').item);
  ok(L.placeStatus(s, 'restricted') === null, '06-A·06-S만: 완료 표시 없음');
  L.viewItem(s, spot('restricted-pc').item); L.viewItem(s, spot('restricted-server').item);
  ok(L.placeStatus(s, 'restricted') === 'done', '06-A·06-B·06-D/E (+06-S) → [수색완료]');
  const t = JSON.parse(JSON.stringify(s)); t.clue_06S_found = false; t.clue_order = t.clue_order.filter((k) => k !== '06S');
  ok(L.placeStatus(t, 'restricted') === 'done-extra', '06-S 안 읽으면 [수색완료 · 추가 조사 가능]');
  ok(L.placeStatus(s, 'archive') === 'done' && L.placeStatus(s, 'living') === 'done', '3차: 이전 장소는 2차 기준 유지');

  // 보조자료는 진행에 영향 없음
  noteIds.forEach((id) => L.viewItem(s, { note: id }));
  ok(s.notes_read.length === 13 && s.clue_order.every((k) => L.clue(k)) && !s.clue_order.some((k) => /^RA/.test(k)), '보조자료 13개 열람, clue_order에 없음');
  ok(!L.c13Candidates(s).some((k) => /^RA/.test(k)) && Object.values(R.GRADE_KEYS).flat().every((k) => !/^RA/.test(k)), '보조자료는 C13 후보·완성도 키에 없음');

  // 저장·복원
  for (const k of Object.keys(mem)) delete mem[k];
  S.saveCase(s);
  const r = S.loadCase();
  ok(r.notes_read.length === 13 && r.spots_checked.includes('lab-desk') && r.parts_seen.includes('03C:black') && L.placeStatus(r, 'restricted') === 'done', '새로고침: 보조자료·눌러 본 기록·하위 열람·장소 완료 복원');
  // 이전 형식 세이브 (하위 열람·보조자료 칸 없음, 05-B 묶음 획득)
  const old = L.recompute(L.newState());
  ['parts_seen', 'notes_read', 'spots_checked'].forEach((k) => delete old[k]);
  Object.assign(old, { page: '05', briefing_done: true, security_code_correct: true, interview_A_done: true, interview_B_done: true, interview_C_done: true, interview_page_started: true, second_investigation_started: true });
  ['03A', '03B', '03C', '04A', '05B_VHS', '05B_PERSONNEL'].forEach((k) => { old['clue_' + k + '_found'] = true; old.clue_order.push(k); });
  mem['remnant.present-01'] = JSON.stringify({ version: 1, state: old });
  const m = S.loadCase();
  ok(m && m.parts_seen.length === 4 && L.partsRead(m, '03A') === 2 && L.partsRead(m, '03C') === 2, '이전 세이브: 03-A·03-C 하위 부분 모두 열람으로 채움');
  ok(['archive-shelf', 'archive-return', 'living-burgundy', 'living-black', 'control-server', 'control-cabinet'].every((id) => L.spotBadge(m, spot(id)) === 'done'), '이전 세이브: 획득 자료 오브젝트 [확인함]');
  ok(m.interview_unlocked && m.clue_order.length === 6 && L.placeStatus(m, 'control') === 'done-extra', '이전 세이브: 진행·장소 완료 그대로');
}

// D75: 화면 문구에 [임시]·[초안] 표시 없음 (코드 주석 제외)
{
  const code = fs.readdirSync(dir, { recursive: true }).filter((f) => /\.(js|html)$/.test(f))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$|<!--[\s\S]*?-->/gm, '')).join('\n');
  ok(!/\[(\d단계 )?임시|\[초안\]|\[에셋 준비/.test(code), 'D75 화면 문구에 [임시]·[초안] 없음');
}

// 금지 문자열 (CLAUDE.md 절대 금지)
const all = fs.readdirSync(dir, { recursive: true }).filter((f) => /\.(js|html|css)$/.test(f))
  .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
ok(!/Edward|에드워드|밀러|SELF ARCHIVE SYSTEM/i.test(all), '금지 문자열 없음');
ok(!/실험용|TEMP/.test(all.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace('계정 유형: TEMP', '')
  .replace('<th scope="col">계정 유형</th>', '').replace('<code class="audit-type">TEMP</code>', '')), 'D13·D24 화면 문구에 실험용·TEMP 없음 (06-D/E의 ‘계정 유형: TEMP’만 허용, 주석 제외)');

// D79 데모 종료 페이지 (저장소 루트 shinip_demo_complete.html)
{
  const demoPath = path.join(dir, '..', 'shinip_demo_complete.html');
  if (fs.existsSync(demoPath)) {
    const demo = fs.readFileSync(demoPath, 'utf8');
    const gameHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const font = (x) => (x.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/) || [])[0];
    ok(font(demo) && font(demo) === font(gameHtml), 'D79 데모 페이지 글꼴이 게임과 같음');
    ok(!/Pretendard|Consolas/.test(demo), 'D79 데모 페이지에 다른 글꼴 없음');
    ok(!/Edward|에드워드|밀러|SELF ARCHIVE SYSTEM/i.test(demo), 'D79 데모 페이지 금지 문자열 없음');
    ok(!/엔딩 카드|연결해 주세요/.test(demo), 'D79 데모 페이지에 엔딩 카드·개발용 안내 문구 없음');
    ok(/const HUB_URL = 'index \(1\)\.html'/.test(demo), 'D79 데모 페이지 허브 주소');
    const main = fs.readFileSync(path.join(dir, 'js', 'main.js'), 'utf8');
    ok(main.includes("DEMO_URL = '../shinip_demo_complete.html'"), 'D79 게임에서 데모 페이지 주소');
  }
}

// D81 처음 한 번만 보이는 플레이 전 안내 (저장소 루트 first-launch-notice-terminal.html)
{
  const noticePath = path.join(dir, '..', 'first-launch-notice-terminal.html');
  const hubPath = path.join(dir, '..', 'index (1).html');
  if (fs.existsSync(noticePath) && fs.existsSync(hubPath)) {
    const notice = fs.readFileSync(noticePath, 'utf8');
    const hub = fs.readFileSync(hubPath, 'utf8');
    const gameHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const font = (x) => (x.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/) || [])[0];
    ok(font(notice) && font(notice) === font(gameHtml) && font(hub) === font(gameHtml), 'D81 안내 페이지 글꼴이 게임·허브와 같음');
    ok(!/Malgun|Apple SD Gothic/.test(notice), 'D81 안내 페이지에 다른 글꼴 없음');
    ok(!/Edward|에드워드|밀러|SELF ARCHIVE SYSTEM/i.test(notice), 'D81 안내 페이지 금지 문자열 없음');
    ok(notice.includes("허브 아래쪽의 '<strong>연출 줄이기</strong>'") && !notice.includes('설정에서'), 'D81 연출 줄이기 안내 문구');
    // D84: 안내 → loading.html(3초 진행 막대) → 허브
    ok(/location\.replace\(LOADING_URL\)/.test(notice) && /const LOADING_URL = 'loading\.html'/.test(notice) && !/id="loading"/.test(notice), 'D84 안내 페이지 → loading.html');
    const loadP = path.join(dir, '..', 'loading.html');
    ok(fs.existsSync(loadP), 'D84 loading.html 있음');
    if (fs.existsSync(loadP)) {
      const ld = fs.readFileSync(loadP, 'utf8');
      ok(/data-next="index \(1\)\.html"/.test(ld) && /const duration = 3000;/.test(ld), 'D84 로딩 3초 뒤 허브');
      ok(font(ld) === font(gameHtml) && !/IBM Plex|Consolas/.test(ld), 'D84 로딩 글꼴이 게임과 같음');
      ok(!/Edward|에드워드|밀러|SELF ARCHIVE SYSTEM/i.test(ld), 'D84 로딩 금지 문자열 없음');
    }
    ok(/g\.settings\.notice_seen = true/.test(notice), 'D81 본 기록은 settings.notice_seen');
    ok(/settings\.notice_seen\)\) location\.replace\('first-launch-notice-terminal\.html'\)/.test(hub), 'D81 허브가 처음 한 번만 안내로 보냄');
    ok(!/AI로 생성/.test(hub) && /AI로 생성/.test(notice), 'D81 AI 고지는 안내 페이지에만');
    // 게임이 remnant.global을 다시 저장해도 settings.notice_seen이 남는다
    const before = mem['remnant.global'];
    mem['remnant.global'] = JSON.stringify({ settings: { notice_seen: true, reduced: false } });
    S.setStatus('in_progress');
    S.saveCase(L.recompute(L.newState()));
    S.recordEnding(1, 'INCOMPLETE');
    const g = JSON.parse(mem['remnant.global']);
    ok(g.settings.notice_seen === true && g.settings.reduced === false, 'D81 게임 저장 뒤에도 settings.notice_seen 유지');
    if (before === undefined) delete mem['remnant.global']; else mem['remnant.global'] = before;
  }
}

// D83 효과음: 번호·파일·공유·볼륨·클리핑 여유
{
  const crypto = require('crypto');
  const SFX = R.SFX, FILES = R.SFX_FILES, MIX = R.SFX_MIX;
  const ids = Object.keys(SFX).map(Number).sort((x, y) => x - y);
  const want = []; for (let n = 0; n <= 32; n++) if (![13, 15, 21].includes(n)) want.push(n);
  ok(JSON.stringify(ids) === JSON.stringify(want), 'D83·D86 효과음 30개 (0~32번 중 13·15·21번 없음)');
  const sfxDir = path.join(dir, 'assets', 'sfx');
  const onDisk = fs.readdirSync(sfxDir).filter((f) => f.endsWith('.mp3')).sort();
  ok(JSON.stringify(onDisk) === JSON.stringify(Object.keys(FILES).sort()), 'D83 assets/sfx 파일 = SFX_FILES 목록');
  ok(ids.every((n) => FILES[SFX[n].file]), 'D83 모든 번호가 있는 파일을 가리킴');
  ok(Object.keys(FILES).every((f) => ids.some((n) => SFX[n].file === f)), 'D83 쓰지 않는 파일 없음');
  const hashes = onDisk.map((f) => crypto.createHash('md5').update(fs.readFileSync(path.join(sfxDir, f))).digest('hex'));
  ok(new Set(hashes).size === hashes.length, 'D83 같은 MP3는 한 번만 복사');
  ok([[1, 32], [20, 25], [3, 8], [10, 18], [28, 29]].every(([x, y]) => SFX[x].file === SFX[y].file), 'D83 1·32, 20·25, 3·8, 10·18, 28·29는 같은 파일 공유');
  ok(!Object.values(FILES).some((f) => f.src.some((n) => /ksjsbwuil|후보/.test(n))), 'D83 번호 없는 후보·엔딩2 후보는 쓰지 않음');
  ok(FILES[SFX[30].file].src[0] === '30-엔딩2.mp3', 'D83 30번은 30-엔딩2.mp3');
  // 클리핑 여유: 원본 피크 + 이벤트 볼륨 + 효과음 마스터 ≤ -1 dBFS (리미터 앞 기준)
  const db = (v) => 20 * Math.log10(v);
  const hot = ids.filter((n) => FILES[SFX[n].file].peak + db(SFX[n].vol * MIX.master) > -1);
  ok(hot.length === 0, 'D83 모든 효과음 피크 -1dBFS 이하 ' + hot.join(','));
  ok(SFX[26].vol <= 0.12, 'D83 26 글리치 볼륨 낮춤');
  ok(SFX[17].loop && SFX[17].vol <= 0.18, 'D83 17 CCTV 노이즈 반복·낮은 볼륨');
  ok(SFX[2].clip && SFX[2].clip.hold === 3 && SFX[2].clip.fade === 1 && SFX[2].vol === 0.2 && !SFX[2].loop, 'D83 2 메뉴 전환: 3초 + 1초 페이드, 20%, 반복 없음');
  ok([5, 9, 22].every((n) => SFX[n].vol > 1), 'D83 5·9·22 증폭');
  ok(ids.every((n) => SFX[n].vol > 0 && SFX[n].at), 'D83 볼륨·재생 위치 기록');
  // 원본 폴더가 있으면 사본이 원본과 바이트까지 같은지
  const srcDir = path.join(dir, '..', '효과음_26개+후보');
  if (fs.existsSync(srcDir)) {
    ok(Object.entries(FILES).every(([f, m]) => m.src.every((n) => fs.readFileSync(path.join(srcDir, n)).equals(fs.readFileSync(path.join(sfxDir, f))))),
      'D83 게임용 사본 = 원본 (수정 없음)');
  }
  // 재생 모듈·연결
  const snd = fs.readFileSync(path.join(dir, 'js', 'sound.js'), 'utf8');
  ok(snd.includes("typeof v === 'boolean' ? v : true"), 'D83 소리 기본값 켜짐, 저장값 우선');
  ok(/g\.settings\.sound = on/.test(snd), 'D83 소리 설정은 remnant.global.settings.sound');
  ok(/pointerdown', unlock, true/.test(snd), 'D83 첫 사용자 입력 뒤에만 재생');
  const hubP = path.join(dir, '..', 'index (1).html');
  if (fs.existsSync(hubP)) {
    const hub = fs.readFileSync(hubP, 'utf8');
    ok(hub.includes('src="shinip/data/sfx.js"') && hub.includes('src="shinip/js/sound.js"'), 'D83 허브에서 효과음 불러옴');
    ok(/SND\.setOn\(S\.sound\)/.test(hub) && /SND\.play\(2\)/.test(hub) && /SND\.play\(1\)/.test(hub), 'D83 허브 소리 버튼·1·2번 연결');
  }
  const demoP = path.join(dir, '..', 'shinip_demo_complete.html');
  if (fs.existsSync(demoP)) ok(/R01\.sound\.navigate\(encodeURI\(HUB_URL\),32\)/.test(fs.readFileSync(demoP, 'utf8')), 'D83 데모 [허브로 돌아가기] 32번');
  const code = ['pages.js', 'intranet.js', 'finale.js'].map((f) => fs.readFileSync(path.join(dir, 'js', f), 'utf8')).join('\n');
  const wired = new Set([...code.matchAll(/R\.sound\.play\((\d+)\)/g)].map((m) => Number(m[1])));
  if (/R\.sound\.play\(ok \? 9 : 10\)/.test(code)) { wired.add(9); wired.add(10); }
  if (/\{ 1: 29, 2: 30, 3: 31 \}/.test(code)) { wired.add(29); wired.add(30); wired.add(31); }
  const gameIds = want.filter((n) => ![0, 1, 2, 32].includes(n));
  const missing = gameIds.filter((n) => !wired.has(n));
  ok(missing.length === 0, 'D83·D86 게임 효과음 26개 모두 연결 ' + missing.join(','));
  // D86: 0 타이핑은 안내 페이지, 11 넘기기는 래미 대화창 두 곳(조사 중·인트라넷)에만
  const noticeP = path.join(dir, '..', 'first-launch-notice-terminal.html');
  if (fs.existsSync(noticeP)) { const nt = fs.readFileSync(noticeP, 'utf8'); ok(/SND\.tryPlay\('0'/.test(nt) && /function press\(\) \{ stopTyping\(\);/.test(nt), 'D86 안내 타이핑: 재생, 누르면 즉시 정지'); }
  ok((code.match(/onAdvance: \(\) => R\.sound\.play\(11\)/g) || []).length === 2, 'D86 래미 대화창 두 곳에만 11번');
  const ui = fs.readFileSync(path.join(dir, 'js', 'ui.js'), 'utf8');
  ok(/if \(!R\.sound\) R\.sound = \{/.test(ui), 'D86 효과음 모듈이 없어도 게임 진행 (빈 자리)');
}

// D85 06-D/E 화면 표시명·문서 제목에 "플레이어" 없음 (게임 화면에는 플레이어라는 말을 쓰지 않는다)
ok(R.CLUES.every((c) => !/플레이어/.test(c.name)), 'D85 자료 표시명에 플레이어 없음');
ok(L.clue('06DE').name === '계정 이력 및 시스템 감사 로그', 'D85 06-D/E 표시명');
{
  const clueDir = path.join(dir, 'assets', 'clue');
  const bad = fs.readdirSync(clueDir).filter((f) => f.endsWith('.html') && /플레이어/.test(fs.readFileSync(path.join(clueDir, f), 'utf8')));
  ok(bad.length === 0, 'D85 자료 문서에 플레이어 없음 ' + bad.join(','));
}

// D87 잠금 표시, 26번이 노이즈와 함께 끝남
{
  const pg = fs.readFileSync(path.join(dir, 'js', 'pages.js'), 'utf8');
  const css = fs.readFileSync(path.join(dir, 'css', 'base.css'), 'utf8');
  ok(/const locked = \(sp\) => !L\.itemShown\(s, sp\.item\)/.test(pg) && /lockMark\('hot-lock'\)/.test(pg) && /lockMark\('plan-lock'\)/.test(pg), 'D87 열 수 없는 오브젝트에 잠금 표시 (도면·목록)');
  ok(/\.hot\.locked::after\{display:none\}/.test(css), 'D87 잠긴 오브젝트는 가운데 점 대신 잠금');
  // 1차 수색에서 잠기는 오브젝트 = 업무 자료 캐비닛, 보안 시스템 단말, 서버 랙, 자료 캐비닛, 공용 테이블
  const s1 = L.recompute(L.newState()); s1.page = '03';
  const lockedNow = Object.values(R.HOTSPOTS).flat().filter((sp) => ['archive', 'control', 'living'].some((p) => sp.id.startsWith(p)) && !L.itemShown(s1, sp.item)).map((sp) => sp.name);
  ok(JSON.stringify(lockedNow) === JSON.stringify(['업무 자료 캐비닛', '보안 시스템 단말', '서버 랙', '자료 캐비닛', '공용 테이블']), 'D87 1차 수색 잠금 대상 ' + lockedNow.join(','));
  const life = Number((css.match(/\.glitch-over\{[^}]*animation:glitchLife ([\d.]+)s/) || [])[1]);
  const c26 = R.SFX[26];
  ok(c26.clip && !c26.delay && Math.abs(c26.clip.hold + c26.clip.fade - life) < 0.01, 'D87 26번이 노이즈(' + life + 's)와 함께 끝남');
}

console.log(`pass ${pass} / fail ${fail}`);
process.exit(fail ? 1 : 0);
