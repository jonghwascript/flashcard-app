# all-cards-view Specification

## Purpose

All Cards 보기에서 사용자가 전체 플래시카드의 내용과 숙련도를 한눈에 훑어보고, 각 카드를 고치거나 지우는 작업을 시작할 수 있게 한다.

## Requirements

### Requirement: 보기 구성
All Cards 보기는 위에서부터 카드 생성 폼, 필터 툴바(카테고리 필터, Hide Mastered, Shuffle), 카드 그리드, "Load More" 버튼을 SHALL 차례로 표시한다. 탭 순서는 이 읽기 순서를 따른다.

#### Scenario: 탭 순서
- **WHEN** All Cards 보기에서 보기 전환 버튼 다음부터 Tab으로 이동한다
- **THEN** Question, Answer, Category, Create Card, 카테고리 필터, Hide Mastered, Shuffle, 그리드 카드별 메뉴 버튼, Load More 순으로 포커스가 이동한다

### Requirement: 그리드 카드 내용
그리드의 각 카드는 질문(제목), "Answer:" 라벨과 정답, 카테고리 태그, 숙련도 표시, 메뉴 버튼을 SHALL 보인다. 숙련도는 `knownCount`가 5 미만이면 진행 막대와 `N/5`, 5이면 "Mastered 5/5" 배지로 표시한다. 정답은 뒤집지 않고 항상 보인다.

#### Scenario: 진행 중 카드
- **WHEN** 초기 데이터로 All Cards 보기를 연다
- **THEN** 두 번째 카드에 질문 "What is the difference between 'let' and 'const' in JavaScript?", 정답, "JavaScript" 태그, "2/5"가 보인다

#### Scenario: 숙련 카드
- **WHEN** 초기 데이터로 All Cards 보기를 연다
- **THEN** 카드 fc004("What is the capital of France?")에는 "Mastered 5/5" 배지가 보인다

### Requirement: 그리드 카드 접근성
그리드는 카드 목록으로 SHALL 전달되고, 각 카드의 질문은 제목으로 탐색할 수 있다. 메뉴 버튼은 어느 카드의 메뉴인지 알 수 있는 접근 가능한 이름을 가진다.

#### Scenario: 스크린 리더로 목록 탐색
- **WHEN** 스크린 리더로 그리드를 탐색한다
- **THEN** 목록 항목 수가 안내되고, 메뉴 버튼 이름에는 해당 카드의 질문이 포함된다

### Requirement: 그리드 순서와 필터
그리드는 All Cards 보기의 필터 결과를 SHALL 표시한다. 필터와 섞기가 없으면 전체 카드 목록 순서(초기 데이터 순서, 새 카드는 끝)를 따른다.

#### Scenario: 초기 순서
- **WHEN** 필터 없이 All Cards 보기를 연다
- **THEN** 첫 카드는 fc001 "What does HTML stand for?"이다

#### Scenario: 카테고리 필터
- **WHEN** All Cards 보기에서 "Geography"만 선택한다
- **THEN** 그리드에는 Geography 카드 4장만 보인다

### Requirement: 처음 12장 표시
그리드는 필터 결과 중 처음 12장을 SHALL 표시한다. 표시하지 않은 카드가 남아 있을 때만 "Load More" 버튼을 보인다.

#### Scenario: 초기 표시
- **WHEN** 초기 데이터(40장)로 All Cards 보기를 연다
- **THEN** 카드 12장과 "Load More" 버튼이 보인다

#### Scenario: 12장 이하
- **WHEN** "Geography"(4장)만 선택한다
- **THEN** 4장이 모두 보이고 "Load More" 버튼은 화면과 키보드 탐색에 없다

### Requirement: 더 보기
"Load More"를 실행하면 다음 12장이 SHALL 추가로 표시되고, 포커스는 새로 나타난 첫 카드의 메뉴 버튼으로 이동한다. 남은 카드가 없으면 버튼이 사라진다.

#### Scenario: 끝까지 보기
- **WHEN** 40장 상태에서 "Load More"를 세 번 누른다
- **THEN** 표시 수는 24, 36, 40장으로 늘고 마지막 실행 후 버튼이 사라진다

#### Scenario: 포커스 이동
- **WHEN** 키보드로 "Load More"를 한 번 실행한다
- **THEN** 포커스는 13번째 카드의 메뉴 버튼에 있다

