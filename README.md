# REMNANT ARCHIVE 인트로 페이지

사이트에 처음 들어오면 보이는 첫 화면입니다.

## 폴더 구조

```
remnant-intro/
├─ index.html       ← 인트로 페이지 (디자인·동작이 이 파일 하나에 전부)
├─ images/
│  └─ intro.jpg     ← 히어로 이미지 (회사 건물)
└─ README.md
```

`index.html`과 `images` 폴더는 같은 위치에 두는 것이 기본입니다.

`index.html` 안에도 같은 히어로 이미지가 한 장 들어 있어서, 압축을 풀지 않고 열거나 `index.html`만 따로 옮겨도 사진이 그대로 나옵니다. 사진을 새것으로 바꿀 때는 `images/intro.jpg`를 덮어쓰면 그 이미지가 먼저 쓰입니다.

## 화면 구성

**왼쪽**
- 라벨 `MEMORY PRESERVATION ARCHIVE`
- 제목 `REMNANT ARCHIVE`
- 슬로건 `Nothing Is Ever Lost.` (한 글자씩 타이핑되며 나타남)
- 부제 `기록은 사라지지 않습니다.`

**메뉴**

| 메뉴 | 영문 | 상태 |
|---|---|---|
| 입사 지원하기 | NEW HIRE · CASE 01 | 강조 버튼, FREE 표시 |
| 이어서 출근하기 | CONTINUE | 비활성 · "기록 없음" |
| 유출된 기억 | MEMORY FILES | 비활성 · "복구 중" |
| 보존 기록 | RECORDS | 활성 |
| 설정 | SETTINGS | 활성 |

키보드 ↑↓로 이동, Enter로 선택할 수 있습니다.

**사원 조회**
- 이름을 입력하고 조회하면 `No Results Found` / "등록된 사원 정보가 없습니다."가 뜹니다.

**오른쪽 아래 · 보존 기억 카운터**
- `ARCHIVED MEMORIES 1,204,331건 보존 중` 숫자가 몇 초마다 1씩 올라갑니다.

**하단**
- 소리 켜기/끄기, 연출 줄이기 버튼
- AI 활용 고지, 개인정보처리방침·이용약관 링크, 팀 이름

## 배경 움직임 효과

이미지 화질은 그대로 두고, 그 위에 코드로 움직임을 얹었습니다.

- **빛 입자:** 하늘과 바닥의 빛의 선을 따라 도시 쪽에서 회사 건물 쪽으로 흘러갑니다.
- **느린 확대:** 약 30초에 걸쳐 이미지가 아주 조금씩 다가왔다 멀어집니다.
- **창문 깜빡임:** 몇 초에 한 번 건물 창문 하나가 잠깐 꺼지거나 깜빡입니다.

"연출 줄이기"를 누르거나 기기 설정에서 동작 줄이기가 켜져 있으면 모두 멈춥니다.

## 열어보기

- `index.html`을 더블클릭하면 브라우저에서 바로 열립니다.
- 글꼴(Noto Sans KR, JetBrains Mono)은 인터넷에서 불러오므로 인터넷이 연결되어 있어야 디자인 그대로 보입니다.

## 이미지 바꾸기

- 새 이미지를 `images/intro.jpg`로 덮어쓰면 됩니다.
- 빛 입자는 지금 이미지의 빛의 선 위치에 맞춰 그려져 있습니다. 구도가 다른 이미지로 바꾸면 `index.html` 안의 `PATHS` 목록도 다시 맞춰야 합니다.

## 메뉴 연결 (CASE 01 「신입사원」)

메뉴는 실제 게임 페이지로 연결되어 있습니다 (`index.html` 아래쪽 설정 `LIVE_LINKS = true`). `false`로 바꾸면 안내 문구만 뜹니다.

- 입사 지원하기 → `shinip/index.html?mode=new` (진행 중인 기록이 있으면 먼저 확인 창)
- 이어서 출근하기 → `shinip/index.html?mode=continue` (진행 중일 때만 켜짐, 엔딩을 본 뒤에는 ‘근무 종료’)
- 보존 기록 → `shinip/index.html?view=records` (엔딩 수집 화면, 진행 기록은 건드리지 않음)
- 유출된 기억 → ‘복구 중’ (데모에서는 잠김)
- 설정 → 지금은 설정할 항목이 없어 숨김 (`hidden`을 지우면 다시 보임)
- 하단 "연출 줄이기"는 저장되어 게임 화면에도 똑같이 적용됩니다.

