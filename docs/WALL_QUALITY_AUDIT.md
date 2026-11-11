# ABLESTACK Wall Modern — 품질 감사 및 안정화 1차

감사일: 2026-11-05 (KST) / 2차 개선: 2026-11-06 (KST)
대상: `codex/wall-autodev-20261030`의 현재 작업 트리, 공통 Wall UI 전체 경로
판정: **조건부 개발 지속 / Release Candidate 진입 보류**

## 1. 상태 요약

공통 UI·데이터 어댑터·편집/저장 경로를 조사하고, 원인이 재현된 제품 결함 2건을 수정했다. 문자열 Stat의 명시적 상태 색상 유실은 실패 테스트와 실제 브라우저에서 모두 재현한 후 수정했다. 필터 영역의 중복 예약 및 언마운트 후 blur 프레임도 정리했다. 오래된 팔레트 기대값·실시간 시계 의존 테스트와 import 순서를 함께 정리했다. 신규 기능·라이브러리·디자인 체계는 추가하지 않았다.

Production 프런트엔드 빌드와 Wall 범위 Lint는 통과했다. 그러나 전체 타입 검사, 일부 레이아웃 회귀 테스트 및 쿼리 편집기 테스트는 통과하지 못했다. 브라우저에서 확인한 기본 동작만으로 실패를 무효화하지 않는다. 실운영 데이터 정확성·전체 플러그인 호환성·보안·장시간 성능을 보증하는 감사는 아니다. 품질을 임의의 백분율로 환산하지 않는다.

운영 DB·고객 환경·기존 데이터 소스·Netdive 링크·인증 정책·백엔드·포트는 변경하지 않았다. 원본 대시보드 19개 JSON을 작업 전후 비교해 모두 동일했다. 로컬에 명시적 TestData QA 대시보드 `wall-audit-qa-125`만 추가하고, 이 QA에서만 배치 저장을 수행했다.

## 2. 환경과 증거

| 항목             | 실제 확인 결과                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 소스 버전        | `package.json`의 Grafana `11.4.0-pre`                                                                                                                              |
| 로컬 실행 백엔드 | 3317 `/api/health`: Grafana **9.2.0**, database `ok`. 소스 버전과 다르므로 11.4 전체 통합 검증으로 취급하지 않음                                                   |
| 서비스           | 기존 launchd preview 3317 / fixture 3318. 프런트엔드 빌드 반영 시 로컬 preview만 재시작                                                                            |
| 실측 데이터 연결 | 기존 Wall 데이터 소스는 relay 3319, CCVM Prometheus `10.10.22.10:3001` 접근 실패. 실제 UI에서 502 HTML 응답 및 Prometheus 파싱 오류 확인. Mold DB 연결 오류도 존재 |
| 결정론 QA        | 기존 TestData datasource `wall-qa-testdata-123`, raw_frame. 고정 시각 2026-11-05 06:00–06:10Z, Asia/Seoul. 실제 운영 측정값으로 표현하지 않음                      |
| 브라우저         | Chrome, 실제 데스크톱 viewport 1869×1150, DPR 1. URL별 Light/Dark 검증                                                                                             |
| 변경 보존        | 기존 미커밋/미추적 작업 약 265건 이상 존재. 사용자 index tree `0423fc0071bb143a81f8064df2bec6e8f3a43afe` 불변. 기존 작업을 섞은 커밋 없음                          |

증거 디렉터리:

`/Users/hongwookryu/.codex/visualizations/2026/11/05/wall-audit-ref125/`

여기에 작업 전 소스 `before/`, 원본 JSON `originals-before.json`, 비교 결과 `originals-verification.json`, 패널 inventory, QA 생성/저장 모델, `type-final-summary.json`, 검사 로그 `logs/` 및 화면 캡처를 보존했다. 민감한 사용자 행·비밀번호·데이터 소스 자격 증명은 보고서에 포함하지 않았다.

## 3. 구조 및 점검 범위

