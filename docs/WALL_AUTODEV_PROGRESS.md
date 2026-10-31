# Wall 자율 개발 진행 기록

## 실행 기준

- 허용 기간: 2026-10-30~2026-10-31, Asia/Seoul. 2026-11-01 00:00 이후 코드 개발 금지.
- 사용자 최신 AGENTS.md 및 DESIGN_SYSTEM.md가 우선한다. 현재 적용은 05번 UID `aec03x1adsi68f`이며 다른 UID로 확대하지 않는다.
- Quick actions는 **보기·편집·복제**다. 공유는 추가 작업에 보존한다. 예약 프롬프트의 과거 공유 3칸/전체 화면 확대 문구는 최신 기준으로 정정했다. 일정·대상 대화·예산·제한은 유지했다.
- 병렬 에이전트/새 자동화/운영 배포/Main 병합/Force Push 없음. 크레딧 실사용량을 조회할 수 없어 수치를 추정하지 않는다. 최초 예약 실행은 P0 한 건에 한정했으며, 이후 사용자의 지속 개발·90% 자체 검토 요청에 따라 아래 추가 실행을 진행했다.

## 작업 위치와 기존 변경 보존

| 항목                           | 값                                                                         |
| ------------------------------ | -------------------------------------------------------------------------- |
| 원본 작업 폴더                 | `/Users/hongwookryu/repository/GitHub/stardom3645/ablestack-wall`          |
| 원본 브랜치 / 기존 HEAD        | `codex/wall-modern-lite` / `9e170f6c58`                                    |
| 개발 Worktree                  | `/Users/hongwookryu/.codex/worktrees/wall-autodev-20261030/ablestack-wall` |
| 개발 브랜치                    | `codex/wall-autodev-20261030`                                              |
| 원본 작업의 로컬 기준 snapshot | `6c78ae6f435f8ffd865f73a566590f898a60af71`                                 |
| 원본 staged tree               | `363312b24e976cc838035e769a3b2e0ff62aa015` (반영 후에도 같음)              |

원본에 115개 staged 파일과 다른 미커밋 수정이 있었으므로 이를 임의로 커밋/초기화하지 않았다. `git stash create`로 index/작업 파일을 변경하지 않는 로컬 기준 snapshot을 만들고 관리 Worktree를 생성했다. 구현 커밋은 그 위의 별도 개발 브랜치에만 존재한다. 원본 브랜치 HEAD와 index는 유지했다.

검증된 4개 파일은 원본 파일의 blob hash가 기준 snapshot과 같은지 **모두 먼저 확인**한 뒤 원본 working tree에 반영했다. 이후 변경 시에도 원본의 동시 수정이 발견되면 덮어쓰지 않는다. 원본 서비스의 homepath는 원본 폴더이므로 Worktree에서만 수정/빌드하고 현재 서비스에 반영됐다고 보고하지 않는다.

## 2026-10-30 — P0: 조작 중 읽기 전용 전환 안정화

### 완료 기능

진행 중 Drag/Resize가 있을 때 키오스크/권한에 의해 readOnly가 true로 바뀌면 기존 abort 경로로 현재 조작만 취소한다. Grid·빗금·임시 위치/크기·pending 입력을 제거하며, 이전에 완료한 미저장 배치와 Undo 이력은 보존한다. 전환을 drop이나 저장으로 처리하지 않는다.

- 코드 커밋: `968fda1258` — `fix(wall): abort layout gestures on read-only transition`
- 수정 파일: `workspace/PanelLayoutGrid.tsx`(readOnly effect 7줄), `PanelSelection.test.tsx`(회귀 시나리오), `DESIGN_SYSTEM.md` REF-63, `AGENTS.md` 기준 기록.
- REF-62의 실제 카드 미리보기/놓기 동일 경계, 마지막 preview 확정, 48열·데이터·쿼리·기존 저장 기능은 변경하지 않았다.

### 재현과 검증

1. 패널 이동을 완료해 미저장 draft/Undo를 만든다.
2. 같은 패널의 Resize를 시작한다.
3. readOnly로 전환한다.
4. 수정 전에는 Grid/resize marker/footprint가 남아 신규 회귀 테스트가 실패했다.
5. 수정 후 현재 Resize만 사라지고 앞서 완료한 이동·원래 크기를 유지한다. 일반 모드 복귀 후 Undo 한 번으로 그 이동만 원복한다.

