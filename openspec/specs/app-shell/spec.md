# app-shell Specification

## Purpose

플래시카드 앱의 공통 골격(헤더, 보기 전환, 반응형 배치)과 앱 전체에 적용되는 키보드·포커스·모션 접근성 기준을 정의한다.

## Requirements

### Requirement: 문서 구조
페이지는 영어 문서 언어, "Frontend Mentor | Flashcard app" 제목, 하나의 `main` 랜드마크, 앱 이름을 담은 하나의 1단계 제목을 SHALL 가진다. 로고는 앱 이름 "Flashcard"로 보조 기술에 전달된다.

#### Scenario: 랜드마크와 제목 확인
- **WHEN** 접근성 트리에서 페이지를 확인한다
- **THEN** `main` 랜드마크가 하나이고 1단계 제목이 하나이며, 제목 단계를 건너뛰지 않는다

### Requirement: 보기 전환
헤더의 Study Mode / All Cards 컨트롤은 두 보기 중 하나를 SHALL 선택 상태로 표시하고, 선택한 보기만 화면과 보조 기술에 노출한다. 첫 진입 시 Study Mode가 선택된다.

#### Scenario: 첫 진입
- **WHEN** 앱을 연다
- **THEN** Study Mode가 선택 상태로 표시되고 Study Mode 화면이 보인다

#### Scenario: All Cards로 전환
- **WHEN** "All Cards"를 실행한다
- **THEN** All Cards가 선택 상태가 되고 Study Mode 화면은 화면과 키보드 탐색에서 숨겨진다

#### Scenario: 다시 Study Mode로
- **WHEN** All Cards 보기에서 "Study Mode"를 실행한다
- **THEN** Study Mode 화면이 이전에 보던 카드 위치 그대로 보인다

### Requirement: 반응형 배치
레이아웃은 Figma의 모바일·태블릿·데스크톱 프레임에 맞춰 SHALL 바뀌며, 320px 폭과 텍스트 200% 확대에서도 가로 스크롤과 내용 겹침이 없다.

#### Scenario: 좁은 화면
- **WHEN** 뷰포트 폭 320px에서 Study Mode를 연다
- **THEN** 문서 너비가 뷰포트 폭을 넘지 않고 모든 버튼과 카드 문구가 잘리지 않는다

#### Scenario: 분기점 경계
- **WHEN** 각 분기점의 직전·직후 폭에서 화면을 연다
- **THEN** 해당 프레임의 배치가 적용되고 겹침이나 넘침이 없다

### Requirement: 키보드 조작
모든 인터랙티브 요소는 키보드만으로 SHALL 도달하고 실행할 수 있으며, 탭 순서는 화면의 읽기 순서를 따른다. 링크는 Enter, 버튼은 Enter와 Space로 실행된다.

#### Scenario: 탭 순서
- **WHEN** 페이지 처음부터 Tab으로 이동한다
- **THEN** 보기 전환, 카테고리 필터, Hide Mastered, Shuffle, 카드, I Know This, Reset Progress, Previous, Next 순으로 포커스가 이동한다

### Requirement: hover와 포커스 상태
모든 인터랙티브 요소는 Figma에 정의된 hover 피드백과 눈에 보이는 키보드 포커스 표시를 SHALL 가진다. 상태는 색 외의 수단(테두리, 외곽선 등)으로도 구분된다.

#### Scenario: 버튼 상태
- **WHEN** 각 버튼에 마우스를 올리거나 Tab으로 포커스를 준다
- **THEN** hover 상태와 포커스 외곽선이 보이고 텍스트 대비가 유지된다

### Requirement: 모션 감소
`prefers-reduced-motion: reduce` 환경에서는 장식성 전환과 애니메이션이 SHALL 꺼지며 기능은 그대로 동작한다.

#### Scenario: 동작 줄이기
- **WHEN** 동작 줄이기 설정을 켜고 카드 뒤집기, 보기 전환, 필터 열기를 실행한다
- **THEN** 애니메이션 없이 결과 상태로 바뀐다
