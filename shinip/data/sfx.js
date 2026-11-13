/* 효과음 중앙 설정 (D83, 1차 음량 보정)
   - 원본: 저장소 루트 `효과음_26개+후보/` (Git에 넣지 않음, 수정·삭제하지 않음). 게임용 사본: `shinip/assets/sfx/` (같은 MP3는 한 번만 복사해 공유)
   - 측정값(peak·rms, dBFS): 저장소 루트 `CASE01_효과음_음량측정.csv` (Git에 넣지 않음)를 옮겨 적었다. 테스트가 클리핑 여유를 이 값으로 검사한다
   - vol: 이벤트별 재생 볼륨(1 = 원본 그대로). 1보다 크면 Web Audio GainNode로 증폭한다(file://에서 HTMLAudio로 재생할 때는 1에서 멈춘다)
   - gap: 같은 효과음을 다시 울리기까지의 최소 간격(ms) / loop: 반복 재생 / clip: 앞부분만 재생(hold초 유지 → fade초 페이드아웃 → 정지·처음으로)
   - 볼륨은 측정값 기준 1차 보정이다. 실제 청감 균형은 브라우저에서 들어 보고 다시 맞춘다 */
window.R01 = window.R01 || {};
R01.SFX_VER = '1';

/* 효과음 묶음 마스터 볼륨 / BGM 묶음 볼륨(아직 BGM 없음, 자리만) / 출력단 리미터 */
R01.SFX_MIX = { master: 0.8, bgm: 0.5, limiter: { threshold: -3, knee: 0, ratio: 20, attack: 0.003, release: 0.25 } };

/* 게임용 파일 → 원본 파일 (같은 내용의 원본이 여러 개면 모두 적는다) */
R01.SFX_FILES = {
  'hub-click.mp3':           { src: ['1,32.mp3'], peak: -11.8, rms: -41.0, sec: 0.14 },
  'hub-menu.mp3':            { src: ['2-메인허브-메뉴전환.mp3'], peak: -6.0, rms: -24.7, sec: 118.08 },
  'select-beep.mp3':         { src: ['3-입사화면-사원증 이미지.mp3', '8-보안인증-보안키입력.mp3'], peak: -17.0, rms: -36.7, sec: 1.03 },
  'idcard-issue.mp3':        { src: ['4-입사화면-이름입력후 발급버튼.mp3'], peak: -5.1, rms: -31.2, sec: 0.48 },
  'intranet-tab.mp3':        { src: ['5-인트라넷-탭전환.mp3'], peak: -20.8, rms: -43.0, sec: 0.94 },
  'messenger-alert.mp3':     { src: ['6-인트라넷-메신저알림.mp3'], peak: -15.7, rms: -36.6, sec: 1.75 },
  'message-open.mp3':        { src: ['7-인트라넷-메시지열람.mp3'], peak: -0.5, rms: -26.2, sec: 1.03 },
  'auth-success.mp3':        { src: ['9-보안인증-인증성공.mp3'], peak: -22.1, rms: -41.1, sec: 1.03 },
  'fail-beep.mp3':           { src: ['10-보안인증-인증실패.mp3', '18-cctv-재생실패.mp3'], peak: -16.3, rms: -36.6, sec: 1.03 },
  'system-connect.mp3':      { src: ['12-제한시스템-접속시작.mp3'], peak: -2.7, rms: -21.3, sec: 1.57 },
  'clue-open.mp3':           { src: ['14-장소수색-단서열람.mp3'], peak: -11.2, rms: -37.0, sec: 0.96 },
  'cctv-play.mp3':           { src: ['16-cctv-영상재생.mp3'], peak: -6.6, rms: -34.9, sec: 0.41 },
  'cctv-noise.mp3':          { src: ['17-cctv-영상노이즈.mp3'], peak: -6.0, rms: -21.1, sec: 18.26 },
  'question-select.mp3':     { src: ['19-직원면담-질문선택.mp3'], peak: -1.0, rms: -28.8, sec: 0.13 },
  'record-new.mp3':          { src: ['20,25.mp3'], peak: -17.6, rms: -36.8, sec: 1.03 },
  'card-place.mp3':          { src: ['22-my arhive-카드배치.mp3'], peak: -21.6, rms: -46.4, sec: 0.74 },
  'combo-fail.mp3':          { src: ['23-my arhive-조합실패.mp3'], peak: -15.8, rms: -29.9, sec: 0.53 },
  'combo-success.mp3':       { src: ['24-my arhive-조합성공.mp3'], peak: -14.7, rms: -38.3, sec: 1.03 },
  'rami-warning-glitch.mp3': { src: ['26-제한구역-래미의접근경고.mp3'], peak: 1.4, rms: -13.8, sec: 4.03 },
  'analysis-complete.mp3':   { src: ['27-최종추론-분석완료.mp3'], peak: -12.2, rms: -30.2, sec: 0.65 },
  'final-confirm.mp3':       { src: ['28-최종추론-최종선택확인.mp3', '29-엔딩1.mp3'], peak: -17.8, rms: -34.4, sec: 1.03 },
  'ending2.mp3':             { src: ['30-엔딩2.mp3'], peak: -23.4, rms: -36.3, sec: 1.63 },   // 후보 `30-엔딩2(후보).mp3`는 쓰지 않고 원본 폴더에 보존
  'ending3.mp3':             { src: ['31-엔딩3.mp3'], peak: -19.8, rms: -36.1, sec: 0.74 }
};

