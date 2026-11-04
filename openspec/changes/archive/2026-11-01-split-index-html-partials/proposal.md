# Proposal

## Why

`src/pages/index.html`은 669줄에 헤더·두 보기·폼·통계·알림·대화상자를 모두 담고 있어 수정 대상을 찾기 어렵다. 기존 HTML include 도구를 활용해 화면 영역별 소스를 나누고 진입 파일에서 페이지 구성을 쉽게 파악하도록 한다.

## What Changes

- `index.html`은 문서 골격과 include 조합을 담당하고, 완결된 화면 영역은 `src/partials/`로 분리한다.
- 헤더, 학습 화면과 통계, 전체 카드 화면과 생성 폼, 편집·삭제 대화상자, 토스트를 역할별 파일로 관리한다.
- Gulp의 기존 `@@`·`@file` 방식으로 빌드 시 조합한다. 생성된 DOM·클래스·ID·ARIA·텍스트·자산 경로와 사용자 동작을 보존한다.
- 원본 index를 직접 복사·분석하는 기존 레이아웃 검증 도구를 조합된 HTML 기준으로 변경하고, 분리 전후 DOM 동등성과 include 누락 여부를 검증한다.
- 부분 파일 구성과 안전한 임시 미리보기 실행 방법을 문서화한다.

## Capabilities

### New Capabilities

없음. 소스 파일 구성만 바꾸는 리팩터링으로 `skip_specs: true`를 사용한다.

### Modified Capabilities

없음. app-shell 등 기존 기능 명세의 요구사항과 시나리오는 변경하지 않는다.

## Impact

- 대상: `src/pages/index.html`, 새 `src/partials/` 파일, `tests/layout/helpers.cjs`·`app.cjs`·`structure.cjs`와 관련 검증·설명 문서.
- 기존 `gulp-file-include` 의존성과 Gulp 페이지 입력·include 설정·감시 범위를 유지한다. 런타임 HTML 로딩·프레임워크·새 의존성은 도입하지 않는다.
- SCSS, 앱 상태·저장 로직, 디자인과 사용자 기능 개편은 제외한다. `dist` 수정·삭제 및 build/dev 실행 없이 저장소 밖 임시 출력으로 검증한다.