| 영역                  | 실제 연결/재사용 구조                                                                        | 이번 확인 범위와 결과                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 앱/내비게이션         | `WallChrome`, `navigationModel`, `managementNavigation`, 기존 NavIndex/라우터                | 전체 목록·분류·관리 컨텍스트, 권한 필터 소스 및 단위 테스트. 로컬 Admin 실제 탐색 확인                                                       |
| Control Bar/제목      | `WallDashboardToolbar`, `WallTimeRangeControl`, `WallAdaptiveFilters`, `WallVariableControl` | 원래 변수·시간·URL/권한·Dashboard Link 핸들러 재사용 확인. 툴바/적응형 필터 테스트 통과                                                      |
| Grid/직접 편집        | `WallDashboardWorkspace`, `PanelLayoutGrid`, `panelSnap`, `gestureMotion`, `WallEditContext` | 48열·스냅·미리보기·native 일괄 저장 경로 조사. QA Resize 저장/복원·이동 취소·복제 Undo·Kiosk 확인. 잔여 테스트/Dirty 문제는 아래에 별도 기록 |
| 패널 헤더/메뉴        | `WallPanelHeader`, `WallPanelActions`, Base UI Menu 기반 Command/Drill-in                    | A-Hybrid Grip/메뉴 구조, 보기·편집·복제 quick3, 실제 메뉴 및 편집 진입 확인. native 권한/핸들러 유지                                         |
| Time Series           | native TimeSeriesPanel/uPlot → EventBus/CursorSync/LegendFocus → Wall Legend/Tooltip         | 관련 단위 테스트와 실제 QA Shared Tooltip/두 plot Crosshair·범례 메뉴 확인. 이벤트 버스 중복 구현 없음                                       |
| Stat                  | native `getFieldDisplayValues`/Reducer/Formatter → Wall `statReadout` → BigValue             | 문자열 상태 색상 유실 재현·수정. 숫자·단위·상태·실제 시계열 조건 테스트 통과                                                                 |
| Gauge/Bar Gauge       | native field 계산/Threshold → `WallGauge`, `WallMeterBar`, Heat Strip 모델                   | 값·명시 임계치 유지 테스트, QA 65.0% 및 12개 LCD 항목/목록 스크롤 확인                                                                       |
| Table                 | native Table/필드/virtual rows와 Wall 셀/메뉴/저장 어댑터                                    | 단위/정렬/표시·저장 테스트 통과. QA 40행과 KiB 포맷·숫자 오른쪽 여유 확인                                                                    |
| Bar/Pie/XY/Histogram  | 공통 categorical/pie/analytic 모델 및 기존 renderer                                          | 모델·상호작용 테스트 통과. 이번 감사에서 모든 모드의 브라우저 실기는 수행하지 않음                                                           |
| 패널/쿼리 편집기      | `WallPanelEditor`, `WallQueryWorkspace`, native Queries/Transforms/Monaco                    | 실제 종합 패널 편집·코드/A/B·접힌 옵션·변환 0개 UI 확인. 소스/저장 로직 유지. 쿼리 실행 결과의 실데이터 검증은 연결 오류로 제한              |
| 대시보드 설정         | Wall 관리 프레임/collection → native 일반·변수·주석·링크·버전/저장                           | 관련 component tests 통과. 모든 설정의 실제 쓰기·버전 복원/권한 변경은 수행하지 않음                                                         |
| 관리자                | server-filtered NavIndex → 기존 관리 페이지                                                  | 데이터 소스 목록/Wall 상세, 플러그인 목록/Zipkin 상세, 사용자 목록·조직 목록 접근 확인. 설정 저장·설치·권한 변경 없음                        |
| 타이포/표면/모션/모달 | `typography.ts`, surface/motion 토큰, 로컬 shadcn 컴포넌트와 기존 Base UI primitive          | Inter/Pretendard 로딩·실제 computed family 확인. Light/Dark QA·native 저장 Drawer 확인. 테마/구조 재설계 없음                                |

원본 19개 대시보드의 데이터 패널 inventory는 Time Series 288, Stat 122, Gauge 38, Table 31, Bar Gauge 4, Text 7, Alert List 5, Logs 1, Bar Chart 1, clock plugin 1이다. 개수는 JSON 조사 결과이며 모든 패널을 브라우저에서 개별 검증했다는 의미가 아니다. 기존 별도 QA들은 이 집계에서 제외했다.

중복/예외 조사에서는 비시계열 차트가 공유 Tooltip export의 fallback을 쓰는 경로, 코드 편집 미지원 플러그인의 native 편집 경로, 05 전용 데이터 의미 투영을 구분했다. 이를 불필요한 중복으로 간주해 일괄 삭제하지 않았다. 메뉴 접근은 사용자 이름 `admin` 비교가 아닌 서버 제공 권한/기능 필터 NavIndex를 따른다.

## 4. 이슈 목록

**P0:** 이번 조사에서 입증된 P0는 없음. 침투 테스트나 전체 보안 감사 완료를 뜻하지 않는다.

