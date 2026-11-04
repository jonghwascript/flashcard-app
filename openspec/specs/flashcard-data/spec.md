# flashcard-data Specification

## Purpose

플래시카드 목록과 각 카드의 숙련도를 한 곳에서 관리하고, 브라우저 세션이 바뀌어도 사용자의 학습 진행이 유지되도록 한다.

## Requirements

### Requirement: 초기 카드 데이터 로드
저장된 카드 데이터가 없으면 앱은 제공된 `data.json`의 `flashcards` 배열을 초기 데이터로 SHALL 사용한다. 각 카드는 `id`, `question`, `answer`, `category`, `knownCount` 값을 유지한다.

#### Scenario: 첫 방문
- **WHEN** 저장된 카드 데이터가 없는 브라우저에서 앱을 연다
- **THEN** `data.json`의 카드 40장이 파일에 적힌 순서와 `knownCount` 값 그대로 표시 대상이 된다

#### Scenario: 초기 데이터를 불러오지 못함
- **WHEN** 저장된 데이터가 없고 `data.json` 요청이 실패한다
- **THEN** 앱은 카드를 불러올 수 없다는 안내 문구를 보이고, 빈 상태에서 오류 없이 동작한다

### Requirement: 숙련도 범위
각 카드의 `knownCount`는 0 이상 5 이하의 정수로 SHALL 유지된다. 범위를 벗어나는 조작은 값을 바꾸지 않는다.

#### Scenario: 최대값에서 증가 시도
- **WHEN** `knownCount`가 5인 카드의 숙련도를 올리려 한다
- **THEN** `knownCount`는 5로 유지된다

### Requirement: 숙련 상태 분류
카드는 `knownCount`에 따라 SHALL 정확히 하나의 상태로 분류된다: 0은 Not Started, 1–4는 In Progress, 5는 Mastered.

#### Scenario: 경계값 분류
- **WHEN** 카드의 `knownCount`가 각각 0, 1, 4, 5이다
- **THEN** 상태는 각각 Not Started, In Progress, In Progress, Mastered이다

### Requirement: 진행 상황 영속화
카드의 `knownCount`가 바뀌거나 카드가 추가·수정·삭제되면 앱은 전체 카드 데이터를 브라우저 저장소에 SHALL 저장하고, 다음 방문 시 `data.json` 대신 저장된 데이터를 복원한다.

#### Scenario: 새로고침 후 복원
- **WHEN** 사용자가 카드 fc001의 숙련도를 0에서 1로 올리고 페이지를 새로고침한다
- **THEN** fc001의 숙련도는 1로 표시되고 통계도 그 값을 반영한다

#### Scenario: 카드 변경 후 복원
- **WHEN** 사용자가 카드 하나를 만들고, fc002의 질문을 고치고, fc003을 지운 뒤 페이지를 새로고침한다
- **THEN** 새 카드와 고친 질문이 그대로 보이고 fc003은 없으며 Total Cards는 40이다

#### Scenario: 저장 데이터 손상
- **WHEN** 저장소에 읽을 수 없는 형식의 값이 들어 있다
- **THEN** 앱은 그 값을 무시하고 `data.json`의 초기 데이터로 시작한다

#### Scenario: 저장소 사용 불가
- **WHEN** 브라우저가 저장소 접근을 막는다(예: 차단된 사이트 데이터)
- **THEN** 앱은 메모리 상태만으로 계속 동작하고 오류로 멈추지 않는다

### Requirement: 새 카드 식별자
새로 만든 카드는 현재 카드 목록 어디에도 없는 고유한 문자열 `id`를 SHALL 받는다. 카드를 지운 뒤 다시 만들어도 남아 있는 카드와 `id`가 겹치지 않는다.

#### Scenario: 연속 생성
- **WHEN** 같은 내용으로 카드를 두 번 연속 만든다
- **THEN** 두 카드는 서로 다른 `id`를 가지며 하나를 지워도 다른 하나는 남는다

### Requirement: 빈 목록 유지
사용자가 모든 카드를 지우면 빈 카드 목록이 SHALL 저장되고, 다음 방문에도 `data.json`의 초기 카드로 되돌아가지 않는다.

#### Scenario: 모두 지운 뒤 새로고침
- **WHEN** 모든 카드를 지우고 페이지를 새로고침한다
- **THEN** Study Mode에는 "No cards to study", All Cards에는 "No cards yet"이 보이고 Total Cards는 0이다
