# Tasks

## 1. 기준 보관과 include 검증 경로

- [x] 1.1 분리 전 index 원본·브라우저 DOM 기준·두 보기와 열린 대화상자 캡처·dist 해시를 저장소 밖 임시 폴더에 보관한다. 현재 Git 상태와 감시 프로세스를 읽기 전용으로 확인하고 기준 파일이 존재하는지 검증한다.
- [x] 1.2 `tests/layout/render-html.cjs`에 실제 `gulp-file-include`와 동일한 prefix/basepath를 사용하는 공통 렌더러를 작성한다. 임시 fixture로 단일·중첩 상대 include의 조합 결과와 누락 파일의 오류·실패 종료를 검증하고 실행 방법을 `tests/layout/README.md`에 기록한다. gulpfile의 태스크나 dest는 실행하지 않는다.

## 2. 화면 영역 분리와 기존 검증 연결

- [x] 2.1 설계의 8개 부분 파일로 완결된 영역을 이동하고 index를 문서 골격과 include 조합으로 줄인다. index가 통상 포맷에서 80줄 이내인지, include 깊이가 최대 두 단계인지, 조합 결과에 미해석 구문이 없는지 확인하고 기준 DOM과 요소·속성·문구·자산 URL·의미 있는 공백을 비교한다.
- [x] 2.2 `helpers.cjs`·`app.cjs`·`structure.cjs`가 원본 index 대신 공통 렌더러의 조합 결과를 사용하도록 변경한다. async 오류 종료를 확인하고 `node tests/layout/structure.cjs`에서 기존 39개 클래스 연결이 유지되며 각 미리보기에 실제 폼·카드·대화상자가 포함되는지 검증한다.
- [x] 2.3 `doc/gulp.md`(삭제됨)에 부분 파일 구성과 @file 상대 경로, 기존 watch와 출력 경로, dist를 쓰지 않는 검증 방법을 추가하고 `tests/layout/README.md`의 입력·미리보기 설명을 갱신한다. 문서 링크가 존재하고 예시 include 경로가 실제 파일 기준으로 해석되는지 확인한다.

## 3. 조합 결과 통합 검증

- [x] 3.1 최신 조합 HTML에서 기존 app·overlay·stress 검사를 실행한다. 두 보기, 학습·필터·카드 생성/편집/삭제·추가 로딩·빈 상태, 키보드·ARIA·포커스 복원과 320·375·767·768·1023·1024·1440px·가로 667×375·root16/32 배치를 확인하고 기준 캡처와 비교한다. 실행 가능한 Chrome·Firefox와 미검증 조건을 구분해 기록한다.
- [x] 3.2 공통 패턴 검사, 검증 스크립트의 `node --check`, 출력 없는 Sass API 컴파일과 `git diff --check`를 실행하고 dist 해시·SCSS·앱 로직 보존 여부를 확인한다. 실행한 검사·남은 한계·임시 증거 위치를 `tests/layout/README.md`에 기록한다. dist 삭제·직접 쓰기 및 build/dev는 실행하지 않는다.