| ID / 우선순위                   | 재현·화면                                                                                    | 실제 원인 / 영향                                                                                                                                                                                              | 처리·검증                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUD-001 / **P1**                | Stat 문자열 `DOWN` → `장애`, 명시 red mapping, neutral text threshold. 축약/전체값 모드 모두 | Wall이 이미 포맷된 `display.numeric`(문자열은 NaN)으로 Value Mapping을 다시 조회했다. 원래 문자열 정체성이 소실되어 명시 상태 색상을 neutral/empty로 판정. 장애 텍스트는 남지만 색·상태 표식이 사라짐         | **수정 완료.** native 원본 row 또는 실제 선택된 reducer cache로 mapping 판정. 원본 값/계산/포맷은 변경하지 않음. 재현 테스트 2건 red→green. 브라우저 kind `empty`/회색/dot 없음 → `status`/red/dot 있음, Dark도 확인                                                                                                                                             |
| AUD-002 / P3                    | Control Bar 필터 안에서 빠른 연속 blur 후 화면 해제                                          | blur마다 rAF를 예약하고 unmount 정리가 없었음. 중복 측정/해제된 영역 콜백이 남을 수 있음. 사용자 장애나 광범위 성능 저하가 실측됐다고 주장하지 않음                                                           | **수정 완료.** 예약 프레임을 하나로 합치고 unmount 취소. 반복 blur 1개 예약·해제 시 cancel 테스트 통과                                                                                                                                                                                                                                                           |
| AUD-003 / P2 (검증 신뢰도)      | Color/Format 테스트와 상대 시간 이동 테스트                                                  | REF-119의 16색 시계열 팔레트를 이전 8색과 같다고 검사. 상대 시간 테스트는 진행 중인 Date.now에 의존해 1ms 차이로 간헐 실패                                                                                    | **수정 완료.** 실제 팔레트/기존 prefix를 구분해 검사하고 해당 시간 테스트만 clock 고정. 제품 색상/시간 핸들러는 변경하지 않음                                                                                                                                                                                                                                    |
| AUD-004 / **P1 (RC 검증 차단)** | canonical `tsc --noEmit`                                                                     | 최종 144파일/264진단. linked package의 UI 선언과 현재 worktree 소스 차이, 서로 다른 React 타입 경로, 실제 테스트/생산 코드 타입 오류가 혼재. 모든 오류를 환경 탓으로 분류할 근거는 없음                       | **미해결.** 변경한 4개 root는 실제 source alias와 Jest setup을 사용한 제한 검사에서 0진단. 전체 타입 gate가 통과한 것은 아님. 패키지 해석부터 정상화 후 파일별 오류 수정 필요. tsconfig/검사를 약화하지 않음                                                                                                                                                     |
| AUD-005 / P2 (회귀 검증 결손)   | Wall 전체 tests의 5개 레이아웃/표현 suite, 12개 assertion 실패                               | 일부는 rAF 이전 즉시 geometry 기대, REF-60 전 pixel 보간 기대, SW+SE인데 handle 3개 기대, 제거된 overview DOM 기대. 남은 실패 전부가 stale test인지 제품 결함인지 분리 완료되지 않음                          | **미해결.** 실제 QA 핵심 조작은 통과했지만 회귀 gate 대체 불가. 임의 기대값 갱신/테스트 삭제로 통과시키지 않음. frame 처리와 최신 계약을 정리한 후 실제 동작 결함을 분리해야 함                                                                                                                                                                                  |
| AUD-006 / P2 (테스트 실행 차단) | Value Mapping/Prometheus/SQL/Loki editor의 접근성 조회                                       | 공통 Select 그룹의 `:has(+ [role="option"])`가 nwsapi에서 예외 발생. 실제 선택자를 좁힌 진단으로 원인 확인                                                                                                    | **2차 수정 완료.** 동일 경계선을 다음 option의 인접 형제 border로 표현. shim/접근성 우회 없음. 기존 실패 4 suites/35 tests 모두 통과, Select 포함 관련 5 suites/47 tests 통과.                                                                                                                                                                                   |
| AUD-007 / P2                    | `wallModern`가 없는 신규 QA에서 첫 Resize → Undo                                             | 크기는 원래대로 돌아와도 저장 바가 남는 현상 관찰. 첫 저장 Drawer에는 native 정규화 차이도 함께 나타남. Wall normalize 문서/초기 native save-model 차이를 조사했으나 잔여 dirty를 일으킨 필드를 확정하지 못함 | **부분 개선 / 원래 시나리오 미해결.** 2차에서 동일 좌표의 순서/임시 속성 비교 문제(AUD-009)를 수정했다. 이것만으로 최초 저장 전 native 정규화 Dirty의 원인 전체를 확정하지 않는다. 첫 저장 후 복제→Undo는 dirty0, 이동→취소도 dirty0. 원본에 손대지 않고 최초 저장 전 baseline/정규화 차이를 독립 fixture로 추가 분리할 필요. 무조건 dirty=false로 덮어쓰지 않음 |
| AUD-008 / P3                    | 데이터 소스 상세, 미리보기/Tooltip native 보조 문구                                          | Connection/Authentication/No data/Add annotation 등 native 영문 표현이 일부 남음. 공통 Wall 화면과 용어 일관성이 완전하지 않음                                                                                | **미수정.** 기능 오류와 구분한 후속 공통 번역 점검 과제. 이번 작업에서 플러그인 내부를 광범위하게 재작성하지 않음                                                                                                                                                                                                                                                |
| ENV-001 / RC 검증 제약          | source 11.4.0-pre / 로컬 backend 9.2.0                                                       | 실제 목표 버전과 실행 환경이 다름. API·플러그인·저장·권한 호환성을 목표 버전 기준으로 확정할 수 없음                                                                                                          | **환경 보존.** 사용자 허가 없는 백엔드 업그레이드/운영 전환 안 함. 일치하는 비운영 통합 환경에서 재검증 필요                                                                                                                                                                                                                                                     |
| ENV-002 / RC 검증 제약          | 종합/05의 원래 쿼리                                                                          | Prometheus relay 502/HTML, Mold DB 연결 실패. 일부 패널의 오류/Loading은 실측 연결 실패이며 가짜 데이터로 성공 처리할 수 없음                                                                                 | **환경 보존.** 데이터 소스/쿼리/링크 자동 변경 없음. 실제 데이터 재연결 후 Tooltip/통계/단위/Threshold 대조 필요                                                                                                                                                                                                                                                 |
| ENV-003 / P3                    | 로컬 대시보드 카탈로그                                                                       | 이전 QA들이 원래 목록에 섞여 탐색 밀도가 증가. 검색 결과 32개에서 이번 QA 1개 추가                                                                                                                            | **미수정.** 사용자 데이터와 이전 QA를 임의 삭제/숨김 처리하지 않음. 향후 별도 QA 폴더/환경 운용 기준 정리                                                                                                                                                                                                                                                        |

