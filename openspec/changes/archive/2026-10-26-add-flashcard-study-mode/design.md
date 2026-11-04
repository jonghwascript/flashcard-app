# Design

## Context

- 동기와 범위는 proposal.md를 따른다. 요구 동작은 `specs/*/spec.md`가 기준이다.
- 저장소는 Gulp + SCSS + 정적 HTML 템플릿이다. `src/pages/index.html`은 `gulp-file-include`로 `dist/`에 출력되고, `src/*.json`과 `src/{js,images,fonts}`는 그대로 복사된다(`gulpfile.js`의 `staticTask`).
- 작업 규칙은 `AGENTS.md`, `doc/figma-guide.md`(삭제됨), `doc/figma-html-css.md`(삭제됨), `doc/scss-guide.md`(삭제됨), `doc/layout-guide.md`(삭제됨), `doc/semantic-html-guide.md`(삭제됨), `doc/a11y-checklist.md`(삭제됨)를 따른다.
- 현재 상태에서 확인한 사항:
  - `src/pages/index.html`에 미커밋 사용자 변경이 있다. README 화면 문구 나열, `<title>` 설정, stylesheet `<link>`와 attribution 삭제, 파비콘 경로가 `./assets/images/…`로 바뀜. 빌드 결과는 `dist/images/`이므로 이 경로는 404가 된다.
  - `src/js/main.js`는 비어 있고 jQuery는 `src/js/vendor/jquery-4.0.0.js`에 있다. `doc/figma-html-css.md`(삭제됨) §6은 `src/js/lib/`라고 적고 있어 문서와 실제 경로가 다르다.
  - `_variables.scss`에는 이전 챌린지 토큰(Roboto, grey/bg 색상)이, `_fonts.scss`에는 없는 Work Sans 파일이 등록되어 있다. `src/fonts/Poppins`에 Regular·Medium·SemiBold·Bold 정적 TTF가 있다.
  - `_base.scss`의 `* { max-inline-size: 60ch }` 예외 기반 규칙은 `button`, `p`, `span`, `label`, `dl` 등에 폭 제한을 건다.
  - `src/data.json`: 40장, 카테고리 11개, 초기 통계 Mastered 11 / In Progress 21 / Not Started 8(preview.jpg와 일치).
- 디자인 원본은 Figma다. 로컬 `flashcard-app.fig`는 MCP로 읽을 수 없으므로 구현 시작 시 사용자에게 Figma URL을 받는다. preview.jpg는 데스크톱 Study Mode 참고용일 뿐 구현 근거로 쓰지 않는다.

## Goals / Non-Goals

**Goals:**
- 이후 change(카드 관리, All Cards 목록)가 그대로 재사용할 상태 모델과 렌더링 구조를 만든다.
- 상태 변경 → 저장 → 다시 그리기 흐름을 한 방향으로 유지해 화면과 데이터가 어긋나지 않게 한다.

**Non-Goals:**
- 카드 생성·수정·삭제, 폼 검증, 토스트, 모달, All Cards 그리드·Load More(다음 change).
- 백엔드·API, 빌드 도구 변경, 새 npm 의존성 추가.
- Storybook 스토리 작성(필요하면 별도 요청).

## Decisions

### D1. 디자인 값은 Figma MCP에서 확정한다
구현 첫 작업으로 Figma URL을 받아 `get_metadata` → 프레임별 `get_design_context`·`get_screenshot` → `get_variable_defs` 순서로 값을 확보한다(`doc/figma-guide.md`(삭제됨) §2). 분기점, 색상·글꼴 토큰, 카드 뒷면 색, 빈 상태·드롭다운·hover 상태 디자인은 그 결과로 정한다.
- 대안: preview.jpg 기반 추정 → 모바일·태블릿·상태 프레임이 없어 기각(사용자 결정).
- Figma에서 Previous/Next가 경계에서 비활성으로 그려져 있거나 필터 버튼 라벨 규칙이 다르면, 구현 전에 spec을 갱신한다(`/opsx:update`).

### D2. 상태 모델: 단일 state 객체 + 순수 파생 함수
`main.js` 하나에 IIFE로 모듈을 구성한다(ES 모듈·번들러 없음).
```
state = {
  cards: [...],            // 원본 순서, 영속 대상
  view: 'study' | 'all',
  filter: { categories: Set, hideMastered: bool },
  order: [id...] | null,   // Shuffle 결과. 필터가 바뀌면 null로 되돌림
  index: 0,                // 학습 대상 집합 안의 위치
  flipped: false
}
```
- 학습 대상 집합은 `getStudySet(state)`로 매번 계산한다(카테고리 → hideMastered → order 적용). 통계는 `getStats(cards)`로 전체 카드에서 계산한다.
- 모든 조작은 `setState(patch)` → (cards가 바뀌었으면) `save()` → `render()` 순서로 처리한다. 부분 DOM 조작 대신 영역별 render 함수(`renderStudy`, `renderStats`, `renderFilter`)로 다시 그린다. 40장 규모라 성능 문제는 없다.
- 대안: 이벤트마다 DOM 직접 수정 → 필터·통계·카드가 서로 어긋나기 쉬워 기각.

