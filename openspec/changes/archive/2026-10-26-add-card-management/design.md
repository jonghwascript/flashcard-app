# Design

## Context

- 동기와 범위는 proposal.md, 요구 동작은 `specs/*/spec.md`를 따른다.
- 이전 change의 구조를 그대로 확장한다. [archive design](../archive/2026-10-26-add-flashcard-study-mode/design.md)의 D2(단일 state + 파생 함수), D3(jQuery 이벤트 위임, `data-action`/`data-js` 선택자), D4(`localStorage` `{ version: 1, cards }`), D10(미리보기·검증 환경)은 유지한다.
- 현재 코드에서 확인한 사항:
  - `src/js/main.js`의 `state`는 필터 상태(`categories`, `hideMastered`, `order`, `index`, `flipped`, `categoryOpen`)를 Study Mode 하나만 가정해 최상위에 둔다. `renderFilter()`도 `#study-category-panel`과 `[data-action="toggle-categories"]` 하나만 다룬다.
  - `getStudySet()`은 `state.order`가 있으면 `position.get(id)`로 정렬한다. order에 없는 새 카드는 `undefined - n = NaN`이 되어 정렬 결과가 정해지지 않는다(spec "섞은 순서에 새 카드 추가"로 해결해야 함).
  - `readStoredCards()`는 빈 배열 `[]`도 유효한 저장값으로 돌려준다. 따라서 "빈 목록 유지"는 현재 읽기 로직으로 충족되며 저장만 하면 된다.
  - 전역 Escape·바깥 클릭 핸들러가 카테고리 필터 하나만 닫는다. 메뉴·대화상자가 늘어나면 닫기 대상을 구분해야 한다.
  - `#all-cards-view`는 sr-only 제목만 있는 자리다. `src/images`에 `icon-circle-plus`, `icon-menu`, `icon-edit`, `icon-delete`, `icon-cross`, `icon-error`가 이미 있다.
  - `_variables.scss`에 Pink 700(`#E11966`, 오류색)이 아직 없다(figma-notes에는 "다음 change"로 기록됨).
- Figma(`LIUCvbM8aumON8VVswGYqI`) 확인 프레임: All cards 데스크톱 `300:2267`, 태블릿 `403:876`, 모바일 `403:877`, Error `506:4696`, Empty `506:5529`, Hover `429:9561`, Focus `429:10278`, Edit Dialog `439:3862`, Delete Dialog `444:3968`, Toast `444:5477`, 메뉴·드롭다운 `425:6343`. 태블릿 2열·모바일 1열은 컨테이너 크기(704×1740, 343×3312, 12장)로 추정했으며 구현 시 확인한다.

## Goals / Non-Goals

**Goals:**
- 두 보기가 같은 필터 규칙을 공유하되 상태는 분리된 구조로 바꾼다.
- 카드 변경(생성·수정·삭제·숙련도)이 한 경로로 저장되고 모든 영역(두 보기, 필터 선택지, 통계)에 반영되게 한다.
- 대화상자의 포커스 가두기·Escape·배경 차단은 브라우저 기본 기능에 맡긴다.

**Non-Goals:**
- 카드 순서 바꾸기(드래그), 일괄 삭제, 실행 취소(Undo), 검색.
- 필드 최대 길이 제한(요구사항 없음. 긴 텍스트는 줄바꿈으로 처리).
- 저장 형식 버전 변경과 마이그레이션.

## Decisions

### D1. 필터 상태를 보기별 객체로 분리
```
state = {
  cards, view, loadFailed,
  filters: {
    study: { categories: Set, hideMastered, order, index, flipped, open },
    all:   { categories: Set, hideMastered, order, visible: 12, open },
  },
  openMenuId: null,   // 열린 카드 메뉴의 카드 id
  dialog: null,       // { type: 'edit' | 'delete', cardId }
  toast: null,        // { message }
}
```
- `getFilteredCards(filter)`가 카테고리 → Hide Mastered → order를 적용한다. Study는 이 결과에서 `index`로 한 장, All은 앞에서 `visible`장을 잘라 쓴다.
- order 정렬: order에 있는 카드는 그 순서, 없는 카드(새 카드)는 원래 목록 순서로 뒤에 둔다.
- 대안: 필터 상태 하나를 두 보기가 공유 → Study Mode의 "이전에 보던 카드 위치 그대로"(app-shell)를 All Cards 필터 조작이 깨뜨려 기각.

