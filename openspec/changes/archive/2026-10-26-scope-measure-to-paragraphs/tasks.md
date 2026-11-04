# Tasks

## 1. 변경 전 기준 확보

- [x] 1.1 현재 소스로 스크래치 미리보기를 만들고 375·768·1024·1440px × 기본·200% 글자 × Study(앞면·뒷면·필터 열림·빈 상태 2종)·All Cards(기본·폼 오류·메뉴 열림·수정·삭제 대화상자·토스트) 전체 화면 스크린샷을 기준으로 저장한다. `dist`는 건드리지 않는다. 확인: 스크래치 폴더에 기준 스크린샷 세트가 있고 `dist` 수정 시각이 바뀌지 않았다

## 2. 규칙 범위 변경 (study-mode)

- [x] 2.1 `_base.scss`의 `* { max-inline-size: … }` 규칙과 요소 예외 목록을 지우고 `p { max-inline-size: var(--measure, 60ch); }`로 바꾼다. 섹션 주석을 새 의도에 맞게 고친다. 확인: `node -e "require('sass').compile('src/scss/style.scss')"` 통과, 컴파일 결과에 `*{max-inline-size` 규칙이 없고 `p{max-inline-size` 규칙이 하나 있다
- [x] 2.2 design.md 표의 "삭제" 10곳에서 `max-inline-size: none`과 관련 주석을 지우고, "유지" 3곳(p)의 주석을 "문단 60ch" 기준으로, `.c-dialog`의 주석을 브라우저 기본 최대 폭 해제로 고친다. `.c-card-menu__toggle img`에 아이콘 축소 방지 예외를 추가한다(design.md Context 참고). 확인: `grep -rn "max-inline-size: none" src/scss/components`가 `_form-field`(오류 문구)·`_grid-card`(정답 p)·`_toast`(문구)·`_dialog`(dialog)·`_card-menu`(아이콘) 5줄만 출력하고 SCSS 컴파일 통과

## 3. 검증

- [x] 3.1 spec "카드 문구 가운데 정렬"을 측정한다. 확인: 375·768·1440px에서 앞면 질문·안내, 뒷면 "Answer:"·정답의 글자 중심이 카드 중심과 1px 이내이고, 1440px 스크린샷이 Figma `300:1774`와 같은 위치다
- [x] 3.2 1.1과 같은 조건으로 스크린샷을 다시 찍어 픽셀 비교한다. 확인: 차이가 나는 화면은 1440·1024px Study 카드 안내 문구 영역뿐이며, 그 외 차이는 원인과 함께 보고에 기록한다
- [x] 3.3 이전 change의 Chromium 검증 스크립트(데이터·위치 보정, 그리드·메뉴·폼·대화상자·토스트, 통합, 320px)를 다시 실행한다. 확인: 모든 항목 통과(텍스트 200%·320px 헤더 30px 넘침은 기존 알려진 한계로 기록), 콘솔 오류·404 없음, Firefox는 미검증으로 기록
- [x] 3.4 `node --check src/js/main.js`와 `git diff --check`를 실행하고 변경 파일이 `src/scss/base/_base.scss`와 design.md 표의 컴포넌트 파일로만 한정됐는지 확인한다. 확인: 두 명령 통과, `git status`에 범위 밖 파일 없음

## Workflow follow-up

- 리뷰 후 `/opsx:archive`로 아카이브하고 `study-mode` main spec에 요구사항이 반영됐는지 확인한다.
