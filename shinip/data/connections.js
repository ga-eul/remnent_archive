/* 단서 연결표 — 기준: case 01/case01-logic.md 6절, 11절 CONNECTIONS
   card: NEW 카드 이름 (D25·D32). C13은 일반 NEW 카드가 아니므로 card 없음 (D25·D28)
   result: 성공 시 기록되는 추론 결과 문장
   C08은 05-D 열람 상태에 따라 문장이 단계적으로 갱신된다 (D17) */
window.R01 = window.R01 || {};
R01.CONNECTIONS = {
  C01: { pair: ['03A', '03B'], card: '명부·CCTV 대조 기록',
    result: '공식 명부에 없는 제4의 인물이 CCTV에 찍혀 있다' },
  C04: { pair: ['03B', '04A'], card: 'CCTV·진술 대조 기록',
    result: '기록에도 기억에도 없는 사람이 있다' },
  C05: { pair: ['05A', '05C'], card: '업무·실험 기록 대조 기록',
    result: '업무를 기계로 옮기는 연구와 기억을 다루는 실험 사이에는 연관성이 있는 것으로 보인다' },
  C06: { pair: ['05C', '05D'], card: '실험 기록·참가자 자료 대조 기록',
    result: '실험은 대상자를 바꿔 가며 이어져 왔고, HUMAN-03에서 멈췄다' },
  C07: { pair: ['05D', '06B'], card: '참가자 자료·대상자 명단 대조 기록',
    result: '다음 단계 HUMAN-04의 이전 대상자는 나다. 나는 실험 대상이다' },
  C08: { pair: ['05B_VHS', '05B_PERSONNEL'], card: '복구 영상·인사 기록 대조 기록',
    result: 'CCTV와 영상 속 제4의 인물은 실험 중단 후 기록에서 지워진 전임자이다.',
    resultAfter05D: '그 전임자는 HUMAN-03이다.' },
  C10: { pair: ['03B', '06DE'], card: 'CCTV·시스템 로그 대조 기록',
    result: '시스템은 특정 인물(CCTV 속 인물)의 활동을 감지했지만 유효한 직원 계정과 연결하지 못했다' },
  C11: { pair: ['05B_PERSONNEL', '06DE'], card: '인사 기록·시스템 로그 대조 기록',
    result: '삭제된 전임자 계정의 흔적이 기록 삭제 후에도 로그에 남아 있다' },
  C13: { pair: ['06DE', '06G'], c13: true }
};

/* 일반 조합 8개 (NEW 카드, "연결 성공 n"에 세는 대상 — D31) */
R01.NORMAL_CONNECTIONS = ['C01', 'C04', 'C05', 'C06', 'C07', 'C08', 'C10', 'C11'];

/* 조사 완성도 핵심 요소 (11절 GRADE_KEYS) — 'C..'는 연결, 나머지는 자료 key */
R01.GRADE_KEYS = {
  1: ['C05', 'C06', '06S', '06DE'],
  2: ['C05', 'C08', '06S', '06DE'],
  3: ['C01', 'C05', '06S', '05E']
};
