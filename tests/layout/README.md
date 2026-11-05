# 레이아웃 검증

프로젝트 루트에서 다음 명령을 실행합니다. 설치된 `@playwright/test`와 Sass를 사용하며 앱 결과·fixture·캡처는 OS 임시 폴더에 생성합니다. `dist`는 변경하지 않습니다.

```powershell
node tests/layout/baseline.cjs
node tests/layout/app.cjs
$env:LAYOUT_PREVIEW = '<app.cjs가 출력한 임시 root 경로>'
node tests/layout/overlays.cjs
node tests/layout/stress.cjs
node tests/layout/structure.cjs
node tests/layout/includes.cjs
```

`baseline.cjs`는 현재 소스의 기준 화면 19장과 요소 크기, 소스·dist 해시, 320px/root16·32 넘침을 기록합니다. 리팩터링 전 기준은 `C:/Users/jongh/AppData/Local/Temp/layout-baseline-H46Uuz/baseline.json`입니다. 경로는 이 작업 환경의 임시 증거이며 다른 환경에서는 다시 생성합니다.

기본 브라우저는 Windows의 설치된 Google Chrome입니다. 다른 경로는 `CHROME_PATH`, Firefox는 `LAYOUT_BROWSER=firefox`와 선택적인 `FIREFOX_PATH` 환경 변수로 지정합니다. Playwright와 호환되는 브라우저가 필요하며 설치·다운로드를 자동 실행하지 않습니다.

미리보기는 현재 정적 자산인 `src/js`, `src/images`, `src/data.json`을 복사합니다. 글꼴은 페이지의 Google Fonts 링크를 사용하므로 로컬 `src/fonts` 폴더를 요구하지 않습니다. `structure.cjs`는 브라우저에서 앱을 초기화한 뒤 실제 DOM의 `classList`를 검사하므로 JavaScript 주석의 예시 HTML은 검사에 포함되지 않습니다.

`render-html.cjs`는 Gulp와 동일한 `gulp-file-include` 엔진의 `@@`·`@file` 옵션으로 페이지를 조합해 문자열을 반환합니다. Gulp 태스크나 dest/clean을 실행하지 않습니다. `includes.cjs`는 OS 임시 폴더에서 단일·중첩 include의 상대 경로와 누락 파일 오류·CLI 실패 종료를 검사합니다. `node tests/layout/render-html.cjs`는 조합 결과를 표준 출력으로 보여 줍니다.

## HTML 부분 파일 검증

미리보기 helpers와 앱 검사, 구조 검사는 모두 `render-html.cjs`의 조합 결과를 사용합니다. index만 복사하거나 index의 클래스만 수집하지 않습니다. 렌더러는 실패를 상위 호출로 전달하고 검증 CLI는 오류 시 종료 코드 1을 반환합니다.

`html-dom.cjs`는 앱 스크립트를 실행하지 않은 작성 DOM의 요소 트리·속성·문구를 비교합니다. 일반 들여쓰기 공백은 정규화하고 pre/textarea/script/style의 내용은 보존합니다. 기준은 저장소 밖에 보관합니다.

```powershell
# baseline.cjs가 만든 임시 index.html에서 비교 기준을 캡처합니다. 경로는 실제 임시 경로로 바꿉니다.
node tests/layout/html-dom.cjs --capture '<임시 경로>/index.html' '<임시 경로>/dom.json'
node tests/layout/html-dom.cjs --compare '<임시 경로>/dom.json'
```

## 책임 경계

레이아웃 클래스는 부모·형제 관계에 따른 외부 크기·위치·간격과 반응형 열 배분을 담당합니다. 컴포넌트는 패딩·테두리·색상·글꼴·상태 및 자기 내부 표현을 담당합니다. 내부 아이콘 크기, 입력 컨트롤 너비, 진행 막대의 숙련도별 폭, 카드 면의 중첩·뒤집기, 닫기 버튼의 패널 내부 좌표는 컴포넌트에 유지합니다. `display`, `position`, `gap` 속성 유무만으로 위반을 판정하지 않습니다.