## 5. 실제 변경 파일

이번 감사에서 더한 변경만 기록한다. 이미 존재하던 대규모 미커밋 UI 작업은 이번 수정으로 집계하지 않는다.

| 파일                                                                                             | 변경 내용                                                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `public/app/features/wall-modern/panels/statReadout.ts`                                          | native row/reducer 기반 `statValueMapping` 공통 함수, 상태 색상 판정 연결 |
| `public/app/plugins/panel/stat/StatPanel.tsx`                                                    | Wall mapping 판정을 같은 함수로 통일. 기존 native/non-Wall 경로 유지      |
| `public/app/features/wall-modern/panels/statReadout.test.tsx`                                    | raw string mapping 재현 2건, native formatter 색상/텍스트 보존 검사       |
| `public/app/features/wall-modern/toolbar/WallAdaptiveFilters.tsx`                                | blur rAF 병합·해제 정리                                                   |
| `public/app/features/wall-modern/toolbar/adaptiveFilters.test.tsx`                               | 중복 예약/언마운트 취소 회귀 검사                                         |
| `public/app/features/wall-modern/colorFormat.test.tsx`                                           | 시계열 16색과 generic palette prefix를 구분한 기대값                      |
| `public/app/features/wall-modern/toolbar/WallDashboardToolbar.test.tsx`                          | 상대 시간 테스트 내부 Date.now 고정/복원                                  |
| `public/app/features/wall-modern/visualization.ts`                                               | 기존 import 순서만 정리                                                   |
| `public/app/features/wall-modern/useWallDashboards.test.ts`                                      | 기존 import 순서만 정리                                                   |
| `docs/WALL_QUALITY_AUDIT.md`                                                                     | 이번 감사 보고서                                                          |
| `public/app/features/wall-modern/DESIGN_SYSTEM.md`, `AGENTS.md`, `docs/WALL_AUTODEV_PROGRESS.md` | REF-125로 실제 수정/검증·잔여 gate 기록                                   |

CSS만으로 문제를 가린 변경은 없다. 신규 shadcn/Base UI 컴포넌트를 만들거나 renderer/Query/Transform 엔진을 교체하지 않았다. 새 쿼리·집계·상태·단위·색상 규칙도 추가하지 않았다.

