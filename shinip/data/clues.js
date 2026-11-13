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
  // 05-B-PERSONNEL: 화면 표시명은 ‘인사·업무 기록’ (D62, R-32). 개발자 내부 이름은 ‘삭제된 직원의 원본 인사 기록’
  { id: '05-B-PERSONNEL', key: '05B_PERSONNEL', name: '인사·업무 기록', type: 'doc', place: 'control', search: 2, bundle: '05-B' },
  { id: '05-C', key: '05C', name: '기억 추출 실험 기록', type: 'doc', place: 'lab', search: 2 },
  { id: '05-D', key: '05D', name: '이전 실험 참가자 자료', type: 'doc', place: 'lab', search: 2, requires: ['05C'] },
  { id: '05-E', key: '05E', name: '보안 시스템 예외 접근 기록', type: 'doc', place: 'control', search: 2 },
  { id: '06-A', key: '06A', name: 'HUMAN-04 통합 실험 보고서', type: 'doc', place: 'restricted', search: 3 },
  { id: '06-B', key: '06B', name: '기억 데이터 이전 명령 및 대상자 명단', type: 'doc', place: 'restricted', search: 3 },
  { id: '06-D/E', key: '06DE', name: '플레이어 계정 이력 및 시스템 감사 로그', type: 'doc', place: 'restricted', search: 3 },
  { id: '06-S', key: '06S', name: 'Memory data 연구자료', type: 'doc', place: 'restricted', search: 3, optional: true },
  // 06-G: 화면 표시명은 ‘신원 확인 결과 보고서’ (D72, R-07). 개발자 내부 이름은 ‘사용자 식별 실패 보고서’
  { id: '06-G', key: '06G', name: '신원 확인 결과 보고서', type: 'doc', source: 'system' }
];

R01.BUNDLES = { '05-B': '복구된 기록 자료' };

/* 수색 화면의 조사 지점과 자료 창 요약 — [초안]
   spot: 장소 화면에서 누르는 조사 지점 이름 (자료 표시명이 아니라 물건·장비 이름, R-32)
   summary: 자료 창의 기록 요약 — 플레이어가 자료를 처음 보고 느끼는 한두 문장 (D68). 결론·정답은 넣지 않는다. 실제 내용은 자료 에셋으로.
   에셋이 아직 없는 자료는 자료 창에 임시 화면이 나온다 (D54) */
R01.SPOTS = {
  '03A': { spot: '직원 명부 서가', summary: ['공식 직원 명부와 업무 기록이다. 특별히 눈에 띄는 내용은 없어 보인다.'] },
  '03B': { spot: 'CCTV 모니터', summary: ['관제실에 보관된 CCTV 녹화 기록이다. 화면이 어두워 자세하게 확인하기 어렵다.'] },
  '03C': { spot: '책상', summary: ['책상 위에서 발견한 두 권의 일기. 기록된 내용은 그리 많지 않아 보인다.'] },
  '05A': { spot: '업무 자료 캐비닛', summary: ['사람과 기계의 업무 처리 결과를 비교한 자료다. 기억을 보관하는 회사에서 왜 이런 실험을 하는 걸까?'] },
  '05B_VHS': { spot: '기록 복구 장비', summary: ['손상된 CCTV 파일 중 하나를 복구한 영상이다. 복구 후에도 화면 곳곳에 심한 노이즈가 남아 있다.'] },
  '05B_PERSONNEL': { spot: '기록 복구 장비', summary: ['한 직원의 인사 정보와 업무 내역이 담긴 자료다. 일부 기록이 정상적으로 남아 있지 않은 것 같다.'] },
  '05C': { spot: '실험 기록 단말', summary: ['기억 추출과 백업 과정을 정리한 실험 기록이다. 여러 차례에 걸쳐 진행된 것으로 보인다.'] },
  '05D': { spot: '참가자 자료 보관함', summary: ['이전 실험 참가자들의 등록 내역이다. 각자의 실험이 어떻게 끝났는지는 자세히 알 수 없다.'] },
  '05E': { spot: '보안 시스템 단말', summary: ['보안 시스템에 남겨진 예외 접근 기록이다. 누가, 무엇을 위해 접근했는지는 알 수 없다.'] },
  '06A': { spot: '보고서 보관 단말', summary: ['HUMAN-04에 관한 실험 보고서다. 일부 내용은 열람할 수 없도록 가려져 있다.'] },
  '06B': { spot: '명령 문서 서랍', summary: ['기억 데이터 이전에 관한 지시와 대상자 명단이 담긴 문서다.'] },
  '06DE': { spot: '계정 관리 서버', summary: ['계정 이력과 시스템에 남은 기록을 정리한 자료다. 평범한 접속 기록처럼 보이지만, 조금 더 살펴볼 필요가 있겠다.'] },
  '06S': { spot: '연구 자료 아카이브', summary: ['기억 데이터를 어떤 기준으로 분류하고 관리하는지 정리한 연구 자료다.'] },
  // 수색이 아닌 곳에서 생기는 자료 (My Archive에서 다시 볼 때만 쓰임)
  '04A': { summary: ['세 직원과의 면담 내용을 정리한 기록이다. 같은 상황을 두고도 직원마다 조금씩 다른 답변을 남겼다.'] },
  '06G': { summary: ['시스템이 자동으로 생성한 신원 확인 보고서다. 계정과 실제 사용자의 정보가 제대로 확인되지 않은 모양이다.'] } // 본문(R-07)은 자료 에셋 clue-06g.html
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
