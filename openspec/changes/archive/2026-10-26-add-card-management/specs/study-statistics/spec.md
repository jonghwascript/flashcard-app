# Spec Delta

## MODIFIED Requirements

### Requirement: 즉시 갱신
카드의 숙련도가 바뀌거나 카드가 추가·수정·삭제되면 통계는 페이지 새로고침 없이 SHALL 즉시 갱신된다.

#### Scenario: 미시작 카드 학습 시작
- **WHEN** 초기 데이터에서 `knownCount`가 0인 카드에 "I Know This"를 누른다
- **THEN** Not Started가 7, In Progress가 22로 바뀌고 Total Cards는 40 그대로다

#### Scenario: 카드 생성
- **WHEN** 초기 데이터에서 새 카드를 하나 만든다
- **THEN** Total Cards가 41, Not Started가 9가 된다

#### Scenario: 숙련 카드 삭제
- **WHEN** 초기 데이터에서 Mastered 카드 fc004를 지운다
- **THEN** Total Cards가 39, Mastered가 10이 되고 In Progress와 Not Started는 그대로다