## 6. 검사 결과와 재현 명령

| 검사                                | 결과                                                       | 해석                                                                                               |
| ----------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Wall 전체 suite (수정 전)           | 65 suites: 57 통과/8 실패, 456 tests: 440 통과/16 실패     | 기존 실패 baseline                                                                                 |
| Wall 전체 suite (수정 후)           | **65 suites: 59 통과/6 실패, 459 tests: 446 통과/13 실패** | 실패를 남긴 결과를 그대로 기록. suite당 실패는 아래 목록                                           |
| 수정 동작 4 suites                  | **50 tests 통과**                                          | Stat/Adaptive filters/Toolbar/ColorFormat                                                          |
| 최종 Stat/Adaptive filters 재검사   | **2 suites/10 tests 통과**                                 | 마지막 테스트 타입/정렬 정리 후 확인                                                               |
| native adapter/editor 관련 8 suites | 5 통과/3 실패, 21 tests 통과/21 실패, snapshot 1통과       | EventBus/CursorSync/LegendFocus/PanelScrollArea/CustomScrollbar 통과. Prom/SQL/Loki는 AUD-006 예외 |
| 임시 JSDOM 진단 4 suites            | 4실패, 13 tests 통과/22실패                                | 진단용 shim으로 해결되지 않음. 공식 통과로 집계 안 함                                              |
| canonical Type Check (최종)         | **264 errors / 144 files**                                 | Wall 106진단 중 production 69. 전체 gate 실패                                                      |
| 변경 4개 root 제한 TS               | **0진단**                                                  | worktree source alias + Jest setup. 전체 repo 타입 검사 아님                                       |
| Lint                                | **0**                                                      | Wall 폴더 전체 `.ts/.tsx` + StatPanel                                                              |
| Production Webpack                  | **성공**, 기존 bundle-size 경고 2개                        | Type Check를 대신하지 않음                                                                         |
| `git diff --check`                  | 통과                                                       | 기존 사용자 index/미커밋 보존                                                                      |

남은 Wall 실패:

| suite                                     | 실패 수 |
| ----------------------------------------- | ------: |
| `workspace/kpiLayout.test.tsx`            |       6 |
| `workspace/panelLayout.test.tsx`          |       2 |
| `workspace/PanelLayoutHistory.test.tsx`   |       1 |
| `workspace/PanelSelection.test.tsx`       |       2 |
| `workspace/overviewPresentation.test.tsx` |       1 |
| `editor/WallValueMappingsEditor.test.tsx` |       1 |

검사 명령(저장소 루트에서 실행):

```sh
node_modules/.bin/jest --config /tmp/wall-data-jest.cjs --runInBand public/app/features/wall-modern
NODE_OPTIONS=--max-old-space-size=4096 node_modules/.bin/tsc --noEmit --tsBuildInfoFile /tmp/wall-audit125-final.tsbuildinfo
node_modules/.bin/eslint public/app/features/wall-modern --ext .ts,.tsx public/app/plugins/panel/stat/StatPanel.tsx
NODE_ENV=production node_modules/.bin/webpack --config /tmp/wall-pie106-webpack.cjs
```

이 worktree의 node_modules는 다른 checkout의 package를 가리키므로 기존 로컬 Jest/webpack source alias 설정을 사용했다. stock CI와 동일하다고 표현하지 않는다. 설정 파일과 제한 TS 스크립트를 증거 디렉터리 `configs/`에도 복사했다. 전체 테스트에는 기존 duplicate manual mock 경고도 남는다. 최초 잘못된 `tsc --incremental false` 실행은 도구 호출 오류여서 품질 검사 결과에서 제외하고 위 canonical 명령으로 다시 실행했다.

## 7. 실제 브라우저 확인