### D2. 카드 변경은 `commitCards(nextCards, effect)` 한 경로로
- 순서: `state.cards` 교체 → `save()` → 선택지에서 사라진 카테고리를 두 필터의 `categories`에서 제거 → Study 위치 보정 → `render()` → 토스트·포커스 처리.
- Study 위치 보정: 변경 전 현재 카드 id를 기억한다. 변경 후 그 id가 학습 대상에 있으면 그 위치로 `index`를 맞춘다. 없으면 기존 `index`를 유지하고, 범위를 넘으면 0으로 돌린 뒤 `flipped=false`로 한다. 기존 `know()`의 Hide Mastered 처리도 같은 함수로 합친다.
- 기존 `setKnownCount()`도 이 경로를 쓰도록 바꿔 저장 위치를 하나로 만든다.

### D3. 새 카드 id와 카테고리 표기
- id: `` `fc-${Date.now().toString(36)}-${random}` `` 형식으로 만들고, 기존 id와 겹치면 다시 만든다. `crypto.randomUUID()`는 보안 컨텍스트(HTTPS·localhost)에서만 쓸 수 있어 정적 호스팅·LAN 미리보기를 고려해 쓰지 않는다.
- 카테고리: 앞뒤 공백을 제거한 뒤 기존 카테고리 중 `toLocaleLowerCase()`가 같은 것이 있으면 그 표기를 쓴다.
- 새 카드는 목록 끝에 추가한다. Figma "Created Card Toast" 프레임에서도 생성 후 그리드 첫 줄이 그대로이며, Study Mode의 "Card N of M" 순서도 바뀌지 않는다.

### D4. 폼 마크업과 검증
- 생성 폼과 Edit 대화상자 폼은 같은 마크업 구조를 쓴다: `<form novalidate>` 안의 `<label for>` + `<input>`(Question, Category) / `<textarea>`(Answer). 오류 문구 `<p id="…-error">`에는 `icon-error.svg`(`alt=""`)와 문구를 넣는다.
- 검증 함수 `validateCard(values)`가 `{ question, answer, category }`별 오류 문구를 돌려주고, 두 폼이 함께 쓴다.
- 오류 표시: 필드에 `aria-invalid="true"`와 `aria-describedby="<오류 id>"`를 설정하고 첫 오류 필드로 `focus()`한다. 오류가 없으면 두 속성을 제거하고 오류 문구를 `hidden`으로 숨긴다.
- 제출 이후에만 `input` 이벤트로 그 필드를 다시 검사한다(폼별 `submitted` 플래그. 생성 성공·대화상자 닫기 때 초기화).
- `required` 속성과 브라우저 기본 검증 말풍선은 쓰지 않는다(`novalidate`). Figma 문구와 위치를 지키고 브라우저마다 다른 말풍선을 피하기 위함이다.
- 대안: `doc/a11y-checklist.md`(삭제됨)의 "제출 후 폼 위에 오류 목록" → Figma에 없는 요소다. 필드별 문구, `aria-describedby`, 첫 오류 포커스로 같은 목적을 달성하므로 기각하고 보고에 적는다.

