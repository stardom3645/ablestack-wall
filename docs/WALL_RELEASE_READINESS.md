# ABLESTACK Wall — Release Candidate 준비 상태

평가일: **2026-11-06 (Asia/Seoul)**
대상: `codex/wall-autodev-20261030`의 현재 작업 트리
결론: **RC 진행 불가 — 개발·통합 검증 단계 유지**

**REF-140 후속(2026-11-06):**3317의9.2.0 응답은 공식9.2 백엔드 실행을 뜻하지 않았다. 이전11.4.0-pre 계열 개발 빌드의 linker metadata 누락과 오래된 바이너리 재사용이 확인됐다. 현재 소스/출력 지문을 묶어 새로 빌드한 `localhost:3320`에서 backend/frontend 정합성과 복사본DB migration0을 확인했다. [정합성 복구 기록](WALL_RUNTIME_ALIGNMENT.md) 참고.3317·원본DB는 그대로이며 다른RC gate, 실제 로그인/역할·운영 데이터·부하 검증은 해결된 것으로 처리하지 않는다.

## 1. 판단 요약

프런트엔드 빌드는 성공했고, 합성 데이터 24개 시계열 패널의 표시·배치 저장/복원·화면 재진입을 확인했다. 그러나 전체 타입 검사와 기존 회귀 검사가 실패하며, 최초 저장 전 Undo의 Dirty 잔류도 다시 관찰됐다. 소스와 실행 백엔드 버전이 다르고 실운영 데이터 및 실제 역할별 접근 검증이 부족하다. 빌드 성공이나 제한적인 UI 관찰만으로 RC로 판정할 수 없다.

이번에는 제품 코드를 변경하지 않았다. 새로운 기능/디자인/라이브러리를 추가하거나 운영 서비스·DB·인증·포트를 변경하지 않았다. 새 로컬 QA에만 합성 데이터를 추가하고 배치 저장을 수행했다. 기존 원본 대시보드 19개 JSON 및 사용자 index는 모두 보존했다.

기존 이슈와 수정 이력은 [품질 감사 보고서](WALL_QUALITY_AUDIT.md)의 REF-125/126을 함께 따른다.

## 2. 환경과 시험 조건

| 구분        | 실제 조건                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 호스트      | Apple M4, arm64, 메모리 24 GiB. 전용 성능 시험 서버가 아닌 개발 호스트                                            |
| 소스/실행   | 프런트엔드 `11.4.0-pre`, 로컬 `/api/health` 백엔드 `9.2.0`, database `ok`                                         |
| 로컬 서비스 | 기존 preview 3317, fixture 3318. 운영 배포 및 실서비스 재시작 없음                                                |
| 브라우저    | 기존 Chrome 데스크톱 세션. Light/Dark 확인. CPU throttle/정밀 tracing/강제 GC 없음                                |
| QA          | `wall-rc-qa-127`, TestData `raw_frame`, **명시적 합성 데이터**                                                    |
| 규모        | 24개 Time Series × 8개 시리즈 × 121개 시점 = 23,232개 값 슬롯. 이 중 Null144개. 192개 시리즈와 긴 한·영 혼합 이름 |
| 데이터      | 고정 2026-11-05 06:00–06:10Z, 5초 샘플. sin 기반 결정론 값과 명시 Null. 운영 수치로 표현하지 않음                 |
| 레이아웃    | 기존 native 24열 gridPos 초기값, Wall 공통 48열 표시/직접 조작. 새 Grid/엔진 없음                                 |
| 갱신        | 5초 간격으로 설정한 상태에서 관찰 후 종료. 마지막 QA 기본값은 꺼짐으로 저장하여 배경 부하를 남기지 않음           |
| 데이터 연결 | 기존 CCVM Prometheus relay/DB 제약은 1차 감사 상태를 유지. 이 시험은 실제 Prometheus/MySQL 부하 검증이 아님       |

증거 디렉터리:

`/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-release-ref127/`