### Requirement: 표시 개수 초기화
All Cards 보기의 카테고리 선택, Hide Mastered, Shuffle이 바뀌면 표시 개수는 다시 12장으로 SHALL 돌아간다. 카드 생성·수정·삭제나 보기 전환은 표시 개수를 바꾸지 않는다.

#### Scenario: 필터 변경
- **WHEN** 24장을 표시한 상태에서 "Hide Mastered"를 켠다
- **THEN** 숙련 카드를 뺀 결과 중 처음 12장만 보인다

#### Scenario: 삭제 후 유지
- **WHEN** 24장을 표시한 상태에서 카드 하나를 지운다
- **THEN** 이어서 있던 카드가 채워져 24장이 계속 보인다

### Requirement: 카드 메뉴
카드의 메뉴 버튼은 "Edit"와 "Delete" 항목을 가진 메뉴를 SHALL 열고 닫으며, 열림 상태를 보조 기술에 전달한다. Escape를 누르거나 메뉴 바깥을 클릭하면 닫히고, Escape로 닫으면 포커스가 메뉴 버튼으로 돌아간다. 한 번에 메뉴 하나만 열린다.

#### Scenario: 키보드로 메뉴 사용
- **WHEN** 메뉴 버튼에서 Enter로 메뉴를 열고 Tab으로 "Delete"에 가서 Enter를 누른다
- **THEN** 메뉴가 닫히고 그 카드의 삭제 확인 대화상자가 열린다

#### Scenario: 다른 메뉴 열기
- **WHEN** 한 카드의 메뉴가 열린 상태에서 다른 카드의 메뉴 버튼을 누른다
- **THEN** 먼저 열린 메뉴는 닫히고 새 메뉴만 열린다

### Requirement: 카드가 없을 때
전체 카드가 0장이면 All Cards 보기는 생성 폼은 그대로 두고 툴바·그리드·Load More 대신 "No cards yet" 제목과 "Add your first card using the form above and it will show up here." 안내를 SHALL 표시한다.

#### Scenario: 마지막 카드 삭제
- **WHEN** 카드가 1장 남은 상태에서 그 카드를 지운다
- **THEN** "No cards yet"과 안내가 보이고 툴바와 Load More는 화면과 키보드 탐색에 없다

### Requirement: 모두 숙련해 숨겨졌을 때
카드는 있지만 All Cards 보기의 "Hide Mastered" 때문에 표시할 카드가 0장이면 그리드 대신 "You’re all caught up!" 제목과 "Hide mastered"를 끄면 다시 볼 수 있다는 안내를 SHALL 표시하며, 툴바는 유지한다.

#### Scenario: 숙련 카테고리 숨기기
- **WHEN** All Cards 보기에서 "Mathematics"(1장, Mastered)만 선택하고 "Hide Mastered"를 켠다
- **THEN** "You’re all caught up!" 안내와 툴바가 보이고 Load More는 없다

### Requirement: 반응형 그리드
그리드는 모바일에서 1열, 태블릿에서 2열, 데스크톱에서 3열로 SHALL 배치된다. 긴 질문·정답·카테고리는 줄바꿈되어 카드 밖으로 넘치거나 가로 스크롤을 만들지 않는다.

#### Scenario: 분기점별 열 수
- **WHEN** 뷰포트 폭 767px, 768px, 1023px, 1024px에서 All Cards 보기를 연다
- **THEN** 각각 1열, 2열, 2열, 3열로 표시되고 가로 넘침이 없다

#### Scenario: 긴 텍스트
- **WHEN** 공백 없는 60자 정답으로 카드를 만든 뒤 320px 폭에서 그리드를 본다
- **THEN** 정답이 카드 안에서 줄바꿈되고 문서 너비가 뷰포트를 넘지 않는다

### Requirement: All Cards 상호작용 상태
생성 폼 입력란, Create Card, 메뉴 버튼, 메뉴 항목, Load More, 대화상자 버튼, 토스트 닫기 버튼은 Figma에 정의된 hover 피드백과 눈에 보이는 키보드 포커스 표시를 SHALL 가진다.

#### Scenario: 상태 확인
- **WHEN** 각 요소에 마우스를 올리거나 Tab으로 포커스를 준다
- **THEN** Figma All Cards hover·focus 프레임과 같은 상태 표시가 보이고 텍스트 대비가 유지된다
