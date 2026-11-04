# study-mode Specification

## Purpose

사용자가 플래시카드를 한 장씩 보며 질문을 읽고 정답을 확인하고, 아는 정도를 기록하며 학습할 수 있게 한다.

## Requirements

### Requirement: 현재 카드 표시
Study Mode는 현재 학습 대상 집합(필터 적용 결과)에서 카드 한 장을 SHALL 표시한다. 앞면에는 카테고리, 질문, "Click to reveal answer" 안내, 숙련도 진행 표시(`N/5`)를 보인다.

#### Scenario: 첫 카드 표시
- **WHEN** 필터 없이 초기 데이터로 Study Mode를 연다
- **THEN** 카드 fc001의 카테고리 "Web Development", 질문 "What does HTML stand for?", 진행 표시 "0/5"가 보인다

### Requirement: 정답 공개
카드를 클릭하거나 키보드 포커스 상태에서 Enter 또는 Space를 누르면 카드는 SHALL 뒤집혀 정답을 보이고, 다시 조작하면 앞면으로 돌아간다. 뒤집기 상태는 보조 기술에 전달된다.

#### Scenario: 클릭으로 정답 보기
- **WHEN** 앞면이 보이는 카드를 클릭한다
- **THEN** 애니메이션과 함께 정답 "HyperText Markup Language"가 보인다

#### Scenario: 키보드로 정답 보기
- **WHEN** 카드에 포커스를 두고 Space를 누른다
- **THEN** 카드가 뒤집혀 정답이 보이고, 스크린 리더는 정답 내용을 안내받는다

#### Scenario: 동작 줄이기 설정
- **WHEN** 운영체제에서 동작 줄이기(`prefers-reduced-motion: reduce`)가 켜진 상태로 카드를 뒤집는다
- **THEN** 회전 애니메이션 없이 정답 면으로 바뀐다

### Requirement: 숙련도 올리기
"I Know This"를 실행하면 현재 카드의 `knownCount`가 SHALL 1 증가한다(최대 5). 진행 표시와 학습 통계는 즉시 갱신된다.

#### Scenario: 숙련도 증가
- **WHEN** `knownCount`가 2인 카드에서 "I Know This"를 누른다
- **THEN** 진행 표시가 "3/5"가 되고 통계의 In Progress 수는 그대로다

#### Scenario: 숙련 도달
- **WHEN** `knownCount`가 4인 카드에서 "I Know This"를 누른다
- **THEN** 카드는 Mastered 상태로 표시되고 통계의 Mastered 수가 1 늘고 In Progress 수가 1 준다

### Requirement: 숙련 카드 표시
`knownCount`가 5인 카드는 진행 표시 대신 "Mastered 5/5" 배지를 SHALL 표시하고, "I Know This" 버튼은 "Already Mastered" 라벨의 비활성 버튼으로 바뀐다.

#### Scenario: 숙련 카드 보기
- **WHEN** `knownCount`가 5인 카드가 표시된다
- **THEN** "Mastered 5/5" 배지가 보이고, "Already Mastered" 버튼은 비활성 상태라 실행되지 않는다

#### Scenario: 초기화 후 복귀
- **WHEN** 숙련 카드에서 "Reset Progress"를 누른다
- **THEN** 진행 표시 "0/5"와 활성 "I Know This" 버튼이 다시 보인다

### Requirement: 숙련도 초기화
"Reset Progress"를 실행하면 현재 카드의 `knownCount`가 SHALL 0이 되고 진행 표시와 통계가 즉시 갱신된다.

#### Scenario: 진행 초기화
- **WHEN** `knownCount`가 5인 카드에서 "Reset Progress"를 누른다
- **THEN** 진행 표시가 "0/5"가 되고 통계의 Mastered 수가 1 줄고 Not Started 수가 1 는다

### Requirement: 카드 이동
Previous와 Next는 현재 학습 대상 집합 안에서 이전·다음 카드로 SHALL 이동한다. 첫 카드에서 Previous는 마지막 카드로, 마지막 카드에서 Next는 첫 카드로 순환한다. 이동하면 새 카드는 앞면으로 표시된다.

