# Spec Delta

## ADDED Requirements

### Requirement: 보기별 필터 상태
Study Mode와 All Cards 보기는 각자의 카테고리 필터, "Hide Mastered", "Shuffle"을 가지며, 같은 규칙을 쓰되 상태는 SHALL 따로 유지한다. 한 보기에서 바꾼 필터는 다른 보기의 학습 대상이나 그리드에 영향을 주지 않는다.

#### Scenario: All Cards 필터가 Study Mode에 영향 없음
- **WHEN** 초기 데이터에서 Study Mode는 필터 없이 5번째 카드를 보다가, All Cards 보기에서 "Geography"만 선택하고 다시 Study Mode로 돌아온다
- **THEN** Study Mode는 "Card 5 of 40"을 그대로 표시한다

#### Scenario: 각 보기의 Hide Mastered
- **WHEN** All Cards 보기에서 "Hide Mastered"를 켠다
- **THEN** All Cards 그리드에서는 숙련 카드가 빠지고, Study Mode의 "Hide Mastered"는 꺼진 상태 그대로다

### Requirement: 카드 변경 반영
카드가 추가·수정·삭제되면 두 보기의 카테고리 선택지와 카테고리별 카드 수가 SHALL 즉시 갱신된다. 카드가 하나도 남지 않은 카테고리는 선택지에서 사라진다.

#### Scenario: 카테고리 이동
- **WHEN** 초기 데이터에서 Geography 카드 하나의 Category를 "History"로 고친다
- **THEN** 카테고리 필터에 "Geography (3)"과 "History (2)"가 표시된다

#### Scenario: 마지막 카드 삭제
- **WHEN** "Art"(1장) 카테고리의 카드를 지운다
- **THEN** 두 보기의 카테고리 필터에서 "Art" 선택지가 사라진다

### Requirement: 사라진 카테고리 선택 해제
선택해 둔 카테고리가 선택지에서 사라지면 그 카테고리는 해당 보기의 선택에서 SHALL 빠진다. 남은 선택이 없으면 모든 카테고리가 대상이 된다.

#### Scenario: 유일하게 선택한 카테고리가 사라짐
- **WHEN** Study Mode에서 "Art"만 선택한 상태로, All Cards 보기에서 Art 카드를 지운 뒤 Study Mode로 돌아온다
- **THEN** Study Mode는 선택 없음 상태가 되어 남은 39장 전체가 학습 대상이다