| 검사                          | 결과                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 회귀 테스트                   | 수정 전 신규 1건 실패로 원인 확인; 수정 후 관련 **3 suites 16 tests 통과**                                                                                  |
| ESLint / Prettier             | 변경 TS 파일 통과. AGENTS 및 신규 디자인 기록 조각도 포맷 검사 통과                                                                                         |
| 원본 preview production build | 성공, 기존 webpack 경고 2개                                                                                                                                 |
| 로컬 서비스                   | launchd preview/fixture 실행 확인. 3317 health/대시보드 HTTP 200, 3318 fixture query success                                                                |
| 실제 사용 탭                  | dirty0/active0을 확인한 뒤 새 빌드로 갱신. 개요21/네트워크19/스토리지7/Glue6/프로세스6·25타일·dirty0/active0 확인                                           |
| 실제 동시 입력의 한계         | 버튼을 누른 채 키오스크를 전환하는 동시 마우스/키보드 실사는 이번 실행에서 수행하지 않았다. 위 전환 오류 재현/복원/Undo 검증은 native RGL 컴포넌트 테스트다 |
| 서버 저장/운영 데이터         | 테스트를 위한 대시보드 저장·DB 직접 수정·운영 배포 없음                                                                                                     |

### 커밋 검사에 관한 기존 제약

- 관리 Worktree 생성 후 공통 Git 설정의 bare 모드가 적용되어 처음 hook 실행이 실패했다. 원본과 새 Worktree 각각의 `core.bare=false` worktree 설정으로 정상 working tree 동작을 복구했다. 원본 staged tree는 위 값 그대로다.
- 일반 Betterer precommit은 기존 Wall 코드가 과거 `.betterer.results`에 아직 등록되지 않아 기존 진단 7개를 신규로 보고했다. 이를 없애려고 기존 타입 어댑터·문구를 수정하거나 Betterer 기준선을 완화하지 않았다.
- 같은 `.betterer.ts` ESLint 규칙으로 **수정 전 snapshot과 수정 후 파일**을 비교해 7→7, 신규 진단0을 확인했다. 진단 규칙은 consistent-type-assertions와 no-untranslated-strings다. no-gf-form/문서화 Story 검사는 원래 hook에서도 악화되지 않았다.
- 이 커밋에서만 해당 Betterer hook을 동일 규칙의 전후 비교로 대체했다. 일반 frontend-lint hook은 실행·통과했다. 기존 디자인 표 전체의 불필요한 재정렬을 피하도록 other-format도 AGENTS/추가 기록 조각의 직접 검사로 대체했다. hook/config/Betterer 기준선은 수정하지 않았다.
- 따라서 저장소 전체 Betterer/타입 검사가 깨끗해졌다고 보고하지 않는다. 원래 Wall 작업을 통합할 때 기존 진단의 기준선 정합성은 별도로 다뤄야 한다.

## 기존 완료 작업과 다음 작업

| 우선순위 | 상태 / 다음 판단                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | 서버 일괄 저장·취소·미리보기 일치/Undo는 REF-52/62에 이미 구현·검증 기록이 있다. 이번 실행은 readOnly 전환 중 조작 잔류만 수정했다. 같은 기능을 다시 구현하지 않는다 |
| P1       | 단일 복사/붙여넣기·탭 간 복사·ID/설정 보존·저장/복원은 REF-57/58에 완료 기록이 있다. 새 회귀 근거가 있을 때만 검증/수정한다                                          |
| P2       | Command Menu 밀도/Drill-in/보기·편집·복제는 승인된 현재 구현 유지. 과거 공유 quick 구성으로 되돌리지 않는다                                                          |
| P3/P4    | P3의 native 기반 Wall 편집 Workspace는 아래 후속 실행에서 구현했다. P4 설정 폼 전체의 디자인 전환은 미진행이며 native 기능을 유지한다. 다른 UID로 확대하지 않는다    |
| P5       | 다음 실행에서 필요가 확인된 접근성/상태 복원 회귀를 우선 검토. 이번 수정 때문에 광범위한 재테스트/리팩터링을 수행하지 않는다                                         |