/* 이벤트 번호 → 파일·볼륨. at: 재생 위치 (11·13·15·21번은 없음, 번호 없는 후보 3개는 배치하지 않음) */
R01.SFX = {
  1:  { file: 'hub-click.mp3', vol: 1.00, gap: 60, at: '메인 허브 버튼 클릭' },
  2:  { file: 'hub-menu.mp3', vol: 0.20, gap: 0, clip: { hold: 3, fade: 1 }, at: '메인 허브 메뉴 전환(↑↓ 이동·마우스로 다른 메뉴에 올림). 118초 원본 중 앞 3초 + 1초 페이드' },
  3:  { file: 'select-beep.mp3', vol: 1.00, gap: 80, at: '입사 화면 사원증 사진 선택' },
  4:  { file: 'idcard-issue.mp3', vol: 0.35, gap: 300, at: '입사 화면 [발급]' },
  5:  { file: 'intranet-tab.mp3', vol: 1.80, gap: 80, at: '인트라넷 상단 탭 전환' },                  // 원본이 작아 +5.1dB 증폭 (피크 -15.7dBFS)
  6:  { file: 'messenger-alert.mp3', vol: 1.00, gap: 1000, at: '메신저 알림(래미 소개가 끝나 RA-H 메시지 점이 켜질 때)' },
  7:  { file: 'message-open.mp3', vol: 0.25, gap: 150, at: '메신저 대화방 열기' },
  8:  { file: 'select-beep.mp3', vol: 1.00, gap: 80, at: '보안 교육 자료 가로 답 맞힘(보안키 입력)' },
  9:  { file: 'auth-success.mp3', vol: 1.40, gap: 300, at: '보안코드 인증 성공' },                    // 원본이 작아 +2.9dB 증폭 (피크 -19.2dBFS)
  10: { file: 'fail-beep.mp3', vol: 1.00, gap: 300, at: '보안코드 인증 실패' },
  12: { file: 'system-connect.mp3', vol: 0.25, gap: 500, at: '[제한 시스템 접속] (1차 수색 시작)' },
  14: { file: 'clue-open.mp3', vol: 0.80, gap: 250, at: '장소 수색에서 자료·보조자료 창 열기' },
  16: { file: 'cctv-play.mp3', vol: 0.40, gap: 300, at: 'CCTV [영상 재생]·[다시 재생]' },
  17: { file: 'cctv-noise.mp3', vol: 0.14, gap: 0, loop: true, at: 'CCTV 영상이 재생되는 동안 반복(멈춤·끝·창 닫기에서 정지)' },  // 18초 반복 소리라 0.18 → 0.14
  18: { file: 'fail-beep.mp3', vol: 1.00, gap: 500, at: 'CCTV 재생 실패 안내' },
  19: { file: 'question-select.mp3', vol: 0.25, gap: 100, at: '심문 질문 선택' },
  20: { file: 'record-new.mp3', vol: 1.00, gap: 250, delay: 200, at: '심문 새 진술 기록 저장(질문 선택 직후)' },
  22: { file: 'card-place.mp3', vol: 2.50, gap: 80, at: 'My Archive 조합 칸에 카드 놓기([+]·끌어 놓기)' },  // 원본이 작아 +8dB 증폭 (피크 -13.6dBFS)
  23: { file: 'combo-fail.mp3', vol: 0.45, gap: 250, at: 'My Archive 조합 실패' },                    // 성공음보다 커지지 않게 0.65 → 0.45
  24: { file: 'combo-success.mp3', vol: 1.00, gap: 250, at: 'My Archive 조합 성공' },
  25: { file: 'record-new.mp3', vol: 1.00, gap: 250, delay: 450, at: 'My Archive NEW 카드 생성(조합 성공음 뒤)' },
  26: { file: 'rami-warning-glitch.mp3', vol: 0.10, gap: 3000, delay: 700, at: '제한구역 첫 진입: 래미 경고 대사가 뜬 직후' },  // 피크 +1.4dBFS → 0.12에서 0.10으로 더 낮춤 (피크 -18.6dBFS)
  27: { file: 'analysis-complete.mp3', vol: 0.60, gap: 1000, at: '최종 추론 신원 확인 절차가 끝났을 때' },
  28: { file: 'final-confirm.mp3', vol: 1.00, gap: 500, at: '최종 선택으로 진행 확인 창 [진행]' },
  29: { file: 'final-confirm.mp3', vol: 1.00, gap: 2000, at: '엔딩 1 연출 시작' },
  30: { file: 'ending2.mp3', vol: 1.00, gap: 2000, at: '엔딩 2 연출 시작' },
  31: { file: 'ending3.mp3', vol: 1.00, gap: 2000, at: '엔딩 3 연출 시작' },
  32: { file: 'hub-click.mp3', vol: 1.00, gap: 60, at: '데모 종료 화면 [허브로 돌아가기]' }
};