`fixture.json`, `saved-resize.json`, `source-values.json`, `browser-observations.json`, `api-read-latency.json`, `originals-verification.json`, 테스트/빌드/타입 로그, `dashboard-24-panels.png`와 `dashboard-dark.png`를 보존했다.

## 3. 성능·안정성 관찰값

### 다중 패널 / 갱신 설정 상태

| 관찰 시각(KST) | 타일 / plot / canvas | DOM 요소 | 오류 화면 / Dirty |
| -------------- | -------------------- | -------: | ----------------- |
| 09:13:44.601   | 24 / 24 / 24         |    7,169 | 없음 / false      |
| 09:14:29.582   | 24 / 24 / 24         |    7,169 | 없음 / false      |
| 09:14:55.819   | 24 / 24 / 24         |    7,169 | 없음 / false      |

측정점 사이 **71.218초** 동안 5초 갱신 설정을 유지했다. 세 관찰점에서 DOM 요소 수가 같았고 차트 24개가 존재했다. 이 시간은 관찰 구간이며 순수 렌더 시간이나 SLO가 아니다. 성공한 자동 쿼리 횟수·누락된 tick 수를 계측하지 않았으므로 시간÷5를 실제 갱신 횟수로 보고하지 않는다. 고정 raw_frame이므로 운영 스트림의 데이터 증가/지연/연결 복구 검증도 아니다.

### 해제·재진입 / 테마

- 대시보드 목록으로 이동하면 plot0, QA로 돌아오면 plot24/canvas24가 되는 과정을 **3회** 확인했다.
- 저장된 배치를 사용하는 3회 재진입에서 DOM7,197, Dirty=false, 오류 화면 없음으로 같았다. 최초 저장 전7,169와 다른 상태의 값을 섞어 메모리 증가율을 계산하지 않는다.
- Light→Dark→Light 재진입 후에도 plot24 유지. 최종 Light DOM7,197, 오류 화면 없음. 브라우저 도구가 수집한 error 로그는 조회 시 0개였다.
- 범례 목록의 실제 스크롤 viewport88px / content232px을 확인했다. 그래프는 별도 영역이며 긴 이름과 Mean/Last\*/Max/Min을 표시한다.

**해석:** 짧은 반복 사용에서 DOM 노드가 지속적으로 늘어나는 현상이나 명백한 React 오류는 관찰하지 못했다. 이것은 JS heap·detached DOM·리스너 누수 없음의 증거가 아니다. 현재 브라우저 검증 도구는 Performance/heap API를 노출하지 않아 FPS·Long Task·GC 후 retained heap·CPU 점유율을 측정하지 못했다. 해당 수치를 추정하지 않는다.

### 로컬 읽기 API

QA Dashboard GET API를 단일 클라이언트에서 순차10회 호출했다. 10회 모두 HTTP200, 중앙값 **4.760ms**, 최대 **18.385ms**였다. Python `perf_counter`로 로컬 응답 전체 수신까지 측정했다. 작은 표본·개발 호스트·로컬 캐시 조건이며, 차트 렌더 시간/Prometheus 처리량/동시 사용자 성능을 뜻하지 않는다. p95나 운영 수용량은 산출하지 않았다.

별도의 raw_frame `/api/ds/query` 직접 호출 시도는 HTTP500을 받았다. 실제 TestData 소스는 raw_frame을 프런트엔드 `rawFrameQuery`로 처리한다. 이 직접 호출은 정상 UI 실행 경로가 아니므로 유효한 데이터 소스 부하 측정에서 제외했다. 이를 제품의 정상 쿼리 오류로 분류하거나 성공 지연 수치로 집계하지 않았다.

## 4. 기능·데이터 검증

