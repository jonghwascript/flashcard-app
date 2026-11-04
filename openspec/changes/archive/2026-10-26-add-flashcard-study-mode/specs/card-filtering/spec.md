# Spec Delta

## Purpose

사용자가 학습할 카드 집합을 카테고리, 숙련 여부, 순서로 좁히고 바꿀 수 있게 한다. 같은 규칙을 Study Mode와 이후 All Cards 보기에서 공유한다.

## ADDED Requirements

### Requirement: 카테고리 다중 선택
카테고리 필터는 데이터에 있는 모든 카테고리를 선택지로 SHALL 제공하며, 여러 카테고리를 동시에 선택할 수 있다. 하나 이상 선택하면 선택한 카테고리 중 하나에 속한 카드만 학습 대상이 된다.

#### Scenario: 두 카테고리 선택
- **WHEN** 초기 데이터에서 "CSS"(6장)와 "HTML"(3장)을 선택한다
- **THEN** 학습 대상은 9장이고 "Card 1 of 9"가 표시된다

### Requirement: 카테고리별 카드 수
각 카테고리 선택지는 그 카테고리에 속한 전체 카드 수를 SHALL 함께 표시한다. 이 수는 "Hide Mastered" 상태와 무관하다.

#### Scenario: 선택지 개수 표시
- **WHEN** 초기 데이터에서 카테고리 필터를 연다
- **THEN** "JavaScript" 선택지에 13, "Geography" 선택지에 4가 표시된다

### Requirement: 선택 없음은 전체 카테고리
선택된 카테고리가 하나도 없으면 모든 카테고리가 SHALL 학습 대상이 된다. 필터 버튼 라벨은 선택 여부와 관계없이 "All Categories"이고, 선택 상태는 목록의 체크박스로 전달된다. 목록에는 카테고리 선택지만 이름 오름차순으로 두며 별도의 "All Categories" 항목은 없다(Figma 기준).

#### Scenario: 마지막 선택 해제
- **WHEN** "CSS"만 선택된 상태에서 "CSS" 선택을 해제한다
- **THEN** 학습 대상은 40장이 되고 필터 버튼은 "All Categories"로 표시된다

### Requirement: 카테고리 필터 조작
카테고리 필터 목록은 버튼으로 SHALL 열고 닫으며, 열림 상태를 보조 기술에 전달한다. Escape를 누르거나 목록 바깥을 클릭하면 닫히고, Escape로 닫으면 포커스가 필터 버튼으로 돌아간다.

#### Scenario: 키보드로 열고 닫기
- **WHEN** 필터 버튼에서 Enter로 목록을 열고 선택지 하나를 Space로 선택한 뒤 Escape를 누른다
- **THEN** 선택이 반영된 채 목록이 닫히고 포커스는 필터 버튼에 있다

### Requirement: 숙련 카드 숨기기
"Hide Mastered"를 켜면 Mastered 상태 카드는 학습 대상에서 SHALL 제외된다. 학습 중 카드가 Mastered가 되면 다음 갱신 시 대상에서 빠진다.

#### Scenario: 숙련 카드 숨김
- **WHEN** 초기 데이터에서 "Hide Mastered"를 켠다
- **THEN** 학습 대상은 29장이 된다

#### Scenario: 학습 중 숙련 도달
- **WHEN** "Hide Mastered"가 켜진 상태에서 `knownCount`가 4인 카드에 "I Know This"를 누른다
- **THEN** 그 카드는 학습 대상에서 빠지고, 같은 위치의 다음 카드(마지막이었다면 첫 카드)가 표시된다

### Requirement: 섞기
"Shuffle"을 실행하면 현재 학습 대상 집합의 순서가 SHALL 무작위로 바뀌고 첫 번째 카드부터 표시된다. 카드 구성은 바뀌지 않는다.

#### Scenario: 필터 결과 섞기
- **WHEN** "JavaScript"만 선택한 상태에서 "Shuffle"을 누른다
- **THEN** 학습 대상은 여전히 JavaScript 카드 13장이고 "Card 1 of 13"이 표시된다

### Requirement: 필터 변경 시 위치
카테고리 선택 또는 "Hide Mastered"가 바뀌면 Study Mode는 새 학습 대상의 첫 번째 카드로 SHALL 이동한다.

#### Scenario: 필터 변경 후 처음부터
- **WHEN** 40장 중 10번째 카드를 보다가 "Geography"를 선택한다
- **THEN** "Card 1 of 4"가 표시된다