#### Scenario: 다음 카드
- **WHEN** 40장 중 1번째 카드에서 Next를 누른다
- **THEN** 2번째 카드의 앞면이 보이고 "Card 2 of 40"이 표시된다

#### Scenario: 처음에서 이전
- **WHEN** 40장 중 1번째 카드에서 Previous를 누른다
- **THEN** 40번째 카드가 보이고 "Card 40 of 40"이 표시된다

#### Scenario: 뒤집힌 상태에서 이동
- **WHEN** 정답 면이 보이는 상태에서 Next를 누른다
- **THEN** 다음 카드는 질문 면으로 표시된다

### Requirement: 위치 표시
Study Mode는 "Card N of M" 형식으로 현재 위치를 SHALL 표시한다. M은 현재 학습 대상 집합의 카드 수다.

#### Scenario: 필터 후 위치
- **WHEN** 초기 데이터에서 "Web Development"(6장) 카테고리 하나만 선택한다
- **THEN** "Card 1 of 6"이 표시된다

### Requirement: 카드가 하나도 없을 때
전체 카드가 0장이면 Study Mode는 카드, I Know This / Reset Progress, Previous / Next, "Card N of M" 대신 "No cards to study" 제목, 첫 카드를 All Cards에서 추가하라는 안내, "Go to All Cards" 버튼을 SHALL 표시한다. 버튼을 실행하면 All Cards 보기로 전환된다.

#### Scenario: 빈 데이터
- **WHEN** 저장된 카드 배열이 비어 있는 상태로 앱을 연다
- **THEN** "No cards to study"와 "Go to All Cards" 버튼이 보이고, 카드·숙련도 버튼·이동 버튼·위치 표시는 화면과 키보드 탐색에 없다

#### Scenario: All Cards로 이동
- **WHEN** 빈 상태에서 "Go to All Cards"를 실행한다
- **THEN** All Cards 보기가 선택되고 표시된다

### Requirement: 모두 숙련해 숨겨졌을 때
카드는 있지만 "Hide Mastered" 때문에 학습 대상이 0장이면 Study Mode는 카드·숙련도 버튼·이동 영역 대신 "You’re all caught up!" 제목과 "Hide mastered"를 끄면 다시 볼 수 있다는 안내를 SHALL 표시한다.

#### Scenario: 숙련 카드만 있는 카테고리 숨기기
- **WHEN** 초기 데이터에서 "Mathematics"(1장, Mastered)만 선택하고 "Hide Mastered"를 켠다
- **THEN** "You’re all caught up!" 안내가 보이고, 카드·숙련도 버튼·이동 버튼·위치 표시는 화면과 키보드 탐색에 없다

#### Scenario: 숨기기 해제
- **WHEN** 위 상태에서 "Hide Mastered"를 끈다
- **THEN** Mathematics 카드가 다시 표시되고 "Card 1 of 1"이 보인다

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

### Requirement: 카드 문구 가운데 정렬
Study Mode 카드의 앞면 질문과 "Click to reveal answer" 안내, 뒷면 "Answer:" 안내와 정답은 모든 화면 폭에서 카드의 가로 가운데에 SHALL 정렬된다.

#### Scenario: 데스크톱 질문 면
- **WHEN** 뷰포트 폭 1440px에서 Study Mode 첫 카드의 앞면을 본다
- **THEN** 질문과 "Click to reveal answer"의 가로 중심이 카드 중심과 1px 이내로 일치한다

#### Scenario: 데스크톱 정답 면
- **WHEN** 뷰포트 폭 1440px에서 첫 카드를 뒤집는다
- **THEN** "Answer:"와 정답 "HyperText Markup Language"의 가로 중심이 카드 중심과 1px 이내로 일치한다

#### Scenario: 좁은 화면
- **WHEN** 뷰포트 폭 375px과 768px에서 같은 카드의 앞면과 뒷면을 본다
- **THEN** 네 문구의 가로 중심이 카드 중심과 1px 이내로 일치한다