| 시나리오              | 실제 관찰                                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 원본 05 5탭           | 개요21/네트워크19/스토리지7/Glue 디바이스6/프로세스6의 원래 데이터 패널과 Text 투영 확인. Netdive 링크 유지. SCVM 빈 값은 환경 제약 그대로 보존            |
| 종합 화면             | 공통 패널 헤더/메뉴/표면 표시. 일부 조회는 실제 연결 오류. 원본 정보/쿼리 성공으로 보고하지 않음                                                           |
| Stat 수정             | `장애`가 회색 empty에서 red status+dot으로 복원. Light RGB(224,47,68), Dark RGB(243,83,101). 실제 native formatter의 테마별 red 유지                       |
| SE Resize → Undo/Redo | 크기 313×182 → **377×228** (실제 카드 border box), Undo 원래 크기, Redo 변경 크기. 완료 후 Dot/가이드 잔류 없음                                            |
| 저장 → 새로고침       | QA version2의 `wallModern.layouts`에 48열 w12/h118 저장. 새로고침 후 실제 카드 377×228 복원. 기존 native panel IDs 1~6 유지                                |
| Grip 이동 → 취소      | Grip에서 이동, dirty 표시. 취소 후 저장된 x312/y517/w377/h228로 복원, dirty0                                                                               |
| 복제 → Undo           | 보기·편집·복제 메뉴. 6→7→6 패널, Undo 후 dirty0. 원본 쿼리/패널은 저장하지 않음                                                                            |
| 키오스크 → ESC        | 렌더된 패널 6개 상태에서 Resize/Grip/설정 0, ESC 후 Resize12개(SW+SE)·설정 복원. 해당 카드 rect도 원래 값으로 복귀                                         |
| Bar Gauge 내부 스크롤 | 12항목의 viewport148px/scroll552px, 휠로 scrollTop0→404. 마지막 65/72/79값 확인. 숫자 right1430.98px, list right1454px로 여유 유지                         |
| Shared Tooltip        | 소스/상대 plot Crosshair가 같은 x timestamp를 표시. 실제 기준15:04:50의 18.87%, follower 수집시각15:05:00/15:04:52를 구분 표시. 값 생성/시간 재라벨링 없음 |
| 범례 작업             | 실제 시리즈의 이름 복사/단독 보기/숨김/전체 복원/색/데이터 메뉴 확인. 존재하지 않는 data link 항목 없음                                                    |
| PromQL Workspace      | 종합 호스트 CPU 편집 진입, 코드 노출·A/B 선택·옵션/변환0개 UI. Builder/예제 UI 없음. 원래 쿼리 실행은 relay 오류로 성공 검증 못함                          |
| 관리                  | 데이터 소스/Wall 설정, 플러그인/Zipkin 상세, 사용자·조직 페이지 읽기 접근. 듀얼 레일 관리 컨텍스트 유지                                                    |
| 폰트/테마             | Wall Inter와 Wall Pretendard 로딩 true, computed family 일치. 최종 QA Light/Dark 실제 캡처, 최종 dirty0/Unexpected error 화면 없음                         |

캡처: `stat-mapping-before.png`, `stat-mapping-after.png`, `qa-light-final.png`, `qa-dark.png`, `05-overview.png`, `summary-current.png`, `query-workspace.png`, `admin-before.png`. 첫 Stat after 캡처는 배치 저장 검증 전이고 최종 QA는 저장한 배치다. 파형/색/수치 검증은 명시 fixture이며 운영 수치가 아니다.

원래 사용자 탭을 강제로 새로고침하지 않았다. 이번에 만든 감사 탭에서만 소스를 반영하고 최종 QA 탭을 유지했다.

## 8. 미검증·위험 작업 보류

- 실제 CCVM/SCVM/Mold 운영 데이터와 native Grafana 표시의 전 항목 대조, 실제 자동 갱신 지속성, 데이터 소스별 모든 쿼리/Transform 실행.
- Viewer/조직 관리자/서버 관리자 각 실제 계정의 전 경로 권한 행렬. source/unit 정책 확인은 했지만 계정을 생성하거나 권한을 바꾸지 않았다.
- Chrome 이외 Firefox/Safari, 물리 터치/트랙패드, DPR2 실기, OS reduced-motion 및 스크린리더.
- 수십~수백 시리즈/패널 장시간 갱신의 memory/CPU profiling. cleanup 조사와 단위 테스트 통과를 성능 수치로 대체하지 않는다.
- 모든 플러그인/모든 Bar·Pie·XY·Histogram 모드의 실제 브라우저 회귀, 모든 모달/화면 경계/viewport 조합.
- Ctrl/Cmd+C/V의 실제 브라우저 입력은 자동화 virtual clipboard가 paste를 차단해 확정하지 못했다. native 내부 clipboard/탭 간 ID·deep clone·저장·취소 단위 테스트는 통과했지만 실제 키보드 검증으로 보고하지 않는다.
- Drag/Resize 도중 매 프레임 rect/전체 충돌 조합, 실제 커서 깜빡임 장시간 관찰. 이번 기본 Resize/저장 확인은 이 전체 검증을 대체하지 않는다.
- 대시보드 JSON/권한/버전/관리 설정의 실제 변경, 라이브러리/백엔드 업그레이드, 운영 배포·서비스 재시작은 수행하지 않았다.