### D3. jQuery 4는 DOM 선택·이벤트 위임에만 쓴다
`<script src="./js/vendor/jquery-4.0.0.js" defer>` 다음에 `<script src="./js/main.js" defer>`를 둔다. 이벤트는 `$(document).on('click', '[data-action=…]', …)`처럼 위임으로 연결해, 다시 그린 요소에도 핸들러가 유지되게 한다. 데이터 로드는 `fetch`를 쓴다(jQuery 4의 `$.getJSON`도 가능하지만 오류 처리를 `try/catch` 하나로 맞추기 위함).
- JS 선택자는 `data-action`, `data-js-*` 속성 또는 ID에 연결하고 스타일 클래스(`c-`, `l-`)에 의존하지 않는다.

### D4. 영속화: localStorage에 카드 배열만 저장
- 키 `flashcard-app:cards`, 값은 `{ version: 1, cards: [...] }` JSON.
- 읽기: 저장값이 있고 `cards`가 배열이며 각 항목이 필수 필드를 갖추면 사용, 아니면 `fetch('./data.json')`. 모든 저장소 접근은 `try/catch`로 감싼다.
- 필터·Shuffle 순서·현재 위치·보기는 저장하지 않는다(README가 요구하지 않음, 새 세션은 처음부터).
- `version`은 다음 change에서 카드 CRUD로 구조가 바뀔 때 마이그레이션 판단에 쓴다.

### D5. 카드 뒤집기 마크업
- 카드 전체를 `<button type="button" class="c-flashcard" aria-pressed="false">`로 만든다. 앞·뒷면은 버튼 안의 `<span>` 두 개(버튼 안에는 phrasing content만 허용)로 두고 CSS 3D(`transform: rotateY`, `backface-visibility`)로 회전한다.
- 숨겨진 면은 `aria-hidden="true"`로 읽기에서 제외한다. 뒤집으면 정답을 `aria-live="polite"` 영역(`u-sr-only`)에 "Answer: …"로 알린다.
- `prefers-reduced-motion: reduce`에서는 `transition: none`.
- 대안: `<details>` → 회전 애니메이션과 앞면 숨김 처리가 어렵고 상태 안내가 브라우저마다 달라 기각.

### D6. 카테고리 필터는 disclosure + 체크박스 목록
- `<button aria-expanded aria-controls>`가 `<div>` 패널을 열고, 패널 안은 `<fieldset>`(sr-only `<legend>Categories</legend>`) + 카테고리별 `<label><input type="checkbox">…<span>(count)</span></label>`. Figma(`425:7899`)에 맞춰 "All Categories" 항목은 두지 않고, 선택 없음을 전체로 본다. README의 "Selecting 'All Categories' clears any active filters" 문구와 다른 점은 구현 보고에 적는다.
- listbox/menu ARIA 패턴 대신 기본 체크박스를 써서 Space 토글·상태 안내를 브라우저에 맡긴다. Escape·바깥 클릭으로 닫고, Escape 시 버튼으로 포커스를 돌린다. 패널이 닫히면 `hidden`으로 탭 순서에서도 빠진다.
- 버튼 라벨은 항상 "All Categories"(Figma 기준, 사용자 결정). 카테고리는 이름 오름차순.
- 카테고리 목록과 개수는 `state.cards`에서 매번 계산한다(다음 change에서 카드 추가 시 자동 반영).

### D7. 보기 전환과 All Cards 자리
- 헤더 컨트롤은 `<button aria-pressed>` 두 개로 만든다(탭 패턴은 화살표 키 이동 등 추가 계약이 생겨 단순한 토글 버튼을 택함).
- 보기 영역은 `<section id="study-view">`, `<section id="all-cards-view">`이며 선택되지 않은 쪽은 `hidden`.
- All Cards 영역은 이번 change에서 제목만 있는 자리로 남기고 다음 change에서 채운다. 이 상태로 배포하지 않는다는 점을 보고에 명시한다.

### D7a. 빈 상태 두 종류
Figma `506:5399`·`506:5930`처럼 카드 컨테이너·액션·내비게이션 구역 전체를 빈 상태 블록으로 바꾼다(툴바는 유지).
- 전체 카드 0장: "No cards to study" + 안내 + "Go to All Cards"(Border 버튼, 실행 시 보기 전환).
- 카드는 있으나 Hide Mastered로 0장: "You’re all caught up!" + 안내, 버튼 없음.
- 두 블록과 카드 구역은 `hidden`으로 전환해 키보드 탐색에서도 빠지게 한다. 빈 상태 제목은 `<h2>`로 둔다.

