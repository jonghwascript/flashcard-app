# Spec Delta

## ADDED Requirements

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