### D5. 대화상자는 네이티브 `<dialog>` + `showModal()`
- `#edit-dialog`, `#delete-dialog` 두 개를 페이지에 한 번만 두고 열 때 내용을 채운다. `aria-labelledby`로 제목을 연결한다.
- `showModal()`은 포커스 가두기, 배경 `inert`, Escape 닫기(`cancel` 이벤트), 최상위 레이어를 기본으로 제공한다(`doc/semantic-html-guide.md`(삭제됨) 권장).
- 오버레이 클릭: `dialog` 요소 자체에 `click`이 오고 `event.target === dialog`이면 닫는다. 대화상자 내부는 안쪽 래퍼가 패딩을 모두 갖게 해 내부 클릭이 dialog 자체로 잡히지 않게 한다.
- 초기 포커스는 `autofocus` 속성 대신 `showModal()` 직후 `focus()`로 지정한다(Edit → Question, Delete → Cancel).
- `close` 이벤트에서 포커스 복원: 저장하지 않고 닫았으면 연 카드의 메뉴 버튼으로, 삭제 성공이면 spec "삭제 후 포커스" 대상으로 옮긴다. 수정 성공이면 그 카드의 메뉴 버튼으로 옮긴다.
- 배경 스크롤은 `body:has(dialog[open]) { overflow: hidden }`으로 막는다.
- 대안: `div[role=dialog]` + 직접 포커스 트랩 → 코드가 늘고 `inert` 처리를 직접 해야 해서 기각.

### D6. 카드 메뉴는 disclosure 버튼 + 버튼 목록
- `<button aria-expanded aria-controls aria-label="Actions for: <질문>">` 다음에 `<ul hidden>` 안의 `<button>` Edit / Delete를 둔다. 기존 카테고리 필터(D6, 이전 change)와 같은 disclosure 방식이다. `role="menu"`는 화살표 키 이동 등 추가 계약이 생겨 쓰지 않는다.
- 열린 메뉴는 `state.openMenuId` 하나만 기억한다. 전역 Escape·바깥 클릭 핸들러가 "열린 대화상자 → 열린 메뉴 → 열린 카테고리 필터" 순서로 가장 위의 것 하나만 닫게 바꾼다. 대화상자의 Escape는 브라우저가 처리하므로 대화상자가 열린 동안 전역 핸들러는 아무것도 하지 않는다.

### D7. 그리드 렌더링과 포커스 유지
- `<ul class="c-card-grid" role="list">` 안에 카드마다 `<li><article aria-labelledby>`를 두고, 질문은 `<h3>`로 표시한다(보기 제목 `<h2>` 다음 단계).
- 그리드는 필터 결과·표시 개수·카드 변경 때 통째로 다시 그린다(최대 수십 장). 다시 그리기 전 포커스가 그리드 안에 있으면 `data-card-id`와 요소 종류를 기억했다가 복원한다(이전 change Risks의 포커스 복원 방식과 같음).
- 진행 표시·Mastered 배지는 Study Mode의 `renderStatus(card)`를 그대로 재사용한다.
- Load More 후 포커스는 `visible` 증가 전 마지막 위치 다음 카드의 메뉴 버튼으로 옮긴다.

### D8. 토스트
- 페이지에 토스트 하나를 두고 메시지와 닫기 버튼(`aria-label="Dismiss notification"`, `icon-cross.svg`)을 채운다. 새 토스트는 내용을 바꿔 이전 것을 대신한다.
- (구현 중 변경) 토스트 자체는 live 영역으로 두지 않는다. 숨겨진(`hidden`) 상태에서 나타나는 live 영역은 안내를 놓칠 수 있고, 닫기 버튼 이름까지 함께 읽힐 수 있다. 대신 항상 존재하는 공용 live 영역(`announce()`)으로 문구를 한 번만 안내한다.
- 5초 타이머를 쓰고 `mouseenter`/`focusin`이면 멈추고 `mouseleave`/`focusout`이면 다시 5초를 센다. 닫기 버튼에 포커스가 있는 상태에서 닫히면 포커스를 잃으므로, 이때는 `main`의 해당 보기 제목(`tabindex="-1"`)으로 포커스를 옮긴다.
- 위치: 데스크톱은 Figma처럼 위 116px·오른쪽 60px에 띄운다(`position: fixed`). 태블릿·모바일 프레임은 없어서, 헤더의 보기 전환 버튼을 가리지 않도록 화면 아래쪽 좌우 16px 안에 둔다.

