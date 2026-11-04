# Proposal

## Why

`src/scss/base/_base.scss`의 `* { max-inline-size: 60ch }`가 모든 요소의 폭을 60ch로 제한한다. 이 앱은 긴 본문이 거의 없는 UI라 이 규칙을 풀기 위한 예외가 컴포넌트 14곳에 흩어졌고, 예외를 빠뜨린 곳에서 버그가 생긴다. 실제로 데스크톱 Study 카드의 "Click to reveal answer"·"Answer:" 안내 문구가 60ch로 잘린 상자 안에서 가운데 정렬되어, 카드 중앙보다 52px 왼쪽에 표시된다(Figma `300:1774`에서는 질문 아래 가운데).

## What Changes

- 60ch 읽기 폭 제한을 전역 `*`에서 `p` 요소로 좁힌다. 문단에는 지금과 같은 제한이 남는다.
- 전역 규칙을 풀던 `_base.scss`의 요소 예외 목록(`html, body, div, …`)을 지운다.
- `p`가 아닌 요소에 넣었던 컴포넌트 예외 10곳을 지운다. 대상은 카드 메뉴 항목, 대화상자 제목, 플래시카드 내부 3곳, 카드 폼·라벨·입력란, 그리드 카드 질문, 통계 목록이다. 패널 폭을 채워야 하는 `p` 예외 3곳(그리드 카드 정답, 폼 오류 문구, 토스트 문구)은 유지한다.
- (구현 중 추가) 지우는 규칙이 함께 덮어쓰던 다른 기본값 두 가지를 명시적으로 남긴다: 대화상자의 브라우저 기본 최대 폭 해제(`.c-dialog`), 카드 메뉴 아이콘이 리셋의 `max-width: 100%`로 줄어들지 않게 하는 예외(`.c-card-menu__toggle img`).
- 결과로 데스크톱 Study 카드의 안내 문구가 카드 가운데에 표시된다.
- 레이아웃 클래스 `.l-center`의 `--measure`(기본 60ch)는 그대로 둔다.

범위 밖: 쓰이지 않는 Every Layout 클래스(`l-center`, `l-stack` 등) 정리, Firefox 검증 환경 추가.

## Capabilities

### New Capabilities

없음

### Modified Capabilities

- `study-mode`: 카드 앞·뒷면의 질문·안내 문구·정답이 카드 가로 가운데에 정렬되는 요구사항을 추가한다(현재 데스크톱 안내 문구 정렬 버그를 막는 기준).

## Impact

- 수정: `src/scss/base/_base.scss`, `src/scss/components/_card-menu.scss`, `_dialog.scss`, `_flashcard.scss`, `_form-field.scss`, `_grid-card.scss`, `_stats.scss`
- 변경 없음: HTML, JavaScript, `layout/_every-layout.scss`, 저장 데이터
- 화면 변화: 측정한 범위(375·768·1440px, 기본·200% 글자, Study·All Cards의 7가지 화면 상태)에서는 1440px Study 카드 안내 문구 위치만 바뀐다. 실제 수정 후 전체 회귀 검증으로 다시 확인한다.
- `dist/`는 직접 수정하거나 삭제하지 않는다.
