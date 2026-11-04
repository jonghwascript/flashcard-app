# Verification

검증 환경: Windows 11, Node 22, Sass(프로젝트 설치본), Chrome 156.0.8078.79(Playwright, headless). 비교 자료와 스크립트는 저장소 밖 임시 폴더에 두었다.

## SCSS 이동

| 확인 | 결과 |
| --- | --- |
| 이동 계획 | `_app-layout.scss` 370줄 중 `@use`를 뺀 모든 비어 있지 않은 줄이 대상 파일 한 곳에만 배정됨 |
| 컴파일 | `node -e "require('sass').compile('src/scss/style.scss')"` 성공 |
| 규칙 보존 | compressed CSS를 규칙 단위(상위 at-rule 포함)로 펼쳐 정렬한 302개 목록이 이동 전후 동일. 출력 순서만 다름 |
| 충돌 후보 | 상대 순서가 뒤바뀌고 속성 계열이 겹치는 쌍 867개 중, 7개 상태의 DOM에서 같은 요소에 함께 걸리는 쌍은 `.l-empty-state.l-empty-state--plain` ↔ `.l-empty-state` 1개. 명시도가 0,2,0 대 0,1,0이라 순서와 무관하게 승자 불변 |
| computed style | 6개 너비(320·767·768·1023·1024·1440) × 8개 상태(학습, 학습 필터, 전체, 메뉴, 전체 필터, 편집·삭제 dialog, 토스트), 요소·가상 요소 29,100개의 computed style과 rect. 기준 2회 차이 0, 이동 후 3회 중 2회 차이 0 |
| 주석 수정 | `_card-grid.scss`의 "뒤쪽 기본 빈 상태 규칙"을 "_study.scss의 기본 빈 상태 규칙"으로 고침. compressed CSS 동일 |

이동 후 첫 스냅샷 1회는 29,100개 항목이 모두 달랐다. 같은 CSS로 다시 찍은 2회와 320px 학습 화면의 상세 비교(속성 단위)는 모두 차이 0이었다. 원인은 확인하지 못했으며, 전 항목이 동시에 달라진 점으로 보아 측정 실행의 이상으로 판단했다.

## 테스트

| 명령 | 결과 |
| --- | --- |
| `node tests/layout/structure.cjs` | PASS, 마크업 l- 클래스 39, 앱 전용 l- 클래스 39(이전 `_app-layout.scss` 기준 집합과 동일) |
| 음성 확인 | 저장소 밖 복사본에 쓰이지 않는 `.l-unused-probe`를 추가하면 `Unused app layout class`로 실패 |
| `node tests/layout/app.cjs` | 19개 검사 모두 PASS, 오류·가로 넘침 없음 |
| `node tests/layout/overlays.cjs` | 종료 코드 0, 실패 항목 없음 |
| `node tests/layout/stress.cjs` | PASS(4 cases, longContentRoot32 true) |
| `node --check src/js/main.js` | 통과 |
| `git diff --check` | 통과 |
| Firefox | 미검증. 설치된 일반 Firefox는 Playwright 제어 프로토콜(Juggler)이 없어 실행 직후 종료됨. Playwright용 Firefox는 설치하지 않음 |

`npm run build`·`npm run dev`는 `dist`를 지우므로 실행하지 않았다.

## 문서

- 링크: `doc/*.md`(삭제됨)의 상대 `.md` 링크, 새 문서의 모든 상대 링크, `scss-guide.md`의 `#12-…`·`#9-…` 앵커가 존재함.
- 절 번호·제목: 세 가이드의 기존 제목은 그대로이며, 추가한 제목은 `scss-guide.md` §1의 하위 제목 1개와 `layout-guide.md`의 「앱 전용 배치를 두는 위치」 1개.
- `scss-comment-guide.md`의 검증 명령 블록과 재사용 프롬프트 템플릿은 변경 없음.
- 입문 문서 표의 클래스 33개가 표에 적은 SCSS 파일의 컴파일 결과에 있음. HTML 경로 7개 존재.

## 계획과 달라진 점

- **미구현·상충 표시를 붙이지 않음(6.1·6.2):** `guide-compliance-review.md`는 `data-space`·`data-gap`을 미구현으로 기록했지만 현재 `_every-layout.scss`(22–30행, 211–219행)에 구현되어 있다. 이 리뷰가 지적한 인라인 스타일 예시, 유틸리티 `!important` 범위, 단일 책임 예외, 버튼 margin 예시도 현재 `layout-guide.md`에 이미 반영되어 있어, 표시를 붙이면 사실과 달라진다.
- **`tests/layout/README.md` 변경 없음(3.1):** `_app-layout.scss`를 전제한 문장이 없었다.
- **§7·§10·§11·§3·§9는 설명을 덧붙이지 않음(5.2):** 이미 이유가 적혀 있다.

## 범위 밖으로 남긴 사항

- `scss-guide.md` 핵심 원칙 2는 `aria-*` 속성에 스타일을 연결하지 않는다고 하지만, `_card-menu.scss` 등은 `[aria-expanded='true']`로 상태 스타일을 연결한다. 가이드와 구현 중 무엇을 따를지 결정이 필요하다.
- `figma-html-css.md:42`는 `scss-guide.md` §8의 "프로젝트 초기에 단위를 정해 통일한다"는 원칙을 인용하지만 §8에 해당 문장이 없다.
- 정리 후보: 이동 후 기본 규칙이 먼저 출력되므로 `.l-empty-state.l-empty-state--plain`은 단일 클래스로 충분하다. `_grid-card.scss`에 같은 조건의 `@container (max-width: 13em)` 블록이 세 개 있다. 카드 메뉴의 `overflow: hidden`은 겉모양에 가까워 `c-card-menu__list`로 옮길지 판단이 필요하다.
- `guide-compliance-review.md`의 `layout-guide.md` 줄 번호 참조는 이번 추가로 어긋나지만 과거 기록이라 고치지 않았다.
- `scss-guide.md`의 예시는 여전히 이전 프로젝트 코드다(표시만 추가).
