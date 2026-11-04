# Figma 값 정리 (작업 1.2)

파일 키 `LIUCvbM8aumON8VVswGYqI`. 모든 값은 루트 글꼴 16px 기준이다. 비교용 스크린샷은 저장소 밖(세션 스크래치 폴더 `figma/`)에 두며, 프리미엄 디자인이므로 커밋하지 않는다. 필요하면 아래 node-id로 `get_screenshot`을 다시 실행한다.

## 프레임

| 용도 | node-id |
| --- | --- |
| 데스크톱 1440: 질문 / 정답 / 숙련 | `300:1774` / `425:7955`(카드 `425:7971`) / `444:5493`(카드 영역 `444:5508`) |
| 태블릿 768 / 모바일 375 | `400:1284` / `400:1388` |
| 빈 상태: 카드 0장 / 모두 숙련 | `506:5399` / `506:5930` |
| hover / focus (Study Mode 데스크톱) | `429:9461` / `429:10196` |
| 카테고리 드롭다운 | `425:7899` |
| 컴포넌트: 버튼 / 탭 / 체크박스 / 드롭다운 항목 / 진행 바 | `350:2604` / `393:847` / `399:851` / `400:809` / `317:144` |
| 스타일 가이드: 색 / 글꼴 / 간격 / 둥글기 | `300:77` / `300:47` / `300:351` / `300:458` |

## 색

| Figma 변수 | 값 | 용도 |
| --- | --- | --- |
| Neutral 900 | `#2E1401` | 글자, 테두리, 그림자, 구분선 |
| Neutral 600 | `#6D5B4D` | "Card N of M", 카테고리 개수, 빈 상태 안내 |
| Neutral 100 | `#F7F3F0` | 페이지 배경, Border 버튼·드롭다운 항목 hover |
| Neutral 0 | `#FFFFFF` | 패널·버튼 배경 |
| Yellow 500 | `#F8CB46` | Primary 버튼, 선택된 탭, 체크박스(체크), 로고 원 |
| Blue 400 | `#92ADEB` | 카드 정답 면, Total 통계 블록, 질문 면 별 장식 |
| Blue 600 | `#5072C7` | 포커스 링 |
| Teal 400 | `#47D9C9` | Mastered 통계 블록, Mastered 배지 |
| Pink 400 | `#FC8AE5` | 카드 질문 면, Not Started 블록, 정답 면 별 장식 |
| Pink 500 | `#F073A3` | In Progress 블록 |
| Pink 700 | `#E11966` | 오류(다음 change) |

## 글꼴 (Poppins)

| 프리셋 | 크기/굵기/줄 간격 | 용도 |
| --- | --- | --- |
| 1 / 1 Tablet / 1 Mobile | 40 / 32 / 24px, 700, 1.2 | 카드 질문, 통계 숫자 |
| 2 | 24px, 600, 1.2 | "Study Statistics", 정답 텍스트, 빈 상태 제목 |
| 4 SemiBold | 16px, 600, 1.2 | 탭 |
| 4 Medium | 16px, 500, 1.2 | 버튼, Hide Mastered, 통계 라벨, "Click to reveal answer"(opacity .8), "Answer:" |
| 4 Regular | 16px, 400, 1.4 | 빈 상태 안내 |
| 5 | 14px, 500, 1.4 | "Card N of M", 드롭다운 항목 |
| 6 | 12px, 500, 1.3, -3% | 카테고리 태그, 진행 표시, Mastered 배지 |

## 간격·둥글기·그림자

- 간격 변수: 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 64
- 둥글기: full 999, 16(패널·카드), 12(통계 항목), 8(드롭다운), 4(체크박스)
- 패널 테두리: 위·왼쪽 1px, 오른쪽·아래 3px(Neutral 900)
- 통계 항목 테두리: 위·왼쪽 1px, 오른쪽·아래 2px. 카드: 2px + `2px 2px 0 #2E1401`
- 탭 묶음: `drop-shadow(1px 2px 0 #2E1401)`. 태그: `1px 1px 0`
- 드롭다운: 1px 테두리, 둥글기 8, `0 3px 8px rgba(46,20,1,.2)`, 항목 사이 1px 구분선, 항목 패딩 8/16

## 상태

