# Spec Delta

## Purpose

사용자가 자신의 플래시카드를 직접 만들고, 고치고, 지울 수 있게 한다. 입력 오류를 알려 주고, 변경 결과를 확인할 수 있는 안내도 제공한다.

## ADDED Requirements

### Requirement: 카드 생성
All Cards 보기 상단의 생성 폼은 Question, Answer, Category 입력과 "Create Card" 버튼을 SHALL 제공한다. 모든 필드가 유효한 상태로 제출하면 입력한 값(앞뒤 공백 제거)과 `knownCount` 0으로 새 카드를 만들어 전체 카드 목록 끝에 추가하고, 폼을 비운다.

#### Scenario: 새 카드 만들기
- **WHEN** 초기 데이터에서 Question "What is 2 + 2?", Answer "4", Category "Mathematics"를 입력하고 "Create Card"를 누른다
- **THEN** 전체 카드는 41장이 되고 새 카드의 진행 표시는 "0/5"이며, 세 입력란은 비워진다

#### Scenario: 새 카테고리
- **WHEN** 기존에 없는 Category "Music"으로 카드를 만든다
- **THEN** 카테고리 필터에 "Music (1)" 선택지가 나타난다

### Requirement: 기존 카테고리 표기 맞춤
입력한 Category가 기존 카테고리와 대소문자만 다르면 새 카테고리를 만들지 않고 기존 카테고리 표기를 SHALL 사용한다.

#### Scenario: 대소문자 차이
- **WHEN** 초기 데이터에서 Category를 "css"로 입력해 카드를 만든다
- **THEN** 새 카드의 카테고리는 "CSS"이고 카테고리 필터에는 "CSS (7)"이 표시되며 "css" 선택지는 생기지 않는다

### Requirement: 필수 입력 검증
Question, Answer, Category는 모두 필수이며 공백만 있는 값은 빈 값으로 SHALL 본다. 빈 필드가 있으면 카드를 만들거나 고치지 않고, 빈 필드마다 오류 문구를 그 필드 아래에 보인다. 문구는 "Please enter a question.", "Please enter an answer.", "Please enter a category."이다.

#### Scenario: 빈 폼 제출
- **WHEN** 세 필드를 비운 채 "Create Card"를 누른다
- **THEN** 세 필드 아래에 각 오류 문구가 보이고 카드 수는 바뀌지 않는다

#### Scenario: 공백만 입력
- **WHEN** Question에 공백만 넣고 Answer와 Category는 채운 뒤 제출한다
- **THEN** "Please enter a question."만 보이고 카드는 만들어지지 않는다

### Requirement: 오류 안내 접근성
검증에 실패하면 포커스가 첫 번째 오류 필드로 SHALL 이동하고, 오류 필드는 유효하지 않은 상태와 해당 오류 문구를 보조 기술에 전달한다. 오류는 색 외에 아이콘과 문구로도 구분된다.

#### Scenario: 첫 오류로 이동
- **WHEN** Question은 채우고 Answer와 Category를 비운 채 제출한다
- **THEN** 포커스가 Answer 입력란으로 이동하고, 스크린 리더는 Answer가 유효하지 않으며 "Please enter an answer."라고 안내받는다

### Requirement: 오류 해소
오류가 표시된 필드에 유효한 값을 입력하면 그 필드의 오류 문구와 유효하지 않은 상태가 SHALL 사라진다. 아직 제출하지 않은 필드에는 입력 도중 오류를 보이지 않는다.

#### Scenario: 입력으로 오류 해제
- **WHEN** 빈 폼 제출로 오류가 보이는 상태에서 Question에 글자를 입력한다
- **THEN** Question의 오류 문구는 사라지고 Answer와 Category의 오류는 남는다

#### Scenario: 처음 입력할 때
- **WHEN** 페이지를 연 뒤 Question에 글자를 입력했다가 모두 지운다
- **THEN** 아직 제출하지 않았으므로 오류 문구는 보이지 않는다

### Requirement: 카드 수정
카드 메뉴의 "Edit"를 실행하면 "Edit your card" 대화상자가 그 카드의 현재 Question, Answer, Category를 채운 상태로 SHALL 열린다. "Update Card"를 누르면 생성과 같은 검증을 거쳐 카드 내용을 바꾸고 대화상자를 닫는다. 카드의 `id`와 `knownCount`는 유지된다.

#### Scenario: 질문 수정
- **WHEN** `knownCount`가 2인 카드 fc002의 Edit 대화상자에서 Question을 바꾸고 "Update Card"를 누른다
- **THEN** 그리드에 바뀐 질문이 보이고 진행 표시는 "2/5" 그대로다

#### Scenario: 수정 중 빈 값
- **WHEN** Edit 대화상자에서 Answer를 지우고 "Update Card"를 누른다
- **THEN** 대화상자는 열린 채 "Please enter an answer."가 보이고 카드는 바뀌지 않는다

