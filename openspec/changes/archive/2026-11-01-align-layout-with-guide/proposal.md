# Proposal

## Why

`doc/layout-guide.md`(삭제됨)가 참조하는 공통 레이아웃 모듈이 현재 없고, 앱의 컴포넌트가 외부 배치까지 직접 담당한다. 가이드의 레이아웃 API를 제공하고 앱 전체에서 배치와 외형의 책임을 분리해 구현과 문서를 일치시킨다.

## What Changes

- `_every-layout.scss`와 진입점의 로딩을 복구하고 가이드에 열거된 패턴·옵션을 제공한다. Stack의 data-space와 Cluster의 data-gap 프리셋을 구현한다.
- 정적 HTML과 JavaScript 생성 DOM 모두에 레이아웃 클래스를 조합한다. 앱 셸, 헤더, 툴바, 학습 영역, 통계, 카드 목록, 폼, 메뉴, 대화상자, 토스트의 외부 크기·위치·간격은 레이아웃이 소유한다.
- 컴포넌트의 외형·내부 표현·상태를 보존하며 기존 기능·ARIA·포커스·저장 형식을 유지한다. 320px 및 글꼴 확대에서 드러난 배치 넘침을 함께 해결한다.
- 가이드의 모순된 예시와 Cover의 높이·중앙 배치 설명은 실제 계약에 맞게 한정적으로 정리한다. 일반적인 클래스 이름 예시를 모두 새 기능으로 만들지는 않는다.

## Capabilities

### New Capabilities

- `layout-patterns`: 페이지 작성자가 재사용할 수 있는 레이아웃 패턴, 간격 옵션, 중첩과 반응형 배치 계약.

### Modified Capabilities

없음. 앱의 기존 반응형·접근성·사용자 기능 요구사항은 그대로 유지하며 충족 여부를 재검증한다.

## Impact

- `src/scss/layout/`, `src/scss/style.scss`, 컴포넌트·페이지 SCSS, `src/pages/index.html`, `src/js/main.js`의 마크업 생성·필요한 선택자 연결, `doc/layout-guide.md`(삭제됨)에 영향을 준다.
- 새 외부 의존성, Storybook 재도입, 데이터 모델 변경, 배포는 포함하지 않는다. 기존 감사 보고서는 과거 기록으로 유지한다.
- `dist`를 수정·삭제하지 않고 저장소 밖 임시 미리보기와 Sass API로 검증한다. 이번 단계는 계획 문서만 작성한다.