| 영역 | 외부 배치 소유자 | 유지하는 내부 표현 |
| --- | --- | --- |
| 앱 셸·헤더·보기 전환 | l-app, l-app-header, l-view-toggle | 페이지 패딩·로고 비율·버튼 테두리·선택 상태 |
| 툴바·필터 | l-toolbar, l-category-filter | 필터 항목의 체크박스·라벨 정렬과 외형 |
| 학습 화면 | l-study, l-study-panel, l-study-card | 카드 양면의 grid-area·회전·장식, 패널 패딩 |
| 통계 | l-stats, l-stats__list | 통계 항목 안의 텍스트·아이콘 구획, 고유 최소 높이 |
| 카드 목록·폼 | l-all-cards, l-card-grid, l-grid-card, l-card-form | 카드 본문 내부 정렬, 라벨·입력·오류의 내부 간격 |
| 빈 상태 | l-empty-state 및 변형 | 안내 문구 내부 정렬·타이포그래피 |
| 메뉴 | l-card-menu 및 목록 | 메뉴 버튼 고유 크기와 각 항목 내부 정렬 |
| 대화상자 | l-dialog, l-dialog__scroll | backdrop, 패널·닫기 버튼 내부 배치와 상태 전환 |
| 토스트 | l-toast | 메시지·닫기 버튼의 내부 정렬과 애니메이션 |

`main.js` 변경은 카드 생성 마크업의 레이아웃 클래스 추가뿐입니다. 상태 모델·저장 키·이벤트 위임·ARIA 연결과 기존 c- 조회 선택자는 보존합니다. 필터·진행 상태의 생성 마크업은 내부 표현만 담당하므로 별도 l- 클래스가 필요하지 않습니다. `structure.cjs`는 정적·생성 마크업의 레이아웃 클래스 연결, 앱 전용 클래스의 미사용 여부, 외부 margin/position의 재유입을 검사합니다.

`app.cjs`는 두 보기의 생성·편집·삭제·필터·학습·빈 상태·추가 로딩·오류 상태, 대표 hover/focus의 computed style과 숨김·ARIA를 검사합니다. `overlays.cjs`는 최신 임시 미리보기를 대상으로 메뉴의 분기점 전환, dialog 키보드·취소·배경 클릭, 토스트의 hover/focus 일시정지·자동 닫힘을 확인합니다. Tab이 브라우저 UI로 이동한 BODY 상태와 배경 페이지의 실제 포커스를 구분합니다.

`stress.cjs`는 320×375·667×375, root16/32에서 편집·삭제 dialog의 너비·스크롤·포커스 복원을 검사합니다. 320×800/root32에서 긴 질문·정답·카테고리와 긴 토스트를 확인하며 알림 높이를 동적 뷰포트 내로 제한합니다. 카테고리와 카드 메뉴의 외부 클릭 닫힘도 검사합니다.

## 검증 기록

- 변경 전: Chrome 156.0.8078.74, 기준 캡처 19장. 320px/root16은 문서 폭 320px, root32는 두 보기 모두 350px.
- 공통 패턴: Chrome 156.0.8078.74, root16/32, 152개 assertion 통과.
- 앱 회귀: Chrome 156.0.8078.74, 19개 검사 묶음 통과. 두 보기 × 320·375·767·768·1023·1024·1440px 및 가로 667×375 × root16/32의 32개 조합에서 문서 가로 넘침 없음. `layout-app-GCfNTs/results.json`에 computed style과 상태 기록을 저장했다.
- 확대: Chrome의 초기 기본 글꼴 32px 실행에서도 320px 화면의 문서 폭은 320px이다. CSS 루트 크기를 바꾸는 검사와 별도 실행했다.
- 오버레이: 메뉴 분기점 전환·필터 내부 스크롤, dialog 키보드·취소·확정·배경 클릭, 토스트 hover/focus 각각 5.1초 일시정지 후 5.2초 자동 닫힘을 확인했다. 최종 높이 제한 적용 후에도 10개 추가 검사에 오류가 없으며 `layout-baseline-Hcd5SL/extra-results.json`에 기록했다.
- 극단 조건: 320×375·667×375 × root16/32 대화상자 4개 조합, 320×800/root32의 긴 콘텐츠·알림·외부 클릭 검사 통과. `layout-stress-4lsUP2/stress.json`에 기록했다.
- 화면 비교: 변경 전후 기준 화면 19개의 주요 요소 좌표·크기가 일치했다. PNG 17개는 바이트 단위로 같고 Study Mode 2개는 파일 차이가 있어 완전한 픽셀 일치를 주장하지 않는다. 데스크톱 학습·모바일 전체 카드 캡처를 시각적으로 확인했다. Figma 원본과의 일대일 비교는 미검증이다.
- 정적 연결: 앱이 사용하는 레이아웃 클래스 39개와 앱 전용 선언 클래스 39개가 연결돼 있으며 누락·미사용 앱 전용 클래스가 없다. JS의 diff는 생성 마크업에 클래스를 추가하는 내용이다.
- Firefox: 설치된 `C:/Program Files/Mozilla Firefox/firefox.exe` 실행은 Playwright `-juggler-pipe` 연결에 실패했다. Firefox UI 검증은 미검증이며 브라우저를 다운로드하지 않았다.
- 제한: 실제 화면 확대 UI·텍스트 전용 확대, 스크린 리더, OS 고대비 수동 검증은 미검증이다. forced-colors·reduced-motion은 Chrome의 에뮬레이션으로 검사했다. 기존 선택된 보기 버튼의 hover가 기본 상태와 같은 점은 이번 외부 배치 리팩터링에서 변경하지 않았다.
- 산출물 보존: 이번 검사 코드는 dist를 쓰거나 삭제하지 않는다. 최초 해시와 비교하면 기존 Gulp 감시 프로세스가 소스 변경을 자동 반영해 `index.html`, `css/style.css`, `css/style.css.map`, `js/main.js`가 바뀌었다. 사용자 승인 후 PID 25240을 중지했으며 파일을 되돌리거나 삭제하지 않았다. 감시 중지 후 해시와 최종 해시의 일치 검증은 통과했다. 재검사 시 `LAYOUT_DIST_BASELINE`에 비교할 해시 JSON 경로를 지정해 `structure.cjs`를 실행할 수 있다.
- 명령 검증: JavaScript 문법 검사, 출력 파일 없는 Sass API 컴파일, OpenSpec 엄격 검증, `git diff --check` 통과. 실제 테스트가 없는 `npm test`와 dist 삭제를 포함하는 build/dev는 실행하지 않았다.
- 실제 브라우저 확대·텍스트 전용 확대는 root32 대체 검사와 별개입니다. 실행하지 않은 조건의 준수를 주장하지 않습니다.