### D9. SCSS 구성
- 변수: `$pink-700: #e11966` 추가, 필요한 그림자·간격 토큰을 Figma에서 확인해 추가한다.
- 파셜 추가: `_form-field`(라벨·입력·오류), `_card-grid`, `_grid-card`(카드·Answer·푸터), `_card-menu`, `_dialog`, `_toast`. 빈 상태는 Study Mode의 `.c-empty-state`를 재사용한다.
- 툴바·카테고리 필터·체크박스는 기존 컴포넌트를 재사용한다. 패널 id(`#study-category-panel`)가 보기마다 달라지도록 `aria-controls`·id를 보기별로 둔다.
- 그리드 열 수는 `$breakpoints`(768·1024)에 맞춘다. 3열 레이아웃이 1024px에서 좁으면 열 최소 폭을 측정해 보고하고 spec 갱신 여부를 사용자에게 묻는다.
- `* { max-inline-size: 60ch }` 예외 규칙 때문에 폼 입력·대화상자·카드 본문이 줄어들 수 있으므로, 필요한 요소만 `max-inline-size: none`을 지정하고 computed style로 확인한다.
- 긴 단어: 카드 질문·정답·태그에 `overflow-wrap: anywhere`를 지정한다.
- (구현 중 추가) 그리드 카드 푸터는 기본적으로 한 줄이며, 좁으면 진행 칸 대신 태그가 줄바꿈된다. 텍스트 200% 확대에서는 메뉴 버튼이 카드 밖으로 밀려나므로 카드를 `container-type: inline-size`로 두고 `@container (max-width: 13em)`에서만 푸터와 Mastered 배지를 줄바꿈한다. em 기준이라 기본 글꼴 크기에서는 어떤 화면 폭에서도 이 조건에 들지 않아 Figma 배치가 유지된다.
- (구현 중 추가) 전역 리셋의 `* { margin: 0 }`이 `<dialog>`의 가운데 정렬을, `* { max-inline-size: 60ch }`가 `<form>` 폭을 줄이므로 `.c-dialog { margin: auto }`, `.c-card-form { max-inline-size: none }`으로 되돌린다.
- (구현 중 추가) 그리드는 보이는 카드 내용이 바뀔 때만 다시 그리고, 메뉴 열림 상태는 속성만 바꾼다. 메뉴를 여닫을 때 버튼이 교체되면 마우스 클릭이 끊기고 포커스를 잃기 때문이다.

## Risks / Trade-offs

- [필터 상태 구조 변경으로 Study Mode 회귀] → 기존 Study Mode spec 시나리오(이동, 섞기, Hide Mastered, 빈 상태)를 회귀 검증 항목으로 tasks에 포함한다.
- [`<dialog>` 오버레이 클릭 판정] → 안쪽 래퍼가 패딩을 갖지 않으면 내부 여백 클릭에도 닫힌다. 브라우저에서 내부 여백 클릭을 따로 확인한다.
- [Firefox 미설치] → 이전 change처럼 Chromium으로만 검증하고 Firefox는 미검증으로 기록한다.
- [토스트 자동 닫힘과 스크린 리더] → `role="status"`는 내용이 바뀔 때 안내되므로, 같은 문구가 연속되면 비웠다가 다시 채운다(`announce()`와 같은 방식).
- [메뉴 버튼 이름이 길어짐] → 이름에 질문 전체가 들어가면 길다. `Actions for: <질문>` 형식을 유지하고 스크린 리더 확인 시 문제가 되면 보고한다.
- [README와 다른 점] → README는 "All Categories 선택 시 필터 해제"를 말하지만 이전 change에서 Figma 기준으로 결정했다. 이번 change도 같은 필터를 쓴다.
- [`dist` 보호] → `npm run build`/`dev`는 쓰지 않고 이전 change D10 방식(스크래치 폴더 미리보기)을 따른다.
