# Proposal

## Why

현재 SCSS에는 배치 의존성을 설명하는 주석과 속성 번역·px 환산·과거 수정 이력이 섞여 있다. `doc/scss-comment-guide.md`(삭제됨)를 기준으로 실제 코드와 일치하는 짧은 레이아웃 설명을 남겨 유지보수 시 배치 조건을 파악하기 쉽게 한다.

## What Changes

- `src/scss/style.scss`의 로딩 순서를 따라 페이지·컴포넌트와 공통 레이아웃의 의미 있는 배치 주석을 정리한다. 별도 대상 지정이 없어 가이드의 기본 범위를 적용한다.
- `// 관계:`, `// 제한:`, `// 전환:` 형식으로 레이아웃 단위당 3~5줄 이내로 작성하며 의미 없는 항목은 생략한다.
- DOM, 공통 스타일, 믹스인, 상태 변경 스크립트로 확인한 조건을 설명하고 유용한 기존 주석은 유지한다.
- 수정은 `//` 주석에 한정한다. 선언·선택자·변수·HTML·JavaScript·기존 블록 주석·가이드 문서·생성 결과는 변경하지 않는다.
- 구현 시 주석 외 코드 동일성과 수정 전후 컴파일 CSS 동일성을 확인한다.

## Capabilities

### New Capabilities

없음. 소스 주석만 변경하므로 `skip_specs: true`를 사용한다.

### Modified Capabilities

없음. 기존 기능 요구사항과 사용자 동작은 유지한다.

## Impact

- 수정 대상: `src/scss/pages/`, `src/scss/components/`, `src/scss/layout/`의 레이아웃 주석. 진입점·abstracts·base·utilities는 연결 근거로 읽고 해당 배치 설명에 필요한 `//` 주석만 보완한다.
- API, 의존성, 런타임 동작에는 변경이 없다.
- `.gitignore`와 미추적 `doc/scss-comment-guide.md`(삭제됨)의 기존 사용자 변경은 보존한다.
- `dist`를 삭제하는 build/dev는 실행하지 않는다. Sass API로 메모리에서 CSS를 비교한다.
