# Design

## Context

- 동기와 범위는 proposal.md, 요구 동작은 `specs/study-mode/spec.md`를 따른다.
- 현재 구조: `_base.scss`가 `* { max-inline-size: var(--measure, 60ch) }`로 모든 요소를 제한하고, `html, body, div, header, nav, main, article, section, picture, ul, img, a, output, footer`만 예외로 푼다. 나머지(`form`, `label`, `input`, `textarea`, `button`, `dialog`, `h1`~`h3`, `span`, `dl`, `li`, `p` 등)는 컴포넌트가 직접 `max-inline-size: none`을 지정해야 한다.
- 컴포넌트 예외 14곳:

| 파일:줄 | 요소 | `p` 여부 | 처리 |
| --- | --- | --- | --- |
| `_card-menu.scss:60` | `.c-card-menu__item`(button) | 아니오 | 삭제 |
| `_dialog.scss:10` | `.c-dialog`(dialog) | 아니오 | 유지(이유 변경: 브라우저 기본 `dialog:modal` 최대 폭 해제) |
| `_dialog.scss:71` | `.c-dialog__title`(h2) | 아니오 | 삭제 |
| `_flashcard.scss:12` | `.c-flashcard`(button) | 아니오 | 삭제 |
| `_flashcard.scss:26` | `.c-flashcard__face`(span) | 아니오 | 삭제 |
| `_flashcard.scss:117` | `.c-flashcard__body`(span) | 아니오 | 삭제 |
| `_form-field.scss:10` | `.c-card-form`(form) | 아니오 | 삭제 |
| `_form-field.scss:28` | `.c-field__label`(label) | 아니오 | 삭제 |
| `_form-field.scss:34` | `.c-field__control`(input·textarea) | 아니오 | 삭제 |
| `_form-field.scss:88` | `.c-field__error`(p) | 예 | 유지 |
| `_grid-card.scss:18` | `.c-grid-card__question`(h3) | 아니오 | 삭제 |
| `_grid-card.scss:37` | `.c-grid-card__answer p` | 예 | 유지 |
| `_stats.scss:29` | `.c-stats__list`(dl) | 아니오 | 삭제 |
| `_toast.scss:38` | `.c-toast__message`(p) | 예 | 유지 |

- (구현 중 발견) `_base.scss`의 요소 예외 목록은 같은 속성인 리셋의 `img { max-width: 100% }`도 덮어쓰고 있었다. 목록을 지우면 리셋이 다시 적용되어, 테두리 1px이 있는 24px 카드 메뉴 버튼 안의 24px 아이콘이 22px로 줄어든다. 그래서 `.c-card-menu__toggle img`에 `max-inline-size: none`을 새로 둔다. 마찬가지로 `.c-dialog`의 예외는 60ch가 아니라 브라우저 기본 `dialog:modal { max-width: calc(100% - 6px - 2em) }`을 풀고 있었으므로 유지한다(지우면 375px에서 대화상자가 6px 좁아짐).
- 탐색 단계 측정(브라우저 안에서 전역 규칙만 지움, Chromium): 375·768·1440px × 기본·200% 글자 × 7가지 화면 상태에서 크기가 바뀐 요소는 1440px Study 카드의 `.c-flashcard__hint` 두 개뿐이었다. 이 요소는 `span`이라 60ch로 잘린 채 flex 열의 시작 쪽에 붙어, 안의 가운데 정렬 글자가 카드 중심보다 52px 왼쪽에 놓였다. 규칙을 지우면 0px이 됐다. `p`에만 60ch를 남긴 경우에도 결과가 같았다.

## Goals / Non-Goals

**Goals:**
- 60ch 제한을 문단(`p`)에만 적용해, UI 요소가 기본적으로 부모 폭을 따르게 한다.
- 전역 규칙 때문에 생긴 예외를 지워 컴포넌트가 이 규칙을 의식하지 않게 한다.

**Non-Goals:**
- 문단 폭 기준(60ch) 자체를 바꾸지 않는다.
- `layout/_every-layout.scss`와 쓰이지 않는 레이아웃 클래스는 건드리지 않는다.
- 텍스트 200%·320px에서 헤더가 30px 넘치는 알려진 한계는 다루지 않는다.

## Decisions

### D1. 적용 대상은 `p` 하나
- `_base.scss`의 `*` 규칙과 요소 예외 목록을 지우고 `p { max-inline-size: var(--measure, 60ch); }`만 둔다. `--measure` 변수는 `.l-center`와 함께 쓰므로 유지한다.
- 대안 A: 규칙을 완전히 지움 → 측정 결과는 같지만, 나중에 긴 안내 문단이 생기면 읽기 폭 제한이 사라진다. 사용자 결정으로 B를 택했다.
- 대안 C: 규칙 유지 + 안내 문구 예외 추가 → 예외가 15곳으로 늘고 같은 버그가 반복될 수 있어 기각.
- `li`, `dd`, `figcaption` 같은 다른 텍스트 요소는 넣지 않는다. 지금 마크업에서 긴 본문을 담는 요소가 `p`뿐이다.

### D2. `p` 예외 3곳은 유지
- 그리드 카드 정답(`.c-grid-card__answer p`): 767px 1열에서 카드가 60ch보다 넓어지므로 필요하다.
- 폼 오류 문구(`.c-field__error`): 아이콘과 문구가 입력란 폭을 따르도록 유지한다.
- 토스트 문구(`.c-toast__message`): 토스트 폭은 화면 폭으로 이미 제한되고, 긴 문구가 버튼과 나란히 줄바꿈되게 유지한다.
- 주석의 "전역 60ch" 표현은 "문단 60ch"로 고친다.

### D3. 검증
- 이전 change의 Chromium 검증 스크립트(스크래치 폴더)를 다시 돌려 회귀를 확인하고, spec 시나리오인 카드 문구 중심 위치 측정을 추가한다.
- 변경 전후 전체 화면 스크린샷을 픽셀 단위로 비교해, 안내 문구 외에 바뀐 곳이 있는지 확인한다.

## Risks / Trade-offs

- [측정하지 않은 상태에서 폭이 넓어짐] 측정은 7가지 화면 상태만 다뤘다. 카테고리 패널, 빈 상태, 대화상자처럼 다른 제한(`min`, `calc`, 고정 rem)을 가진 요소는 영향이 없다고 판단했지만, 화면 폭 전체에서 픽셀 비교로 다시 확인한다.
- [`button`·`label`이 부모 폭을 넘음] 전역 제한이 사라지면 긴 글자의 버튼이 줄바꿈 대신 넓어질 수 있다. 이 앱의 버튼은 flex 항목이거나 고정 문구라 해당 사례가 없었지만, 텍스트 200% 측정에 포함한다.
- [Firefox 미설치] Chromium으로만 검증하고 Firefox는 미검증으로 기록한다.