| 항목                     | 이번 결과 / 근거                                                                                                  | 한계                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24패널 렌더              | 실제 plot24/canvas24, 긴 범례8행씩                                                                                | 수백 패널·수십 시간 soak·모바일/다른 브라우저는 미검증                                                                                                                  |
| 단위/계산                | 첫 시리즈 Mean20.05%, Last\*17.32%, Max25.00%, Min15.00% 표시. 원본 계산20.05/17.317/24.998/15.0과 반올림 일치    | 모든 시리즈·실데이터·모든 단위의 전수 대조 아님                                                                                                                         |
| Tooltip                  | 15:05:00의 raw18.603이18.60%로 표시                                                                               | 합성 5초 샘플, 운영 타임스탬프 정확성 보증 아님                                                                                                                         |
| Shared Crosshair/Tooltip | 기존 EventBus/CursorSync/LegendFocus 단위 검사 통과. 이전 REF-125의 두 패널 실기 근거 유지                        | 이번 24패널의 클릭 고정 상태에서는 소스 Tooltip1개만 관찰. 비고정 Hover의 전체 follower 전파/지연은 확정하지 못함. 이를 전체 동기화 통과 또는 확정 버그로 분류하지 않음 |
| Zoom                     | 실제 drag로 URL/시간 범위가06:01:23.505Z–06:06:32.783Z로 변경                                                     | 모든 modifier/패널 시간 Override 조합 미검증                                                                                                                            |
| Pan                      | 기존 분석 차트 Pan 모델/입력 해제 테스트는 Wall 전체 검사에 포함                                                  | Time Series의 실제 연속 Pan/장거리 입력 실기는 이번에 미완료. 이전·다음 시간 이동을 Pan 검증으로 대체하지 않음                                                          |
| Resize / Snap            | 첫 카드501×296 →564×328. `data-wall-drop-preview`도 x312/y213/w564/h328, 실제 카드와 일치                         | drop 직전 모든 paint/모든 방향·충돌 조합을 계측한 것은 아님                                                                                                             |
| Undo / Redo              | Resize 크기 복원·재실행 동작                                                                                      | 최초 저장 전 Undo 후 저장 바가 남는 AUD-007 다시 관찰. 차단 이슈 유지                                                                                                   |
| 저장 / 복원              | 새 QA의 native 저장 version2 후 새로고침: x312/y213/w564/h328 유지, Dirty0                                        | 원본 사용자 대시보드에 쓰기 시험하지 않음                                                                                                                               |
| 이동 / 취소              | Grip 이동 후 변경 취소 → 저장된 위 rect로 복원, Dirty0                                                            | 여러 탭/다중 선택의 모든 경로는 기존 회귀 실패 해소 필요                                                                                                                |
| 관리자/권한              | 공통 NavIndex 권한 모델·관련 Wall tests와 native 저장/변경 추적 tests 실행. REF-125의 Admin 페이지 읽기 근거 유지 | 실제 Viewer/조직 관리자/서버 관리자/OAuth 각각의 E2E는 미검증. 이름이 admin인지만으로 권한 검증했다고 판단하지 않음                                                     |
| 기존 기능                | Prom/SQL/Loki 코드 편집 및 native 변경 추적 관련 추가10suites/56tests·snapshot1 통과                              | 실제 데이터 소스별 실행/저장 결과·전체 플러그인 호환성 검증은 아님                                                                                                      |

## 5. 이벤트·타이머 수명 검토

- EventBusPlugin 구독 unsubscribe, CursorSyncPlugin의 native uPlot destroy/leave 정리, LegendFocusPlugin의 두 구독 해제를 확인했다.
- gestureMotion의 mousemove/mouseup·rAF 정리, resizePointer의 pointerup/cancel/lostpointercapture 정리 및 관련 테스트를 확인했다.
- TooltipPlugin2는 disposed guard, ResizeObserver, scroll/resize listener, unrender timer, pinned 외부 입력 listener 정리를 보유한다. 이전 테마 전환 오류 수정도 유지된다.
- **추가 수명 검토 후보:** TooltipPlugin2의 Shift-Y Zoom에서 생성되는 임시 document mouseup listener는 정상 mouseup에서 정리되지만 effect cleanup이 해당 local callback을 직접 해제하지 않는다. pin용0ms timer도 별도 취소 handle이 없다. 화면 해제가 조작 중 발생하는 경우를 집중 재현해야 한다. 이번 관찰만으로 실제 retained heap 누수량이나 사용자 장애를 입증한 것은 아니다.

