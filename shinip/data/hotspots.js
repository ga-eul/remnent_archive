/* 장소 조사 도면의 클릭 영역 (D73, 규칙 문서 case 01/investigation-map-rules.md)
   도면 이미지는 assets.js의 R01.ASSETS(placeArchive 등), 모두 2172×724 (3:1).
   box: 도면 이미지 기준 [왼쪽, 위, 너비, 높이] (%) — 03-A 덧씌우기(patches.box)와 같은 형식
   item: 그 오브젝트에서 열리는 자료 하나
     { clue: key }              추리 자료 (data/clues.js). 열람 가능 여부는 logic.js clueAvailable (R-16·R-17 등)
     { clue: key, part: id }    한 추리 자료의 하위 부분 (03-A 명부·업무 기록, 03-C 두 수첩). 모두 열람해야 획득
     { note: 'RA-Sxx' }         보조자료 (data/fieldnotes.js). My Archive에 넣지 않는다
   group: 같은 물건 위에 놓인 하위 부분 묶음 (공통 진행 [n/2 확인] 표시, GROUPS)
   side: 작은 오브젝트가 붙어 있을 때 상태 표시를 위 대신 왼쪽(left)·오른쪽(right) 바깥에 둔다
   그림 속 배경 요소(메인 스크린의 두뇌 그래픽 등)는 클릭 영역이 아니다 — 그림만으로 자료를 얻지 않는다 */
window.R01 = window.R01 || {};

/* 하위 부분으로 나눠 열람하는 추리 자료. 새 단서·새 조합 카드가 아니다 (화면 열람 기록만 parts_seen) */
R01.CLUE_PARTS = {
  '03A': [['roster', '직원 명부'], ['worklog', '업무 기록']],
  '03C': [['burgundy', '버건디 수첩'], ['black', '검은 수첩']]
};

R01.HOTSPOTS = {
  archive: [
    { id: 'archive-shelf', name: '직원 명부 서가', box: [4.8, 6.9, 29.3, 38.7], item: { clue: '03A', part: 'roster' } },
    { id: 'archive-return', name: '반납대', box: [6.0, 58.0, 22.8, 31.1], item: { clue: '03A', part: 'worklog' } },
    { id: 'archive-cabinet', name: '업무 자료 캐비닛', box: [41.7, 10.4, 16.8, 33.8], item: { clue: '05A' } },
    { id: 'archive-pc', name: '문서 검색 컴퓨터', box: [69.1, 9.7, 20.9, 35.9], item: { note: 'RA-S02' } },
    { id: 'archive-tray', name: '분류 트레이', box: [70.4, 58.0, 23.7, 30.4], item: { note: 'RA-S01' } }
  ],
  control: [
    { id: 'control-cctv', name: 'CCTV 모니터', box: [5.8, 6.9, 26.5, 37.3], item: { clue: '03B' } },
    { id: 'control-security', name: '보안 시스템 단말', box: [39.8, 8.3, 20.7, 41.4], item: { clue: '05E' } },
    { id: 'control-server', name: '서버 랙', box: [68.8, 6.9, 17.3, 39.4], item: { clue: '05B_VHS' } },
    { id: 'control-cabinet', name: '자료 캐비닛', box: [86.8, 7.6, 8.1, 37.3], item: { clue: '05B_PERSONNEL' } },
    { id: 'control-desk', name: '업무 책상', box: [6.9, 51.8, 22.6, 42.1], item: { note: 'RA-S03' } },
    { id: 'control-tablet', name: '정비대 태블릿', box: [70.7, 55.2, 23.0, 34.5], item: { note: 'RA-S04' } }
  ],
  living: [
    { id: 'living-burgundy', name: '버건디 수첩', box: [27.4, 62.8, 3.1, 23.5], group: '03C', side: 'left', item: { clue: '03C', part: 'burgundy' } },
    { id: 'living-black', name: '검은 수첩', box: [30.5, 62.8, 3.2, 23.5], group: '03C', side: 'right', item: { clue: '03C', part: 'black' } },
    { id: 'living-board', name: '게시판', box: [9.4, 7.6, 19.3, 31.1], item: { note: 'RA-S05' } },
    { id: 'living-locker', name: '사물함', box: [37.3, 4.8, 25.3, 40.7], item: { note: 'RA-S06' } },
    { id: 'living-pantry', name: '탕비대', box: [69.1, 4.1, 26.7, 42.3], item: { note: 'RA-S08' } },
    { id: 'living-table', name: '공용 테이블', box: [69.3, 49.7, 19.8, 42.1], item: { note: 'RA-S07' } }
  ],
  lab: [
    { id: 'lab-console', name: '중앙 분석 콘솔', box: [24.2, 37.3, 41.7, 24.2], item: { clue: '05C' } },
    { id: 'lab-desk', name: '분석 책상 컴퓨터', box: [7.8, 58.0, 17.5, 30.4], item: { clue: '05D' } },
    { id: 'lab-wall', name: '벽면 분석 콘솔', box: [2.5, 7.6, 19.6, 48.1], item: { note: 'RA-S09' } },
    { id: 'lab-chair', name: '실험 의자', box: [80.3, 39.4, 9.0, 36.0], item: { note: 'RA-S10' } },
    { id: 'lab-cart', name: '이동식 카트', box: [69.8, 65.6, 5.1, 22.8], item: { note: 'RA-S11' } }
  ],
  restricted: [
    { id: 'restricted-locker', name: '잠금 보관함', box: [5.5, 6.9, 27.2, 38.0], item: { clue: '06A' } },
    { id: 'restricted-pc', name: '중앙 컴퓨터', box: [39.8, 8.3, 20.3, 39.4], item: { clue: '06B' } },
    { id: 'restricted-server', name: '서버 랙', box: [67.7, 4.1, 28.1, 43.5], item: { clue: '06DE' } },
    { id: 'restricted-glass', name: '유리 덮개 자료대', box: [6.7, 55.2, 17.3, 37.3], item: { clue: '06S' } },
    { id: 'restricted-safe', name: '전자 잠금 보관함', box: [71.1, 56.6, 22.5, 33.1], item: { note: 'RA-S12' } },
    { id: 'restricted-panel', name: '출입문 패널', box: [57.3, 77.3, 3.2, 13.8], item: { note: 'RA-S13' } }
  ]
};

/* 하위 부분 묶음의 공통 진행 표시 위치 (03-C: 소파 옆 탁자 위 두 수첩) */
R01.HOTSPOT_GROUPS = {
  '03C': { name: '소파 옆 탁자', box: [27.4, 62.8, 6.3, 23.5] }
};

/* 아직 열리지 않은 오브젝트를 누르면 아무 문구 없이 눌러 본 기록(spots_checked)만 남긴다 (D75). 열람·획득이 아니다 */