## 9. 다음 단계와 RC 차단 조건

1. **환경 재현성:** source11.4와 실행 backend 버전을 맞춘 비운영 환경, worktree package/types 해석과 재현 가능한 build/test 설정을 정리한다. 실제 데이터 연결을 복원한 후 검증한다.
2. **타입 gate:** 264진단을 package/React 타입 불일치·생산 코드·test fixture로 분리하고 canonical 검사를 통과시킨다. 제한 검사나 transpile build 성공으로 대체하지 않는다.
3. **회귀 gate:** rAF/Grid 최신 계약에 맞춰 실패를 재현하고 원인을 확정한다. geometry 기대값을 기계적으로 바꾸지 않는다. JSDOM selector 예외도 dependency/selector 수준에서 분리한다.
4. **최초 저장 전 Dirty:** AUD-007의 baseline/native normalization 필드를 독립 재현해 고친 후 저장·Undo·취소·이탈 확인을 수행한다.
5. **실데이터/권한:** 원본 종합·05에서 Query/Tooltip/Legend/단위·Threshold·Transform과 실제 권한별 관리/편집 경로를 대조한다. 이후 Firefox/작은 viewport/고밀도 장시간 검증을 수행한다.

현재 RC를 막는 것은 **실패 중인 타입/회귀 gate, 최초 저장 전 Dirty 미확정, 실행 버전 불일치 및 실데이터·권한 통합 검증 결손**이다. 색상·간격·영문 보조 문구 같은 P3 개선을 먼저 확대하지 않는다. 이번 감사의 목표는 기존 구조를 유지하면서 확인 가능한 결함을 고치는 것이며 전면 리디자인이나 기능 확장은 하지 않았다.

## 10. 2차 개선 결과 — REF-126 (2026-11-06)

### 실제 수정

- **AUD-006 해결:** 공통 Select `getSelectStyles.ts`에서 `:has(+ [role="option"])`를 `& + [role="option"]`로 바꾸고 경계선을 해당 option의 top border에 표시한다. 그룹 뒤 일반 option이 있을 때만 동일한 1px 경계선을 사용한다. 옵션/그룹/키보드/선택값/Popover 위치·검색 동작은 변경하지 않았다. 테스트용 prototype shim을 제품이나 공용 테스트 설정에 넣지 않았다. 브라우저에서 게이지 편집기의 실제 색상 Select를 열고 ESC로 닫은 뒤 변경 사항 없음 상태로 대시보드에 복귀했다.
- **AUD-009 / P2 해결:** `normalizeWallDocument`가 전체 객체의 배열 순서/임시 엔진 속성까지 비교해, 좌표가 동일해도 metadata Dirty를 만들 수 있었다. 신규 회귀 테스트에서 수정 전 실패를 확인했고, Grid가 이미 쓰는 `sameKpiLayout`(ID별 x/y/w/h 비교)으로 공통 판정을 통일했다. 실제 크기 변화·텍스트 변경은 여전히 Dirty이며 서버 baseline/원래 JSON은 변경하지 않는다. **AUD-007의 최초 저장 전 wire/native 정규화 문제 전체가 해결됐다는 의미는 아니다.**

### 변경 파일

1. `packages/grafana-ui/src/components/Select/getSelectStyles.ts`
2. `packages/grafana-ui/src/components/Select/getSelectStyles.test.tsx` — 그룹→일반 option 경계선 및 접근성 조회 회귀 검사
3. `public/app/features/wall-modern/workspace/wallDocument.ts`
4. `public/app/features/wall-modern/workspace/wallDocument.test.ts` — 순서/임시 속성 무시, 실제 geometry/텍스트 변경 보존
5. 이 보고서, `DESIGN_SYSTEM.md`, `AGENTS.md`, `WALL_AUTODEV_PROGRESS.md` — 상태/후속 작업 갱신

### 검증과 보존

