# Tasks

## 1. 디자인 확보와 기반 값 교체

- [x] 1.1 사용자에게 Figma URL을 받아 `get_metadata`로 프레임 목록(모바일·태블릿·데스크톱 Study Mode, 카드 뒷면, 드롭다운 열림, 빈 상태, hover·focus 상태)을 보여 주고 확인받는다. 확인: 프레임별 node-id 표가 보고에 있다
- [x] 1.2 프레임별 `get_design_context`·`get_screenshot`, `get_variable_defs`를 실행해 색·글꼴·간격·분기점·둥글기·그림자 값을 표로 정리한다. Previous/Next 경계 동작, 필터 라벨이 spec과 다르면 이 단계에서 `/opsx:update`로 spec을 고친다. 확인: 토큰 표와 스크린샷 저장 위치가 보고에 있다
- [x] 1.3 `_variables.scss`의 이전 챌린지 토큰을 Figma 변수 이름 기반 토큰과 `$breakpoints`로 교체하고, 이전 토큰 사용처가 없음을 grep으로 확인한다. 확인: `node -e "require('sass').compile('src/scss/style.scss')"` 통과
- [x] 1.4 `_fonts.scss`의 Work Sans를 제거하고 `src/fonts/Poppins` 400·500·600·700 `@font-face`를 등록, `_base.scss` body 배경·글자색·글꼴을 토큰으로 바꾼다. 확인: SCSS 컴파일 통과, 미리보기에서 `document.fonts.check('600 1rem Poppins')`가 true

## 2. 미리보기 환경

- [x] 2.1 스크래치 폴더에 `doc/figma-guide.md`(삭제됨) §6 방법 A 구조(index.html, css, images, js, fonts, data.json)를 만드는 스크립트를 작성하고, 그 폴더를 정적 서버(browser-sync, 포트 3001, `--no-open`)로 띄운다. `dist`는 건드리지 않는다. 확인: `http://localhost:3001/data.json`이 200을 반환하고 `dist` 수정 시각이 바뀌지 않았다

## 3. 앱 골격 HTML과 보기 전환 (app-shell)

- [x] 3.1 `src/pages/index.html`을 사용자 변경 위에서 시맨틱 구조로 작성한다: 문서 head(제목, stylesheet 링크 복원, 파비콘 `./images/favicon-32x32.png`), 헤더(로고 `<h1>` + Flashcard 이름, Study Mode/All Cards `aria-pressed` 버튼), `<main>` 안 `#study-view`·`#all-cards-view`(자리만) 섹션, jQuery·main.js `defer` 스크립트. attribution 처리 방식을 보고에 적는다. 확인: 접근성 트리에서 main 1개, h1 1개, 제목 단계 건너뜀 없음, 콘솔 404 없음
- [x] 3.2 Study Mode 마크업을 작성한다: 툴바(카테고리 필터 버튼·패널, Hide Mastered 체크박스, Shuffle), 카드 버튼(앞·뒷면, 카테고리 배지, 진행 표시), I Know This / Reset Progress, Previous / "Card N of M" / Next, 빈 상태, sr-only live 영역, 통계 `<dl>`. 모든 요소에 `c-`/`l-` 클래스, 아이콘은 `alt=""`. 확인: 콘텐츠 목록(1.1의 Figma 텍스트)과 대조해 누락·추가 없음
- [x] 3.3 `app-header`·`button`·`panel` 컴포넌트 SCSS와 `pages/_home.scss` 반응형 배치를 Figma 값으로 작성한다(모바일 우선, `mq()`, hover·focus-visible, reduced-motion). 확인: SCSS 컴파일 통과, 각 프레임 폭에서 스크린샷이 Figma와 일치하고 차이는 보고에 기록
- [x] 3.4 `main.js`에 IIFE 골격, state 객체, `setState`/`render` 흐름, 보기 전환 핸들러를 구현한다. 확인: Chromium에서 All Cards 클릭 시 `aria-pressed` 전환, `#study-view`에 `hidden`, Tab이 숨긴 영역으로 들어가지 않음, Study Mode 복귀 시 이전 카드 위치 유지

## 4. 데이터 로드와 영속화 (flashcard-data)

- [x] 4.1 `loadCards()`를 구현한다: localStorage(`flashcard-app:cards`, `{version, cards}`) 검증 → 실패 시 `fetch('./data.json')` → 실패 시 안내 문구와 빈 상태. 모든 저장소 접근은 try/catch. 확인: Playwright로 (a) 첫 방문 40장, (b) 손상된 값 주입 시 초기 데이터, (c) fetch 차단(route abort) 시 안내 문구와 콘솔 미처리 오류 없음
- [x] 4.2 `save()`와 숙련 상태 분류·`knownCount` 0–5 제한 함수를 구현한다. 확인: knownCount 0/1/4/5 분류와 5에서 증가 시 5 유지를 브라우저 콘솔(`page.evaluate`)로 확인, 숙련도 변경 후 새로고침 시 값 복원

## 5. Study Mode 동작 (study-mode)

