// 진행 규칙(logic.js)·저장(store.js)을 브라우저 없이 검사한다. 사용: node tests/logic.test.js (저장소 루트에서)
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = process.argv[2] || path.join(__dirname, '..', 'shinip');
const mem = {};
const ctx = { window: {}, console,
  localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } } };
ctx.window = ctx; vm.createContext(ctx);
['data/clues.js', 'data/connections.js', 'data/text.js', 'data/intranet.js', 'data/finale.js', 'assets/assets.js', 'js/logic.js', 'js/store.js']
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
  if (opts.c08Early) { L.openFromSearch(s, '05B_VHS'); ok(s.clue_05B_PERSONNEL_found, 'R-18a 05-B 묶음 열람');
    ok(L.tryConnect(s, '05B_VHS', '05B_PERSONNEL').result === 'success' && !s.c08_human03_confirmed, 'C08 05-D 전 성공, 갱신 전'); }
  ok(!s.restricted_unlocked, '05-D 전 제한구역 닫힘');
  L.openFromSearch(s, '05D');
  if (opts.c08Early) ok(s.c08_human03_confirmed, 'D17 05-D 열람 후 C08 갱신');
  ok(s.restricted_unlocked, 'R-20 필수 7개 → 제한구역');
  if (!opts.c08Early) L.openFromSearch(s, '05B_VHS');
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

// 금지 문자열 (CLAUDE.md 절대 금지)
const all = fs.readdirSync(dir, { recursive: true }).filter((f) => /\.(js|html|css)$/.test(f))
  .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
ok(!/Edward|에드워드|밀러|SELF ARCHIVE SYSTEM/i.test(all), '금지 문자열 없음');
ok(!/실험용|TEMP/.test(all.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace('계정 유형: TEMP', '')
  .replace('<th scope="col">계정 유형</th>', '').replace('<code class="audit-type">TEMP</code>', '')), 'D13·D24 화면 문구에 실험용·TEMP 없음 (06-D/E의 ‘계정 유형: TEMP’만 허용, 주석 제외)');

console.log(`pass ${pass} / fail ${fail}`);
process.exit(fail ? 1 : 0);