위 후보를 이유로 차트/입력 구조를 광범위하게 바꾸지 않았다. GC/heap snapshot과 입력 중 언마운트 재현을 후속 안정성 검증에 포함한다.

## 6. 빌드·회귀 gate

| 검사                                | 이번 실행 결과                                    | RC 판단           |
| ----------------------------------- | ------------------------------------------------- | ----------------- |
| Production Webpack                  | 성공, 기존 bundle-size 경고2                      | 단독 RC 근거 불가 |
| Wall 전체 unit/component            | **65suites:60통과/5실패;460tests:448통과/12실패** | 실패 중           |
| 추가 native 어댑터/편집기/저장 추적 | **10suites/56tests, snapshot1 통과**              | 해당 범위만 통과  |
| canonical 전체 Type Check           | **264진단**, exit2                                | 실패 중           |
| Wall 전체 ESLint                    | 통과                                              | 해당 범위 통과    |
| diff/index/원본 JSON                | diff check통과·index불변·원본19개동일             | 기존 작업 보존    |

남은 실패 suite는 kpiLayout, panelLayout, PanelLayoutHistory, PanelSelection, overviewPresentation이다. rAF/이전 UI 계약 기대와 실제 결함을 분리하는 작업이 남아 있다. 기대값을 기계적으로 바꾸거나 검사를 삭제하지 않았다. Select 관련 AUD-006 및 순서/임시 속성 Dirty AUD-009는 해결된 상태이며 중복 수정하지 않았다.

Jest와 Webpack은 기존 worktree source alias용 `/tmp/wall-data-jest.cjs`, `/tmp/wall-pie106-webpack.cjs`를 사용했다. Type Check는 저장소 `tsc --noEmit`을 그대로 실행했다. node_modules/다른 checkout 선언 경로 혼재와 React 타입 문제 등이 있어 clean checkout의 재현 가능한 CI가 아직 필요하다. 임시 로컬 build 성공을 배포 가능한 독립 artifact 검증으로 해석하지 않는다.

## 7. 호환성·운영 배포 준비

1. **실행 버전 일치:** 11.4.0-pre 소스와9.2.0 백엔드의 조합으로 목표 버전의 API/플러그인/저장/인증 호환성을 확정할 수 없다. 목표 버전이 일치하는 비운영 환경을 먼저 마련한다. 이번에 백엔드나 Grafana 버전을 바꾸지 않았다.
2. **재현 가능한 artifact:** 현재 많은 사용자 미커밋 작업이 섞여 있다. 사용자 변경을 보존한 승인된 revision/lockfile/package 경로로 빌드하고 checksum·테스트 결과를 연결해야 한다. 임의의 혼합 커밋을 만들지 않았다.
3. **실제 데이터 경로:** CCVM/SCVM/Mold 데이터 연결 후 시간 Override·변수·Threshold/Value Mapping·Null·단위·Transform·통계·갱신 지연을 대조한다. QA 데이터 소스나 localhost relay/fixture를 운영 설정으로 가져가지 않는다.
4. **보존/복구:** 기존 JSON과 Wall metadata의 저장·취소/이탈/버전 복원, DB 백업·복구 및 rollback을 비운영 사본에서 검증해야 한다. 운영 DB에 직접 쓰지 않았다.
5. **권한/연동:** 역할별 메뉴뿐 아니라 서버 API 접근, Mold OAuth/계정 연동과 Netdive 링크를 실제 환경에서 확인해야 한다. Kiosk는 UI 정책이며 보안 권한을 대신하지 않는다.
6. **부하/브라우저:** 현실적인 데이터 소스 부하, 동시 사용자, 갱신 간격, 수집 오류 복구, 지원 브라우저/DPR, 긴 세션의 GC 후 heap/리스너 수를 측정한다. 이번 수치로 운영 용량을 정하지 않는다.
7. **배포 방식:** 기존 프로토콜·포트·Cockpit/systemd 배포 기준을 유지한다. HTTPS 중앙화/443·19100 전환을 이번 준비 작업에 포함하지 않는다. 로컬3317/3318 시험을 운영 배포 완료로 표현하지 않는다.

