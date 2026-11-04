# Tasks

## 1. All Cards 디자인 값 확보

- [x] 1.1 design.md Context의 All Cards 프레임(데스크톱·태블릿·모바일, Error, Empty, Hover, Focus, Edit/Delete Dialog, Toast, 메뉴)에 `get_design_context`·`get_screenshot`을 실행해 폼 필드·오류·그리드 카드·메뉴·대화상자·토스트의 색·글꼴·간격·테두리·그림자·상태 값과 그리드 열 수·간격을 `figma-notes.md`(이 change 폴더)에 표로 정리한다. 스크린샷은 저장소 밖 스크래치 폴더에 둔다. 태블릿 2열·모바일 1열 추정이나 spec 문구가 Figma와 다르면 이 단계에서 `/opsx:update`로 고친다. 확인: figma-notes.md에 프레임별 node-id·값 표가 있고 spec과의 차이가 기록돼 있다
- [x] 1.2 `_variables.scss`에 `$pink-700` 등 1.1에서 확인한 새 토큰을 추가한다. 확인: `node -e "require('sass').compile('src/scss/style.scss')"` 통과, 새 토큰 이름이 figma-notes 표와 일치

## 2. 보기별 필터 상태로 구조 변경 (card-filtering)

- [x] 2.1 `main.js`의 state를 design D1 구조(`filters.study` / `filters.all`)로 바꾸고 `getFilteredCards(filter)`(order에 없는 카드는 원래 순서로 뒤에 붙임)와 Study Mode 렌더링·핸들러를 새 구조로 옮긴다. 카테고리 필터·Hide Mastered·Shuffle 핸들러는 버튼이 속한 보기(`data-view-scope` 등)의 필터를 바꾸게 한다. 확인: `node --check src/js/main.js` 통과, Chromium에서 기존 Study Mode 시나리오 회귀(첫 카드 fc001·"Card 1 of 40", CSS+HTML "Card 1 of 9", Hide Mastered 29장, JavaScript만 Shuffle 후 "Card 1 of 13", Previous 순환 "Card 40 of 40", 필터 열기→Space 선택→Escape 후 버튼 포커스)
- [x] 2.2 전역 Escape·바깥 클릭 처리를 "열린 대화상자 → 열린 카드 메뉴 → 열린 카테고리 필터" 순서로 가장 위의 하나만 닫도록 바꾸고, 카테고리 패널 id·`aria-controls`를 보기별로 분리한다(design D6·D9). 확인: Study Mode 필터의 Escape·바깥 클릭·Tab 이탈 닫기가 그대로 동작하고 id 중복이 없다(`document.querySelectorAll('[id]')` 중복 검사)

## 3. 카드 변경 경로와 데이터 (flashcard-data, study-mode, study-statistics)

- [x] 3.1 design D2의 `commitCards()`를 구현하고 `setKnownCount()`·`know()`의 Hide Mastered 위치 처리를 이 경로로 합친다(저장 → 사라진 카테고리 선택 해제 → Study 위치 보정 → render). 확인: 기존 "학습 중 숙련 도달" 시나리오(Hide Mastered 중 knownCount 4 카드 → 다음 카드)와 숙련도 새로고침 복원이 그대로 통과
- [x] 3.2 새 카드 생성·수정·삭제 데이터 함수(id 생성과 중복 재시도, 앞뒤 공백 제거, 카테고리 대소문자 맞춤, 끝에 추가, id·knownCount 유지)를 구현한다(design D3). 확인: 브라우저 콘솔(`page.evaluate`)에서 같은 내용 두 번 생성 시 id가 다르고, "css" 입력 시 카테고리 "CSS", 수정 후 knownCount 유지
- [x] 3.3 데이터 변경의 영향 범위를 확인한다. 확인: Playwright로 (a) 생성·fc002 수정·fc003 삭제 후 새로고침해 그대로 복원되고 Total 40, (b) 전체 삭제 후 새로고침 시 빈 상태·Total 0(data.json으로 되돌아가지 않음), (c) 생성 시 Total 41·Not Started 9, fc004 삭제 시 Total 39·Mastered 10, (d) Study에서 fc005를 보다가 fc001 삭제 → "Card 4 of 39"로 fc005 유지, fc005 삭제 → fc006 앞면 "Card 5 of 39", (e) Shuffle 후 3번째 카드에서 생성 → "Card 3 of 41", 41번째가 새 카드, (f) Study에서 "Art"만 선택 후 Art 카드 삭제 → 선택 없음·39장

## 4. All Cards 보기와 그리드 (all-cards-view)