| 요소 | 기본 | Hover | Focus |
| --- | --- | --- | --- |
| Primary(I Know This) | 노랑, `2px 2px 0` 그림자 | 그림자 `4px 4px 0` | 그림자 `3px 3px 0 Blue 600` |
| Primary Disabled(Already Mastered) | opacity .5 | 해당 없음 | 해당 없음 |
| Secondary(Reset, Go to All Cards) | 흰색, `2px 2px 0` | `4px 4px 0` | `3px 3px 0 Blue 600` |
| Border(필터, Shuffle, Previous, Next) | 흰색, 1px | 배경 Neutral 100 | 링 `0 0 0 2px #fff, 0 0 0 4px Blue 600` |
| 탭(선택) | 노랑 + 1px | 해당 없음 | 링(위와 같음) |
| 탭(미선택) | 흰색, 테두리 없음 | 1px 테두리 | 1px 테두리 + 링 |
| 체크박스 | 16px, 1px, 둥글기 4 | `1px 1px 0` 그림자 | 링 |
| 드롭다운 항목 | 흰색 | Neutral 100 | 2px Blue 600 테두리 |

## 반응형

| | 모바일 375 | 태블릿 768 | 데스크톱 1440 |
| --- | --- | --- | --- |
| 페이지 패딩 | 16 / 위 16, 아래 40 | 32 / 위 20, 아래 64 | 100 / 위아래 24 |
| 섹션 간격 | 24 | 24 | 32(헤더↔본문, 카드↔통계) |
| 로고 | 마크만(40×40) | 마크 + 글자 | 마크 + 글자 |
| 탭 | 패딩 10/12 | 높이 44, 패딩 12/16 | 같음 |
| 툴바 | 필터 아래 Hide Mastered 줄바꿈, 패딩 12/16 | 한 줄, 패딩 20 | 같음 |
| 카드 | 패딩 20/16, 높이 360, 질문 24px | 패딩 24, 질문 32px | 질문 40px |
| 카드 영역 | 패딩 24/16, 액션 버튼 세로·전체 폭(간격 10) | 패딩 20, 가로(간격 20) | 같음 |
| 이전/다음 | 40×40 아이콘 버튼(패딩 12), 이름은 시각적으로 숨김 | 아이콘 + 글자 | 같음 |
| 통계 | 1열, 간격 16, 항목 높이 120, 숫자 24px, 패딩 20/16 | 2×2, 간격 20, 숫자 32px, 패딩 16/20 | 오른쪽 열 392, 간격 20, 숫자 40px, 패딩 24 |

분기점은 768px / 1024px(사용자 결정)이다.

## 자산 대응 (제공 자산 사용)

| Figma | `src/images` |
| --- | --- |
| Logo(마크 + 글자) / Logo Mark | `logo-large.svg` / `logo-small.svg` |
| angle-down/left/right | `icon-chevron-down/left/right.svg` |
| shuffle / check-circle / undo-alt | `icon-shuffle.svg` / `icon-circle-check.svg` / `icon-reset.svg` |
| brain-solid(Mastered 배지) | `icon-mastered.svg` |
| layers / brain / book / box | `icon-stats-total/mastered/in-progress/not-started.svg` |
| 체크 표시 | `icon-check.svg` |
| 카드 패턴 / 별 | `pattern-flashcard-bg.svg` / `pattern-star-blue/pink/yellow.svg` |

MCP 출력에서 Previous 아이콘이 shuffle 이미지로 연결된 곳이 있다(`300:1774`). 태블릿·모바일·버튼 컴포넌트는 angle-left이므로 `icon-chevron-left.svg`를 쓴다.

## spec 반영 사항

- 빈 상태 두 종류, "All Categories" 항목 없음: 사용자 결정에 따라 spec 갱신
- 숙련 카드: "I Know This"가 비활성 "Already Mastered"로 바뀌고, 진행 표시 대신 Mastered 배지(`5/5`)가 보임
- 필터 버튼 라벨은 선택과 상관없이 항상 "All Categories"(사용자 결정)
- 정답 면: 파랑 배경, "Answer:" + 정답, 별 색이 반전됨(오른쪽 위 분홍, 왼쪽 아래 노랑)
- 드롭다운 카테고리는 이름 오름차순. Figma 개수(JavaScript 14, Web Development 5)는 예시 값이며, 실제로는 데이터에서 계산
- 통계 라벨: 데스크톱은 "Total Cards", 태블릿·모바일은 "Total cards"로 다르다. 데스크톱 표기로 통일하고 보고
