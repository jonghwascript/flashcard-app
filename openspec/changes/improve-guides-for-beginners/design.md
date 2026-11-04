# Design

## Context

동기는 proposal.md의 Why를 따른다.

**가이드 현황**

| 문서 | 줄 수 | 성격 |
| --- | --- | --- |
| `scss-guide.md` | 512 | 핵심 원칙과 14개 절. 예시 대부분이 이전 프로젝트(BMI Calculator)의 것 |
| `layout-guide.md` | 447 | `l-` 패턴 레퍼런스와 `c-`·`u-`·`is-` 설명. 14행에 "앱 전용 배치는 app-layout에 두며 컴포넌트보다 먼저 로드"라고 적혀 있다 |
| `scss-comment-guide.md` | 200 | 주석 절차, 정확성 체크리스트, 검증 명령, AI 프롬프트 |

**SCSS 현황**

- `style.scss`의 로드 순서: base → `layout/every-layout` → `layout/app-layout` → components(skip-link … toast) → `pages/home` → utilities
- 앱 전용 `l-` 규칙은 지금 모든 컴포넌트보다 먼저 출력된다.
- `tests/layout/structure.cjs:19`는 `_app-layout.scss`를 직접 컴파일해 "쓰이지 않는 앱 레이아웃 클래스"를 검사한다.
- `tests/layout/README.md`의 책임 경계 표는 클래스 단위로 적혀 있어 파일을 옮겨도 대부분 유효하다.

## Goals / Non-Goals

**Goals:**

- 한 요소의 배치(`l-`)와 겉모양(`c-`) 규칙을 한 파일에서 읽을 수 있다.
- 이동 전후에 모든 화면 상태의 computed style이 같다.
- 초급 개발자가 입문 문서에서 출발해 필요한 가이드 절로 이동하고, 각 규칙의 이유와 판단 기준을 알 수 있다.

**Non-Goals:**

- 선택자·값·HTML 클래스·JavaScript는 바꾸지 않는다.
- 새 파일 위치 규칙 외에는 가이드 규칙의 의미를 바꾸지 않는다. 기존 규칙끼리 상충하는 곳은 사실과 위치만 표시한다.
- 예시 교체, 분량 축소, 구현 불일치 수정은 하지 않는다(proposal.md Impact 참고).

## Decisions

### 1. 이동 대응표

규칙마다 HTML에서 함께 쓰이는 `c-` 블록을 확인하고, 그 블록을 정의한 파일로 옮긴다.

| 옮길 규칙 | 대상 파일 | 근거 (함께 쓰이는 클래스) |
| --- | --- | --- |
| `.l-app` | `pages/_home.scss` | `c-app l-app` |
| `.l-app-header`, `__title`, `.l-view-toggle` | `components/_app-header.scss` | `c-app-header`, `c-view-toggle` |
| `.l-toolbar`, `__filters` | `components/_toolbar.scss` | `c-toolbar l-toolbar` |
| `.l-category-filter`, `__toggle`, `__panel` | `components/_category-filter.scss` | `c-category-filter` |
| `.l-study`, `.l-study-panel*`, `.l-study-card`, `.l-empty-state`, `__text` | `components/_study.scss` | `c-study`, `c-flashcard l-study-card`, `c-empty-state` 기본 규칙이 이 파일에 있다 |
| `.l-stats`, `__list` | `components/_stats.scss` | `c-stats l-stats` |
| `.l-card-form`, `__actions`, `__actions--end` | `components/_form-field.scss` | `c-card-form`에는 스타일이 없다. 폼 필드 파일이 가장 가깝다 |
| `.l-all-cards`, `.l-card-grid`, `__item`, `.l-pagination`, `.l-empty-state.l-empty-state--plain` | `components/_card-grid.scss` | 전체 카드 보기의 `c-pagination`, `c-empty-state--plain`이 이 파일에 있다 |
| `.l-grid-card*`, `@container` 두 블록 | `components/_grid-card.scss` | `c-grid-card l-grid-card`. `container-type`도 이 파일에 있다 |
| `.l-card-menu`, `__list` | `components/_card-menu.scss` | `c-card-menu` |
| `.l-dialog`, `__scroll`, `.l-card-form .l-dialog__title`, `body:has(.l-dialog[open])` | `components/_dialog.scss` | `c-dialog l-dialog`. 맥락 규칙은 대상인 `l-dialog__title`을 따른다 |
| `.l-toast` | `components/_toast.scss` | `c-toast l-toast` |

- `c-` 짝이 없는 `l-all-cards`·`l-study`는 그 보기의 주 컴포넌트 파일로 보낸다. 가이드의 판단 기준도 이 원칙으로 적는다.
- 페이지 전용 파일을 새로 만드는 대안은 파일 수만 늘리므로 채택하지 않는다.

### 2. 파일 안에서의 위치

옮긴 `l-` 규칙은 각 파일의 `@use` 바로 다음, 즉 그 파일의 `c-` 규칙보다 앞에 둔다. 같은 파일 안에서는 이전과 같이 "`l-`이 먼저, `c-`가 나중" 순서가 유지된다.

규칙과 함께 있던 `// 관계:`·`// 제한:`·`// 전환:` 주석도 그대로 옮긴다.

### 3. 출력 순서 변화를 검증하는 방법

파일 사이의 순서는 달라진다. 예를 들어 `_card-menu.scss`의 `l-` 규칙은 이제 그보다 앞에 로드되는 `_grid-card.scss`의 `c-` 규칙보다 뒤에 출력된다.

