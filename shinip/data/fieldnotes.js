/* 보조자료(현장 자료) RA-S01~RA-S13 — 기준: 저장소 루트 「보조단서(단서명,자료번호,문서위치,MYARCIVE,기록요약).txt」 확정 문구 (D73)
   추리 자료가 아니다. My Archive·clue_order·확보 수·조합·C13 후보·완성도·해금·엔딩 판정에 넣지 않는다.
   읽은 기록만 진행 칸의 notes_read에 남는다. 문구는 원문 그대로 두고 고치지 않는다.
   place: 문서 위치 / from: 처음 볼 수 있는 수색 단계 (없으면 1) / img: 현장 이미지 (원본 `보조_단서_이미지파일/`, 게임용 jpg 사본)
   RA-S10은 실명·날짜를 지운 수정본을 연결하고, 제목·기록 요약은 이미지에 맞춘다 (D75·D77). RA-S12 원본 파일 이름은 `RA-12.png` */
window.R01 = window.R01 || {};
R01.FIELD_NOTES = {
  'RA-S01': { title: '문서 분류 안내', place: 'archive', img: 'assets/field/ra-s01.jpg', ratio: '1443 / 1090',
    summary: '반납된 문서와 분류 대기 중인 문서를 구분하는 안내문이다. 특별한 내용은 없어 보인다.' },
  'RA-S02': { title: '문서 검색 이용 안내', place: 'archive', img: 'assets/field/ra-s02.jpg', ratio: '1672 / 941',
    summary: '사내 문서 검색 시스템의 이용 방법을 정리한 안내문이다. 자료를 찾으려면 문서번호나 분류 항목을 입력해야 하는 모양이다.' },
  'RA-S03': { title: '관제실 인수인계 메모', place: 'control', img: 'assets/field/ra-s03.jpg', ratio: '1536 / 1024',
    summary: '관제실 근무자들이 남긴 인수인계 메모다. 확인되지 않은 항목은 임의로 처리하지 말라는 내용이 적혀 있다.' },
  'RA-S04': { title: '장비 오류 접수 안내', place: 'control', img: 'assets/field/ra-s04.jpg', ratio: '1536 / 1024',
    summary: '관제 장비에 문제가 발생했을 때의 신고 절차를 정리한 안내문이다. 오류가 발생한 장비와 증상을 기록하도록 되어 있다.' },
  'RA-S05': { title: '휴게공간 이용 안내', place: 'living', img: 'assets/field/ra-s05.jpg', ratio: '1447 / 1087',
    summary: '직원들의 휴게공간 이용 수칙과 분실물 안내가 적힌 게시물이다. 오래된 공지 몇 장이 함께 붙어 있다.' },
  'RA-S06': { title: '개인 사물함 이용 안내', place: 'living', img: 'assets/field/ra-s06.jpg', ratio: '1448 / 1086',
    summary: '직원들에게 배정된 개인 사물함의 이용 수칙이다. 퇴실 시 개인 물품을 정리하라는 내용이 적혀 있다.' },
  'RA-S07': { title: '직원 생활 메모', place: 'living', from: 2, img: 'assets/field/ra-s07.jpg', ratio: '1448 / 1086',
    summary: '공용 테이블에 놓인 짧은 메모다. 사용한 컵과 개인 물품을 정리해 달라는 내용이 적혀 있다.' },
  'RA-S08': { title: '공용 기기 이용 안내', place: 'living', img: 'assets/field/ra-s08.jpg', ratio: '1448 / 1086',
    summary: '탕비대에 설치된 공용 기기의 사용 안내문이다. 기기 사용 방법과 간단한 주의사항이 적혀 있다.' },
  'RA-S09': { title: '분석 단말 이용 안내', place: 'lab', img: 'assets/field/ra-s09.jpg', ratio: '1448 / 1086',
    summary: '실험실 분석 단말의 사용 방법과 화면 잠금 절차를 정리한 안내문이다. 별다른 이상은 없어 보인다.' },
  'RA-S10': { title: '실험 장비 관찰 기록', place: 'lab', img: 'assets/field/ra-s10.jpg', ratio: '1448 / 1086',
    summary: '실험 장비의 상태를 점검한 관찰 기록이다. 분석 콘솔과 실험 의자 등 장비 대부분이 정상으로 적혀 있다.' },
  'RA-S11': { title: '실험 장비 정리 안내', place: 'lab', img: 'assets/field/ra-s11.jpg', ratio: '1448 / 1086',
    summary: '실험 장비의 정리 순서와 이동 통로 확보에 관한 안내문이다. 사용한 장비는 지정된 위치에 보관하도록 되어 있다.' },
  'RA-S12': { title: '보안 자료 보관함 취급 안내', place: 'restricted', img: 'assets/field/ra-s12.jpg', ratio: '1448 / 1086',
    summary: '보안 자료를 보관하는 전자 잠금함의 취급 안내문이다. 허가되지 않은 조작을 금지한다는 경고가 적혀 있다.' },
  'RA-S13': { title: '제한구역 출입 상태 기록', place: 'restricted', img: 'assets/field/ra-s13.jpg', ratio: '1448 / 1086',
    summary: '출입문 옆 생체인식 패널에 현재 출입 상태가 표시되어 있다. 별도의 이상 알림은 확인되지 않는다.' }
};
R01.FIELD_STATUS = '현장 자료 · My Archive 미보관';