- [x] 5.1 현재 카드 렌더링과 "Card N of M", 진행 표시(`N/5`, Mastered 표시)를 구현한다. 확인: 첫 화면에 fc001 카테고리·질문·"0/5"·"Card 1 of 40"
- [x] 5.2 `flashcard` SCSS(앞·뒷면, 배경 패턴·별 장식, 3D 회전, reduced-motion 시 transition 없음)와 뒤집기 핸들러(클릭·Enter·Space, `aria-pressed`, 숨은 면 `aria-hidden`, live 영역 정답 안내)를 구현한다. 확인: 클릭·Space로 정답 표시, live 영역 텍스트 갱신, `emulateMedia({reducedMotion:'reduce'})`에서 computed `transition-duration` 0s
- [x] 5.3 I Know This / Reset Progress를 구현한다. 확인: knownCount 2→3 시 "3/5", 4→5 시 "Mastered 5/5" 배지와 비활성 "Already Mastered" 버튼, 5→Reset 시 "0/5"와 활성 "I Know This", 저장값 반영
- [x] 5.4 Previous/Next 순환 이동과 이동 시 앞면 초기화, render 후 포커스 복원을 구현한다. 확인: 1번째에서 Previous → "Card 40 of 40", 뒤집힌 상태에서 Next → 질문 면, 키보드로 Next 연타 시 포커스 유지
- [x] 5.5 빈 상태 두 종류(카드 0장: "No cards to study" + "Go to All Cards", Hide Mastered로 0장: "You’re all caught up!")를 구현한다(`empty-state` SCSS 포함). 확인: 저장값을 빈 배열로 주입 시 첫 안내와 버튼 실행 시 All Cards 전환, "Mathematics"만 선택 + Hide Mastered 시 두 번째 안내, 두 경우 모두 카드·숙련도·이동 버튼이 탭 순서에 없음, Hide Mastered 해제 시 "Card 1 of 1"

## 6. 필터·섞기 (card-filtering)

- [x] 6.1 카테고리 패널 렌더링(카테고리 목록과 전체 카드 수, 별도 All Categories 항목 없음)과 열기·닫기(Escape → 버튼 포커스 복귀, 바깥 클릭, `aria-expanded`, 닫힘 시 `hidden`)를 구현하고 `category-filter` SCSS를 작성한다. 확인: JavaScript 13·Geography 4 표시, 키보드만으로 열기→선택→Escape 후 포커스가 필터 버튼
- [x] 6.2 다중 선택 필터·선택 없음 = 전체(버튼 라벨 "All Categories")·필터 변경 시 index 0을 구현한다. 확인: CSS+HTML 선택 시 "Card 1 of 9", 모든 선택 해제 시 40장과 "All Categories" 라벨, 10번째 카드에서 Geography 선택 시 "Card 1 of 4"
- [x] 6.3 Hide Mastered와 학습 중 Mastered 도달 시 같은 위치의 다음 카드 표시를 구현한다. 확인: 초기 데이터 29장, knownCount 4 카드에 I Know This 후 다음 카드 표시(마지막이면 첫 카드)
- [x] 6.4 Shuffle(현재 학습 대상 순서 무작위화, index 0, 필터 변경 시 원래 순서로 복귀)을 구현한다. 확인: JavaScript만 선택 후 Shuffle 시 "Card 1 of 13"이고 카드 id 집합 동일

## 7. 학습 통계 (study-statistics)

- [x] 7.1 통계 집계·렌더링과 `stats` SCSS(항목별 색 블록·아이콘)를 구현한다. 확인: 초기 40/11/21/8, Geography+Hide Mastered에서도 값 불변, Not Started 카드에 I Know This 후 7/22

## 8. 통합 검증과 보고

- [x] 8.1 반응형: 320px, 각 분기점 직전·직후, 가로 모드, 텍스트 200% 확대(브라우저 기본 글꼴 32px)에서 `scrollWidth ≤ viewport`와 겹침 없음을 Chromium으로 확인하고 스크린샷을 남긴다
- [x] 8.2 인터랙티브 요소 상태표(AGENTS.md §3): 보기 전환 2, 필터 버튼, 필터 패널 항목, Hide Mastered, Shuffle, 카드, I Know This, Reset Progress, Previous, Next의 기본·hover·focus-visible·실행·상태 변경을 캡처·기록하고 탭 순서가 app-shell spec과 같은지 확인한다
- [x] 8.3 정적 검토: `node --check src/js/main.js`, SCSS 컴파일, HTML 클래스·ID ↔ SCSS·JS 선택자 대조, CSS 사용자 정의 속성 선언·사용 대조, 미사용 규칙 확인, `git diff --check`, `git diff --stat`으로 `dist` 미변경 확인
- [x] 8.4 Firefox 실행 가능 여부를 확인해 검증하거나 미검증으로 기록하고, 검증 완료·미검증·해당 없음과 Figma 차이, 문서 불일치(jQuery 경로)를 AGENTS.md 형식으로 보고한다

## Workflow follow-up

- 다음 change(예: 카드 생성·수정·삭제, All Cards 그리드·Load More, 토스트, 모달)를 `/opsx:propose`로 시작한다.
- 리뷰 후 이 change를 아카이브한다.
