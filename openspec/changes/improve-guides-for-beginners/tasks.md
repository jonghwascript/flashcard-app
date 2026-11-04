# Tasks

## 1. 기준 확보

- [x] 1.1 `git status`로 미커밋 변경을 기록한다. 이어서 아래 기준 자료를 저장소 밖 임시 폴더에 보관하고, 각 파일이 생성되었는지 확인한다.
  - Sass API로 만든 compressed CSS
  - 규칙 단위로 정렬한 목록
  - computed style·rect 스냅샷: 320/767/768/1023/1024/1440px × 기본·메뉴 열림·필터 열림·dialog 열림·토스트 상태
- [x] 1.2 아래 두 참조 목록을 만든다. 과거 기록(archive, `guide-compliance-review.md`)을 뺀 갱신 대상이 구분되는지 확인한다.
  - 저장소 전체(`node_modules`·`dist` 제외)의 `_app-layout`·`app-layout` 참조
  - `doc/`(삭제됨)·`AGENTS.md`의 세 가이드 파일명과 `§`·`#` 앵커 참조

## 2. SCSS 이동

- [x] 2.1 design.md Decision 1의 대응표대로 `_app-layout.scss`의 규칙을 주석과 함께 각 파일의 `@use` 바로 다음으로 옮긴다. 대상은 `pages/_home.scss`, `_app-header`·`_toolbar`·`_category-filter`·`_study`·`_stats`다. `node -e "require('sass').compile('src/scss/style.scss')"`가 성공하는지 확인한다.
- [x] 2.2 나머지 규칙을 `_form-field`·`_card-grid`·`_grid-card`·`_card-menu`·`_dialog`·`_toast`로 같은 방식으로 옮긴다. 그다음 `_app-layout.scss`를 삭제하고 `style.scss`의 `@use 'layout/app-layout'`을 제거한다. 컴파일이 성공하는지, 이동 전후의 정렬된 규칙 목록이 완전히 같은지 확인한다.
- [x] 2.3 순서가 뒤바뀐 `l-`과 `c-`·`u-` 규칙 쌍 중 같은 속성이 같은 요소에 걸리는 충돌 후보를 찾는다. 요소를 함께 쓰는지는 조합 HTML과 `main.js` 생성 마크업으로 확인한다. 후보마다 승자가 바뀌는지 판정해 기록한다.
- [x] 2.4 1.1과 같은 조건으로 스냅샷을 찍어 비교한다. 같은 빌드로 두 번 찍어 차이가 0인지 먼저 확인한 뒤, 이동 전후 차이도 0인지 확인한다. 차이가 나면 값은 바꾸지 않고 파일 안 위치를 조정하거나 사용자에게 보고한다.

## 3. 테스트 스크립트

- [x] 3.1 `tests/layout/structure.cjs`가 앱 전용 클래스를 "전체 CSS의 `l-` 클래스에서 `_every-layout.scss`의 `l-` 클래스를 뺀 집합"으로 구하도록 바꾼다. `tests/layout/README.md`에서 `_app-layout.scss`를 전제한 문장을 고친다. `node tests/layout/structure.cjs`가 PASS인지 확인한다. 쓰이지 않는 `l-` 클래스를 임시로 추가하면 실패하는지도 저장소 밖 복사본에서 확인한다.
- [x] 3.2 `node tests/layout/app.cjs`, `overlays.cjs`, `stress.cjs`를 Chrome으로 실행해 통과하는지 확인한다. Firefox는 실행할 수 있으면 `LAYOUT_BROWSER=firefox`로 실행하고, 없으면 미검증으로 기록한다.

## 4. 입문 문서

- [x] 4.1 `doc/scss-getting-started.md`(삭제됨)를 작성한다. 다음 내용을 담는다.
  - 읽는 순서와 각 가이드의 용도
  - 첫 SCSS 수정 흐름. AGENTS.md의 검사 명령을 쓰고, `dist`를 지우는 `build`·`dev`는 실행하지 말라는 주의를 넣는다.
  - 보기·컴포넌트별로 배치(`l-`)와 겉모양(`c-`)이 있는 파일을 정리한 표. 2장의 이동 결과를 반영한다.

  모든 상대 링크 대상이 존재하는지, 표의 파일·클래스가 실제 SCSS와 일치하는지 grep으로 확인한다.