## 8. RC 차단 이슈와 해제 기준

| 차단                      | 해제에 필요한 증거                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| AUD-004 타입 gate 실패    | clean한 package 해석 환경에서 전체 타입 검사 통과 및 생산 코드 오류 분리/해결                         |
| AUD-005 레이아웃 회귀12건 | 최신 Grid/rAF 계약 기준 재현·원인 확인·실제 결함 수정 후 관련/전체 회귀 통과                          |
| AUD-007 최초 저장 전 Undo | 초기 wire/native 정규화 차이를 분리하고 원래 상태로 Undo하면 Dirty0, 다른 미저장 변경은 보존됨을 입증 |
| 실행 버전/실데이터 불일치 | 목표 Grafana 버전의 비운영 통합 환경, 실제 데이터와 native 결과 대조                                  |
| 성능·입력·권한 검증 결손  | 비고정 Shared Hover/실제 Pan·역할별 E2E·입력 중 해제·장시간 heap/CPU/동시 사용자 부하 결과            |

**최종 판정:** 제한적인 로컬 검증에서 확인된 동작은 양호하지만 필수 gate와 통합·성능 검증이 남아 있다. 현재는 RC로 승인할 수 없다. 위 차단 항목을 해결한 뒤 같은 fixture와 실제 데이터를 사용해 재평가한다. 이번 결과를 근거로 운영 배포를 진행하지 않는다.

### 재현 절차

1. 기존 로컬 preview/fixture가 정상인지 확인하고, 증거의 fixture.json을 별도 비운영 QA로 사용한다. 원본 대시보드를 대체하지 않는다.
2. QA의 auto refresh를5초로 설정하고 시작/중간/종료 DOM·오류·실제 tick을 기록한다. 이 시험의 원래 값 슬롯23,232/Null144를 유지한다.
3. 긴 범례 스크롤/Tooltip의15:05:00·18.60% 및 통계값을 source-values.json과 대조한다. 고정/비고정 Shared Hover를 구분한다.
4. 첫 패널을 오른쪽 아래에서 늘려 preview/실제 border box를 비교하고 Undo→Redo→저장→새로고침, Grip 이동→취소를 수행한다.
5. 목록↔QA 재진입3회, Light/Dark를 확인한다. 대시보드 밖에서 plot0인지와 재진입 plot24를 기록하되 이를 heap 검사로 대체하지 않는다.
6. 위 gate를 실행하고 결과/환경/실패 로그를 보존한다. 시험 종료 후 QA의 자동 갱신을 꺼서 배경 부하를 남기지 않는다.

### REF-128 후속 확인 — Tooltip Source/Follower (2026-11-06)

회귀 QA127의 graphTooltip2가 다중 Tooltip 표시의 설정상 원인이었다. 테스트 작성자가 만든 QA127 기본만1로 정정했으며 패널 JSON은 동일하다. native2의 의미와 사용자 대시보드의 저장 설정은 유지한다. 새QA128의 실제 비고정 Hover에서24plot/Source Tooltip1개·Follower Crosshair, Source교체 시1개 유지·이탈0개, Default독립1개·명시SharedTooltip9개(가시패널)·이탈0개를 구분해 확인했다. Light/Dark 및Zoom/Resize/이동취소도 확인했다. 기존 표의 '비고정SharedHover 미확정'은 이 대표fixture에서 해소됐다. EventBus의stale DOMevent 오인과Tooltip의이탈/유효데이터판정을보강했고 관련43tests통과. Pan실기/장시간성능/실권한/기존타입·레이아웃gate와 AUD-007 등 다른RC차단은해결되지않았다. 세부근거는 DESIGN_SYSTEM.md/진행기록 REF-128을 따른다.
