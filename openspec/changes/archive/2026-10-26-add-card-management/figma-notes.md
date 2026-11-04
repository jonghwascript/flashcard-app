# Figma 값 정리 — All Cards (작업 1.1)

- 원본 파일 `LIUCvbM8aumON8VVswGYqI`는 편집 권한이 없어 `get_design_context`·`get_variable_defs`가 거부된다. 사용자가 만든 복제본 `NiCIHgkKvoskwku9Js9ppV`에서 값을 읽었고, 페이지·node-id는 원본과 같다.
- 모든 값은 루트 글꼴 16px 기준이다. 스크린샷은 저장소 밖(세션 스크래치 폴더 `figma/`)에 두며 커밋하지 않는다.
- 이전 change의 토큰·상태 값은 [archive figma-notes](../archive/2026-10-26-add-flashcard-study-mode/figma-notes.md)를 따른다. 여기에는 새로 쓰는 값만 적는다.

## 프레임

| 용도 | node-id |
| --- | --- |
| 데스크톱 1440 All cards / 태블릿 768 / 모바일 375 | `300:2267` / `403:876` / `403:877` |
| 생성 폼 패널 / 입력(기본) / 입력(오류) | `300:2282` / `393:794` / `506:4703` |
| 오류 상태 화면 / 빈 상태 화면 / 빈 상태 블록 | `506:4696` / `506:5529` / `506:5836` |
| 그리드 카드(진행 중) / (숙련) | `300:2605` / `300:2668` |
| 카드 메뉴 / 메뉴 버튼 Default·Hover | `403:861` / `349:1287`·`349:1289` |
| Hover 화면 / Focus 화면 | `429:9561` / `429:10278` |
| Edit 대화상자 / Delete 대화상자 / 오버레이 | `439:3862` / `444:3968` / `439:3860` |
| 토스트(생성) / 토스트 3종 | `444:4863` / `444:5477` |
| Load More(Pagination) | `425:5799` |

## 새 토큰

| Figma 변수 | 값 | 용도 |
| --- | --- | --- |
| colors/pink/700 | `#E11966` | 오류 테두리·그림자·문구 |
| corner-radius/6 | 6px | 입력란 |
| text-preset-3 | 20px / 600 / 1.2 | 그리드 카드 질문 |
| text-preset-5 Regular | 14px / 400 / 1.4 | 오류 문구 |
| text-preset-4 SemiBold | 16px / 600 / 1.2 | Create Card·Update Card·Cancel·Delete Card 버튼 |

## 생성 폼

| 항목 | 값 |
| --- | --- |
| 패널 | 흰색, 테두리 위·왼쪽 1px, 오른쪽·아래 **4px**(Study 패널은 3px), 둥글기 16 |
| 패널 패딩 / 항목 간격 | 데스크톱 32, 태블릿 24, 모바일 20 / 폼↔버튼 24 |
| 필드 간격 / 라벨↔입력 | 16 / 8 |
| 라벨 | preset 4 Medium |
| 입력란 | 흰색, 1px Neutral 900, 둥글기 6, 패딩 16, 글자 preset 4 Regular, placeholder Neutral 600 |
| Answer textarea | 높이 100px(패딩 포함) |
| placeholder | "e.g., What is the capital of France?", "e.g., Paris", "e.g., Geography" |
| Create Card | Primary(노랑, `2px 2px 0` 그림자), 패딩 12/20, 아이콘 `icon-circle-plus` 16px, 글자 SemiBold |

| 입력란 상태 | 테두리 | 그림자 |
| --- | --- | --- |
| 기본 | Neutral 900 | 없음 |
| Hover | Neutral 900 | `2px 2px 0 Neutral 900` |
| Focus | Blue 600 | `2px 2px 0 Blue 600` |
| 오류 | Pink 700 | `2px 2px 0 Pink 700` |

- 오류 문구: 입력란 아래 8px, `icon-error.svg`(14×15) + 6px + preset 5 Regular, Pink 700.

## 툴바·그리드·Load More

| 항목 | 값 |
| --- | --- |
| 툴바 | 패널 없이 배경 위에 둔다. 위 패딩 16. 구성은 Study 툴바와 같다(모바일은 Hide Mastered가 아래 줄) |
| 섹션 간격 | 데스크톱 32, 태블릿·모바일 24(폼 ↔ 툴바 ↔ 그리드 ↔ Load More) |
| 그리드 | 데스크톱 3열(397px), 태블릿 2열(340px), 모바일 1열. 간격 데스크톱·태블릿 24, 모바일 20 |
| 카드 높이 | 내용에 따라 다르며 같은 줄의 카드는 같은 높이 |
| Load More | 가운데, 위 패딩 16. 흰색, 1px, 둥글기 full, 패딩 12/20, `2px 2px 0` 그림자, preset 4 Medium |

