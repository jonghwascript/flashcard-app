# Design

## Context

동기는 proposal.md를 따른다. 현재 index는 669줄이며 header 21–62, Study Mode 65–339(통계 포함), All Cards 341–537(생성 폼 포함), 토스트 542–552, 편집 dialog 555–633, 삭제 dialog 635–667로 구성돼 있다. `src/partials/`는 아직 없다. Gulp는 이미 `gulp-file-include`의 `prefix: '@@'`, `basepath: '@file'`를 사용하고 부분 파일 변경도 감시한다.

반면 `tests/layout/helpers.cjs`와 `app.cjs`는 index 원본을 그대로 임시 폴더로 복사하며 `structure.cjs`는 index만 읽어 클래스 목록을 수집한다. include를 도입하면 이 세 경로를 함께 바꿔야 한다. app-shell의 요구사항은 파일 구성과 독립적이므로 명세 변경 없이 회귀 검증한다.

## Goals / Non-Goals

**Goals:** index는 head·body·앱 래퍼·main·live region과 include만으로 페이지 구성을 드러내며 통상 포맷에서 80줄 이내로 만든다. 각 부분 파일은 완결된 영역 요소를 소유해 수정 위치를 쉽게 찾게 한다.

**Non-Goals:** 라우팅·프레임워크·런타임 fetch, 공통 폼 필드나 툴바의 매개변수 템플릿화, JS 생성 DOM 이전, 디자인·ARIA·상호작용 수정, Gulp 정리 정책 변경은 포함하지 않는다. 줄 수만 줄이기 위한 압축은 하지 않는다.

## Decisions

### 영역 단위의 두 단계 include

| 파일 (`src/partials/` 아래) | 소유 범위 |
| --- | --- |
| `layout/app-header.html` | 로고·보기 전환을 포함한 header 전체 |
| `views/study.html` | Study Mode section 전체, 툴바·학습 카드·동작·빈 상태, 통계 include |
| `components/study-statistics.html` | 통계 section 전체 |
| `views/all-cards.html` | All Cards section 전체, 생성 패널·폼 include·툴바·목록·빈 상태·추가 로딩 |
| `forms/create-card.html` | 생성 form 전체; 패널 래퍼는 All Cards에 유지 |
| `dialogs/edit-card.html` | 편집 dialog 전체와 내부 편집 form |
| `dialogs/delete-card.html` | 삭제 dialog 전체 |
| `notifications/toast.html` | toast 루트 전체 |

index에서 각 최상위 영역을 `@@include('../partials/...')`로 조합한다. view 내부의 통계·생성 폼은 각각 `../components/...`, `../forms/...`처럼 포함하는 파일 기준으로 참조한다. 조합 깊이는 index→view→하위 영역까지로 제한하고 시작 태그·끝 태그를 서로 다른 파일에 나누지 않는다. head는 현재 약 17줄로 짧고 전체 문서 계약을 한곳에 두기 위해 index에 유지한다. 모든 버튼·필드까지 매개변수화하는 대안은 이번 유지보수 문제보다 복잡성을 늘리므로 채택하지 않는다.

### 조합 결과 보존

문서 순서·래퍼 수·클래스·ID·data-js/data-action·ARIA 관계·hidden·폼 속성·텍스트·자산 URL은 그대로 옮긴다. partial의 images/fonts/script URL도 최종 index 기준이므로 partial 위치에 맞춰 바꾸지 않는다. 편집·삭제 dialog는 앱 래퍼 밖에, 토스트는 앱 래퍼 안에 유지한다. 컴포넌트와 레이아웃 클래스 조합도 변경하지 않는다.

### 검증 도구도 실제 include 엔진 사용

`tests/layout/render-html.cjs`에 비동기 렌더 함수를 두고 설치된 Gulp 소스 스트림과 `gulp-file-include`를 동일 옵션으로 적용해 결과 문자열을 반환한다. `gulpfile.js`를 require하거나 dest/clean을 실행하지 않는다. helpers의 미리보기와 app의 독립 준비 경로는 조합 결과를 OS 임시 폴더에 쓰고, structure는 동일 함수가 반환한 HTML을 분석한다. 기존 동기식 structure 진입점은 오류 코드가 보존되는 async 진입점으로 감싼다. 테스트마다 별도 정규식 include 해석기를 만드는 대안은 중첩 경로·오류 처리가 실제 엔진과 달라지므로 사용하지 않는다.

### 변경 전후 검증

분리 전 HTML·DOM 기준과 dist 해시를 임시 폴더에 보관한다. 조합 결과에 미해석 include가 없는지, DOM 요소 트리·속성·콘텐츠가 동등한지 비교한다. 일반 텍스트는 들여쓰기에 따른 공백을 정규화하되 pre/textarea 등의 의미 있는 공백은 보존하고 브라우저의 표시 문구·접근 가능한 이름도 확인한다. 파일 누락은 include 엔진의 오류와 실패 종료 코드로 드러나야 한다. 기준 HTML은 영구 중복 파일로 저장소에 추가하지 않는다.

`tests/layout/structure.cjs`의 39개 클래스 연결, 앱·오버레이·확대 검사를 조합된 최신 결과에서 실행한다. Chrome·Firefox 중 실행 가능한 브라우저만 사용하고 불가능한 항목은 미검증으로 기록한다. Gulp의 기존 입력·옵션·watch가 새 경로를 지원하므로 설정 변경 없이 include 조합·임시 출력을 검증하며 build/dev/html 태스크로 dist를 갱신하지 않는다. 기존 감시 프로세스가 있으면 읽기 전용으로 확인하고 필요 시 사용자에게 중지 승인을 받는다.

## Risks / Trade-offs

- 중첩 include 상대 경로 오류 → 실제 엔진으로 전개하고 미해석 구문·오류 종료를 검사.
- 중복 ID·wrapper 추가·dialog 위치 변경 → 분리 전후 DOM과 ARIA 연결 비교.
- 원본만 검사해 잘못된 통과·실패 발생 → 확인된 세 경로가 공통 렌더 함수를 사용하도록 변경.
- 파일 수 증가 → 역할이 명확한 8개 부분 파일과 최대 두 단계 조합으로 제한.
- source index를 직접 열 때 include가 표시됨 → 기존 앱 빌드 계약과 임시 미리보기 사용법을 문서화.

## Migration Plan

기준을 보관하고 공통 검증 렌더러를 먼저 준비한 다음, 영역을 이동하고 기존 검증 입력을 전환한다. 문서와 전체 회귀 검사로 마무리한다. 앱 동작이나 데이터 마이그레이션은 없으며 롤백 시 index·부분 파일·검증 입력 경로를 한 묶음으로 되돌린다.