- [x] 4.2 같은 문서에 용어집을 추가한다. 세 가이드에 실제로 나오는 용어만 넣고, 용어마다 한 줄 정의, 저장소 내 사용 위치, 관련 절 링크를 단다. 각 용어가 가이드 본문에서 검색되는지, 사용 위치가 현재 소스에 있는지 확인한다.

## 5. scss-guide.md

- [x] 5.1 다음을 수정한다. 링크 대상이 존재하고 §1 트리가 실제 `src/scss` 구조와 일치하는지 확인한다.
  - `pattern.md` 링크를 `layout-guide.md`로 고친다.
  - 머리말에 입문 문서 링크와 "이전 프로젝트 예시" 표시를 추가한다.
  - §1 폴더 구조에 새 파일 위치 규칙, 이유, 대가, `c-` 짝이 없는 클래스의 판단 기준을 쓴다.
- [x] 5.2 §2·§4·§5·§7·§8·§10·§11에서 이유나 판단 기준이 빠진 규칙에 "이유:"·"판단 기준:"을 1~3문장씩 붙인다. §2에는 `l-`/`c-` 판단 질문을 넣는다. `check:layout`과 BMI 경로에는 "이 저장소에 없음" 또는 "이전 프로젝트 예시" 표시를 붙인다. diff에서 파일 위치 규칙 외의 허용·금지 대상과 절 번호·제목이 바뀌지 않았는지 확인한다.

## 6. layout-guide.md

- [x] 6.1 14행의 app-layout 문장을 새 파일 위치 규칙으로 바꾸고, 이유와 판단 질문, 입문 문서 링크를 넣는다. 미구현 `data-space`·`data-gap`과 inline style 예시에는 "현재 미구현" 또는 "설명용 예시" 표시를 붙인다. 링크가 실제 파일을 가리키는지, 표시 내용이 `guide-compliance-review.md` 기록과 일치하는지 확인한다.
- [x] 6.2 `c-`·`u-`·`is-` 절에 책임 구분의 이유와 판단 기준을 보강한다. 기존 규칙끼리 상충하는 곳(버튼 margin 예시, 단일 책임 예외)은 해석하지 않고 상충 사실만 표시한다. diff에서 규칙 의미와 `## .l-*` 제목 앵커가 유지되는지 확인한다.

## 7. scss-comment-guide.md

- [x] 7.1 관계·제한·전환 구분과 compressed 출력으로 비교하는 이유에 초급자용 설명을 짧게 덧붙이고, 입문 문서 링크를 추가한다. 검증 명령 블록과 재사용 프롬프트 템플릿이 diff에서 바뀌지 않았는지 확인한다.

## 8. 통합 검증

- [x] 8.1 아래 항목을 모두 확인하고 완료 보고를 작성한다.
  - 1.2의 참조 목록을 다시 검사해 갱신 대상에 `_app-layout` 참조가 남지 않았는지, 모든 링크·`§`·`#` 앵커가 존재하는지 확인한다.
  - `node --check src/js/main.js`와 SCSS 컴파일을 다시 실행한다.
  - `git diff --check`를 통과시키고, 전체 diff가 proposal.md Impact의 파일로만 이루어졌는지 확인한다.

  완료 보고에는 다음을 적는다.
  - 이동 결과
  - 충돌 후보 판정
  - 스냅샷 비교 결과
  - 실행한 브라우저·명령
  - 범위 밖 정리 후보: 이중 클래스, 중복 `@container`, `overflow` 위치
  - 남은 문서 불일치

## Workflow follow-up

- 사용자 검토 후 커밋 범위를 확인하고 변경을 archive한다.
- 예시를 flash-app 코드로 교체하는 작업과 범위 밖 정리 후보는 필요하면 별도 변경으로 제안한다.