- [x] 4.1 `index.html`의 `#all-cards-view`에 생성 폼 패널, 툴바(보기별 카테고리 필터·Hide Mastered·Shuffle), `<ul role="list">` 그리드, Load More 버튼, 빈 상태 두 종류("No cards yet", "You’re all caught up!") 마크업을 작성한다. 보기 제목 `<h2>`에 `tabindex="-1"`을 둔다. 확인: 접근성 트리에서 제목 단계가 h1 → h2 → h3 순이고 id 중복이 없으며 콘솔 404 없음
- [x] 4.2 그리드 렌더링(질문 `<h3>`, "Answer:"와 정답, 카테고리 태그, `renderStatus` 재사용, 메뉴 버튼 `aria-label="Actions for: <질문>"`)과 처음 12장 표시를 구현한다. render 전후 그리드 안 포커스 복원을 포함한다(design D7). 확인: 초기 데이터에서 12장, 첫 카드 fc001, 두 번째 카드 "JavaScript"·"2/5", fc004 "Mastered 5/5", Geography만 선택 시 4장
- [x] 4.3 Load More(12장씩 추가, 새 첫 카드 메뉴 버튼으로 포커스, 남은 카드 없으면 숨김)와 필터·Hide Mastered·Shuffle 변경 시 12장 초기화, 생성·삭제·보기 전환 시 유지를 구현한다. 확인: 40장에서 세 번 실행 시 24·36·40장 후 버튼 사라짐, 키보드 실행 후 포커스가 13번째 카드 메뉴 버튼, 24장 상태에서 Hide Mastered 시 12장, 24장 상태에서 삭제 시 24장 유지
- [x] 4.4 빈 상태 전환을 구현한다: 카드 0장이면 툴바·그리드·Load More 숨김, Hide Mastered로 0장이면 툴바 유지. 확인: 마지막 카드 삭제 시 "No cards yet"과 안내, 툴바·Load More가 탭 순서에 없음, Mathematics만 선택 + Hide Mastered 시 "You’re all caught up!"과 툴바
- [x] 4.5 `_card-grid`·`_grid-card` SCSS를 1.1 값으로 작성한다(모바일 1열 / 768px 2열 / 1024px 3열, `overflow-wrap: anywhere`, 필요한 요소만 `max-inline-size: none`). 확인: SCSS 컴파일 통과, 767·768·1023·1024px에서 1·2·2·3열, 320px에서 공백 없는 60자 정답이 줄바꿈되고 `scrollWidth <= clientWidth`, 375·768·1440 스크린샷을 Figma와 비교한 차이를 보고에 기록

## 5. 카드 메뉴 (all-cards-view)

- [x] 5.1 카드 메뉴 disclosure(`aria-expanded`, `aria-controls`, 닫힘 시 `hidden`, 한 번에 하나, Escape → 메뉴 버튼 포커스, 바깥 클릭 닫기)와 `_card-menu` SCSS(아이콘 `icon-menu`·`icon-edit`·`icon-delete`, hover·focus)를 구현한다. 확인: Enter로 열고 Tab으로 Delete에 가서 Enter 시 메뉴가 닫히고 삭제 대화상자가 열린다(대화상자는 7에서 연결하기 전까지 콘솔 로그로 확인), 다른 메뉴 버튼 클릭 시 이전 메뉴가 닫힘

## 6. 생성 폼과 검증 (card-management)

- [x] 6.1 공용 `validateCard()`와 오류 표시 함수(`aria-invalid`, `aria-describedby`, 오류 문구 `hidden` 전환, 첫 오류 필드 포커스, 제출 후에만 `input` 재검사)를 구현한다(design D4). 확인: 빈 폼 제출 시 세 문구("Please enter a question." 등)와 Question 포커스, Question만 채우면 Answer로 포커스, 오류 상태에서 Question 입력 시 그 오류만 사라짐, 제출 전 입력 후 지우기는 오류 없음, Question 공백만 입력 시 해당 오류만 표시
- [x] 6.2 생성 제출(성공 시 카드 추가, 폼 비우기, `submitted` 초기화, 토스트 호출 지점)을 연결하고 `_form-field` SCSS(라벨·입력·textarea·오류 아이콘과 Pink 700, hover·focus)를 작성한다. 확인: "What is 2 + 2?"/"4"/"Mathematics" 생성 시 41장·"0/5"·입력란 비움, "Music" 생성 시 두 보기 필터에 "Music (1)", 오류 상태 스크린샷이 Figma `506:4696`과 일치(차이 기록), 스크린 리더 이름·상태를 접근성 트리로 확인

