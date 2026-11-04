# Spec Delta

## ADDED Requirements

### Requirement: 카드 목록 변경 반영
카드가 추가·수정·삭제되면 Study Mode의 학습 대상 집합과 "Card N of M"이 SHALL 즉시 갱신된다. 보던 카드가 대상에 남아 있으면 그 카드를 계속 표시하고, 지워졌거나 필터에서 빠졌으면 같은 위치의 다음 카드(마지막이었다면 첫 카드)를 앞면으로 표시한다.

#### Scenario: 앞쪽 카드 삭제
- **WHEN** 초기 데이터 Study Mode에서 5번째 카드 fc005를 보다가 All Cards 보기에서 fc001을 지우고 돌아온다
- **THEN** Study Mode는 계속 fc005를 표시하고 "Card 4 of 39"가 보인다

#### Scenario: 보던 카드 삭제
- **WHEN** Study Mode에서 5번째 카드 fc005를 보다가 All Cards 보기에서 fc005를 지우고 돌아온다
- **THEN** fc006의 앞면과 "Card 5 of 39"가 보인다

#### Scenario: 보던 카드 수정
- **WHEN** Study Mode에서 fc001을 보다가 All Cards 보기에서 fc001의 질문을 고치고 돌아온다
- **THEN** Study Mode에는 fc001의 고친 질문이 보이고 위치 표시는 그대로다

### Requirement: 섞은 순서에 새 카드 추가
Study Mode가 섞은 순서로 학습 중일 때 새로 만든 카드가 학습 대상에 들어오면, 기존 카드의 섞인 순서는 유지하고 새 카드는 학습 대상의 끝에 SHALL 놓인다.

#### Scenario: 섞은 뒤 카드 생성
- **WHEN** Study Mode에서 "Shuffle"을 실행해 3번째 카드를 보다가 All Cards 보기에서 카드를 하나 만들고 돌아온다
- **THEN** Study Mode는 같은 카드를 "Card 3 of 41"로 표시하고, 마지막 카드(41번째)는 새 카드다