| 검사                                             | 2차 결과                                                                                                                                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기존 예외가 난 편집기 4 suites                   | **35/35 통과**, 정상 기존 Jest 설정. 진단 wrapper/shim을 사용한 결과가 아님                                                                                                                                |
| Select/배치 문서/편집 Context/Clipboard 5 suites | **47/47 통과**                                                                                                                                                                                             |
| 전체 Wall 65 suites                              | **60 통과 / 5 실패, 448 tests 통과 / 12 실패 (총460)**. 기존 5개 layout/overview suite는 남음                                                                                                              |
| 수정 production 2개 root TS                      | **0진단**. worktree source 해석을 사용한 제한 검사이며 전체 타입 gate와 구분                                                                                                                               |
| 수정 파일 Lint / diff check                      | 통과                                                                                                                                                                                                       |
| Production Webpack                               | 성공, 기존 bundle-size 경고2                                                                                                                                                                               |
| 브라우저                                         | QA125에서 수정 빌드 반영 후 실제 Select 열림/ESC 닫힘/변경 없음·대시보드 복귀 확인. 그룹 뒤 option의 border 조건은 component test로 검증. 전체 viewport/Light-Dark 회귀를 새로 수행한 것으로 표현하지 않음 |
| 원본/서비스                                      | 원본19개 Dashboard JSON 동일. 사용자 index 불변. 기존 로컬 launchd preview만 빌드 반영, 3317 health/QA HTTP·3318 health200. 운영/고객·쿼리/단위/임계치·사용자 설정 변경 없음                               |

증거: `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-audit-ref126/`의 테스트/빌드/타입 로그, 원본 JSON 비교, `select-menu.png`. CSS 선택자 진단은 `/tmp/wall-audit126-selector.cjs`에서만 수행했으며 제품/정상 테스트 실행에는 포함하지 않는다.

### 잔여 문제와 우선순위

- AUD-004 전체 타입 gate: 1차의264진단은 여전히 미해결. 이번에는 변경 production root만 검사했으므로 전체 오류 감소를 주장하지 않는다. package/React 선언 해석을 정상화한 후 실제 오류를 분리할 필요가 있다.
- AUD-005 12개 레이아웃/overview assertion: 실패 기대값을 일괄 변경하지 않았다. 기존 rAF 스케줄/최신 Grid 계약과 실제 결함을 계속 구분해야 한다.
- AUD-007: 서버 저장 이전의 native 정규화/비교 baseline을 fixture로 분리해야 한다. 저장/JSON 호환성을 건드리는 광범위한 baseline 교체는 이번 안전한 수정 범위에서 수행하지 않았다.
- ScrollArea/Tooltip/Legend 정렬 및 관리자 경로는 1차에서 확인한 범위를 유지한다. 새로운 재현 증거 없이 CSS·권한·데이터 처리 코드를 변경하지 않았다. 실데이터 연결·목표 backend 버전·실제 권한별 검증 제약도 남는다.

RC 진입 보류 판단은 유지한다. 이번에 해결한 AUD-006과 AUD-009를 다시 미해결로 취급하거나, 이 결과를 전체 UI/데이터 검증 완료로 확대 해석하지 않는다.

## 11. RC 재평가 연결 (2026-11-06)

REF-127에서 전체 타입264진단·Wall회귀12실패를 재확인했고, 새24패널 QA에서도 최초 저장 전 Resize→Undo의 Dirty잔류를 다시 관찰했다. AUD-007은 미해결로 유지한다. 합성 다중패널/짧은 반복 진입/배치 저장·취소 결과와 미계측 성능 항목, RC 차단·해제 기준은 [WALL_RELEASE_READINESS.md](WALL_RELEASE_READINESS.md)에 기록했다. 제품 코드 변경 없이 RC진행불가 판정을 유지했다.

## 12. REF-129 후속 — 비고정 Tooltip 스크롤 결함 해결 (2026-11-06)

스크롤 가능한 높이가 있다는 기존 확인만으로 실제 입력을 보증하지 않는다. QA129에서 비고정 Tooltip의 pointer-events:none 때문에 휠이 뒤 범례로 전달되고 Plot 이탈로 Popup이 닫히는 결함을 재현했다. 공통 TooltipPlugin2의 Source 입력/Pointer·Focus 유지/이탈·ESC 정리와 비취소 wheel 경계를 수정했다. 실제 native 휠·Thumb·Home/End로8series76/76·작은20series412/412 및 마지막 행 가시를 확인했고 Header/시점/위치가 유지됐다. Right/Bottom 범례는 새로고침 직후 클릭 없이도646/646·494/494로 이동해 기존 경로를 보존했다. Light/Dark·시리즈 메뉴·Plot Zoom·Source 전환을 확인했다. 관련33tests/snapshot1·빌드·Lint 통과, production 제한TS0. 물리 트랙패드·Firefox·별도 Explore/Pan 실기·기존 RC 차단은 미완료다. 상세 증거와 import/컴포넌트 구분은 DESIGN_SYSTEM.md REF-129 및 진행 기록을 따른다.