### D8. 통계 마크업
`<dl class="c-stats">` 안에 항목별 `<div>`(dt 라벨, dd 숫자, 장식 아이콘 `alt=""`). `role="status"` 같은 live 영역은 두지 않는다(숙련도 버튼을 누를 때마다 통계까지 읽히면 중복 안내가 됨). 카드의 진행 표시 변화는 버튼 결과로 충분히 확인할 수 있다.

### D9. SCSS 구성
- 기반 교체: `_variables.scss`(Figma 토큰, `$font-primary: 'Poppins'`, `$breakpoints`), `_fonts.scss`(Poppins 400·500·600·700 `@font-face`, Work Sans 제거), `_base.scss`(body 배경·글자색·글꼴 토큰).
- 컴포넌트 파셜: `_button`, `_app-header`(로고·보기 전환), `_panel`(테두리 박스), `_toolbar`(필터·Hide Mastered·Shuffle), `_category-filter`, `_flashcard`, `_progress`, `_stats`, `_empty-state`. 페이지 배치는 `pages/_home.scss`.
- `* { max-inline-size: 60ch }` 때문에 버튼·라벨·`dl` 등이 의도치 않게 줄어들 수 있으므로, 컴포넌트에서 필요한 요소만 `max-inline-size: none`을 지정하고 computed style로 확인한다(전역 규칙 자체는 바꾸지 않음).
- 장식 별·배경 패턴은 CSS `background-image`(`../images/pattern-*.svg`)로 처리한다.

### D10. 미리보기와 검증 환경
- `npm run build`/`npm run dev`는 `dist`를 삭제하므로 쓰지 않는다. `doc/figma-guide.md`(삭제됨) §6 방법 A로 스크래치 폴더에 dist와 같은 구조를 만들고, `data.json`도 함께 복사한다.
- `fetch`는 `file://`에서 실패하므로 정적 HTTP 서버로 연다. 설치된 `browser-sync`를 `npx browser-sync start --server <폴더> --no-open --port 3001`처럼 스크래치 폴더 대상으로 실행한다(dist에 손대지 않음).
- 브라우저 검증은 `@playwright/test`의 Chromium. Firefox가 설치되어 있지 않으면 미검증으로 기록한다.

## Risks / Trade-offs

- [Figma URL이 제공되지 않음] → 1번 작업에서 멈추고 사용자에게 요청한다. 추정으로 진행하지 않는다.
- [사용자의 index.html 미커밋 변경] → 그 내용을 출발점으로 쓰되, stylesheet 링크 복원·파비콘 경로 `./images/favicon-32x32.png` 수정·attribution 처리 여부를 구현 보고에 명시한다.
- [All Cards 자리만 있는 상태] → 다음 change 전까지 All Cards 보기는 비어 있다. 단계별 change를 선택한 데 따른 의도된 중간 상태다.
- [다시 그리기 방식에서 포커스 유실] → 다시 그려지는 영역의 버튼(카드, 체크박스)은 render 전 포커스 대상의 `data-*` 식별자를 기억했다가 render 후 복원한다. 키보드 검증 항목에 포함한다.
- [Hide Mastered 중 카드가 Mastered가 되어 사라짐] → spec대로 같은 index의 다음 카드를 보여 주고, index가 범위를 넘으면 0으로 돌린다. 포커스는 카드 버튼에 남긴다.
- [`data.json` 경로] → 빌드 출력 기준 `./data.json`. 미리보기 폴더에서도 같은 위치에 복사한다.
- [알려진 한계: 320px + 브라우저 기본 글꼴 32px] → 이 조합에서만 가로 30px 넘침이 남는다("All Categories"·"All Cards" 버튼 글자가 줄바꿈되지 않고 이전/다음 줄이 빠듯함). 기본 글꼴 기준 320px 리플로(WCAG 1.4.10)와 375px 이상 + 글꼴 32px은 통과한다. 사용자 결정으로 이번 change에서는 수정하지 않는다.
- [문서-코드 불일치: jQuery 경로] → `doc/figma-html-css.md`(삭제됨)의 `src/js/lib/` 표기는 이번 change에서 고치지 않고 보고만 한다(문서 수정은 범위 밖).

## Figma 확인 결과

1.2에서 확인한 토큰·상태·반응형 값과 자산 대응은 [figma-notes.md](figma-notes.md)에 정리했다. 분기점은 768px / 1024px이다(사용자 결정). 숙련 카드는 Mastered 배지와 비활성 "Already Mastered" 버튼으로 표시한다.
