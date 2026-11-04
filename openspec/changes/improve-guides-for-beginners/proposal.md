# Proposal

## Why

SCSS·레이아웃 가이드 3종(`doc/scss-guide.md`(삭제됨), `doc/layout-guide.md`(삭제됨), `doc/scss-comment-guide.md`(삭제됨))은 규칙은 충분하지만 초급 개발자가 읽기 어렵다. 이유는 세 가지다.

- 어디서부터 읽을지 안내가 없다.
- 명시도·캐스케이드·포함 블록·논리 속성 같은 용어를 설명 없이 쓴다.
- 여러 규칙이 "무엇을 하라"만 적고, "왜 그런지"와 "어떻게 판단하는지"를 생략한다.

또 현재 가이드는 앱 전용 배치를 `layout/_app-layout.scss` 한 파일에 모으게 한다. 그 결과 한 컴포넌트의 스타일이 두 파일로 나뉜다. 예를 들어 카드 메뉴의 `border-radius`는 `_card-menu.scss`에, 그 모서리 밖을 자르는 `overflow: hidden`은 `_app-layout.scss`에 있다. 초급자는 한 요소를 고치려고 두 파일을 오가야 하고, 컴포넌트를 지울 때 관련 규칙을 놓치기 쉽다.

## What Changes

**가이드 규칙 변경**

- 앱 전용 `l-` 규칙은 함께 쓰이는 `c-` 블록의 파일(`components/` 또는 `pages/`)에 둔다.
- `layout/`에는 Every Layout 공통 패턴(`_every-layout.scss`)만 남긴다.
- `l-`/`c-` 접두사로 책임(배치 대 겉모양)을 나누는 규칙은 유지한다.
- 이번 변경에서 규칙의 의미가 바뀌는 곳은 이 파일 위치 규칙 하나뿐이다.

**SCSS 이동** (**BREAKING**: 파일 구조 변경)

- `layout/_app-layout.scss`의 규칙을 design.md의 대응표에 따라 각 컴포넌트·페이지 파일로 옮긴다.
- 그다음 `_app-layout.scss` 파일과 `style.scss`의 `@use`를 제거한다.
- 선택자와 선언 값은 바꾸지 않는다. 이동만 한다.

**검증 스크립트 갱신**

- `tests/layout/structure.cjs`는 현재 `_app-layout.scss`를 직접 컴파일한다.
- 이를 "전체 CSS의 `l-` 클래스에서 Every Layout 클래스를 뺀 집합"으로 앱 전용 클래스를 구하도록 바꾼다.

**입문 문서 추가**

- `doc/scss-getting-started.md`(삭제됨)를 새로 만든다.
- 읽는 순서, 첫 SCSS 수정 흐름, 가이드 용어집을 담는다.

**규칙마다 "왜" 보강**

- 세 가이드의 규칙에 이유, 판단 기준, 필요한 곳의 ✗/✓ 예시를 덧붙인다.
- 새 파일 위치 규칙에는 다음을 설명한다.
  - "이 `l-` 규칙은 어느 파일에 두는가"라는 판단 질문
  - `c-` 짝이 없는 클래스를 처리하는 방법

**링크 수정**

- `scss-guide.md:3`의 존재하지 않는 `pattern.md` 링크를 고친다.
- 입문 문서와 세 가이드 사이의 상호 링크를 추가한다.

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

없음. CSS 규칙의 파일 위치만 바뀐다. 화면 동작과 `layout-patterns`·`app-shell` 등 기존 요구사항은 그대로이므로 `skip_specs: true`를 사용한다.

## Impact

**SCSS**

- 삭제: `src/scss/layout/_app-layout.scss`
- 수정: `src/scss/style.scss`, `src/scss/pages/_home.scss`
- 수정: `src/scss/components/` 아래 파일
  - `_app-header`, `_toolbar`, `_category-filter`, `_study`, `_stats`
  - `_form-field`, `_card-grid`, `_grid-card`, `_card-menu`, `_dialog`, `_toast`

**출력 순서**

- 지금은 앱 전용 `l-` 규칙이 모든 컴포넌트보다 먼저 출력된다.
- 이동 후에는 각 컴포넌트 파일 위치에서 출력된다.
- 같은 명시도의 규칙끼리 이기는 쪽이 바뀔 수 있으므로, 컴파일 CSS와 브라우저 computed style로 화면이 그대로인지 확인한다.

**문서·테스트**

- 수정: `doc/scss-guide.md`(삭제됨), `doc/layout-guide.md`(삭제됨), `doc/scss-comment-guide.md`(삭제됨), `tests/layout/structure.cjs`, `tests/layout/README.md`
- 추가: `doc/scss-getting-started.md`(삭제됨)
- 다른 문서가 세 가이드를 절 번호(`§2`, `§8`)로 참조하므로 절 번호는 유지한다.
- `doc/guide-compliance-review.md`(삭제됨)와 archive된 OpenSpec 변경은 과거 기록이므로 고치지 않는다.

**범위 밖**

- BMI Calculator 예시를 flash-app 코드로 바꾸는 작업
- 분량 축소
- 나머지 `doc/`(삭제됨) 문서
- 문서와 구현의 불일치 수정(`data-space`·`data-gap` 미구현, `check:layout` 부재)
- 이동하면서 발견하는 정리 후보(이중 클래스 명시도, 중복 `@container`, `overflow` 위치 판단)

범위 밖 항목은 고치지 않고 완료 보고에 기록한다. 입문자를 오해하게 만드는 곳에는 짧은 표시만 붙인다.

API, 의존성, 런타임 JavaScript에는 영향이 없다. `dist`를 지우는 `build`·`dev`는 실행하지 않는다.
