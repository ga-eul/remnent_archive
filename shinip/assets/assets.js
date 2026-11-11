/* 에셋 목록 (prd.md 1절 원칙 3: 화면별 이미지 경로를 이 파일 하나에 모은다)
   코드는 이 목록의 이름만 참조한다. 교체는 같은 파일명으로 덮어쓰거나 여기 한 줄만 고친다.
   원본은 저장소의 `인트라넷 UI/` 폴더에 있고, 쓰는 것만 shinip/assets/img/ 로 복사해 영문 이름으로 둔다. */
window.R01 = window.R01 || {};
R01.ASSETS = {
  openingNotice: 'assets/img/opening-frame.png',   // 인트라넷 UI/오프닝용.png (글자 없는 틀)
  monologueBg: 'assets/img/monologue-bg.jpg',      // 인트라넷 UI/독백 페이지.jpg
  dialogueFrame: 'assets/img/dialogue-frame.png',  // 인트라넷 UI/기본 대화창.png
  rami: 'assets/img/rami.jpg',                     // 인트라넷 UI/래미.jpg (래미 AI 창 머리·대화창 초상)
  ramiBasic: 'assets/img/rami-basic.png',          // 인트라넷 UI/래미/래미_기본.png (대화창 기본 표정)
  ramiMeaningful: 'assets/img/rami-meaningful.png', // 인트라넷 UI/래미/래미_의미심장.png (‘다른 선택을 하시네요’)
  ramiRealize: 'assets/img/rami-realize.png',      // 인트라넷 UI/래미/래미_깨달음.png (제한구역)
  ramiChat: 'assets/img/rami-chat.png',            // 인트라넷 UI/래미_대화창/래미_대화창_1.png (AI 창 위로 내민 래미만 잘라 씀)
  intranetHero: 'assets/img/intranet-hero.jpg',    // 인트로 허브의 회사 건물 사진 (허브 파일 안 EMBEDDED_INTRO에서 꺼냄)
  noiseGlitch: 'assets/img/noise-glitch.jpg',      // 수정 요청/노이즈 연출.jpg (1600px로 줄임). 3차 수색 진입 노이즈
  ending1Bg: 'assets/img/ending1-bg.jpg'           // 엔딩/엔딩1_복사.jpg (1600px로 줄임). 엔딩 1 연출 화면 배경
  // 인트라넷 UI/오프닝.jpg(아이콘 있는 바탕화면)는 D35로 쓰지 않는다. 배경은 같은 남색을 CSS로 칠한다
};

/* 단서 자료 에셋 (D54): 원본은 저장소의 `제작_에셋/` 폴더, 쓰는 것만 shinip/assets/clue/ 로 복사한다.
   키는 data/clues.js의 key. 목록에 없는 단서는 자료 창에 임시 화면이 나온다.
   kind: doc = HTML 문서(iframe) / image = 문서 이미지 + HTML 글자 덧씌우기(patches)
         cctv = CCTV 이미지·영상 + 시각 표시 / overlay = 실물 이미지 위에 HTML 본문 / pending = 에셋 준비 중
   patches.box: 이미지 안 위치 [왼쪽, 위, 너비, 높이] (%). 이미지에 그려진 글자를 설정에 맞게 덮는다 */
R01.CLUE_ASSETS = {
  // 03-A: 이미지의 A 이름(엘리너 쇼 / Eleanor Shaw)을 엘리넛 쇼 / Elliot Shaw로 덮는다 (D49·D54)
  '03A': { kind: 'image', img: 'assets/clue/clue-03a.png', ratio: '1671 / 941',
    patches: [{ box: [19.6, 47, 18.1, 8.3], bg: '#0a1113', lines: ['엘리넛 쇼', 'Elliot Shaw'] }] },
  // 03-B: 사건일 4XXX.01.24 16:40 (world.md 정답 타임라인). 영상 8초 동안 16:39:30 → 16:41:30
  '03B': { kind: 'cctv', img: 'assets/clue/clue-03b.jpg', video: 'assets/clue/clue-03b.mp4', ratio: '1671 / 941',
    cam: 'CAM 02', date: '4XXX.01.24', still: ['16:39:12', '16:40:07', '16:41:03'], from: '16:39:30', to: '16:41:30' },
  '03C': { kind: 'overlay', img: 'assets/clue/clue-03c.png', html: 'assets/clue/clue-03c.html', ratio: '1536 / 1024' },
  '05A': { kind: 'doc', html: 'assets/clue/clue-05a.html' },
  '05C': { kind: 'pending' },                                   // 에셋 미제작
  '05D': { kind: 'doc', html: 'assets/clue/clue-05d.html', fallback: 'assets/clue/clue-05d.png' }, // png는 대체용만
  // 05-B 묶음 (R-18a): 복구된 영상은 손상된 CCTV 연출. 화면에 SUBJECT 등 대상자 표기 금지 (D13·D14). 영상 약 4초.
  // 영상에는 ‘BLD.A / LABORATORY’와 ‘4XXX-01-24 16:40:23’이 고정으로 찍혀 있어, 정지 이미지에만 같은 표기를 올리고
  // 재생 중에는 덧씌운 표시를 숨긴다 (hudOnVideo: false)
  '05B_VHS': { kind: 'cctv', vhs: true, hudOnVideo: false, img: 'assets/clue/clue-05b-vhs.png', video: 'assets/clue/clue-05b-vhs.mp4', ratio: '1671 / 941',
    rec: 'BLD.A / LABORATORY', cam: '', date: '4XXX-01-24', still: ['16:40:23'], from: '16:40:23', to: '16:40:23' },
  '05B_PERSONNEL': { kind: 'doc', html: 'assets/clue/clue-05b-personnel.html' },
  '06DE': { kind: 'doc', html: 'assets/clue/clue-06de.html' },  // 제작_에셋/06-DE.html은 같은 내용의 중복 파일이라 쓰지 않음
  '06A': { kind: 'doc', html: 'assets/clue/clue-06a.html' },
  '06B': { kind: 'doc', html: 'assets/clue/clue-06b.html' }
};

/* 심문 화면 직원 사진: 원본은 저장소의 `직원/엘리넛_쇼.png`·`마거릿_베일.png`·`피터_하그리브스.png`.
   원형 칸에 맞게 머리·어깨 중심으로 정사각형(480px, 흰 바탕)으로 잘라 둔 것을 쓴다 */
R01.STAFF_PHOTOS = {
  A: 'assets/img/staff-a.jpg',
  B: 'assets/img/staff-b.jpg',
  C: 'assets/img/staff-c.jpg'
};

/* 사원증 사진 4종: 원본은 저장소의 `아바타/아바타-01~04.jpg`.
   원형 칸에 맞게 머리·어깨 중심으로 정사각형(480px)으로 잘라 둔 것을 쓴다. tone은 이미지가 뜨기 전 바탕색 */
R01.AVATARS = [
  { id: 0, tone: '#2c4a63', src: 'assets/img/avatar-01.jpg' },
  { id: 1, tone: '#3b4f3f', src: 'assets/img/avatar-02.jpg' },
  { id: 2, tone: '#53405e', src: 'assets/img/avatar-03.jpg' },
  { id: 3, tone: '#5e4a35', src: 'assets/img/avatar-04.jpg' }
];