허브는 저장 칸 `remnant.global`의 CASE 상태(status)만 읽습니다. 게임 폴더(`shinip/`)는 `index.html`과 같은 위치에 둡니다.
저장소 안에서는 인트로 파일 이름이 `index (1).html`이라, 게임의 [허브로 돌아가기]도 이 이름을 가리킵니다. 배포할 때 이름을 `index.html`로 바꾸면 `shinip/js/main.js`의 `HUB_URL`도 `'../index.html'`로 바꿉니다.
엔딩을 마친 뒤 엔딩 수집의 [허브로 돌아가기]는 데모 종료 페이지 `shinip_demo_complete.html`(인트로와 같은 위치)을 거쳐 허브로 돌아옵니다. 이 페이지의 `HUB_URL`(`'index (1).html'`)도 배포할 때 `'index.html'`로 바꿉니다.
게임을 처음 연 한 번만 허브 앞에 플레이 전 안내 `first-launch-notice-terminal.html`(인트로와 같은 위치)이 나옵니다. 화면을 누르면 로딩 화면 `loading.html`(인트로와 같은 위치, 3초)을 거쳐 허브로 가고, 본 기록은 `remnant.global`의 `settings.notice_seen`에 남습니다. 로딩 화면의 `data-next`도 배포할 때 `index.html`로 바꿉니다. 즉 인트로 이름을 바꾸면 허브 주소를 고칠 곳은 `shinip/js/main.js`·`shinip_demo_complete.html`·`loading.html` 세 군데입니다.

효과음은 `shinip/assets/sfx/`(게임용 사본)와 `shinip/data/sfx.js`(번호·파일·볼륨 설정), `shinip/js/sound.js`(재생)에 있습니다. 하단 "소리 켜짐/꺼짐"은 `remnant.global`의 `settings.sound`에 저장되어 게임에도 적용되고, 처음 방문하면 켜짐입니다. 브라우저 정책상 첫 클릭 뒤부터 소리가 납니다.

허브 배경음은 `shinip/assets/bgm/`에 있고, 엔딩을 보고 데모 종료 화면의 [허브로 돌아가기]로 돌아온 그때만 한 번 재생됩니다. 원본(`배경음/` 폴더)은 Git에 넣지 않고 따로 보관합니다.

## Windows 앱으로 실행하기 (D92)

허브와 CASE 01을 Windows용 앱(Electron, 무설치 exe)으로 묶을 수 있습니다. 앱 프로젝트는 `desktop/` 폴더에 따로 있고, 게임 원본 파일은 고치지 않습니다.

1. `desktop/`에서 `npm install` (Node.js 22.12 이상, 처음 한 번)
2. `npm start` → 앱으로 바로 실행 (개발용, F12 개발자 도구)
3. `npm run dist` → `desktop/dist/RemnantArchiveDemo-<버전>-portable.exe`

- 빌드할 때 실행에 필요한 파일(이 페이지, 플레이 전 안내, 로딩, 데모 종료 페이지, `shinip/`)만 복사해 묶습니다. 글꼴도 앱 안에 들어가서 인터넷 없이도 같은 글꼴로 보입니다.
- 저장 위치는 `%APPDATA%\Remnant Archive Demo`입니다. 웹 브라우저에서 하던 기록은 앱으로 넘어오지 않습니다.
- F11로 전체 화면을 켜고 끕니다. 데모 종료 화면의 X 링크는 기본 브라우저로 열립니다.
- 코드 서명이 없어서 처음 실행할 때 Windows SmartScreen 경고가 뜹니다([추가 정보] → [실행]).
- 아이콘을 바꾸려면 저장소 루트 `아이콘.png`를 바꾼 뒤 `python desktop/scripts/make-icon.py`를 실행합니다.

## GitHub Pages로 올리기

1. 저장소 맨 위(루트)에 `index.html`과 `images` 폴더를 그대로 올립니다.
2. 저장소 Settings → Pages → Branch를 `main`으로 지정합니다.
3. 몇 분 뒤 `https://아이디.github.io/저장소이름/` 주소로 열립니다.
