# Spec Delta

## Purpose

사용자가 전체 카드 중 얼마나 학습했는지 한눈에 파악할 수 있도록 숙련 상태별 카드 수를 보여 준다.

## ADDED Requirements

### Requirement: 상태별 카드 수 표시
Study Statistics는 Total Cards, Mastered, In Progress, Not Started 네 값을 SHALL 표시한다. 값은 필터와 무관하게 전체 카드 기준으로 집계하며, 각 값은 이름과 숫자가 짝지어 보조 기술에 전달된다.

#### Scenario: 초기 데이터 통계
- **WHEN** 초기 데이터로 앱을 연다
- **THEN** Total Cards 40, Mastered 11, In Progress 21, Not Started 8이 표시된다

#### Scenario: 필터와 무관
- **WHEN** "Geography"만 선택하고 "Hide Mastered"를 켠다
- **THEN** 통계 값은 Total Cards 40, Mastered 11, In Progress 21, Not Started 8 그대로다

### Requirement: 즉시 갱신
카드의 숙련도가 바뀌면 통계는 페이지 새로고침 없이 SHALL 즉시 갱신된다.

#### Scenario: 미시작 카드 학습 시작
- **WHEN** 초기 데이터에서 `knownCount`가 0인 카드에 "I Know This"를 누른다
- **THEN** Not Started가 7, In Progress가 22로 바뀌고 Total Cards는 40 그대로다
