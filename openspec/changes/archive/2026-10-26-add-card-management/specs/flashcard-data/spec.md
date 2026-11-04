# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