같은 명시도에 같은 속성을 가진 규칙이 같은 요소에 걸리면 결과가 바뀔 수 있다. 다음 세 단계로 확인한다.

1. **규칙 보존**: 이동 전후 compressed CSS를 규칙 단위로 나눠 정렬한 목록이 같아야 한다. 그러면 규칙은 하나도 빠지거나 바뀌지 않고 순서만 달라졌다는 뜻이다.
2. **충돌 후보**: 옮긴 `l-` 규칙과 상대 순서가 뒤바뀐 `c-`·`u-` 규칙 중, 같은 속성을 선언하고 같은 요소에 함께 쓰이는 쌍을 찾는다. 함께 쓰이는지는 `render-html.cjs`의 조합 HTML과 `main.js` 생성 마크업에서 확인한다. 후보가 있으면 실제 승자가 바뀌는지 판정한다.
3. **화면 동일성**: 아래 조건에서 모든 요소와 가상 요소의 computed style 및 `getBoundingClientRect()`를 이동 전후로 비교한다. 차이는 0이어야 한다.
   - 화면 너비: 320, 767, 768, 1023, 1024, 1440px
   - 상태: 기본, 메뉴 열림, 필터 열림, dialog 열림, 토스트

   기존 `tests/layout/app.cjs`·`overlays.cjs`·`stress.cjs`도 실행한다.

차이가 나오면 값이나 선택자를 고치지 않는다. 해당 규칙의 파일 안 위치를 조정하거나, 사용자에게 보고한다.

### 4. 테스트 스크립트

`structure.cjs`는 앱 전용 클래스를 `style.scss` 전체 출력의 `l-` 클래스에서 `layout/_every-layout.scss` 출력의 `l-` 클래스를 뺀 집합으로 구한다. "쓰이지 않는 앱 레이아웃 클래스" 검사의 의미는 그대로 유지된다.

`tests/layout/README.md`에서 `_app-layout.scss`를 전제로 한 문장만 고친다.

### 5. 가이드 수정 방식

- **입문 문서**: `doc/scss-getting-started.md`(삭제됨)를 따로 만든다. 각 가이드에 입문 내용을 넣으면 같은 안내가 반복되고 절 번호가 밀린다. 담을 내용은 다음과 같다.
  - 읽는 순서
  - 첫 작업 흐름: 파일 찾기 → 접두사 고르기 → 단위 고르기 → 검사 명령 → 주석. 명령은 AGENTS.md의 것을 쓴다.
  - 용어집: 가이드에 실제로 나오는 용어만 넣고, 용어마다 한 줄 정의, 저장소 내 사용 위치, 관련 절 링크를 단다.
- **"왜" 보강**: 규칙 바로 아래에 "이유:"·"판단 기준:"을 1~3문장으로 붙인다. 별도 FAQ로 빼면 규칙과 이유가 떨어져 읽히므로 채택하지 않는다. 이미 이유가 충분한 절(예: `scss-guide.md` §3, §9)은 손대지 않는다.
- **파일 위치 규칙의 새 문구**: `scss-guide.md` §1 폴더 구조와 `layout-guide.md` 14행에 넣는다.
  - `layout/`에는 여러 앱에서 재사용하는 공통 패턴만 둔다.
  - 앱 전용 `l-` 규칙은 함께 쓰는 `c-` 블록의 파일 맨 앞에 둔다.
  - `c-` 짝이 없으면 그 보기의 주 컴포넌트 파일에 둔다.
  - 이유: 한 요소를 고치거나 지울 때 한 파일만 보면 된다.
  - 대가: 파일 사이의 출력 순서가 컴포넌트 로드 순서를 따른다.
- **절 번호와 앵커 유지**: 다른 문서가 `§N`이나 `#…` 앵커로 참조하므로 기존 번호와 제목을 유지한다. 제목을 바꾸면 그 앵커의 참조를 함께 고친다.
- **범위 밖 항목 표시**: 이전 프로젝트 경로, `check:layout`, 미구현 옵션에는 "이전 프로젝트 예시", "이 저장소에 없음", "현재 미구현" 표시만 붙인다.

### 6. 작업 순서

코드를 먼저 옮기고 검증한 뒤 가이드를 쓴다. 가이드의 파일 위치 예시와 판단 기준이 실제 결과와 일치해야 하기 때문이다.

## Risks / Trade-offs

- [파일 사이 순서가 바뀌어 같은 명시도의 승자가 달라짐] → Decision 3의 세 단계로 확인한다. 차이가 나면 위치를 조정하거나 보고하고, 값은 바꾸지 않는다.
- [앱 배치를 한눈에 비교하기 어려워짐(분기점별 열 수 등)] → 입문 문서에 "보기별 배치를 찾는 법(어느 파일에 무엇이 있는지)" 표를 둔다.
- [기존 테스트·문서가 삭제된 파일을 참조함] → 작업 전에 `_app-layout`·`app-layout` 참조를 검색해 목록을 만든다. 과거 기록(archive, `guide-compliance-review.md`)은 제외하고 모두 갱신한다.
- [브라우저 검증 환경 부족] → Chrome으로 우선 검증한다. Firefox를 실행할 수 없으면 미검증으로 보고한다.
- [설명이 늘어 문서가 길어짐] → 규칙당 1~3문장으로 제한하고, 입문 문서에서 "처음엔 이 절만"을 안내한다.
- [용어 정의 오류] → 저장소 코드의 실제 쓰임을 확인한다. 브라우저 동작은 근거가 확인된 범위로만 쓴다.
