# Proposal

## Why

현재 구현이 `doc/`(삭제됨)의 개발 가이드를 따르는지 전체 소스 기준으로 점검한 결과가 필요하다. 가이드에 이전 프로젝트 예시와 삭제된 파일 참조가 섞여 있어 코드 미준수와 문서의 부정확성을 구분해야 한다.

## What Changes

- `doc/`(삭제됨)의 모든 문서를 분류하고 적용 가능한 규칙을 추출해 근거와 판정이 연결되는 점검표를 작성한다.
- HTML·SCSS·JavaScript·자산 연결, Storybook, 빌드·검증 설정 및 관련 README 설명을 검토한다.
- 시맨틱 구조, 클래스·토큰·중첩·선언 순서·단위·주석, 반응형 배치와 인터랙션·접근성을 검토한다.
- 최신 소스로 임시 미리보기를 구성하고 실행 가능한 Chrome·Firefox에서 상태·화면별 검증을 수행한다. 미실행 항목은 미검증으로 남긴다.
- 결과는 `doc/guide-compliance-review.md`(삭제됨)에 중요도·위치·규칙 근거·영향·개선 방향과 함께 기록한다.
- 이번 변경의 산출물은 점검 보고서다. 소스·설정·기존 가이드를 고치거나 새로운 동작 요구사항을 만들지 않는다. 수정 작업은 후속 요청으로 분리한다.

## Capabilities

### New Capabilities

없음. 문서 기반 감사이며 `skip_specs: true`를 사용한다.

### Modified Capabilities

없음. 기존 앱의 기능 명세와 동작을 변경하지 않는다.

## Impact

- 읽기 범위: `doc/`(삭제됨) 13개 문서, `src/`, `.storybook/`, `package.json`, `gulpfile.js`, README 및 발견되는 관련 검증 설정.
- 쓰기 범위: 이 OpenSpec 변경의 계획·진행 기록과 향후 점검 보고서. 생성 미리보기와 증거 파일은 저장소 밖 임시 폴더에 둔다.
- `dist` 삭제·직접 수정, build/dev, 소스 수정형 format은 실행하지 않는다. `npm test`는 실패용 placeholder임을 기록한다.
- 기존 `.gitignore` 변경과 미추적 `doc/scss-comment-guide.md`(삭제됨)는 보존하며, 후자는 사용자 제공 점검 기준에 포함한다.
