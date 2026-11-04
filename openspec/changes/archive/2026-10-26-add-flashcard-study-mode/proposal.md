# Proposal

## Why

`src/pages/index.html`에는 README의 화면 문구만 나열되어 있고 스타일·스크립트는 템플릿 상태입니다. Frontend Mentor Flashcard app 챌린지를 여러 change로 나눠 구현하기로 했으며, 이 change는 첫 단계로 앱의 뼈대와 학습 흐름(Study Mode)을 만듭니다. 이후 단계(카드 관리, All Cards 목록)는 이 change가 정한 데이터 모델·필터·화면 골격 위에 쌓입니다.

## What Changes

- 앱 골격: 로고 헤더, Study Mode / All Cards 보기 전환 컨트롤, 반응형 페이지 레이아웃(모바일·태블릿·데스크톱)을 만든다. All Cards 보기는 전환 대상 영역만 두고 내용은 다음 change에서 채운다.
- 플래시카드 데이터: `src/data.json`의 40장을 초기 데이터로 읽고, 숙련도(`knownCount`) 변경을 `localStorage`에 저장해 다음 방문 때 복원한다.
- Study Mode: 카드 한 장씩 표시, 클릭(또는 Enter·Space)으로 정답 공개(애니메이션), "I Know This"로 숙련도 +1(최대 5), "Reset Progress"로 0, Previous/Next 이동, "Card N of M" 표시, 0/5 진행 표시.
- 필터·정렬: 카테고리 다중 선택 드롭다운(카테고리별 카드 수 표시, "All Categories"로 해제), "Hide Mastered", "Shuffle".
- 학습 통계: Total Cards, Mastered, In Progress, Not Started 수를 표시하고 상태 변화 시 즉시 갱신한다.
- 접근성: 키보드만으로 모든 조작, 모든 인터랙티브 요소의 hover·focus 상태, 카드 뒤집기 등 동적 변화의 스크린 리더 안내, `prefers-reduced-motion` 대응.
- 프로젝트 기반 값 교체: 템플릿에 남은 이전 챌린지 토큰(Roboto, 색상, Work Sans `@font-face`)을 이번 디자인 값과 `src/fonts/Poppins`로 바꾼다.

이 change에서 다루지 않는 것(다음 change 예정): 카드 생성·수정·삭제와 폼 검증, All Cards 그리드와 Load More, 토스트 알림, 모달·삭제 확인 대화상자.

## Capabilities

### New Capabilities

- `flashcard-data`: 초기 카드 데이터 로드, 숙련도(0–5)와 상태 분류(Not Started / In Progress / Mastered), 브라우저 저장소를 통한 영속화
- `study-mode`: 카드 한 장 단위 학습 — 앞뒤 뒤집기, 숙련도 올리기·초기화, 이전·다음 이동, 위치·진행 표시
- `card-filtering`: 카테고리 다중 선택 필터, 숙련 카드 숨기기, 섞기. 이후 All Cards 보기에서도 같은 규칙을 쓴다
- `study-statistics`: 전체·숙련·진행 중·미시작 카드 수 집계와 표시
- `app-shell`: 헤더, 보기 전환, 반응형 레이아웃, 앱 전역의 키보드·포커스·모션 접근성 기준

### Modified Capabilities

없음 (`openspec/specs/`에 기존 capability가 없습니다).

## Impact

- 수정: `src/pages/index.html`(현재 미커밋 사용자 변경이 있음 — 이를 기반으로 작성), `src/scss/abstracts/*`, `src/scss/base/_fonts.scss`, `src/scss/base/_base.scss`, `src/scss/style.scss`, 신규 `src/scss/components/*`·`src/scss/pages/*`, `src/js/main.js`
- 사용: `src/js/vendor/jquery-4.0.0.js`(jQuery 4), `src/images/*` 제공 자산, `src/fonts/Poppins/*`, `src/data.json`
- 의존성 추가 없음. `dist/`는 직접 수정하거나 삭제하지 않는다.
- 디자인 근거: Figma 파일 URL을 구현 시작 시 제공받아 Figma MCP로 프레임·토큰을 확인한다. 로컬 `flashcard-app.fig`는 MCP로 읽을 수 없다.
