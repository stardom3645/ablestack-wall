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

예약 실행 기능 커밋: **1bc7641ff4** `fix(wall): align editor navigation and setting choice accessibility`. 정상 frontend-lint hook 통과 및 Worktree clean 확인. 최종3317 health/database ok·대시보드 HTTP200·3318 fixture query success, API 문서 version30 불변·원본 index 불변을 확인했다. 사용자 탭은 Light/패널 편집/Dirty0으로 유지한다. 이번 결과는 즉시 사용자 조치가 필요한 변경이 아니므로 정기 알림은 생략한다.

## 2026-11-01 수동 요청 — Canvas + 단일 Inspector 패널 스튜디오 (REF-70)

예약 개발 기간 이후 사용자가 직접 “링크 다이나처럼 편집 화면을 그라파나말고 아예 새로운 느낌”으로 변경하라고 요청했다. 기존 REF-68/69 기능을 읽고, 예약 실행의 무제한 연장으로 해석하지 않고 이 UI 요청만 진행했다. 시작은 `fec9ce5c40`, 첨부 개발 Worktree clean이었다. 코드 변경 전 실제 Dynatrace 링크의 Gauge 선택 및 Details(데이터/표현/타일) Inspector를 관찰했다.

### 실제 변경

- UID `aec03x1adsi68f`에서 미리보기 위/쿼리 아래/옵션 오른쪽의 영구 3분할을 **큰 Canvas + 단일 Inspector**로 교체했다. 단순 프레임 CSS 추가가 아니다. 새 `WallPanelStudio`가 표현·데이터·패널 정보의 실제 탐색/본문을 렌더하고 데이터 작업에서는 Inspector 폭을 416→760px까지 넓힌다. Canvas는 계속 표시한다. native splitter는 이 경로에서 렌더하지 않는다.
- native data/options pane은 keepMounted로 유지하고 Inspector 전환 시 검색/모델/쿼리 입력 버퍼를 불필요하게 remount하지 않는다. native Query/Transform 탭과 URL 모델은 그대로다. 일반 속성은 패널 정보로, 시각화/표준 필드/Override는 표현으로 분리했다. 검색도 해당 속성 범위의 기존 descriptor를 사용한다.
- `WallVisualizationGallery`는 실제 플러그인 목록/필터/feature toggle과 native `onChangePanelPlugin` 및 캐시·modifier 계약을 재사용한다. 로컬 shadcn Tabs/Base UI Input/Button으로 전체 유형/데이터 기반 추천/검색/선택 갤러리를 새로 렌더한다. 플러그인 엔진/추천 로직은 재개발하지 않았다.
- `WallPanelDetails`의 제목·설명·투명 배경 폼은 실제 Base UI Input/Switch 및 연결된 label/textarea를 사용한다. 값은 원래 VizPanel.setState의 title+hoverHeader, description, displayMode에 직접 전달한다. native title/description AI addon·library·links/repeat 설정은 보존했다.
- 미리보기는 기존 `OverviewPanelPresentation`과 폰트 로딩 Context를 재사용해 Wall의 제목·수치·차트 표현을 적용한다. 옵션/저장 값이나 native 시각화 엔진은 변경하지 않는다. Studio 바깥의 Dashboard 차트는 그대로다.
- editor 전용 geometry는 surfaceTokens.ts, 색/간격/폰트는 기존 토큰을 사용한다. CSS는 Canvas/Inspector의 geometry·스크롤·갤러리/폼 Surface와 native segmented 입력의 중립적 마감이다. 미리보기 native border를 겹쳐 그리지 않는다.

변경 파일은 `dashboard-scene/panel-edit/{PanelEditorRenderer,PanelOptions,PanelOptionsPane,PanelVizTypePicker}.tsx`, `wall-modern/editor/{WallPanelStudio,WallPanelDetails,WallVisualizationGallery,WallPanelEditor,WallOptionNavigator,EditorPresentationContext}` 및 관련 검사/CSS, `surfaceTokens.ts`, AGENTS/DESIGN_SYSTEM REF-70이다. 쿼리/배치/대시보드 설정 화면·다른 UID는 수정하지 않았다.

### 검증

| 항목           | 실제 결과                                                                                                                                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 새 UI 검사     | 기본 Jest 4 suites 12 tests 통과. Inspector tab/tabpanel 연결·native 쿼리/속성 입력 DOM 및 버퍼 유지·Transform 진입 intent·옵션 분류/검색/접기/Override·제목/설명/boolean 전달·native addon 보존·Monaco 테마 전환 포함                                                                        |
| native 회귀    | PanelOptions/PanelOptionsPane/PanelEditor 3 suites 19 tests 통과. 기존 jsdom/nwsapi의 `:has(+ [role=option])` CSS 문제는 이전 REF-68과 같은 임시 Jest 호환 setup에서 장식 selector만 제외했다. 제품/의존성/Jest 설정은 수정하지 않았다                                                        |
| 빌드/정적 검사 | production webpack 성공, 기존 경고2개. 변경 TS/TSX ESLint/Prettier·공백 검사 통과. Betterer 동일 strict 전후 비교 신규 진단0. 전체 tsc/전체 회귀를 반복하거나 통과했다고 주장하지 않는다                                                                                                      |
| 실제 브라우저  | 기존 사용자 탭 미저장0 확인 후 갱신. 1730×873px에서 Studio와 Inspector의 top153/bottom861/height708, native splitter0 확인. 초기 검사에서 긴 옵션 때문에 Canvas가 아래로 밀리는 min-content 문제를 발견해 editor 자체 높이와 Inspector 스크롤을 분리했다                                      |
| 편집 동작      | 패널32 제목 임시 변경→표현/패널 정보 이동→제목 유지→native 변경 취소→원래 제목/조회 화면/Dirty0 복원. 처음 복귀 직후 Dirty는 native debounce 후 해제됐다. 사용자 변경을 강제 새로고침으로 없애지 않았다                                                                                       |
| 시각화/데이터  | 기존 Command Menu에서 패널140 편집 진입, Time series→Stat→Time series와 캐시 복원, table 미리보기/원복, Query/Transform·Monaco 표시·원래 쿼리 확인. 갤러리 검색 time은 Time series/State timeline을 표시한다. 단위·field·threshold·native 전문 편집기와 모델 재사용                           |
| 저장/문서 보존 | 기존 저장 Drawer 진입/변경 없음·저장 disabled 확인 후 닫았다. 새 DB 저장은 수행하지 않았다. Dashboard API 문서는 최종 QA baseline의 version30과 정확히 동일하다. 59개 패널·wallModern·query/field/options/UID/좌표를 저장소에서 바꾸지 않았다                                                 |
| Light/Dark     | 실제 테마 전환 후 DOM/computed style과 시각화를 확인했다. theme 반영 직후 이전 Emotion 스타일이 보이는 중간 paint를 최종 결과로 사용하지 않았다. Base UI Switch의 보조 checkbox는 aria-hidden=true/화면 밖1px이고, Switch는 명명된 컨트롤이다. 마지막 사용자 탭은 Light/표현 Inspector/Dirty0 |
| 로컬 연결      | 기존 launchd preview/fixture 모두 running,3317 health database ok·dashboard HTTP200·3318 query success. 기존 서비스만 사용하며 운영 배포/포트/인증/백엔드 버전을 변경하지 않았다                                                                                                              |

실제 화면 캡처는 기존 시각화 폴더의 `panel-studio-visual-light-20261101.png`, `panel-studio-visual-dark-20261101.png`, `panel-studio-data-dark-20261101.png`, `panel-studio-details-light-20261101.png`, `panel-studio-gallery-light-20261101.png`다. 이는3318 fixture/3317 로컬 미리보기이며 실제 SCVM/고객 권한·장시간 성능 검증은 아니다.

### 유지할 차이와 제약

Dynatrace는 전체 대시보드 옆 Details이고 이번 Wall은 단일 패널 미리보기 Canvas/Inspector다. 동일한 기능·외형으로 복제했다고 표현하지 않는다. datasource별 Builder/Code, Transform, plugin field/override picker의 내부 전문 컨트롤은 native를 유지하며, 이 내부까지 모두 새 Wall 구현이라고 보고하지 않는다. 새로운 라이브러리·편집 엔진·전역 편집 모드를 추가하지 않았고 Grid/48열/REF-62 저장·놓기 경로는 손대지 않았다. 기능 검사 개수를 디자인 완성도 점수로 환산하지 않는다.

기능 커밋: **5b8b62a873** `feat(wall): replace panel editor splits with canvas and inspector`. 정상 frontend-lint hook 통과. 기존 Betterer 기준선 제약은 앞선 실행과 같이 strict 전후 비교 신규0으로 대체했고, 다른 format hook은 새 REF 조각/AGENTS를 직접 검사해 전체 표의 불필요한 reflow를 피했다. hook/config/baseline 자체는 변경하지 않았다. 원본 사용자 index tree `363312b24e976cc838035e769a3b2e0ff62aa015`를 보존하고, 이 개발 Worktree에서만 커밋했다. merge/push/새 자동화/운영 배포는 없다.

## 2026-11-01 수동 후속 요청 — 모든 사용 패널의 공통 편집기 (REF-71)

사용자가 “한 패널뿐 아니라 사용되는 패널 모두” 적용하라고 요청했다.05번의 기존59개 데이터 패널은 이미 UID 단위 공통 경로여서 개별 ID 조건이 없었다. 이번 요청을 다른 대시보드의 사용 패널까지 포함하는 공통 편집기로 해석하고 작업 중 범위를 고지했다. 조회/배치/대시보드 설정까지 확대하지 않았다. 시작은 `b8c0b92e84`, 개발 Worktree clean이었다.

### 적용 및 조사

- 로컬 API 전수 조사: **19개 대시보드,498개 데이터 패널,10유형**. Stat122·Gauge38·Time series288·Bar gauge4·Table31·Logs1·Bar chart1·Alert list5·Text7·Clock1이다. 제품 코드에 이 목록/개수를 하드코딩하지 않았다.
- PanelEditorRenderer의05 UID 제한을 일반 대시보드 공통 Studio로 변경했다. snapshot/not-found는 기존 native fallback이다. native plugin 옵션/Query/Transform/field/override/저장·권한 모델은 그대로다.
- 다른 대시보드의 동일한 ID가05의 사용률/서비스 역할을 이어받지 않도록 OverviewPanelPresentation의 generic preview 경로를 분리했다.05는 기존 panelSources 매핑을 재사용해 복제 패널도 원본 표시 역할을 유지한다.
- 편집 UI key는 UID+native panel ID로 구분한다. 동일 패널 내부의 Inspector 전환은 계속 native pane/buffer를 유지한다. query-free plugin이 데이터 pane을 제거하면 비활성 데이터 탭을 선택한 빈 화면이 남지 않도록 속성 화면으로 fallback한다.
- 제목 없는 Text도 화면 헤더에 “제목 없는 패널”을 표시한다. 실제 빈 title과 hoverHeader 및 저장 값은 변경하지 않는다.
- 수정: `PanelEditorRenderer.tsx`, `editor/WallPanelStudio.tsx·test`, `editor/WallPanelEditor.tsx`, `workspace/overviewPresentation.tsx·test`, AGENTS/REF-71. 새 라이브러리·CSS 체계·편집 엔진을 추가하지 않았다.

### 검증

| 항목             | 결과                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 실제 유형        | 05 외부 UID의 Stat/Gauge/Time series/Bar gauge/Table/Logs/Bar chart/Alert list/Text 대표 패널에서 Studio와 native 플러그인 옵션을 확인했다. 표현↔패널 정보 전환과 실제 제목 폼을 확인했다.498개를 개별 조작했다고 표현하지 않는다                                                                                                             |
| query-free       | Text/Alert list에서 데이터 탭 aria-disabled=true, 각 플러그인의 기존 옵션/Monaco 유지 확인. Text의 원래 빈 제목은 그대로이고 화면 헤더만 fallback한다                                                                                                                                                                                          |
| 데이터/취소      | 03번 NIC Table에서 Query1/Transform2 확인, 제목 임시 변경→Inspector 이동→값 유지→native 패널 취소→원래 제목/대시보드 복귀 확인. native 편집 종료/변경 폐기도 검증하고 시험 상태를 정리했다                                                                                                                                                     |
| Clock 제약       | Clock의 공통 편집기 틀은 표시되나 플러그인이 없다. `/api/plugins`에 grafana-clock-panel 미등록, settings404, native Panel plugin not found를 실제 확인했다. 플러그인을 설치하거나 시계 기능을 새로 만들지 않았으며 실제 시계 렌더링 검증에서 제외한다                                                                                          |
| 초기 Dirty       | 일부 기존 문서는 입력을 바꾸지 않아도 native Dirty가 생겼다. native 저장 Drawer의 실제 diff에서 pluginVersion11.4.0-pre→9.2.0 및 threshold base value:null 제거를 확인했다. 현재 로컬9.2 backend/11.4 frontend와 native 정규화에 관련된 기존 경로이며 이를 UI에서 숨기거나 문서를 저장해 없애지 않았다. 본 작업으로 해결했다고 보고하지 않는다 |
| 자동 검사        | Studio/Frame/Presentation 3 suites10 tests 통과. native data/options 버퍼 유지·Query/Transform 선택/URL·테마·query-free fallback·generic header·게이지 값/임계치/링크 포함. 기존 presentation 검사의8px padding 기대값이 REF-43의 실제16px와 맞지 않아382×218→366×202로 기대값만 정정했다. 제품 geometry를 변경한 것은 아니다                  |
| 정적/빌드        | ESLint/Prettier/공백 검사 통과. Betterer 동일 strict 전후 비교 신규0(기존 진단 유지). production webpack 성공, 기존 경고2개. 전체 tsc/전체 회귀는 반복하지 않았다                                                                                                                                                                              |
| Light/Dark       | 다른 UID의 Table 편집기에서 Light/Dark Surface·native 옵션·제목/숫자 확인. QA는 별도 임시 탭에서 진행하고 닫았다. 실제 사용자05 탭은 미저장0을 확인 후 최신 빌드로 갱신, Light/표현 Inspector로 유지했다                                                                                                                                       |
| 저장 문서        | 19개 저장 문서의 JSON SHA256/버전을 검증 전후 비교해 모두 동일했다. 실제 저장 버튼은 실행하지 않았다. 기존 쿼리/threshold/단위/패널 ID/레이아웃을 DB에서 변경하지 않았다                                                                                                                                                                       |
| 로컬/사용자 소스 | 3317 health database ok·3318 fixture query success. 사용자 원본 index tree는363312b24e976cc838035e769a3b2e0ff62aa015 그대로다. 기존 preview launchd를 재사용하며 운영 배포·포트·인증/백엔드 버전·새 자동화·merge/push는 없다                                                                                                                   |

실제 캡처: 기존 시각화 폴더의 `panel-studio-all-table-light-20261101.png`, `panel-studio-all-table-dark-20261101.png`, `panel-studio-all-text-light-20261101.png`. 유형별 DOM 검사 기록은 `panel-studio-all-types-qa-20261101.json`이다. 모두 로컬 fixture 검증이며 고객 데이터/권한/모든 플러그인 조합을 검증한 결과로 확대하지 않는다.

기능 커밋: **293573eb03** `feat(wall): share panel studio across all dashboard panel types`. 정상 frontend-lint hook 통과. 기존 Betterer 기준선은 strict 전후 신규0 검사로 대체하고, 새 REF/AGENTS 조각을 직접 포맷 검사하여 전체 표의 불필요한 reflow를 피했다. hook/config/baseline 자체는 수정하지 않았다.

## 2026-11-03 수동 요청 — 표현 설정 카드·구간 임계치·한글화 (REF-72)

사용자가 첨부한 현재 옵션 7장과 Dynatrace 설정 이미지의 비교를 근거로 공통 Studio 내부 표현 설정을 수정했다. 새 HTTPS 배포/443·19100 전환, backend/DB/Grafana 버전 변경은 포함하지 않았다. 기존 관리 Worktree `wall-autodev-20261030/ablestack-wall`에서 작업했고 사용자 원본 index/소스의 기존 변경은 유지했다. 새 커밋·push·merge·운영 배포·데이터 저장은 수행하지 않았다.

### 구현

- `OptionsPaneCategory`를 기본 접힘 카드로 표시하고 현재 선택값/단위/경계 개수를 요약한다. native 펼침 키와 분리한 `wall.studio.groups.v2`를 사용한다. 기존 showCategory/forceOpen/custom override 제목 액션을 유지하고 접기 때 Base UI Collapsible Panel의 keepMounted로 입력 DOM을 보존한다.
- `WallOptionField/WallOptionEditor`로 label/control/help 위계를 나누고, 표준 boolean/radio는 실제 Base UI Switch/RadioGroup/Radio로 표시한다. 선택 인덱스를 원래 boolean/undefined/enum으로 연결하며 값을 문자열로 저장하지 않는다. 나머지 숫자/문자/slider/select/plugin editor의 native 검증/동적 목록/콜백은 재사용한다.
- `WallThresholdEditor`는 기본 색상과 오름차순 경계값·적용 범위(80 이상 ~ 90 미만)를 함께 표시한다. 실제 값/범위 대비 비율을 구분하고 비율 단위와 경보 알림의 차이를 설명한다. 구간 추가/삭제/색상/음수·소수/외부 업데이트를 처리하며 빈 값/NaN/중복 경계를 emit하지 않는다. 원래 mode/steps와 기본 -Infinity 모델을 유지하고 단위에 맞춰 임의 clamp하거나 색상을 심각도로 추정하지 않는다.
- `optionText.ts`는 UI metadata에만 적용한다. 시계열·Stat·게이지·막대·표·로그·경보·텍스트의 제목/도움말/선택 항목·값 매핑·Override를 한글화하고 한글/영문 설정 검색을 지원한다. 사용자 필드명/쿼리/매핑 결과 텍스트·ID·단위 기호·HTML/Markdown/JSON/LCD 등 기술 이름은 보존하며 미등록 plugin 문구는 원문 fallback이다.
- 공용 UnitPicker/StatsPicker/TimeZonePicker/ScaleDistribution/DataLinks는 선택적 표시 callback을 추가했다. native 모형·formatter/reducer/링크 저장·비Wall 기본 표시를 유지한다. native 전문 편집기 전체를 새 Wall 구현으로 재개발했다고 표현하지 않는다.
- 공통 surfaceTokens/typography의 카드 경계·반경·간격·색/폰트를 사용한다. 최초 실제 브라우저에서 임계치 설명과 행이 길어지는 것을 확인하고 중복 제목·비례하지 않는 색상 띠를 제거해 두 경계값을 함께 볼 수 있게 줄였다. 새 패키지는 설치하지 않았다.

### 검증

| 항목           | 결과                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 자동 검사      | Wall UI 및 native 회귀 9 suites / 39 tests 통과. 기본 접힘/독립 Override 액션, 한글·영문 검색, typed radio, 기본 임계치 보존·소수/음수·빈 값/중복·추가/삭제/focus/외부 변경/비율 전환, 기존 Studio/buffer/PanelOptions/매핑 경로 포함. compact 정리 후 관련 13 tests도 다시 통과했다                                                                             |
| Jest 환경      | 기존 jsdom/nwsapi의 `:has(+ [role=option])` selector 오류에는 기존 `/private/tmp/wall-jest-selector-compat.cjs`를 해당 실행에만 사용했다. 실제 컴포넌트/콜백/제품 CSS/저장소 Jest 설정은 우회 변경하지 않았다. Worktree의 공용 UI 소스를 선택하는 임시 Jest mapper를 사용했다                                                                                    |
| 정적 검사      | 변경 코드 ESLint/Prettier/공백 검사 통과. 전체 TypeScript는 React 타입/Highlighter 등 165개 진단으로 실패하므로 전체 typecheck 통과를 주장하지 않는다. 수정 파일에서의 진단은 기존 두 Highlighter JSX 행이며 새 Wall editor/threshold/picker 코드의 진단은 없었다. shared node_modules의 원본 UI와 Worktree UI를 혼동하지 않도록 임시 paths/typeRoots를 명시했다 |
| 빌드           | production webpack 성공, 기존 경고 2개. shared node_modules가 원본 체크아웃을 참조하므로 검증용 임시 webpack alias로 Worktree `@grafana/ui`를 선택했다. 공용 UI가 managed cache에서 예전 소스를 가져오는 문제를 확인해 최종 검증 빌드는 cache=false로 수행했다. 저장소 빌드 설정/의존성은 변경하지 않았다                                                        |
| 실제 대표 유형 | 05 시계열 및 다른 UID의 Stat/Gauge/Bar gauge/Table/Logs/Bar chart/Alert list/Text 총 9개 설치 유형의 표현 Inspector를 확인했다. 표 셀 옵션/값 매핑 modal·취소 및 경보 제목의 남은 영문도 확인 후 보완했다. 498개 개별 패널이나 모든 서드파티 플러그인을 조작한 것으로 확대하지 않는다. Clock 미설치는 해결하지 않았다                                            |
| 임계치 동작    | 별도 QA 탭의 실제 값 80에 90 구간 추가, 80 이상~90 미만 표시, 빈 값 경고/emit 방지, 범위 비율 전환과 값 유지, native 변경 취소·조회 복귀 확인. 90 추가는 캡처용 QA 변경이며 서버에 저장하지 않았다                                                                                                                                                               |
| 테마/문서      | 실제 Light/Dark에서 카드·입력·차트를 확인하고 Light로 복귀했다. API의 19개 대시보드 JSON SHA256/버전은 검증 전후 모두 동일하다. 저장 버튼은 실행하지 않았다                                                                                                                                                                                                      |
| 사용자 상태    | 기존 사용 탭 `1296910978`은 변경 전후 그대로 보존했다. DOM의 임계치 입력 90/80/Base를 최종 확인했고 강제 갱신하지 않았다. 새 QA 미리보기 탭으로 결과를 제공하며 테스트로 바꾼 임계치는 native 취소했다                                                                                                                                                           |
| 로컬 런타임    | 기존 3317 preview/3318 fixture 환경을 사용했다. gitignored 빌드 자산만 preview의 public/build에 반영하고 기존 preview launchd를 재시작했다. 원래 탭의 메모리 편집 버퍼는 유지했다. 포트/인증/고객 환경 변경은 없다                                                                                                                                               |

최종 실제 화면은 `/Users/hongwookryu/.codex/visualizations/2026/11/03/01a19ecb-93ed-7330-bcc7-a4eccdeff56b/`의 `wall-settings-cards.jpg`, `wall-settings-cards-detail.jpg`, `wall-threshold-ranges-light.jpg`, `wall-threshold-ranges-detail.jpg`, `wall-threshold-ranges-dark.jpg`다. `wall-panel-type-qa.json`은 유형별 대표 조사 기록이다. 캡처는 로컬 fixture이며 운영/고객 데이터 검증이 아니다.

최종 확인: cache=false 빌드의 sourcemap에서 TimeZonePicker/UnitPicker/StatsPicker/ScaleDistribution/DataLinks 모두 실제 Worktree의 `displayText` 구현을 포함함을 확인했다. 최종 브라우저에서도 시간대 선택은 ‘기본값’, 표/경보 분류는 ‘셀 표시’·‘표시 설정’·‘필터’로 표시된다. 새 미리보기 탭 `1296911112`는 Light/검색 없음/기본 접힘 상태로 열어 두었다. QA의 90 구간 추가는 취소했고 원래 사용자 탭의 90/80/Base는 보존했다. 기존 경고 2개의 최종 production build(30.748초)와 최종 코드 ESLint/Prettier/공백 검사를 확인했다.

## 2026-11-03 수동 요청 — 한글·영문 타이포그래피와 편집 정보 밀도 (REF-73)

Inter Variable + Pretendard Variable을 유지하면서 실제 렌더링을 기준으로 공통 패널 편집기를 다듬었다. REF-72의 미커밋 변경 위에 적용했으며 기존 변경을 되돌리거나 별도 커밋·merge·push를 수행하지 않았다. managed worktree에서 작업했고 기존 3317 preview/3318 fixture와 배포 방식을 유지했다. HTTPS 중앙 배포/443·19100 전환, 운영 배포, backend/DB 변경은 포함하지 않았다.

### 실제 화면을 기준으로 한 반복 조정

1. 변경 전 브라우저의 실제 카드·필드와 computed style을 확인했다. 제목 12/600보다 필드 라벨 13/600이 강했고, 11px 요약이 상속된 20px 행간으로 별도 줄을 차지했다. 카드 본문 전 헤더가 약 60px였으며 일반 입력 32px와 자체 필드 38px, native radio와 Wall radio의 높이/굵기가 달랐다. 이 관찰 뒤 역할별 크기와 간격을 선택했다.
2. 카드 제목과 현재 설정 요약을 한 행으로 정렬하고, 제목/라벨/설명/입력값 역할을 분리했다. 긴 요약은 줄임표와 전체 title을 제공한다. 설명이 있는 스위치는 설명/라벨을 왼쪽에, 상태/스위치를 오른쪽에 맞췄다. 검색의 중복 focus 경계와 별도 줄을 차지하던 분류 breadcrumb도 정리했다.
3. 그래프 옵션을 실제 조작하면서 REF-72 radio adapter가 선 연결 방식/막대 정렬의 아이콘을 누락한 것을 확인하고 native icon/imgUrl/custom component를 보존하도록 수정했다. 값의 boolean/undefined/enum 타입과 원래 callback은 유지한다. 클릭과 방향키 이동을 실제 화면에서 확인했다.
4. 드롭다운은 Portal로 편집기 밖에 렌더링되어 Inter/Helvetica/Arial 14px만 적용되고 Pretendard가 빠지는 것을 발견했다. 선택적인 PortalPresentationContext를 공통 Select/Portal/Modal에 전달해 Wall Inspector에서 열린 팝업에도 동일한 폰트/설명 위계/Surface를 적용했다. 다른 화면은 context가 undefined이며 기존 native 경로를 유지한다. Portal 위치·Select 로직·Modal focus trap을 교체하지 않았다.
5. 유형별 확인에서 Table 전문 필드의 작은 왼쪽 스위치와 각진 Select가 남아 있어 공통 Field/SelectContainer의 표시 hook과 scoped CSS로 정렬/반경을 맞췄다. 체크박스와 값 매핑 native modal을 실제 열고 취소했다. 마지막으로 Light/Dark의 카드·임계치·팝업을 다시 캡처해 확인했다.

### 구현 범위

- 기존 InterVariable.woff2/Pretendard Variable 파일과 원래 전역 font-face를 유지한다. 편집기 전용 `Wall Editor Inter` alias만 같은 Inter 파일에 size-adjust:97%를 적용해 영문/숫자의 시각 크기를 맞춘다. `Wall Pretendard` fallback과 함께 Inspector/그 Inspector에서 연 팝업에만 사용한다. 조회 차트/대시보드의 폰트 토큰은 바꾸지 않았다.
- `typography.ts`에 렌더링 검토 후 선택한 편집기 역할을 분리했다. 제목 15/600/22, 카드 제목 13/600/20, 라벨 13/500/20, 본문·입력 13/400/20, 설명 12/400/18이다. `surfaceTokens.ts`에 공통 폼 간격/높이를 모아 일반 native/Wall 컨트롤을 32px로 맞췄다. 수치는 최초 검토 전 사전 요구값으로 정한 것이 아니다.
- `OptionsPaneCategory`, `WallOptionEditor`, `WallPanelDetails`, native action wrapper와 `panelEditor.css`를 통해 모든 공통 Studio 패널에 적용한다. 특정 시각화의 전용 CSS로 해결하지 않았다. 검색 결과 없음 문구와 Panel links/Repeat options의 표시 metadata도 보완했다.
- Base UI Collapsible keepMounted, Switch/Radio 키보드 동작, native option descriptor/검증/콜백/선택 목록/저장 모델/Query/Transform 버퍼를 유지한다. 코드 편집기의 실제 visible view-lines는 Menlo/Monaco/Courier New monospace를 유지함을 확인했다.

### 최종 검증

| 항목             | 결과                                                                                                                                                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 자동 검사        | 13 suites / 70 tests 통과. Wall UI/카드/검색/임계치/Studio/패널 정보/PanelOptions/값 매핑과 native SelectBase·Field·Modal 포함. icon-only 옵션의 한글 accessible name·native callback, imgUrl/custom component 보존 검사를 추가했다                                                                                         |
| Jest 환경        | 기존 jsdom/nwsapi의 `:has` selector 문제에 기존 임시 호환 파일을 해당 실행에만 사용했다. Worktree @grafana/ui를 선택하는 임시 mapper를 사용하며 저장소 Jest 설정/의존성을 변경하지 않았다                                                                                                                                   |
| 정적 검사        | 최종 58개 변경 TS/TSX/CSS Prettier, 변경 TS/TSX ESLint, git diff --check 통과. 전체 tsc는 기존 React/Highlighter/Portal 타입 의존성 문제 등 165개 진단으로 실패했다. 새 Wall editor/typography/tokens/context/Field/SelectContainer 코드의 새 진단은 없지만 전체 typecheck 통과로 표현하지 않는다                           |
| 빌드             | 최종 production webpack 성공(37.476초), 기존 경고 2개. 임시 설정에서 Worktree UI alias와 cache=false를 명시했다. 최종 sourcemap의 WallPanelStudio 소스가 현재 파일과 일치함을 확인한 뒤 gitignored public/build만 기존 preview에 반영하고 기존 launchd를 재시작했다                                                         |
| 실제 유형        | Time series/Stat/Gauge/Bar gauge/Table/Logs/Bar chart/Alert list/Text 총 9개 설치 유형의 표현 화면을 확인했다. 각 Inspector 416px에서 수평 overflow 0. 데이터 탭은 기존 760px 폭에서 overflow 0. 브라우저 viewport override는 사용하지 않았다. Clock 미설치나 모든 서드파티 플러그인 조합까지 검증한 것으로 확대하지 않는다 |
| 실제 조작        | 그래프 아이콘 선택 후 ArrowRight로 앞 계단 aria-checked=true 확인. Table native checkbox on/off, 값 매핑 modal의 열기·취소 확인. 시험 변경은 native 변경 취소로 폐기하고 QA 종료 시 변경 취소 disabled를 확인했다                                                                                                           |
| 팝업/테마        | 최종 Select option의 computed family는 Wall Editor Inter/Wall Pretendard, 13px/20px. native gradient 선택 띠를 Wall neutral Surface로 정리했다. Light/Dark 카드·임계치/팝업/패널 정보를 실제 캡처·검토하고 Light로 복귀했다                                                                                                 |
| 문서/사용자 상태 | 19개 저장 대시보드의 JSON SHA256/버전이 변경 전과 모두 동일하다. 저장 액션은 실행하지 않았다. 현재 사용자 탭 1296911112가 미저장 없음임을 확인한 뒤 최종 빌드로 갱신했고 동일 패널/URL/Light 상태를 유지했다. 시험용 두 탭은 정리했다. 이전 기록의 1296910978은 이번 작업의 활성 탭이 아니다                                |
| 런타임           | 최종 3317 /api/health database ok, 기존 버전 9.2.0. 새 운영 배포/포트/인증/자동화 변경은 없다. 사용자 원본 소스/index는 수정하지 않고 기존 로컬 preview 빌드 자산만 갱신했다                                                                                                                                                |

최종 실제 캡처는 `/Users/hongwookryu/.codex/visualizations/2026/11/03/01a19ecb-93ed-7330-bcc7-a4eccdeff56b/`의 `wall-ref73-final-workspace-light.jpg`, `wall-ref73-final-cards-light.jpg`, `wall-ref73-final-fields-light.jpg`, `wall-ref73-final-popup-light.jpg`, `wall-ref73-final-cards-dark.jpg`, `wall-ref73-final-threshold-dark.jpg`, `wall-ref73-final-panel-info-light.jpg`, `wall-ref73-final-table-light.jpg`다. 같은 폴더의 before/pass1/유형별 light 캡처는 중간 반복 확인 기록이며 최종 캡처와 구분한다. 모두 로컬 fixture 검증이다.

## 2026-11-03 수동 요청 — 한글 볼드 제목의 무게 조정 (REF-74)

- REF-72/73의 기존 사용자 미커밋 변경을 먼저 확인하고 보존했다. 커밋/원본 소스 동기화는 하지 않았으며 현재 managed worktree의 typography.ts/panelEditor.css 두 구현 파일만 추가 조정했다. 문서 3개는 새 기준을 덧붙였다.
- 실제 사용자 탭1296911112의 폰트 ready, fonts.check(600 Wall Pretendard/Wall Editor Inter)=true, font-synthesis=none과 computed 12px/600 미리보기 제목·13px/600 카드 제목을 확인했다. 로딩 실패나 합성 볼드로 단정하지 않고 작은 제목의 반복 강조와 상단/Inspector의 영문 family 차이를 정리했다.
- 공통 editor role은 heading550/title500/label450, body/control/caption400으로 조정했다. 크기·행간과 Inter/Pretendard 원본 파일·97% editor alias는 유지했다. Studio 미리보기 제목만 editor title weight에 연결하고 상단 제목/미리보기 헤더의 family를 Inspector와 일치시켰다. 조회 대시보드·KPI·Canvas 축/범례·Monaco·패널 데이터/설정/쿼리는 변경하지 않았다.
- 기존 관련 3 suites/10 tests 통과. 첫 Jest 호출은 setup 경로 오타로 실행 전 validation 실패했으며 올바른 public/test 경로로 수정한 실행은 통과했다. 기존 임시 Worktree UI mapper/selector compat만 해당 검증에 사용했고 제품/Jest 설정을 바꾸지 않았다. Prettier/ESLint/diff 공백 검사 통과. 최종 production webpack 2개 기존 경고와 함께 성공했다. 전체 회귀/typecheck는 이번 스타일 범위에서 반복하지 않았다.
- 최종 빌드의 gitignored 자산만 기존 preview public/build로 반영하고 기존 launchd를 재시작했다. 실제 사용 탭의 변경 취소 disabled(미저장 없음)를 확인한 뒤 같은 URL/패널/Light로 갱신했다. 실제 computed: 상단/Inspector550, 미리보기/카드500, 필드450이며 family는 Wall Editor Inter/Wall Pretendard다. 폰트 ready 및 Inspector 수평 overflow0, Light/Dark의 접힌 카드·펼친 필드 가독성을 확인했다. QA 탭은 정리했고 실제 사용 탭을 유지했다.
- 데이터 변경/저장 버튼은 실행하지 않았다. 기존 3317/3318 서비스와 포트/인증/DB/백엔드/배포 방식은 유지했다. 완료 화면: /Users/hongwookryu/.codex/visualizations/2026/11/03/wall-typography-ref74/after-light.png 및 after-dark.png. before-light.png는 이전 상태다. 로컬 fixture 검증이며 운영 데이터 검증이 아니다.

## 2026-11-03 수동 요청 — 글꼴 렌더링 경로 점검 (REF-75)

### 조사와 수정

기존 사용자 미커밋 작업 및 index를 보존했다. 별도 개발 브랜치의 현재 managed worktree에서 typography.ts/typography.css/WallPanelStudio.tsx 3개 구현 파일만 추가 수정했다. 공통 타이포그래피 경로에서 처리하고 개별 시각화/설정별 새 패치는 추가하지 않았다. REF-74의 크기·굵기는 다시 바꾸지 않았다.

- 실제 Wall 탭: Chrome 메뉴100%, inner1730×873 / outer1730×1050, DPR1, visualViewport.scale1. 한글 제목·설정 카드·필드 및 ancestor에서 transform/zoom/filter/perspective 없음. variation normal, stretch100%, optical auto, synthesis none을 확인했다. 기존 강제 font-smoothing은 해당 텍스트에 없었고 새 smoothing/3D transform/text stroke를 추가하지 않았다.
- FontTools/실제 정적 응답: 두 WOFF2의 SHA가 sources.json과 일치하고 Pretendard 한글 CMap 및 두 폰트의 가변 축/폭 메타데이터가 정상이다. 외부 폰트 설치/파일 교체/축 강제 지정은 수행하지 않았다. 실제 앱의 font-status=ready와 파일 메트릭/DOM Range를 교차 확인했다. 브라우저 도구의 FontFaceSet iterator/forEach 노출에는 제약이 있어 그 방법으로 face 목록을 판독했다고 주장하지 않는다.
- GlobalStyles/elements.ts 및 createTypography.ts에서 기본 Inter용 tracking이 body/button/h1에 적용됨을 확인했다. family를 Wall로 바꾼 뒤에도 필드0.14994px, button0.13923px, h1-0.13395px이 남아 있었다. 공통 typography.css의 root에서 body tracking 토큰을 사용하고 heading/control의 기본값은 inherit으로 바꿨다. 기존 의미별 heading/KPI tracking은 기존 우선순위를 유지한다.
- typography.ts에서 editor family를 공통 wallTypography.family로 통일하고 typography.css의 Wall Editor Inter size-adjust97% 별칭을 제거했다. 이 보정은 Inter 영문에만 적용되던 것이므로 한글 자체가97%로 축소됐다고 보고하지 않는다. 혼합 문자열의 렌더링 경로 불일치를 제거한 것이다. 원본 Inter/Pretendard의 natural metrics와 기존 role 크기·굵기·행간을 유지했다.
- WallPanelStudio의 기존 PortalPresentationContext에도 같은 tracking 토큰과 control inherit을 연결했다. native Select 팝업의 실제 option은 Wall Inter/Wall Pretendard, spacing normal, weight400으로 확인했다. native 콜백/선택/포커스/위치는 변경하지 않았다.

### 실측 및 검증

- Pretendard ‘툴/팁’의 advance1770 / unitsPerEm2048,13px 예상 advance 약11.235px. 수정 전 DOM Range 폭11.375/11.390625px·시작점 간격11.359375px, 수정 후 각각11.25px·간격11.234375px로 확인했다. 모든 폰트 문제의 유일한 원인이나 체감 선명도의 정량 점수로 확대하지 않는다.
- 실제 같은100% 화면에서 before/after 세부 캡처, 제목/펼친 필드/혼합 영문·한글과 Light/Dark를 비교했다. 현재 desktop은 DPR1이며 작은 unhinted Variable 글자의 래스터 표현을 모든 OS/DPI에서 완전히 제거했다고 주장하지 않는다. viewport override/화면 확대/이미지 보정으로 결과를 만들지 않았다.
- 3 suites/10 tests 통과. 기존 임시 Worktree mapper와 jsdom selector compat를 해당 실행에만 사용했다. ESLint/Prettier/diff check 통과. production webpack55.537초, 기존 경고2개. 전체 typecheck/전 유형 회귀를 반복하지 않았다.
- 표현→데이터 전환에서 실제 Monaco visible view-lines는 Menlo/Monaco/Courier New monospace 유지, Inspector overflow0. 코드/쿼리를 입력하거나 수정하지 않았다.
- 사용자 탭1296911112와 QA 탭의 변경 취소 disabled를 확인하고 실제 사용자 탭을 같은 URL/패널/Light로 갱신했다. QA에서 표면 전환/팝업만 조작했고 대시보드 저장은 실행하지 않았다. QA 탭1296911163은 정리했다. 기존 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지. 커밋/merge/push 없음.
- gitignored 빌드 자산만 기존 preview에 반영하고 launchd preview를 재시작했다. 3317/3318, 인증/DB/백엔드/운영 배포/HTTPS 전환은 변경하지 않았다.

실제 캡처: /Users/hongwookryu/.codex/visualizations/2026/11/03/wall-font-rendering-ref75/ 의 before-light.png, before-detail.png, after-light.png, after-detail.png, after-dark.png, after-popup.png. 로컬 fixture이며 운영/고객 데이터 검증이 아니다.

## 2026-11-03 수동 요청 — 패널 편집기 UX 전체 재설계 (REF-76)

### 구현

붙여넣은 구현 명세의7단계를 순서대로 진행했다. 현 managed worktree/개발 브랜치를 사용하고 기존 REF-72~75 사용자 미커밋 작업과 index를 보존했다. 기존 공통 Studio 적용 범위(일반 Scenes 패널 편집기)만 유지하며 다른 UID의 조회/Grid/대시보드 설정 화면으로 확대하지 않았다. 새 라이브러리/백엔드/버전/HTTPS/포트 변경 없음.

1. `WallPanelStudio.tsx`, `WallPanelEditor.tsx`, `PanelEditorRenderer.tsx`, `WallManagement.tsx`: 실제3작업 모드와 넓은 데이터 편집영역·미리보기, native 취소/적용/저장 분리 및 dirty 표시. DOM 재마운트 없이 CSS grid-area/keepMounted를 사용했다.
2. 신규 `WallInspector.tsx`, `PanelOptions.tsx`, `PanelOptionsPane.tsx`, `WallOptionEditor.tsx`: 원본 descriptor 보존 투영, 시계열5개 flat section, native plugin 고유 분류/custom/override fallback, 입력 버퍼/검색/확장 복원, 정보 표시의 tooltip/legend 하위 위계, Min/Max 한쌍과 자동/직접 표시.
3. 신규 `components/ui/dialog.tsx`, `WallVisualizationGallery.tsx`, `PanelVizTypePicker.tsx`: Base UI1.0.0 Dialog로 넓은7분류 실제 plugin 목록, 이름/아이콘/목적/현재표시와 native plugin conversion/cache/reset.
4. `WallThresholdEditor.tsx`, 신규 `WallValueMappingsEditor.tsx`, native `ValueMappingsEditor.tsx` opt-in: interval 행+비례 추정 없는 요약과 값/범위/정규식/특수값 rule 목록. native wire 변환·색상/icon·빈 문자열·무한 범위 유지, 미완성 draft는 emit하지 않는다. 기존 DnD만 재사용했다.
5. `optionText.ts`, `QueryOperationRow.tsx`, 공통 헤더: 필수 plugin/시각화/쿼리 옵션 한글화와 native technical/user string 보존.
6. `panelEditor.css`, `surfaceTokens.ts`: 공통 토큰의 flat section/dialog/rule/control/responsive 표시. 기존 Inter/Pretendard/역할별 typography와 REF-75 렌더링 수정 유지.
7. 신규/수정 테스트: WallInspector/WallValueMappingsEditor/WallPanelStudio/WallPanelEditor/WallPanelEditorActions와 기존 native option/query/panel editor 테스트.

### 검증

- 최종11 suites/52 tests 통과(`/tmp/wall-ux76-tests-final.log`). Worktree UI mapper와 기존 jsdom selector compat를 해당 실행에만 사용했다. native Category/Item descriptor 보존·literal검색·입력 버퍼·모드 전환·Mapping 전 유형·threshold·native Apply/Cancel/Query 동작 검증. 초기 header test의 locationService spy를 test render 이후 설치하도록 정정했고 제품 동작을 우회하지 않았다.
- 최종 production build31.932초, 기존 asset size 경고2개. ESLint/Prettier/diff check 통과. 전체 tsc는 shared React JSX 타입 오류가 남아 실패이며 `/tmp/wall-ux76-tsc2.log`에 기록했다. 이번 editor 변경 파일 오류가 사라진 것과 전체 성공을 혼동하지 않는다.
- 실제 Chrome1730×929 Light/Dark와1366/1024/760폭. 760의 낮은 preview에서 chart 공간이 부족한 것을 확인해 token320px로 재구성 후 실제 chart 표시/overflow0 확인, viewport reset. native 전문 Prometheus query UI/Monaco/toolbar가 실제 데이터 모드 넓은 작업영역에서 동작한다. 그 내부 모든 영문 전문 옵션을 새로 구현/번역한 것은 아니다.
- QA dashboard `wall-ux76-qa-20261103`에05번 panel140과 실제 query/options 복사. 시계열→Stat→Gauge→Table→시계열 native cache 유지, dialog 닫기/ESC 확인. threshold 입력을 비운 상태에서 모드 전환해 draft 보존 확인 후85입력. 값0→정상(QA) mapping, 제목 변경 및 native Monaco query comment로 버퍼 보존 확인.
- Apply 후 QA 서버 문서는version1/원값으로 남는 것을 확인했다. native Save Drawer 저장 후version2/제목/85/mapping/querycomment를 API와 재진입 화면으로 확인했다. data source/transform 원본 유지. 저장 뒤 별도 제목 변경→취소가 마지막 저장본으로 복귀함을 확인했다.
- QA 탭1296911172 정리 후 해당 임시 UID만 삭제(200)·조회404 확인. 시작 SHA 계산과 같은 `json.dumps(sort_keys=True)`로 기존19개 dashboard가 모두 동일함을 확인했다. 다른 compact JSON 직렬화로 비교한 중간 hash mismatch는 계산 방식 차이였으며 실제 문서 변경이 아니다. 운영/고객 데이터 검증으로 표현하지 않는다.
- 실제 사용자 탭1296911112는 변경 취소 disabled/전역 미저장 없음 확인 후 같은 URL로 갱신, 최종 화면 표시와 font loaded/Wall Inter·Pretendard/canvas/overflow0 확인. live editor 유지. gitignored 빌드만 원래 preview public/build에 반영하고 기존 launchd kickstart 사용, 소스 동기화/새 foreground 서버 없음. 3317 health database ok,3318 fixture HTTP200. 백엔드 바이너리 버전은 기존9.2.0이며 소스11.4와 혼동하지 않는다.
- 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지. 현재 다른 채팅 작업이 다수 미커밋 상태이므로 이를 커밋에 섞지 않았다. 커밋/스테이징/merge/push/운영배포 없음.

### 남은 경계

공통 구조를 Stat/Gauge/Table와 설치 plugin fallback에 연결했지만 모든 외부 plugin/모든 옵션을 개별 회귀검증한 것은 아니다. 미설치 Clock 및 기존 shared React 타입 문제는 해결 범위가 아니다. native query/Inspector/저장 권한·플러그인 호환 경로를 재사용하고 대시보드 조회·48열 배치 동작은 변경하지 않았다. 이번 구현과 원래 사용자 미커밋 변경을 구분해야 한다.

실제 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-editor-ux-ref76/`. 최종 실제 사용자 Light `wall-editor-final-light.png`, QA Dark `visual-dark.png`, 데이터 `data-light.png`, dialog `visualization-dialog-light.png`, threshold Light/Dark, 반응형 `visual-760-light.png`. `data-1366-light.png`/`visual-1024-light.png`는 중간 검토 캡처다.

## 2026-11-03 수동 요청 — 데이터 상하 편집·탭·쿼리 UI 정돈 (REF-77)

### 구현 범위

사용자가 제공한 데이터 탭 상하 분할 명세와 실제2장 화면을 확인했다. REF-76의 데이터 좌우 배치만 최신 요청으로 교체하고 정상 동작하던 다른 편집/옵션/저장/조회 기능을 보존했다. 현재 managed worktree와 codex/wall-autodev-20261030 브랜치의 기존 사용자 미커밋/index를 덮어쓰거나 커밋하지 않았다. 시작 patch는 /tmp/wall-ux77-before.patch, index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe다.

- WallPanelStudio.tsx/EditorPresentationContext.ts/WallPanelEditor.tsx: 실제 상하 native useSplitter, 안정적인 panes/ref, preview controls context와 작업영역 확대/ESC. 차트/옵션/query DOM은 작업 탭 전환 시 그대로 유지한다.
- components/ui/tabs.tsx: 실제 Base UI Panel로 forwardRef 연결. 작업 탭은 segmented 컨트롤로 바꾸고 border와 pseudo-element의 이중 밑줄 제거.
- 신규 WallQueryToolbar.tsx: Base UI 기반 local Wall 버튼·Radio/Switch/Collapsible. mode/예제/설명/실행/코드 영역 확대와 compact query options. 기존 callbacks에 연결한다.
- PanelEditorRenderer.tsx: 기존 preview/toolbar 재사용, native query tab dsSettings의 현재 source 이름 표시. lower selector는 중복 생성하지 않는다.
- packages/grafana-prometheus/src/querybuilder/components/PromQueryEditorSelector.tsx·PromQueryCodeEditor.tsx·PromQueryBuilderOptions.tsx·PromQueryLegendEditor.tsx 및 shared/QueryOptionGroup.tsx: Wall context에서만 새 구조를 사용하고 native state/parse-confirm/변환/옵션 wire를 보존한다. 다른 caller의 native 경로는 그대로다.
- packages/grafana-prometheus/src/components/PromQueryField.tsx 및 monaco-query-field/MonacoQueryField.tsx·Props.ts: 기존 메트릭 브라우저를 상단으로 재배치. native code content/layout 경로에 optional minimumHeight만 연결. 언어/자동완성/키보드/query string/문법 색상·글꼴을 재개발하지 않는다.
- surfaceTokens.ts/panelEditor.css/optionText.ts: 기본 split50%, pane min230/180, code min140/expanded360, 공통 Surface/폼/반응형 토큰. Query 전용 Range는 기간이며 기존 reducer Range=범위를 덮어쓰지 않는다. 관련 이전 Grid CSS의 중복 배치를 제거했다.

### 원인과 조정

1. 기존 작업 탭은 선택 border-bottom과 공통 ::after 밑줄이 겹쳤다. local Tabs variant/실제 segmented 구조로 정돈했다.
2. 첫 실화면에서 native Splitter paneProps의 inline min-content 때문에 query pane이 content만큼 커지고 preview가106px로 줄었다. 실제 pane props에 native minHeight 경계를 연결해 해결했다.
3. native Emotion container의 늦게 주입된 display:flex가 같은 specificity의 Wall grid를 덮어써 시각화 탭도 상하로 보이던 것을 확인했다. pane selector의 정확한 범위/우선순위를 올려 데이터만 flex-column, 시각화/정보는 좌우 Grid로 검증했다. chart options/data를 변경하여 우회하지 않았다.
4. 미리보기 제목/컨트롤 중복 세로 행과 lower content의 중복 padding을 줄이고 source/시간/보기 도구를 하나의 header 안에서 재배치했다. 좁은 화면에서는 wrap하며 전체 page/preview/data의 가로 overflow0을 확인했다.

### 테스트·실화면

- 최종6 suites/39 tests 통과(/tmp/wall-ux77-tests-end.log). 기존 PromQueryEditorSelector/CodeEditor/BuilderOptions/PromQueryField 및 WallPanelStudio/WallPanelEditor 테스트. 추가 검증은 native mode/run 콜백, preview확대/ESC, 동일 query/input node의 모드 왕복 보존이다. 광범위한 전체 회귀는 수행하지 않았다.
- ESLint/Prettier/diff check 통과. 기존 모듈/React 타입 제약 때문에 전체 tsc 성공으로 보고하지 않는다. 초기 중복 번역키와 새 테스트의 잘못된 ByRole exact 옵션은 수정했다. 임시 local mapper의 typecheck에서는 기존 테스트 typeRoots/React 모듈 중복 등의 제약이 크므로 전체 성공으로 판단하지 않았다.
- Worktree가 공유 node_modules를 사용하여 로컬 수정 Prometheus를 원래 checkout으로 해석하던 환경을 확인했다. /tmp/wall-data-webpack.cjs와 /tmp/wall-data-jest.cjs에 UI/Prometheus local source alias를 사용하고, 이 Worktree packages/grafana-prometheus/node_modules는 원래 checkout의 기존 package 의존성 디렉터리로 연결했다. 새 라이브러리 설치나 package manifest/lock 수정 없음. 이 설정은 깨끗한 독립 checkout의 제품 build 설정 변경이 아니다.
- actual Chrome1730×929 Light/Dark,1024/760×900에서 preview 전체 폭/가로 overflow0·차트 축/단위·native Monaco 폭 확인. 실제 경계 drag로 preview 약325→249px, editor 반대 방향 증가 확인. 코드 표시140→360px/복원, full preview666px/ESC로 동일 split 복원 확인.
- native Monaco에 검증 comment를 입력하고 시각화→패널 정보→데이터 왕복 후 같은 문자열 유지 확인. native 취소로 원복했다. 새 진입 후 Builder→Code→쿼리 실행·변환 탭 진입을 확인하고 native 취소했다. 서버 저장을 실행하지 않았으며 기존19개 dashboard SHA는 REF-76 시작과 전부 동일했다. source SCVM 빈 변수는 변경하지 않았다.
- 사용자 탭은 갱신 전 미저장 상태를 확인하며 별도 QA 탭1296911185에서 실제 확인했다. viewport override는 reset했고 테마는 Light로 복원한다. 최신 UI 실제 반영/캡처/health 확인 후 완료한다. 3317/3318 기존 launchd와 DB/인증/프로토콜/포트/백엔드 유지. 운영 배포/merge/push/커밋/스테이징 없음.

캡처 디렉터리: /Users/hongwookryu/.codex/visualizations/2026/11/03/wall-data-layout-ref77/. data-desktop-light.png는 기본 split, data-resized-light.png는 실제 높이 조절 후, data-desktop-dark.png 및 data-1024-light.png/data-760-light.png는 해당 폭/테마 실화면이다. 최종 build/사용 탭 반영 결과는 아래 완료 기록에 추가한다.

### REF-77 완료 기록

- 최종 production webpack44.192초/기존 asset size 경고2개(`/tmp/wall-ux77-build8.log`), 최종 관련6 suites/39 tests7.932초(`/tmp/wall-ux77-tests-end.log`), ESLint/Prettier/diff check 통과. build 자산만 원래 preview에 rsync하고 기존 launchd 서비스를 kickstart했다.
- 최종 preview header에서 source badge와 시간 컨트롤의 native toolbar width100%가 불필요하게 줄바꿈하던 것을 width:auto의 scoped 표시 규칙으로 정돈했다. 실제 기본/조절 후 Light, Dark,760px에서 다시 확인했다. 760px의 두 pane와 전체 document 모두 수평 overflow0, viewport override reset/Light 복원 완료.
- native 테이블 보기 on/off도 실제 preview에서 확인했다. 이후 local 높이만 조절한 상태에서 변경 사항 없음이며 query/model 저장은 하지 않았다.
- **원래 사용자 탭1296911112의 실제 AX에서 `대시보드 변경 사항` 및 변경 취소/저장 UI를 확인했다. 이 탭은 강제 갱신하지 않았다.** 위 단계의 `.wall-management-unsaved` 없음만으로 dashboard 자체 dirty가 없다고 판단하지 않는다. 소스 반영을 위한 미저장 상태 검사는 Wall layout/native dashboard 저장 바까지 포함한다. 최신 결과는 별도 탭1296911185의 같은05번 실제 패널140 데이터 모드로 열어 deliverable로 유지했다. 원래 탭의 draft는 보존했다.
- 기존19개 dashboard SHA 일치, 저장 API 호출 없음. 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지. 커밋/스테이징 없음. 최종3317/3318 health/HTTP 응답을 확인했다.

## REF-78/79 — 코드 중심 쿼리 작업공간 재구성 (2026-11-03 수동 요청)

### 최종 구조와 결정

사용자의 최신 요청으로 데이터 모드를 큰 preview 좌·query workspace 우로 변경했다. 처음의 source/선택쿼리 Card·큰 작업공간 설명은 다시 줄여 **source 선택 행→작은 A/B/C 선택→직접 편집 가능한 Monaco→실행**으로 정리했다. REF-77 상하 배치와 중간 REF-78 카드 중심 화면은 최종 결과가 아니다. 다른 두 모드도 시각화/패널 설정으로 이름을 정돈했으며 native 트리는 계속 mounted 상태다.

- native source picker를 큰 Card 대신 compact 행으로 배치했다. 확대와 추가 작업은 같은 행에 둔다.
- 선택된 쿼리만 보여주며 기존 query array/ID와 모든 쿼리 편집 인스턴스는 유지한다. native 추가/복제 후 새 쿼리를 선택한다. 기존 native DnD 정렬·rename/hide/duplicate/remove를 그대로 사용한다.
- Builder/Code·실제 지표 탐색 버튼·보조 도구·Run을 한 코드 toolbar로 재구성했다. React DOM portal은 기존 native 버튼/옵션 노드의 표시 위치만 옮긴다. 코드와 쿼리를 재생성하지 않는다.
- 쿼리별 legend/형식/조회 유형/관리와 전체 max points/interval/relative time/time shift 등은 기본접힘 고급 설정에 둔다. 옵션의 native validation/blur/onChange와 입력 버퍼를 유지한다. 변환은 작은 보조 section이며 native 탭/URL을 따른다. 쿼리 검사·source 도움말·지원 시 표현식 추가는 Base UI 메뉴에 둔다.
- workspace 확대는 영역 내 overlay이며 기존 pane/preview를 mounted/측정 상태로 유지한다. ESC는 popup 우선, 일반 확대 ESC는 복원이다. 같은 코드를 편집하고 복원하므로 별도 편집 버퍼나 저장 경로가 없다.
- panel/query/transform 모델·기존 저장 API/버전 경로·48열 배치·대시보드 조회 화면은 변경하지 않았다. 다른 datasource의 전문 편집 UI와 Angular는 native 호환 renderer를 보존한다. 전체 설치 plugin별 UI를 새로 만든 것으로 보고하지 않는다.

### 주요 변경 파일

| 파일                                                                                                                                           | 변경                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `public/app/features/wall-modern/editor/WallQueryWorkspace.tsx` (신규)                                                                         | native Scenes 활성화/쿼리 실행 상태 구독, source/query/advanced/transform/menu 조합                               |
| `public/app/features/wall-modern/editor/WallQueryParts.tsx` (신규)                                                                             | 작은 쿼리 선택·native DnD·선택쿼리 표시·stable advanced slot·결과 상태                                            |
| `public/app/features/wall-modern/editor/WallQueryToolbar.tsx`, `EditorPresentationContext.ts`                                                  | 실제 metrics/option portal, 통합 toolbar, 보조 도구, UI-only 확장 context                                         |
| `public/app/features/wall-modern/editor/WallPanelStudio.tsx`, `surfaceTokens.ts`, `editor/panelEditor.css`                                     | preview59%/workspace 최소460px의 기존 splitter, 모드/반응형/확대, 코드240/360px 공통 표시 토큰, flat Surface·밀도 |
| `public/app/features/query/components/QueryEditorRows.tsx`, `QueryEditorRow.tsx`                                                               | workspace opt-in 표시, 기존 query/plugin/action/drag callback과 mounted 버퍼 재사용                               |
| `public/app/features/query/components/QueryGroup.tsx`, `QueryGroupOptions.tsx`                                                                 | 기존 source/options/actions를 실제 배치 단위로 분리, native 값/검증/지원 필드 유지                                |
| `public/app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataPane.tsx`, `EmptyTransformationsMessage.tsx`, `PanelEditorRenderer.tsx` | 공통 Wall 경로 연결, 작고 기능이 같은 변환 진입점·실제 preview result status                                      |
| `packages/grafana-prometheus/src/querybuilder/components/PromQueryEditorSelector.tsx`, `PromQueryCodeEditor.tsx`                               | native mode/run/parse/stale/metrics 상태를 toolbar와 연결, 기존 Monaco 코드 최소 높이/폭 표시 prop                |
| `editor/WallQuerySelection.test.tsx` (신규), `editor/WallPanelStudio.test.tsx`                                                                 | 선택/정렬/오류/옵션/portal 버퍼/metrics callback·확대/중첩 popup ESC 등 의미 있는 회귀 검증                       |
| `DESIGN_SYSTEM.md`, `AGENTS.md`, 이 진행 기록                                                                                                  | 실제 Base UI/import·CSS와 구조 변경 구분, REF-79 우선순위 및 검증 기록                                            |

### 실화면에서 발견·수정한 문제

1. 처음 query model을 useState만 구독하면 기존 Component 활성화 경로가 빠져 첫 로딩 spinner가 끝나지 않았다. `useSceneObjectState(model,{shouldActivateOrKeepAlive:true})`로 native 생명주기를 유지했다. 탭 왕복으로 초기 실패를 우회하지 않는다.
2. native source 도움말 state를 메뉴 Popup 안에 두면 메뉴 종료 시 modal도 사라질 수 있어 owner를 원래 QueryGroup에 유지하고 action render-prop만 분리했다. 실제 native 도움말과 Inspector query drawer를 확인했다.
3. Dark Tools Popup의 portal에는 상위 CSS 변수가 상속되지 않아 Switch가 보이지 않았다. 기존 typography/form/surface 공통 변수를 popup에 전달하고 설명 Switch의 명시적인 접근성 이름도 수정했다. 새 폰트/smoothing을 추가하지 않았다.
4. 1366px에서 EditorRows 자식의 min-content 폭이 Monaco를 이전563px로 고정해 workspace 안에 가로 overflow가 생겼다. Wall code root의 opt-in `wall-prom-code-editor`에 width100%/min-width0을 연결했다. 최종 actual workspace458px 안 Monaco424px로 줄고 workspace scrollWidth=clientWidth458을 확인했다. 확대/복원도 실제 width를 다시 측정한다.

### 최종 검증

- 관련 **8 suites/56 tests 통과**, `/tmp/wall-ux79-tests-final.log`14.165초. native QueryEditorRows/Row/Group, PromQuerySelector/CodeEditor, WallStudio/Editor/선택쿼리 회귀 테스트다. 새 기능을 검증하는 범위만 실행했다.
- 최종 production webpack51.585초/기존 asset size 경고2개, `/tmp/wall-ux79-build4.log`. local UI/Prometheus alias를 사용하며 정적 build 자산만 preview checkout에 rsync하고 기존 launchd preview를 kickstart했다. 새 의존성/manifest/lock/원본 checkout 소스 변경 없음.
- 관련 ESLint/Prettier 및 git diff --check 통과. 전체 tsc는 기존 shared React JSX/Portal 타입과 Worktree module 해석 오류가 남아 통과로 보고하지 않는다. 새 QueryWorkspace의 미사용 import와 테스트 fixture TimeRange 오류는 수정했다. 최종 `/tmp/wall-ux79-tsc-final.log`에 기존 WallStudio PortalPresentationContext 경로 해석 오류가 남으며 local build/Jest alias에서는 정상 resolve된다.
- actual Chrome 기본 **1730×873/DPR1 Light/Dark**와1366×900/1024×900/760×900에서 확인했다. 페이지/코드 작업영역 가로 overflow0. 1366에서 도구 행은 자연스럽게 wrap하며1024/760에서는 responsive 세로 배치와 native 코드 편집을 유지한다. viewport override reset/Light 복원 완료. Wall Inter/Wall Pretendard loaded를 실제 DOM에서 확인했다.
- native 지표 탐색 열기/닫기, source 도움말, 쿼리 검사 drawer 진입·복귀, Builder/Code, 쿼리 A→B 복제 후 새 ID 선택, B 범례 변경→A/B 왕복 후 같은 값, native 실행 후6개 실제 frame 결과, keyboard horizontal reorder B2→1을 확인했다. 전 단계 native Monaco 입력 comment의 A/B/작업모드 왕복 보존도 확인했다. 테스트용 query/Builder/범례 변경은 native 취소로 원복했다.
- 고급 설정·변환 기본접힘/확장, native 변환 URL `tab=transformations`, 작업공간 확대/복원 및 nested popover ESC 우선 처리를 확인했다. 최종 native 상태는 `변경 사항 없음`, single query A다. 저장 API를 호출하지 않았다. 기존19개 dashboard JSON SHA/version은 `/tmp/wall-ux76-baseline.json`과 모두 동일하다. 이는 기존 로컬 fixture 검증이며 실제 SCVM/고객 query 검증이 아니다.
- 사용자 원래 탭1296911112는 기존 미저장 dashboard draft 때문에 강제 갱신하지 않았다. 이전 결과 탭1296911185도 갱신하지 않았다. 최신 결과는 현재 검증 탭 **1296911188**을 데이터 쿼리 모드로 열어 deliverable 유지했다. 해당 탭에서 실제 스타일/코드/차트를 확인했다.
- 기존 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe` 보존, 스테이징/커밋/merge/push/운영 배포 없음. 기존3317 health database ok와05 dashboard HTTP200,3318 fixture HTTP200을 확인했다. 개발 서비스/DB/프로토콜/포트/인증 정책 유지.

최종 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-query-workspace-ref79/`의 `code-first-light.png`, `code-first-dark.png`, `code-1366-light.png`, `code-760-light.png`, `workspace-expanded-light.png`. REF-78 중간 카드 중심 캡처는 전달하지 않는다.

## REF-80 — 코드 전용 편집기 간소화·실화면 검증 (2026-11-03 수동 요청)

### 구현 결과

최신 사용자 요청에 따라 Wall의 Builder/Code 전환, Prometheus/Loki 시각적 연산 카드, 예제/단계별 Explain/지표·라벨 탐색과 보조 도구 Popup을 렌더링 경로에서 제외했다. 원래 Grafana parser/Builder/실행 코드는 native fallback에 남긴다. 큰 preview 좌·workspace 우 구조는 유지하고 source→A/B/C→직접 코드→실행 Footer→접힌 쿼리 옵션→접힌 데이터 변환으로 정돈했다. CSS로만 버튼을 숨기는 처리가 아니다.

- `PromQueryEditorSelector`는 Wall+PanelEditor에서 기존 CodeEditor를 직접 렌더링한다. 저장된 editorMode=builder도 expr를 그대로 표시하며 진입 시 onChange/changeEditorMode/parser를 호출하지 않는다. native default/완성 language provider/변수/validation/Shift+Enter·query options를 유지한다. old Explain flag가 있더라도 Wall에 Explain을 렌더하지 않는다.
- `WallQueryToolbar`는 코드 아래의 단축키·실행 전 상태·Run Footer가 됐다. Button은 기존 local shadcn 방식/Base UI primitive/Tailwind/cva다. 설명 Switch/보조 Popover/metrics DOM slot과 해당 dead CSS는 제거했다. 코드는 실제 화면 비교 후 기존 공통 token320px/확대480px을 사용한다.
- `WallQueryOptions/WorkspaceSection`의 기존 Base UI Collapsible와 stable portal/keepMounted는 유지한다. 쿼리별/global 옵션과 복제·숨김·삭제·rename 등은 같은 native callback이며 변환/Inspector/일반 source help도 재사용한다. query 예제/cheatsheet 중복 진입은 연결한 코드 경로에서 제외한다.
- 실제 설치 Loki도 기존 LogQL CodeEditor/Monaco/통계/옵션을 재사용한다. 최소 높이는 native content-height/layout 경로의 선택 prop으로 전달한다. 옵션이 portal로 옮겨진 후 비어 있는 EditorRow 회색 띠가 남던 것을 실제 Fragment wrapper로 해결했다. source에 bytes/message가 없는 stats를 `NaN` 조회량으로 꾸미지 않는다.
- SQL은 core Context를 별도 플러그인 안에 번들링하지 않고 `WallCodeQueryPresentation` UI-only props로 host가 코드 높이·공통 실행/옵션 renderer를 전달한다. plugin의 host import는 type-only다. 기존 RawEditor/SQLEditor/언어/검증/Format/업데이트/실행을 재사용하며 onChange는 원래 rawSql/rawQuery 처리다. Code에 없던 DatasetSelector를 넣지 않아 기본 데이터베이스 자동 선택으로 저장 쿼리를 초기화할 수 있는 경로를 제외했다.
- Host opt-in이 없는 SQL caller와 Explore/경보, 코드 API를 연결하지 않은 플러그인·Angular는 기존 native 편집기를 유지한다. 실제 `-- Grafana --` 선택형 편집기 fallback을 확인했다. 설치되지 않은 모든 플러그인 UI를 개별 검증한 것으로 보고하지 않는다.

### 이번 수정 파일

| 파일 그룹        | 주요 파일 / 내용                                                                                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wall 공통 UI     | `public/app/features/wall-modern/editor/WallQueryToolbar.tsx`, `WallQueryWorkspace.tsx`, `WallQueryParts.tsx`, `EditorPresentationContext.ts` — 실행 Footer/쿼리 옵션/SQL host 표시 props                                                                                                                        |
| 토큰·표시        | `public/app/features/wall-modern/surfaceTokens.ts`, `editor/panelEditor.css` — 기존 코드 높이 token/Footer 정렬, 제거된 도구 관련 CSS 정리. 차트/대시보드 geometry 변경 없음                                                                                                                                     |
| native 쿼리 연결 | `public/app/features/query/components/QueryEditorRow.tsx` — 기존 plugin/controller/error/권한 보존, SQL에 선택적 host props, 제거한 cheatsheet 진입 구분. data-wall-query-type/plugin은 DOM 진단용 타입 표식이며 query 저장에 포함하지 않는다                                                                    |
| Prometheus       | `packages/grafana-prometheus/src/querybuilder/components/PromQueryEditorSelector.tsx`, `PromQueryCodeEditor.tsx`, `components/PromQueryField.tsx` — Wall code-only/native fallback, 기존 코드·언어 provider 유지                                                                                                 |
| Loki             | `public/app/plugins/datasource/loki/components/LokiQueryEditor.tsx`, `LokiQueryField.tsx`, `components/monaco-query-field/MonacoQueryField.tsx`, `MonacoQueryFieldProps.ts`, `querybuilder/components/LokiQueryCodeEditor.tsx`, `LokiQueryBuilderOptions.tsx` — native code/옵션 재사용 및 선택적 표시 높이 전달 |
| SQL              | `packages/grafana-sql/src/components/QueryEditor.tsx`, `QueryHeader.tsx`, `query-editor-raw/RawEditor.tsx` — native RawEditor/Format과 host UI 결합. 시각적 SQL Builder는 native fallback에 보존                                                                                                                 |
| 회귀 검증        | `WallQuerySelection.test.tsx`, `PromQueryEditorSelector.test.tsx`, `LokiQueryEditor.test.tsx`, 신규 `packages/grafana-sql/src/components/WallSqlCodeEditor.test.tsx` — 저장 Builder/Code 원본 무변환·수정/실행/native 경로·Footer/입력 버퍼                                                                      |
| 기준·기억        | `DESIGN_SYSTEM.md` REF-80, `AGENTS.md`, 이 기록 — REF-79의 Builder/도구 유지 기준을 최신 코드 전용 정책으로 대체                                                                                                                                                                                                 |

### 빌드·호환 문제와 조치

MySQL은 메인 webpack 내장 chunk가 아닌 독립 AMD 플러그인이다. main build만 교체하면 UI가 그대로 남는다. 기존 `packages/grafana-plugin-configs/webpack.config.ts`로 **MySQL도 별도 production build**했고 원래 외부 의존성/로더 정책을 유지했다. 임시 config `/tmp/wall-mysql-webpack.cjs`는 기존 config를 사용해 SQL을 Worktree 소스로 resolve하고 출력만 `/tmp/wall-ux80-mysql-dist`로 분리한다. 새 package 설치나 source webpack 설정 변경은 없다.

브라우저는 `module.js?_cache=11.4.0-pre`를 사용하고 서버 Cache-Control=max-age3600이라 이전 플러그인이 계속 표시됐다. source/서버의 새 JS만 보고 반영됐다고 판단하지 않았다. 개발 dist metadata의 빌드 식별자를 `11.4.0-pre-wall-ui80`으로 구분해 실제 새 모듈을 로딩한 뒤 Builder 미노출/SQL 입력/Run/공통 옵션을 확인했다. source plugin.json placeholder/package.json·Grafana 서버 버전/프로토콜/포트는 변경하지 않았다. 원래 JS/map/plugin.json은 `/tmp/wall-ux80-mysql-dist-before/`에 보존했다. 정적 자산만 original preview checkout에 반영하고 기존 launchd를 kickstart했다. signature/인증/권한을 완화하지 않았다.

SQL 테스트에서 native DatasetSelector를 Code 진입 시 새로 렌더하면 기본 DB 선택 callback이 쿼리를 초기화할 수 있다는 문제를 확인했다. Code에는 원래 제공되던 Format만 유지해 제거했고 테스트를 통과했다. 잘못된 중간 테스트 실행은 종료했으며 무한 재실행하지 않았다.

### 검증 결과와 제약

- 관련 **10 suites / 77 tests 통과**(`/tmp/wall-ux80-tests-final.log`,12.27초). 기존 native Prometheus/Loki/SQL·QueryEditorRows/Row·WallStudio/입력 버퍼 테스트와 저장 Builder/Code 양쪽 무변환 회귀를 포함한다. 이후 Row 메타데이터/type predicate의 최종 확인은 `/tmp/wall-ux80-row-final.log`에 남긴다. 전체 repository 테스트 반복은 하지 않았다.
- 최종 main webpack **40.428초**, `/tmp/wall-ux80-build7.log`, 기존 size 경고2개. MySQL 별도 build4~5초/size 경고2개. 관련 ESLint/Prettier 및 diff check 통과. 전체 tsc는 공유 React/Portal·SQL 시각적 Builder 의존성 타입 제약이 남아 성공으로 보고하지 않는다. 이번 코드 경로를 typecheck 전체 통과로 포장하지 않는다.
- 실제05번 panel140, 기본1730×873/DPR1에서 Light/Dark의 코드 크기·한영/숫자·도구 없는 위계·실행 위치·옵션/변환 접힘을 확인했다. 실제 query source·original PromQL/단위·시간 컨트롤·차트 유지. 확대/복원은 마우스/키보드로 확인했고 같은 editor buffer/원래 split으로 돌아왔다. 최종 tab1296911188은 Light/변경 사항 없음 상태로 유지했다.
- 이번 viewport override 시도는 현재 탭의 실제 innerWidth가1730으로 유지되어 새로운1366/760 검증으로 집계하지 않았다. 기존 REF-79의 폭 수정/반응형 CSS는 보존했다. 임시 viewport override는 reset했다. viewport 요청 성공만으로 화면 검증을 통과했다고 기록하지 않는다.
- 일회용 QA UID `wall-ux80-qa-20261103`를 생성해 저장된 builder 쿼리를 Code로 열고 실제 Monaco에 comment를 추가했다. Shift+Enter 실행→시각화/데이터 왕복→native 적용→native 대시보드 저장→재진입을 확인했다. 서버 version2에 정확한 expr/comment와 원래 editorMode=builder, ID/datasource/fieldConfig/options/transforms 보존을 API로 비교했다.
- 같은 QA에서 native 복제 B→새 ID 선택·숨김·삭제·새 쿼리·변환 진입을 확인하고 취소했다. Loki/SQL의 실제 source 전환·코드 표시/옵션을 확인했다. SQL `SELECT 1 AS wall_ui_check`는 기존 MySQL 연결 실패 오류를 반환했다. **MySQL 실제 데이터 결과는 검증하지 못했으며 오류 전달만 확인했다.** Prometheus/SCVM은 로컬 fixture이며 고객/운영 데이터 검증이 아니다.
- QA는 native 취소 후 닫고 API 삭제/404를 확인했다. `/tmp/wall-ux80-baseline.json`의 **기존19개 dashboard SHA/version 모두 동일**하다. 원래05번 JSON/쿼리·운영 DB/고객 환경 변경 없음. 원래 사용자 미저장 탭은 갱신하지 않았고 검증/최종 표시 탭만 갱신했다. 잘못 생성된 own about:blank 탭도 닫았다.
- 3317 health database ok/05 HTTP200과3318 fixture HTTP200, 기존 preview/fixture launchd 유지. 사용자 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe` 보존. 새 라이브러리/스테이징/커밋/merge/push/운영 배포 없음. 기존 shared node_modules용 임시 UI/Prometheus alias에 SQL local alias를 더했으며, Worktree SQL node_modules는 원래 checkout의 이미 설치된 package 의존성에 연결했다.

실제 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-code-editor-ref80/`의 `code-only-light.png`, `code-only-dark.png`, `expanded-dark.png`, `mysql-native-error.png`. 마지막 캡처는 성공 결과가 아니라 실제 MySQL 미연결 오류를 보여주는 검증 기록이다.

## REF-81 — 데이터 변환 영역 개선 (2026-11-03)

- 수정: WallQueryWorkspace.tsx의 바깥 접힘/고정 요약 제거, PanelDataTransformationsTab.tsx의 실제 개수/compact 추가·전체삭제, TransformationOperationRow.tsx의 Wall 표시 분기, 신규 WallTransformationRow.tsx와 해당 테스트, panelEditor.css의 전용 token 스타일. DESIGN_SYSTEM/AGENTS 기준 업데이트.
- native transformer/registry/옵션/추가 drawer/삭제 확인/활성화·Filter·Debug·Help 및 원래 DragDropContext의 reorder callback을 유지한다. 개별 설정만 Base UI Collapsible로 기본접힘/keepMounted이며 native fallback은 그대로다. 다른 편집 UI/쿼리/저장/대시보드 데이터 변경 없음.
- 기존 변환 관련2 suites/16 tests와 새 disclosure/입력 버퍼/native action 테스트1개, 합계17 tests 통과. production webpack32.080초/기존 size경고2개. ESLint import 정리/Prettier/diff check. 전체 테스트/전체 리팩터링은 수행하지 않았다.
- 실제 Chrome에서 0개/빈 설명 없음→Limit 추가→설정 펼침/비활성화→Concatenate 추가→keyboard DnD2→1→기존 삭제 확인을 검증했다. Light/Dark 확인. 테스트는 native 취소했고 저장 API를 호출하지 않았다. 로컬 fixture 검증이며 운영 데이터 검증이 아니다.
- 기존 사용자 탭1296911188에 변경 사항 있음이 확인돼 강제 갱신하지 않았다. 별도1296911211에서 검증하고 원본 상태로 재진입해 최종 표시한다. preview 정적 build만 반영하고 기존 launchd3317/3318을 유지한다. 사용자 index/기존 미커밋 변경 보존, 스테이징/커밋/운영 배포 없음.
- 캡처: /Users/hongwookryu/.codex/visualizations/2026/11/03/wall-transforms-ref81/empty-light.png 및 list-dark.png.

## REF-82 — Resize 격자 정렬·포인터 입력 안정화 (2026-11-03, 직접 요청)

### 확인한 원인과 변경

- 이동/Resize는 native24열로 왕복하지 않고 같은48열 Wall 좌표를 사용했다. `panelColumnPitch`를 공통화했으며 기존 `dashboard.wallModern.layouts`/원래 panels.gridPos는 그대로다.
- 실제 재현:05번 ID32의 y123/minH38에서 Resize가 snap 후 minH로 다시 clamp되어 y+h161(322px), gutter12 제외 실제 하단310px으로 확정됐다.12px 점 기준 나머지10px, 즉2px 부족했다. min/max 범위와 snap lattice의 교집합에서 끝점을 선택하도록 수정했다. 같은 조작에서 h39/실제 하단312px, 나머지0px을 확인했다. 미조작 축/기존2px 좌표는 일괄 재정렬하지 않는다.
- 가로 점은 trailing gutter를 포함한 셀 시작만 표시하고 실제 카드 끝은12px 앞에 있었다. 같은48열 셀의 시작/카드 끝 트랙을 `panelGridDotOrigins`로 함께 표시한다. 간격·카드 크기를 바꾸거나 Transform/Offset으로 불일치를 숨기지 않는다. REF-62의 실제 border-box preview/마지막 preview 확정은 보존한다.
- 기존 handle은 Hover에 따라 pointer-events를 none/auto로 바꾸고 장식 span도 hit-test했다. Resize 중 snap된 handle을 raw mouse가 벗어나면 밑의 일반 cursor 영역이 입력 대상이 됐고 document mouse listener만으로 계속 조작했다. 고정 입력 box/장식 pointer-events:none, mouse/pen Pointer Capture를 추가했다.6px 의도 이후 native Resize 동안만 임시 cursor style을 유지하고 stop/cancel/lost capture/blur/readOnly/unmount에서 제거한다. 새 DnD/새 Resize 엔진 없음.
- **정지 Hover만의 주기적 깜빡임은 수정 전에도 재현되지 않았다.** 해당 원인을 확정하거나 모든 환경에서 해결했다고 주장하지 않는다. 확인된 것은 실제 조작 중 일반 cursor로 hit-test되는 경로다. 수정 후 실제 조작 중 captured=true, handle 밖의 tile/Grid도 computed se-resize, 종료 후 capture0/cursor style0/Grid false를 확인했다. 단순 누름 중 captured=true이지만 Grid false/Dirty false이고 해제 후 capture0이다.
- 취소 검증에서 크기는 복원됐지만 저장 바가 다시 나타났다. native setState가 merge하므로 초기 optional isDirty 키 부재 시 기존 true를 유지했고, stopTrackingChanges가 subscription만 끊어 pending worker 응답도 다시 Dirty를 만들었다. 복원 시 false 명시, 중지 worker의 handler/instance 종료 및 다음 편집에서 새 worker로 분리했다. query/데이터 worker 및 저장 API를 바꾸지 않았다. 최종 Resize→취소→network→overview에서 Dirty false 유지 확인.

### 수정 파일

- 공통 배치: `workspace/PanelLayoutGrid.tsx`, `layoutMovement.ts`, `panelGeometry.ts`, `kpiLayout.css`, 신규 `resizePointer.ts`.
- native 취소: `dashboard-scene/scene/DashboardScene.tsx`, `saving/DashboardSceneChangeTracker.ts`의 제한된 상태/lifecycle 수정.
- 검증: `layoutMovement.test.ts`, 신규 `resizePointer.test.ts`, `PanelResizeGrid.test.tsx`, native `DashboardScene.test.tsx`, `DashboardSceneChangeTracker.test.ts`.
- 기준/기억: DESIGN_SYSTEM REF-82, AGENTS.md, 이 기록. shadcn/Base UI primitive를 새로 만들거나 차트·Toolbar·메뉴 디자인을 변경하지 않았다. CSS 표시 변경과 실제 snap/pointer/cancel 로직 변경을 구분한다.

### 검증 결과 및 제약

- 관련5 suites/37 tests 통과(`/tmp/wall-resize82-tests-verified.log`), native 편집·취소2 suites/48 tests 통과(14개 unrelated test 제외, `/tmp/wall-resize82-cancel-verified.log`). 합계85개. SE 실제 입력/축소·확대·min/max/서버 좌표와 별도의 component 저장·재마운트/핸들 DOM 유지/blur cleanup/다중 선택·kiosk abort/REF-62의 mouseup mismatch 회귀 포함. SW는 기존 helper 테스트이며 UI는 원래 SE 하나를 유지한다.
- 처음 넓게 확인한 기존 `PanelLayoutHistory.test.tsx`1건/`panelLayout.test.tsx`2건은 실패했다. 원본 파일을 수정하지 않고 HEAD 소스를 `/tmp/wall-resize82-baseline`에 분리해 같은3건 실패를 확인했다(`/tmp/wall-resize82-baseline-tests2.log`). 이전 guide/교환 기대값·rAF 시점 관련 테스트다. 이3건을 이번 변경으로 새로 생긴 실패 또는 전체 회귀 통과로 보고하지 않는다. 새 통합 회귀는 rAF를 실제 frame 경계에서 flush해 검증했다.
- 최종 webpack28.810초/기존 size 경고2개(`/tmp/wall-resize82-build-release.log`). 관련 ESLint/Prettier/diff check 통과. 전체 repository tsc/test를 반복 실행하거나 전체 통과로 보고하지 않는다.
- 실제 Chrome1730×929/DPR1.05번 개요·네트워크·스토리지·Glue 디바이스·프로세스에서 KPI/사용률/정보/시계열 Resize를 조작했다. minH/가로 전체48열/축소·확대/충돌/취소 및 이웃 교환 이동을 확인했다. 측정한 Resize 사례 모두 preview와 최종 실제 border box x/y/w/h 오차0px. 드래그 중 Dot은 배경에만 표시되고 stop 후 즉시 제거된다. Light/Dark와 핸들 기존 색 Light rgb163,163,173 / Dark rgb201,202,209를 유지한다.
- 저장은 원본05번을 덮어쓰지 않고 native 설정의 복사본 저장으로 QA UID `bg360tftxt14wd`를 생성했다. 저장→실제 브라우저 reload→API 재조회에서 ID32의 x33/y123/w13/h39가 동일했다. 원본59개 data panel의 targets/datasource/fieldConfig/options/transformations/gridPos/type은 모두 동일했다. QA UID는 원래 native UI fallback이므로 그 UID에서48열 Workspace가 새로 활성화됐다고 보고하지 않는다.48열 geometry 복원은 공통 component 회귀와 저장 metadata를 함께 검증했다. QA는 API 삭제200으로 정리했다.
- 다른 UID `aec03sr91pfk0f`(실제 제목02. 호스트 종합 현황)는 기존 native Grid2개/Wall48열0개/Dirty false를 확인했다. UID 예외를 새로 만들거나 Workspace를 전체 대시보드로 자동 확대하지 않았다. 다른 UID를48열로 변환하는 검증은 이번 범위가 아니다.
- 원본19개 dashboard SHA/version 모두 동일(`/tmp/wall-resize82-dashboard-baseline.json`). 로컬 fixture이며 운영/고객 데이터 검증이 아니다. 사용자 기존 미저장 탭은 갱신하지 않았다. own1296911214의 검증 변경은 모두 취소했고 최종 Light/원래 KPI289×96px/Dirty0/guide0/cursor style0으로 유지한다.
- 기존 launchd preview/fixture만 유지했고3317 health database ok/대시보드HTTP200/3318 HTTP200을 확인했다. 표시 backend version9.2.0은 기존 로컬 binary이며 source frontend11.4.0-pre와 구분한다. 버전/DB 설정/포트/인증/운영 배포 변경 없음. 사용자 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe` 및 기존 미커밋 작업 보존, staging/commit/merge/push 없음.

실측/화면: `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-resize-ref82/`의 `measurements.json`, `resize-guide-dark.png`(실제 조작 도중), `resize-dark.png`(검증 배치), `final-light.png`(취소/원복 후). 조작 중 캡처는 한 시점의 preview이며 그 뒤의 포인터 이동까지 최종 배치로 오해하지 않는다. 마지막 preview/놓기 일치는 별도 DOM 진단으로 측정했다.

## REF-83 — 중복 Dot 제거와 한 칸씩 흡착 검증 (2026-11-03)

- 사용자 지적: 한 점을 건너뛰어 흡착하는 느낌/점 과밀. REF-82에서 추가한 leading/trailing 동시 트랙 때문에 실제 가로 한 열30.458px 안에18.458px/12px로 두 점이 교대로 그려지고 있었다. 표시 점을 실제48열보다 촘촘하게 만든 이전 변경을 바로잡았다.
- 수정: `panelGeometry.ts`의 단일 `panelGridDotOrigin`/`PanelLayoutGrid.tsx`의 조작별 기준점/CSS 한 개 radial-gradient/`layoutMovement.test.ts`의 연속 step 회귀. 이동은 좌상단, Resize는 조작 중 모서리의 실제 카드 끝점을 기준으로 같은 pitch를 표시한다. 기존48열·세로12px stop·2px 저장 정밀도·min/max·preview/drop·Pointer Capture·취소 로직은 변경하지 않았다. Base UI/shadcn primitive 추가/다른 UID 확대 없음.
- 관련3 suites/31 tests 통과(`/tmp/wall-grid83-tests.log`), production webpack35.201초/기존 size 경고2개(`/tmp/wall-grid83-build.log`), 관련 ESLint/Prettier/diff check. 이전 전체 테스트를 반복하지 않았다.
- 실제 Chrome에서 ID28을 한 열씩 조작해 `10→11→12→13→12→11→10`을 확인했다. 각 단계 실제 카드 폭323/354/384/354/323/293px, preview/drop x/y/w/h 오차 모두0px. 세로도12px씩 `132→144→132→120px`이고 preview와 동일했다. 즉 실제 stop 사이에 추가 표시되던 점을 없앤 것이며 저장 정밀도를24열로 낮추지 않았다.
- 실제 Resize 중 computed background는 radial-gradient 하나, size30.4583px×12px, position-27.2292px/-18px로 실제 조절하는 카드 우하단 끝과 일치했다. 이전 둘 이상의 background origin을 복원하지 않는다. 실제 화면 `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-grid-ref83/single-grid-light.png` 참조. 조작 중 캡처이며 검증 변경은 취소했다.
- 사용자 미저장 탭은 보호하며 검증 탭만 먼저 반영했다. 최종 사용 탭 반영/서비스 확인은 아래 후속 기록을 따른다. 서버 저장·원본 dashboard 데이터 수정/새 라이브러리/운영 배포 없음.
- 최종: 기존 사용 탭1296911214에서 Dirty0/조작0/편집기 없음 확인 후 갱신했다. computed `--wall-layout-grid-origin` 단일 값과 이전 복수 origins 변수 없음/Dirty0을 실제 탭에서 확인했다. 별도 검증 탭1296911230은 취소 후 닫았다.3317 health ok/대시보드200/3318 fixture200, 원본19개 dashboard SHA/version 동일, 사용자 index tree 보존. 다른 미저장 탭은 갱신하지 않았다.

## REF-84 — Resize 때 왼쪽이 어긋나던 가이드 수정 (2026-11-03)

- 실제 원인: REF-83에서 SE Resize일 때 점 원점 전체를 gapX/gapY만큼 옮겼다. 오른쪽 끝 phase에 맞추는 동안 고정된 왼쪽 기준도12px 이동했다. 동일 간격의 점 하나로 gutter를 포함한 양쪽 content 경계를 모두 표현할 수 없는 구조를 잘못 투영한 문제다. 실제48열 저장 좌표를 바꿔 해결한 것으로 보고하지 않는다.
- 최종 수정: 신규 `LayoutGridGuide.tsx`가 한 logical cell의 시작/끝과 다음 셀까지의 gap을 고정 SVG pattern bracket으로 표시한다. `panelGeometry.ts`의 `panelGridGuideGeometry`, `PanelLayoutGrid.tsx`의 공통 배경 연결, `kpiLayout.css`의 배경 레이어 스타일을 사용한다. 조작 종류에 따른 원점 이동/점 중복은 없다. 중간 점+끝 tick 표시는 실제 화면에서 너무 촘촘해 최종안에서 제거했다.
- 새 데이터/Drag 엔진이나 라이브러리 없음. 실제 SVG는 pattern/path/rect 몇 개만 쓰는 배경이며 aria-hidden/pointer-events:none/z-index-1. 기존 native Grid/48열/2px 저장 정밀도/12px 조작 stop/12px 카드 간격/REF-62 preview/drop/REF-82 포인터 및 취소는 유지한다. 공통 Wall 토큰 색을 사용하고 차트·메뉴·Toolbar·데이터/JSON은 변경하지 않았다.
- 회귀: `layoutMovement.test.ts`에 여러 시작 열/폭의 양쪽 경계와 좁은 cell의 주기적 gutter phase를 검증했다. `PanelResizeGrid.test.tsx`는 조작 전후 같은 SVG DOM/geometry 유지도 확인한다. 관련3 suites/33 tests 통과(`/tmp/wall-grid84-verified-tests.log`), ESLint/Prettier/diff check, 최종 webpack31.020초/기존 size경고2개(`/tmp/wall-grid84-final-build.log`). 이전 광범위 테스트를 반복하지 않았다.
- 실제 Chrome에서 ID34(x21)의 Resize 전후 guide outerHTML 동일. pattern pitch30.458333px, cell content18.458333px/gutter12px, row12px. 왼쪽896px/오른쪽1371px은 고정 guide에서 각각0.375px/0.041667px 차이(native 반올림)였고 마지막 preview/drop x/y/w/h 차이는0px이었다. 이후 ID28의 native 이웃 교환 이동에서도 guide geometry 동일. Light/Dark 조작 화면을 확인했고 종료 후 guide display none/Dirty0을 확인했다. 검증 변경은 취소했다.
- 캡처/실측: `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-grid-ref84/cells-light.png`, `cells-dark.png`, `measurements.json`. 조작 중 캡처이며 그 후 포인터 이동이 더 진행될 수 있으므로 한 중간 프레임을 마지막 preview로 표현하지 않는다. 최종 preview/drop는 별도 DOM 진단으로 비교했다.
- 사용 탭1296911214는 이번 반영 시 Dirty1/조작0으로 확인돼 **새로고침하지 않았다**. 이전 사용자 배치를 보존했고 별도1296911234에서 최종 빌드/Light/취소 후 상태를 유지한다. 이 탭을 기존 사용 탭까지 반영된 것으로 보고하지 않는다. 원래 사용자 index/다른 미커밋 변경 보존, staging/commit/운영 배포 없음.

## REF-85 — 종합 우선 전체 대시보드 패널 디자인 통합 (2026-11-03)

- 최신 사용자 요청은 전체 대시보드의 **표시 디자인** 확대다. 기존 `codex/wall-autodev-20261030` 관리 Worktree를 유지하고 이전 AGENTS/REF-84·Git 상태/진행 기록을 확인했다. 05의 ID별 의미 투영/5탭/48열 엔진과 일반 native Grid는 구분하며 구조를 일괄 변환하지 않았다. 새 UID별 스타일/엔진/의존성/운영 배포 없음.
- 신규 `panels/WallDashboardPanel.tsx`, `panelPresentation.ts`, `WallPanelState.tsx`, `panels.css`, 회귀 `panelPresentation.test.ts`. `DashboardGridItem`의 일반/반복 VizPanel과 `ViewPanelScene`에 공통 표시를 연결했다. `PanelChromePresentation`/`PanelChrome`는 선택적 header·untitled hover header·content·error slot/높이 계산을 제공하고 미사용 caller는 기존 동작을 유지한다. 원래 VizPanel/플러그인/QueryRunner는 계속 mounted다.
- A-Hybrid는 기존 local CardHeader/CardTitle/WallPanelHeader와 실제 Base UI Button/Menu를 재사용한다. native title/menu를 실제 React 구조로 교체하고 native 드래그 클래스는 Grip에만 배치했다. 작은 패널은 타입/높이로 header/padding을 결정한다. native 설명/링크/시간/오류/stream/cancel-query를 유지하며 잠재적인 중복 native 메뉴는 hideMenu로 제거했다. 일반 대시보드의 동작 가능한 native edit 상태만 Grip을 표시한다. 별도 전역 편집 정책/48열 이전을 이번 디자인 작업에서 새로 만들지 않았다.
- `WallChrome`/`model`/`chartTokens`/`visualization`/`surfaceTokens`, native Stat/Table/BarGauge의 기존 presentation을 공통화했다. Inter/Pretendard·Canvas 재측정·Wall 기본 팔레트/축/범례/툴팁과 단위/상태 타입을 재사용한다. 기존 field color/threshold/unit/query/Transform·색상 셀/정렬/필터/데이터 링크/BarGauge 모드는 보존한다. `modern.css` 이전 native frame 규칙이 새 card border/shadow를 덮던 충돌은 common frame만 legacy 규칙에서 제외해 해결했다.
- `WallPanelActions`는 기존 native 메뉴 생성/권한/핸들러·Drill-in을 그대로 사용하며 일반 화면의 명시적 readOnly/kiosk 정책을 받는다. 실제로 kiosk ESC 후 URL만 바뀌고 메뉴 관리 상태가 복원되지 않는 기존05 전용 null 처리도 발견했다. `DashboardSceneUrlSync`의 UID 조건만 제거하고 원래 null 처리/레이아웃 참조를 보존했다. 별도 상태/권한 우회가 아니다.
- 브라우저: 새 own 검증 탭에서 원본19 UID 진입, 종합23개 common frame/기존 native header 중복0을 확인했다. 일반·장치·VM·예측·로그·경보·보고서의 Stat/Gauge/Time series/Table/BarGauge/Bar chart/Logs/Text/Alert list 경로 확인. 03의 접힌 네트워크/스토리지/프로세스 Row도 펼쳤다. native lazy mounting이 있어 화면별 DOM 수를 원본 전체 패널 검증 수로 보고하지 않는다. 05의5탭은 25(데이터21+Text4)/19/7/6/6 표시 항목과 기존 custom usage/capacity/status 및 조작 안내0을 확인했다.
- 실화면: 종합 Light/Dark/좁은 KPI/긴 차트/제목·범례를 비교했다. 최종 공통 Surface는 Light border rgb(195,207,221)/shadow0 1px 3px 5%, Dark border rgb(76,94,120)/shadow0 1px 3px 18%, radius8px, 실제 Wall Inter/Pretendard다. 단색/약한 단일 shadow/무배경 Text를 유지한다. 메뉴 검사→데이터/쿼리/JSON Drill-in, ESC 복귀·닫기를 확인했다.
- 안전한 저장 검증은 API로 만든 임시 `wall-ui85-4ac6a247`(종합 복사본)에 한정했다. 기존 Grid로 Mold Grip 이동 후 Resize115×144→176×182px, native 저장 창으로 version2 저장, 새로고침 후 같은 style/위치 복원. 저장 gridPos는 x4/y0/w3/h5이며 모든 panel ID/targets는 원본과 동일했다. native view→edit 전후23개 Grid style(width/height/transform)도 동일했다. 원본 대시보드에는 저장하지 않았다. 복사본 정리는 아래 최종 기록 참조.
- 실제 차트 Hover는 cube01/avg 값·timestamp를 원래 tooltip으로 표시했고 plot drag Zoom은 from/to 절대시간 URL로 반영됐다. kiosk에서 Grip/설정 없음, 조회 메뉴 유지/편집·검사 제외, ESC 후 편집 메뉴 복귀와 기존 Wall 패널 편집기 진입/취소를 확인했다. save/cancel/Inspector 및 query 엔진은 재구현하지 않았다.
- 테스트: 관련11 suites/154 passed/1 skipped(`/tmp/wall-unified85-final-tests.log`), 추가 kiosk/메뉴/상태3 suites22 passed(`/tmp/wall-unified85-kiosk-tests.log`, 중복 포함). skip한 native show-on-hover visibility1건은 변경 전 HEAD PanelChrome로도 동일 실패(`/tmp/wall-unified85-baseline-chrome-test.log`)를 확인한 jsdom CSS 가시성 문제다. 다른 제품 실패를 숨기지 않으며 전체 tsc/전체 회귀 통과를 주장하지 않는다. 최종 webpack26.397초/기존 size경고2개(`/tmp/wall-unified85-release-build.log`), 관련 ESLint/Prettier/diff 검증.
- 개발 환경 제약: 기존 Clock 플러그인 누락·일부 SQL/데이터소스 미연결/SCVM 빈 값은 수정하지 않았다. 실제 query error/원문을 표시하며 정상/가짜 데이터를 만들어 감추지 않는다. query-free/외부 플러그인의 자체 상태·legacy/solo 경로는 native 호환으로 남아 있다. 19개 저장 JSON 전체 동일 확인(`/tmp/wall-unified85-preservation.json`). 이 검증은 로컬 fixture/preview이며 고객 데이터 검증이 아니다.
- 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/03/wall-unified-panels-ref85/overview-before.png`, `overview-light.png`, `overview-dark.png`. 실제 빌드 자산만 원본 checkout public/build에 반영했다. 기존 사용자 미저장 탭은 갱신/폐기하지 않았으며 own 종합 검증 탭만 Light로 전달한다. 사용자 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe`와 기존 미커밋 작업 보존. staging/commit/merge/push 없음.
- 최종 점검(2026-11-04 KST): 임시 QA API 삭제200/재조회404, 원본19 JSON 전체 동일 재확인. preview/fixture launchd running,3317 health200/종합 dashboard200/3318 fixture200. 최종 own 종합 탭1296911237은 최신 release 자산/Light/font ready/common23개/uPlot5개/열린 메뉴·dialog0으로 유지한다. 보고서31의 Dark Text도 실제 background transparent/border transparent/shadow none과 Canvas 표시를 확인했다. 추가 QA 탭은 닫았고 기존 사용자 미저장 탭은 그대로 보존했다. 최종 ESLint/diff check 통과와 index tree 동일을 확인했다.

## REF-86 — Gauge 외형 재설계 (2026-11-04)

- 사용자 이미지의 이중 반원/연속 임계치 외곽선이 Grafana 인상을 강하게 유지하고 있었다. shadcn 공식 Radial 페이지를 확인해 값 중심 위계와 간결한 track을 참고했다. 새로운 외부 차트 라이브러리/Backend/저장 모델 변경은 없다.
- 신규 `panels/WallGauge.tsx`/`WallGauge.test.tsx`, 기존 `visualization.ts`, `VizPresentation.ts`, `Gauge.tsx`를 수정했다. native GaugePanel 데이터/reducer/DisplayValue/field/색/단위/다중 값·순서/클릭을 재사용하고 선택적 renderGauge slot에서 SVG270도 링+HTML 숫자/작은 단위+실제 값 이름을 표시한다. geometry/track은 wallGaugeTokens, 타입/색상은 기존 typography/surface 토큰이다. 컨테이너/헤더/메뉴의 기존 shadcn/Base UI를 유지하며 SVG가 해당 라이브러리 primitive라고 표현하지 않는다.
- 명시 threshold 숫자 label 및 neutral gauge는 native fallback을 유지한다. percentage normalization은 기존 Gauge와 동일하고 범위 밖 숫자를 보정하지 않는다. 링 geometry만 범위 끝에 제한한다. threshold marker는 실제 단계의 값과 색을 사용하며 fixed-color 모드에는 임계치를 추가하지 않는다.
- 실화면에서 긴24.00%가 링에 닿는 것을 확인하고 native calculateFontSize로 내부 폭 fitting을 적용했다. Dark 전환 때 native props.theme snapshot이 Light로 남는 문제도 확인해 실제 useTheme2 Context를 읽도록 해결했다. ThemeProvider를 전환하고 props에 반대 테마를 전달하는 회귀 테스트를 추가했다.
- 관련2 suites6 tests 통과(`/tmp/wall-gauge86-tests-final.log`). 값/단위/평균 이름·threshold tick·클릭·원본 props 보존/percentage·범위 밖·NaN·특수 옵션 fallback·실시간 테마 전환을 검증했다. production build와 실제 최종 화면/서비스 확인은 아래 기록을 따른다. 기존 사용자 index/미저장 탭은 보존하며 새 검증 탭을 사용했다.
- 최종 production build43.121초/기존 size경고2개(`/tmp/wall-gauge86-theme-build.log`), 관련 ESLint/diff check 통과. 기존 launchd preview만 kickstart하고 원본 checkout에는 build 자산만 복사했다.3317 health200/3318 fixture200, 원본19 dashboard JSON 전체 동일을 확인했다. index tree도 이전과 동일하다. 새 검증 탭1296911284의 종합에서 Radial9개(평균/최고 다중 값 포함), Light/Dark, 값24.00/30/68.00/74/100과 단위·이름을 확인했다. Dark의 실제 track#29374a/숫자rgb(241,245,250), Light track#edf2f7/숫자rgb(20,34,57)를 실측했다. 최종 화면은 Light로 복원했으며 기존 사용자 미저장 탭은 새로고침하지 않았다.
- 실제 최종 Dark 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-gauge-ref86/dark.png`. Light에서는 스크롤하여 사용자 VM CPU/메모리 평균·최고와 시스템 VM 평균을 한 화면에서 비교했다. 로컬 fixture 검증이며 운영 데이터 검증으로 표현하지 않는다. 특수 threshold label/neutral 설정은 의도적인 native 호환 외형으로 남아 있다. 커밋/운영 배포/원본 JSON 저장 없음.

## REF-87 — 공통 Motion 적용 (2026-11-04)

- 이전 상태/Git index/AGENTS·REF-51/85/86 및 기존 motion.css를 확인했다. 기존 모션은05 일부 팝업/패널에만 있었고 Base UI Collapsible에는 height transition이 없었다. 사용자 기준으로 모든 Wall UI/포털에 공통 CSS 토큰을 적용했다. hover120/tab180/popup160·exit100/accordion240·190/dialog280ms, 새 라이브러리 없음.
- 신규 local `components/ui/collapsible.tsx`와 상태 보존 테스트, 기존 `tabs.tsx` Indicator/`dialog.tsx` backdrop scope, `motion.css`, `WallChrome.tsx` Portal opt-in, native `Portal.tsx`/`SelectMenu.tsx` marker를 수정했다. native `OptionsPaneCategory`의 Wall branch와 `WallInspector/WallQueryParts/WallQueryToolbar/WallTransformationRow`는 같은 Collapsible을 사용한다. panelEditor.css는 padding/flex를 내부 content로 옮긴 것만 이번 작업의 변경이며 그 파일의 기존 대규모 미커밋 UI 변경을 이번 변경이라고 보고하지 않는다.
- Base UI1.0.0 실제 `useCollapsiblePanel`/height CSS vars/starting·ending/keepMounted/중단 처리와 Tabs.Indicator active-tab vars를 확인했다. 초기 구현의 data-closed height0이 native auto→측정px→ending0 순서보다 먼저 적용될 수 있어 제거했다. 높이0은 starting/ending에서만 적용하며 data-closed는 close duration만 지정한다. 원래 query/transform/field/권한·저장 상태와 Grid 계산은 변경하지 않았다.
- native Select는 직접 document.body로 포털을 만들어 Portal wrapper만으로는 적용되지 않는 것을 실화면에서 발견했다. 일반/가상화 메뉴의 기존 div를 forwardRef Surface로 유지하면서 opt-in marker를 전달했다. 실제 시간대 Select에서 wall-content-enter160ms를 확인했다. native exit는 기존 unmount/Focus 계약을 유지하며 강제 지연하지 않는다. Base UI 메뉴/Dialog는 native transition lifecycle로 등장·퇴장 둘 다 연결된다.
- Strato 공식 Animations/Accordion 문서를 참고했다. 제공 Dynatrace URL은 AppShell과 빈 앱 본문만 표시되어 재접속1회 후 추가 재시도하지 않았다. 외부 데모를 실제 조작/실측 완료했다고 보고하지 않는다. 앱 설치/계정·보안 설정 변경 없음.
- 테스트: 기존 Inspector/Studio/QuerySelection/TransformationRow/PanelActions5 suites24 passed, 신규 Collapsible 입력 유지1 passed, native Select22 passed. Select는 기존 jsdom :has 장식 호환 setup만 사용했고 실제 컴포넌트/핸들러는 그대로다. 총7 suites47 tests(중복 없음). 입력을 수정한 뒤4회 접고 펼쳐도 값/단일 mount 유지 확인. timing 검증을 jsdom 결과로 대신하지 않는다.
- 실제 Chrome:05 시계열140 편집기의 차트 스타일/값·색상, 쿼리 옵션,244의 기존3개 Transform, 시각화 Dialog, 대시보드 설정 일반/변수 및 저장 메뉴/시간대 Select를 확인했다. 측정된 height transition240/190, tab indicator left/width180, popup opacity/transform160, Dialog opacity/translate280, scale none이다. 실제 중간 높이721.125px/target722px와 쿼리 옵션658.25px를 확인했다. 빠른 native 클릭은46/83/121ms에3회 발생해 transition 도중 방향 전환을 점검했다. 닫힘 순서 수정 후 최종 실측/캡처는 아래 최종 기록 참조.
- 차트 데이터와 대시보드 배치/Drag/Resize에는 새 tween을 적용하지 않았다. 기존 Grid 토큰/조건/엔진은 보존했다. reduced-motion은 본문/포털 CSS에 대응하며 OS 설정을 임의 변경하지 않았다. native legacy 도구의 퇴장 제약은 위와 같고 완전한 모든 플러그인별 모션 검증으로 과장하지 않는다.
- 최종 확인: data-closed 높이 규칙 제거 후 실제 닫힘 60ms 시점에 target722px/실제250.375px/data-ending-style/hidden 없음/190ms를 확인했고 종료 후0px/hidden으로 전환했다. 최종 빌드에서 약101ms 동안3회 클릭해 방향 반전 뒤 최종 expanded 상태와 변경 사항 없음도 확인했다. Light/Dark 편집 화면을 직접 검토했으며 종합 대시보드 Mold 메뉴의 opacity/transform160ms도 확인했다.
- 최종 빌드32.966초/기존 size경고2개(`/tmp/wall-motion87-final.log`), 관련 ESLint(`/tmp/wall-motion87-final-lint.log`) 및 git diff --check 통과. preview/fixture launchd running,3317 health200/05 dashboard200/3318 fixture200. 기존19 dashboard JSON 전체 동일(`/tmp/wall-motion87-preservation.json`). 사용자 index tree는0423fc0071bb143a81f8064df2bec6e8f3a43afe로 보존했다. 기존 미커밋 작업을 staging/commit하지 않았다.
- 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-motion-ref87/accordion.gif`는 최종 브라우저 실제17프레임(전환 기록1427ms)을 연결한 펼침/접힘 증거다. 정지 구간만 읽기 편하게 늘렸으며 중간 프레임을 생성/보간하지 않았다. editor-light.png/editor-dark.png/overview-light.png도 같은 폴더에 보존했다. own 편집 탭1296911290은 최신 자산·Light·변경 사항 없음으로 유지하며 다른 own QA 탭은 닫았다. 기존 사용자 미저장 탭은 갱신하지 않았다.
- 전체 패널 범위 재확인: 사용자 추가 요청에 따라 일반 Scenes 편집기 진입에 UID/ID/type 제한이 없는 것을 추적했다. 종합 Stat71/게이지19에서 설정 펼침240ms와 실제 중간 높이439.53125/332.859375px를 확인했다.05 Table244의 필드별 설정도 같은 Panel을 사용한다. 누락된 native 옵션 Trigger/Custom Trigger Chevron 전환을 공통 토큰에 연결하고, 일반 제목의 기능 아이콘까지 회전하던 selector는 마지막 Chevron만 대상으로 제한했다. 최신 build44.523초/기존 경고2개 후 build 자산만 반영했다. 최신 Table244에서 중첩 설정 실측159.609375px/240ms, Chevron 회전 중 matrix/240ms와 변경 사항 없음을 확인했다. 캡처는 같은 폴더 `table-common-options.png`다. 종합 신규 검증 탭은 진입 직후부터 기존 미저장 안내가 있어 저장/취소/갱신하지 않았으며 값 편집도 하지 않았다. 사용자 원래 탭과 기존 index는 보존했다.

## REF-89 — 전체 Dashboard Toolbar (2026-11-04)

- 사용자 요청으로 DashboardSceneRenderer의 Toolbar 조건에서05 Workspace 종속을 제거했다. snapshot/NotFound 호환은 유지하며 실제 WallDashboardToolbar/variableControls·hide·URL/timeRange/refreshPicker·links/권한을 재사용한다. 일반 UID의 기존 editing 상태에서 저장·취소 접근이 사라지지 않도록 기존 WallManagementActions를 연결했다.05 Workspace/48열/5탭·데이터/배치/JSON은 변경하지 않았다.
- Toolbar/SceneRenderer2 suites14 tests passed(`/tmp/wall-toolbar89-final-tests.log`), ESLint/diff check 통과. 최종 webpack29.883초/기존 size경고2개. build 자산만 반영하고 기존 preview launchd를 재시작했다.3317 health/3318 fixture200, 사용자 index0423fc0071bb143a81f8064df2bec6e8f3a43afe 보존.
- 실제 종합/06 클라우드센터 상세에 공통 Toolbar1개와 시간/15s/Netdive/공유/설정을 확인했다. 종합 시간 Popover·ESC,06 Dark를 확인했고 종합의 wall-global-actions/wall-native-toolbar는0개다. 숨긴 변수 설정은 유지하며 변수 동작은 기존 관련 테스트에 포함된다. 캡처 `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-shell-ref88/toolbar89-overview-light.png`. 최신 종합 검증 탭만 전달하고 기존 사용자 미저장 탭은 갱신하지 않았다. 저장/DB/운영 변경·커밋 없음.

## REF-88 — Global UI / Navigation 통합 (2026-11-04)

- 사용자 첨부 명세를 읽고 기존 AGENTS/REF-85~87/Git index를 확인했다. Shell은 조회 경로에서만 Surface/폰트를 전달하고 목록·헤더·사이드바에는 별도 작은 글자/회청색 값이 남아 있었다. 설정은05 UID만 Wall Context를 받았으며 별도 native 작업 행이 헤더 아래에 중복되어 있었다.
- 신규 `applicationTokens.ts`, `WallNavigation.tsx`/test, `application.css`를 추가했다. WallChrome에서 Navigation을 실제 분리하고 글로벌 작업 액션을 같은 헤더 안으로 이동했다. Base UI1.0.0 Tooltip/기존 local Collapsible·Button과 native Link/Search/user Menu/테마·권한별 system link를 재사용한다. 원래 star source/API/목적지·URL 동작은 유지한다. 축소 선호는 localStorage wall:sidebar:collapsed뿐이며 대시보드 저장과 분리했다.900px 이하 Rail/축소 즐겨찾기 진입점을 제공한다.
- `surfaceTokens.ts`의 공통 Application 변수 및 editor/settings application 옵션, `typography.ts`의 navigation 역할, `modern.css`의 공통 자체 폰트, Popover/Dropdown/Dialog 및 WallPanelStudio native Portal을 같은 neutral Light/Dark에 연결했다. 기존 wallSurfaceTokens 차트 색과 시계열/Gauge renderer·48열 엔진/배치는 수정하지 않았다. settings sheet의 반복 Card 테두리·Shadow와 native control 외형만 공통 CSS로 정리했다. native Select36px/8px/Light border rgb(223,225,229)를 실측했다.
- `DashboardSceneRenderer.tsx`의 설정 Context를 모든 일반 대시보드로 확대하고 `GeneralSettingsEditView`는 그 Context를 사용한다. 스냅샷/NotFound는 기존 경로다. 기존 General 설정 모델·GenAI/폴더/시간/편집 정책/삭제 확인, 변수/주석/링크/버전/권한/JSON 및 저장은 재사용한다. 사용자 승인된 전역 설정 외형 확대이며 다른 UID에05 의미별 Workspace를 이식하지 않았다.
- 실제 Chrome: 목록 전체19개, 검색 Enter→URL query→스토리지센터1개 결과, 사이드바236↔64px와 화면 이동 뒤 축소 선호 유지, 기존 링크·즐겨찾기/사용자 Menu/ESC를 확인했다. 목록의 키보드 Focus에서 실제 Tooltip '호스트'와 위치/opacity1을 관찰했다. 별도의 종합 탭에서는 programmatic focus 뒤 Tooltip을 재현하지 못했으므로 모든 입력 방식의 Tooltip 검증 완료로 표현하지 않는다. 입력 링크 aria-label과 native Base UI trigger는 유지한다.
  -05 개요25개 표시 항목(21개 데이터+4개 Text)의 Sidebar 접기·펼치기 왕복 후 actual DOM x/y/w/h 최대 차이0px/Dirty0을 확인했다.768×900 실제 viewport에서 종합 Shell753px/scrollWidth753px(스크롤바 제외)/Sidebar64px/Toggle none으로 가로 넘침이 없었다. viewport override는 원복했다. native 반응형 패널은 기존 방식대로 세로 배치됐으며 저장 모델은 바꾸지 않았다.
- Light/Dark 목록·종합·05·설정·편집기를 직접 확인했다. 최종 editor/settings Dark bg rgb(23,25,30), text#f2f3f5/border#414650과 Light bg rgb(247,247,248)를 확인했다. native 공유/편집 버튼은36px/8px, 종합 중복 wall-native-toolbar는0개다. 기존 저장 Dashboard links/Home/Netdive/시간 컨트롤은 기능 보존을 위해 그대로 두고 공통 컨트롤 외형만 맞췄다.
- 테스트4 suites14 + 설정3 suites17 =7 suites31 passed(`/tmp/wall-shell88-tests-final.log`, `/tmp/wall-shell88-settings-tests.log`). 신규 Navigation의 즐겨찾기 folding/해제·UID 링크·분류/권한 목적지와 기존 목록·편집 buffer/저장 actions·General native 모델/변수 collection을 검증했다. 초기 테스트의 PNG loader/Router future warning은 해당 asset mock과 기존 future flags로 해결했으며 console 실패를 숨기지 않았다. 최종 ESLint/Prettier/diff check 통과. 최종 release2 webpack28.706초/기존 size경고2개.
- 캡처는 `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-shell-ref88/`의 library-light.png, library-dark-menu.png, overview-light.png, overview-dark.png, overview-narrow.png, detail05-light.png/detail05-dark.png, editor-light.png/editor-dark.png, settings-light.png/settings-dark.png다. library-narrow.png는 viewport가 다른 탭에 적용되기 전 캡처이므로 좁은 화면 증거로 사용하지 않는다. 최신 종합 탭은 Light/font ready로 전달하며 own 중간 QA 탭은 닫았다. 기존 사용자 미저장 탭은 강제 갱신하지 않았다.
- 최종 원본19 dashboard JSON 전체 동일(`/tmp/wall-shell88-preservation.json`), preview/fixture launchd running/3317 health200/3318 fixture200. 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe와 기존 미커밋 작업을 보존했다. 원본 checkout에는 build 자산만 반영했다. 운영 배포/DB/Backend/인증·포트 변경/staging/commit/merge/push 없음. Clock 플러그인 미설치·SQL 연결 오류·SCVM 빈 값과 기존 진입 직후 native dirty 안내는 별도 현상으로 남겼으며 가짜 데이터나 임의 저장으로 감추지 않았다.

## REF-90 / REF-91 / REF-92 — 진행 중 후속 통합 (2026-11-04)

- 사용자 요청으로 일반 UID에도 WallEditing/History/Clipboard provider와48열 PanelLayoutGrid를 연결했다. 원래 Row를 동적 탭으로 투영하고05 ID 기반 의미별 패널은 복사하지 않는다. native query/패널/반복 렌더러·공통 WallDashboardPanel의 상태/헤더를 재사용한다. 서버 wallModern/원본 wire 보존·취소 baseline·metadata 삭제·이탈 보호의05 조건을 함께 확대했다. 새로운 드래그 엔진은 없다.
- 임시 wall-grid90-qa를 로컬에 생성해 실제 이동→native 저장 Drawer→저장→새로고침 좌표{x440,y606,w120,h120} 동일/Dirty0, Resize→취소 Dirty1→0을 확인했다. 저장version2,문서키:row:0:tab:overview를 API에서 확인하고 임시 Dashboard는 삭제200으로 정리했다. 기존19개 문서는 저장하지 않았다. 관련4 suites97개 중96개 통과 후, 기존05만 metadata를 정리한다고 가정한 테스트를 새 정책으로 변경해 해당6개도 통과했다. generic root 복사/새ID 생성 테스트를 추가했다.
- 듀얼 레일 명세를 추가 수신해 실제 Primary/Secondary DOM, 기존 폴더 Menu 선택기, 실제 Dashboard Collapsible 목록을 구현 중이다. 기본 폴더/조직 외 별도 workspace 모델을 만들지 않는다. 신규 메뉴 데이터/가짜 KPI 없음. Navigation/Library/Clipboard19개 중17개+Navigation수정 후2개 통과.
- 사용자 최신 Dot 요청에 따라 REF-84 bracket 모양을 circle pattern으로 교체했다. 공통 반경/색·고정 Grid pitch를 사용하고 포인터·저장좌표·Snap·preview/drop 계산은 수정하지 않았다. 실제 조작 중 배경 레이어에서만 표시하며 카드/차트 위 overlay는 유지하지 않는다. 최종 빌드·브라우저 검증 결과는 다음 기록에 추가한다.
- 최종 확인: 공통 WallDashboardPanel provider를 일반 Grid에 재사용해 Error/Loading/NoData를 유지했고, nested PanelActionsProvider가 기존 Grid Grip을 상속하도록 연결했다. 종합23개 패널/23개 이동 핸들·기존 Clock/SQL 오류 표시를 확인했다. 일반 Grid의 초기 투영은 native 셀30+간격8을 모두 포함하도록 수정해 초기 높이 축소를 방지했다. 반복 패널은 DashboardGridItem의 기존 renderer를 유지한다.
- 실제 Dot 조작 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-shell-ref88/dot92-drag.png`. pattern에 circle1/path0,48열 pitch28.8958px·세로12px/radius1.35px/fill rgb(131,148,172)를 확인했다. 실제 이동 중 빈 공간에 점이 보이며 종료 Grid0/취소 Dirty0이다. 원래 종합에 시험 이동만 수행하고 취소했으며 저장하지 않았다.
- 듀얼 레일 실제 폴더 Menu의 모든 폴더/admin/Alert Rule/Report/viewer, 등록Dashboard19개를 확인했다. Primary64px 유지/Secondary224→0,05의 기존5탭/Dirty0, Kiosk Secondary visibility hidden/Grip0을 확인했다.768px에서 Shell scrollWidth768/Primary64/Secondary fixed와 접기0px을 확인하고 viewport를 원복했다. 설정·편집기 모두 Rail2개, 편집기 변경 사항 없음을 확인했다. Light/Dark와 메뉴/ESC도 검증했다. 최신 Light 종합 검증 탭을 전달하며 사용자 기존 미저장 탭은 갱신하지 않았다.
- 최신 캡처: 같은 폴더 dual91-final-light.png/dual91-overview-dark.png/dual91-detail05-light.png/dual91-settings.png/dual91-editor.png. 첨부 최종 이미지 파일은 이 요청에 포함되지 않아 텍스트 명세를 기준으로 구현했으며 특정 이미지와 픽셀 일치를 주장하지 않는다.
- 최종 관련6 suites107 tests + 범위/Workspace2 suites24 tests =8 suites131 passed(`/tmp/wall-final92-regression.log`, `/tmp/wall-final92-scope-tests.log`). 구형 UID 전용 가정의 테스트를 새로운 명시적 전체 범위로 변경했고 explicit legacy route는 유지했다. 최종 webpack34.473초/기존 size경고2개, ESLint/diff check 통과. 기존19개 dashboard JSON 전체 동일·임시 QA404 재확인,3317 health200/3318 fixture200. index0423fc0071bb143a81f8064df2bec6e8f3a43afe 및 사용자 미커밋 작업 보존. 운영 DB/배포/버전/포트/인증 변경이나 commit/merge/push 없음.

## REF-93 — 듀얼 레일 역할 분리 (2026-11-04)

- 요청에 따라 기존9개 기능·분류를 Primary 아이콘으로 이동하고 Secondary를 선택 범위의 텍스트 대시보드 목록으로 재구성했다. 클라우드 로고는 Primary에1개만 유지한다. Secondary에는 ABLESTACK/Wall Monitoring·실제 폴더 Menu·로컬 검색·한 목록/개수/빈 상태만 표시한다. 기존 중복 분류 목록과 Secondary 하단 시스템 링크를 제거했으며 실제 설정/도움말은 Primary 하단에 둔다. 설정/경보 관리 링크는 기존 navIndex 권한 필터를 따른다.
- 수정 파일: `WallNavigation.tsx`, `WallChrome.tsx`의 props 연결, `application.css`, `applicationTokens.ts`; 신규 `navigationModel.ts`/테스트와 Navigation 테스트. 기존 토큰·local shadcn 방식 Button/Collapsible·실제 Base UI1.0.0 Tooltip/Menu/Input을 사용한다. 이번 변경에 기존 미커밋 WallChrome 전체 diff/편집기/차트/Grid 작업을 포함했다고 주장하지 않는다.
- URL 기반 범위: 대시보드 직접 진입은 실제 categoryOf, 다른 Primary 탐색은 native locationService.partial의 wallNav를 사용한다. 본문 UID/변수/시간/패널 편집 상태를 유지하며 같은 아이콘 재클릭은 URL을 변경하지 않는다. 목록 화면은 기존 category/starred/folder URL을 사용한다. 실제 대시보드 Link에 scope를 전달해 refresh/back/forward로 복원한다. 별도 전역 클릭 상태/가짜 workspace/새 저장 모델 없음.
- 실제 Chrome: 종합 직접 진입→종합 활성,05→VM 활성; 호스트 Primary 선택 시 종합 본문 유지/호스트5개, 같은 아이콘 URL 동일, 뒤로/앞으로/reload scope 복원.02 호스트 실제 링크 이동 후 Primary/Secondary 현재 항목 일치. 분류별 VM5/예측2/로그1/경보2/보고서2/종합2/호스트5, all19개와 즐겨찾기0 빈 안내를 확인했다. all 로컬 검색 ‘스토리지’1개/본문 유지. 기존 admin/Alert Rule/Report/viewer 폴더 Menu와 admin14→호스트3→모든 폴더 호스트5를 확인했다.
- 표시·동작: Light/Dark 실제 화면, 키보드 Tab으로 VM Tooltip 표시, 목록 펼침/접힘,1280×480에서 Primary 중간영역 scrollHeight380/client358과 하단 도움말 유지,768×600에서 Secondary fixed224px/접기0/아이콘으로 재열기/본문 scrollWidth768을 확인했다. viewport는1730×929 원복. Sidebar 왕복 후05의25개 표시 항목의 실제 x/y/w/h가 모두 동일하고 Dirty0, kiosk railWidth288 유지/visibility hidden/Grip0→ESC 복귀 및25개 rect 동일이다. 대시보드 설정 일반·변수·복귀, 패널 메뉴→기존 편집기 진입에서도 VM 범위·선택 항목이 유지됐다. 데이터·설정은 수정/저장하지 않았다.
- 권한 제약: 실제 preview는 익명 Viewer이며 native navIndex의 전역 관리 목적지는 숨김이다. 관리 권한을 만들거나 로그인/사용자 설정을 바꾸지 않았다. 등록된 즐겨찾기 데이터의 반영/해제·권한 있는 설정/경보 관리 목적지는 단위 테스트로 확인했으며 실제 star API 쓰기 검증과 구분한다. 기존 Clock 플러그인 누락·SQL 연결 오류·SCVM 빈 값은 그대로 표시한다.
- 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-navigation-ref93/`의 light-vms.png, dark-vms.png, short-height-dark.png, narrow-dark.png. narrow 최종 캡처는 접기 애니메이션 종료 후224px 폭에서 다시 저장했다. 기존 사용자 미저장 탭은 강제 갱신하지 않았다. 최종 빌드/서비스/테스트 결과는 아래에 추가한다.
- 최종 결과: 관련 Navigation/URL model/Library3 suites11 passed(`/tmp/wall-nav93-tests-final.log`), 관련 ESLint/Prettier/diff check 통과. production webpack28.307초/기존 bundle size경고2개(`/tmp/wall-nav93-build-final.log`). build 자산만 원본 checkout에 복사하고 기존 preview launchd만 kickstart했다. preview/fixture running,3317 health/종합 및3318 health 모두200. 원본19 JSON 전체 동일(`/tmp/wall-nav93-preservation.json`). 사용자 index0423fc0071bb143a81f8064df2bec6e8f3a43afe와 기존 미커밋 작업을 보존했으며 staging/commit/merge/push/운영 배포 없음. 새 own 최신05 Light 검증 탭은 font ready/로고1/Primary9개·VM1개 활성/Secondary224px/25개 표시 항목/Dirty0으로 전달한다. 기존 사용자 탭은 갱신하지 않았으므로 최신 스타일 반영을 주장하지 않는다.

## REF-94 — 반복되는 Resize 높이 / Dot 정렬 문제 (2026-11-04)

- 종합의 Cube75를 실제 마우스로 확대 후 원래 위치까지 줄였다. 기존 다른 카드144px와 달리148px가 된 것을 재현했다. 원인은 native38px 배치를2px 단위로 투영한 h76과 Resize의12px(논리6행) 절대 stop 불일치다. source를 한 번 벗어나면 원래 h76에 복귀할 수 없고 h78로 반올림됐다. 두 번째 원인은 Dot이 gutter 포함 outer 셀 끝을 표시해 gap8/12px 안쪽의 실제 카드 끝과 일치하지 않는 것이다. 단순 CSS 문제가 아니다.
- 변경: `panelGeometry.ts`의 공통 row anchors/stops·실제 모서리 point, `layoutMovement.ts`의 경계 포함 snap/실제 반올림 border 비교, `PanelLayoutGrid.tsx`의 제스처 고정 경계 공유, `LayoutGridGuide.tsx`의 동일 stop SVG circle/use. 원래 배치와 saved/native 초기 경계를 보존하고 가까운 정규12px stop은 기존 경계로 대체해 이중 점을 줄인다. 안내는 조작 중 움직이는 실제 모서리를 나타내며 고정 모서리는 국소 기준점만 둔다. 별도 CSS offset/새 DnD·SVG 라이브러리/UID 예외 없음.48열·2px 저장·포인터 capture·커서·권한/키오스크·native collision·REF-62 마지막 preview/저장 모델은 유지한다.
- 테스트: 신규 `resizeStops.test.ts`와 기존 `layoutMovement.test.ts`/`PanelResizeGrid.test.tsx`를 실제 stop/모서리 기준으로 갱신했다. 오래된 bracket geometry 전용 helper는 제거했다. 핵심4 suites29 passed(`/tmp/wall-resize94-tests2.log`): native144px 복귀/제스처 간 이웃 높이 재정렬/Move·Resize 같은 row set/min·max·고정 모서리/8·12px gutter·여러 열의 정확한 point/단계별 열 방문·포인터 중단·저장/복원이다. 관련 ESLint 통과. production webpack28.963초/기존 size경고2개(`/tmp/wall-resize94-build.log`), build 자산만 원본 checkout에 복사하고 기존 preview 서비스만 kickstart했다.
- 추가 검사: wallDocument6 passed, 기존 KPI/History14 passed/7 failed(`/tmp/wall-resize94-history.log`). 후자의7건은 HEAD PanelLayoutGrid를 임시 파일로 읽어 같은 환경에 매핑했을 때도 동일 실패했다(`/tmp/wall-resize94-head-tests2.log`). rAF flush 전 즉시 state/픽셀 연속 이동/array order를 기대하는 구형 검증이며 제품 구현을 시험 통과 목적으로 되돌리지 않았다. 첫 HEAD 비교의 /tmp node module resolution 오류는 modulePaths 지정으로 해결했다. 전체 회귀 테스트가 통과했다고 보고하지 않는다.
- 실제 종합: 확대 후 두 번째 Resize에서144px 복귀/이웃 Mold144px·카드 bottom390px 동일. Resize 중5회 샘플에서 Dot↔preview 우하단 x/y 오차 모두0px. 최종 preview {x543,y246,w165,h172}와 drop actual 동일. 가로만 우측 끝까지 확장 시 {x543,y246,w1148,h144}로 위치·높이를 유지하고 preview/drop 동일했다. 모든 원본 조작은 취소해 Dirty0/안내0으로 원복했다.
- 실제05: 개요 KPI28의96→120→96px, Dot 오차0px4회와 preview/drop 동일을 확인했다. 네트워크224의 Dark112→144px, Dot 오차0px/공통 Dark색rgb(130,152,181), Undo112/Redo144px·취소Dirty0/guide none을 확인했다. native 전체 취소 후 활성 탭은 baseline 개요로 돌아가므로 이를 유지됐다고 표현하지 않는다. SCVM 빈 값/기존 플러그인·SQL 오류는 수정하거나 가짜 수치로 가리지 않았다.
- 영구 저장: 원본을 복사한 로컬 임시 `wall-resize94-qa`에서 Cube75를184px로 변경하고 native 저장 Drawer/버전2 저장→새로고침 후 {x543,y246,w108,h184} 동일/Dirty0. 서버 wallModern의 {x8,y0,w4,h96}와 기존 panel gridPos/targets/datasource/fieldConfig/options/transforms/type/ID 모두 원본 동일을 API로 확인했다. 임시 삭제200/재조회404, 원본19 JSON 전체 동일(`/tmp/wall-resize94-preservation.json`). 운영 DB는 접근하지 않았다.
- 캡처: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-resize-ref94/overview-resize.png`, `network-dark-resize.png`. 기존 사용자 미저장 탭은 갱신하지 않았고 own QA 탭만 사용했다. 최종 깨끗한 종합 화면과 서비스 상태는 아래에 추가한다.
- 최종 전달: `overview-aligned.png`는 종합의 원본100/71/75/77/99/96 카드가 모두144px인 상태다. 제목의 기존 Cube→02 링크와 브라우저 뒤로가기도 유지됐다. own 최신 종합 탭은 Light/Dirty0/interacting false/footprint0으로 열어 두었다. preview/fixture launchd running/3317·3318 health200, 관련 Prettier/ESLint·diff check 통과. 사용자 index0423fc0071bb143a81f8064df2bec6e8f3a43afe와 기존 미커밋 작업 보존. 원본 설정·데이터/운영 배포/백엔드/버전/포트 변경 및 staging/commit/merge/push 없음. 기존 사용자 탭을 새로고침해 반영했다고 주장하지 않는다.

## REF-95 — Dynatrace Motion 기술 벤치마킹 / 공통 적용 (2026-11-04)

- AGENTS/최신 디자인 기준·기존 미커밋 상태를 확인했다. 공식 Strato Animations/Accordion 및 Base UI Animation 문서를 읽고, Chrome에서 공식 stable Accordion/Menu/Tabs 실행 데모와 사용자 Playground AppShell을 직접 조작했다. 자세한 출처·실측·추정 제외 사항은 docs/WALL_MOTION_BENCHMARK.md에 분리했다. 공개 데모 Accordion은 프레임별 inline height/종료 후 region 제거, Chevron CSS250ms·material easing, Hover150ms를 확인했다. Desktop Menu/Tabs 예제에는 유효한 CSS transition이 없었다. Playground Dock200↔48px와 중간 폭/Apps sheet를 관찰했으나 engine/easing은 미확인이다. Dashboard 앱 iframe 본문은 접근되지 않았다. 공식 토큰을 실제 동작으로 잘못 표현하지 않는다.
- 변경 파일: motion.css, application.css, WallNavigation.tsx/테스트, WallChrome.tsx의 collapsed 전달, workspace/WallPanelActions.tsx, 디자인 기준/이 문서와 신규 벤치마킹 기록. 설치된 Base UI1.0.0·local shadcn 방식 컴포넌트와 기존 Tailwind 체계를 유지한다. 새 패키지/JS 애니메이션 엔진/폰트/색/시각화/레이아웃 모델은 추가하지 않았다.
- Accordion 높이와 Chevron을250ms·(0.4,0,0.2,1)로 동기화하고 Hover150ms, popup enter170/exit150ms·방향별3px·닫힘 pointer none을 공통화했다. Panel Command Menu의 path는 닫힘 시작이 아닌 완료 콜백에 초기화한다. 실제 종료 중 Inspector 메뉴가 유지되고 즉시 재열기에도 유지됐으며, 종료 완료 후 재열면 보기/편집/복제 root로 복귀했다. native 액션/권한/키보드/삭제 확인은 재사용한다.
- Rail은 width250ms만 전환하고 내부 폭을 고정한다. contents150ms/열림 delay50ms, visibility는 종료 뒤, inert/aria-hidden은 시작부터 적용한다. 기존 단일 Sidebar의 즉시 display:none/중복 폭 전환 규칙과 컨텍스트 key remount/반복 fade를 제거했다. 실제 닫힘 중 width222.516→217.938→204.391→121.531→…→6.375px, visibility visible·브랜드 폭88.016px 고정·opacity0.723→0·inert true를 확인했다.
- 실제 Wall Time series140:0→4.375→20.922→54.625→…→391.781px의 중간 높이와 아래 섹션의 동일한 이동을 확인했다.6회 빠른 키 반전/선 두께1→2 후4회 반전에도2 유지·native 취소 후1 복원/변경 사항 없음이다. 스크롤한 Inspector에서 scrollTop509/header top550을 유지하면서892→647px로 접혔다. 화면 밖 제목으로 focus를 이동할 때의 native scroll-into-view는 보존했다. Dark의 쿼리 옵션250ms, 위로 flip된 메뉴의+3px/아래 Popover−3px·170/150ms, 종료 중 Inspector 텍스트/포인터 none도 확인했다. 일반 종합 UID의 Gauge19 편집기에서도 동일250ms가 적용됐다.
- Grid 보호:7개 핵심 Grid/Geometry/Pointer 파일 SHA, Grid/layout/settle 토큰 및 Grid CSS block이 작업 전후 동일하다. 편집 취소 직후 첫 배치 비교는 일부 좌표가 달랐으며 원인은 확정하지 않았다. 안정된 상태에서 재기준 후 실제 클릭으로 Rail 왕복한25개 DOM rect는 차이0/Dirty0이었다. 첫 차이를 고쳤다고 보고하지 않는다. 원본19 Dashboard JSON 전체 동일(/tmp/wall-motion95-preservation.json).768px viewport 시도는 대상 탭에 적용되지 않고 실제1730px인 것을 확인해 좁은 화면 검증으로 집계하지 않았으며 override를 원복했다. 이때 축소된 연구용 Dynatrace Dock도 최종200px로 복원했다.
- 검증: Collapsible/Navigation/Inspector/PanelActions4 suites18 passed(/tmp/wall-motion95-tests.log), 관련 ESLint 통과. build32.478초/기존 bundle size경고2개(/tmp/wall-motion95-build.log). 기존 launchd preview만 kickstart하고 원본 checkout에는 build 자산만 반영했다. 코드 테스트를 실제 애니메이션 타이밍/전체 제품 체감90점의 근거로 삼지 않는다. OS reduced-motion 설정은 변경하지 않고 공통/portal CSS 분기를 확인했다.
- 산출물: /Users/hongwookryu/.codex/visualizations/2026/11/04/wall-motion-ref95/measurements.json, editor-light-final.png, editor-dark.png, dark-menu.png, gauge-editor-light.png 및 accordion-motion.gif. GIF는 실제16장/417ms 캡처를13프레임으로 인코딩하고 마지막600ms 보기 정지를 추가했다. FPS/CPU 프로파일이 아니며 화면을 합성하거나 UI를 수정한 영상이 아니다. Pillow가 없어 기존 설치 ffmpeg를 사용했고 제품 의존성은 추가하지 않았다.
- 최신 own 편집기 탭은05/140 Light/차트 스타일250ms/Sidebar224px/선 두께1/변경 사항 없음으로 전달한다. 기존 사용자 미저장 탭은 갱신하지 않았으며 연구 탭은 전달하지 않는다. 운영 DB/배포/백엔드/버전/프로토콜·포트 변경 및 stage/commit/merge/push 없음. 최종 서비스·보존 검사 결과는 아래에 추가한다.

- 최종 확인: 관련 Prettier/ESLint/diff check 통과, preview/fixture running·3317/3318 health200·종합 HTTP200. 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 그대로이며 기존 미커밋 작업을 보존했다. 최종 Light140 화면에서 선 두께1/변경 사항 없음/Sidebar224px/높이 전환250ms를 재확인했고 Playground Dock도200px로 복원했다. 초기 편집 취소 직후의 좌표 차이는 원인 미확정으로 별도 기록했으며 해결됐다고 보고하지 않는다.

## 2026-11-04 — REF-96 앱 전체 모달·Drawer 통일

- 사용자 최신 요청에 따라 모든 공통 모달 경로를 대상으로 진행했다. AppWrapper에 WallModalProvider를 추가해 native Modal/ConfirmModal/Drawer와 로컬 Base UI Dialog에 같은 Surface·Inter/Pretendard·헤더/닫기·버튼·footer·viewport·Motion을 적용한다. 새로운 라이브러리/모달 엔진 없이 React Aria FocusScope/useDialog/useOverlay와 rc-drawer7.2.0을 재사용하고 닫기는 실제 Base UI Button1.0.0, gallery는 기존 Base UI Dialog1.0.0이다. UI primitive 변경과 native 표시 CSS를 DESIGN_SYSTEM REF-96 표에 구분했다.
- 수정 파일: AppWrapper.tsx, grafana-ui Modal.tsx/신규 ModalPresentationContext.ts/ConfirmContent.tsx/Button.tsx/Drawer.tsx, Wall local components/ui/dialog.tsx, editor/panelEditor.css, 신규 modals/{WallModalProvider.tsx,WallModalProvider.test.tsx,modalTokens.ts,modals.css}, DESIGN_SYSTEM.md/AGENTS.md/이 기록. 기존 사용자 변경에 이번 변경분을 추가했으며 index/다른 미커밋 작업은 보존했다.
- 실제 Chrome:05·종합의 공유/내보내기 탭, 긴 JSON과 footer, 삭제 확인(취소), ESC/Backdrop/닫기와 공유 버튼으로 focus 복귀, 시각화 선택 gallery의30px 닫기와980×700 크기, 프로그램 방식 gallery 종료 시 BODY로 빠지던 focus를 Base UI finalFocus 호출 버튼 ref로 복귀시키는 수정과 조건부 unmount 회귀 검사, Light/Dark computed Surface/배경·폰트·radio/버튼을 확인했다.768×600 공유 모달은720×462/viewport 내부/가로 overflow0이다. 종합에서 임시 Mold 상태 복제→저장 Drawer 진입→취소→변경 취소를 수행하여 복제1개/Dirty0으로 원복했고 서버 저장·실제 삭제는 수행하지 않았다. Drawer의 실제 top0/bottom=viewport873/가운데 margin0을 재확인했다. 중앙 모달 geometry와 Drawer를 분리했다.
- 검증: 공통3 suites17 tests 통과(`/tmp/wall-modal96-tests.log`). native 값 매핑 회귀는 일반 실행에서 기존 jsdom/nwsapi :has selector 오류3건이 발생했으며, 기존 `/tmp/wall-jest-selector-compat.cjs`로 장식 selector만 제외한 별도 실행에서5 tests 통과(`/tmp/wall-modal96-mapping-compat.log`)했다. 제품 CSS·Jest 설정·의존성을 그 오류 때문에 변경하지 않았다. ESLint/Prettier/diff check 통과. production webpack은 기존 asset size경고2개 이외 성공했고 원본 checkout에는 public/build 자산만 전달했다.
- 보존: read-only API 비교에서 기존19개 dashboard JSON 전체 동일(`/tmp/wall-modal96-preservation.json`), Grid/Drag·Resize/쿼리·저장 API·Backend·인증·포트·운영 배포 변경 없음. native Modal 즉시 unmount/dismiss는 유지하므로 모든 exit animation을 보장한다고 보고하지 않는다. 외부 플러그인의 독립 iframe·브라우저 자체 이탈 확인은 공통 앱 모달과 구분하며 모든 개별 폼을 전수 클릭한 검증은 아니다. 사용자 기존 미저장 탭은 강제 갱신하지 않았다. 추가 commit/staging/merge/push 없음.
- 실제 이미지: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-modals-ref96/`. 후속 작업은 이 공통 프레임을 기준으로 유지하고, 개별 플러그인 폼의 추가 재설계는 기능 확인 후 별도로 진행한다.
- 최종 반영 확인: webpack31.352초/기존 경고2개, 마지막 gallery 닫기 후 실제 포커스가 ‘시각화 변경’ 버튼으로 복귀했다. `export-light-final.png`를 기록하고 최신05 내보내기 모달 검증 탭을 전달한다. launchd preview/fixture 실행 중,3317 health·dashboard/3318 fixture HTTP200, 기존19 JSON 동일/index0423fc0071bb143a81f8064df2bec6e8f3a43afe 보존을 재확인했다.

## 2026-11-04 — REF-97 공통 시계열 시스템 재설계

- 첨부 명세에 따라 전체 Wall Time series의 공통 표시 계층을 개선했다. 작업 전 원본 관련 파일은 `/tmp/wall-chart97-before/`에 보존했다. 원본19개/시계열288개 모두 linear였으며 원본 query_range 응답 자체가 완만했다. 별도 moving average/강제 spline은 없었다. native prepareGraphableFields→GraphNG outerjoin/preparePlotData2→uPlot path를 유지한다. 높은 밀도의 native path는 pixel column의 min/max를 보존하며 새 downsampling/engine을 도입하지 않았다.
- 실제 결함 수정: saved custom.lineWidth=1/showPoints=Auto/fill/gradient 등을 값이 default와 같다는 이유로 덮던 adapter를 수정했다. config.defaults.custom의 명시값과 matched Override를 보호한다. raw vectors/units/thresholds/axes/null/gap/Transform/queries는 그대로다. 기존05 전용 palette/두께2.2 투영을 제거해 다른 대시보드/preview와 동일한 contract를 사용한다. 기존 global 색/Surface/Motion은 보존한다.
- 파일: 신규 charts/{metricProfiles.ts,WallMetricTypeEditor.tsx,WallTimeSeriesTooltip.tsx,WallSeriesLegendItem.tsx,timeSeries.css,metricProfiles.test.tsx}; 수정 chartTokens.ts/timeSeriesPresentation.ts 및 test, workspace/overviewPresentation.tsx, editor/WallInspector.tsx 및 test/optionText.ts, timeseries/{module.tsx,TimeSeriesPanel.tsx,TimeSeriesTooltip.tsx}, grafana-ui/{VizLegend/VizLegend.tsx,VizPresentation/TimeSeriesPresentation.ts}, DESIGN_SYSTEM.md/AGENTS.md/이 기록. native renderer와 native callbacks를 감싼 실제 tooltip/legend 구조를 구현했고 Base UI Select/Button1.0.0과 local shadcn 방식 Button을 사용한다. scoped CSS와 primitive 변경을 REF-97 표에 구분했다.
- 지표 유형7개는 하나의 renderer/palette에서 선/채움/hover-point 권장값만 투영한다. saved property 우선이며 단위 변경이나 CPU=percent 추론 없음. missing option은 auto UI fallback만 제공하며 화면 열기만으로 저장값/dirty를 생성하지 않는다. native custom panel option 선택 시 wallMetricType만 변경한다. editor는6개 그룹으로 통합했다.
- native Grafana d-solo와 Wall을 같은 query/time/range/416×200 Canvas에서 비교했다. raw fixture cube01=26.17/cube02=27.579/cube03=29.375(index120)의 native formatter 표시26.2/27.6/29.4%와12:10:00이 일치했다.2001 dense point/99 spike/-20 dip/0.01 미세변화/null gap path 명령이 native/Wall에서 동일하며 곡선 명령을 만들지 않는 검사도 추가했다. fixture 생성 소스 파일은 현재 런타임 경로에서 사라져 있어서 생성 공식을 분석했다고 보고하지 않는다. 실행 중인3318은 정상 응답하므로 재시작하지 않았다. 실제 SCVM/운영 데이터 검증과 구분한다.
- 테스트: 관련3 suites37 tests(`/tmp/wall-chart97-tests.log`), native3 suites29 tests/12 snapshots(`/tmp/wall-chart97-native-tests.log`), 마지막 legend focus 변경 후4 tests 재통과(`/tmp/wall-chart97-final-tests.log`). ESLint 통과. 신규9개 파일 targeted TS 검사에서 TimeSeriesPanel native TooltipPlugin2/AnnotationsPlugin2 ReactPortal2건은 pre-task source override 검사에서도 동일 재현(`/tmp/wall-chart97-types-baseline.log`)됐다. 새 타입 오류0이며 전체 TS clean으로 표현하지 않는다.
- 실제 브라우저: 종합 List/Table 통계 범례, native isolate/재표시, 작은 panel 24px급 row,05 CPU/메모리/네트워크/디스크 Dark tooltip와 crosshair, 구간 Zoom(11:40–12:40→11:49:46–12:27:41)·dirty0, 호스트 TOP5 공통 범례를 확인했다. 클릭 시 native hidden scrollbar parent가15px scroll되며 header를 가리던 부분은 Button focus({preventScroll:true})로 처리했다. 저장된 과한 fill/명시 색은 디자인을 위해 임의 축소하지 않는다.
- 임시 local UID wall-chart97-validation/id88에 native UI로 latency profile 저장/version2→reload→다른 profile변경취소→원래latency복귀를 확인했다. API 비교로 원본ID/queries/datasource/fields/transforms/grid/other options 모두 동일(`/tmp/wall-chart97-save-validation.json`). QA 복사본은 삭제/404확인했고 원본19개는 저장하지 않았다. 작업 전 index0423fc0071bb143a81f8064df2bec6e8f3a43afe 및 기존 미커밋을 유지하며 stage/commit/push 없음.
- 제한: standalone d-solo provider 없는 native embed는 기존 fallback 유지, 모든288개 패널을 개별 클릭한 전수검증은 아니다. latency 실운영 데이터는 접근되지 않아 단위/피크 fixture로 검증했다. frontend 스타일로 query interval/maxdatapoints/집계의 원본 의미를 바꾸지 않는다. 결과 이미지 `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-timeseries-ref97/`. 최종배포/보존 검사 및 최종실측은 아래에 추가한다.

- 최종 반영: webpack29.831초/기존 bundle size경고2개. public/build만 원본 checkout에 전달하고 기존 launchd preview만 kickstart했다.3317 health/dashboard와3318은HTTP200, 원본19 JSON 차이0/임시QA404(`/tmp/wall-chart97-preservation.json`), index0423fc0071bb143a81f8064df2bec6e8f3a43afe 동일이다. 관련 Prettier/ESLint/git diff --check 통과.
- 최종 Chrome1730×873/DPR1: compact tooltip398×194가 viewport 안에 있고 Inter/Pretendard 적용, 정확한12:10:00과29.4/27.6/26.2% 표시. 종합의 통계행24~24.5px·실제 마우스 범례 isolate/복원 후 hidden outer scrollTop0/header 전체 노출을 확인했다. Playwright locator click의 자동 scroll-into-view는 hidden wrapper를15px 이동시킬 수 있어 실제 좌표 마우스 입력과 구분했다. 이를 사용자 입력에서 재현한 제품 버그로 단정하지 않는다. 최종05 Light/dirty0를 전달했고 기존 사용자 미저장 탭은 보존했다. `tooltip-light-final.png`, `tooltip-dark.png`, `overview-legend-light-final.png`, `host-dark.png`, `native-grafana-matched-416x200.png`에 실제 화면을 기록했다. 화면의 clock plugin/DB query 오류와 빈 SCVM은 기존 테스트 환경 제약이며 이번 시계열 변경으로 해결했다고 표현하지 않는다.

## 2026-11-04 — REF-97 파형 문제 후속 정정

- 사용자 이미지 재확인 후 질문에 사용자가 ‘사인파처럼 매끈한 파형’이 문제라고 답했다. 이전 보고는 데이터 보존/공통 UI 구현을 확인한 것이며 실제 파형 문제를 해결했다는 의미로 완료 보고한 것은 부정확했다.
- read-only API로 종합 panel83의 datasource/targets/fieldConfig를 확인했다. Wall datasource URL3318, lineInterpolation=linear/Transform 없음. 실제 A/B PromQL을 native `/api/ds/query`에15초 interval/고정1h로 요청했고 native DataFrame부터 A24→24.206→24.410→24.612…, B30→30.257→30.513→30.766…를 반환했다(`/tmp/wall-chart98-panel83-response.json`). 운영 Prometheus 연결은 현재 목록에 없다. fixture 원본 코드가 현재 경로에 없으므로 생성 공식 자체를 확인했다는 주장은 하지 않는다.
- 해결 상태: 파형 자체 미해결/실제 운영 시계열 비교 대기. source rendering·fixture·원본 쿼리·단위·데이터 소스·Dashboard JSON을 임의 변경하지 않았고 새 테스트/빌드/서비스 재시작도 불필요하여 수행하지 않았다. 사용 가능한 실제 Prometheus 주소를 사용자에게 요청했다. DESIGN_SYSTEM REF-97에 후속 정정을 남겨 같은 완료 오판을 반복하지 않도록 했다.

### 실제 CCVM 수집 경로 확인 — 앞선 ‘주소 필요’ 정정

- 기존 Wall 작업 채팅의 사용자 URL에서 CCVM22.10을 찾았다. read-only 조회로 `https://10.10.22.10:8081/api/health`200/Grafana11.4.0-pre, 원격 datasource Wall UID be79jb2q0bjlsf URL `http://localhost:3001`을 확인했다. 외부 직접 접근 `http://10.10.22.10:3001/api/v1/status/buildinfo`도success/Prometheus3.5.1이다. 사용자도22.10:3001을 실제 Prometheus 주소로 확인했다.
- 원격 Wall의 native `/api/ds/query`로 동일 panel83 CPU평균 PromQL을 조회했다.15초/1시간241개 실제값은3.8037→1.8322→3.2076→3.6587…/최소1.7143·최대4.3802%이며 기존 로컬fixture 사인파와 다르다. 응답 `/tmp/wall-real-series-10.10.22.10.json`. 별도로13.10 Wall/3001도응답하지만 이번 실제 비교 기준은 기존 사용 기록에서 찾은22.10이다.
- 앞서 로컬 datasource목록만 보고 실제 환경 정보를 사용자에게 다시 요구한 것은 잘못된 판단이다. 원본 환경의 접속기록·원격datasource부터 확인해야 한다. 이 확인은 remote/local datasource URL·쿼리·DB·패널을 변경하지 않았으며 원격 종합 dashboard API는anonymous403임을 유지했다. 실데이터를받은 사실과 이를 Wall UI에서 렌더링 비교한 사실을 혼동하지 않는다. 후자는 별도 검증이 필요하다.

## 2026-11-04 — REF-98 실제 Prometheus 연결로 사인파 문제 해결

- 사용자 ‘얼른 다시 해결’ 지시에 따라 실제 연결을 로컬 미리보기에 적용했다. 기존 local Wall/Glue datasource 전체 응답과19개dashboard원본은 `~/Library/Application Support/ABLESTACK/WallPreview/backups/real-prometheus-20261104/`에보존했다. 운영DB/원격CCVM설정은수정하지않았다. product소스변경없이공식localDatasourceAPI로Wall/Glue의url만변경했으며nativeversion만증가했다.
- Wall=`http://10.10.22.10:3001`/3.5.1, Glue=`http://10.10.22.11:9095`/3.13.4를확인했다. nativeGrafana(launchd)에서direct22.10:3001접근은no route to host였다. Python을launchd로실행한중계도같이실패했다. 같은개발exec컨텍스트에서는조회에성공하므로OS보안/네트워크설정을변경하지않고표준라이브러리read-onlyrelay를터미널과분리해실행했다. backgroundnohup시도는프로세스가유지되지않아채택하지않았다. 최종subprocess.Popen(start_new_session=True)의pid41457/ppid1을확인했다. 잘못실행한launchd후보는bootout했고plist는기존LaunchAgents밖으로이동했다. preview/fixture서비스를중복기동하지않았다.
- 최종local WallURL3319→22.10:3001, GlueURL3319/glue→22.11:9095. readendpointallowlist GET/POST만허용하고admin/delete_series·write는403이다. 127.0.0.1에만바인딩하고원본응답을그대로전달하며쿼리변경·노이즈·보간·캐시를추가하지않았다. runtime파일은prometheus-read-proxy.py/pid/logs/REAL_DATA_PREVIEW.md이며환경복원과재시작방법을기록했다. Mac재부팅후자동시작을보장하지않는다.
- 정확성: 직접Prometheus와localnativeCPUavgquery를같은start1793772150000/to1793775750000/15초로요청해241개전부정확히일치(max_absolute_difference0.0)했다.1.714259–4.381667%의실제변동과피크가있다. `/tmp/wall-real98-comparison.json`, `wall-real98-local-response.json`, `wall-real98-prometheus-response.json`. Dark툴팁15:35:45의avg3.77%는직접instantquery원본3.7716666666997916과일치했다.
- 실제Chrome: 종합CPU의기존매끈한사인파가실제촘촘한상승/하강으로바뀌었고범례avg/ablecube22-1·crosshair·tooltip을Light/Dark에서확인했다. Glue I/O도생성형사인파에서실제읽기/쓰기피크로바뀌었다. 메모리의실제완만한변동은그대로유지했다. 사용자탭1296911396미저장0/dialog0확인후reload해실측값과dirty0을확인했다. 기존다른편집탭은갱신하지않았다. 불필요한빌드/전체테스트는수행하지않았다.
- 보존검사:19개원본Dashboard JSON차이0, localWall/Glue설정의변경필드는url/version뿐, 기존3317/3318유지. SQL/clock plugin오류와일부미존재지표No Data·Lokifixture는별도제약이며이번해결범위로보고하지않는다. 코드엔진수정없이환경연결을바꾼작업으로명확히구분한다. stage/commit/merge/push없음. 이미지 `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-real-prometheus-ref98/real-data-light.png`, `real-data-dark.png`; 최종사용탭이미지·health결과는아래에보완한다.

- 최종사용탭1296911396의CPU툴팁15:37:45/avg3.41%·ablecube22-1 4.27%/새Wall범례2행/dirty0을확인하고Light그대로전달했다. `user-tab-real-data-final.png`에기록했다. 원본preview/fixture및liveWall/Glue중계health200, detachedrelay pid41457/ppid1실행을재확인했다. Mac재부팅후자동기동은미보장이라는제약을유지한다.

## 2026-11-04 — REF-99 Resize 확장·축소 이웃 복귀

- Dynatrace 사용자 Playground탭에서4×3 Pie를8×3으로확장/놓기→4×3축소/놓기했다.👋이웃tile은iframey233→377→233px로복귀했다. 사용자기존미저장상태를Discard하지않고이번크기만복원했다. 내부engine은미확인이고동작만참조했다.
- 원인:매제스처items를새origin으로쓰면서이미밀린이웃좌표를기본자리로채택했다. 현재제스처중재축소는기존코드가복귀했지만놓은뒤다시축소하면복귀하지않았다. `layoutMovement.ts`의ResizeReflow/resizeReflowOrigin과`PanelLayoutGrid.tsx`의reflowOrigin/ref만추가했다. snap은현재origin/크기를유지하고collision은최초선호좌표를사용한다. 동일패널·직전완료배치일치시에만재사용하고실제Move/다른panel/Undo/붙여넣기등의배치변경과탭전환이면기준을버린다.단순Grip클릭으로지우지않는다.새engine/library/CSS/쿼리/데이터모델변경없음.
- 검사:새`resizeReflow.test.ts`3개통과(확장/부분축소/원복·의도적빈공간보존, stale기준무효화, west반대모서리보존).ESLint/Prettier/diffcheck통과.기존전체Grid테스트의알려진타이밍실패를피해관련회귀만실행했다.Productionwebpack최종42.574초/기존size경고2개.원본checkout에는build자산만반영하고기존previewlaunchd만kickstart했다.
- 실제Wall05:패널28의outerwidth347→694→347px, 이웃30의y378→486→378px를서로다른마우스제스처로확인했다.축소후전체패널DOMrect의x/y/w/h차이0. Undo로이웃y486(전환중485.9847),Redo로378복원했다.원래좌표로돌린직후native저장바는남아있었으며이것을dirty0으로오인하지않는다(문구text가아닌aria-label).이번검증은변경취소로전체원복한뒤변경group0을확인했다.이잔여nativeDirty의원인은이번작업에서확정하지않았고해결됐다고보고하지않는다.
- 기존48열/스냅/충돌nativehelper/preview-drop동일확정·Undo/Redo/취소·원격실데이터연결은유지했다.이번선호좌표기준은페이지메모리로서새로고침뒤과거이웃자리를복원하는영구메타데이터를추가하지않았다.사용자실제종합탭1296911396변경group0확인후최신build로reload했다.다른사용자탭은갱신하지않았다.
- 이미지 `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-resize-reflow-ref99/expanded.png`, `restored.png`, `clean-final.png`.기존user미커밋/index를보존했고stage/commit/push없음.최종API보존/서비스결과는아래에추가한다.

## 2026-11-04 — REF-100 관리자 메뉴 복원·듀얼 레일 통합

- 누락원인2개:WallChrome이실제없는administrationID만보았고, isWallModernRoute가관리경로를제외했다.기존서버navtree/admin.go·navtree.go와frontcore/pluginroutes,실제bootmenu를대조했다.실제관리root cfg/connections와legacyadmin에서서버권한·feature필터된leaf를재귀수집한다.신규managementNavigation.ts에서데이터및확장/사용자및접근/시스템관리로그룹화하고중복/hidden/external/빈group를제외한다.존재하지않는권한관리/Enterprise기능을새로추가하거나username=admin으로판단하지않는다.
- 수정파일:WallChrome.tsx(관리그룹·프레임),WallNavigation.tsx(Primary하단관리1개·Secondary그룹·활성/접기),model.ts(관리경로Wall셸),신규managementNavigation.ts/managementNavigation.css/managementNavigation.test.ts,기존WallNavigation.test.tsx,DESIGN_SYSTEM.md/AGENTS.md/이기록.통합은기존shadcn방식Button과Base UI Tooltip/Collapsible1.0.0을재사용했다.관리페이지본문은nativePage/폼/테이블/탭/핸들러를유지하고공통Surface·Inter/Pretendard·입력·제목·탭색을CSS로조정했다.내부관리엔진전체를재개발하거나Base UI로바꿨다고표현하지않는다.
- 실제ChromeAdmin:관리12항목(데이터소스/플러그인/연결추가/상관관계,조직/사용자/팀/서비스계정,통계/조직기본설정/서버설정/인증).Datasources목록과Wall설정폼URL3319/기존값·Save&test버튼,설치된Prometheusplugin상세,나머지9개각페이지title/route·에러alert0확인.사용자표에는실제admin계정이로딩됐고생성/삭제/권한변경/설정저장/plugin설치를하지않았다.새기능을추가하는대신실제nativeURL/필터를재사용했다.
- URL/디자인:사용자직접reload/인증↔상관관계뒤로·앞으로/최장href활성/관리재클릭시URL유지·접힌Secondary복원/Light·Dark/단일클라우드심볼1개/computedWallInter·WallPretendard검증.최종사용자nativeTab색rgb22,119,255/선택선gradient없음·파란색이다.현재언어가일부영문인nativeplugin폼은전면번역/재구현범위에포함하지않는다.
- 권한/Kiosk:익명boot에서global-orgs/server-settings미노출(기존org권한으로teams/data source는제공),server `/api/users/search`·`/api/orgs`·`/api/admin/settings`는403유지.처음확인한/api/admin/users의404는없는route라권한검증증거로사용하지않는다.실제별도Viewer·OrgAdmin계정을만들거나역할을전환하지않았다.필터트리/빈메뉴/중복·외부링크unitcase로보완했다.대시보드Kiosk관리0/Grip0,ESC후관리1·모든panelrect차이0.사용자탭1296911396변경group0확인후최신build로reload해관리1/변경group0을확인했다.
- 검증:관련3suites28tests통과(`/tmp/wall-admin100-tests-final.log`),ESLint/Prettier/diffcheck통과.추가UI테스트의MemoryRouterfutureflag경고만테스트wrapper설정으로수정했고제품동작을변경하지않았다.최종productionwebpack37.577초/기존size경고2개(`/tmp/wall-admin100-build-release2.log`).원본checkout에는public/build만동기화하고기존previewlaunchd만kickstart했다.이미지/route기록 `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-admin-ref100/`에보존했으며datasources-light-final.png의관리화면을전달했다.
- 보존:Grid/Drag/Resize/Undo·쿼리·data source값·계정/서버권한API·운영설정변경없음.관리내부모든개별위험작업의저장/삭제를실행한회귀검증은아니다.사용자기존미커밋과index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe를유지하며stage/commit/merge/push없음.최종health/원본19JSON보존결과는아래에추가한다.

- 최종확인:원본19개Dashboard JSON변경0개,preview/fixture/live relay모두HTTP200.변경UID:[].

## 2026-11-04 — REF-101 Time Series 범례·시리즈 상호작용

- 구조: `TimeSeriesPresentation.renderLegend` opt-in → `VizLegend`의 native 선택/Hover callbacks → 공통 `charts/WallSeriesLegend`/`WallSeriesLegendItem`/`WallSeriesMenu`. 기존 `PlotLegend`의 native Field·Frame·calc formatter를 재사용하며 실제 벡터/시리즈 순서를 바꾸지 않는 `seriesLegendModel` 복사 정렬을 사용한다. `SeriesLegendContext`는 실제 전체 항목/격리 여부를 전달한다. 사용자 통계 컬럼·Legend displayMode/width/position·Threshold/Override를 보존한다. 저장된 다른 계산 제목의 기존 정렬도 보존하고 reducer ID가 아닌 문자열을 계산기로 넘기지 않는다. 통계 정렬값은 항목당 한 번만 계산한다.
- 실제 표시 교체: Table/List 행 정렬, full-name title, Hover/focus/open 더보기, sticky 정렬 heading, native scrollbar. 로컬 shadcn `components/ui/dropdown-menu.tsx`/`popover.tsx`와 실제 Base UI1.0.0 Menu/Popover·Button을 사용했다. Popup 색·글꼴·Border·Hover·Motion은 기존 공통 토큰이고 `seriesLegend.css`는 배치/행/표/스크롤 CSS다. swatch/색상 palette는 native `SeriesColorPickerPopover`, 새 차트 엔진이나 가짜 필드/필터를 추가하지 않았다.
- 시리즈 메뉴: 이름 복사·격리·숨김·전체 복원·색상·native Inspector Data 진입·실제 data links. reset은 system hideSeriesFrom override만 제거하고 사용자 override는 유지한다. Kiosk는 색상/Inspector 숨김, Viewer native permission이 false면 색상 숨김. 새 Viewer 계정을 생성하지 않고 unit permission guard로 보완했다. 색상 Popup ESC 종료 후 실제 focused button이 원래 `ablecube22-1 시리즈 작업`이고 popup0/Grid preview0임을 확인했다.
- 발견/수정: 기존 native color handler는 조회 화면에서 Field Override만 바꾸고 dirty tracker를 시작하지 않았다. `setDashboardPanelContext.ts`에서 원래 callback 전에 기존 `onEnterEditMode()`를 호출하여 saved baseline/worker/dirty/일괄 저장/취소로 연결했다. 같은 wrapper를 native swatch에도 적용하고 권한/Kiosk를 동적으로 확인한다. native 저장/취소 모델이나 Query API는 재개발하지 않았다. `PanelContext`의 reset/inspect/permission은 optional hooks이며 fallback 경로를 보존했다.
- 자동 위치: `metricProfiles` type·Time Series module에 명시적 `wallLegendAuto` 옵션, core TimeSeries가 실제 panel dimensions로 effective placement만 투영한다. 이전 bottom/right/width는 자동을 켜지 않으면 유지한다. 실제 QA 폭883px·420px은bottom,1350px panel은right였다. viewport capability로1100을 요청했지만 실제innerWidth1730이 유지되어 그 시도를 작은 viewport 검증으로 보고하지 않았다. 작은 실제 종합패널340px은 정상이고 자동 조건/명시 위치 우선은 unit로 검증했다.
- 실제 브라우저: 종합 hostCPU2개·Glue I/O2개,05 Network3개/ICMP1개, 임시 local QA의 실제 Prometheus88개를 확인했다. QA `topk(48, rate(...))`는 각 시간별 상위 시리즈의 합집합88개라48개라고 보고하지 않는다. right 범례 끝에서 native scrollTop1971/content2493/viewport522, 마지막 항목 menu rect x1237..1461/y488..765로1730×873 viewport 안에 들어왔다. 범례의 header가 목록 scroll에 밀리는 것을 발견해 toolbar/thead를 sticky로 유지했다. 코드/입력/차트 모델을 바꾸는 대신 해당 표시 컴포넌트 안에서 처리했다.
- 기능: 종합 isolate 뒤 avg aria-pressed=false/host=true → 전체 복원 둘다true/dirty0. 표시 이름순 → 평균순 → 내림차순은 실제 항목 순서만 변경하고 통계4열 유지. 복사 후 기존 sidebar 검색에 실제 Cmd+V하여 `ablecube22-1` 붙여넣기를 확인하고 검색을 비웠다. QA configured link의 resolved href와 원본nativeonClick를 유지하고 원본에 없는 링크는05 메뉴에 없었다. Inspector native URL inspect=panel-83/inspectTab=data 및 형식화 데이터 테이블을 확인했다(단일 field 전용 Inspector로 오인하지 않는다).
- 저장: local temporary UID wall-legend-qa-101에만 purple Field Override를 저장→native version3/API override→reload 보라색 유지, red로 변경→취소하여 purple/dirty0 복원. 원본 쿼리/DS 동일. native visibility는 임시선택이며 조회만으로dirty가 생기지 않았다. 기존19개 Dashboard JSON 차이0, index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지. 임시QA JSON은 이미지 폴더에 남긴 후 정확한 UID/title/tag를 검증하여 해당 QA 대시보드만 정리했다.
- 분석 기능: native uPlot/Crosshair/nearest point/Tooltip/Zoom는 수정하지 않았다. 실제 Tooltip `2026-11-04T07:44:00.000Z`→local16:44:00/ablecube22-1 3.15%/avg1.99%·실제 링크를 확인했다.05 plot 실제 drag는 from07:31:55.959Z/to07:59:50.378Z 시간 탐색이 되었고 Grid drop0/dirty0이었다. Kiosk menu에는 copy/isolate/hide/reset만, ESC 일반복귀 후 색상/Inspector가 복원됐다. Light surface rgb255,255,255 / Dark32,35,41·text242,243,245·computed Wall Inter/Wall Pretendard를 확인했다.
- 벤치마크: 주어진 Graph shortlink와 실제 목록의 Graph URL은 Dock만 로딩하여 본문 실측에 실패했다. 기존 Getting Started 공유 범례와 공식 Dynatrace Time series 문서를 참고했고 이를 Graph 메뉴/엔진을 직접 분석한 것으로 보고하지 않는다. 근거·실제 import/version/CSS 경계는 DESIGN_SYSTEM REF-101 표에 기록했다.
- 검증: 관련4 suites57tests 통과 `/tmp/wall-legend101-tests.log`(정렬/기존계산제목/1·48목록/통계 유지/native actions/실제links/권한/색상tracking/nativepresentation 회귀). targeted ESLint/Prettier/diffcheck·변경파일 TS semantic diagnostics0. 전역 tsc 성공이라고 표현하지 않는다. productionwebpack 기존size경고2개 외 성공. 최종CSS 빌드 시간/health는 아래 보완한다. 기존mock중복/Browserslist경고는 유지했으며 의존성 업데이트를 섞지 않았다.
- 기존서비스만 유지: build 자산을 원본checkout public/build에 rsync하고 기존preview launchd만kickstart했다. preview3317/fixture3318/liveWall3319/Glue3319/glue 모두200. 실제사용 종합tab1296911396은 매번 변경group0/dialog0 확인 후 최신build로reload했고 나머지 사용자편집탭은 갱신하지 않았다. 새Foreground서버·운영배포·stage/commit/merge/push없음.
- 이미지/기록: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-legend-ref101/` 아래 `05-series-menu-light-final.png`, `05-series-menu-dark.png`, `native-tooltip-real-data.png`, `many-series-right-menu.png`, QA저장모델·원본보존JSON.05 Light실제메뉴 탭을 전달하고 user종합탭의 새범례도 확인했다.

- 최종: popup을 범례 trigger 시작점에 정렬하여 Secondary Rail 위로 넘어오던 위치를 개선했다(공통 Base UI collision 보정 유지). Light/Dark 모두 최종 menu x418..642/y480..716,224×236px, toolbar sticky top424px을 실제 확인했다. 마지막 production webpack27.499초/기존size경고2개. 최종 user종합legend5/dirty0,05dirty0. preview health·01/05HTTP·fixture·live relay200, 원본19개/남은19개·변경0/임시QA제거를 재확인했다. 최종index tree도 동일하다. Light/Dark 최종 이미지를 갱신했고 서버는 계속 실행 중이다.

## 2026-11-04 — REF-102 Gauge / Meter Bar

- 분석: GaugePanel/BarGaugePanel → native getFieldDisplayValues/reducer/fieldConfig/links → Gauge/BarGauge → VizPresentation 경로를 확인했다. 종합7개 Gauge패널의9개 값은 실제 custom RGBA green·75/85 조건(Glue는percentunit/percentage)을 저장하고 있어 기본색이라는 추측으로 바꾸지 않았다. Scene의 plugin-default 병합으로 저장된green/80의 작성 의도는 값만으로 확정할 수 없으므로 자동은 보존 우선이다.
- 구현 파일: panels/WallGauge.tsx, 신규 meterTokens.ts/meterPresentation.ts/MeterValue.tsx/WallMeterBar.tsx/WallMeterOptions.tsx와 meterPresentation.test.tsx, 기존 WallGauge.test.tsx. 연결은 visualization.ts, shared VizPresentation.ts/Gauge.tsx/BarGauge.tsx, plugins/panel/gauge 및 bargauge의 Panel/module.tsx다. generated panelcfg/CUE/백엔드/쿼리/변환/JSON migration/Grid/Time Series 스타일은 수정하지 않았다.
- 실제 UI: Gauge는 SVG원형 기본·270도오픈 링·반원,5.5stroke·중립 트랙·공통 수치/작은 단위·tabular nums/Inter/Pretendard. Meter는 실제 @base-ui/react/meter1.0.0 Root/Indicator와 같은 토큰을 사용한다. native ratio/repeater/order/sizing/orientation/text options·showUnfilled/namePlacement/valueMode/links를 재사용한다. 일반색 Cobalt/Sky·Indigo/Violet·Teal/Cyan·Slate/Blue4쌍과 단색/두색을 제공한다. Theme Select는 실제 Base UI Select+기존 local shadcn Button/Tailwind와 timeSeries.css의 공통 옵션 표현을 재사용했고 SVG를 Base UI Gauge로 표현하지 않는다.
- 실제 색상 비교: 임시QA에서 실제 Wall Prometheus의 전체 평균/호스트 최고 메모리 query2개를 같은 범위/단위로4팔레트×단색/두색 비교했다(대략39.x%/47.x%). 선명하고 기존파란강조색과일관된 Cobalt/Sky 단색을 기본으로 선정했다. 두색은 인접한 평면 색이며 gradient/gloss가 아니다. 자동은 실제 별도 항목으로 표시하여 undefined가 화면에서 Cobalt로 가려져 같은 Cobalt를 선택해도 반응하지 않는 함정을 없앴다. 자동→기존green #56A64B, Cobalt 명시선택→#2563eb를 실제 편집기에서 확인했다.
- 색상/의미 보존: 맞춤 임계치·고정색·매칭 color/threshold/mapping Override·활성 값 매핑이 우선한다. 정확한 native 기본preset은 사용자 Wall팔레트 선택 시 기준색만 대체하고80이상 native 상태색을 보존한다. getActiveThreshold·getDisplayProcessor를 사용해 실제 구간만 설명하며 정상/위험을 hue로 추측하지 않는다. mapped/no-data에는 가짜 숫자/상태를 넣지 않고 raw readout을 보존한다. Range라벨만 단위를 native로 형식화하고 불필요한 소수0을 줄이며, 원래 수치 text/prefix/suffix/단위/설정 정밀도는 바꾸지 않는다.
- Meter 범위 모드: 기존 gradient 저장값은 '범위 색상'으로 표시하고 native threshold조건에 따른 연속된 평면 구간으로 투영한다. native getActiveThreshold를 재사용하고 표시용 경계 목록만 복사/정렬한다. 실제35/40 검증에서 평균39.6%는 green/orange88.4/11.6%, 최고47.8%는green/orange/red73.2/10.5/16.4%로 원래 경계를 반영했다. Basic과 범위 모드를 같은 무동작 UI로 만들지 않았고 LCD틈/셀이 없다. 값 매핑은 구간색보다 우선한다.
- 기존 실제 종합:9개 모두data-wall-gauge=ring/colorSource=configured이며 rgba(50,172,45,.97)와75/85를 유지했다. 실제 Glue3.63%, hostCPU3.51%, hostmemory34.26%, userVMavg0.29%/peak0.322%, VM메모리avg6.81%/peak7.35% 등의 native표시/평균·최고·동적이름을 확인했다(실시간 값이므로 고정된 검증상수로 취급하지 않는다). 유효0..1 percentunit이 중복100배 변환되지 않았다. 패널 종류·개수·외부배치를 바꾸지 않았다.
- 실제QA에만35/40 조건을 추가해 실제 메모리39.5%→orange #FF780A/≥35%,47.5%→red #E02F44/≥40%와 fixed #16a34a 두필드 유지 확인. 이는 테스트 조건이지 기존75/85 정책 변경이 아니다. 새 팔레트·반원·두색을 native 편집기 적용→일괄 저장→version3/reload에서 Indigo #6366f1·semi·duo 복원했고 자동/Cobalt 왕복 후 취소/dirty0 확인했다. 옵션 저장본과 최종QA모델은 이미지폴더에 보존했다.
- Light/Dark:4팔레트 쌍을 실제 확인했고 Dark는Cobalt #60a5fa,Indigo #818cf8,Teal #22d3ee,Slate #94a3b8이었다. Meter도같은색이며 native aria-valuenow39.57166472488142/aria-valuetext39.6%/fill39.5717%를 확인했다. bounds/방향/숨긴값/클릭은 unit로 보완했다. Primary/Secondary/Page/패널기하구조·기존 Motion/데이터갱신 애니메이션은 바꾸지 않았다.
- 호환:neutral/bipolar·숫자 threshold label의 Gauge와 LCD/연속색상 BarGauge는 native fallback을 유지했다. 이 특수경로까지 새로운 SVG/HTML이라고 보고하지 않는다.05 의미별 Compact Usage를 억지로 native Gauge로 되돌리지 않았다. 키오스크/권한/편집/저장/취소는 기존 native 구조이며 새 액션/권한 모델이 없다.
- 검증:3suites20tests 통과(/tmp/wall-gauge102-tests.log): 팔레트/보호·mapping/matchedOverride·nativealert·range조건/percentunit·3형태/불변성·Bar가로/세로/좌측이름/숨긴수치/showUnfilled/클릭·nativeGauge특수fallback·공통Legend회귀. targeted TS diagnostics0/ESLint0/Prettier/diffcheck. 전역tsc 성공으로 표현하지 않는다. productionwebpack28.749초/기존size경고2개(/tmp/wall-gauge102-build.log), 기존mock중복/Browserslist경고는 그대로며 의존성 변경은 없다.
- 마무리:QA UID/title/tag를 검증하고 임시대시보드만 삭제했다. 기존19개JSON 차이0/남은19개. preview3317 health/실제종합URL·fixture3318·liveWall3319/Glue 모두200. 기존preview launchd만kickstart하고 build 자산만 원본checkout에rsync했다. 별도서버/운영배포/계정변경/HTTPS·포트전환 없음. user실제종합tab1296911396은URL에editPanel/editview 없음·dirty0/dialog0 확인후 갱신하여 Gauge9·dirty0·computedWallInter/WallPretendard 확인했다. 다른 사용자 편집탭은 갱신하지 않았다.
- 기록: /Users/hongwookryu/.codex/visualizations/2026/11/04/wall-gauge-ref102/의 palettes-light.png/palettes-dark.png/theme-options-light.png/meter-ranges-light.png/overview-light-final.png/overview-dark.png와 테스트·빌드·타입·lint 로그, native저장본/최종QA모델/preservation.json. 사용자의 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe·기존미커밋을 보존했고 stage/commit/merge/push하지 않았다. Dynatrace Playground는 Dock만 로딩되어 공식 GaugeChart/MeterBarChart 문서를 참고했으며 실측했다고 주장하지 않는다.

## 2026-11-04 — REF-103 Stat / Single Value

- 분석: StatPanel의 native getFieldDisplayValues/reducer/매핑 → VizRepeater/alignmentFactors → BigValueLayout/textMode/formatter/links → 기존 StatCard 스타일 경로를 확인했다. native 크기 측정 후 CSS를 덮던 구조로는 실제 숫자·단위 폭과 다중 값 기준선이 안정적이지 않았다. native Sparkline은 시간 필드 없이 index 배열도 받을 수 있어 Wall에서 실제 시계열 조건을 별도로 검증해야 했다. 변환/쿼리/단위 처리 엔진은 변경하지 않았다.
- 구조 변경: 신규 panels/WallStatContent.tsx/statReadout.ts/statReadout.test.tsx. 기존 statPresentation.ts, shared BigValue.tsx/StatCardPresentation.ts, plugins/panel/stat/StatPanel.tsx, modern.css, statPresentation.test.tsx를 연결·수정했다. native BigValue의 textMode 결과/정렬 기준 문자열/배경 대비/native chart와 percent change를 새 Wall 표시 컴포넌트에 전달한다. native button/link/click/tooltip과 context 미사용 경로는 보존하며 그래프 엔진을 만들지 않았다. 이번 Stat readout은 비대화형 DOM이고 새 Base UI Stat가 존재한다고 보고하지 않는다.
- 시각: 중립 panelText, 작은 native 단위/prefix/suffix, 명확한 label 기준선, tabular nums. 실제 Inter/Pretendard Canvas 측정으로 긴 수치가 줄어들고 font-loaded Context가 재측정을 수행한다. 기존 native text/개별 크기·단위·소수·값은 그대로다. 숫자로 매핑된0도 수치로 분류하고 native text threshold의 회색 점을 제거했다. native fixed/override/threshold/실제 매핑의 색상은 표식/상태 배지로 유지한다. 임의의 자원 아이콘/증감률/차트/상태명은 만들지 않았다.
- Sparkline: 설정 켜짐+실제 Time 필드+유효한 시간/숫자2쌍 이상일 때만 native renderer에 전달한다. 기존 null gap/필드/vector는 변경하지 않으며 기존 sparkline.timeRange 원본을 직접 수정하던 부분도 wrapper 복사로 바꿨다. native panel renderCounter 계약으로 옵션 변경을 반영하는 integration test를 사용한다. reducer/repeater 자체를 다시 구현하거나 query runner를 변경하지 않았다.
- 실제 검증: 종합의 Mold/Cube/Glue mapping, 호스트3/3/0·시스템VM4/4/0, 에러로그40, Glue디바이스9/0/9/0 및 기존 단위값을 Light/Dark에서 확인했다. 임시 QA에서는 실제 remote Prometheus memory 168375984128/168375967744/168375963648의 전체 표시 및 공통25.3845px, 같은 값의156.81GiB 3개 공통36px/작은 단위, 실제 시간 시리즈 Sparkline1개/꺼짐0개/instant0개를 확인했다. QA viewport1730×873, 긴 값 overflow false. host 전체는 dot false, 실행/정지는 실제 색 dot true이며 모두36px이다.
- 상태/환경 구분: QA의 존재하지 않는 메트릭→공통 데이터 없음, 의도적 QA PromQL 구문 오류→기존 조회 오류/실제 오류 문구를 확인했다. Loading/부분 데이터/매핑 null은 기존 common state 테스트로 보완했다. 로그40은 기존 Loki fixture이며 운영 로그라고 주장하지 않는다. 실제 사용 탭은 var-ccvmip가 빈 URL이어서 Mold는 No Data, Cube/Glue는 OK였다. QA와 별도 기본 변수 검증에서는 실제 ccvmip=10.10.22.10의 Mold OK를 확인했다. 사용자의 URL/변수/쿼리를 바꿔 문제를 가리지 않았다. 현재 시간 플러그인 및 기존 Infinity/SQL 조회 오류는 이번 Stat 작업의 수정 대상이 아니다.
- 05 회귀: 별도 조회 탭에서5개 탭 개수21/19/7/6/6와dirty0 확인. SCVM 빈 값에 따라 기존 KPI는 표시할 데이터가 없습니다 상태를 유지했다. 이 별도 의미별 projection을 native Stat로 강제 전환하지 않았다. 실제 데이터가 없는05 수치를 정상 운영 값으로 검증했다고 보고하지 않는다.
- 검증:3suites24tests 통과(statPresentation/statReadout/panelPresentation). native formatting/mapping/단위·명시42px·링크 callback/스킨 전환/옵션·필드 불변, 긴 값/cohort, 상태색/중립색, 실제 시간 gap/미지원 배열, native Sparkline 설정 켜짐·꺼짐·instant를 확인했다. targeted TS diagnostics0/ESLint0/diffcheck. 전역tsc 성공을 주장하지 않는다. production webpack28.404초/기존 size경고2개, 기존 mock중복 경고는 유지했다. 의존성/Backend/Grafana 버전/DS/운영 설정은 수정하지 않았다.
- 반영: public/build 자산만 기존 실행checkout으로rsync 후 기존 preview launchd를kickstart했다. 최종3317 health/종합URL·fixture3318·실제Wall3319/Glue relay 모두200. 사용자 실제 종합tab1296911396의editPanel/editview 없음·dirty0/dialog0을 확인하고 갱신했다. 최신 readout17개·폰트ready·host36px/중립점 제거·dirty0을 확인했고 Light 기본과19개 메뉴 목록으로 복귀했다. 사용자의 다른 편집탭은 강제 갱신하지 않았다.
- 기록/정리: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-stat-ref103/`에 overview-before.png/overview-light-final.png/overview-dark-final.png/qa-light-final.png/qa-dark-final.png/05-overview-light.png, browser-final.json, QA source/final model, tests/build/types/lint logs 및 preservation.json. QA UID wall-stat-qa-103/id91/title/tag를 확인한 후 해당 임시 생성본만 삭제했다. 원본19개 JSON 차이0/남은19개이며 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe를 그대로 보존했다. 사용자 미커밋과 섞지 않기 위해 stage/commit/merge/push하지 않았다. Dynatrace Playground는 Dock만 표시되어 실제본문을 실측하지 못했고 공식 SingleValue 문서를 참고했다. 이 차이를 REF-103 표에 기록했다.

## 2026-11-04 — REF-104 Table 데이터 탐색 (브라우저 검증 일부 대기)

- 분석/참조: native TablePanel→Table→react-table7.8/RowsList react-window1.8→기존 Cell renderer를 추적했다. Playground shortlink는 Dock만 표시되어 실제본문을 실측하지 못했으며 공식 Dynatrace DataTable의 컬럼·셀 작업/조회 상태 구분을 참고했다. 기존 Grafana 데이터/Transform/정렬/width/Cell Display Mode를 유지하고 presentation 슬롯만 확장했다. pinning은 현재 native 플러그인에 연결되어 있지 않아 가짜 메뉴를 추가하지 않았다.
- 수정 파일: shared Table의 신규 TablePresentation.ts, 기존 types.ts/Table.tsx/HeaderRow.tsx/TableCell.tsx/DefaultCell.tsx/styles.ts/RowsList.tsx/reducer.ts. app의 신규 panels/tablePresentation.ts/WallTableControls.tsx/WallTableCell.tsx/useWallTablePresentation.tsx/table.css/WallTable.test.tsx/tablePanelPersistence.test.tsx와 기존 plugins/panel/table/TablePanel.tsx. 기준표 DESIGN_SYSTEM REF-104/AGENTS를 함께 갱신했다. 사용자의 기존 다른 미커밋 작업을 덮어쓰거나 stage/commit하지 않았다(index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지).
- 구조/시각: 도구 행(실제 row/column count·native multiFrame selector·현재 조회 컬럼 선택), header 내 native sort/filter와 Base UI 컬럼 작업, 기존 셀 DOM에 실제 Base UI ContextMenu를 연결했다. local shadcn DropdownMenu/Button, @base-ui/react menu/select/context-menu1.0.0을 사용하며 Table 자체는 native 엔진이다. 공통 Application Surface/Inter/Pretendard/tabular nums/약한 divider/hover/ellipsis·native full title/inspect, 실제 ColorText의 텍스트 mapping만 기존 의미색 배지로 표시한다. Gauge/JSON/링크/Actions 등 다른 cell mode를 강제 교체하지 않았다.
- 동작/저장: 정렬·너비는 기존 options.sortBy/custom.width와 Wall begin/dirty/native 일괄 저장을 사용한다. width override는 원본 fieldConfig를 직접 mutate하지 않도록 복사한다. 컬럼 표시 선택은 현재 Frame의 view state만 변경하고 같은 Frame refresh에 유지되며 schema/Frame 변경에는 초기화한다. 마지막 열·원래 custom.hidden/Transform 제거 필드는 보호한다. 셀/보이는 행만 native cell.value와 formatter로 복사하고 TSV delimiter를 escape한다. 실제 native filter callback/설정 link/inspect 옵션이 있을 때만 해당 메뉴를 표시한다. Frame 선택은 기존 옵션 저장 동작을 유지하며 임시 조회 상태로 새로 정의하지 않는다.
- 확인한 입력/성능 문제: native header resizer가 right:-4/width8로 overflow에 반쯤 잘려 center가 다음 컬럼 sort label에 hit되었다. Wall opt-in에서 right0/8px 전체 입력을 header 안에 두고 label padding을 확보했다. 실제 DOM에서 center hit separator/right0/width8을 확인했다. 또한 inline react-window children function은 width 변경마다 모든 셀을 remount하므로 stable VirtualTableRow/itemData로 변경했고 mount-count test로 유지 확인했다. Canvas measurement context 재사용·실제 폰트·visible wrapped field 계산도 연결했다. Mac 잠금으로 입력이 중단된 현상을 제품 freeze라고 확정하지 않는다.
- 실제 검증(잠금 이전): 호스트03 UID eec03wg41s35sa/panel161의 원본 쿼리 파일시스템8행6열·GiB/%/기존 LCD Cell mode/가로 스크롤, 임시QA CPU960행 중DOM14~16행과 wheel scroll, 긴 QA 라벨, 실제 NIC mapping 및 링크, 메모리3Frame 선택을 확인했다. 이름만 QA 라벨이고 수치는 실제 read relay의 Prometheus 값이다. RAMFS0/0의NaN은 원본 그대로 보존했다. 컬럼 정렬 asc/aria-sort·표시job숨김·셀/현재행복사·Shift+F10/우클릭 및 실제host href를 확인했고 복사 전 clipboard는 복원했다. native 정렬 저장은 QA version2/API sortBy로 확인했다. QA Frame 전환의 native default materialization에 따른dirty는 변경취소해0으로 복원했다.
- 검증 결과: 관련4suites92pass/기존2skip(총94), /tmp/wall-table104-final-tests.log. native Table/utils82개와 신규 Wall 표시·row copy·200행가상화·숨김/wrap/스키마 전환·Light/Dark토큰·stable row·width override불변성10개를 확인했다. targeted ESLint0. 변경파일 TS 진단은 기존 VariableSizeList의중복React타입 refs 불일치1건이며 HEAD RowsList를 넣은 baseline에서도 같은 오류가 재현된다(/tmp/wall-table104-baseline-types.log); 전역tsc 성공이라고 표현하지 않는다. 기존duplicate mock/Browserslist경고와 webpack size경고는 유지하고 dependency update를 섞지 않았다.
- 브라우저 제한/다음 작업: CUA가 Mac locked와 자동해제불가를 명시하여 사용자의 수동 잠금해제를 요청한 상태다. column-resize 입력 중 timeout이 있었지만 그 시점부터 Mac 입력 자체가 막혔으므로 render freeze로 단정하지 않는다. 잠금해제 후 최신build로 에이전트 QA탭만 복구해 Resize→native저장→reload/width복원·취소, 최종Light/Dark/작은패널/다열 실제화면을 확인해야 한다. 사용자 편집탭은 강제로 refresh하지 않았다. 완료되지 않은 검증을 완료로 보고하지 않는다.
- 보존/환경: 원본19개Dashboard JSON 변경0, QA UID wall-table-qa-104/id92/title `[QA REF-104] Wall Table 검증 — 임시`/tag wall-qa-ref104-disposable/version2만 생성/정렬저장했다. 남은검증을 위해 QA를 보존하며 완료후 UID/id/title/tag 확인하고 이 생성본만 정리한다. preview3317 health/hostURL·fixture3318·liveWall3319/Gluerelay모두200. 런타임9.2.0/소스11.4pre 차이는 기존환경이며 upgrade하지 않았다. 원격환경/운영DB/원본DS/Backend/Grafana버전/HTTPS·포트/48열/차트/Grid엔진은 변경하지 않는다.
- 산출물: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-table-ref104/`에 column-menu-light.png/cell-menu-light.png(잠금 전 중간본), qa-source.json/qa-saved-model.json/preservation.json와 검증로그를 보존한다. 최종build/반영상태는 아래에 추가한다.

- 추가 재현/수정: 새 메뉴의 정렬해제는 native clearSortBy action인데 기존 reducer가 toggleSortBy만 저장callback으로 연결해 저장상태가 남았다. 실제 Base UI 메뉴→정렬해제 test에서 callback이 여전히 desc인 실패를 재현(`/tmp/wall-table104-clear-before.log`)한 뒤 reducer의 동일callback 경로에 clearSortBy를 추가했다. 별도 저장엔진/모델 없이 native sortBy=[]를 전달한다. 최종 관련테스트로 재확인한다.

- 최종 코드검증/반영: 정렬해제 callback test까지 포함한4suites92pass/2기존skip,23.431초. ESLint0/Prettier통과/diffcheck0. targeted TS는위의baseline동일 React refs진단1건만 남았다. productionwebpack149.118초/기존size경고2개로성공(`/tmp/wall-table104-build-final.log`). 최종자산을기존실행checkout의public/build에만rsync하고기존preview launchd만kickstart했다. 최종3317health/호스트URL·fixture3318·actualPrometheus/Gluerelay모두200, 원본19개JSON차이0/index tree동일을재확인했다. QA정리/최종브라우저검증은Mac잠금해제대기로보류이며최종배포후실제사용탭이갱신되었다고보고하지않는다. QA tab1296911552/actual host tab1296911555는handoff로보존했다. 산출물로그와preservation.json은최종본으로갱신했다. 운영배포/새서버/commit/merge/push없음.

## 2026-11-04 — REF-105 Bar Chart / Categorical 비교

- 분석: 현재 원본19개 중 barchart는12번 UID aevqaoeukd0jkf/panel37의 `$hosts 시간차이`1개다. native BarChartPanel→prepSeries(join/유효값/hide/stack)→prepConfig→barsBuilder/distribute/Quadtree→TooltipPlugin2/BarChartLegend를 확인했다. Bar Chart 고유 옵션에는 정렬/Top N이 없으며 기존 Transform은 별도다. 사용자 Playground shortlink는 Chrome에서Dock만로딩하여본문실측불가였고 공식 CategoricalBarChart의 항목작업/축생략/명시색우선/Grouped·Stacked 의미를 참고했다.
- 구현 파일: 기존 plugins/panel/barchart/{BarChartPanel.tsx,bars.ts,utils.ts}, 신규 wall-modern/charts/{categorical.ts,WallBarControls.tsx,categorical.css,categorical.test.tsx}. DESIGN_SYSTEM REF-105와AGENTS에 실제reference/import/primitive/CSS와renderer경계/보존계약을 기록했다. generated schema/CUE/module/defaultOptions/Backend/Grafana버전/데이터소스설정·운영환경/Grid/다른차트소스는 수정하지 않았다.
- 데이터/표시: categoryIndices가기존Transform후원본행의index목록만stable sort/Top N투영한다. 기본은전체·기존순서이며Top N명시선택은첫numericfield높은순을사용한다. 쿼리vector를sort/slice/mutate하지않고값/색필드/extra를같은index로투영하며nativegetLinks.valueRowIndex를원본으로번역한다. 동일이름Value필드는index:name으로구별한다. nativeGrouped/Stacked/100%수학/negative/단위/override/임계치·매핑/선택한width/radius/opacity/회전·간격은유지한다. 정렬/범위/강조는조회상태이며saved옵션이라고표현하지않는다. 영구정렬/Limit은기존Transform/저장을그대로사용한다.
- UI/렌더: 같은WallchartTokens팔레트/Inter·Pretendard/축·legend·tooltip·격자/Surface를사용한다. 자동classicnumeric만색상투영하고명시fixed/threshold/색override/매핑/semanticgradient는우선한다. 실제font측정으로축label을폭에맞게생략하고value자동크기를공통control역할로제한한다. Column/CardCSS만고친구현이아니라기존Canvas축/값/hoveropts와실제Quadtreehit를연결했다. nativeTooltip의hover/pin을유지하고같은Rect로항목강조/우클릭을처리하며destroy에서listener를해제한다. 항목선택목록·정렬·Top N은실제BaseUISelect,메뉴는localshadcnMenu/Button+실제BaseUIMenu1.0.0이다.
- 액션: 항목이름복사/강조·해제/실제native패널DataInspector/설정된link href·callback만제공한다. DataInspector는항목필터가아닌전체패널결과이므로`패널 데이터 확인`으로명명한다. 실제변수관계없는필터를추가하지않고kiosk는Inspector진입을숨긴다. 표시영역새라이브러리/새Chart엔진/저장모델은없다.
- 실제baseline: 임시QA id93/UIDwall-bar-qa-105/tagwall-qa-ref105-disposable에서실제Prometheus3호스트의메모리used/free와CPU코어percent를조회했다. 긴resource이름만명시QA라벨이며수치를만들거나변경하지않았다. 초기native화면에서세로긴이름겹침·가로축이름잘림·classicgreen/yellow와100%축이0..1B인문제를확인하고before.png를저장했다. 100%축은native정규화percentformatter로표시하도록Wall경로만수정하고필드bytes/원본값/Tooltip·임계치/scale옵션은그대로다. QA206은12번원본설정을복사했으나Lokifixture쿼리가EOF라서실제운영Bar검증으로주장하지않는다.
- 소스검증: 신규9개를포함한관련3suites24tests/기존10snapshots통과(82.7초). nativegrouped/normal/percent수학동등·percent축25/100%·원본bytes/negative·stable정렬/null/중복필드/색·extra·링크source행/override·threshold우선·Unicode생략·실제Qt입력/cleanup·BaseUI메뉴/copy/nativeinspect/Top N을확인했다. TypeScript의기존TooltipPlugin2 ReactPortal/중복@types/react불일치는HEAD원본Panel(154행)을compilerhost에넣어도같이재현되며별도로그로구분한다. 전역tsc성공을주장하지않는다. 실제최종화면검증/빌드/QA정리결과는아래보완한다.

- 실제조작(최종팝업수정전 그래프/도구):1730×873에서5개실데이터차트의기존막대수/배치유지,Grouped·가로Stacked·0..100%축·309pxCPU패널의Top5·QA40/60임계치색을Light/Dark모두확인했다. source팔레트는LightCobalt/Teal·Dark공통밝은색이며기존명시thresholdblue/orange/red는그대로다. computedfont는자체WallInter/WallPretendard,chartwidth776/542/542/309/425px다. Top5선택후현재목록에정확히5코어만있고원본결과와달리nativeDataInspector는전체원본행을보여줬다. 실제선택`10.10.22.3:3003 / cpu-25`의7.1%·이름복사/clipboard원복·dirty0확인. 메모리Value#B높은순은.2→.3→.1,그중.2선택은원본Value#A43.7GiB와nativeLinkvar-host=10.10.22.2:3003에연결되어정렬행이섞이지않았다. nativeInspector의A원본3행순서는.3→.1→.2이며Viewsort와독립이다. 링크값은원래설정한instance이며해당host페이지의전체데이터동작을별도로검증했다고표현하지않는다.
- 팝업보완: nativecanvasQt우클릭에서일반Menu.Root를좌표로열던경로를실제BaseUIContextMenu.Root/Positioner/Popup으로교체했다. 같은localMenuitem/Button·가상anchor·nativehit를재사용하며임의delay/새엔진은없다. 닫힘중anchor를유지하고완료후초기화한다. ContextRoot와일반toolbarMenuTrigger의동작및coordinateopen/ESC를포함한Wall단독10tests통과(62.228초);변경없는native15tests/10snapshots와합쳐25tests다. jsdom에없는DOMRect는test에서만표준rectfactory로보완했다. 실제브라우저최종재검증은빌드반영뒤기록한다.

- 최종팝업/테마검증: ContextMenuRoot수정본을반영후실제막대우클릭→Menu지속→ESC종료를다른tool호출사이에도확인했다. 첫막대는실제.3/Value#A47.6GiB,가로Stacked오른쪽막대는같은.3/Value#B109.2GiB를가리켜동일이름의필드도정확했다. 우클릭메뉴224×245px/dirty0,오른쪽경계는x1401..1625/y396..600으로viewport1730×873내부에보정됐다. Dark메뉴는native공통Surface rgb32,35,41·WallInter/Pretendard였고Light/Dark각각열림/종료·강조/단위·색을확인했다. 마지막은Light/CPU Top5/dirty0/dialog0·표시5차트·두폰트loaded=true로복귀했다. 일반사용자탭/기존미저장편집탭은강제갱신하지않았다.
- 최종빌드/체크: productionwebpack519.951초/기존size경고2개로성공(`/tmp/wall-bar105-build-final.log`),기존preview자산만rsync후동일launchd서비스를kickstart했다. 관련native15tests/10snapshots와최종Wall10tests합계25tests통과,ESLint0/Prettier/diffcheck0. targetedTS는HEADbaseline과같은TooltipPlugin2중복ReactPortal타입진단1건만남았으며전역tsc성공을주장하지않는다. 새라이브러리/불필요전체테스트/운영배포/commit/merge/push없음.
- 최종보존/전달: 원본19개Dashboard JSON차이0/index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe유지. preview3317health/QAURL·fixture3318health·actualPrometheus3319/Gluerelay모두200. 기존12번Loki쿼리EOF는baseline부터있던제약으로서fixture/쿼리/Backend를바꾸거나가짜막대를만들지않았다. 사용자가직접Bar조작을검토할수있도록QA UIDwall-bar-qa-105/id93/version1/tagwall-qa-ref105-disposable을보존하고tab1296911577을deliverable로남겼다(원본대시보드와구별). source기본상태이며조회정렬/강조는서버saved변경이아니다. 검토후정리할때이UID/id/title/tag를확인하고해당생성본만제거한다. 이전REF-104 Table QA/host탭은별도미완료검증handoff로유지했으며이번Bar완료로Table남은검증도완료됐다고표현하지않는다.
- 산출물: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-bar-ref105/`의 before.png/light-final.png/dark-final.png/menu-light-final.png/menu-dark-final.png, qa-source.json/qa-created.json/qa-final-model.json/preservation.json과native/projection/final-menu tests·build·lint·format·types/baseline로그. 실제참조/원본version/import/CSS·Canvas·React경계/표시정렬의저장범위는DESIGN_SYSTEM REF-105에반영했다.

## 2026-11-04 — REF-106 Pie / Donut 구성비 표시·탐색

- 분석: 원본19개 Dashboard에는 native piechart가 없었다. 임의로 Gauge/Stat 등을 Pie로 바꾸지 않고 공통 PieChartPanel의 WallTypographyContext 경로를 추가했다. native getFieldDisplayValues→Visx Pie/D3의 reducer/values/limit·필드명·formatter·mapping·links/색/배치·JSON을 유지한다. 기존 native 렌더러는 context 미사용 경로에서 그대로다. Playground 본문은 Dock 이후 로딩하지 못했으므로 공식 Pie/Donut 문서에서 확인한 설계와 구분한다.
- 변경 파일: 기존 `plugins/panel/piechart/PieChartPanel.tsx`; 신규 `wall-modern/charts/WallPieChart.tsx`, `WallPieActions.tsx`, `pieModel.ts`, `pieModel.test.tsx`, `pie.css`. 공통 DESIGN_SYSTEM REF-106/AGENTS 기록을 추가했다. 사용자 기존 대량 미커밋 및 index를 보존하며 다른 패널/쿼리/Grid를 수정하지 않았다.
- 구현: 기존 RadialGradient/조각 scale 외형 대신 단색 SVG·정돈된 얇은 도넛·작은 단위/MeterValue·중립 중앙 정보·Wall palette/타이포그래피/Surface를 사용한다. 명시 fixed/threshold/mapping/색 override는 보존하며 자동 classic palette만 표시 투영한다. native VizLayout 위치/width/스크롤과 옵션 displayLabels/legend values를 재사용하되 긴 이름/정렬된 값·비율/항목별 menu를 자체 DOM으로 구성한다. 레이블은 실제 Wall font로 크기·충돌을 확인하고 생략할 뿐 조각은 합치거나 제거하지 않는다.
- 정확성: 소스 전체 비율을 계산하고 작은 양수 반올림은0% 대신<최소표시비율로 표시한다. 동일 단위의 비음수 유한값·mapping 없음·비율 단위가 아닌 경우만 native formatter의 표시 합계다. percent/percentunit·혼합단위는 항목 수이며 혼합단위는 수치 비율임을 안내한다.0합계는 가짜100% 없이 중립track/비율없음, 음수/NaN/Infinity/overflow는 구성비 계산불가+원본 범례를 유지한다. 정상 값을 얻으려고 clamp/원본 보정하지 않는다.
- 상호작용: Hover/범례 선택 ID별 강조·native DataHoverEvent/Clear, actual value+ratio Tooltip·기존mode/sort/hideFrom 설정을 유지한다. 실제 Base UI ContextMenu1.0.0/local shadcn Menu item/Button/Popover와 native 색상picker/FieldDisplay.getLinks를 연결한다. 단일 링크 조각은 native 직접이동, 다중 링크/우클릭은 실제 링크만 제공한다. native Inspector는 전체 패널 Data이므로 조각별 원본 필터 검사로 설명하지 않는다. name 중복 시 native name 기반 hide/color를 숨긴다. kiosk/readOnly 색상 변경과 kiosk inspector는 제한하고 일반 복사·조회·실제 링크는 유지한다. 강조는 임시 조회 상태, 색상은 기존 native dirty/저장 경로다.
- QA: 기존3317 local API에 `[QA REF-106] Wall Pie / Donut 검증 — 임시` UID wall-pie-qa-106/id94/tag wall-qa-ref106-disposable을 생성했다. source Wall/Prometheus uid be79jb2q0bjlsf를 통해 실제10.10.22.10:3001의 cube3호스트 가용메모리·단일호스트사용/가용·120 CPU core 원본시리즈를 조회한다. 작은긴레이블·실제메모리×0·부호반전은 **명시적 QA 시나리오**이며 제품 쿼리/환경을 바꾸지 않는다. 링크는 실제 instance label을 native로 전달한다. 원본을 수정하지 않고 검토용 QA만 저장한다.
- 관련 테스트: native PieChartPanel/migrations9개와 Wall13개 합계22tests/3suites 통과(32.679초). row values/limit·tiny categories·0/음수/NaN/Infinity/overflow·단위/합계·명시색/mapping·링크/Inspector·조회선택불변을 확인했다. 신규 source targeted TS0/ESLint0이며 전체 저장소 tsc 또는 전체 패널 회귀 성공을 주장하지 않는다. 실제 브라우저/최종 빌드/보존 결과는 아래에 이어 기록한다.
- 실제 브라우저 결과: 정상 데스크톱1730×929/DPR1에서 Light/Dark를 확인했다. 두 자체호스팅 폰트 loaded=true, 실제3호스트/2메모리항목/120코어/작은Pie의 조각·범례 수는 각각3/2/120/3으로 일치했다. Other 합치기0, 작은Name/Value/Percent 레이블0개로 안전하게 생략하고 실제값·전체이름은 범례title/Tooltip/메뉴에서 유지했다.0상황은 조각0/원본3행/비율—, 음수는 조각0/원본3행(-86.9·-109·-113GiB)/계산불가안내를 확인했다. 실제 값은 시간에 따라 변하며 QA0/음수는 의도적으로 표시된 검증용 식이다.
- 반복 디자인 검토: 중앙 MeterValue의 wrapper span에 보조 설명 색이 상속되던 selector를 caption 전용으로 분리했다. 작은 조각은 arc폭에 따라 separator를 줄여 값의 형상을 잃지 않게 했다. 메뉴가 열린 동안 target 조각을 강조하고 메뉴 종료/대상 소실 시 상태를 정리했다. Pointer Tooltip의 Surface 누락 원인은 기존 Visx TooltipWithBounds가 unstyled=true일 때 전달 style을 제외하기 때문이었다. 위치/경계 엔진은 그대로 두고 공통 토큰 기반 Emotion class로 Surface를 적용했다. 최종 실제 Tooltip400px/단일border/약한shadow/전체 긴 이름 줄바꿈66px를 확인했다. 다른 차트 Tooltip은 변경하지 않았다.
- 실제 액션/저장: 범례 선택은2개 조각을 dim하고 실제선택113GiB/36.6%를 중앙에 표시하되dirty0이다. 클립보드 이름복사 확인 후 기존 클립보드를 복원했다. 단일 링크는 실제03호스트상세UID eec03wg41s35sa로 var-host=10.10.22.3:3003를 전달해 이동했고, 다중 링크도 실제instance를 유지했다. native Data Inspector는 패널의 원본Frame(.3 109GiB)로 열리는 것을 확인했으며 선택 조각만 필터된 검사라고 표현하지 않는다. 색상blue 변경→native 저장Drawer→저장(version4)→새로고침에서 byName color fixed blue Override가 유지되고 쿼리targets는원본QA와동일했다. 검증후 **본 작업이 만든 QA만** baseline으로복원해version5로보존했다. native변경취소도확인했다. 항목숨김3→2조각/hidden1→숨김선택초기화3조각/hidden0·취소버튼0을 확인했다.
- 메뉴/권한: 실제BaseUIContextMenu가 tool호출사이에도유지되고ESC뒤닫힘을확인했다. Light메뉴224×337px(링크2개포함),Dark하단메뉴224×264px/x1443/y657로viewport안에서위치보정됐다. kiosk에서는색상변경·패널데이터검사없음/이름복사·조회강조·실제링크유지,ESC일반복귀후대시보드설정복원을확인했다. 새로운권한체계나관리UI는추가하지않았다.
- 최종 체크/빌드: 최종22tests/3suites통과(9.827초),신규source+test targetedTS0/ESLint0/Prettier/diffcheck0. productionwebpack최종68.603초/기존size경고2개로성공했다. 최초캐시없는빌드는364.775초였으며반복시각검토를위한filesystemcache는/tmp전용wrapper에만설정했고저장소빌드설정/의존성을바꾸지않았다. 기존launchd preview만kickstart/자산rsync했고3317health/QA·3318health·3319CCVM/Glue읽기경로모두200이다. 소스11.4기반과기존previewbinary9.2.0의불일치는이전환경제약이며버전업그레이드또는11.4binary실행검증을주장하지않는다.
- 보존/전달: 원본19개Dashboard JSON차이0/index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe유지. 사용자기존미저장/편집탭을강제갱신하지않았다. QA UIDwall-pie-qa-106/id94/version5/tagwall-qa-ref106-disposable과tab1296911584를실제검토용deliverable로보존했다. nativepiechart를사용하는Wall공통경로에적용하며특정UID/ID예외가없다. 현재원본19개에는Pie가없으므로기존대시보드를임의로전환하거나모든기존패널이Pie로바뀌었다고표현하지않는다. QA정리시UID/id/title/tag를확인하고해당생성본만대상으로한다. 이전Bar검토탭과Table미완료handoff는유지했다. 사용자미커밋과섞지않기위해stage/commit/merge/push하지않았다.
- 산출물: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-pie-ref106/`에before.png/light-final.png/dark-final.png/menu-light-final.png/menu-dark-final.png/tooltip-light-final.png/edge-cases-light.png/edge-cases-dark.png·browser-final.json·qa-source/created/native-saved-color/final-model·preservation.json·tests/build/types/lint로그를남겼다. 실제참조·원본/import·CSS와React/Visx경계는DESIGN_SYSTEM REF-106에기록했다.

## 2026-11-04 — REF-107 XY / Scatter 및 Histogram 정밀도·탐색

- 범위/보존: 사용자 최신 XY/Scatter/Histogram 요청에 따라 실제 활성 XY v2 및 legacy fallback과 native Histogram의 공통 표시 계층을 개선했다. 원본19개에는 두 타입이 없어 임의 타입 교체/재저장 없이 실제 Prometheus를 조회하는 QA UID `wall-analytic-qa-107`/id95/title `[QA REF-107] Wall XY / Histogram 검증 — 임시`/tag `wall-qa-ref107-disposable`를 생성했다. 저장 전용 QA가 아닌 실데이터 조회용이며 v2 canonical model에11.4.0-pre pluginVersion을 명시했다. Query/Transform/Panel JSON·Grid·저장 엔진을 바꾸지 않는다.
- 분석/근거: Dynatrace Playground는 Dock만 보여 실제 차트 실측을 못했다. 공식 DotSeries/HistogramChart/ChartInteractions와 기존 source/native uPlot1.6.31 구현을 구분하여 DESIGN_SYSTEM REF-107에 기록했다. 현재 feature toggle autoMigrateXYChartPanel=true여서 기존 legacy scatter만 수정하면 실제 화면에 반영되지 않으므로 v2를 함께 처리했다. 새 차트/drag 라이브러리는 없다.
- 실제 변경: 신규 charts/analytic.ts·WallAnalyticFrame.tsx·WallAnalyticActions.tsx·analytic.test.tsx; native xychart의 XYChartPanel/XYChartTooltip/scatter 및 v2 동명 파일/utils, HistogramPanel/Histogram/HistogramTooltip. Wall 공통 Canvas 폰트·격자·자동 팔레트·범례 항목/통계·Tooltip을 연결하고 실제 Base UI ContextMenu로 포인트/구간 요약·복사·실제 링크·native 전체 패널 Inspector를 제공했다. 문법상 Base UI Gauge/차트 primitive가 있다고 표현하지 않는다. 새 CSS 파일 없이 기존 공통 스타일/토큰을 재사용했다.
- 정확성/포인터: native qt hit/실제 source row와 색 cache를 사용하여 Tooltip/메뉴/링크와 circle/square/가변 size·명시 opacity/threshold/override를 보존했다. null·비유한 포인트를0으로 바꾸지 않는다. 가까운 대용량 축 값이 같은 문자열로 겹치는 경우 자동 label 소수만 늘리며 명시 decimals/mapping과 Tooltip formatter는 그대로다. XY 확대/이동 mode 및 Alt pan은 native posToVal/setScale/setData로 조회만 변경하고 destroy/up/blur에서 listener를 해제한다. 원본 시간 URL·dirty·Grid 입력을 변경하지 않는다.
- Histogram: 기존 buildHistogram/bucketSize/count/offset/combine/stacking을 유지한다. 단일 bin getBucketSize1의 NaN scale factor, 잘못된 min/max row 및 count 링크 field index,0빈도 원본 배열 mutate를 수정했다.2px fixed separator/단일 bin0gap과 공통 plotPaddingRight로 전체 bin span/마지막 tick을 정확히 보인다. 실조작 중1px drag로 native inward rounding이 range를 역전하여 chart가 비는 것을 확인하여 native6px threshold와 실제 bin origin 기준 outward zoom을 적용했다. cursor.dataIdx를 실제 interval로 연결하고 native 누적 bar 내부 focus를 사용하여 막대 오른쪽 절반이 다음 bin Tooltip으로 바뀌거나 bar 내부에서 값이 사라지는 문제를 방지한다. derived bin에는 원본 sample row 링크를 추측 연결하지 않는다. 기존 native 불규칙 bin/log 렌더러를 전면 재개발하지 않는다.
- 초기 실제조작: 정상 데스크톱1730×929/DPR1에서 actual host CPU/Memory/Load 포인트의 rectangle zoom과 명시 이동 mode pan·reset을 확인했다. CPU2.57%/Memory47.7GiB/Time22:05:15/Load1.19의 동일 포인트 메뉴와 실제호스트 link var-host=10.10.22.3:3003를 확인하고 표시값 TSV 복사 후 기존 clipboard를 복원했다. circle/square·가변 크기·좌우 단위 축·범례 suffix는 실제 native v2다. 시각적 axis 정밀도와 Tooltip 기본 source decimals는 다른 목적이며 Tooltip 값을 임의로 세분화하지 않는다.
- 테스트/빌드: 최신 관련4 suites25tests 통과(61.984초), native XY/Histogram migration/Tooltip와 Wall source immutability·bin boundary/offset/한구간 zoom·native bar focus/shape/size/links/색을 포함했다. ESLint/Prettier/diff-check 통과. targeted TypeScript는 baseline HEAD에도 동일한 TooltipPlugin2/중복 ReactPortal3건만 남으며 새 진단0이다. 전체 tsc 통과라고 보고하지 않는다. production webpack의 기존size2경고 및 stale Browserslist/mock 경고는 별도다.
- runtime 제약: frontend11.4-pre이나 기존 preview backend binary는9.2.0이다. native 저장 시 pluginVersion/XY11.1 migration을 다시 적용할 수 있어 이 혼합 runtime에서 v2 native 저장→재로딩까지 검증했다고 주장하지 않는다. 기존 version/feature toggle/backend/migration을 우회 변경하지 않았다. source 저장 모델 변경은0이다.

- Histogram 조회 범위: 실제1% bin 내부20px 선택 후0..1% bin/Count33이 그대로 확대되며 빈 차트가 되지 않는 것을 확인했다.1px 미세 drag는 범위를 바꾸지 않고 같은0..1%·Count33 Tooltip을 표시했다. Histogram에는 native bin 경계와 충돌하는 자유 pan을 추가하지 않고 구간 확대/초기화만 제공한다. XY의 양축 zoom/pan과 분리한다.

- 최종 브라우저:1730×873/DPR1에서Light/Dark의2개XY+3개Histogram Canvas를확인했다. XY2시리즈의범례클릭으로메모리aria-pressed=false→다시true복원,실제포인트CPU2.54%/Memory47.7GiB/Time23:15:15/Load1.44와host=10.10.22.3:3003링크를확인했다. Histogram첫bin오른쪽부분을클릭해도정확히0..1%/Count31이며단일0..100%bin은Count120이다. derivedbin메뉴에는가짜source link가없고native패널데이터확인은실제InspectorData탭의원본Time/사용률에진입했다. 두테마메뉴/ESC·Tooltip·마지막100%tick·빈도표시를확인했다.최종조회dirty=false/dialog0,실제이동모드2개는XY에만있다.자체WallInter/WallPretendard폰트loaded=true다.메뉴종료직후DOM진단의menu1은exittransition중node이며최종스크린샷에서는메뉴가닫히고nativeTooltip만남았다.
- 최종배포/보존: productionwebpack51960ms/기존size경고2개로성공(`/tmp/wall-analytic107-build-final10.log`),기존previewpublic/build에rsync하고동일launchdpreview만kickstart했다.3317health/QA화면·3318fixture·3319CCVM/Glueproxy모두HTTP200이다.원본19개DashboardJSON차이0/index0423fc0071bb143a81f8064df2bec6e8f3a43afe유지,운영/고객DB·backend/포트·기존사용자미저장탭은변경하지않았다.기존사용자미커밋과섞지않기위해stage/commit/merge/push하지않았다.
- 산출물: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-analytic-ref107/`에before/light-final/dark-final·histogramLight/Dark·binTooltip/메뉴·XY메뉴/zoom/pan스크린샷과qa-source/final-model/runtime/browser-final/preservationJSON·tests/build/types및baseline/lint/prettier로그를남겼다.현재QA탭1296911591은검토용deliverable이며기존Pie/Bar검토및Table미완료handoff도유지했다.임시QA정리시UID/id/title/tag를먼저확인하고이생성본만대상으로한다.

## 2026-11-04~05 — REF-108 시각화 공통 Color & Format

- 범위/작업환경: 기존 codex/wall-autodev-20261030 Worktree와 사용자 index/미커밋을 유지했다. Time Series/Gauge/Stat/Table/Bar/Pie/XY의 공통 표시·설정 연결을 대상으로 하며 Grid·좌표·backend/버전·포트·운영DB는 변경하지 않았다. 실제 참고/원본/버전/import·CSS와 기능 경계는 DESIGN_SYSTEM REF-108에 표로 기록했다. Playground는 브라우저에서도 Dock만 표시되어 공식 ChartColoring/Units and formats 문서와 구분했다.
- 공통 원본: 신규 colorSystem.ts에4팔레트 Light/Dark·categorical8색·자동색 보호 정책을 모았다. chartTokens/meterTokens와 TS/Bar/Pie projection에서 같은 원본/guard를 사용하며 XY/Histogram은 기존 공통 categorical 경로로 이어진다. 기존 TS8색 순서·native index/byName 배정은 유지한다. 일반 Gauge accent만 같은 카탈로그에 정렬하고 Threshold/명시RGB·matchingOverride/색 mapping/continuous·Shades/Scheme/Hue·명시 paint는 그대로다. 저장된 green/80은 사용자 의도를 추측하지 않아 보존한다.
- 실제 UI 구조: 신규 packages/grafana-ui/.../ColorPicker/ColorPickerPresentation.ts의 optional context와 WallColorFormatProvider.tsx를 AppWrapper ThemeProvider 안에서 연결했다. native ColorPickerPopover/SeriesColorPickerPopover 한 경로를 로컬 shadcn Tabs/Button·실제 Base UI1.0.0으로 표시하므로 범례/일반 Field Color/Threshold/Mapping이 같은3탭/4팔레트/상태색 UI를 쓴다. 기본 NamedColorsPalette·SpectrumPalette·plugin extra tabs·enableNamedColors/핸들러/기존 FocusScope를 유지한다. provider가 없는 native fallback은 기존 UI이며 native color mode ID나 새로운 저장 키를 추가하지 않는다.
- 포맷: 신규 formatSystem.ts에서 native formattedValueToString/getValueFormat 계약을 재사용한다. Meter 경계값의 regex 소수0 제거를 없애 명시2자리를 유지하고 Stat/Meter 제목·Table 텍스트·Pie 계산 비율의 표시 계약을 연결했다. source 값/배열/단위 ID·formatter/mapping은 변경하지 않는다. native percent/percentunit·s/ms/µs·B/KiB/MiB/GiB/TiB·bits/bytes rate·iops(io/s)/사용자 IOPS suffix/일반 숫자를 테스트했다. Bar도 같은 Wall 범례 항목으로 표시하며 native calcs/위치/정렬·없는 작업 숨김을 유지한다. Pie 구성비 전용 열은 같은 토큰/Tooltip을 사용한다.
- 실제 발견/수정: 사용자 지정 탭을 열자 native SpectrumPalette.useThrottleFn이 mount 즉시 기존 색을 다시 onChange해 팝업이 닫히고 dirty가 생겼다. optional notifyOnMount=false를 Wall adapter에만 전달하여 실제 색 수정 전에는 발행하지 않게 했다. named/hex를 RGB만 비교해 임의 무시하는 방식은 쓰지 않았고 실제 named 선택·사용자 HEX callback은 그대로다. Native fallback의 기본 notify 동작도 보존했다. Series Popover 안 root는 border/shadow/padding0으로 조정해 이중 카드를 제거했으며 실제 outer280px/inner262px·outerBorder1/innerBorder0/shadow none을 확인했다.
- 실데이터 QA: `[QA REF-108] Wall 공통 색상·포맷 검증 — 임시`, UID wall-color-qa-108/id96/version1/tag wall-qa-ref108-disposable를 생성했다. 실제 Prometheus 쿼리의 Stat 메모리470.44GiB/decimals2·Gauge CPU3.15%·Table960행/7열·기존 TS/Bar/Pie/XY를1730×873/DPR1에서 확인했다. 원본 대시보드의 타입이나 쿼리를 임의 교체하지 않았고 긴 자원명은 이전 QA가 명시한 QA 라벨임을 제목에 남겼다. arbitrary units를 실제 CPU에 붙이거나 가짜 숫자/추세를 만들지 않았다.
- 실제 상호작용: 범례/Threshold(red)/Mapping(gray)에서 같은 picker가 열리는 것과 native80 임계치·percent0–100/최소0/최대100/decimals2 보존을 확인했다. Wall/기본/사용자 지정 탭을 넘겨도 dirty0이며 Spectrum Color/Hue/Alpha·RGB 입력이 남아 있다. Indigo 선택은 실제 TS/범례를 함께 바꾸고 native dirty/일괄 취소로 연결됐다. Dark에서 #123456 직접 입력→선택기 header #123456→변경 사항 UI1→전체 취소0을 확인했다. 패널 편집기의 취소로 조회에 복귀한 뒤 남은 native 대시보드 draft도 명시적 전체 취소로 정리했으며 이를 저장했다고 표현하지 않는다. 저장 API/모델은 수정하지 않았고 혼합 backend9.2/frontend11.4 runtime에서 native XY 저장 roundtrip을 새로 검증한 것은 아니다.
- 최종 화면: Light/Dark 각각7종을 비교했고 일반 Gauge 진행색은 공통 Cobalt Light #3c63e6/Dark #7ca2ff다. 숫자470.44GiB/3.15%·Pie 실제 비율/전체309GiB·XY 양축 단위·TS통계는 그대로다. 최종 Light/dirty0/dialog0/picker0/폰트 WallInter·WallPretendard loaded=true, 공통 시리즈 범례6행/Pie3조각/XY Canvas1을 확인했다. 사용자 기존 미저장 탭은 강제로 갱신하지 않았고 이 확인은 명시적 QA 탭1296911598에서 수행했다.
- 최종 검증: 관련6suites92tests 통과(33.907초), 신규/수정 target TypeScript 진단0, ESLint/Prettier/diff-check0. 최초 테스트의 기존 Cobalt hardcode 및 테스트 ThemeContext 기본 Dark와 명시Light 불일치는 fixture를 수정했으며 제품의 단위/상태를 바꾸어 우회하지 않았다. productionwebpack 최종62.219초/기존size경고2개로 성공했다. 기존 자산만 rsync 후 같은 launchd preview를 kickstart했고3317 health/QA,3318fixture,3319CCVM/Glue 모두 HTTP200이다.
- 보존/전달: 원본19개 Dashboard JSON 차이0, index0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지. 신규QA도 임시 편집을 저장하지 않아 server version1/원래 옵션으로 보존했다. 기존 사용자 변경과 섞지 않기 위해 stage/commit/merge/push하지 않았다. QA108을 실제 검토용deliverable로, 이전XY/Pie/Bar와Table미완료handoff도 유지했다. 임시QA 정리 시UID/id/title/tag 확인 후 이 생성본만 대상으로 한다.
- 산출물: `/Users/hongwookryu/.codex/visualizations/2026/11/04/wall-color-ref108/`의 before/light-top/light-bottom/dark-top/dark-bottom/picker-light/picker-dark/picker-custom/threshold-picker-light/mapping-picker-light PNG·browser-final/qa-source/created/final-model/preservation JSON·build/tests/types/lint/prettier 로그. 구현 파일은 colorSystem/formatSystem/WallColorFormatProvider·native ColorPickerPresentation/ColorPickerPopover/SpectrumPalette·AppWrapper, chartTokens/meterTokens/TS/categorical/pieModel·meterPresentation/MeterValue/WallStatContent/tablePresentation·OptionsUI fieldColor 및2개 관련 테스트다.

## REF-109 — Variables / Annotations UX (2026-11-05)

### 완료

- 공통 `WallVariableControl` 표시를 실제 option label 기반으로 정리했다. 변수명/선택값을 각각 말줄임 처리하고, 복수 선택은 첫 값+N개 배지·전체 이름 title, All/미선택은 별도 상태로 표시한다. native option에 이름이 있는 빈 값과 숫자0도 보존한다. loading/error/취소/검색/virtualized Select/custom value/다중 선택 onBlur/종속성/URL은 기존 Scenes `VariableValueSelectWrapper` 경로다. 단일 선택 즉시 Popup을 강제 제거하는 시도는 native focus/blur와 충돌해 제외했다.
- 시계열 native Canvas는 그대로 재사용하며 Wall Context에서 주석 선/기간 채움/marker 표현만 투영한다. 점선+원형 시점, 실제 폭의 기간 막대, 겹친 marker 개수·원본 이벤트 선택 목록을 구현했다. native 시각·색·태그·timezone·alert/avatar와 HTML sanitize를 유지한다. 이벤트를 데이터 수준에서 합치거나 새 시간/값을 만들지 않는다.
- `WallAnnotationPopover`는 로컬 shadcn 구성의 실제 Base UI Popover/Button 1.0.0을 사용한다. native portal container를 전달하며 기존 공통 Motion/reduced-motion/Surface/타이포그래피를 재사용한다. Keyboard Enter/ESC와 click으로 상세 탐색, native `AnnotationEditor2`/PanelContext 권한과 편집·삭제 handler를 그대로 연결한다. Kiosk는 상세 조회를 유지하고 edit/delete만 숨긴다. Context 없는 native marker/tooltip 및 xymark Canvas는 기존 경로다.
- uPlot setScale/setSize에서 rAF로 marker 위치를 다시 투영하고 pending rAF/timeout을 cleanup한다. 데이터/쿼리/48열/Grid/저장 로직은 수정하지 않았다.

### 변경 파일

| 범위                | 파일                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 변수                | `public/app/features/wall-modern/toolbar/WallVariableControl.tsx`, `toolbar/toolbar.css`                                                                 |
| 주석 공통 표시      | `public/app/features/wall-modern/eventTokens.ts`, `charts/annotationModel.ts`, `charts/WallAnnotationPopover.tsx`, `charts/WallAnnotationDetails.tsx`    |
| 공통 primitive 연결 | `public/app/features/wall-modern/components/ui/popover.tsx` — 선택적 portalContainer, 기본 caller 계약 유지                                              |
| native adapter      | `public/app/plugins/panel/timeseries/plugins/AnnotationsPlugin2.tsx`, `plugins/annotations2/AnnotationTooltip2.tsx`                                      |
| 검증/기록           | `public/app/features/wall-modern/charts/annotations.test.tsx`, `toolbar/WallDashboardToolbar.test.tsx`, `DESIGN_SYSTEM.md` REF-109, `AGENTS.md`, 이 기록 |

### 검증 결과

- 관련 Jest 3 suites / **18 tests 통과**: native 변수 single/multi/All/숨김/readOnly/동적 정의·URL/시간 동작, 유효한 빈 옵션/숫자0, overlap source identity/순서/색상 보존, 새 WIP 분리, 시점/기간·HTML sanitize·native 권한/태그, 기존 DashboardAnnotationsDataLayer. `/tmp/wall-events109-tests-final.log`.
- 대상 ESLint 오류0. production webpack 성공, 기존 bundle size 경고2개. 마지막 빌드 `/tmp/wall-events109-build-last.log`. 대상 TS는 새 진단0이며 기존 native `createPortal(markers)`의 중복 React 타입 진단1건이 남는다. 같은 compile host에 **HEAD 원본 파일을 주입**해 동일 오류가 원래271행에서도 발생함을 확인했다. 전체 tsc 통과로 표현하지 않는다.
- Chrome 정상 데스크톱1730px, 실제 Prometheus relay 데이터 사용: host 전체→`10.10.22.1:3003`, 종속 cpu 목록→0 선택 후 URL/패널 재조회 확인. All 선택 시 `$__all` 유지. QA custom400개 중399 검색·추가→실제3개 상태/title/URL 확인. Catalog는 명확히 QA 목록이며 운영 자원 수치가 아니다.
- 원본 **01 `fec03giqwtw5cf` / 05 `aec03x1adsi68f`** Light/Dark 확인. 01의 숨김 변수5개를 노출하지 않았으며 05의 scvm URL 빈 값/미선택을 자동 수정하지 않았다. 현재 scvm 선택기에 실제 옵션3개가 조회됨을 확인하되 선택을 강제하지 않았다. 기존5탭 유지. 원본 annotation query는 enable=true/hide=true이고 최근7일 이벤트0건이다.
- 주석 검증은 별도 local native API dashboard **`wall-events-qa-109` id97 / version5**와 QA 이벤트5건(id1–5)에만 실시했다. 원본 두 dashboard UID 주석은 최종0건이다. 5개 이벤트→원형시점2개+겹친2개 목록+독립기간1개로 원본 개수를 보존한다. point/period 상세시간, 겹친 실제 row 선택, 기존 편집기 진입·취소, enable off→marker0/on→복원, chart drag Zoom→URL/보이는 marker 좌표 재투영, 키보드 Enter/ESC 확인. Kiosk에서도 상세를 열 수 있고 edit/delete0, popup ESC가 kiosk를 임의 종료하지 않는 것 확인. 조회/선택/취소 후 native dirty0, 마지막 QA browser error0.
- QA 저장 시간은 고정 ISO 범위로 남겼다. 처음 fixture에서 epoch 문자열을 saved time으로 넣으면 native date parser가6시간으로 fallback하여 **QA 설정만 ISO로 수정**했다. 제품 time parser나 원본 dashboard time은 바꾸지 않았다. 최종 전달 탭은 명시적 절대 URL 범위로 확인했다.
- 원본19개 Dashboard JSON **모두 동일**, 사용자 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe` 유지. 기존 사용자 미저장 탭은 강제 갱신하지 않고 별도 확인 탭을 사용했다. 혼재된 사용자 작업을 커밋에 섞지 않았으며 새 커밋 없음.
- 3317 최신 빌드 rsync 및 기존 launchd preview kickstart 완료. `/api/health`와01/05 route HTTP200,3318 health200,3319 실제CCVM/Glue relay query200. fixture 서비스는 재시작하지 않았다. backend/운영 DB/고객 환경/포트 변경 없음.

### 벤치마크·남은 검증 제약

- Dynatrace Variables Playground iframe에서 변수명/값, 검색 가능한 실제4개 cluster 옵션, 다중선택·All·종속 변수 구성을 직접 확인했다. 참조 사이트 데이터나 설정은 변경하지 않았다. Annotations Playground는 Dock만 보여 내부 상호작용은 미확인; 공식 AnnotationsChart 문서의 시점/기간/overlap tooltip 계약을 참고한 것과 구분했다. Strato 패키지는 도입하지 않았다.
- local runtime은 frontend11.4-pre/backend9.2.0 혼합이다. QA 태그 layer2개를 사용할 때 동일 이벤트가 중복 조회되는 기존 환경 제약이 발견됐다. 직접 API에서 `tags=x`는3건, `tags[]=x`/`tags[0]=x`는 필터되지 않은4건이었다. 브라우저 요청 형식을 직접 추적한 것은 아니므로 정확한 내부 발생 지점까지 확정하지 않는다. **태그 기반 query 호환성 전체 검증 완료라고 보고하지 않는다.** 쿼리를 우회/재작성하지 않고 원본01/05와 같은 dashboard-scoped native query로 QA를 검증했다. 개별 native layer의 색·데이터는 임의 dedup/보정하지 않는다.
- 원본01의 기존 일부 조회 오류와05의 SCVM 미선택은 수정 대상이 아니며, 주석0건인 원본에서 실제 이벤트 표시까지 검증했다고 표현하지 않는다. native 주석 편집·삭제 저장을 원본에 실행하지 않았다.
- 증거: `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-events-ref109/`의 `annotations-light.png`, `annotations-dark.png`, `variables-search-light.png`, 원본 Light/Dark 캡처, JSON baseline/QA source/events/verification-final.json.

## REF-110 — 변수 드롭다운 중첩·스크롤 수정 (2026-11-05)

- **원인 실측:** 실제 사용자11번 로그 탭1296911505에서 Wall dialog 안 검색창과 별개로 native option7개가 body portal에 렌더링됐다. native 메뉴를 열면 body.style.overflow=hidden, native 메뉴 Escape 후 빈 값으로 복원됐다. SelectBase의 menuPortalTarget=document.body와 menuShouldBlockScroll=true 경로를 확인했다.
- **수정:** 새 opt-in `packages/grafana-ui/src/components/Select/EmbeddedSelectContext.ts`를 WallVariableControl의 native VariableValueSelectWrapper에만 제공한다. `SelectBase.tsx`의 해당 범위에서 portal과 scroll lock을 끄고 menuIsOpen/autoFocus/높이/ESC를 host popup에 연결한다. `resetSelectStyles.ts`는 inline flow와 세로 배치, `SelectMenu.tsx`는 기존 virtualized 목록의100% 폭/식별 속성을 제공한다. 비 Context caller는 원래 native 동작을 유지한다. 새 선택 엔진이나 UI 라이브러리 없음.
- **보존:** 기존 query/옵션/검색/variable dependency/URL/All/custom value/가상화·권한·hide 유지. multi 종료 전 실제 combobox blur로 native Scenes onBlur commit을 완료하고 source 설정을 새로 복제하지 않는다. 단일 선택 직후 강제 unmount는 추가하지 않았다. Body overflow를 전역 CSS로 덮지 않는다.
- **CSS:** `toolbar/toolbar.css`는 한 popup 안의 목록 Shadow/중첩 Border 제거, 검색 Control Border·Focus, overscroll containment만 변경한다. 내부 검색·메뉴를 별도 포털로 분리했던 구조를 수정한 작업이며 CSS-only 아님.
- **실제 검증:** 사용자 탭 dirty0 확인 후 최신 빌드 반영. option7개가 모두 dialog 내부이고 body overflow=''임을 확인. 실제 wheel로 list scrollTop0→19, 본문도0→173(팝업 열린 상태 및 닫힌 뒤) 확인. 별도 기존 QA400개에서 End→scrollTop14597 및 마지막400번째 옵션 노출,399 검색/추가 후 바깥 클릭→3개 선택·native URL 적용·dirty0 확인. 사용자 원래 ERROR 선택과 URL 보존. 새 테스트용 Dashboard/API 데이터는 만들지 않았다. 기존 Loki query EOF는 이 작업과 별개의 환경 오류로 수정하지 않았다.
- **검증:** `WallDashboardToolbar.test.tsx`13개 통과. option이 dialog의 자손인지 회귀 assertion 추가 및 popup 진입 전 body scroll 상태가 그대로인지 확인. Jest jsdom에서 앞선 다른 popup 테스트의 lock 상태가 남을 수 있어 절대값 대신 진입 전후 보존을 검사하고 실제 Chrome에서는 overflow 빈 값까지 실측했다. ESLint0, production webpack 성공(기존 size 경고2). 대상 TS의 react-window List/React 중복 타입 진단은 별도 로그에 남기며 전체 tsc 통과로 표현하지 않는다.
- **반영:** 기존 launchd preview kickstart 및3317 health200, 기존 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 보존. 사용자 미커밋 작업과 혼재하므로 임의 커밋 없음. source는 위 Select4개+WallVariableControl/toolbar.css/toolbar test와 기준표/AGENTS/이 기록. 실제 화면 `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-variable-ref110/log-variable-fixed.png`.

## REF-111 — 변수 툴바 외곽 제거 및 본문 밝기 조정 (2026-11-05)

- 사용자 요청의 흰 외곽 박스를 toolbar.css에서 투명 배경/투명 border/무그림자로 변경했다. 개별 컨트롤 배경 및 입력/드롭다운·시간 기능·geometry는 유지한다.
- surfaceTokens.ts에 dashboardBackground Light #fafafb / Dark #17191e를 정의하고 modern.css에서 대시보드 본문에만 적용했다. app background와 관리·목록·사이드바·패널·차트 토큰을 변경하지 않았다. 새 Base UI/shadcn primitive/import 없음, CSS·색상 토큰만 조정.
- webpack 성공(기존 size 경고2), 대상 ESLint0, 기존 launchd preview 반영 및3317 health200. 큰 기능 회귀 테스트는 추가하지 않았다.
- 실제 Chrome11번 로그 화면 새 탭에서 toolbar background/border 투명·Shadow none, 가시 canvas-content background RGB250/250/251 확인. Dark RGB23/25/30 유지 후 Light 복원. 원래 사용자 탭에 미저장1건이 있어 갱신하지 않았고 새 탭은dirty0으로 전달했다. 기존 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 보존. 임의 저장/커밋 없음.
- 스크린샷: `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-surface-ref111/toolbar-background-light.png`.

## REF-112 — 대시보드 배경 #F8F9FA 지정 (2026-11-05)

- 사용자 지정으로 surfaceTokens.ts의 light.dashboardBackground만 #fafafb→#f8f9fa 변경. Dark/개별 패널/컨트롤/관리·목록 화면은 그대로다. REF-111의 본문 한정 CSS 연결을 재사용한다.
- production build 성공(기존 size 경고2), launchd preview 반영·3317 health200. 미저장0인 별도 검증 탭만 갱신했고 실제 main/canvas-content computed background RGB248/249/250 확인. 사용자 미저장 탭은 갱신하지 않았다.
- 화면: `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-surface-ref111/dashboard-f8f9fa.png`. 색상 한 값 변경으로 별도 기능 테스트는 추가하지 않았다.

## REF-113 — Dashboard Control Bar / Title 재설계 (2026-11-05)

- 요청 명세에 따라 공통 Toolbar를 필터 / 시간·갱신 / 관리 작업으로 재구성했다. 새 `WallAdaptiveFilters.tsx`는 실제 컨트롤·가용 폭·overflow trigger·gap을 측정해 prefix와 overflow를 나눈다. focus/열린 popup은 배치 고정, 정의 추가·삭제 시 표시 목록 갱신, 미지원 ResizeObserver는 전체 표시다. 숨겨진 변수도 native activation을 유지하며 실제 native data-layer control은 독립적으로 남긴다.
- 변수는 반복 아이콘 대신 이름: 선택값/실제 개수로 정돈하고 native 변수 엔진/검색·멀티·All·텍스트·의존성·URL/REF-110 inline popup을 재사용한다. 실제 숨긴 변수만 overflow count에 포함한다. 좁으면 모든 필터가 접힐 수도 있으며 순서를 임의 변경하지 않는다.
- 제목은 Control Bar 아래의 기존 공통 heading을 유지하면서 실제 title/description만 사용한다. generic 설명·05 UID별 설명 fallback 제거. 긴 제목·설명 wrap, breadcrumb ellipsis. 시간 label은 상대 범위 표시만 한글화하고 native 시간 parser/갱신/저장 로직 보존. 긴 절대 날짜 UI의 최대 폭과 전체 title을 제공한다.
- CSS 중복을 정리하고 공통 그룹 단위 wrap/container query를 사용한다. refresh 단독 줄바꿈 없음. native grid child의 최소 폭 때문에 실제 viewport보다 큰 Toolbar가 생성되던 것을 해당 wrapper min-width0/width100%로 해결했다. 기존 native Scrollbar 안의 Sticky y60 유지, 스크롤에 따라 title은 y159→75로 이동함을 실측했다. 별도 축소 애니메이션/전역 편집 모드/Grid 변경 없음.
- 파일: `toolbar/WallAdaptiveFilters.tsx`(신규), `WallScopeControl.tsx`, `WallDashboardToolbar.tsx`, `WallVariableControl.tsx`, `WallTimeRangeControl.tsx`, `toolbar.css`; `WallDashboardHeading.tsx`, `modern.css`; `dashboard-scene/scene/DashboardSceneRenderer.tsx`; `toolbar/adaptiveFilters.test.tsx`(신규) 및 기준표/AGENTS/이 기록.
- Jest2 suites/15 tests 통과: 기존 native Toolbar13개+실측폭 prefix/복원·시간 한글 표시2개. 대상 TS 진단0, ESLint0, production build 성공(기존 size 경고2). 최종 build 로그 `/tmp/wall-control113-build-release.log`. 새 library 없음. API/저장 모델/query/단위/원본 JSON 변경 없음.
- 브라우저 검증: 로그 실제 default1578px에서 필터 prefix+검색1개 overflow,1100px bar.right1061 및 조회 y72 동일,800px bar.right761.1920px에서 검색 입력 원위치 복원. overflow textbox에 wall-ux 입력→URL 반영→넓은 화면 입력값 유지 확인 후 빈 값 복원했다. 추가 필터 안 native 로그 파일 선택기/ESC 한 단계 복귀 확인.
- 별도 기존 QA400개 목록의 overflow 안에서399 선택·바깥 클릭→실제3개/URL/dirty0 확인. 최종1920px에서는 overflow0,800px bar.right776 확인. viewport API는 현재 선택 탭에 적용되므로 대상 innerWidth와 함께 검증하고 override reset했다. 01은 숨김 변수 유지,05 scvm 미선택/기존5탭 유지, Kiosk 설정 버튼0, Light/Dark 배경과 조회 그룹 정렬 확인. native 쿼리 실행은 기존 경로이며 로그의 기존 Loki EOF는 환경 제약으로 UI 작업에서 수정하지 않았다.
- 기존 사용자 탭은 최종 dirty0 재확인 후 갱신했으며 실제 Toolbar bottom116/title top159/조회 그룹 y72·dirty0 확인. 기존 별도 검증 탭도 전달한다. 3317 launchd preview로 최신 빌드 반영하며 backend/포트/운영·고객 환경 변경 없음. 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 보존, 임의 커밋 없음.
- 화면: `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-control-ref113/control-bar-light.png`, `control-bar-800.png`.

## REF-114 — 툴바 변수 Bold 완화 (2026-11-05)

- 변수 선택값에 패널 제목용600이 적용되던 것을 공통 control weight500으로 변경했다. `toolbar/toolbar.css`와 우선순위가 높은 `typography.css`의 같은 selector를 함께 수정했다. 첫 실제 computed-style 확인에서 공통 타이포그래피 override가600을 유지하는 것을 발견해 해당 원본 규칙까지 수정했으며 !important 추가로 숨기지 않았다.
- 크기/색/변수명400·패널 제목과 다른 숫자/기능은 변경하지 않는다. 기존 native 변수 및 Base UI 컴포넌트를 그대로 쓰는 CSS-only 작업이다. 디자인 기준표 REF-114에 반영했다.
- production build 성공(기존 size 경고2),3317 health200. 사용자 탭 dirty0 확인 후 갱신하고 전체/UNKNOWN/전체 선택값3개의 실제 computed font-weight500을 확인했다. 별도 기능 테스트는 추가하지 않았다. 증거: `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-type-ref114/toolbar-weight.png`.

## REF-115 — 공통 패널 양쪽 하단 Resize (2026-11-05)

- **원인1:** `PanelLayoutGrid.tsx`의 각 native Grid item이 `resizeHandles=['se']`만 허용했다. 기존 SW 판별·포인터 capture·그리드 스냅·반전 ㄴ자 스타일은 있었으므로 se/sw를 함께 허용했다. 새 primitive/엔진/library/CSS 변경 없음. readOnly/Kiosk/다중 선택 제한은 유지한다.
- **원인2:** 실제 브라우저에서 SW로 x3/w45→x0/w48 확장 후 SE 축소하자 x가3으로 돌아갔다. 이웃의 원래 슬롯을 기억하는 `resizeReflowOrigin()`이 active 패널까지 이전 x로 복원하기 때문이었다. `layoutMovement.ts`에서 이웃 origin은 보존하고 active 항목만 현재 좌표로 갱신했다. 반대 모서리·48열·기존 snap/preview/drop/저장 계산을 다시 만들지 않았다.
- **수정 파일:** `workspace/PanelLayoutGrid.tsx`, `workspace/layoutMovement.ts`, `workspace/PanelResizeGrid.test.tsx`, `workspace/resizeReflow.test.ts`; 기준표 REF-115·AGENTS·이 기록. 이전 사용자 미커밋 수정은 보존하고 임의 커밋 없음. index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe` 유지.
- **자동 검증:** 관련5 suites/36 tests 통과(`/tmp/wall-resize115-tests-done.log`). 왼쪽 축소/확장·저장/재마운트·readOnly·SW→SE 교대와 이웃 복원 assertion 추가. 수정 production2파일 TS진단0, 대상4파일 ESLint0. webpack 성공(`/tmp/wall-resize115-build-final.log`, 기존 bundle-size 경고2). 전체 테스트 반복 없음.
- **브라우저 실제 조작:** 별도 기존 local QA `wall-events-qa-109`에서 실제 CPU 데이터로 양쪽을 번갈아 Resize했다. 안정된 viewport에서 SW 축소 card rect x408/y213/w1437/h448, 확장 x312/y213/w1533/h472, SE 축소 x312/y213/w1437/h448, 다시 SW 축소 x408/y213/w1340/h448이었다. 각 drop preview와 최종 카드 x/y/w/h가 정확히 같았다. 처음 native wrapper 전환 전후 viewport가 달랐던 측정은 비교에서 제외했다. 논리 반대 모서리는 동일 열이며 native 정수 px 반올림으로 마지막 혼합 폭의 실측 right만1px 달랐다. CSS offset으로 보정하지 않았다.
- **저장·복원:** QA에 SW x3/w45를 native 저장(version6)하고 새로고침 후 같은 extension 좌표와 카드 geometry 복원을 확인했다. 후속 교대 조작의 Undo/Redo/전체 취소와 guide/cursor 종료 확인. 검증 종료 후 QA 원본 설정을 그대로 복원(version7, version 외 equality=true). 원본01/05/로그 Dashboard JSON과 query/datasource/단위는 모두 unchanged=true였다. 테스트 저장을 원본에 수행하지 않았다.
- **UI 확인:** Light 핸들 #a3a3ad/Dark #c9cad1, se-resize/sw-resize·미러 ㄴ자 유지. Kiosk 양쪽0→ESC 후 복원 확인. 사용자 실제 탭은01로 이동한 상태였으며 dirty0 확인 후 최종 갱신·좌우 각23개·dirty0이었다. 별도05 개요는 좌우 각26개였다. 다중 선택 제한은 기존 코드와 관련 단위 경로를 보존하며 이번 브라우저에서 별도 다중 Resize는 수행하지 않았다.
- **반영·증거:** 기존 preview launchd 서비스로 최신 빌드 반영·3317 health200. fixture 서비스 재시작/Backend 변경/운영 배포 없음. `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-resize-ref115/`에 `both-handles-light.png`, `alternating-sides.json`, `qa-after-west-save.json`, `verification.json`과 원본 baseline을 보존한다. 양쪽 하단 Resize 범위를 완료했으며 위1px native rounding 외 새 기능 확장은 하지 않았다.

## REF-116 — 전체 대시보드 공통 적용 확인·개발 범위 확정 (2026-11-05)

- 사용자의 최신 지시를 AGENTS.md 상단 우선 기준과 DESIGN_SYSTEM.md REF-116에 반영했다. 과거05 한정 규칙을 현재 작업 범위 제한으로 사용하지 않는다. 공통 UI/시각화/편집은 전체 대시보드 경로에서 개발·대표 회귀 검증한다. 05 전용 데이터 의미나5탭을 모든 화면에 이식하지 않는다.
- **시계열:** WallChrome의 공통 provider·UID 비종속 isWallDashboardPanelRoute·TimeSeriesPanel의 presentation/metric profile·native TimeSeries renderer 연결 확인. editor도 같은 chartTokens 사용. **Gauge/Meter:** 공통 VizPresentationContext의 renderGauge/renderBarGauge와 native GaugePanel의 meterAppearance→Wall 표시 계층 연결 확인. 일반 대시보드 UID 제한 없음.
- 남은05 UID 분기는 기존 Workspace 탭/전용 시각화 역할·panelSources 보존용이다. 같은 panel ID를 가진 다른 대시보드를05 의미로 치환하지 않는다. 중립점/숫자 Threshold 라벨 등 특수 옵션과 standalone d-solo의 native fallback을 공통 적용 누락으로 임의 제거하지 않는다. 명시 사용자 색과Threshold 보존으로 일부Gauge가초록색인것은정책상정상이다.
- 관련 Jest3 suites/42 tests 통과(`/tmp/wall-scope116-tests.log`). 시계열의 여러 UID/전체보기/Kiosk route와 저장 옵션/데이터 보존, Gauge 렌더/Threshold/호환 fallback·Meter 색 정책 확인. 이번에는 소스와 테스트 확인이며 전체 화면 브라우저 재검증은 하지 않았다. 제품 코드는 이미 공통 연결이므로 중복 수정/새 빌드 없이 지침3파일만 업데이트했다. 기존 index/미커밋 작업·원본 Dashboard JSON 보존, 임의 커밋·DB 저장·서비스 재시작 없음.
- **사용자 이미지 차이 추적 보완:** local API의 종합 실제 Gauge7개 설정과 `wall-color-qa-108` panel2를 읽기 전용 비교했다. 종합은 RGBA green/75 orange/85 red의 명시 조건·markers=true·grid h4이고 QA는 명시 Cobalt/기본green-red80·markers=false·h8이었다. 둘 다 같은 원형 renderer지만 정상색과 실제 threshold 구간 문구/눈금 및 가용 크기가 다르다. 테스트 화면을 실제 종합과 같은 조건의 완료 증거로 표현하지 않는다. 공통 적용과 원본 설정의 시각적 통일은 별개이며 이번 원인 확인에서 임계치/JSON/UI를 변경하지 않았다.

## REF-117 — 실제 Root Top5 LCD Bar Gauge 개선 (2026-11-05)

- 사용자 이미지의 Root 디스크 사용률(Top5)은02 호스트 대시보드 aec03sr91pfk0f panel14, displayMode=lcd였다. fasdasdasdw에도 같은 설정이 있다. 이전 common renderer에서 lcd를 명시적으로 제외하여 native renderRetroBars의 radial-gradient/큰 셀·옛 라벨이 남았던 것이 원인이다. 일반 Gauge의 명시green 보존과는 다른 표시 경로 누락이었다.
- `BarGauge.tsx`의 lcd 제외를 제거하고 `WallMeterBar.tsx`에 기존 모드용 평면 세그먼트 트리를 연결했다. 기존 Base UI Meter Root/MeterValue와 native getCellColor를 재사용한다. 셀 position의 native display color·점등 기준을 보존하고 빈 셀만 중립 track·켜진 셀은 단색으로 표시한다. 공통 meterThickness8px, meterTokens lcdGap2/lcdRadius2. 새 라이브러리/개별CSS/UID 예외 없음. native LCD 저장 모드/75·85/필드/쿼리/링크/소수/값·패널 크기·Grid/저장은 수정하지 않는다. 연속색·no-context는 기존 fallback.
- 파일: `packages/grafana-ui/src/components/BarGauge/BarGauge.tsx`, `public/app/features/wall-modern/panels/{WallMeterBar.tsx,meterTokens.ts,meterPresentation.test.tsx}`와 기준표/AGENTS/이 기록. 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe와 기존 미커밋 작업 보존·임의 커밋 없음.
- 검증: 관련2 suites/14 tests 통과(`/tmp/wall-lcd117-tests-final.log`). 신규 LCD 가로/세로·점등 기준·neutral empty/무gradient·원본불변·클릭콜백 확인. 첫 신규 test는 native useTheme2의 기본Dark와 fixture Light prop 차이로 색 assertion 실패해 실제 ThemeContext를 제공하여 해결했다. 대상 TS진단0(`/tmp/wall-lcd117-types.log`),ESLint0,webpack성공(`/tmp/wall-lcd117-build.log`,기존 size 경고2).
- 실제 Chrome02에서13.0%/11.6%/11.4%·3호스트·각29세그먼트/8px·gloss=false 확인. Light/Dark에서75/85 marker와 수치·이름 유지, Dark track RGB52/62/79 확인 후 Light 복원. 새 검증탭 dirty0에서 갱신했고 기존 사용자 미저장 탭은 건드리지 않았다. 패널 조회/선택만 실행하고 native 대시보드 저장/쿼리편집은 하지 않았다. 다른 전체 UID를 브라우저로 재검증했다고 표현하지 않는다.
- 기존 preview launchd kickstart로 최신빌드 반영·3317/3318 health정상. fixture 재시작/Backend 변경/운영 배포 없음. 캡처 `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-lcd-ref117/lcd-light.png`, `lcd-dark.png`. Dark캡처는 인접패널 일부를 포함하며 최종 Light캡처는 대상패널 전체다.

## REF-118 — Segmented Bar 재설계·Heat Strip 구현 (2026-11-05)

- **분석:** native BarGaugePanel.getValues→getFieldDisplayValues가 기존 reduceOptions·효과적인 field config/formatter·FieldDisplay.view.dataFrame/colIndex를 제공한다. LCD/Basic/Gradient는 같은 native VizRepeater를 사용하고 원본 시계열도 view에 남는다. 이를 공통 재사용하며 쿼리/Transform/Reducer/단위/JSON·Grid를 변경하지 않았다.
- **Segmented:** 이전29개/8px LCD를 약22px 셀·최대24개/높이12px의 Modern Segmented Bar로 변경했다. ratio\*N-index의 부분 경계 채움으로 작은 값이 ceil 오차로 과장되지 않고0은 채움0이다. 공통 label/control·value/status 크기 상한, native 색·단위·가로/세로/링크/명시 크기 유지. 기존 lcd JSON을 재저장하지 않는다.
- **Heat 모델:** `heatStripModel.ts`는 원본 numeric/time을 읽어 Dashboard 시간 범위 안의 포인트만 복사·정렬·균등 binning한다. 시간/계산 모드/서로 다른 timestamp2개 이상이 필요하다. 마지막값(Null 포함) 기본, mean/max/min은 유효 numeric을 사용하며 Null/빈/NaN·Infinity/계산 불가를 구별한다. 샘플 수/유효 수를 공개하고 gap을 채우지 않는다. native Reducer 요약은 별도로 유지한다.
- **Heat UI:** `WallHeatStrip.tsx`의 실제 Base UI Tooltip/기존 Wall Surface·Motion·MeterValue/local Button을 사용한다. 이름/시간구간/native formatted value/집계/개수/색 범위를 Tooltip에 제공하고 focus/ESC를 유지한다. max64열·현재 폭에 따른18px 기준의 동일 시간 버킷, 세로 여러 지표 행·스크롤, 명시 name/value 숨김·legend/링크를 유지한다. 컬러는 공통4팔레트, 기존 임계치 기본보존·사용자 명시 opt-out 시에만 일반 강도색이다. Tooltip의 aria 관계는 실제 DOM 점검 후 명시 role/id/aria-describedby로 연결했다.
- **옵션:** `displayMode='heat-strip'`은 generated enum 파일을 바꾸지 않고 BarGaugePanel의 local WallBarOptions에서 확장했다. builder에4모드(Segmented의 saved value=lcd)·시간 집계·threshold 사용 토글을 연결하고 native migration/저장 흐름을 그대로 사용한다. Heat X축은 시간 고정이라 작동하지 않는 Orientation/막대 sizing 옵션은 숨긴다. Basic/Gradient 및 LCD 원본 쿼리/계산은 보존한다.
- **파일:** 신규 `public/app/features/wall-modern/panels/heatStripModel.ts`, `WallHeatStrip.tsx`, `heatStrip.test.tsx`. 변경 `panels/WallMeterBar.tsx`, `meterTokens.ts`, `meterPresentation.ts`, `meterPresentation.test.tsx`; `public/app/plugins/panel/bargauge/BarGaugePanel.tsx`, `module.tsx`, `BarGaugeMigrations.ts`(타입만); `packages/grafana-ui/src/components/VizPresentation/VizPresentation.ts`(선택적 useThresholds 표시 계약). 기준표 REF-118·AGENTS·이 기록. 새 library/CSS 파일 없음. 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 유지. 미커밋 작업을 섞은 임의 커밋 없음.
- **검증:** 신규+기존 관련6suites/64tests·2snapshots 통과(`/tmp/wall-heat118-tests-release.log`). fractional fill0/0.1/13/50/99/100%·다양 셀수, source immutable·시간 밖/끝 경계/순서, Null/empty/0·4집계/invalid, native summary 유지·instant/All values 안내, palette opt-out/fixed 보존·가로/세로, Basic/Gradient native 및 migration을 확인했다. 대상TS진단0(`/tmp/wall-heat118-types-release.log`),ESLint0,production build성공(`/tmp/wall-heat118-build-final.log`,기존size경고2). 전체 tsc/전체 repo 테스트 성공으로 표현하지 않는다.
- **실제 브라우저:** 원본02 Root 새 검증탭에서13.0/11.6/11.4%·16셀/12px·정확한 활성 비율12.961474045353286/11.586988587269374/11.424045295608522와 aria-valuenow 일치를 확인했다. 실제값은 갱신되므로 상수가 아니다. QA `wall-heat-qa-118` id98은4팔레트 비교용으로 만들었다. 원본 Root의 instant 쿼리는 유지하고 **QA 사본만 동일 expr의 range=true/instant=false**로 변경했다.19열×3행/넓은40열×3행과 실제CPU64열×2행, instant 안내0셀을 확인했다. 안정적인 디스크 값에 장식적인 variation을 추가하지 않았다.
- **저장·상호작용:** QA panel2를 native 편집기에서 last→mean 변경/적용→native 저장Drawer 저장(version2)→reload 후 mean 복원 확인. 대상 쿼리는 전부 QA 최초와 동일했다. 이후 QA에 기존 종합83번의 실제CPU range 사본을 추가해 version3으로 남겼다. 키보드 Tab으로 시간 셀 Tooltip을 열어 실제 시간구간/13.0%/평균·유효12/전체12개·0%–100% 범위를 확인했다. Tooltip 초기에 aria role이 없던 것을 실제DOM 검사 후 보완했다. 포인터 Hover 경로는 Base UI의 원래 trigger를 사용하며 별도 커스텀 hover 엔진은 만들지 않았다. Light/Dark4팔레트와 유지된75/85 색상 확인 후 Light 복원. 시간 범위를 셀 클릭으로 변경하지 않는다.
- **참조 한계:** Playground 링크는 실제 Chrome에서 Dock만 로딩되어 Heatmap 본문 상호작용을 직접 검증하지 못했다. 공식 최신 Heatmap 문서의 매핑/집계 개념만 확인했으며 동작/외형 복제라고 주장하지 않는다.4팔레트 실제 비교 후 Wall 기본과 일치하는 Cobalt를 일반 기본으로 유지하고 명시 threshold는 우선한다.
- **검증 실수:** 이전 작업에서 만든 호스트 검증탭(lcd117)에 dirty1이 있었으나 갱신 호출을 잘못 수행했다. beforeunload dialog가 남아 있지 않고 reload 후 dirty0/마지막 저장본이 됐으며, 갱신 전 draft 내용을 읽지 않아 복구하지 못했다. 사용자에게 즉시 사실과 미확인 변경 내용을 알렸다. 이 탭에서 원본 저장은 하지 않았고 이후 새 탭만 사용했다. 미저장 보호를 준수했다고 보고하지 않는다.
- **보존·반영:** API baseline의 원본19개 Dashboard JSON 모두 unchanged=true(`/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-heat-ref118/verification.json`). 위 검증탭의 세션 draft와 서버 원본 보존은 구분한다. 기존 launchd preview 최신빌드 반영·3317/3318 health정상. fixture 재시작·Backend/운영 DB/고객·새 포트·운영 배포 없음.
- **결과물:** 같은 폴더 `comparison-final.png`, `compare-light.png`, `compare-dark.png`, `heat-tooltip.png`, `root-segmented.png`, QA source/저장본/final JSON을 보존했다. QA 전달 URL `http://127.0.0.1:3317/d/wall-heat-qa-118/9a89980`. Root 원본 instant 상태에서 Heat를 실제 시계열처럼 검증했다고 표현하지 않는다. 실제 높은 값/Null/No Data/가로·세로 경계 조건은 명시 fixture test, 실데이터 낮은값/안정구간/실CPU변동은 브라우저 검증으로 구분한다.

- **최종 보완:** Heat의 Mapping 색은 summary에 활성 mapping이 없어도 각 bucket의 실제값에서 독립 확인한다. 이전 정책이 summary에만 의존할 수 있는 경로를 보완하고90→High/red·요약42는유지하는 회귀검증 추가. 최종6suites/65tests·2snapshots 통과(`/tmp/wall-heat118-tests-mapping.log`), TS진단0·ESLint0, 최종빌드 `/tmp/wall-heat118-build-mapping.log`. QA의 실제 데이터에는 해당 mapping이 없으므로 앞선 비교 캡처 외형은 동일하며 추가 사례는 명시 fixture test다.

## REF-119 — 공통 Time Series 시각 정밀도 및 범례·Tooltip 실측 개선 (2026-11-05)

- **범위/분석:** 최신 전체 대시보드 공통 적용 요청을 유지했다. native TimeSeriesPanel→TimeSeries→preparePlotConfigBuilder/uPlot/TooltipPlugin2/PlotLegend를 추적했다. native round join·pxAlign=false·DPR scaling을 이미 사용하므로 임의 CSS 확대/Shadow/평활화를 추가하지 않았다. 실제 CPU 사본의 명시 lineWidth1/fillOpacity10은 보존했다. 사용자 지정 옵션과 renderer 기본값을 구분하지 않고 전부 새 값으로 바꾸지 않는다.
- **표현:** 공통 일반 기본 stroke2px·기본 fill6%와 non-stacked 가시선수 기반 상한, native 포인트 실제 색+Surface border1.5px/기본6px·Shadow 없음, focus alpha0.4·얇은 실선 Crosshair·약한 grid를 사용한다. 일반 자동 팔레트는 기존8색 뒤8색 추가로16색이며 명시색/Threshold/Override/Mapping 우선이다. Bar/XY/Histogram은 refined=false로 기존 palette/grid/crosshair/Tooltip 위치 정책을 유지했다. 데이터 배열/선 보간/값 범위·축 계산은 수정하지 않았다.
- **Tooltip 원인:** 최초 Popup 크기0으로 계산한 위치가 pinned footer 추가 후에도 다음 pointer move까지 남아 범례를 가렸다. 원래 ResizeObserver에서 실제 크기를 받은 즉시 같은 DOM 위치를 갱신하고, plot 안→위쪽→viewport 순으로 안전한 공간을 찾도록 수정했다. 원래 cursor indices/formatter/Zoom/pin/복사/모드와 수치 선택을 유지한다. 동일 native display result의 text/prefix/suffix만 분리 표시하며 pinned 복사는 기존 문자열을 사용한다.
- **작은 범례:** 실제 폭360px 미만에서 이름 다음에 설정된 통계만 배치한다. 통계 라벨/수치는 공통 typography의16px line으로 정렬하고 전체 수치는 title에도 남긴다. 첫 시안에서 라벨+숫자 inline의 ellipsis, 다음 시안의 높이와 platform scrollbar 이중 영역 문제를 실제 화면에서 발견해 수정했다. 최종 높이22px header/54px row·viewport76px에서 첫4통계 전체가 보이며 기존35% 높이 한도는 유지했다. DOM remount 없이 resize하며 모든 추가 행은 스크롤한다.
- **스크롤 실제 원인:** native CustomScrollbar가 플랫폼 트랙을 음수 margin으로 마스킹하는 동시에 실제 Chrome 트랙이 공간을 차지하여 가시 영역·내용 폭·스크롤 끝이 어긋났다. 단순 :has/offset CSS 시안은 제거했다. 최종은 refined Time Series에만 opt-in hideNativeScrollbars를 전달하여 native tracks를 직접 숨기고 overflow auto/margin0/maxHeight100%로 viewport와 범위를 맞춘다. 최종 browser legend/view 폭272px·view/outer 높이76px·content130px, scrollTop=scrollMax=54, 마지막 Min2.55%의 bottom749.7≤viewport750을 확인했다. 다른 caller는 기존 snapshot/정책 그대로다.
- **파일 — 공통 표현:** `public/app/features/wall-modern/chartTokens.ts`, `colorSystem.ts`, `timeSeriesPresentation.ts`, `charts/metricProfiles.ts`, `charts/analytic.ts`, `charts/categorical.ts`; `public/app/core/components/TimeSeries/utils.ts`; `packages/grafana-ui/src/components/VizPresentation/TimeSeriesPresentation.ts`.
- **파일 — Tooltip:** 신규 `packages/grafana-ui/src/components/uPlot/plugins/wallTooltipPosition.ts`; 변경 `TooltipPlugin2.tsx`, `packages/grafana-ui/src/components/VizTooltip/{types.ts,utils.ts,VizTooltipRow.tsx}`, `public/app/plugins/panel/timeseries/TimeSeriesTooltip.tsx`, `public/app/features/wall-modern/charts/WallTimeSeriesTooltip.tsx`.
- **파일 — 범례/검증/기록:** `charts/WallSeriesLegend.tsx`, `WallSeriesLegendItem.tsx`, `seriesLegend.css`; `packages/grafana-ui/src/components/VizLayout/VizLayout.tsx`, `CustomScrollbar/CustomScrollbar.tsx`와 해당 test; 신규 `charts/timeSeriesRefinement.test.tsx`; 변경 `timeSeriesPresentation.test.tsx`, `charts/seriesLegend.test.tsx`, `charts/metricProfiles.test.tsx`; DESIGN_SYSTEM.md REF-119/AGENTS/이 기록. 새 library·chart engine 없음. 기존 로컬 shadcn/Button·Base UI Menu/Popover1.0.0과 native 색상 picker/PanelContext callback 재사용이며 새 Base UI 차트 primitive가 있다고 표현하지 않는다.
- **자동 검증:** 최종 관련6suites/67tests·1snapshot 통과(`/tmp/wall-series119-tests-last.log`). Native DPR1/2 grid/marker 설정·RGBA paint·암묵/명시 fill·source 불변·viewport 경계·16색·0/소수/단위/pinned string·compact resize 시 같은 action DOM·원래 CustomScrollbar snapshot과 새 viewport 계약을 확인했다. 대상9개 production root TS진단0(`/tmp/wall-series119-types-release.log`),대상 ESLint0(`/tmp/wall-series119-lint-release.log`),webpack성공(`/tmp/wall-series119-build-release.log`,기존 bundle-size경고2). 전체 repo tsc/전체 회귀를 수행한 것으로 표현하지 않는다. 기존 duplicate manual mock 경고는 제품 오류로 수정하지 않았다.
- **실데이터 QA:** local `wall-series-qa-119` id99/version2에 원본 실제 CPU2시리즈 설정 사본/단일 Line/작은4통계 패널과 실제코어 Line/Area를 배치했다. 시점별 Top12 query는1시간 전체에서61개 멤버가 나타나므로 단일 시점12개와 구별한다. 그 때문에 생기는 null gap/독립 marker·fill 단절을 보간하지 않았다. 별도로 실제 host10.10.22.1:3003의 안정된12core Line/명시 Fill5%를 나란히 추가해 비교했다. 이 선택 쿼리는 QA에만 있으며 제품 renderer는 CPU/호스트 이름을 하드코딩하지 않는다.
- **실제 상호작용:** 실제12시리즈에서 이름 선택→1개만 표시/전체 복원, 이름 정렬, copy/isolate/hide/reset/color/data 메뉴를 확인했다. native drag Zoom 후 URL이04:49:53.251Z–05:13:55.437Z로 변경되고 dirty0을 유지했다. 시간 범위 복원·수동 새로고침·Light/Dark·작은 범례 wheel 끝 확인 후 Light로 복원했다. 색상 변경의 저장 회귀는 기존 callback을 보존하며 이번에는 원본 대시보드에 새 색을 저장하지 않았다.
- **수치/위치 근거:** native Tooltip의 timestamp2026-11-05T04:58:15.000Z에서3.09%/3.89%를 같은 시점 Prometheus3.0885185185578528/3.892777777664989와 대조했다. 수정 전 popup bottom536이 plot bottom422를 넘어 범례를 덮었으나 최종 popup top111/bottom279<plot top291로 보정됐다. marker 실제6×6·native blue/teal·white border·shadow none, Chrome DPR1의 canvas physical/CSS 크기가 같음을 실측했다. DPR2는 자동 설정 테스트이며 물리2x 화면 측정은 하지 않았다.
- **원본 회귀/제약:** 종합 원본 호스트 CPU와 다른4개 Time Series의 공통 renderer/범례 연결을 실제 확인했다. 종합의 기존 MySQL 연결 오류 패널은 별도 환경 제약이며 UI 수정으로 처리하지 않았다.05는5탭/dirty0을 확인했으나 빈 scvm 때문에 실제 Time Series frame이 없어 그 화면을 실데이터 차트 검증으로 설명하지 않는다. 원본19개 dashboard JSON 모두 동일(`originals-verification.json`). 원본 query/단위/Threshold/Transform/위치·크기/48열·Drag/Resize/저장 엔진 변경 없음. QA 조회 조작은 dirty0이며 기존 사용자 탭의 draft를 갱신하지 않았다.
- **반영/작업 상태:** 기존 launchd preview에 최종 build를 반영하고3317/3318 health200을 확인했다. fixture 서비스/relay/Backend/운영 DB/고객/포트/배포 방식은 변경하지 않았다. 사용자 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe`와 기존 미커밋 작업을 보존하며 이를 섞은 임의 커밋을 만들지 않았다. 잔여 검증 범위는 물리 high-DPI·전체 UID 전수·장시간 성능 profiling이며 이를 완료로 주장하지 않는다.
- **결과물:** `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-series-ref119/`의 `cpu-tooltip-final.png`, `stable12-light.png`, `stable12-dark.png`, `narrow-light-final.png`, `narrow-scroll-end.png`, `summary-actual.png`, `tooltip-corrected.json`, `tooltip-source-values.json`, `originals-before.json`, `originals-verification.json` 및 QA source를 보존했다. 이전 위치 오류의 `cpu-tooltip-light.png`는 최종 증거가 아니다. 전달할 실제 QA URL: `http://127.0.0.1:3317/d/wall-series-qa-119/ffd8d81`.

## REF-120 — 공통 패널 스크롤·작은 목록 공간 개선 (2026-11-05)

- 현재 경로를 분석했다: Bar Gauge는 native VizRepeater의 overflow auto와 전체 width를 사용하고, Time Series/Pie 범례·Table은 CustomScrollbar의 masked viewport를 사용했다. 전자는 scrollbar 폭을 자식 계산에서 빼지 않아 수치가 잘릴 수 있었고 후자는 파란 focus색/기본 track·활동 표시가 서로 달랐다.
- 신규 `packages/grafana-ui/src/components/PanelScrollArea/{PanelScrollArea.tsx,PanelScrollArea.test.tsx}`에 native scroll wrapper·공통6px rail/16px clearance/44px 자동 meter row/700ms 활동 종료 및 공통 중립 thumb 스타일을 정의했다. RO/MutationObserver/passive scroll·cleanup으로 영역 넘침/활동만 추적하고 데이터/포인터/scrollTop을 가로채지 않는다. OS의 native thin 폭은 플랫폼마다 다르며 wheel/keyboard/touch 엔진을 새로 만들지 않는다.
- 변경 파일: `packages/grafana-ui/src/components/CustomScrollbar/CustomScrollbar.tsx`(Wall Context에서 공통 paint·활동·키보드 focus·native track 직접 숨김), `VizLayout/VizLayout.tsx`(범례만16px end inset), `VizRepeater/VizRepeater.tsx`(Wall 목록 viewport·horizontal 실제 child width), `public/app/plugins/panel/bargauge/BarGaugePanel.tsx`(자동 min row만44px), `public/app/features/wall-modern/panels/{WallMeterBar.tsx,WallHeatStrip.tsx}`(수치 shrink 방지/기존 overflow 연결). 기준표REF-120/AGENTS/이 기록 업데이트. Table/Donut은 기존 공통 wrapper를 통해 적용되며 가상화·메뉴·색·단위/Threshold/쿼리는 보존한다. 새 라이브러리/Base UI primitive 도입 없음.
- 관련5suites/37tests·1snapshot 통과(`/tmp/wall-scroll120-tests.log`): 내용 넘침/활동 종료/cleanup/native focus, 기존 scroll snapshot·범례 resize/값/Heat 계산 회귀. 대상 TS0(`/tmp/wall-scroll120-types.log`),ESLint0(`/tmp/wall-scroll120-lint.log`),production build 성공(`/tmp/wall-scroll120-build.log`,기존 bundle-size경고2). 초기 검사에서 optional minVizHeight TS오류와 중복 import/scroll region tabIndex lint를 발견해 수정했다. 전체 repo 테스트로 표현하지 않는다.
- 별도 QA `wall-scroll-qa-120` id100/version1만 만들었다. 실제02 Root3호스트/12core Time Series/120항목 Donut/960행 CPU Table을 복사했고 작은/넓은 목록·우측/하단 범례를 배치했다. Table 긴 자원명은 기존 QA의 명시 라벨이며 원본 모니터링 데이터명으로 주장하지 않는다. 제품 코드에 QA UID/호스트 예외 없음.
- Chrome 실제 Root 작은 목록: 높이110/content138, wheel scrollTop28=max28, 마지막 항목 bottom354≤viewport356, clientWidth=scrollWidth351로 수치 오른쪽 넘침0 확인. 넓은 목록은 항목 전체 표시. 키보드 Home은 native scroll 완료 후0, End28을 확인했다(첫 즉시 읽기는 브라우저 key scroll 진행 중 값이어서 완료 결과로 사용하지 않음).
- 우측 범례 scrollTop490=max490으로 이동해도 chart rect x1083/y274/w482/h180이 동일했다. custom Thumb 활동 opacity1을 실측했다. Pie 범례 scrollTop929/max3208, Table virtual rows scrollTop929 및 행 렌더 유지 확인. Hover/focus/활동 종료의 낮은 중립색·전환 정책은 공통 CSS로 정의했고 모든 OS의 fade를 실제 측정한 것으로 표현하지 않는다.
- 실제 Resize로 Root 높이110→210 시 내용210/overflow=false로 바뀌어 불필요한 scroll이 사라졌다. 기존 변경 취소로 원래 배치/dirty0 복원했다. 실제 패널 이동은 이번에 별도 재검증하지 않았으며 Drag/Resize/Grid 엔진은 수정하지 않았다. 조회·휠·키보드 조작으로 dirty가 생기지 않았다. Light/Dark 확인 후 Light로 복원하고 QA를 전달한다.
- Firefox 앱 미설치로 실제 Firefox 검증을 수행하지 못했다. Chrome/WebKit pseudo scrollbar와 Firefox 표준 thin/color 경로를 정의했으며 Firefox/다른 OS/터치·트랙패드 실기·전수 UID는 남은 검증이다. 새 브라우저를 설치하거나 검증했다고 꾸미지 않았다.
- 최종 빌드는 기존 launchd preview에 반영했다. 원본19개 JSON 대조와3317/3318 health를 확인하고 사용자 index/미커밋 작업을 유지한다. 임의 커밋·운영 배포·Backend/DB/포트 변경 없음. 증거 디렉터리 `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-scroll-ref120/`, 화면 `scroll-light.png`/`scroll-dark.png`, QA source 및 원본 사본. URL `http://127.0.0.1:3317/d/wall-scroll-qa-120/253d466`.

## REF-121 — Time Series 패널 간 Crosshair 동기화 (2026-11-05)

- **추적:** graphTooltip(0/1/2)→native CursorSync behavior→PanelContext.sync/eventsScope→TimeSeriesPanel의 cursorSync/TooltipPlugin2→uPlot.sync를 확인했다. 기존 모델 serialization/GeneralSettings 메뉴는 존재했다. 기본0이므로 모든 기존 화면을 강제로 공유하지 않는다.
- **원인/수정:** TooltipPlugin2에 동기화 등록이 결합되어 tooltip=None 패널은 Shared Crosshair에서 빠졌다. 신규 `packages/grafana-ui/src/components/uPlot/plugins/CursorSyncPlugin.tsx`로 Wall의 등록을 분리하고 `public/app/plugins/panel/timeseries/TimeSeriesPanel.tsx`에서 Tooltip 여부와 독립적으로 mount한다. native fallback은 원래 등록을 유지하며 별도 버스/라이브러리는 없다.
- **시간 정확도:** native key/scales=['x',null]를 사용하고 follower 범위 밖은 숨긴다. 포인터 pixel/array index를 공유하지 않는다. `VizPresentation/TimeSeriesPresentation.ts`는 follower의 세로 점선만 남기고 Y선/Marker를 숨긴다. 데이터가 없는 곳에 가짜 포인트/수치를 추가하지 않는다. Shared Tooltip은 기존 nearest actual sample와 formatter/time을 유지한다.
- **실측 추가 원인:** pinned source를 닫을 때 native setCursor(-10)이 follower에 발행되지 않아 선이 남는 것을 실제 확인했다. Source programmatic dismiss/pinned mouseleave/destroy에서 같은 uPlot channel로 clear한다. passive clear는 재발행하지 않아 원래 source를 다시 지우는 loop를 방지한다. 정상 native mouseleave는 중복 발행하지 않는다. 추가 listener cleanup·native sync unsubscribe 유지.
- **나머지 변경:** `uPlot/plugins/TooltipPlugin2.tsx`의 Wall 등록만 adapter로 이관. `EventBusPlugin.tsx`는 pending throttle cancel/unsubscribe·legacy timestamp0/표시 범위 밖 방어를 추가했다. `management/WallGeneralSettings.tsx` 및 test는 기존0/1/2 native handler를 유지하며 라벨을 명확히 했다. 새 CSS/범례/Tooltip 재설계/Frame·query·Grid 변경 없음.
- **테스트:** 신규 CursorSyncPlugin.test.tsx(두 native 모드/scopes, Off/비시간/범위 밖, follower 표시, destroy, source/pinned clear·passive 재발행 방지)와 기존 일반설정/Tooltip refinement 총3suites/9tests 통과(`/tmp/wall-sync121-tests.log`). 대상 ESLint0(`/tmp/wall-sync121-lint*.log`), production build통과(`/tmp/wall-sync121-build.log`,기존 size경고2). 타입 검사(`/tmp/wall-sync121-types.log`)에는 ReactPortal의 중복 @types/react 경로 때문에 기존 TooltipPlugin2/AnnotationsPlugin2 JSX 진단2개가 있어 전체 TS통과로 보고하지 않는다. 새 adapter 직접 타입 오류 없음.
- **환경 제약:** 원본 CCVM relay3319가502/HTML을 반환하여 초기4패널 모두 ReadObject 오류였다. 재시도 후에도 같아 운영 endpoint/원본 datasource를 바꾸지 않았다. 별도 local datasource `wall-qa-fixture-121`(Prometheus GET→3318)만 만들어 QA에 연결했다. 제품 실제 데이터/실제 Null 검증으로 포장하지 않는다. 원본 쿼리/대시보드19개는 불변이다.
- **브라우저 모드:** QA wall-sync-qa-121 id101에서 mode1→mode2(version3)→mode0(version4)→mode1(version5)을 기존 설정/저장Drawer로 저장했다. 이후 Fixture 명칭을 바로잡아 version6으로 남겼다. 설정 UI의3개 label/저장과 재로딩 복원을 확인했다. Query/단위·평균/최고·fill1px/10%는 QA 원본 사본의 설정이다.
- **실측:** mode1의 source333/다른2패널333/범위밖30분Override-10. source583일 때 Override352(2h 대30m,동일660px):4×583−3×660=352. mode2는 Tooltip허용3개가2026-11-05 15:15:15·각 native sample 수치, tooltip=None panel은 Crosshair만 표시했다. mode0은source583/다른모두-10. 기존 pin 뒤 남던 선은 최종 이탈 후4개 전부-10이었다.
- **수명·갱신:** Dark/Light→Resize48px(기존 Grid dirty1)→변경 취소(dirty0) 후 동기화580/580/580/340을 확인했다. resize중 lazy viewport에서 plot3개였고 복원 후4개 재표시. 새로고침 후에도 같은 매핑이다. 별도 Fixture QA wall-sync-isolation-121 id102/version1로 이동하자 초기 cursor2개 모두-10이며 뒤로 복귀 후 정상 동기화했다. QA query결과 범위/수집 간격 차이를 검증했지만 Fixture에 실제 Null이 없어 Null실기/대량 성능/스크롤 후 전수/실데이터 검증은 미완료다. adapter는 native pointer path에 DOM dataset만 갱신하고 대시보드 React state를 갱신하지 않는다.
- **반영·보존:** 기존 launchd preview 최신빌드·3317/3318 health200, 원본19개 Dashboard JSON 동일. 임의 커밋 없음, 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe/미커밋 작업 보존. 기본 graphTooltip를 일괄 변경하지 않았고 운영/고객/Backend 버전/포트/배포 방식 변경 없음. QA datasource/QA2개 추가는 로컬 검증용이며 운영 변경과 구분한다.
- **증거:** `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-sync-ref121/`에 qa-source/qa-final JSON, originals-verification.json, crosshair-outside-range.png, crosshair-in-range.png, shared-tooltip.png, crosshair-dark.png, crosshair-light-final.png 보존. 중간 스크린샷의 실제 Null 표제는 Fixture 제공 내용을 과장하여 최종에서는 Fixture 다중 시리즈로 정정했다. 전달 URL `http://127.0.0.1:3317/d/wall-sync-qa-121/60a3e99`.

## REF-122 — Time Series Legend 전면 개선 (2026-11-05)

- **분석/범위:** native VizLayout/CustomScrollbar→WallSeriesLegend/Item→PanelContext callback과 VizLegend DataHoverEvent→uPlot을 추적했다. 기존 메뉴/정렬은 있었지만 Table DOM·통계/메뉴 폭 경쟁·작은 높이의 헤더 때문에 좁거나 낮은 범례의 가독성이 떨어졌고, Legend Hover 이벤트가 native line focus에는 연결되지 않았다. 이번에는 공통 Time Series 범례만 변경했다. 기존 Crosshair/Tooltip 재설계·쿼리·Grid·저장 로직을 확장하지 않는다.
- **변경 파일:** `public/app/features/wall-modern/charts/{WallSeriesLegend.tsx,WallSeriesLegendItem.tsx,seriesLegend.css,seriesLegendModel.ts,seriesLegend.test.tsx,legendTokens.ts}` 및 `public/app/core/components/TimeSeries/TimeSeries.tsx`, `public/app/plugins/panel/timeseries/TimeSeriesPanel.tsx`, 신규 `packages/grafana-ui/src/components/uPlot/plugins/{LegendFocusPlugin.tsx,LegendFocusPlugin.test.tsx}`. DESIGN_SYSTEM/AGENTS/본 기록을 함께 갱신했다. `WallSeriesMenu.tsx`·기존 로컬 Button/Base UI Menu·Popover·native color picker는 새로 만들지 않고 재사용했다.
- **표시 구조:** HTML table 대신 list/listitem·CSS grid와 dl로 이름/마커·설정된 통계·메뉴 슬롯을 분리했다. Bottom은 통계 헤더와 숫자를 정렬하고 Right/좁은 폭은 이름 아래에 기존 통계를 배치한다. 실제 값 길이를 참고해 통계 열 수를 줄이고 글자를 강제로 축소하지 않는다. Inter/Pretendard·tabular nums·기존 단위/소수·전체 title을 유지한다. 낮고 넓은 Bottom은 도구를72px 측면에 배치해36.39px viewport 안 첫26px 데이터 행이 보인다. native35% 높이 제한은 바꾸지 않았다.
- **Right/스크롤:** 명시된 위치/폭은 우선하며 폭이 없을 때만 min(280px,패널폭34%)를 사용한다. 기존 independent CustomScrollbar와16px lane을 재사용했다. Right의 실제 root183px, 명시 wrapper230px은 root214px으로 유지했다. 오른쪽 목록 끝 scrollTop632=max632에도 chart x1083/y552/w482/h256은 동일했다. 마지막 항목 메뉴 x1555/y496/w224/h236은1851×873 viewport 안이었다. Hidden 모드는 빈 범례 공간을 남기지 않으며 다른 차트의 native item table/list fallback을 보존한다.
- **Line 강조:** 새 LegendFocusPlugin은 기존 panel EventBus에서 origin=자신·dataId 있음·point.time 없음만 읽는다. config.dataFrameFieldIndex와 getFieldDisplayName으로 유일한 visible native series를 찾아 setSeries(index,{focus:true},false)를 호출한다. native series0은 X여서 config index+1을 사용한다. false로 setSeries hook/Crosshair·Tooltip 이벤트를 재발행하지 않으며 leave/cleanup에서 reset하고 unsubscribe한다. 이름이 중복된 경우 임의로 다른 선을 강조하지 않는다. DataFrame/옵션/Field Override 변경이나 새 버스는 없다.
- **정렬 의미:** 이름/현재값(Last)/최근 유효값(Last not null)/Mean/Max/Min·오름/내림을 지원한다. 기존 저장 sortBy=Last를 lastNotNull로 잘못 해석하던 alias를 last로 바로잡았다. `[5,null]`과`[0,0]` fixture로 실제 native reducer 차이를 검증한다. 정렬은 표시 사본/세션 상태만 바꾸며 설정된 통계 열을 추가하지 않는다. 설정된 순서 복원을 제공한다.
- **별도 QA/환경:** 실제 CCVM relay3319는4초 timeout으로 실제 운영 메트릭 검증을 할 수 없었다. 기존 local datasource wall-qa-fixture-121(3318)을 사용하는 QA `wall-legend-qa-122` id103/version3에7개 패널을 만들었다.12시리즈는 fixture3호스트를4개 query label로 반복한 UI 검사이며12개 독립 운영 자원 데이터가 아니다. 파형이 겹치는 것은 이 구성과 저장 Area10/line1의 결과이며 범례 요청에서 chart를 임의 변경하지 않았다. Dynatrace Playground는 Dock만 보여 내부 Legend 실측/동일 품질 비교를 완료한 것으로 표현하지 않는다.
- **브라우저 조작:** Bottom/Right·List/Table·1/2/12개·긴 이름·좁은/낮은 패널과 Light/Dark를 확인했다. stat 행에 pointer/focus 시 native line 강조·나머지 dim과 가시12개/dirty0, 단일 보기1·숨김11·전체12 복원, 이름 내림차순(D cube03→D cube02→D cube01→C cube03)과 Last/Last not null 메뉴 구분을 확인했다. 실제 long label title/ellipsis·메뉴 lane·목록 끝 접근이 유지됐다. 조회/정렬/강조는 dirty0이다.
- **기존 액션/저장:** 실제 native 데이터 Inspector로 진입/복귀했다. 이는 패널 전체 결과 Inspector이며 새 시리즈 필터 화면이 아니다. 데이터 링크가 없는 항목에 가짜 링크가 표시되지 않았다. native picker에서 #147eaf를 선택→기존 저장 Drawer(version2)→새로고침 후 byName `QA D · cube03`의 fixedColor Override를 확인했고 targets는 변경되지 않았다. 이후 테스트 색을 제거한 QA baseline(version3)으로 복원했다. 브라우저 이름 복사 성공 상태와 단위 테스트의 정확한 clipboard.writeText 인자는 확인했으나 connector readback은 비어 실제 OS 붙여넣기를 완료한 것으로 보고하지 않는다.
- **검사:** 관련4suites/21tests 통과(`/tmp/wall-legend122-tests-final.log`): 새 focus/cleanup·타 scope/시간 이벤트 무시·Frame 불변, 기존 CursorSync 회귀, Last semantics/alias·Hidden 복귀·밀도 변경 시 DOM 유지·기존 메뉴/링크/설정 회귀. 기존 duplicate manual mock 경고는 남아 있다. 대상5개 production root의 TS진단0(`/tmp/wall-legend122-types-final.log`), ESLint0(`/tmp/wall-legend122-lint-final.log`), production build성공(`/tmp/wall-legend122-build-final.log`,기존 bundle-size경고2), git diff --check 통과. 전체 repo tsc/모든 브라우저/지속 성능 검증으로 표현하지 않는다.
- **반영/보존:** 기존 launchd preview에 최종 빌드를 반영하고3317 `/api/health`·3318 `/health`200을 확인했다. 최종 QA 탭 dirty0을 확인한 뒤 갱신/캡처하고 전달용 탭을 유지했다. 다른 사용자 탭은 강제로 갱신하지 않았다. 기존 원본19개 Dashboard JSON을 REF-119 baseline과 비교해 모두 동일(`originals-verification.json`). 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe와 기존 미커밋 작업을 보존했으며 이를 섞은 임의 커밋은 만들지 않았다. 운영/고객/Backend/포트/배포 방식·48열·Drag/Resize 변경 없음.
- **증거/남은 검증:** `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-legend-ref122/`에 `qa-source.json`/`qa-color-saved.json`/`qa-final.json`, `originals-verification.json`, `legend-light-final.png`/`legend-dark-final.png`/`legend-focus.png`/`legend-right-menu.png`/`legend-responsive.png`를 보존했다. 실제 CCVM 데이터 재연결 후 실데이터·Firefox/터치·장시간 다수 패널 성능이 남아 있다. 전달 URL `http://127.0.0.1:3317/d/wall-legend-qa-122/qa-ref-122-wall-legend-c2b7-fixture-eab280-eca69d`.

## REF-123 — 공통 Time Series Tooltip 정밀 고도화 (2026-11-05)

- **분석:** TimeSeriesPanel→native TooltipPlugin2(cursor idxs/pin/Zoom)→TimeSeriesTooltip→getContentItems/formatter→WallTimeSeriesTooltip과 wallTooltipPosition을 추적했다. 기존 Wall은 native VizTooltipRow 내부 DOM을 스타일링했고, 큰 popup은 plot 위로 멀리 이동했으며 방향을 매 move마다 다시 판단했다. 범례 구조/정렬·REF-121 CursorSync 정책·쿼리/프레임 처리는 유지한다.
- **실제 참조:** Graph Playground web open은 실패했지만 이번 기존 Chrome 탭의 app-iframe은 실제 렌더링됐다. cpu 46.21%, Today 오후02:28–02:29(1min), 약219×91px Popup, header12px/16px·중립 Surface/단일 약한 Shadow를 확인했다. 공개 모델의 interval 정보와 Wall의 샘플 timestamp를 혼동하지 않으며 Wall에는 가짜 종료시각/집계 구간을 생성하지 않는다. Dynatrace 코드를 복제하거나 내부 renderer 구현을 확인했다고 표현하지 않는다.
- **제품 변경 파일:** `public/app/features/wall-modern/charts/WallTimeSeriesTooltip.tsx`(실제 label/value/time list·native 복사·독립 scroll·읽기 공간), 신규 `charts/tooltipModel.ts`(실제 시각 정밀도/timeZone), `chartTokens.ts`(Tooltip 목록240/최소196 토큰), `public/app/plugins/panel/timeseries/{TimeSeriesTooltip.tsx,TimeSeriesPanel.tsx}`(primary timeZone·actual dataIndex 전달), `packages/grafana-ui/src/components/VizTooltip/{types.ts,utils.ts}`(선택적 native indices 메타데이터), `VizPresentation/TimeSeriesPresentation.ts`(Tooltip 전용 Surface/maxHeight·opacity motion), `uPlot/plugins/{TooltipPlugin2.tsx,wallTooltipPosition.ts}`(측정·capacity·안정적 배치/수명). 기존 native ClipboardButton·FormattedValueDisplay·PanelScrollArea·ColorIndicator/푸터를 재사용하며 새 primitive/library/차트 엔진은 없다.
- **추가 수명 수정:** 실제 Shared Tooltip 고정 후 테마 변경에서 EventBusPlugin이 cleanup 후 null인 u의 cursor를 읽어 첫 패널에 TypeError가 발생했다. `packages/grafana-ui/src/components/uPlot/plugins/EventBusPlugin.tsx`의 setLegend/clear callback에 유효 인스턴스 guard를 추가했다. TooltipPlugin2의 오래된 callback도 disposed로 무시한다. Crosshair channel/전달 timestamp/모드 정책을 새로 구현하지 않았다. 최종 재검증은6plot·5Shared Tooltip·오류0으로 Light→Dark→Light 모두 정상이다. 중간 오류 화면을 최종 성공 근거로 쓰지 않는다.
- **비시계열 범위 보존:** Bar/XY/Histogram이 같은 WallTimeSeriesTooltip export를 재사용함을 확인했다. refinedInteractions=true만 새 TimeSeriesInformation 표시를 사용하고 false는 원래 행/스타일 fallback을 그대로 유지한다. 공통 Surface의 height/opacity opt-in도 같은 조건으로 제한했고 negative-path 테스트를 추가했다. 범례 구조·다른 패널 디자인을 자동 확대하지 않는다.
- **시간 정확도:** aligned Time field에 metric defaults의 percent가 있어도 native time formatter가 동작하므로 단순 unit 존재 여부로 명시 날짜 포맷을 판단하면 ms가 누락됐다. 실제 화면 datetime .150Z 대비 텍스트가 초까지만 표시된 것으로 확인해 time:/dateTime만 명시 날짜 설정으로 구분했다. 기본 정밀도는 실제 timestamp/interval 기준이고 UI는 KST/UTC를 따른다. 행별 nearest index가 header와 다르면 같은 날짜의 짧은 측정 시각을 추가한다. 기본 null/없는 index 제외·명시 noValue·Value Mapping/소수·단위·원본 copy 문자열은 native 정책 그대로다.
- **위치·밀도 반복 검토:** 최초에는 큰 Tooltip을 plot 위로 보내 이웃 패널/제목을 가렸고, 반대로 chart 높이에 엄격히 맞추면 두 개 행 중 하나가 가려졌다. 최종은 최소 읽기 공간196/목록 상한240·기존 명시 maxHeight·viewport 한도와 native chart/축 여백을 사용한다. 들어가는 방향을 유지하고 oversize는 chart 중심 근처에 최소 초과하도록 배치한다. Header/부가 작업과 목록을 분리하고 고정 footer 여백을 줄여2개 비동기 행 전체가 list104px/scrollHeight104에 보인다. 차트 자체 크기나 범례 구조는 수정하지 않았다.
- **Motion/포인터:** 현재 popup 크기를 실제로 측정한 후 같은 DOM을 before-paint/RO로 재배치한다. 재측정을 위해 native mousemove/setCursor를 재발행하던 Wall 경로는 제거했다. native hover/pin/Zoom·indices·Shared Tooltip을 유지하고, close 대기100ms 도중 재진입 시 hide timer를 취소해 지연을 줄였다. cleanup의 observer/timer 및 잔여 config hook을 정리/무시한다. Portal root는 기존 Wall motion 변수와 opacity170ms 진입·reduced-motion을 쓰며 위치 transform을 animate하거나 텍스트를 Scale하지 않는다.
- **QA/환경 구분:** CCVM read relay3319는 timeout, 실제10.10.22.10:3001도 연결 실패했다. 서비스/원본 datasource/운영 설정을 바꾸지 않았다. 로컬 QA datasource `wall-qa-testdata-123`(native TestData raw_frame)와 QA `wall-tooltip-qa-123` id104만 추가했다.6개 패널은 결정론적인 명시 fixture 배열(5초/1분/서로 다른 간격/250ms/Null/16개 긴 이름)을 사용한다. random 운영 수치나 실제 측정으로 주장하지 않는다. QA 시간 범위는06:00–06:10Z의 ISO로 바로잡았으며 초기에 숫자 문자열을 쓴 QA가6시간 기본 범위를 표시한 것은 제품 query 오류로 수정하지 않았다.
- **실제 데이터 대조:** 단일5초, Multi3개 중 Null 시2개,16개 긴 시리즈·분 단위·250ms와 작은 패널을 검증했다. 기준15:02:20/06:02:20Z에서 실제 느린 행15:02:00·다른 행15:02:22를 각각 표시한다. 마지막 값을 같은 기준시간의 측정값으로 재라벨링하지 않았다. 06:00:09.375Z의 raw13.7→13.70%,06:07:10Z raw17.87→17.87 ms를 native 표시와 대조했다(`source-values.json`). 기본 누락 행은0으로 나타나지 않는다. explicit null/noValue/zero·formatter·copy는 단위 테스트도 수행했다.
- **실제 상호작용:** Tooltip pin/close·긴 이름 title·native copy 버튼과 footer/주석 진입을 유지했다.16행 목록 마지막까지 scrollTop337/max337(client123px), 원래 chart rect x385/y595/w770/h126 불변을 확인했다. 작은 우측 패널의 Tooltip도 viewport 밖으로 잘리지 않았다. Shared mode는5개 data 가용 패널에 표시되고250ms 패널은 hover시각의 실제 데이터가 없는 구간이라 가짜 값/Tooltip을 만들지 않는다. 각 follower header는 실제 nearest sample이며 원본 Crosshair는 같은 절대시간을 유지한다. UTC/KST·분/초/ms·Light/Dark를 확인했다. OS 클립보드 실제 붙여넣기·Firefox/터치·고밀도 장시간 성능·OS reduced-motion은 별도 미검증이다.
- **검사:** 신규 `charts/tooltip.test.tsx`와 `uPlot/plugins/EventBusPlugin.test.tsx`, 기존 timeSeriesRefinement/metricProfiles/seriesLegend/CursorSync 총6suites/31tests 통과(`/tmp/wall-tooltip123-tests-final.log`). 기존 짧은 plot의 oversize 위치 테스트는 최신 중심 근처 배치 계약으로 갱신했다. 대상6개 production root TS진단0(`/tmp/wall-tooltip123-types-final.log`), 수정 파일 ESLint0(`/tmp/wall-tooltip123-lint-final.log`), build성공(`/tmp/wall-tooltip123-build-final.log`,기존 bundle-size경고2). 전체 repo tsc/전체 브라우저/실운영 검증으로 표현하지 않는다. 기존 duplicate mock 경고는 남아 있다.
- **보존/반영:** 원본19개 Dashboard JSON을 REF-119 baseline과 비교해 전부 동일. native 저장 모델·Threshold/Override/Transform·패널 크기/위치·48열/Drag/Resize·Legend/Crosshair policy는 보존한다. QA mode2/UTC를 검증한 후 graphTooltip0/Asia-Seoul로 복원하여 QA version8을 남겼다. 최종 사용 QA dirty0/오류0/Light를 확인했고 기존 사용자 탭은 강제 갱신하지 않았다. 기존 launchd preview에 최종 build를 반영하고3317/3318 health200, 기존 사용자 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe/미커밋을 보존했다. 혼합 커밋·운영/Backend/고객/포트/배포 방식 변경 없음.
- **증거:** `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-tooltip-ref123/`의 `before/` 소스 snapshot, `qa-source.json`/`qa-final.json`, `source-values.json`, `originals-verification.json`, `tooltip-before.png`, `tooltip-light-final.png`/`tooltip-dark-final.png`/`tooltip-shared-final.png`, `tooltip-many-scroll-final.png`, `tooltip-millisecond.png`, `tooltip-shared-utc-final.png`를 보존했다. 일부 중간 캡처는 최종 capacity 조정 전이며 최종 외형은 -final 캡처를 기준으로 한다. 전달 URL `http://127.0.0.1:3317/d/wall-tooltip-qa-123/f6ad244`.

## REF-124 — 이동·Resize 수치 오버레이만 제거 (2026-11-05)

- LayoutFootprint.tsx의 시각적 위치/크기 라벨 DOM과 kpiLayout.css의 미사용 라벨 스타일을 제거했다.
- 배치 footprint/빗금/정렬선/Dot Grid 및 aria-label은 보존했다. PanelLayoutGrid/geometry/스냅/포인터/저장 로직은 수정하지 않았다.
- 작은 표시 변경이라 신규 테스트/전체 회귀를 추가하지 않고 수정 파일 lint0·production build 성공(기존 size 경고2)·diff 검사 통과. 기존 launchd preview에 빌드를 반영했다. 실제 브라우저 Drag/Resize를 재검증했다고 표현하지 않는다. 기존 미커밋/index는 보존한다.

## REF-125 — 전체 품질 감사 및 안정화 1차 (2026-11-05)

- **요청/범위:** 사용자 첨부 품질 감사 명세에 따라 구조 조사→UI/데이터/기능 감사→P0~P3 분류→안전한 수정→검사→`docs/WALL_QUALITY_AUDIT.md` 작성까지 진행했다. 신규 기능/전체 디자인 재설계/운영 배포·DB·인증·버전·데이터 소스 변경은 하지 않았다. 보고서에 점검 영역·재현·원인/미확정·영향·검증·RC 차단 조건을 남겼다.
- **제품 수정:** `panels/statReadout.ts`/`plugins/panel/stat/StatPanel.tsx`에서 raw string의 numeric=NaN으로 Value Mapping 상태 색상을 잃는 P1을 수정했다. 실제 native row 또는 cached reducer result로 매핑을 판정하며 값/단위/계산/Threshold/쿼리는 보존한다. `toolbar/WallAdaptiveFilters.tsx`의 중복 blur rAF를 병합하고 unmount cancel을 추가했다. CSS나 새 primitive/library로 가리지 않았다.
- **검증 수정:** `statReadout.test.tsx`에 전체값/축약 문자열 상태 매핑 red→green2건, `adaptiveFilters.test.tsx`에 blur/cleanup 회귀1건을 추가했다. `colorFormat.test.tsx`는 REF-119의16색/prefix 계약으로, Toolbar 상대 시간 테스트는 해당 테스트 내부 clock 고정으로 정리했다. `visualization.ts`/`useWallDashboards.test.ts`는 import 순서만 수정했다.
- **검사 결과:** Wall 전체 수정 전57/8suites·440/16tests → 수정 후59/6suites·446/13tests(총65suites/459tests). 수정 동작4suites/50tests 및 마지막 Stat/filters2suites/10tests 통과. native adapter/editor8suites는5pass/3fail·21pass/21fail·snapshot1pass. 전체TS264진단/144files(최종), 변경4root 제한 source TS0, Wall전체+StatPanel Lint0, production build성공(기존size경고2), diff check통과. 남은 실패를 삭제/약화하지 않았으며 단위 통과를 전체90% 완성도의 근거로 쓰지 않았다.
- **남은 gate:** Grid의 즉시/rAF·이전 표시 계약·양쪽 핸들·overview DOM 관련12assertion 및 Value Mapping editor의 CSS matcher 예외1건. Prom/SQL/Loki도 JSDOM/nwsapi `querySelectorAll(...).includes`에서 실패했다. 임시 shim진단도 실패해 제품/공용 setup에 넣지 않았다. source11.4.0-pre/runtime9.2.0 및 CCVM relay502/Mold DB 연결 오류는 환경 제약으로 보존했다. 최초 wallModern 저장 전 Resize→Undo의 저장 바 잔류는 관찰됐으나 원인 미확정으로 기록했다.
- **브라우저:** Chrome1869×1150/DPR1.05의5탭 및 종합, native PromQL 코드/A·B/옵션/변환0개, Admin source목록/Wall상세·플러그인/Zipkin상세·사용자/조직 목록 읽기 접근. 별도QA에서 문자열 상태가 empty/회색/dot없음→status/red/dot있음(Light/Dark), SE Resize313×182→377×228·Undo/Redo·native저장version2·새로고침복원, Grip이동→취소, 복제6→7→6/Undo dirty0, Kiosk6panels/handles0→ESC handles12/settings1·원래rect, 목록scroll0→404·값 여유, 두plot SharedTooltip 실제 timestamp/단위 확인. 자동화 virtualclipboard가 C/V를 차단한 것은 실기 통과로 보고하지 않았다. Viewer실계정/Firefox/터치/장시간 profiling은 미검증이다.
- **보존/반영:** 기존 launchd3317에 최종 build를 반영했으며3317/3318 health200. QA `wall-audit-qa-125`만 로컬 생성/저장했고 기존19개 Dashboard JSON 전부 동일. 사용자 기존 탭은 강제 새로고침하지 않았다. 최종QA Light/dirty0/Unexpected error없음 확인 후 전달 탭을 유지했다. 사용자index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe와 기존 미커밋 작업 보존, 혼합 커밋 없음.
- **증거/후속:** `/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-audit-ref125/`에 before/·originals비교·inventory·QA baseline/저장본·TS분류·logs/·configs/ 및 전후/Light/Dark/편집/종합 화면 캡처. 보고서의 RC 차단 항목부터 다음 작업을 진행하며 P3 미세 스타일을 먼저 확대하지 않는다. 전달 URL `http://127.0.0.1:3317/d/wall-audit-qa-125/716c9ce?theme=light`.

## REF-126 — 품질 감사 기반 2차 안정화 (2026-11-06)

- 보고서의 미해결 이슈를 재검토하고 공통 Select CSS 예외(AUD-006)와 배치 metadata false Dirty(AUD-009)를 수정했다. 기존 해결된 Stat/필터/Toolbar는 재구현하지 않았다.
- `getSelectStyles.ts`의 relational :has 선택자를 단순 adjacent sibling으로 바꿔 동일 경계를 표시했다. 정상 설정으로 ValueMapping/Prom/SQL/Loki 4suites/35tests 통과. 새 `getSelectStyles.test.tsx`는 경계선과 role 조회를 검사한다. prototype shim·테스트 우회 없음.
- `wallDocument.ts`의 normalization 비교를 기존 sameKpiLayout(ID별 geometry)으로 통일했다. 순서/임시flags만 다른 경우의 red→green 회귀를 `wallDocument.test.ts`에 추가하고 실제 geometry/텍스트 변경 보존도 확인했다. AUD-007의 최초 저장 전 Dirty 전체 해결로 보고하지 않았다.
- 관련5suites/47tests 통과, 전체Wall65suites 중60pass/5fail·448pass/12fail. 수정2production root 제한TS0·수정파일Lint0·diff check통과, production build성공(기존size경고2). 전체 타입264진단 및 남은 layout/overview 실패는 미해결이다.
- Chrome QA125의 미저장 없음 상태에서 최종 빌드를 반영해 게이지 편집기의 실제 색상 Select 열기/ESC닫기·변경사항없음·대시보드복귀 확인. 기존 서비스3317/3318 health200, 원본19개JSON동일·사용자index0423fc0071bb143a81f8064df2bec6e8f3a43afe보존. 운영·고객·인증·쿼리·데이터소스·설정 변경/혼합커밋 없음.
- 감사 보고서 이슈 상태와 2차 결과를 갱신했다. 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-audit-ref126/`: logs·원본비교·select-menu.png. RC보류 유지. 후속은 초기wire/native baseline·실패 Grid tests·패키지타입해석이며 근거 없는 시각 변경은 하지 않는다.

## REF-127 — Release Candidate 준비 검증 (2026-11-06)

- docs/WALL_RELEASE_READINESS.md 작성. 새로운 제품 기능·디자인·백엔드/운영 수정 없음. 기존 audit 미해결 P1/P2를 RC gate에 연결했다.
- AppleM4/24GiB/Chrome 로컬 QA wall-rc-qa-127에 시계열24×시리즈8×121시점(값슬롯23232/Null144)을 생성했다. 5초갱신설정71.218초 관찰3점은 plot24/canvas24/DOM7169/Dirty0/오류화면없음. 실제 tick수·FPS·heap·GC후retained memory·CPU는 계측하지 못했으며 값을 추정하지 않았다.
- 목록↔QA3회: 밖plot0→안24, 저장후DOM7197·Dirty0·console error조회0. Light/Dark 재진입도24plot유지. DOM수 안정성을 메모리 누수없음으로 단정하지 않았다. TooltipPlugin2의ShiftZoom 임시mouseup listener/pin timer 수명은 집중해제재현 후속으로 기록했다.
- 첫series Mean20.05/Last17.32/Max25/Min15 및15:05의raw18.603→18.60%를 대조했다. Zoom→URL06:01:23.505Z~06:06:32.783Z. Resize preview/실제 x312/y213/w564/h328 일치, 저장version2·새로고침 동일/Dirty0, Grip이동취소복원. 최초저장전Undo Dirty잔류 재관찰. 전체Shared Hover/Pan 실기 통과로 보고하지 않았다.
- 전체Wall65suites 60pass/5fail·448pass/12fail, native어댑터/편집기/저장추적10suites/56tests/snapshot1pass. 전체tsc264진단exit2. Wall전체Lint0·production build성공(기존size경고2). 기존sourcealias로컬설정과clean CI검증을 구분했다.
- 로컬QA GET읽기10회200, 중앙4.760ms/최대18.385ms. 로컬API latency이며 렌더·운영쿼리 처리량이 아니다. raw_frame 직접backend호출500은frontend전용경로와달라 부하측정에서제외했다.
- QA127만native저장/시험했고 종료시refresh를꺼짐으로version3에보존해배경부하를없앴다. 원본19개JSON전부동일·사용자index0423fc0071bb143a81f8064df2bec6e8f3a43afe불변. 운영/포트/인증·기존데이터소스변경없음.3317/3318health200.
- RC진행불가: 타입/레이아웃gate·최초저장전Dirty·source11.4pre/runtime9.2불일치·실데이터/역할별/성능검증결손. 증거 /Users/hongwookryu/.codex/visualizations/2026/11/06/wall-release-ref127/ (fixture/관찰JSON/latency/source값/원본비교/logs/Light·Dark캡처). QA탭최종Light/갱신꺼짐유지.

## REF-128 — 다중 Tooltip 동시 표시 원인/Source-Follower 정리 (2026-11-06)

- 실제 RC QA127의 graphTooltip2를 확인했다. native TooltipPlugin2의 syncTooltip=true에서 Follower Popup을 여는 것은 명시 Shared Tooltip 동작이며 버그와 구분했다. 제가 만든 회귀 QA127의 기본만1(Crosshair)로 정정했고, 원본19개 대시보드의 설정/JSON은 유지했다. QA127 panels는변경전후완전동일, metadata graphTooltip1/version4만반영했다. 새QA128은검증용24plot/8series이며0→2→1설정을검증하고version5/모드1로두었다. 강제Hover스크립트없음.
- 공통TooltipPlugin2 refined 경로에 유효index/Plot범위/mouseleave판정·즉시이탈해제·비활성Follower setSeries no-op을 추가했다. 단순외부timestamp수신으로mode1Popup을만들지않는다. EventBusPlugin은 uPlot이보존한이전DOMevent를받은이벤트에재사용하지않도록cursor갱신/clear중undefined로두고finally복원한다. native uPlot sync/기존버스/모드2를재사용하고새버스없음.
- 실제코드수정2개/회귀test2개. TooltipPlugin2.test.tsx는모드0/1/2·Source유효성·경계이탈·NoData·24호스트에서Source1개/Follower content0 및Source전환을검사한다. EventBusPlugin.test.tsx는외부수신시local event제거/재발행0/cleanup을검사한다. 수정전이탈3건실패와adapter1건실패를별도red로그로확인했다. 최종관련8suites/43tests통과, 수정2production roots 제한TS0·수정파일Lint0·production build성공(기존size경고2).
- 브라우저실측: click pin은구분하고native좌표기반포인터이동으로비고정Hover검증. 24plot에서0:Tooltip1/otherscursor-10,1:Tooltip1/visiblefollowersX204px일치,Source2로이동시같은1개+source2내용,외부이탈0/-10.2:명시SharedTooltip9개(현재보이는패널)·외부이탈0. Dark1개/동일X. Tooltip목록client160/content236·긴이름/값정렬·내부scroll유지. 최종build에서Zoom URL변경·Resize preview실제x312/y213/w564/h328일치·취소·Grip이동취소후dirty0·Hover복귀확인. Pan은기존단위회귀범위이며새실기완료로표현하지않는다.
- 기존launchdpreview에최종build반영·3317/3318health200. 원본19개JSON/사용자index0423fc0071bb143a81f8064df2bec6e8f3a43afe불변. 실제사용중인QA127탭은현재관리탭목록에없어강제갱신하지않았고,새QA128에서최종1→외부0/dirty0확인후전달탭유지. 실제고객/Backend/포트/인증·기존쿼리/단위/계산/범례/패널배치변경없음.
- 증거 /Users/hongwookryu/.codex/visualizations/2026/11/06/wall-tooltip-ref128/: before소스·red/green/type/lint/build로그·각모드실측JSON·Light/Dark/명시mode2캡처·QA설정전후/panels동일·원본JSON비교. 기존RC차단gate는유지한다. 전달URL http://127.0.0.1:3317/d/wall-tooltip-qa-128/d70e876?theme=light .

## REF-129 — Time Series Tooltip·Legend 실제 스크롤 (2026-11-06)

- 새 QA `wall-scroll-qa-129`(2/8/20series·Bottom/Right·작은 패널)에서 비고정 Tooltip의 pointer-events:none을 재현했다. Tooltip 안 휠이 뒤 Bottom Legend를0→156으로 스크롤시키고 Popup은 닫혔다. 높이/overflow 자체는 유효했다.
- 제품 수정은 공통 `TooltipPlugin2.tsx` 한 파일이다. refined Source의 입력 허용, Pointer/Focus 동안 실제 sample/position 보존, 기존100ms Plot→Popup bridge, 이탈/ESC/데이터/외부스크롤/Resize 정리와 React wheel/pointer 경계를 추가했다. preventDefault·신규 engine/CSS/라이브러리 없음. native pin·legacy fallback·0/1/2 모드는 보존했다. 키보드 Focus 뒤 다른 Source로 이동해도 이전 Popup을 닫는다.
- REF-129 당시 조건에서는 범례 기능이 동작했다. 초기화에 따라 손잡이만 입력을 받지 않는 후속 결함은 REF-133에서 수정했다. 클릭/Focus 없이 Right0→646/646·Bottom0→494/494를 Light/Dark에서 확인했다. native Thumb 드래그·Home/End·마지막 시리즈 메뉴도 확인하고 기존 CustomScrollbar/Legend 코드는 수정하지 않았다. Tooltip2series overflow0/8series0→76/76/작은20series0→412/412·마지막19행 가시/Right20series0→390/390. Timestamp Header·position 유지, 실제 휠/Thumb/키보드·Source 교체1개·이탈0개·Plot Zoom 정상. 목록 스크롤 중 URL/plot 위치는 동일했다.
- `TooltipPlugin2.test.tsx`는 입력 허용/비취소 wheel·조상 전파 차단/실제 point 유지·지연 이탈/타이머 cleanup/Focus 후 pointer exit/ESC/passive/native pin fallback을 추가 검사한다. native setCursor mock도 실제 좌표 갱신을 반영한다. 관련6suites/33tests·snapshot1/Lint 통과. production2roots 제한TS0·production build 성공(기존 size경고2). 새 테스트를 포함한 TS의 ReactPortal/ReactNode 중복 선언1건은 이전 테스트에서도 재현되어 기존 환경 제약으로 남긴다.
- 물리 트랙패드/Firefox/별도 Explore·Pan E2E/실데이터·장시간 검증은 완료로 표현하지 않는다. 기존 RC 차단은 유지한다. 원본19개JSON 및 사용자 index0423fc0071bb143a81f8064df2bec6e8f3a43afe 동일. 기존 미커밋 작업을 섞은 커밋 없음. launchd3317 최종빌드/3318 health 확인. 사용자 기존 탭을 강제 갱신하지 않고 새 QA129만 사용했다.
- 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-scroll-ref129/`: before source·fixture·browser-observations.json·Light/Dark 캡처·원본 JSON 비교·테스트/타입/빌드 로그. 최종 QA Light/고정시간/refresh꺼짐/dirty0이며 URL은 http://127.0.0.1:3317/d/wall-scroll-qa-129/3c9ee26?theme=light .

## REF-130 — Dynatrace 비교 기반 Tooltip 가림 수정 (2026-11-06)

- 사용자가 지적한 QA128 실제 탭에서 미저장0을 확인하고 전후를 비교했다. 이전 작업은 입력만 복구했으며 큰 Popup이 그래프를 가리는 문제는 남아 있었다. 실제 Dynatrace Graph Playground14series CPU의 Explore Hover는 가까운1series/273.56×90.95px이었고 click-pin 시 pointer-events:none→all이었다. 관찰한 예제와 모든 제품 설정을 혼동하지 않는다. 비교 자체를 명분으로 Wall의 저장된 Multi8을 Single로 변경하지 않았다.
- 제품5파일: chartTokens.ts·VizPresentation/TimeSeriesPresentation.ts의 기본폭320/compactPadding/visibleRows3, WallTimeSeriesTooltip.tsx의 실제 개수 Header, wallTooltipPosition.ts의 커서 옆 viewport 배치, TooltipPlugin2.tsx의 Hover/pin 용량·재측정을 수정했다. 실제 데이터·쿼리·JSON·통계·공통 범례·Grid/Drag/Resize·기존 동기화/입력 유지 경로는 유지했다. 새 라이브러리 없음.
- 같은 실제 패널·같은15:09:15: Popup400×194→320×118, Plot388×101 동일. Plot 가림88.40%→26.67%·커서 점 가림 없음,8개 값/단위 문자열 동일. 이는 해당 위치의 대표 실측이며 전체 화면 가림0이나 디자인 점수로 표현하지 않는다. Multi의 Floating Popup은 여전히 주변 콘텐츠 일부를 덮을 수 있다.
- 8series 스크롤144/144·Thumb/Home·마지막행 가시·Header/시점/위치 유지·Source1개/이탈·우측 viewport flip·Light/Dark·native pin240px/닫기 확인. QA129 작은20series도 원래20행 유지/480→480 마지막19행 가시. 사용자 QA128에 최종 빌드 반영했고 실제 URL 시간 범위/패널 모델을 바꾸지 않았다. 기존 다른 미저장 탭은 갱신하지 않았다.
- 관련6suites/26tests·snapshot1, 수정파일Lint0, 수정5production roots TS0, production build성공(기존size경고2). 기존 전체 RC 차단은 해제하지 않았다. 원본19개 JSON과 사용자 index0423fc0071bb143a81f8064df2bec6e8f3a43afe 동일, launchd3317/3318health정상. 기존 미커밋 작업을 섞은 커밋 없음.
- 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-tooltip-occlusion-ref130/`: source before·Dynatrace/Wall 전후/다크 캡처·comparison.json·원본JSON비교·test/lint/type/build로그. 물리 트랙패드/Firefox/실데이터·장시간 검증은 이번 결과로 완료 처리하지 않는다.

## REF-131 — 이동 핸들 폭 확장 (2026-11-06)

- 사용자 요청에 따라 공통 surfaceTokens.ts와 workspace/panelActions.css만 수정했다. 이동 슬롯/버튼 폭28→48px, 높이28·아이콘14·메뉴폭28을 유지하고 기존 중립 Hover Surface를 사용했다. 새 컴포넌트/라이브러리/엔진 변경 없음.
- QA129 새 탭에서 실제48×28·제목 시작/메뉴 분리, 새로 넓어진 우측 영역에서 실제 드래그→Dirty→취소/복원을 확인했다. Light/Dark 크기 동일·색상 정상. 검증 배치를 저장하지 않았고 최종Dirty0이다. 기존 사용자 탭은 목록 화면으로 이동해 강제 갱신하지 않았다.
- build성공(size경고2)·수정TS Lint0·diff-check 통과,launchd3317/3318health정상·사용자index0423fc0071bb143a81f8064df2bec6e8f3a43afe불변. 불필요한 전체테스트/커밋 혼합 없음. 실제 화면 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-grip-ref131/handle-full.png`.

## REF-132 — 이동 아이콘 확대 요청 해석 정정 (2026-11-06)

- 사용자는 점으로 구성된 아이콘을 가로로 확대하라고 요청했다. REF-131에서 버튼 폭/회색 배경을 확대한 것은 오해였으므로 해당 CSS/48px 토큰을 원복했다.
- 기존 Lucide GripVertical14→GripHorizontal24(3열×2행), 공통 moveGripSize 토큰을 적용했다. 버튼/예약 슬롯은28×28 그대로이며 데이터·레이아웃 엔진/이벤트는 변경하지 않았다. 기존 로컬 shadcn/Base UI Button 재사용이다.
- 실제 QA129 탭에서 button28×28/icon24×24·6개점 x5/12/19·y9/15·배경 원복 확인. 최종 build성공(size경고2)·TS파일 Lint0·diff-check 통과. 3317 최종빌드 반영. 캡처 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-grip-ref132/handle.png`.

## REF-133 — Right Legend 손잡이 드래그 복구 (2026-11-06)

- 실제 사용자 QA129에서 Thumb/Track 입력 scrollTop0·같은 목록 휠646/646을 재현했다. native hit-test는 Thumb를 가리켰다. react-custom-scrollbars-2의 addListeners가 gutter0이면 마우스 listener를 등록하지 않고, 이후 측정/표시 때 보완하지 않는 구조를 확인했다. 새로고침 후 측정값15에서는 기존 드래그가 동작했다. 실패 mount의0은 직접 측정하지 못했으며 코드 경로/회귀0→15 결과와 구분한다.
- 제품 수정은 공통 CustomScrollbar.tsx 한 파일이다. Wall context의 custom JS Track을 숨기고 기존 PanelScrollArea 공통 스타일과 브라우저 native Thumb/viewport를 사용한다. 안정적인 gutter/clearance·라이브러리 sizing/callback·legacy 비Wall 경로 유지. 임시 계측 코드는 제거했고 새 라이브러리/엔진/primitive는 없다.
- CustomScrollbar.test.tsx에 gutter0→15에서 native viewport가 숨겨지지 않고 custom Track이 되살아나지 않는 회귀를 추가했다. 관련4suites/23tests·snapshot1pass, 수정2파일Lint0·production1root 제한TS0·production build성공(size경고2). 기존 전체 타입/RC gate는 미해결 유지.
- 실제 Chrome 1869px에서 Right Thumb0→646/646·역방향0·휠646·Home0, Bottom8 Thumb156/156, Light/Dark, 마지막19행 메뉴/ESC 확인. 다른1656px 사용자 탭의 새로고침 후 첫 Thumb 드래그도646/646.4개Plot DOM rect 전후동일·Dirty0. native 캡처 전후 scrollTop646 동일이며 마지막19행이 실제로 보인다. 물리 트랙패드/Firefox/실CCVM 재검증 없음.
- 원본19개 JSON 및 사용자 index0423fc0071bb143a81f8064df2bec6e8f3a43afe 불변. 기존 미커밋 작업은 보존하며 혼합 커밋하지 않았다. 사용자 QA2개는 미저장0 확인 후 갱신했고 최종 Light·고정시간·갱신꺼짐 유지. 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-legend-drag-ref133/`(browser-results.json, legend-native.png, 원본비교/회귀/타입/린트/빌드 로그).

## REF-134 — 빗금 미리보기 추종 Motion (2026-11-06)

- 사용자가 요청한 패널과 빗금의 약한 분리감을 공통 LayoutFootprint에서 구현했다. 정확한 drop 테두리/정렬선은 즉시 유지하고, 별도 ink DOM만110ms/기존grid easing으로 transform/width/height를 따라간다. 새로운 지연 큐/타이머·엔진·라이브러리는 없다. REF-60 snap/REF-62 최종preview확정·실제패널/포인터/저장/Undo 모델은 수정하지 않았다. motion.css·workspace/LayoutFootprint.tsx·kpiLayout.css가 제품 수정3파일이다.
- 실제 QA129 별도 탭에서 native Drag/오른쪽/왼쪽 Resize와 read-only DOM 스냅샷을 동시에 수집했다. Resize target566×268 vs ink600.59×283.91 등 전환 중 차이를 확인했다. drop preview와 실제카드 x/y/w/h는 Light Resize312/213/457/244·이동312/213/457/244·Dark 왼쪽Resize421/213/348/280으로 일치했다. 종료가이드0·취소 후Dirty0·최종Light를 확인하고 검증 탭을 닫았다. 영구 저장/원본대시보드 변경 없음.
- LayoutFootprint.test.tsx는 안정적인ink DOM·정확한 drop border의 즉시 갱신·hide/새gesture정리를 검사한다. 관련3suites/24tests통과, 수정TS Lint0·production1root제한TS0·productionbuild성공(기존size경고2). 기존 전체RC제약을 해소했다고 확대하지 않는다.
- 기존 사용자QA129탭1870은dirty상태여서 새로고침하지 않았다. 종합탭1853은dirty0확인 후 최종build로갱신해110ms공통토큰/23개Grip/dirty0확인.3317/3318health정상, 사용자index0423fc0071bb143a81f8064df2bec6e8f3a43afe불변·기존미커밋작업보존·혼합커밋없음. 고객/Backend/포트/인증 변경없음.
- 사용자 설명의 Dynatrace UX를 참고했으며 이번에 Dynatrace 내부 duration을 계측하지 않았다. reduced-motion 공통규칙을 보존했지만 OS환경변경 실기는 하지 않았다. 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-footprint-motion-ref134/`(before·browser-results.json·실제조작중motion-dark.png·검사로그).

## REF-135 — 미리보기 채움/테두리 일체화 및 추종감 재조정 (2026-11-06)

- 사용자 피드백으로 REF-134의110ms/분리된 ink 방식은 시각적으로 부적합함을 확인했다. 축소 시 이전 크기의 채움이 즉시 테두리 밖에 남는 구조였다. 가시적 preview 상자1개에 border+inset ink를 묶고 overflow:hidden으로 제한했다. ink의 별도 위치/크기 전환을 제거하고 preview 자체에220ms/ease(.25,.1,.25,1)를 적용했다.
- 정확한 논리 목표 DOM은 테두리를 그리지 않고 guides/aria/drop 진단을 유지한다. 가시적 preview는 이를 향해 전환하므로 전환 중 preview와 drop 경계가 항상 일치한다는 REF-134 주장은 대체된다. 실제48열/패널/포인터·gesture.preview 확정·충돌/저장/Undo는 수정하지 않았다. 제품3파일 및 LayoutFootprint.test.tsx를 갱신했다.
- 실제Dynatrace Graph에서 grid-layout-item transform0.2s computed/CSS placeholder배경을 읽었다. 기존 사용자 미저장 데모를 변경하지 않았다. 별도Getting Started iframe은 로딩실패로 실기벤치마크 불가였으며 폐기했다.220ms는 Wall 자체값, Dynatrace active gesture정밀계측이라고 표현하지 않는다.
- QA129 별도탭에서 축소→확대/Dark왼쪽축소/이동, 실제종합 탭에서Resize실기. ink가 preview 내부에 붙고 외부 독립채움이 없음을 DOM/실제캡처로확인, 종료레이어0·취소Dirty0·Light복귀. Resize 목표/실제는 QA474×220/698×296/570×244·종합156×172로 일치했다. 이동은 목표570→최종564폭 차이가 관찰되어 미해결 후속으로 기록했다(가용폭 재계산 추정·원인 미확정). 해당 이동까지 pixel일치라 보고하지 않는다.
- 관련3suites/24testspass·수정TSLint0·production1root제한TS0·build성공(size경고2). 종합탭1853 dirty0 확인 후 갱신/최종220ms반영·시험변경취소, 사용자QA1870 dirty상태보존/미갱신. 검증탭닫음. 사용자index불변/기존미커밋작업보존·혼합커밋없음.
- 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-footprint-motion-ref135/`에 before·실측JSON·실제축소중shrink.png·검사로그. 단일gesture안방향반전/OS reduced-motion/Firefox/장시간 검증은 수행하지 않았다. 기존RC차단은 유지한다.

## REF-136 — 실제 패널의 Resize 지연 폭/우측 깜빡임 수정 (2026-11-06)

- 이전 REF-135로 해결되지 않은 실제Chrome돌출을 재현했다. Scenes VizPanelRenderer(useMeasure)→PanelChrome의 고정pixel 외곽이 부모Grid축소보다 늦게 갱신됐다. native 실측host484px/Chrome573px·89px우측돌출/부모overflowvisible. 수정 전 DOM/캡처를보존했다. 빗금의 지연모션과 다른결함이다.
- PanelChromePresentation.ts의 fitToContainer opt-in, PanelChrome.tsx의 viewport percentage sizing, WallDashboardPanel.tsx 공통활성화를 구현했다. 기존 renderer 계산은 측정pixel을 계속 사용하고 outer frame만 부모와즉시일치한다. 기존overflowhidden이 stale 내부Canvas를 현재외곽안에둔다. 새 임시숨김/offset/CSS덮어쓰기는없고 native기본/collapsed/autoheight정책보존이다. motion.css는빗금추종220→280ms만변경했다. 제품4파일·test1파일.
- 새 회귀는 기존pixel573×268→기대100%에서실패하는 red를확인했다. 최종관련4suites/46tests중45pass·기존메뉴visibility1fail. 이1건은수정전PanelChrome에서도동일실패확인(별도log), 테스트기대값미변경. 수정TSLint0·production3roots제한TS0·productionbuild성공(size경고2).
- 동일좌표 Light축소5샘플·확대7·Dark왼쪽축소6·실제설정의로컬종합KPI9샘플에서 Chrome/frame우측돌출0px(총27active샘플). 확대이웃밀림조건포함, Dark하단0. 종료preview0·메뉴/ESC정상·검증배치전부취소Dirty0/최종Light. 고객실환경검증·모든프레임·단일gesture내왕복/Firefox완료로표현하지않는다. 별도REF135 이동종료폭6px미해결유지.
- 사용자종합1853은dirty0확인후최신build로갱신·280ms/Chrome100%확인, 시험Resize취소/dirty0. QA1870기존미저장탭은갱신하지않았다. 사용자index0423fc0071bb143a81f8064df2bec6e8f3a43afe동일·기존미커밋보존/혼합커밋없음,3317/3318health정상. 원본Dashboard JSON/쿼리/저장데이터변경없음.
- 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-resize-flicker-ref136/`: before소스/실측/캡처·browser-results.json·resize-dark.png·기존구현red/최종test/메뉴baseline/type/lint/build로그. 전체RC차단은유지한다.

## REF-137 — QA Scroll 20 / Right 확대 시 내부 지연 폭 수정 (2026-11-06)

- 사용자확인대상에서 같은방향확대재현. outer frame만수정한REF136후에도 body729px vs plot396+legend204=600px인 active샘플(오른쪽129px공백)을확인했다. nativeScenes측정props와현재host표시크기갱신시점차이이며 범례데이터를수정할문제가아니다.
- 제품수정PanelChrome.tsx와신규usePanelChromeSize.ts2개. fitToContainer에서ownframe RO의측정을before-paint flushSync로inner/header크기계산에반영한다. 초기layout측정은정상setState, legacy upstream props/defaultuseMeasure유지. 기존loadingBar observer는Wall에서attach하지않고새관찰자로대체한다. 중복size무시·disconnect/disposed정리·no polling/신규engine/CSSoverride. Query/단위/통계/48열/저장·280ms모션유지.
- 신규테스트는ROcallback내act가끝나기전720/864/500/800크기갱신/cleanup을확인. 비동기state변형red실패→정상green통과. hook/footprint2개 및기존nativefill/padding2개통과, 기존20native항목은이번집중run에서실행안함. production2roots제한TS0·ESLint0·build성공(기존size경고2). 기존native메뉴visibility/RCgate미해결유지.
- 실제QA Light확대2회/Dark확대에서수집된body/viewport오른쪽gap0·범례스크롤690/690·consoleerror0·원복dirty0/Light/preview0. API샘플은Lightactive0/Darkactive1로중간프레임확보가제한돼 모든프레임/성능검증완료로표현하지않는다. 운영데이터검증이아닌TestDatafixture검증이다.
- 실제사용탭1505는구버전/dirty1,1870은136수정/dirty1확인. 두탭을강제갱신하지않고새1913QA를수정코드검증/배치취소상태로남겼다. 원본저장데이터/기존index/사용자미커밋보존,stage/혼합커밋/운영변경없음. 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-expand-ref137/` (before소스·측정JSON·새실측·캡처·red/green/native/type/lint/build로그).

## REF-138 — Time Series 종합 검토 및 안전한 P2/P3 개선 (2026-11-06)

- 사용자 첨부 명세를 읽고 공통 TimeSeriesPanel→표시용 프레임→GraphNG/uPlot→범례/Tooltip/Sync를 추적했다. `docs/WALL_TIMESERIES_REVIEW.md`에 native와 Wall의 책임, 기존 완료 기능과 미완성 Pan, 객관적 결함/취향, P1~P4·후속을 기록했다. 실제 CCVM 연결과 source/backend 버전 차이·기존 RC gate는 미해결로 유지한다.
- 제품3파일 수정: VizLayout의 Wall Right 선택 보존·CSS 제한된 실측 width 차감·flex/size guard, WallSeriesLegend의 단일 통계 Inline 조건, seriesLegend.css의 이름/값/메뉴 한 행 정렬. 기존 토큰 사용·native fallback 보존·UID/패널ID 예외 없음. 새 primitive/라이브러리·쿼리/통계/색/Tooltip/동기화/Grid/모션/저장 수정 없음.
- 새 VizLayout 회귀3개와 Legend 적응형 회귀를 추가했다. 수정 전 narrow Right 실패 재현→수정 후 통과. baseline7suites/68tests, 최종10suites/77tests pass. 변경TS4개ESLint0·production2roots 제한TS0·webpack9830ms성공/기존size경고2. 전체 타입·RC 통과를 의미하지 않는다.
- 실제 QA129 Right20 행42→26px·전체864→544px, viewport280×218 및4차트 루트 rect 동일, raw17.317→표시17.32% 유지. 휠로 마지막19, 격리/복원1→20, 이름내림차순/원복 확인. Tooltip2/8/20 전체값·스크롤144/144 및480/480·시점유지·Source전환·이탈0, X zoom URL변경/원복·Light/Dark 확인. QA128은24plot/동일cursor156px/Tooltip1·이탈0. QA122는7plot/좁은 폭/4통계/단일List 보존 확인. 관찰 콘솔error0. Firefox/실제트랙패드·장시간/모드0·2 브라우저 신규 실기는 안 했고 unit/과거 기록과 구분한다.
- 기존 사용자1505/1870 미저장 탭은 보존/미갱신. 별도1916을 최신 빌드 QA/Dirty0·Light로 남긴다. launchd preview/fixture와 health를 최종 확인하고 사용자 index를 보존한다. 기존 미커밋 작업과 섞인 커밋은 만들지 않는다.
- 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-timeseries-review-ref138/`: before3소스/Light, afterLight/Dark/rect, Tooltip20/다중통계/24sync캡처·JSON·baseline/red/final/type/lint/build 로그. 명시적으로 저장된 선/Fill/Interpolation 때문에 남는 Grafana 인상을 임의로 덮어쓰지 않았다.

## REF-139 — 조작 대상에 따라 이동하던 Dot 격자 기준 고정 (2026-11-06)

- 사용자 양쪽 패널/다른 모서리의 Dot 불일치를 기존QA129에서 재현했다. 원인은 guide가 active resize anchor/west를 받아 SE에서 gutter를 빼고 SW에서는 빼지 않는 방향별 표시 계산이다. 같은 폭1305/gap8에서24열 점 SE649/SW657px를 실측했다. 저장 좌표·쿼리 문제로 설명하지 않는다.
- 제품2파일 수정: LayoutGridGuide의 Dot을 공통 셀 기준에서 반 gutter만 뺀 간격 중앙으로 고정하고 fixed-corner 추가 점을 제거했다. PanelLayoutGrid에서 guide에 조작 패널/방향을 전달하지 않는다. 실제 snap·48열·Resize·반대 모서리·간격·저장/취소·모션·데이터 및 최근 범례 개선은 그대로다. CSS Transform 보정이나 새 라이브러리 없음.
- 새 LayoutGridGuide 회귀3개는 수정 전실패→통과. 기존 PanelResizeGrid 테스트에 idle/SE/SW 기준 SVG 불변 검증을 추가하고 저장·복원/손잡이 DOM·좌표 기대를 보존했다. source mapper의5suites32tests 통과. 기본 Jest의 worktree UI module 해석 실패1suite는 별도 로그에 남겼다. production2roots 제한TS0·수정TS4개Lint0·webpack12930ms성공/기존size경고2.
- 별도QA1930에서 양쪽 패널 SE/SW 세로·너비 변경/Dark 실기. 모든 관찰 active 샘플의 Dot24=653px, 실제 카드 경계961/969 사이 전역965px로 각4px. 수평축소 preview/실제 SE312/213/594/296·SW1023/213/594/296 일치. 종료footprint0·시험취소Dirty0·Light·관찰consoleerror0. 모든프레임/Firefox/전체RC를 검증했다고 표현하지 않는다.
- 사용자QA1916도 미저장 변경이 확인되어 갱신하지 않았다. 기존 사용자1505/1870도 보존하고1930만 최신/시험원복 검증 탭으로 남겼다. launchd서비스/HTTP와 기존index불변을 최종 확인한다. 기존미커밋 작업을 섞은 커밋 없음. 증거 `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-grid-reference-ref139/`에 before2소스/양방향샘플, after양쪽·Dark PNG/JSON, drop rect, red·final·type·lint·build 로그를 보존한다.

## REF-140 — frontend/backend 출처 조사 및 격리 정합 환경 복구 (2026-11-06)

- 3317 PID1407→`/tmp/wall-modern-lite-runtime/grafana-source` 직접실행/정적main checkout/public/지속설정grafana.ini를 확인했다. proxy로9.2health를 받은 것이 아니다. oldGoBuildInfo revision9e170f6…/modified=true/oss/버전linkerflags없음. 해당revision package.json도11.4.0-pre, 현재HEAD와 tracked backend/Go module 차이없음. main.version 기본9.2.0·commitNA·미설정buildstamp의시작시각대체가 원인이다. 이전dirty내용까지 같다고 단정하지 않았고 REF138의공식9.2backend라는해석을정정했다.
- 현재HEAD4dad0b48…+dirty Wall 소스로 OSS Wire를 생성하고 backend/production frontend를 함께 빌드했다. current Worktree에는 ignored wire_gen.go가 없어 최초직접build가실패했고 officialgen-go와같은생성후통과. Go1.23은.git디렉터리만인식해linked Worktree 자동VCSstamp가빠짐을toolsource에서확인. 없는stamp를주장하지않고 실제build명령·full linkedcommit·빌드전후source지문·binary/assets해시를검증한다.
- 새 `scripts/wall-preview-check.py`, `scripts/webpack/webpack.wall-preview.cjs`, checker unittest9개, Makefile검사target을추가했다. build/record/check/run과시작전검사만있는local개발도구다. 원본DB/보호port/GF override/기존binary덮어쓰기를거부한다. canonicalfrontend에는currentrootUI/SQL/Prometheusalias를사용한다. 단순버전상수변경/공식backend다운로드/제품로직변경없음.
- `~/Library/Application Support/ABLESTACK/WallPreview/coherent-20261106/`에SQLite Online Backup API로DB복사,configauth/security/secret동일보존·경로/port만분리,home/publicsnapshot을구성했다. 새userlaunchd `com.ablestack.wall-modern.coherent`로localhost:3320제공. 기존3317PID1407/3318 및 원본설정·DB·바이너리·미저장사용자탭을그대로유지했다. 서로독립된DB이고이후저장은자동동기화되지않는다.
- 실제새health/frontendsettings11.4.0-pre/fullcommit일치,servedappJS/assetmanifest바이트일치. DB새migration0/skipped610,709migration행/전체schema동일, dashboard40/data_source7/user3/token1보존. 종합/05/QA129/QA128 JSON동일. nativeCSV서버query200/값1.25,2.5,3.75·timestamp보존; Glue/3318query200. CCVM은초기502후최종3317/3320모두200회복, 새nativePrometheus query도CPU시계열1frame21포인트200/error없음을확인했다. 초기오류를지속장애로보고하지않는다. 기존49plugin누락없고nativebackgroundinstaller가격리dir에LokiExplore1.0.10추가(API50). Infinity미설치/dummyDS·xychart중복/macOSproc경고는별도잔여다.
- 새브라우저localhost:3320에서4시계열·SourceTooltip1/20값·동일시점Crosshair4·Right범례스크롤326/326·관리/DS/플러그인/로그인폼확인. 실제비밀번호·세션갱신·serveradmin/OAuth실기는안했고 nativehealth/authimpl Go검사와 UI/API권한검증을구분했다. 프런트raw_frame은client-only로잘못된직접backend요청500을관찰했고 지원CSVscenario성공과구분/후속기록했다.
- checker9unit/nativehealth6항목/authimpl package 통과,webpack성공/기존size2·Browserslist경고유지. 전체회귀/RC통과아님. 기존보고서정정과 `docs/WALL_RUNTIME_ALIGNMENT.md`에원인·설정·검증·위험·승인후전환절차를작성했다. 사용자index/기존미커밋을보존하고혼합커밋없음. 증거 `.codex/visualizations/2026/11/06/wall-runtime-ref140/`와격리runtime logs/manifest/API/DB비교. 검증탭1940을새환경으로남긴다.

## 2026-11-06 REF-141 — Time Series 2차 UX

- 범례 실제 font 폭 측정/적응형 matrix·Tooltip bounded Plot 외곽 위치만 수정. 제품3파일/관련테스트2파일.
- QA122 Right180.953px·12×4통계: 행60→42px, 콘텐츠744→542px. QA129 같은 hover의 대상Plot겹침37524→0px². Light/Dark·Tooltip8/20·Right/Bottom 스크롤·Resize취소·XZoom·24plot Crosshair1Tooltip/이탈정리 실기.
- 6suites40tests·lint0·제한TS0·동일소스 backend/frontend build·3321정합checker 통과. 기존서비스/사용자탭/index보존. 기존미커밋이 광범위하여 사용자작업을 섞는 커밋은 만들지 않음.
- 극단폭 행높이/큰Plot·이웃콘텐츠의 잔여가림 및 Firefox/트랙패드/장시간부하는 미검증. 상세와 파일/증거는 WALL_TIMESERIES_REVIEW.md REF141.

## 2026-11-06 REF-142 — Stat 표시 통일 및 상태 표현

- Context 누락으로 dashboard중립36+점/editor색상44였던 경로를 공통 Stat로 통합. Value/Override색숫자·Mapping문구Chip·NoValue실제0구별, 작은dot/전체Health추측없음. Auto 균형 배치/내부 스크롤·수치 (Stat) 명칭. 제품14파일/테스트3파일 및 기준표 수정.
- 실제Glue9/0/9/0 동일viewport1656×929 전후/Editor·Light/Dark,1/2/4/8필드·Resize313×196/scroll182끝·nativeCanvas8·QA142 version3 저장/재조회 확인. 원본 종합/05 JSON/버전 동일·index보존.
- 집중5suites51tests·Lint0·동일소스backend/frontend build/check 통과. 추가Gauge회귀1fail와Renderer기존TS1건은 사전소스에서도 재현, 해결로보고안함. 기존패널취소후nativeDirty잔여는dashboard취소로원복/후속기록.
- 최종격리3324 유지, 자체중간3322/3323종료, 기존3317/3318/3320/3321·사용자탭보존. 변경파일/설계/실측/증거는 WALL_STAT_REVIEW.md. 기존광범위미커밋을섞는커밋은만들지않음.

## 2026-11-06 REF-143 — Stat 실제 콘텐츠 기반 밀도 개선

- REF142 고정120×80 타일의 한계를 수정. 실제 Wall font·native DisplayValue 라벨/숫자/단위·가용 폭을 측정하는 Stat 전용 callback과 inline 목록을 사용한다. 짧은4값은435px에서4열/241px에서2×2, 긴8시리즈는 기본224px본문에 모두 표시. 목록수치 공통22/26 토큰·일반KPI36·Name14, 매핑/원문34px 기준선 정렬. 제품11/관련테스트2파일, 다른시각화/48열엔진 변경 없음.
- 최종3328에서6패널 Light/Dark·Preview·명시Orientation·실제Resize296×196/휠scroll60끝·취소/Dirty0 확인. API전체JSON QA142v3/종합v43/05v30 동일. 사용자index tree0423fc 동일, 운영/기존서비스/미저장탭 보존.
- 6suites55tests·production11roots 제한TS0·Lint0·동일소스backend/frontend build/check 통과. 기존Gauge회귀/Renderer타입/AUD007은 이번표시작업 해결로보고하지 않음. 브라우저Chrome 범위/극단크기·장시간부하 미검증 구분.
- 최종격리 coherent-stat143-verified/3328 유지, 기존3324도유지, 이번자체중간3325/3326/3327종료. 기존광범위미커밋을섞는커밋 없음. 변경파일/설계/전후측정/캡처/한계는 WALL_STAT_REVIEW.md REF143.

## 2026-11-06 REF-144 — 명시적 Modern Stat 스타일

- Stat optional wallStatStyle에 호환/Soft Surface/Minimal 추가. 기존 누락옵션은 호환, ColorMode·원래필드색/계산/Mapping 보존. Modern은 neutral 숫자와 실제색 Accent, None/TextNone은 Accent없음. 실제 Preview 후 Soft 전체높이 면을 콘텐츠 주위로 축소하고 Minimal 중심선/세로여유 정렬. native BigValue/공통 Stat재사용·Base UI Select/로컬 Button 선택기. 제품10/관련테스트3파일, 다른시각화/외곽배치 미변경.
- 동일QA1426패널×3스타일 Light/Dark·Preview·Gradient완전복원·None·241px2×2·296px8목록 scroll60끝/취소 확인. 격리DB에만 QA144(6원본×3스타일18패널) 생성하여 API저장/새로고침69readout·각스타일23·Dirty0 검증.18개의쿼리/필드/native옵션 원본과 동일, 기존QA142v3/종합v43/05v30 전체JSON동일. 생성QA144도 최종JSON동일/index보존.
- 7suites63tests·제한14rootsTS0·Lint0·diffcheck0·동일소스backend/frontend build/check 통과. 기존AUD007패널취소Dirty는dashboard취소로정리/미해결로유지. 전체RC·장시간부하·타브라우저 검증으로 확대하지 않음.
- 최종 coherent-stat144-release/3331 비교화면 유지, 이번중간3329/3330만 종료. 기존3317/3318/3320/3321/3324/3328·DB·사용자미저장탭 보존. 광범위기존미커밋을섞는커밋 없음. 상세/파일/캡처/한계는 WALL_STAT_REVIEW.md REF144.

## 2026-11-06 REF-145 — Dot 양 끝 표시

- 공통 Guide의 외곽도 gutter중앙을 사용해−4/1309px가 SVG0~1305밖에서 잘리던 원인 수정. 내부24열653px유지,0/48열0/1305·시작행0, 점반경만큼만clip여유. 제품2파일/테스트1,48열/스냅/데이터/저장 미변경.
- QA122 실제이동/SE전체폭/SW Dark에서같은Dot좌표 확인, main client/scroll1353 동일. 종료Guide0·취소원배치/Dirty0/Light, 기존5대시보드전체JSON/index동일. 캡처타이밍한계와active DOM측정 구분해 public/app/features/wall-modern/DESIGN_SYSTEM.md 기록.
- 5suites18tests·제한TS1root0·Lint0·build/runtimechecker통과. 최종격리coherent-grid145/3332유지, 기존서비스/사용자탭보존. 광범위미커밋을섞는커밋 없음.

## 2026-11-09 REF-146 — Crosshair 공통 기본값

- 공통 dashboardDefaults를 신규/미지정 모델·Scenes 저장·일반 설정에서 사용해 기본1로 통일. 명시0/2·구형sharedCrosshair boolean 보존, 새 Event Bus/Tooltip 디자인/쿼리 변경 없음. 제품5/관련테스트2파일.
- 종합 개발3332만 nativeAPI로 graphTooltip1 저장(v43→44), 두키 외 JSON 동일. 최종3333 복사본에서 Source1/Follower4 Crosshair·Tooltip1/이탈0 및 신규 Dashboard 기본선택 실기.05/QA144전체JSON동일, 기존3317/운영/사용자탭/index보존.
- 6suites189tests/4snapshots·제품5roots TS0·Lint0·diff0·동일소스 backend/frontend build/runtime checker 통과. 최종coherent-sync146-release/3333유지, 기존서비스 health200. 기존미커밋혼합커밋 없음. 상세·증거·환경제약은 public/app/features/wall-modern/DESIGN_SYSTEM.md.

## 2026-11-09 REF-148 — 단일 Stat Auto Fit

- 실제 count1을 전달해 매핑 Chip/14px 상한만 해제하고 native BigValue fit+기존 Wall 실제font 측정 재사용. 명시 글자크기/ColorMode·Background/Name/None·실제값/쿼리 보존. 제품8/테스트2파일, REF147 상태 원 CSS는 요청 우선순위에 따라 보류.
- 실제01/12 Mold·Cube14px Chip→36.945px OK, Glue실제0→OK. 실제Resize246×192/88.2px·356×276/147px·축소/취소dirty0. UNKNOWN109×108/11.48px·Preview198.8px·Chrome110%/Light/Dark/fontloaded 확인. QA148 합성2/3/4/8/Name의 전후 전체측정JSON동일, 원본01/12/QA142/05 전체JSON동일.
- 5suites63tests·제품8roots 제한TS0·Lint0·diff0·동일소스 backend/frontend build/실제runtimechecker통과. 최종3334 유지, 기존3317/3318/3321 보존·3333 동일artifact만 재시작. 기존index/미저장탭 보존, 미커밋혼합커밋없음.
- 사용자VM실데이터는MySQL1045로미완료이며 기존3321도badconnection; 계정/권한/쿼리변경없음. 이전Glueproxy·clock/경보등환경오류·타브라우저·전체RC는완료로확대하지않음. 상세/파일/캡처/제약은 WALL_STAT_REVIEW.md REF148.

## 2026-11-09 REF-149 — 직전 현황 숫자/원 복원

- REF148에서 사용자3321이아닌3333을baseline으로삼은오류정정. 공통 legacy 다중 정수값을 중립숫자+기존필드색6px원으로복원. 단일AutoFit/단위/명시background·modern스타일·쿼리/배치 유지. 제품4/테스트1파일.
- 현재3334 IAB2탭 미저장0 확인후갱신. 실제호스트3/3/0 모두중립36px·green/red원6px 확인. 전체DashboardJSON보존.3suites51tests·lint/build통과, 상세TS/check로그별도. coherent-stat149-restore로동일주소3334제공,기존운영/3317/3321보존.

- REF149 최종 타입 진단0/동일JS재빌드·checker/health200. active3334는coherent-stat149-final, 중간restore정지. 원본전체DashboardJSON동일.

## 2026-11-09 REF-150 — Stat 선택 행 정렬

- first-of-type가42span을설명으로오인하던원인수정. GalleryTSX/CSS2파일에서28px아이콘/설명슬롯명시,실제Stat/호스트/데이터/배치미변경.
- IAB전후Stat미리보기331→28px,제목/설명x399정렬·선택/비선택/Light/Dark/재선택/dirty0검증.사용2탭미저장0확인갱신,호스트36px중립숫자/원유지.저장DashboardJSON동일.
- Lint/CSS구문/build통과,제한TS·runtimecheck로그별도. active3334 coherent-gallery150-final,기존149-final정지.원본/운영/index보존.상세WALL_STAT_REVIEW.mdREF150.

## REF-151 - Editor heading / equal pane height (2026-11-09)

- Limited change to common editor identity and preview/Inspector height. Removed420px cap/centering; native resultStatus is inside existing preview Card. Stat/host renderer, chart/data/grid/save unchanged.
- Nine focused tests, target lint/TS, CSS parse, coherent build/runtime checks pass. Actual Stat/data/settings/table/expand/restore/wheel and Time Series Dark checked. Both panes y205/h503/bottom708;43 persisted dashboard JSON unchanged. Narrow viewport override was ineffective and is explicitly unverified.
- Current3334 coherent-layout151 PID53605. Prior runtime/DB retained. User two tabs reloaded after dirty0 check;3317/3318/3334 HTTP200. Index retained; no mixed commit. See public/app/features/wall-modern/DESIGN_SYSTEM.md and DESIGN_SYSTEM REF151.

## REF-152 - Panel editor contextual heading (2026-11-09)

- Header-only common change: native dashboard Back title, primary panel name and plain editing/plugin metadata. Divider/Pill removed; shrinkable responsive Grid and full-title access. Existing Back exit, actions, query/model/save, tabs and REF151 equal-height geometry preserved.
- Actual01/12 and Stat/Time Series/Gauge, Light/Dark, long labels, Chrome390/760px and actual150% zoom checked. QA152 native save/reload and dirty return/browser history checked.4suites24tests, lint/CSS/build/runtime pass. Existing renderer TS never diagnostic remains and is reproduced with prior source.
- Found pre-existing editor Cancel leaves dashboard dirty indicator despite restoring original title/type. Reproduced on untouched REF151 build at isolated3335/copied DB; stopped comparison service. Dashboard Cancel clears it. Not changed in header-only scope; record public/app/features/wall-modern/DESIGN_SYSTEM.md REF152.
- Current3334 coherent-header152-final PID58950. Existing43 dashboard JSON unchanged; only disposable QA152 added. Prior artifacts/DB and user index retained. User2tabs dirty0 before refresh.3317/3318 health200. No mixed commit.

## REF-153 - Stat marker legibility (2026-11-09)

- Existing state dots now scale7..10px with number size (36px ->9px, formerly6px). Existing neutral numbers/color/gap/eligibility and all other Stat modes preserved;2common product files and existing test expectation only.
- Actual user preview and overview measured9px dots with unchanged36px number/value/color; Dark9px verified.47focusedtests, lint, targetedTS, coherentbuild/runtimecheck pass. All44dashboardJSON unchanged.3334 coherent-dot153 PID86596; usercleanstatus checked before reload; existingindex preserved/no mixedcommit. Evidence/docsWALL_STAT_REVIEW.md REF153.

## REF-154 - Editor context, underline tabs and native query access (2026-11-10)

- Actual attachment implemented in common editor: joined Back/title, shared insets, existing Base UI underline tabs, native model-backed query summary/Ref shortcut, scoped last-tab preference. Mounted buffers, native save/routes and preview size preserved. Preview toolbar0px intrinsic-width defect also corrected after ego rendered review.
- Ego TaskSpace8 actual01/12 Stat/Gauge/Time Series/Table, MoldSQL/Expression, query-freeText, disabled query, native edits/save, keyboard, cross-panel memory and390px control scrolling checked.42tests, lint/CSS/build/runtime checks pass; pre-existing RendererTS diagnostic remains. Actual Ego zoom did not change; live Loki/Mixed unverified. SQL execution error remains environment/data query scope.
- Final cancel test waits for restored panel: title restored/dirtyfalse. Earlier immediate dirty observation was transitional, not evidence of a persistent new regression. Native cancel code unchanged.
- Active3334 coherent-editor154-verified PID66751. Original44JSON unchanged, only disposable QA154 added.3317health200;3318known missing runtime fixture script remains, not fabricated/restarted. User index preserved/no mixed commit. Full measurements/limits: public/app/features/wall-modern/DESIGN_SYSTEM.md REF154.

## REF-155 — Editor Context Bar / native Inspector scrolling (2026-11-10)

- Moved existing source/query summary below underline Tabs, shared across both columns; native Ref shortcut/protection/state retained. Query-free empty context has no unavailable action. Existing Stat numeric/plugin icons unchanged.
- Compact token header padding offsets strip. Same1378×801: context32px; both panes y204/h585, unchanged widths, options524→583px. Native option list wheel now reaches71px after fixing wrapper flex-column. Narrow preview controls get a full row via correctly scoped container query; actual1050/390px and phone time popup verified in ego TaskSpace11.
  -6suites43tests/local package mapping, lint/CSS/build/source-artifact-HTTP check pass; existing renderer TS diagnostic remains. Time Series2results; host Stat remains original NoData; Mold1045 blocks live SQL. Native fixture apply/save/reload/cancel verified and contents restored; original44JSON unchanged, QA154 version-only3→5.
- Final3334 coherent-editor155-verified PID74525;3317health200/3318existing missing script unchanged. Prior artifacts retained, existing index preserved/no mixed commit. Full changes/measurements/limitations: public/app/features/wall-modern/DESIGN_SYSTEM.md REF155.

## REF-156 — Remove visualization query summary (2026-11-10)

- Removed editor summary wiring/slot/shortcut state and context CSS only. Existing header/underline tabs/native query preview/buffers/options scroll/actions preserved.4implementation/test files; no engine/model changes.
- Ego TaskSpace12 Light/Dark: summary DOM0, panes y184 aligned. Actual native query edit survives tab switches; apply/draft cancel and title discard restore clean.45dashboard JSON records unchanged.
  -6suites42tests/lint/CSS/build/runtime HTTP checks pass. Active3334 coherent-editor156 PID76797; prior runtime/DB/index preserved. Evidence and limits: public/app/features/wall-modern/DESIGN_SYSTEM.md REF156.

## REF-157 — Visualization icon system (2026-11-10)

- Common plugin-ID based24x24 SVG miniatures,25currently exposed core types plus legacy aliases. Gallery/change dialog/editor metadata share one component; Stat42text removed. Native external logos/error fallback preserved, no actual panel-content icon.
- Ego TaskSpace15: representative types, Light/Dark/560px, actual Gauge change/cancel, shared glyph equality, preview icon0.4suites26tests/lint/CSS/finalbuild/HTTP consistency pass.45dashboard JSON unchanged.
  -3334 coherent-icons157-verified PID84730; previous artifacts/DB/index preserved. No production change or mixed commit. Detailed files/evidence/limits: public/app/features/wall-modern/DESIGN_SYSTEM.md REF157.

## REF-158 — Gallery shape and interaction polish (2026-11-10)

- Reused common SVG map; complete centered Stat8, shared Gauge arc, consistent1.6px strokes, actual bar/track rectangles after rendered review. Neutral Hover, persistent Selected, inset keyboard focus. Fixed actual modal input/container double focus conflict within Gallery only; slightly denser list and long-name/empty polish.
- Ego TaskSpace16 actual Light/Dark/560px, search/categories/empty, Tab/Enter/Gauge change/cancel, scroll and matching22/28px glyphs verified.45Dashboard JSON unchanged.4suites27tests plus final4icon tests/lint/CSS/build/HTTP consistency pass. Broader validation limits in public/app/features/wall-modern/DESIGN_SYSTEM.md REF158.
  -3334 coherent-gallery158-final PID87944; prior DB/artifacts/index preserved. No mixed commit or operational change.

## REF-159 — Stat scalar + sparkline composition (2026-11-10)

- Removed standalone8, referenced actual bundled Grafana Stat SVG layout, reinterpreted readout placeholder/mini area baseline with Wall tones. Stat-only hover accent; other icons unchanged.
- Ego TaskSpace18 neutral/hover/selected/Dark/22px/shared resource verified;4icon tests/lint/build/HTTP consistency pass.45JSON unchanged.3334 coherent-stat-icon159-final PID95300,priorruntime/DB/index preserved. Evidence/limits: public/app/features/wall-modern/DESIGN_SYSTEM.md REF159.

## REF-160 — Correct original Stat reference (2026-11-10)

- User clarified original12.4+Area. Reused actual bundled SVG numeric/area/contour geometry with Wall colors; removed placeholders. Single product file/Stat entry only.
- Ego19 actual22/28px/Light/Dark/neutral-selected/shared glyph,4tests/lint/build/HTTP checks pass;45JSON unchanged.3334coherent-stat-icon160 PID96634. Previous artifacts/index preserved; no mixed commit. Evidence public/app/features/wall-modern/DESIGN_SYSTEM.md REF160.

## REF-161 — Data-first editor (2026-11-10)

- Reordered existing Tabs/data default; stopped last-tab preference; fixed async new-panel initial request. Existing buffers/preview/underline/actions preserved. Studio+tests only.
- Ego21 existing/native-new-panel/tab retention/apply-cancel verified.23tests + finalStudio7pass; lint/build/HTTP consistency pass;45JSON unchanged.3334coherent-tabs161-final PID1102; prior DB/index preserved. public/app/features/wall-modern/DESIGN_SYSTEM.md REF161.

## REF-162 — Query error details (2026-11-10)

- Fixed telemetry-only click by native Inspector routing; current errors immediately shown in existing Query tab; credential masking without config dump. Panel styles/Grid/data unchanged.
- Ego22 actual narrow/wide mouse/keyboard/Dark/editor menu/open-close verified.5tests/lint/build/HTTP pass;45JSON unchanged. Actual failure→success browser recovery not performed; state recovery unit-tested.3334coherent-error162-final PID3637,prior DB/index preserved. public/app/features/wall-modern/DESIGN_SYSTEM.md REF162.

## REF-163 — Tab visual affordances (2026-11-10)

- Studio/CSS only: existing icons+token typography/44px hit areas and accent active state; underline/Indicator/mounted/native controls retained.
- Ego23 Light/Dark/390px/keyboard/indicator/hover/query-buffer/apply-cancel checked.23tests/lint/CSS/build/HTTP pass;45JSON unchanged.3334coherent-tabs163 PID4756; previous DB/index preserved. public/app/features/wall-modern/DESIGN_SYSTEM.md REF163.

## REF-164 — Single Stat alignment (2026-11-10)

- Compared actual error96 horizontal/Auto/sum vs VM17 Auto/Center/lastNotNull. Fixed Wall single-only centering/body height and unnecessary single-item scrollbar clearance; retained native fitting, explicit modes/colors and multi layout. Product4 files plus statReadout regression; DESIGN_SYSTEM REF164.
- Ego25 actual1/4/OK/units, Light/Dark, wide/narrow editor preview and device81 multi values checked. Center error below0.01px; device values36px unchanged. Dashboard Resize attempts did not commit: unverified, no Grid workaround. Host data unavailable. WALL_STAT_REVIEW.md REF164 details limitations/evidence.
- 3suites52tests/lint/coherent build/HTTP pass;45 persisted JSON identical.3334coherent-stat164-verified PID8048, full prior DB/config/auth copy.3317 health/dashboard200; existing3318 unavailable untouched. No staging/mixed commit, existing user work preserved.

## REF-165 — Diagnostic Panel Inspector (2026-11-10)

- Common Scenes Inspector: Diagnosis/Data/Request–Response/JSON. Native tables/download/stats/query runner/JSONFormatter/Monaco and guarded explicit Apply preserved; old stats/error URLs map to diagnosis. Visited pane state kept. Legacy/Explore retain fallback.
- Fixed unscoped HTTP stream and response-before-request-ID race with bounded masked projection buffering; absent trace omitted, nested request config no longer mutated. Exact duplicate displayed errors removed; no cause inference. JSON validation/permission recheck and close-after-native-edit-URL sync. Corrected first executed-frame count metadata only.
- Actual Dark review found Light tokens reset at the nested Drawer surface: existing local WallModalProvider plus shared Drawer presentation-style propagation fixes it without geometry changes. Common PanelScrollArea/actual Base UI Tabs+Collapsible reused. No chart/grid/Stat/data model change.
- Ego26 normal Prometheus A/B, missing datasource99, no-data75, actual MySQL97 errors/ref/status, stats alias, CSV download, raw response scroll, JSON source/invalid/apply/cancel, keyboard/ESC, Light/Dark and390px tested. Prometheus syntax error/plugin metadata/alternate roles/legacy UI unverified. See public/app/features/wall-modern/DESIGN_SYSTEM.md and evidence directory.
- 3suites11tests, target lint/diff/build/runtime check pass; repository full TypeScript remains blocked by shared deep-import/mixed-type baseline.45 persisted JSON unchanged.3334coherent-inspector165-darkfix PID15736; original services/config/auth/user tabs/staged work preserved. No mixed commit.

## REF-166 — Inspector JSON Workspace (2026-11-10)

- Existing CodeEditor/Monaco0.34.1: native Outline/Find/fold, cursor/selection, compact code view and shared-model native Diff; no new editor/parser. Per-source original/draft snapshots, undoable restore, readonly controls, syntax/marker locations, existing copy/export and guarded explicit Apply. Scoped Inspector class avoids colliding with dashboard-settings JSON CSS.
- Clear Scene inspect owner state as well as URL on close (ordering alone from REF165 could race). Preserve dirty state and catch native conversion failures before mutation; no custom plugin-schema validator.
- Ego28 copied fixture wall-json-qa-166: generic nested Outline/search,1-line diff, code/diff shared edits, restore/undo, syntax3:1 including diff→code focus, source draft retention, native folds/scroll, readonly1065lines/16798bytes rejecting input, export, Light/Dark/390px checked. Native Apply→dirty→save(version2)→reload/reopen passed. Existing45 JSON identical; only new QA panel title changed, targets/datasource/fieldConfig unchanged.
- Related3suites24tests/lint/diff/build/runtime check pass; no full-project TS cleanup.3334coherent-json166-polished PID39305, prior DB/auth/config/worktree/user tabs preserved. No mixed commit. Scope/limits/evidence: public/app/features/wall-modern/DESIGN_SYSTEM.md.

## REF-167 — Datasource selection, management and connection testing (2026-11-10)

- Replaced the duplicated two-column picker with one adaptive search/list: real connected/special groups, official logos, native UID/type, aliases/type search, default vs selected, keyboard focus/selection, shared native ScrollArea. Kept capability filters/analytics/recent history/CSV/permission paths. No new library.
- Flattened management rows and add-catalog surfaces, literal search fixes regex punctuation crash. Existing plugin ConfigEditor/Angular fallback/extensions/auth/TLS/permissions/provisioning retained. Settings groups and shared heading spacing, sticky real result/actions, save-before-health/pending guard and existing safeQueryError masking.
- Ego31: actual Prometheus/Loki/MySQL/Mixed/Dashboard/Grafana selection with asynchronous completion/cancel; same-plugin A/B preserved, native cross-plugin conversion retained. Real disposable Prometheus creation→connection refused→actual API success→native confirmation/delete. Search/empty/keyboard/ESC focus, native wheel reaching last row, Light/Dark/420px/620px/560px-height checked. Narrow native568px plugin overflow isolated and actual wheel regression found/fixed by separating X containment/Y handoff; final page width356/scroll356, inner width324/scroll568, horizontal236→244 and vertical0→472.
- Related9suites latest union81 passed/1 existing skipped; changed3suites49passed/1skip and final wrapper EditDataSource20passed. Target ESLint/diff/coherent Go+preview webpack build/runtime check pass. Full TS remains297 baseline errors (unchanged Picker Portal/shared mixed React/module types); changed files no TS errors. No release-wide claim.
- Final3334 coherent-datasources167-scrollfix PID49316, HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3/11.4.0-pre. Original7 data_source rows all columns identical;46 dashboard JSON/version identical, disposable source removed.3317 health/dashboard200 untouched; existing3318 missing script remains. Existing user tabs/index/work unchanged; no mixed commit. Evidence/limitations/file list: public/app/features/wall-modern/DESIGN_SYSTEM.md.

## REF-168 — 패널 설정 상단 패딩 (2026-11-11)

- CSS-only `.wall-studio-details` 상단0을 기존 공통 card padding16px로 맞춤. 새 컴포넌트/쿼리/저장/탭 변경 없음.
- Ego33 실측: 이전 첫 필드 top inset1px →17px(border1+padding16), left inset17px로 일치. 탭 왕복 시 제목 유지. before/after: ~/.codex/visualizations/2026/11/11/wall-inset168/. 별도 저영향 CSS unit test 추가 없음.
- 동일소스 Go/preview webpack 빌드·runtime provenance/API 확인 통과.3334 coherent-inset168 PID4493, 이전 datasource runtime 정지. 기존 사용자 탭 강제 갱신/운영 변경/혼합 커밋 없음.

## REF-169 — Monaco 아이콘 폰트 복구 (2026-11-11)

- Actual Find widget used codicon, but FontFace error and codicon.ttf404. Production sass.rule url:false omitted the font. Enabling URL emission exposed an additional asset prefix/ESM URL normalization issue.
- sass.rule uses static oneOf rules: only codicon.css uses CommonJS URL codegen, other styles retain ESM; URL filter emits only codicon.ttf when legacy URL preservation is off. webpack.common gives that font an explicit relative ./static/fonts resource path. Existing public/subpath policy and other assets unchanged. No CSS font-family forcing or icon substitution.
- Isolated actual-loader webpack test verified relative font URL; original/referenced URL checks passed. Ego34 final FontFace loaded/document.fonts.check true, native Find/Next Match and actual glyph screenshot verified. Font HTTP200/72504bytes. Coherent Go/preview webpack/runtime source check passed; final3334 coherent-codicon169-final. Superseded builds were not reported as passing; an intentionally superseded build failed source-fingerprint and a dynamic Rule.use experiment failed loader-ident validation before static oneOf was adopted.
- Evidence ~/.codex/visualizations/2026/11/11/wall-inset168/codicon-before.png and codicon-after.png. Queries/JSON/apply/buffers unchanged; no user tab forced refresh or mixed commit.

## REF-170 — Inspector and JSON Workbench (2026-11-11)

- Unified native Drawer context (패널 검사/actual panel name), existing4 tabs and resize. Document context + compact code/Diff/tools row, left collapsible actual-key Outline, existing Monaco code/native Diff, bottom validation/restore/Apply. Native copy/export/find/fold/selection copy and model/permissions/dirty flows retained; no new library/parser/query logic.
- Reused Monaco0.34.1 internal Outline/registered JSON provider behind typed bridge; native flat ranges form hierarchy, exact start positions, lazy provider wait/cancellation/disposal. Version-bound/private API and native primitive-array outline limits documented.
- Actual Ego35 found and fixed popup-vs-Drawer focus trap via scoped portal containers; stale legacy Source flex specificity and fixed code minimum causing short-screen clipping were removed. Breadcrumb joined cursor footer to preserve code height. Light/Dark,390×800 and390×560/error, actual native search/fold/copy/export, source draft/readonly,1-line Diff/restore/syntax guard, explicit Fixture Apply→dirty→native cancel, common data/stats/POST200 requests, missing-datasource panel99 and close/URL removal tested.
- Related4suites28tests, target lint/diff, coherent Go/preview webpack/runtime provenance pass. Full TS295 baseline errors, changed files no type errors. Before initial resize-transition capture excluded; stable REF169/REF170 matched Find comparison and normal workbench captures recorded.
- Final3334 coherent-workbench170-polished PID17809, HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3/version11.4.0-pre. Original46 dashboard JSON/version and7 datasource rows identical; added QA170 only. Fixture changes cancelled/restored.3317 health200, existing3318 untouched. No force refresh of user tabs or mixed commit. File list/evidence/limits: public/app/features/wall-modern/DESIGN_SYSTEM.md.

## REF-171 — Inspector 디자인 정합성·기본 너비 (2026-11-11)

- Scoped presentation only: native Drawer lg75vw→md50vw (1378px에서1033.5→689px), 직접 Resize/모바일 제한 유지. PanelInspectDrawer에 기존 editor form 변수와 tab 표현 속성만 추가. 기존 진단/데이터/요청·응답/JSON 구조와 Monaco/Source/draft/Apply/권한 모델 그대로.
- panelInspection.css에서 모달-vs-line-tab specificity 충돌 정리,14/500/44px 주 탭과13px control·12px caption,32px 버튼/Select·6px radius, single focus wrapper, 중립 table header/문서 작업 secondary. native 통계 width-30!important480px와30px line-height를 해당 표에서만 해제하여390px에서331/331 fit.
- Ego37: 실제 Wall editor/gallery/source와 비교.4영역 실제 데이터/482행 통계/POST200/원래 panel99 오류, Light/Dark/390×800/390×560오류, Source readonly 실제 입력 차단/큰 JSON 휠1→159, Find1of2/구조12:3/Diff1+1/복원/문법 guard/native export, Fixture title Apply→화면 제목 변경→native 취소/dirty 해제, native 폭805px 확대·재열기689px 확인. 실제 browser zoom은 배율 변화 미관찰로 미검증.
- 관련4suites28tests(alias로 현재 worktree UI 사용), target lint/format/diff, coherent Go+preview webpack/runtime source check 통과. 기본 Jest alias import 실패/webpack size warnings는 보고서에 구분. 최종3334 coherent-inspector171-polished PID23279/11.4.0-pre/HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3.47 dashboard JSON/version·7 datasource 레코드 동일, 추가 데이터 없음.3317 health200/서비스·운영·사용자 탭·index/기존 작업 보존, 혼합 커밋 없음. 파일/캡처/제약: public/app/features/wall-modern/DESIGN_SYSTEM.md REF171.

## REF-172 — Inspector40% 및 native Find/Replace UI (2026-11-11)

- PanelInspectDrawer width40vw + native sm 최소384px, 기존 mobile cap/직접 Resize 유지. 실제1378→551.1875px/1618→647.1875px. 데이터/쿼리/저장 모델 미변경.
- panelInspection.css에 Workbench 전용 native Monaco Find/Replace Surface/Border/Radius/Shadow/Wall typography,32px input·42px 검색창·82px Replace·28px 주요 액션, 단일2px focus/error 상태. 실제 lazy Monaco CSS specificity/inline theme colour와 narrow257px 제약을 정리. 기존 codicon/native 옵션22px 예약·mirror 측정/키보드·영문 언어팩 유지; 새 검색 엔진 없음.
- Ego39 Light/Dark/390px, Match Case/Whole Word/Enter·ShiftEnter/Regex invalid/Diff search, 실제 Replace→원본 복원/Apply disabled, ESC 확인. 좁은 코드331px에 검색창307px/입력82px, 경계 안 배치. 관련28tests/lint/format/diff 및 coherent Go/preview webpack/runtime 검사 통과. 최종3334 coherent-find172-final PID28576/HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3/11.4.0-pre.47 dashboard JSON/version·7 datasource 레코드 동일, 운영/사용자 탭/미저장/index/기존 작업 보존, 혼합 커밋 없음. 상세 파일·캡처·제약: public/app/features/wall-modern/DESIGN_SYSTEM.md REF172.

## REF-173 — 승인 Enterprise Inspector 시안 적용 (2026-11-11)

- Native header의 실제 panel title을 primary로, 패널 분석 eyebrow/실제 plugin·DashboardScene 메타를 보조로 배치.40vw/native 직접 Resize 유지. Source/실제 editable·changed context, 직접 copy/export+기존 callback 메뉴, 실제 Outline/코드 frame, 한 footer의 cursor/syntax/restore/Apply로 정리. 모델/쿼리/저장 방식은 미변경.
- 기존 Monaco 공개 padding/lineNumbersMinChars/find.addExtraSpaceOnTop 옵션과 scoped CSS를 사용. 좁은 native Find2행에서 실제 count/옵션/이동 유지, 기존 엔진/Codicon/readonly/검증/Apply/Dirty 보존. 구조 header 접기→toolbar focus 복원, narrow 자동 접기, 저높이 compact header.
- Ego41: 실제 사용자 VM panel97의 실제 title/Stat/종합 metadata,6:5 key jump/구조 상태·focus; 기본647.1875px/수동확장1097.96875px. QA170 Diff1+1/복원/1:2문법 guard, Fixture 명시 Apply→화면 title·dirty→native취소, readonly 입력 거부/긴 JSON 실제 휠, native export/copy/menu keyboard, Find1of2/다음·이전, 진단482행/data/POST200/원래 panel99 missing datasource 오류 확인. Light/Dark/390×800/390×560오류 검증;390 화면 overflow 없음/footer bottom784≤800.
- 관련4suites28tests/target lint·format·diff/coherent Go+preview webpack/runtime provenance 통과. 최종3334 coherent-enterprise173 PID35327/11.4.0-pre/HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3. 기준47 dashboard JSON/version·7 datasource 전체 레코드 동일, 데이터 추가 없음.3317기존9.2 health/dashboard200/launchd running 보존;3318기존exit2/연결거부 미수정. 운영/사용자 탭/미저장/index/기존 작업 보존, 혼합커밋 없음.5개 제품 파일·DS기준표·캡처·실측·미검증 범위는 public/app/features/wall-modern/DESIGN_SYSTEM.md REF173.

## REF-174 — Inspector 최종 responsive detail (2026-11-11)

-3개 제품 파일만 조정: InspectJsonTab의 직접 documentActions wrapper/기존 menu 통합(가용600px 이하), WallJsonOutline의 실제depth 들여쓰기 cap4/common gap, panelInspection.css의144px·25%/240px 구조 폭과 compact action 정책. 기존40vw/헤더/탭/Find/Diff/검증/Apply/Dirty/저장 미변경. DS기준표·보고서 갱신.

- Ego43 동일1378×900 전후 Toolbar77→45px, 구조 접기 코드350.1875→506.1875px/focus 복원.7단계 임시 Key57px/full path/136:17이동·구조scroll1002, Diff17+2/원본복원,1:2문법guard, readonly 실제휠1→30, native search/Case/Regex/결과이동/ESC·Diff, Light/Dark/390px/1920px 검증.390에서 Find가 코드경계 안/하단784≤800/중복 외부 스크롤 없음. 실제 native browserZoom은 배율 미변경이라 미검증.
- 관련28tests/lint/format/diff/coherent Go+webpack/API provenance 통과.3334 coherent-details174 PID42756/11.4.0-pre/기존HEAD.47dashboard JSON/version·7datasource 전체 동일, 운영/사용자 탭/미저장/index 보존, 혼합커밋 없음.3317health200/running,3318기존exit2 미수정. 상세/스크린샷/제약: public/app/features/wall-modern/DESIGN_SYSTEM.md REF174.

## REF-175 — Inspector 상태·선택 정합성 (2026-11-11)

- 승인 레이아웃/40vw 유지. 편집 가능/원본 동일 muted·투명, 실제 변경만Accent. Grid 상단 중복divider 제거/보조도구 muted, 기존 Typography/Button/Select/Find/모델 유지.
- Outline의 클릭ID 선택을 native cursor/documentSymbol range 기반으로 연결하고 실제 path를 footer와 동기화, 구독해제. 새parser/자동확장/스크롤/모델변경 없음. range중첩/중복이름/경계 test추가.
- Ego45 실제 x7:5→ArrowDown y8:5/접기재열기유지, Dark w10:5, 검색두결과의 실제Key경로/Cmd+F/Enter/ESC,390px검색경계/중복focus없음/코드rect불변/footer784≤800, 변경강조/Diff1+1/복원, 진단482행/data/POST200 확인. 실제browserZoom 등 기존 미검증은보고서구분.
  -4suites29tests/targetlint·format·diff/coherent Go+webpack/API provenance 통과.3334coherent-polish175 PID47462/11.4.0-pre/기존HEAD.47dashboard JSON/version·7sources전체 동일,3317health200/running·3318기존exit2유지. 운영/사용자 탭/미저장/index보존,혼합커밋없음. 파일/비교캡처/제약: public/app/features/wall-modern/DESIGN_SYSTEM.md REF175.

## REF-176 — JSON 문서 작업 통합·상태 하단 이동 (2026-11-11)

-3개 제품 파일: InspectJsonTab 상단Source/기존문서메뉴만 유지·중복copy/export제거/메뉴명명확화. WallJsonWorkspace footer에 실제readonly/changed상태·변경없음, Diff문법+기존줄수 유지. panelInspection.css의 이전wrapper/compact룰 제거·Source/menu/footer wrapping만 정리. 승인layout/40vw/엔진/코드툴바/Apply·Dirty·데이터 미변경.

- Ego46 메뉴copy→nativepaste 원본동일/export JSON id83·2targets, Source readonly/초안복귀, 변경/Diff1+1/복원/invalid guard, Fixture Apply→dirty→native취소 확인. Light1378/Dark390·wide1920에서 상단 menu버튼1개, footer상태·하단작업접근(390 footerbottom784≤800), 메뉴이름잘림없음. 최종변경없음/Apply disabled.
- 관련29tests/lint/format/diff·최종coherent Go+webpack/API provenance 통과.3334coherent-toolbar176-final PID52464/11.4.0-pre/기존HEAD.47dashboard JSON/version·7sources전체동일.3317health200/running·3318기존exit2유지,운영/원래사용자탭/미저장/index보존/혼합커밋없음. 파일·캡처·제약: public/app/features/wall-modern/DESIGN_SYSTEM.md REF176.

## REF-177 — 문서 작업 메뉴 행 정리 (2026-11-11)

- 원인: nativeClipboard secondary/Wall outline 항목의 개별1pxborder. InspectJsonTab fill=text/ghost와 documentpopup scopedCSS로 border0/동일32px행·16px아이콘/공통gap·Hover·Focus로 정리. 바깥팝업·callback/portal/저장/다른영역유지. DS기록갱신.
- Ego47 Light/Dark/390px 전후캡처·computedstyle, Hover완료/Tabfocus/ESC복원, copy-nativepaste변경없음/export id83·2targets 확인.1suite10tests/lint/format/diff/동일source Go+webpack/API검사통과.3334coherent-menu177 PID54208/11.4.0-pre/기존HEAD.47dashboard/7source동일·3317정상/3318기존exit2·운영/사용자탭/미저장/index보존,혼합커밋없음. 상세·캡처: public/app/features/wall-modern/DESIGN_SYSTEM.md REF177.

## 2026-11-11 — 사용자 요청 커밋·푸시 준비 및 정리

- 누적 Wall 공통 UI/시각화/쿼리 편집/Inspector/레이아웃/관리 기능과 개발 런타임 검증 도구를 현재 codex 브랜치에 묶는다. 기존 운영 서비스/DB·사용자 미저장 브라우저 상태는 조작하지 않는다.
- 기준표와 중복된 임시 화면별 보고서7개(Crosshair default, datasource UX, editor layout, grid edge, Inspector, JSON Workspace, Inspector Workbench)를 삭제하고 참조를 공통 DESIGN_SYSTEM.md로 정리했다. 품질 감사·RC 평가·런타임 정합성·시계열/Stat 검토·Motion 기술 근거와 AGENTS/공통 기준/진행 기록은 유지한다. Python cache 삭제 및 **pycache** ignore 추가.
- 기능 회귀 테스트84파일은 의미가 있어 유지했다. 전체 실행은82suites/778tests 통과·2실패·1기존skip·snapshot1통과. 실패2개는 JSDOM CSS hover 판정과 이전 Tooltip y고정 기대였다. 제품 코드 변경 없이 hover hook 계약/실제 plot 비가림 조건으로 정리하고 해당2suites26tests 재검증 통과(합산84suites/780tests통과·1skip). 별도 Python 개발환경 보호9tests 통과.
- credential pattern 점검에서 실제 자격증명 발견 없음(문자열 후보는 마스킹 회귀 테스트 값만 존재). git diff check 통과. 최근 제품 빌드는 REF177의 동일소스 빌드 결과를 유지하며 이번 정리는 운영 배포나 RC 전체 검증을 의미하지 않는다.

### 커밋 훅 후속

- 최초 commit은 frontend-betterer의 신규255건으로 차단됐다. 사용자 요청으로 훅 우회/기준 완화 없이 번역 JSX/타입 단언·명시 any를 정리했다. 기존 Trans와 한글 기본 문구, 실제 이벤트/prop/native API 계약을 사용한다. Inspector 마스킹·저장 모델·운영 환경은 유지한다.
- 이후 사용자가 추가 정리 범위를 커밋 가능 선으로 제한했다. 전역 타입 부채 정리/새 기능은 진행하지 않는다. 변경 후 전체84suites780tests·snapshot1 통과(기존1skip), Python9tests 통과. Betterer baseline 변화는 실제 제거된 이전 위반의 감소분만 허용하며 신규 위반을 등록하지 않는다.

## 2026-11-12 — Netdive VM 연동 독립 안정화

- codex/wall-modern-lite의 aa15fe8d31/337b786b7c 검토. 기존 Footer 미커밋 보존, core.worktree 오지정은 변경하지 않고 실제 경로를 명시했다.
- 공백 빈 selector/후행 쉼표에 UUID를 붙일 때 쉼표가 중복되는 문제만 수정. 신규6사례 중 수정 전3실패, 수정 후 전체 관련9suites73tests 통과. Production/ESLint/Betterer 통과, TypeScript208→208·신규0.
- 별도 DB/쿠키/3342/새 frontend QA에서 실제 UUID→Netdive 동일 객체1-hop3nodes, 공백selector 실제조회, All/multi/noUUID·중복/미존재/invalid, optional Rail1/없을때0·기존 Dashboard Link fallback 확인. Netdive 저장소는 읽기만 했다.
- 현재3334 metrics54는 Netdive에서 미존재, 다른 실제 QA metrics123은122유일/1중복으로 범위를 구분했다. 현재3334 서비스·네트워크/운영 DB/대시보드/원래 사용자 탭은 변경하지 않았다. 후속 기록은 docs/WALL_NETDIVE_INTEGRATION.md와 DESIGN_SYSTEM.md REF181 및 기존 측정 JSON stabilization을 따른다.