## HTML 분리 검증 결과 (2026-11-01)

- `index.html`은 669줄에서 38줄로 변경했으며 완결된 영역 8개를 `src/partials/`로 옮겼습니다. include 깊이는 최대 두 단계입니다. 원본 index만 직접 복사·분석하던 세 검증 경로는 실제 include 엔진의 조합 결과를 사용합니다.
- 기준 HTML·DOM·화면은 `C:/Users/jongh/AppData/Local/Temp/layout-baseline-PWsco9/`, 조합 후 화면은 `C:/Users/jongh/AppData/Local/Temp/layout-baseline-QE3N6W/`에 보관했습니다. DOM 요소 트리·속성·정규화한 문구·자산 경로와 pre/textarea 등 보존 대상 공백의 비교가 통과했습니다. 미해석 include는 없습니다.
- Chrome 156.0.8078.74: 변경 전후 19개 화면의 주요 요소 좌표·크기가 일치했고 PNG 16개가 바이트 단위로 일치했습니다. `study-320.png`, `study-1440.png`, `all-320.png`는 파일 차이가 있으므로 완전한 픽셀 일치를 주장하지 않습니다. 편집 dialog 캡처를 시각적으로 확인했습니다.
- `app.cjs`: 19개 검사 묶음 통과, 자산·콘솔 오류와 중복 ID·깨진 ARIA 참조 없음. 두 보기 × 8개 화면 크기 × root16/32의 32개 조합에서 문서 가로 넘침 없음. 결과는 `layout-app-Hr8mDe/results.json`에 기록했습니다.
- `overlays.cjs`: 필터·메뉴·dialog·토스트·접근성 트리 등 추가 검사 10개에서 오류 없음. `layout-baseline-QE3N6W/extra-results.json`에 기록했습니다. `stress.cjs`의 대화상자 4개 조합과 root32 긴 콘텐츠 검사도 통과했습니다.
- `patterns.cjs`: 152개 assertion 통과. `includes.cjs`: 단일·중첩 상대 include, 누락 파일의 reject와 CLI 종료 코드 1 검증 통과. `structure.cjs`: 기존 39개 레이아웃 클래스 연결 유지.
- `node --check`로 모든 검증 스크립트와 앱 JS를 검사했고 출력 없는 Sass API 컴파일·공백 검사를 통과했습니다. SCSS와 앱 JS, dist의 SHA-256은 이번 분리 전 기준과 같습니다. Gulp 감시 PID 16240은 앞서 승인된 중지 방침에 따라 확인 후 중지했으며 build/dev/html/clean은 실행하지 않았습니다.
- Firefox 설치본은 Playwright의 `-juggler-pipe` 연결에 실패해 UI 검증은 미검증입니다. 실제 확대 UI·텍스트 전용 확대·스크린 리더 수동 검사와 Figma 원본 대조도 미검증입니다. root32·forced-colors·reduced-motion의 자동 검증과 구분합니다.