#### Scenario: 저장하지 않고 닫기
- **WHEN** Edit 대화상자에서 Question을 바꾼 뒤 Escape를 누른다
- **THEN** 대화상자가 닫히고 카드 내용은 바뀌지 않으며, 다시 열면 원래 값이 채워져 있다

### Requirement: 카드 삭제 확인
카드 메뉴의 "Delete"를 실행하면 카드를 바로 지우지 않고 "Delete this card?" 제목, "This action can’t be undone." 안내, "Cancel"과 "Delete Card" 버튼을 가진 확인 대화상자를 SHALL 연다. "Delete Card"를 누르면 카드를 지우고, "Cancel"이나 다른 방법으로 닫으면 아무것도 바뀌지 않는다.

#### Scenario: 삭제 실행
- **WHEN** 초기 데이터에서 fc001의 Delete 확인 대화상자에서 "Delete Card"를 누른다
- **THEN** fc001이 그리드에서 사라지고 Total Cards가 39가 된다

#### Scenario: 삭제 취소
- **WHEN** 확인 대화상자에서 "Cancel"을 누른다
- **THEN** 대화상자가 닫히고 카드 수는 그대로다

### Requirement: 대화상자 동작
Edit와 Delete 대화상자는 모달로 SHALL 동작한다. 열려 있는 동안 뒤쪽 페이지는 키보드·보조 기술로 접근할 수 없고, 오버레이 클릭·Escape·닫기 버튼으로 닫힌다. 대화상자에는 제목으로 된 접근 가능한 이름이 있다.

#### Scenario: 오버레이 클릭
- **WHEN** Edit 대화상자가 열린 상태에서 대화상자 바깥 오버레이를 클릭한다
- **THEN** 대화상자가 닫히고 변경 사항은 저장되지 않는다

#### Scenario: 포커스 가두기
- **WHEN** 대화상자 안에서 마지막 요소에서 Tab을 누른다
- **THEN** 포커스는 대화상자 밖으로 나가지 않는다

### Requirement: 대화상자 포커스 관리
대화상자가 열리면 포커스가 대화상자 안으로 SHALL 이동한다. Edit는 Question 입력란, Delete는 "Cancel" 버튼으로 간다. 저장하지 않고 닫으면 포커스는 대화상자를 연 카드의 메뉴 버튼으로 돌아간다.

#### Scenario: 열고 닫기
- **WHEN** 카드 메뉴에서 Edit를 열고 Escape로 닫는다
- **THEN** 열릴 때 포커스는 Question 입력란에 있고, 닫힌 뒤에는 그 카드의 메뉴 버튼에 있다

#### Scenario: 삭제 후 포커스
- **WHEN** 그리드의 카드 하나를 삭제한다
- **THEN** 포커스는 지운 카드 자리에 오게 된 다음 카드의 메뉴 버튼으로 간다. 다음 카드가 없으면 이전 카드, 남은 카드가 없으면 빈 상태 제목으로 간다

### Requirement: 변경 결과 토스트
카드를 만들거나 고치거나 지우면 화면에 토스트를 SHALL 표시한다. 문구는 각각 "Card created successfully.", "Card updated successfully.", "Card deleted."이다. 토스트는 스크린 리더에 안내되고, 닫기 버튼으로 바로 닫을 수 있으며, 약 5초 뒤 자동으로 사라진다.

#### Scenario: 생성 토스트
- **WHEN** 유효한 카드를 만든다
- **THEN** "Card created successfully." 토스트가 보이고 스크린 리더가 같은 문구를 안내하며, 약 5초 뒤 사라진다

#### Scenario: 직접 닫기
- **WHEN** 토스트의 닫기 버튼을 누른다
- **THEN** 토스트가 즉시 사라진다

### Requirement: 토스트 자동 닫힘 유예
토스트에 마우스를 올리거나 키보드 포커스가 있는 동안에는 자동 닫힘이 SHALL 멈추고, 벗어나면 다시 시간을 센다. 새 토스트가 나오면 이전 토스트를 대신한다.

#### Scenario: 포커스 중 유지
- **WHEN** 토스트의 닫기 버튼에 포커스를 둔 채 10초를 기다린다
- **THEN** 토스트는 계속 보인다

#### Scenario: 연속 변경
- **WHEN** 카드를 만든 직후 다른 카드를 지운다
- **THEN** "Card deleted." 토스트 하나만 보인다

### Requirement: 대화상자·토스트 모션 감소
`prefers-reduced-motion: reduce` 환경에서는 대화상자와 토스트의 나타나기·사라지기 애니메이션이 SHALL 꺼진다.

#### Scenario: 동작 줄이기
- **WHEN** 동작 줄이기 설정을 켜고 Edit 대화상자를 열고 카드를 수정한다
- **THEN** 대화상자와 토스트가 애니메이션 없이 바로 나타나고 사라진다