## 7. 수정·삭제 대화상자 (card-management)

- [x] 7.1 `#edit-dialog`·`#delete-dialog`를 `<dialog>`로 작성하고 열기·닫기(`showModal`, 닫기 버튼, Escape, 오버레이 클릭 판정, `aria-labelledby`, 초기 포커스, `close` 시 포커스 복원)와 `_dialog` SCSS(배경 스크롤 잠금, reduced-motion)를 구현한다(design D5). 확인: Edit 열면 Question 포커스, Escape·오버레이·닫기 버튼으로 닫히고 메뉴 버튼으로 포커스 복귀, 대화상자 내부 여백 클릭으로는 닫히지 않음, 열린 동안 Tab이 밖으로 나가지 않음
- [x] 7.2 Edit 저장(값 채우기, 공용 검증, 수정 후 닫기·메뉴 버튼 포커스, 저장하지 않고 닫으면 다음 열 때 원래 값)을 구현한다. 확인: fc002 질문 수정 후 그리드에 반영·"2/5" 유지, Answer 비우고 저장 시 대화상자 유지와 오류, 수정 중 Escape 후 다시 열면 원래 값, Geography 카드 하나를 "History"로 바꾸면 필터에 "Geography (3)"·"History (2)"
- [x] 7.3 Delete 확인(Cancel 초기 포커스, Delete Card 시 삭제, 삭제 후 포커스: 다음 카드 메뉴 → 이전 카드 → 빈 상태 제목)을 구현한다. 확인: fc001 삭제 시 Total 39와 다음 카드 메뉴 버튼 포커스, Cancel 시 변화 없음, 마지막 카드 삭제 시 "No cards yet" 제목에 포커스, "Art" 카드 삭제 시 두 보기 필터에서 Art 사라짐

## 8. 토스트 (card-management)

- [x] 8.1 토스트 영역(`role="status"`, 닫기 버튼 `aria-label`, 새 토스트가 이전 것을 대신함, 같은 문구 연속 시 비웠다가 채움)과 5초 자동 닫힘·hover/focus 중 정지, 닫기 버튼 포커스 중 닫힐 때 보기 제목으로 포커스 이동을 구현하고 `_toast` SCSS(위치, reduced-motion)를 작성한다(design D8). 생성·수정·삭제에 연결한다. 확인: 세 문구가 각각 표시되고 약 5초 뒤 사라짐, 닫기 버튼 클릭 시 즉시 사라짐, 닫기 버튼에 포커스를 둔 채 10초 유지, 생성 직후 삭제 시 "Card deleted." 하나만 표시, 375·1440에서 토스트가 폼·헤더 조작을 가리지 않음

## 9. 통합 검증

- [x] 9.1 보기 간 상태 분리를 확인한다. 확인: Study에서 5번째 카드를 보다가 All Cards에서 Geography 선택 후 돌아오면 "Card 5 of 40", All Cards의 Hide Mastered가 Study의 체크 상태를 바꾸지 않음
- [x] 9.2 키보드만으로 전체 흐름(보기 전환 → 생성 → 오류 수정 → 메뉴 → 수정 → 삭제 → Load More → Study Mode 학습)을 수행하고 All Cards 탭 순서(Question, Answer, Category, Create Card, 필터, Hide Mastered, Shuffle, 메뉴 버튼들, Load More)를 확인한다. 확인: 모든 단계가 마우스 없이 완료되고 포커스 표시가 항상 보이며 가려지지 않음
- [x] 9.3 반응형·확대·모션을 확인한다. 확인: 320·375·767·768·1023·1024·1440px와 가로 모드, 텍스트 200% 확대에서 가로 넘침·겹침 없음(`scrollWidth` 측정), `emulateMedia({reducedMotion:'reduce'})`에서 대화상자·토스트·카드 뒤집기 transition·animation 0s
- [x] 9.4 All Cards hover·focus 상태를 Figma `429:9561`·`429:10278`과 비교하고, 상호작용 요소마다 이름·역할·상태를 접근성 트리로 확인한다. 확인: 요소별 기본·Hover·Focus·실행·상태 변경 표(AGENTS.md §3)가 보고에 있고 차이는 발견 사항으로 기록, Firefox는 미설치 시 미검증으로 기록

## Workflow follow-up

- 구현 보고에 README와의 차이(필터 "All Categories" 항목 없음, 폼 위 오류 목록 대신 필드별 오류)를 적는다.
- 리뷰가 끝나면 `/opsx:archive`로 아카이브하고 `openspec/specs/`에 반영된 결과를 확인한다.
