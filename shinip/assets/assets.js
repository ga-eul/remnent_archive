/* 에셋 목록 (prd.md 1절 원칙 3: 화면별 이미지 경로를 이 파일 하나에 모은다)
   코드는 이 목록의 이름만 참조한다. 교체는 같은 파일명으로 덮어쓰거나 여기 한 줄만 고친다.
   원본은 저장소의 `인트라넷 UI/` 폴더에 있고, 쓰는 것만 shinip/assets/img/ 로 복사해 영문 이름으로 둔다.
   아바타 사진은 아직 에셋이 없어 코드로 그린 임시 실루엣을 쓴다 (prd.md 1절 원칙 4). */
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
  noiseGlitch: 'assets/img/noise-glitch.jpg'       // 수정 요청/노이즈 연출.jpg (1600px로 줄임). 3차 수색 진입 노이즈
  // 인트라넷 UI/오프닝.jpg(아이콘 있는 바탕화면)는 D35로 쓰지 않는다. 배경은 같은 남색을 CSS로 칠한다
};

/* 임시 아바타 4종 (사진 에셋이 생기면 이 목록의 src로 교체) */
R01.AVATARS = [
  { id: 0, tone: '#2c4a63' },
  { id: 1, tone: '#3b4f3f' },
  { id: 2, tone: '#53405e' },
  { id: 3, tone: '#5e4a35' }
];