## 그리드 카드

| 영역 | 값 |
| --- | --- |
| 카드 | 흰색, 테두리 위·왼쪽 1px, 오른쪽·아래 3px, 둥글기 16 |
| 질문 | 패딩 16, 아래 1px 구분선, preset 3(20/600/1.2) |
| 정답 | 패딩 16, 간격 6, 아래 1px 구분선, preset 5 Medium. "Answer:"는 opacity .6. 남는 높이를 이 영역이 채운다 |
| 푸터 | 높이 56, 좌우 패딩 16, 간격 8. 태그 칸과 진행 칸은 오른쪽 1px 구분선과 오른쪽 패딩 10 |
| 태그 / 진행 / Mastered 배지 | Study의 `.c-tag`, `.c-progress`, `.c-mastered-badge`와 같다 |
| 메뉴 버튼 | 24×24, 둥글기 4, `icon-menu.svg`(24×24) |

| 메뉴 버튼 상태 | 값 |
| --- | --- |
| 기본 | 테두리·배경 없음 |
| Hover / 메뉴 열림 | 흰 배경, 1px 테두리, `2px 2px 0` 그림자 |
| Focus | Figma 프레임은 열림 상태와 같은 모양이다. 키보드 표시는 공통 포커스 링(`0 0 0 2px #fff, 0 0 0 4px Blue 600`)을 더한다 |

## 카드 메뉴

- 140px, 흰색, 1px 테두리, 둥글기 8, `0 3px 8px rgba(46,20,1,.2)`, 항목 사이 1px 구분선.
- 항목: 패딩 8/16, 간격 8, 아이콘 16px(`icon-edit`, `icon-delete`), preset 5 Medium.
- 항목 Hover: 배경 Neutral 100. 항목 Focus: 2px Blue 600 테두리. 카테고리 드롭다운 항목과 같다.
- 위치: 메뉴 버튼 위쪽 오른쪽 끝에 맞춰 열린다(Hover 프레임 기준 버튼 위로 겹침).

## 대화상자

| 항목 | Edit | Delete |
| --- | --- | --- |
| 크기 | 폭 600 | 폭 600 |
| 테두리 | 위·왼쪽 1px, 오른쪽·아래 4px, 둥글기 16 | 같음 |
| 패딩 / 간격 | 32 / 24 | 본문 24(제목↔안내 8), 구분선 1px, 버튼 줄 위 12·아래 16·좌우 24, 버튼 간격 10 |
| 제목 | "Edit your card", preset 2 | "Delete this card?", preset 2 |
| 본문 | 생성 폼과 같은 필드(입력값 글자색 Neutral 900) | "This action can’t be undone.", preset 4 Regular |
| 버튼 | 오른쪽 정렬 "Update Card"(Primary, SemiBold) | "Cancel"(흰색 1px, 패딩 12/16, 그림자 없음, SemiBold), "Delete Card"(Primary, SemiBold) |
| 닫기 | 오른쪽 위(오른쪽 12, 위 15) `icon-cross` 16px | 없음 |

- 오버레이: Neutral 900, opacity .7.
- 태블릿·모바일 대화상자 프레임은 없다. 화면 폭에서 좌우 16px 여백을 두고 줄이며, 패딩은 생성 폼처럼 모바일 20·태블릿 24로 줄인다(추정).

## 토스트

- 흰색, 1px 테두리, 둥글기 full, 패딩 10/16, 그림자 `0 3px 8px rgba(46,20,1,.2), 2px 2px 0 Neutral 900`.
- 문구 preset 4 Medium, 오른쪽 닫기 `icon-cross` 16px. 데스크톱 프레임에서 폭 300, 화면 위 116·오른쪽 60에 떠 있다.
- 태블릿·모바일 프레임은 없다. 모바일에서는 좌우 16px 여백 안에 둔다(추정).

## 빈 상태

- "No cards yet" preset 2 + "Add your first card using the form above and it will show up here." preset 4 Regular, 간격 10, 가운데 정렬, 패딩 20, 높이 250. 문구 색은 Neutral 900이다(Study 빈 상태 안내는 Neutral 600).
- 툴바는 숨긴다(Figma에서 `hidden`).

## spec과의 차이

- 그리드 열 수(모바일 1 / 태블릿 2 / 데스크톱 3)는 spec과 같다.
- Hover 프레임의 버튼 글자는 "Load more", 기본 프레임은 "Load More"다. README와 기본 프레임에 맞춰 "Load More"를 쓴다.
- "You’re all caught up!" 빈 상태는 All Cards 프레임에 없다. spec대로 Study Mode 블록을 재사용한다.