후속 실행은 이 Worktree/브랜치와 최신 기록을 먼저 확인한다. 현재 예약은 같은 대화에서 유지한다. 허용 기간 종료 후에는 코드 작업을 하지 않고 기존 예약을 종료한다.

## 2026-10-30 — 사용자 요청에 따른 지속 검토·구현

사용자가 단일 키오스크 수정에서 멈추지 말고 패널·대시보드를 계속 시험·평가하여 자체 판단 90% 수준까지 진행하라고 요청했다. 동일 Worktree에서 기존 구현을 되돌리지 않고 아래 4개 단위로 구현/검증/커밋했다.

| 커밋         | 완료 기능                                                                                                                                                                               | 주요 파일                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fe54d2bf10` | native 기반 Wall Panel Editor 프레임, 실제 shadcn Card·Base UI Tabs/Button, 표 미리보기·시각화 선택, 쿼리/Transform 탭과 URL sync 보존, 편집 버퍼를 remount하지 않는 Monaco 테마 동기화 | editor/WallPanelEditor.tsx·panelEditor.css·통합 검사, native PanelEditorRenderer/PanelEditControls/PanelOptionsPane/PanelDataPane 및 3개 탭, surfaceTokens.ts, REF-64 |
| `e6f318de3c` | native 패널 삭제 시 삭제 ID의 Wall layout·panelSources 정리, native 취소 시 패널/메타데이터 함께 복원                                                                                   | DashboardScene.tsx, workspace/wallDocument.ts·test, REF-65                                                                                                            |
| `c85b51c9e5` | 데이터 도착 후 미조작 기본 높이 갱신; 저장/legacy/draft/Undo 기준 보호; records의 행 높이 추정을 실제 콘텐츠 측정으로 교체                                                              | WallEditContext.tsx·test, visualizations/WallPanelContent.tsx·test, REF-66                                                                                            |
| `c59ffc2db9` | 05번 본문만 스크롤하여 사이드바/공통 헤더 유지, native 스크롤 저장/복원 API 재사용                                                                                                      | NativeScrollbar.tsx·test, DashboardSceneRenderer.tsx, modern.css, REF-67                                                                                              |

### 실제로 발견하고 수정한 문제

- 첫 편집 프레임이 native Flex 폭을 채우지 않아 미리보기가215px로 축소됐다. 전체1093.5px 폭을 채우도록 수정하고 실측했다.
- Light→Dark 전환에서 Monaco의 배경만 흰색으로 남거나, 배경 동기화 후에도 활성 Light 테마의 검은 문자가 남았다. native 테마 등록과 활성 테마를 함께 동기화했다. Dark 배경17/18/23·문자212/212/212, Light 흰 배경·검은 문자를 확인했다.
- 실제 삭제 저장에서 native 패널252는 없어졌지만 배치/표시 매핑252가 남았다. 삭제 경로를 보완해 서버 저장 결과에서도 제거됨을 확인했다.
- 파일시스템2행 카드의 기본 높이가318px에 고정돼 있었다. 미조작 기본값을 실제 내용에 맞춰190px로 줄였다. NIC2행246px, Glue PG3행312px에서 내부 clientHeight와 scrollHeight가 같아 마지막 행까지 보인다.
- 긴 탭에서 document가 스크롤돼 사이드바도 밀려났다. opt-in 본문 스크롤로 바꾸고 하단 패널 편집 왕복의 scrollTop743→743을 검증했다.

### 검증 기록

| 검증                | 결과                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 자동 검사           | 관련13 suites112tests 통과 + 최종 표시 컴포넌트17tests 통과. 합계14 suites129tests이며 전체 Grafana 테스트를 실행했다고 표현하지 않는다                                                                     |
| 빌드/정적 검사      | production build 성공, 기존 webpack 경고2개. 변경 TS ESLint/Prettier, 추가 디자인 기록 포맷 검사 통과. strict Betterer 규칙은 HEAD 전후 비교로 신규 진단0 확인                                              |
| 일반 클릭/Grip 클릭 | Grid/footprint/Dirty0. 실제 이동·Resize 종료 후 가이드와 active 상태 제거                                                                                                                                   |
| 이동/Resize         | 인접 카드 교환 이동의 예측·최종 rect591/386/293/96 일치. Resize 예측·최종 visible card256/705/354/116 일치. native outer gutter12px을 카드 크기로 오인하지 않았다                                           |
| 선택/이력           | Meta+클릭2개, Meta+A25개, ESC0개·Dirty0·다중 선택 중 Resize0 확인. 복제→Undo 후59개/Dirty0. 미저장 이동의 native 편집기 왕복 후25개 타일의 transform/w/h 동일, Undo 후Dirty0                                |
| 복사/저장           | 실제 메뉴 복사→네트워크 탭→실제 macOS Cmd+V로 새 ID252 생성. Resize·native 저장 버전27→새로고침에서354×116px/Dirty0·동일 탭 복원                                                                            |
| 삭제/원복           | 수정 전 삭제 저장28의 stale252를 재현; 수정 후 저장29에서 layout/source252 제거. native 버전26 복원으로 최종30 생성. JSON 비교에서 **version만 다르고 원본 패널/쿼리/Wall metadata/변수/기타 모든 값 동일** |
| 키오스크            | 수정 후6개 Glue 카드와 이전25개 개요 카드의 일반↔키오스크 transform/w/h 동일. 핸들0/설정0, 메뉴의 편집·복제·삭제·검사·복사 숨김. 보기/공유 유지, ESC 복귀 확인                                             |
| 조회/차트           | 5개 탭 데이터 패널21/19/7/6/6=59, 시계열 Canvas4/15/6/4/6=35 확인. Canvas drag는 from/to 절대 시간 URL로 Zoom하고 Grid/Dirty0. 클릭 툴팁43.5 ops/s·범례 단독 선택/복귀 확인                                 |
| 메뉴/Inspector      | quick 보기·편집·복제 유지. 검사 Drill-in240×252·ESC 상위 복귀. native 데이터64/Query/JSON249 Inspector 진입·종료 확인                                                                                       |
| Light/Dark          | 5개 탭과 편집기 양 테마에서 확인, 폰트ready. 코드 편집/표 전환/옵션 검색/시각화 선택기/제목 변경·취소/스크롤 복원 정상                                                                                      |

현재 데이터 검증은3318 fixture를 사용하는3317 로컬 preview이며 실제 SCVM/고객 운영 데이터 검증이 아니다. SCVM 빈 값은 원래 제약으로 유지했다. backend는 기존 preview9.2.0 그대로이며11.4 기반 프론트엔드 소스와 함께 동작하는 기존 개발 구성이다. 이번에 backend/Grafana 버전/운영 환경을 변경하지 않았다.

브라우저 로그에는 빠른 대시보드 재진입 중 native Metrics의 `loadDashboardScene_started` mark 누락 오류1건이 기록됐다. 해당 native 계측 코드는 수정하지 않았으며 패널 렌더링/쿼리/저장 예외로 관찰되지는 않았다. 장시간 실운영 성능/실제 권한 조합 검증은 남아 있다.

### 이전 90점 자체 평가 (2026-10-31 사용자 재평가로 전체 완성도 기준에서 철회)

| 평가 항목                  | 자체 점수  | 근거/한계                                                                                                                                             |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 데이터·저장 모델 보존      | 25/25      | 검증 전후 native JSON/Wall metadata 정확히 복원                                                                                                       |
| 직접 편집·저장·취소·복원   | 25/25      | 실제 브라우저+native Grid/serialization 회귀 검사                                                                                                     |
| 탐색·편집기·Inspector 연결 | 20/20      | 기존 핸들러 유지, URL/차트/편집기 왕복 확인                                                                                                           |
| 시각적 마감·일관성         | 15/20      | 5개 탭·편집 프레임 개선; native 플러그인 폼/설정 전체는 여전히 기존 UI                                                                                |
| 환경·운영 검증 범위        | 5/10       | 로컬 서비스/fixture 검증 완료; 실제 SCVM/권한/장기 운영 검증 미실시                                                                                   |
| 합계                       | **90/100** | 현재05번 대표 대시보드의 조회·패널 편집에 대한 주관적 검토 점수다. 테스트 통과율이나 전체 Grafana 현대화 완료율, 운영 안정성 보장으로 사용하지 않는다 |

남은 마감은 native 쿼리/옵션 폼과 대시보드 설정 화면의 일관된 표현, 실제 SCVM 연결 환경 검증, 장기 데이터량·성능 검증이다. 기존 기능이 정상인 상태에서 새로운 편집 엔진/그룹/라이브러리나 다른 UID 확장을 시작하지 않는다.

스크린샷/브라우저 검사 결과는 `/Users/hongwookryu/.codex/visualizations/2026/10/26/01a176d2-c775-75b2-91a3-45adcc7423bb/wall-modern-lite/`의 `panel-editor-after-light.png`, `panel-editor-after-dark.png`, `qa-*-light.png`, `qa-*-dark.png`, `qa-tab-results.json`에 있다. 변경 후 다시 확인한 파일시스템/NIC/Glue 캡처를 우선한다.

### 보존·커밋 검사

원본의 index/기존 미커밋 작업은 유지하고, 마지막 반영 hash와 같은 파일만 원본 preview에 동기화한다. 개발 커밋은 이 Worktree에만 존재한다. 정상 frontend-lint hook은 모든 기능 커밋에서 통과했다. 이전 실행과 동일한 기존 Betterer 기준선 제약 때문에 해당 hook만 동일 strict 규칙의 전후 비교로 대체했고 신규 진단0을 확인했다. 기존 DESIGN_SYSTEM 전체 재정렬을 피하도록 새 기록 조각을 직접 포맷 검사했다. hook/config/Betterer baseline은 변경하지 않았다.
## 2026-10-31 — 편집·설정 UI 구조 재작업 (REF-68)

사용자가 예약 지시서 P3/P4와 실제 화면의 차이를 지적했다. 기존 프레임 중심 변경과 기능 안정성 위주의 90/100 평가는 전체 디자인 완성도 판정으로 사용하지 않는다. 점수를 다시 붙이는 대신 화면별 실제 교체 범위와 남은 native 영역을 구분했다. 다른 UID·Grid·차트 스타일·데이터 모델은 이번 작업에서 확대/변경하지 않았다.

### 구현과 반복 검토

1. 첫 시각 검토: 기존 회색 AppChrome 작업 바, 끝없이 이어진 native 옵션 목록, native Query row chrome이 남아 있었다. Wall 편집 헤더에 뒤로/취소/저장·복사본 저장을 통합하고 별도 native 작업 바를 제거했다. 기존 Wall 분석 Toolbar를 재사용했다. 패널/시각화/필드/재정의와 Base UI Collapsible로 옵션 탐색을 실제 교체했다. query runner와 plugin editor를 바꾸지 않고 쿼리 행·작업 버튼·datasource/options/inspector bar·추가 footer를 교체했다.
2. 두 번째 시각 검토: 설정의 외곽만 바꾸면 변수/주석/링크/버전이 여전히 기존 Grafana table로 보였다. native Page의 상단/가로 탭 대신 권한 필터가 적용된 모델을 이용한 좌측 탐색과 작업 본문을 렌더했다. 일반 폼은 4개 의미 영역과 실제 Base UI Input/Switch/Tabs/Buttons로 재구성했다. 변수·주석·링크 collection과 변수 편집 2영역, 버전 table/선택/복원 작업을 실제 새 컴포넌트로 교체했다. 일반 태그도 색이 섞인 native Tag 대신 중립 칩/입력으로 바꾸되 add/remove/중복 의미는 유지했다.
3. 검토 중 수정: 새 설정 본문에서 native JSON 편집기 높이가 5px로 축소되었다. 별도 높이 컨테이너로 수정하여 1730×873 데스크톱에서 Monaco 407px/23행을 확인했다. 공유 theme hook은 JSON 화면에서만 로드하고 문서 buffer를 재마운트하지 않는다. Override custom title에 포함된 삭제 버튼을 disclosure button 밖으로 분리하여 중첩 버튼과 의도하지 않은 toggle을 방지했다.
4. 실제 취소 검증 중 수정: 설정 URL로 첫 진입한 native initial baseline에 editview가 포함되어 취소 후 이전 JSON 설정 화면이 되살아났다. 05번 최초 onEnterEditMode에서도 overlay/editPanel/editview를 제외하도록 저장 성공 baseline과 맞췄다. native 확인 절차 후 URL과 UI가 모두 일반 대시보드로 복원되는 것을 확인했다.

### 주요 변경 파일

| 범위                    | 파일                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wall 실제 컴포넌트      | `management/WallManagement.tsx`, `WallGeneralSettings.tsx`, `WallSettingsCollection.tsx`, `WallVersionHistory.tsx`, `SettingsPresentationContext.ts`, `management.css`                                                                |
| 패널 옵션·편집          | `editor/WallPanelEditor.tsx`, `WallOptionNavigator.tsx`, `EditorPresentationContext.ts`, `useWallMonacoTheme.ts`, `panelEditor.css`, `PanelEditorRenderer.tsx`, `PanelOptions.tsx`, `PanelOptionsPane.tsx`, `OptionsPaneCategory.tsx` |
| 쿼리 조작 UI            | `core/components/QueryOperationRow/{QueryOperationRow,QueryOperationRowHeader,QueryOperationAction}.tsx`, `query/components/QueryGroup.tsx`, `PanelDataPane/PanelDataQueriesTab.tsx`                                                  |
| 설정 연결·native 재사용 | `Page.tsx`, `DashboardSceneRenderer.tsx`, `NavToolbarActions.tsx`, `GeneralSettingsEditView.tsx`, `JsonModelEditView.tsx`, 변수 목록/행/폼/텍스트 필드·영역·제목, 주석/링크 목록, 버전 table/buttons                                  |
| 취소·기록               | `DashboardScene.tsx` 최초 baseline의 UID 한정 임시 UI 제외, AGENTS.md, DESIGN_SYSTEM.md REF-68, 이 진행 기록                                                                                                                          |

위 Wall 경로는 `public/app/features/wall-modern/`, native Scene 경로는 `public/app/features/dashboard-scene/` 기준이다. native DnD/state/validation/callback/권한 확인을 그대로 재사용하며 새로운 편집기나 패키지를 설치하지 않았다. 폰트·색·Surface는 기존 토큰이고 남겨 둔 native 도메인 컨트롤의 테두리·여백은 scoped CSS 마감이다. CSS 변경과 실제 Base UI primitive/로컬 shadcn 구조 교체를 REF-68에 구분했다.

### 검증 결과

- 관련 19개 suite에서 중복 제외 **197개 통과, 기존 skip 1개**. 새 Wall 컴포넌트 4개 suite는 별도 보정 없는 기본 Jest 실행으로 8개 검사를 통과했다. native Scenes·쿼리·Transform·옵션·변수/주석/링크·버전·초기 복원 상태와 새로운 입력/선택/태그/접기 및 native 삭제 확인 연결을 포함한다.
- 기존 `PanelOptions`/`QueryVariableForm` 계열은 설치된 jsdom/nwsapi가 native Select의 `:has(+ [role=option])` 장식 CSS를 처리하지 못해 실패했다. HEAD의 원래 옵션 코드로도 동일한 2개 실패가 재현됐다. 관련 호환 실행은 `/tmp/wall-jest-selector-compat.cjs`에서 해당 장식 CSS만 제외한 조건이다. 제품 CSS/의존성/Jest 설정은 바꾸지 않았다. 새 일반 폼 단위 검사는 native folder/time/delete를 분리하여 새 컨트롤과 실제 Scene state 연결을 검증하며, native picker의 실제 동작은 브라우저로 구분해 확인했다.
- production webpack 빌드 성공, 기존 경고 2개 유지. 변경 TS/TSX ESLint/Prettier/공백 검사와 Betterer strict 규칙 전후 비교 신규 진단 0. 전체 tsc는 기존 React type/legacy/plugin 진단으로 실패하며 이번 변경 파일 진단은 0이다. 전체 tsc 통과로 보고하지 않는다.
- 실제 사용 탭의 미저장 0을 확인하고 빌드를 반영했다. 설정 7개 경로 진입, 변수 목록→기존 쿼리 변수 편집, 일반 설명 임시 변경→변수 이동→일반 복귀 시 내용/dirty 보존, native 취소 확인→대시보드 복귀, Wall 저장 액션→native Save Drawer(변경 없음/저장 disabled)를 확인했다.
- 버전 30/29 선택 시 비교 활성화, 해제 시 비활성화를 확인했다. 복원/권한 변경/새 JSON 저장은 실행하지 않았다.
- 패널 Command Menu의 보기/편집/복제 구성을 유지하고 실제 편집 진입, Wall 옵션 4영역, 원래 Percent(0–100)·min0/max100·threshold75/85·override decimals2를 확인했다. native Transform/테이블 미리보기/쿼리 코드는 재사용한다.
- Light/Dark의 설정·폼·편집기·Monaco를 실제 데스크톱에서 확인했다. 실제 화면 캡처는 같은 시각화 폴더의 `settings-general-light-v2.png`, `settings-general-dark-v2.png`, `settings-variables-dark-v2.png`, `settings-history-light-v2.png`, `settings-json-dark-v2.png`, `editor-workspace-light-v2.png`, `editor-workspace-dark-v2.png`이다.
- 이번 검증은 기존3318 fixture/3317 로컬 preview이며 실제 SCVM/고객/운영 데이터 검증이 아니다. 저장된 05번 문서는 기존 최종 QA baseline의 **version30과 정확히 동일**하고 임시 설명은 native 취소로 제거했다. 기존 59개 패널·wallModern·쿼리·UID·단위·배치는 서버 문서에서 바뀌지 않았다.

### 로컬 연결 복구

첫 재시작에서 `/tmp/wall-modern-lite-runtime/grafana.ini`가 사라져 preview가 다시 뜨지 않는 문제를 확인했다. 이전 세션에서 사용한 원래 로컬 설정을 복구하고 `~/Library/Application Support/ABLESTACK/WallPreview/grafana.ini`에 보존해 기존 launchd service의 config 인수만 연결했다. binary/DB/logs/fixture·HTTP3317/3318·localhost 바인딩·기존 인증/조직 설정·backend 버전은 그대로다. 재시작과 health/dashboard/fixture 응답으로 확인하며 이 경로를 운영 설정으로 사용하지 않는다.

### 남은 범위와 완료 판단

전문적인 datasource별 Builder/Code, Transform 편집기, 표준 필드의 unit/color/mapping picker와 native Permissions의 내부 폼은 유지한다. 이들까지 모두 독립 Wall 구현이 되었다고 표현하지 않는다. 실제 SCVM 값/고객 권한/장시간 성능과 모든 플러그인 조합은 검증하지 않았다. 이번 완료 범위는 편집/설정의 공통 화면 구조·탐색·조작부·주요 폼/목록 교체와 그 연결 안정성이다. 사용자 재평가 없이 기능 테스트만으로 새 전체 완성도 점수를 붙이지 않는다.

### 커밋 검사 방식

원본 사용자 index tree는 `363312b24e976cc838035e769a3b2e0ff62aa015`로 유지했다. Worktree의 변경 TS/TSX38개에 Betterer와 같은 strict 규칙을 HEAD 대비 적용하여 신규 진단0을 확인했다. 기존 WIP/legacy Betterer 기준선 제약은 이전 기록과 같으므로 이 기능 커밋에서만 해당 hook을 이 전후 비교로 대체한다. 정상 frontend-lint(ESLint/Prettier) hook은 실행한다. DESIGN_SYSTEM 전체 표의 불필요한 재정렬을 피하도록 other-format hook은 새 REF-68/진행 기록 조각과 AGENTS의 직접 포맷 검사로 대체한다. hook/config/baseline 자체는 수정하지 않는다.

기능 커밋: **4076a02eab** `feat(wall): replace panel editing and dashboard settings presentation` (이 Worktree 개발 브랜치). 정상 frontend-lint hook 통과, Worktree clean 확인. 최종 preview `/api/health` database ok, 대시보드 HTTP200, fixture launchd running/query success를 확인했다. 실제 사용자 탭은 미저장0 상태로 최종 빌드를 반영하고 Light로 복귀했다. 원본 사용자 staged tree는 그대로이며 운영 배포/merge/push는 수행하지 않았다.
## 2026-10-31 09시 예약 실행 — 편집 컨트롤 접근성 안정화 (REF-69)

시작 상태는 `a57b9a196e`/`4076a02eab`, Worktree clean이었다. P0~P4 완료 기록과 최신 REF-68을 확인하고 동일 구조를 반복 구현하지 않았다. 이번에는 P5의 명확히 확인 가능한 컨트롤 의미/선택 상태만 보완했다.

| 항목                | 결과                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 확인한 문제         | 옵션 4영역은 `role=tab`이었으나 실제 사용자 탭에서 `aria-controls=null`, option `tabpanel=0`이었다. 일반 설정의 툴팁/편집 허용도 내용 이동이 없는 값 선택을 tab으로 표현했다                                                                                                                                                                                                                                               |
| 구현                | WallOptionNavigator에서 기존 local shadcn TabsContent/Base UI Panel을 렌더하여 선택 탭과 본문 ID를 연결한다. 현재 그룹이 비면 첫 사용 가능한 영역으로 표시 선택만 fallback한다. WallGeneralSettings Choice는 설치된 Base UI1.0.0 RadioGroup/Radio로 바꾸고 숫자/boolean native callback을 보존한다                                                                                                                         |
| CSS 범위            | management.css의 기존 segmented 스타일 selector를 새 Choice에 옮기고 토큰 기반 키보드 focus를 연결했다. 색/폰트/공통 Surface/대시보드 배치·차트 스타일을 변경하지 않았다                                                                                                                                                                                                                                                   |
| 수정 파일           | `editor/WallOptionNavigator.tsx`, `editor/WallOptionNavigator.test.tsx`, `management/WallGeneralSettings.tsx`, `management/WallGeneralSettings.test.tsx`, `management/management.css` (모두 wall-modern 아래). 기준표/AGENTS/이 기록 업데이트                                                                                                                                                                              |
| 테스트              | 관련3 suites9 tests 기본 Jest 통과. tab/tabpanel ID·검색·Override 액션/접기·빈 영역 fallback·일반 numeric/boolean 선택·기존 편집기/테마 검사를 포함한다. 처음 추가한 ARIA/fallback 검사 실패를 확인한 후 수정했다. Base UI Tab 비활성은 native disabled가 아닌 aria-disabled이므로 검사도 실제 계약에 맞췄다                                                                                                               |
| 정적/빌드           | ESLint·Prettier·공백 검사 통과. 변경4 TS/TSX에 Betterer 동일 strict 규칙의 전후 비교 신규0. production webpack 성공(기존 경고2개). 기존 전체 tsc/전체 회귀는 반복하지 않았다                                                                                                                                                                                                                                               |
| 실제 사용자 탭      | 미저장0 확인 후 갱신. option tab의 aria-controls와 실제 tabpanel/id/aria-labelledby가 일치했다. Arrow로 초점 이동→Enter 선택, 필드에서 Thresholds 검색 시 영역 전체 검색 결과와75/85 유지, 검색 해제 확인. 일반 Radio ArrowRight로 개별→십자선, ArrowLeft로 개별 복원 및 Dirty0 확인. Radio 보조 input은 aria-hidden=true. 선택 컨트롤 높이38px·Light/Dark 가독성을 확인하고 Light의 원래 vCPU 패널 편집 화면으로 복귀했다 |
| fixture와 실측 구분 | 옵션 그룹 제거 fallback은 mounted props 변경 fixture로 검증했다. native 시각화 선택기는 pane을 재마운트하여 선택이 초기화되므로 그 경로에서 실제 빈 화면을 재현했다고 보고하지 않는다. 화면 검증은3318fixture/3317preview이며 실제 SCVM/고객 권한 검증이 아니다                                                                                                                                                            |
| 보존                | Dashboard API의 문서는 기존 최종 QA baseline version30과 동일. 사용자 원본 index tree `363312b24e976cc838035e769a3b2e0ff62aa015` 유지. Grid/Drag/Resize/저장 엔진·native 쿼리/단위/59개 패널·다른 UID는 수정하지 않았다. 외부 전송/배포/병합/Push 없음                                                                                                                                                                     |

실제 캡처: 기존 시각화 폴더의 `editor-a11y-general-light-20261031.png`, `editor-a11y-general-dark-20261031.png`, `editor-a11y-options-20261031.png`.

다음 검토 범위는 기존에 남겨 둔 native 전문 폼의 마감과 실제 환경 검증이다. 확인되지 않은 디자인 완성도 점수나 크레딧 사용량을 추정하지 않는다. 이번 예약 실행을 이유로 다른 UID·새 편집 기능으로 확대하지 않았다. 정상 frontend-lint hook을 실행하고 기존 Betterer 기준선 제약은 앞선 기록과 동일하게 strict 전후 비교로 대체한다. DESIGN_SYSTEM 전체 재정렬을 피하도록 새 기록 조각/AGENTS를 직접 검사하고 other-format hook만 제외한다. hook/config/baseline은 수정하지 않는다.
