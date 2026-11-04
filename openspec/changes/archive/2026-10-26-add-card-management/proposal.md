# Proposal

## Why

첫 change(`add-flashcard-study-mode`)로 Study Mode는 동작하지만, 사용자는 제공된 40장 외에 카드를 추가하거나 고치거나 지울 수 없고 All Cards 보기는 빈 자리로 남아 있다. README의 Flashcard Management, Load More, 토스트, 모달 요구사항을 충족해 앱을 완성하는 두 번째 단계다.

## What Changes

- All Cards 보기를 채운다: 상단 카드 생성 폼, 필터 툴바(카테고리·Hide Mastered·Shuffle), 카드 그리드(질문, 정답, 카테고리, 숙련도), 처음 12장 표시 후 "Load More"로 12장씩 추가 표시, 카드가 없을 때와 모두 숨겨졌을 때의 빈 상태.
- 카드 생성: Question·Answer·Category 입력 후 "Create Card". 새 카드는 숙련도 0으로 목록 끝에 추가된다.
- 폼 검증: 세 필드는 모두 필수(공백만 입력해도 빈 값). 제출 시 필드별 오류 문구("Please enter a question." 등)를 보이고 첫 오류 필드로 포커스를 옮긴다.
- 카드 수정: 각 카드의 메뉴(⋮) → "Edit" → "Edit your card" 모달에서 같은 검증으로 "Update Card". 숙련도는 유지된다.
- 카드 삭제: 메뉴 → "Delete" → "Delete this card?" 확인 대화상자 → "Delete Card". "Cancel"이면 아무것도 바뀌지 않는다.
- 모달 동작: 오버레이 클릭·Escape·닫기 버튼으로 닫고, 열 때와 닫을 때 포커스를 관리한다.
- 토스트: 생성·수정·삭제 후 "Card created successfully." / "Card updated successfully." / "Card deleted."를 보이고 몇 초 뒤 자동으로 사라지며, 닫기 버튼과 스크린 리더 안내를 제공한다.
- 생성·수정·삭제 결과를 `localStorage`에 저장하고, Study Mode·카테고리 필터·통계에 즉시 반영한다. 모든 카드를 지우면 다음 방문에도 빈 상태가 유지된다.
- All Cards 보기의 필터·섞기·표시 개수는 Study Mode와 별도 상태로 둔다(같은 규칙, 다른 상태).

## Capabilities

### New Capabilities

- `card-management`: 카드 생성 폼과 검증, 수정 모달, 삭제 확인 대화상자, 변경 결과 토스트
- `all-cards-view`: All Cards 보기의 카드 그리드, 카드별 메뉴, Load More, 빈 상태, 반응형 배치

### Modified Capabilities

- `flashcard-data`: 영속화 대상을 숙련도 변경에서 카드 추가·수정·삭제까지 넓히고, 새 카드 식별자와 빈 목록 유지 규칙을 추가한다.
- `card-filtering`: 같은 필터 규칙을 All Cards 보기에 보기별 독립 상태로 적용하고, 카드가 사라진 카테고리의 선택을 해제한다.
- `study-mode`: 학습 중인 카드가 다른 보기에서 수정·삭제됐을 때 Study Mode가 보여 줄 카드와 위치를 정한다.
- `study-statistics`: 카드 추가·수정·삭제 후에도 통계가 즉시 갱신되도록 갱신 조건을 넓힌다.

## Impact

- 수정: `src/pages/index.html`(All Cards 영역, 대화상자, 토스트 영역), `src/js/main.js`(카드 CRUD, 보기별 필터 상태, 그리드 렌더링, 대화상자·토스트), `src/scss/style.scss`
- 신규 SCSS 파셜(예정): 폼 필드, 카드 그리드, 카드 메뉴, 대화상자, 토스트
- 사용 자산: `src/images/icon-circle-plus.svg`, `icon-menu.svg`, `icon-edit.svg`, `icon-delete.svg`, `icon-cross.svg`, `icon-error.svg`
- 저장 형식 `{ version: 1, cards }`는 그대로 쓴다(필드 구조 변경 없음).
- 의존성 추가 없음. `dist/`는 직접 수정하거나 삭제하지 않는다.
- 디자인 근거: Figma 파일 `LIUCvbM8aumON8VVswGYqI`의 All Cards 프레임(모바일·태블릿·데스크톱, hover·focus, Edit/Delete 대화상자, 토스트, Error, Empty States).
