/* 자료(단서) 목록 — 기준: case 01/case01-logic.md 5절
   화면에 보이는 것은 name(표시명)과 자료 에셋이다. 에셋 경로는 assets/assets.js의 CLUE_ASSETS (D54).
   key: 상태값 이름에 쓰는 짧은 ID (clue_<key>_found)
   type: doc = [문서] 탭, cctv = [CCTV] 탭 (7절)
   place: archive 기록보관실 / control 관제실 / living 생활공간 / lab 업무실험실 / restricted 제한구역
   search: 처음 열람할 수 있는 수색 단계 (1 = 03 수색 1, 2 = 05 수색 2, 3 = 06 수색 3)
   requires: 먼저 열람해야 하는 자료 (R-17)
   bundle: 화면에서 한 묶음으로 함께 열람 (R-18a) */
window.R01 = window.R01 || {};
R01.CLUES = [
  { id: '03-A', key: '03A', name: '직원 명부 및 업무 기록', type: 'doc', place: 'archive', search: 1 },
  { id: '03-B', key: '03B', name: 'CCTV 기록', type: 'cctv', place: 'control', search: 1 },
  { id: '03-C', key: '03C', name: '생활공간 일기', type: 'doc', place: 'living', search: 1 },
  { id: '04-A', key: '04A', name: '직원 면담 종합 기록', type: 'doc', source: 'interview' },
  { id: '05-A', key: '05A', name: '인간과 기계의 업무 비교', type: 'doc', place: 'archive', search: 2 },
  { id: '05-B-VHS', key: '05B_VHS', name: '복구된 영상 기록', type: 'cctv', place: 'control', search: 2, bundle: '05-B' },
  { id: '05-B-PERSONNEL', key: '05B_PERSONNEL', name: '삭제된 직원의 원본 인사 기록', type: 'doc', place: 'control', search: 2, bundle: '05-B' },
  { id: '05-C', key: '05C', name: '기억 추출 실험 기록', type: 'doc', place: 'lab', search: 2 },
  { id: '05-D', key: '05D', name: '이전 실험 참가자 자료', type: 'doc', place: 'lab', search: 2, requires: ['05C'] },
  { id: '05-E', key: '05E', name: '보안 시스템 예외 접근 기록', type: 'doc', place: 'control', search: 2 },
  { id: '06-A', key: '06A', name: 'HUMAN-04 통합 실험 보고서', type: 'doc', place: 'restricted', search: 3 },
  { id: '06-B', key: '06B', name: '기억 데이터 이전 명령 및 대상자 명단', type: 'doc', place: 'restricted', search: 3 },
  { id: '06-D/E', key: '06DE', name: '플레이어 계정 이력 및 시스템 감사 로그', type: 'doc', place: 'restricted', search: 3 },
  { id: '06-S', key: '06S', name: 'Memory data 연구자료', type: 'doc', place: 'restricted', search: 3, optional: true },
  { id: '06-G', key: '06G', name: '사용자 식별 실패 보고서', type: 'doc', source: 'system' }
];

R01.BUNDLES = { '05-B': '복구된 기록 자료' };

/* 수색 화면의 조사 지점과 자료 창 요약 — [초안]
   spot: 장소 화면에서 누르는 조사 지점 이름 (자료 표시명이 아니라 물건·장비 이름, R-32)
   summary: 자료 창의 기록 요약 — 어떤 기록인지만 한 줄로 (내용·단서는 넣지 않는다. 실제 내용은 자료 에셋으로).
   에셋이 아직 없는 자료는 자료 창에 임시 화면이 나온다 (D54) */
R01.SPOTS = {
  '03A': { spot: '직원 명부 서가', summary: ['공식 직원 명부와 업무 기록.'] },
  '03B': { spot: 'CCTV 모니터', summary: ['관제실 CCTV에 남은 녹화 기록.'] },
  '03C': { spot: '책상 서랍', summary: ['생활공간에서 나온 두 권의 일기.'] },
  '05A': { spot: '업무 자료 캐비닛', summary: ['사람의 업무와 기계의 업무를 비교한 자료.'] },
  '05B_VHS': { spot: '기록 복구 장비', summary: ['손상된 CCTV 프레임을 복구한 영상.'] },
  '05B_PERSONNEL': { spot: '기록 복구 장비', summary: ['삭제된 직원의 원본 인사 기록.'] },
  '05C': { spot: '실험 기록 단말', summary: ['기억 추출과 백업에 관한 실험 기록.'] },
  '05D': { spot: '참가자 자료 보관함', summary: ['이전 실험 참가자들의 기록.'] },
  '05E': { spot: '보안 시스템 단말', summary: ['보안 시스템에 남은 예외 접근 기록.'] },
  '06A': { spot: '보고서 보관 단말', summary: ['HUMAN-04 실험에 관한 통합 보고서.'] },
  '06B': { spot: '명령 문서 서랍', summary: ['기억 데이터 이전 명령과 대상자 명단.'] },
  '06DE': { spot: '계정 관리 서버', summary: ['계정 이력과 시스템 감사 로그.'] },
  '06S': { spot: '연구 자료 아카이브', summary: ['기억 데이터에 관한 연구 자료.'] },
  // 수색이 아닌 곳에서 생기는 자료 (My Archive에서 다시 볼 때만 쓰임)
  '04A': { summary: ['A · B · C 세 직원 면담을 정리한 기록.'] },
  '06G': { summary: ['계정과 실험 기록은 연결되어 있지만, 실제 사용자 신원은 확인할 수 없음'] } // R-07 본문
};
R01.SOURCE_LABEL = { interview: '심문 기록', system: '시스템 자동 생성' };

/* 고정 장소 5곳 (R-01) */
R01.PLACES = [
  { id: 'archive', name: '기록보관실' },
  { id: 'control', name: '관제실' },
  { id: 'living', name: '생활공간' },
  { id: 'lab', name: '업무실험실' },
  { id: 'restricted', name: '제한구역' }
];
