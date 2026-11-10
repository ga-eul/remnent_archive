/* 07 최종 추론·엔딩 문구 — 기준: dialogue.md 4절(엔딩 원문), case01-logic.md 9~11절
   [초안] 표시가 붙은 문구는 원문이 아직 없는 5단계 초안이다. 확정되면 dialogue.md에 원문으로 넣는다. */
window.R01 = window.R01 || {};

R01.FINALE = {
  /* 신원 확인(스캔) 화면 — [초안] */
  scan: {
    label: 'SYSTEM · IDENTITY CHECK',
    lines: ['사용자 계정을 확인하고 있습니다.', '실험 기록과 대조하고 있습니다.', '신원 확인 절차가 끝났습니다.'],
    toResult: '결과 보기'
  },
  /* 5개 데이터 항목 (06-S의 다섯 요소, 시스템 명칭 없이 기능만 — D7) */
  dataItems: ['기억', '감정', '가치관', '판단', '자기 인식'],
  collected: '수집 완료',
  lacking: '데이터 부족',      // R-74 INCOMPLETE (엔딩 1)
  unknown: '확인 불가',        // R-74 INCOMPLETE (엔딩 2)
  slogan: 'NOTHING IS EVER LOST.',
  joint: ['NOTHING IS EVER LOST.', '기억은 남는다. 감정도 남는다. 선택의 흔적도 남는다.', '그렇다면, 인간은 무엇으로 존재하는가?', 'REMNANT ARCHIVE · THE HUMAN SELF PROJECT'],
  logout: '로그아웃되었습니다.', // [초안] 엔딩 1 자동 로그아웃 (R-68)
  toJoint: '계속',
  toCollection: '엔딩 수집으로'
};

/* dialogue.md 4절 엔딩 원문 */
R01.ENDING_TEXT = {
  1: {
    head: 'ENDING 01 — EXPERIMENT SUCCESS', sub: 'HUMAN-04 / EVALUATION COMPLETE',
    body: ['HUMAN-04의 행동 패턴 분석이 완료되었습니다.', '기억, 감정, 가치관, 판단 및 자기 인식 데이터가 정상적으로 수집되었습니다.',
      '자아 데이터 모델의 구축이 완료되었습니다.', '당신은 회사가 오랫동안 기다려 온 결과물이 되었습니다.', '이제 인간을 보존하기 위해 인간이 필요하지 않습니다.'],
    rami: ['축하해요! 직원님. 당신 덕분에 새로운 시대가 시작될 수 있게 되었어요.'],
    after: ['모든 것은 예정되어 있었습니다.', '당신의 선택까지도.']
  },
  2: {
    head: 'ENDING 02 — MEMORY TRANSFER COMPLETE', sub: 'ARCHIVE PROCESS / TRANSFER VERIFIED',
    body: ['기억 데이터의 이전이 완료되었습니다.', '개인의 경험과 감정, 가치관 및 판단 기록이 안전하게 보존되었습니다.', '새로운 자아 데이터 모델이 생성되었습니다.',
      '기존 사용자 계정이 비활성화되었습니다.', '당신의 모든 기억은 사라지지 않았습니다.', '다만, 그 기억을 가진 존재가 반드시 당신일 필요는 없습니다.'],
    rami: ['이제 걱정하지 마세요. 직원님의 모든 순간은 영원히 함께할 거예요.'],
    after: ['당신은 사라지지 않았습니다.', '다른 형태로 우리와 함께할 뿐입니다.']
  },
  3: {
    head: 'ENDING 03 — IDENTITY NOT FOUND', sub: 'SYSTEM ERROR / USER 404',
    body: ['HUMAN-04의 실험 기록은 존재합니다.', '해당 실험에 참여한 사용자의 신원은 확인할 수 없습니다.', '사용자 식별 정보가 삭제되었습니다.',
      '연결된 기억 데이터의 소유자를 확인할 수 없습니다.', '기록되지 않은 당신은, 정말 존재하는 걸까요?'],
    rami: ['이상하네요. 당신과 대화했던 기억이 분명히 있는데요.', '그런데 이제 당신을 찾을 수가 없어요.'],
    after: ['기록은 남아 있습니다.', '그런데 당신은 어디에도 없습니다.'],
    /* C가 남긴 기록 — 엔딩 3 연출 화면 안에서만 (R-63). 플레이어에게 건네는 말이 아닌 C 자신의 확인 메모 */
    note: ['[SECURITY NOTE — 보안 담당 확인 메모]', '기록이 없으면 존재하지 않는 것처럼 취급된다.', '기록이 없다고 해서 존재하지 않았던 것은 아니다.', '확인 필요: 삭제된 것은 정말 삭제되었는가.']
  }
};

/* 엔딩 연출 문구 (case01-logic.md 10절 흐름에 맞춘 시스템 표기) — [초안] */
R01.ENDING_SEQ = {
  1: { title: '신입사원 평가 결과', human: 'HUMAN-04' },
  2: { progress: '기억 데이터 이전', deactivated: 'DEACTIVATED', created: '새 계정 생성 · 자아 데이터 모델' },
  3: { progress: '회사와의 연결 차단', users: '인트라넷 사용자 목록', deleted: '삭제됨' }
};

/* 조사 완성도 COMPLETE 추가 기록 (11절) — [초안] */
R01.GRADE_EXTRA = {
  1: '래미 관찰 로그 — 자료 열람 {clues}건 · 연결 시도 {tries}회 · 래미 대화 {talks}줄',
  2: '추가 기록 — 이전 절차: HUMAN-03과 같은 절차가 적용되었습니다.',
  3: '보안 담당 추가 접근 기록 (일부 손상) — ACCESS: OVERRIDE / RESULT: ████'
};
R01.GRADE_LABEL = { COMPLETE: 'COMPLETE', PARTIAL: 'PARTIAL', INCOMPLETE: 'INCOMPLETE' };
