# REF-187 — 통합 Sidebar 내비게이션

2026-11-13 · `codex/wall-modern-lite` / HEAD `44a833458b` 작업본 · Grafana11.4.0-pre

## 기존 구조의 문제

Primary64px와 Secondary224px가 독립된 두 열이었다. 펼침288px에서도 주요 메뉴는 아이콘만 표시되고, 텍스트 열에는 선택된 범위의 목록만 보여 처음 사용하는 운영자가 메뉴 의미를 파악하기 어려웠다. 별도의 브랜드와 경계가 두 영역을 더 분리했다. 기존 ≤900px의 Secondary에는 legacy `.wall-sidebar` transform도 중첩되어 단일 확장 내비게이션으로 다루기 어려웠다.

## 새 설계

단일264px Sidebar에 브랜드 → 아이콘+이름의 주요 메뉴 → 선택 범위의 탐색 → 도움말을 배치했다. 접힘은64px이며 동일한 링크의 라벨만 숨긴다. 두 열 구조를 CSS로 위장하거나 메뉴를 두 번 렌더링하지 않았다.

- 주요 메뉴11개(설정된 Netdive/권한이 있는 관리 포함)와 하단 도움말. 관리가 허용되지 않으면 해당 링크를 만들지 않는다.
- 선택 범위의 폴더·검색·동적 대시보드 목록 또는 기존 관리 그룹은 같은 열 아래에 연결한다. 주요 메뉴를 모두 읽을 수 있도록 상위 메뉴 영역과 상세 목록의 스크롤 책임을 나눴다. 각 대시보드 목록을 모든 메뉴에 복제하지 않는다.
- 기존 Base UI Collapsible로 범위 목록/관리 그룹을 접고 펼친다. `고급`은 이전 요청대로 기본 접힘이다.
- Primary 링크와 상세 탐색 DOM을 접힘/펼침 때 유지한다. 닫힌 상세 영역은 `inert`와 `aria-hidden`으로 즉시 포커스/클릭에서 제외한다. 기존 검색 값·스크롤·폴더·URL 모델을 유지한다. 관리 스크롤은 대시보드 범위와 별도 키를 사용해 서로 덮어쓰지 않는다. 실기에서 목록 끝1192px→관리→대시보드 복귀 후1192px을 확인했다.
- `wall:sidebar:collapsed`를 그대로 사용하고 두 번째 영속 상태를 추가하지 않았다. 전역 헤더 토글은 통합 `wall-sidebar`를 제어한다.
- ≤900px에서는 본문 시작점64px을 유지하며 Sidebar264px만 확장한다. 닫기·외부 클릭·탐색 영역 Escape·하위 링크 선택 시 기존 토글 상태로 닫고 전역 토글로 focus를 돌린다. Portal Menu의 Escape는 가로채지 않는다.
- 실제 브라우저에서 좁은 화면 전환 중 frame 여백이 잠깐 밀리는 문제와 전역 Escape 충돌을 발견했다. 반응형 frame 전환은 즉시 적용하고 Escape 구독을 Navigation DOM에 한정해 재검증했다.

## 벤치마킹

Ego에서 다음 실제 화면을 조작했다.

- [Dynatrace Playground](https://wkf10640.apps.dynatrace.com/ui/apps/dynatrace.dashboards/dashboard/dynatrace.dashboards.getting-started): Dock의 Collapse/Expand를 확인하고 원래 펼침 상태로 복원했다. 아이콘/명칭의 한 행 정렬과 축소 상태의 밀도를 참고했다.
- [TailAdmin 공식 데모](https://demo.tailadmin.com/): Toggle Sidebar로 확장/축소 화면을 확인했다. 고정된 아이콘 기준선과 명확한 활성 영역을 참고했다.

Wall의 기존 Inter·Pretendard/Surface/Border/Active/Hover/Focus/Radius/Spacing과250ms navigation·150ms content motion을 재사용했다. 타 제품의 로고·색상·메뉴 구성·장식은 이식하지 않았다. 새로운 디자인 시스템/라이브러리는 없다.

## 수정 파일

| 파일                                                   | 변경                                                                                                                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/app/features/wall-modern/WallNavigation.tsx`   | 단일 Sidebar/브랜드/동일 Icon+Label 링크, 기존 동적 상세 영역 재사용, 축소 Tooltip, 모바일 닫기·범위 제한 Escape 및 cleanup                                                                                 |
| `public/app/features/wall-modern/WallChrome.tsx`       | 기존 localStorage/토글 재사용, 통합 aria-controls, 닫은 후 전역 토글 focus 복귀                                                                                                                             |
| `public/app/features/wall-modern/application.css`      | 단일 열264/64px·아이콘 기준선·컨텍스트 스크롤·반응형 Overlay·기존 토큰/모션                                                                                                                                 |
| `public/app/features/wall-modern/applicationTokens.ts` | 기존 sidebar 토큰264px. rail64 유지                                                                                                                                                                         |
| `public/app/features/wall-modern/navigationModel.ts`   | 기존 경로·category/wallNav 보존, native `/alerting` 직접 URL의 활성 범위를 alerts로 보정. 관리 화면의 기본 all 범위를 이미 열린 목록으로 오인하여 대시보드 복귀를 막던 조건도 목록 화면에만 적용하도록 수정 |
| `WallNavigation.test.tsx`, `navigationModel.test.ts`   | DOM 유지·검색 복원·범위 URL·활성 상태·권한/Netdive·Escape 회귀                                                                                                                                              |
| `DESIGN_SYSTEM.md` REF-187                             | 실제 참조/버전/import/primitive·CSS 범위 기록                                                                                                                                                               |

`managementNavigation.ts`의 권한 필터/기존 경로/접힌 고급은 수정하지 않았다. 사용자 관리 페이지의 콘텐츠와 다른 기존 작업본/인덱스는 보존했다.

## 실제 브라우저 검증

Ego TaskSpace93. localhost:3342는 기존3334의 DB/설정 복사본을 사용하는 별도 Admin QA,3343은 별도 복사본의 익명 조직 역할만 Viewer로 설정한 권한 테스트 환경이다. 실제3334/운영 인증 설정은 변경하지 않았다. 테스트 중 계정·대시보드·데이터소스·즐겨찾기를 저장/변경하지 않았다.

| 항목                                          | 결과                                                                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1920/1440/1280 × Light/Dark × 접힘/펼침12조합 | nav64/264px, 본문 x64/264px, document 가로 넘침0. Primary 활성 항목1개, Netdive1개. 접힘 라벨 hidden·상세 inert/aria-hidden 확인                                                                            |
| 동적 탐색                                     | 대시보드43개·폴더4개를 실제 API 데이터로 표시. admin 폴더 선택 시 기존 `/dashboards/f/.../admin?category=hosts` 규칙 유지                                                                                   |
| 상세 진입                                     | 실제02. 호스트 종합 현황 진입, 상세 링크/호스트 범위 활성 확인. 상세 화면에서 가상머신 선택 시 기존 대시보드 경로·변수/시간은 유지하고 wallNav=vms로 탐색 범위 변경                                         |
| 뒤/앞·새로고침                                | history back/forward의 hosts/vms 복원. 접힘 상태 저장 후 reload64px, 펼침 저장 후 reload264px 및 범위 복원                                                                                                  |
| 검색·DOM                                      | 접기/펼치기 전후 검색 input와 main DOM 동일, 검색어03. 유지. hosts→vms→hosts의 범위별 검색어 복원                                                                                                           |
| 스크롤                                        | 실제 휠로 상세 목록 scrollTop1192px(뷰포트418px/내용1610px)까지 이동. 상위 주요 메뉴와 하단 도움말 유지                                                                                                     |
| 즐겨찾기                                      | 기존 `?starred` 진입과 실제 빈 목록 안내 확인. 실제 계정을 위해 임의로 별표를 추가하지 않음. 별표가 있는 목록은 기존 모델 단위 테스트로 확인                                                                |
| 경보                                          | 실제 경보 카테고리와 링크 보존. 현재 로컬 설정은 unified_alerting 비활성이라 native 경보 관리 링크를 생성하지 않음. 서버가 제공하는 링크와 직접 `/alerting` 활성 처리는 모델/컴포넌트 테스트로 확인         |
| 관리                                          | Admin QA에서 기존 데이터/접근/시스템 그룹·고급 및43개 대시보드/4폴더 표시. Viewer QA에서는27개 대시보드/1폴더로 권한 필터되고 관리 링크 없음, `/api/org/users`403. 기존 서버의 권한 필터 결과를 그대로 사용 |
| Netdive                                       | 실제 기존 `http://127.0.0.1:8082/ui_v2/`로 새 탭 진입 확인. 내부 탐색/VM 계약은 이번 작업 범위가 아님                                                                                                       |
| Tooltip/키보드                                | 접힘 호스트 Hover에 실제 Base UI Tooltip 표시. 링크의 aria-label 유지. 검색·링크 focus, Escape/닫기 후 전역 토글 focus 복귀 확인                                                                            |
| 700px 좁은 화면                               | Sidebar264px Overlay·본문 x64 유지·overflow0. 닫기 버튼/외부 클릭/Navigation Escape 동작 확인                                                                                                               |

본 브라우저 검증은 전체 제품의 성능 측정이나 모든 RBAC 조합의 보증이 아니다. 서버 관리자/Enterprise 역할의 모든 조합은 실제 세션이 없어 미검증이다.

## 테스트·빌드

- 내비게이션3 suites/20 tests 및 사용자 관리 포함 회귀12 suites/73 tests 통과.
- 변경 TS/TSX ESLint 통과.
- Betterer strict의3개 규칙은 기존 상태 유지(기존3937/20/745 issues). 기존 누적 이슈를 해결했다고 보고하지 않는다.
- Production webpack5.95.0 빌드 성공, 기존 asset/entrypoint 크기 경고2개. 기존 Browserslist 데이터 경고도 유지하며 의존성을 임의로 업데이트하지 않았다.
- 전체 tsc 기준205개, 신규0. 전체 프로젝트의 기존 TypeScript 오류는 남아 있다.

## 전후 캡처·측정

실기 증거는 로컬 runtime `coherent-navigation-final-20261113/validation`에 보존한다.

- 이전: `wall-navigation-before-expanded-light.png`, `wall-navigation-before-collapsed-light.png`
- 확장/축소 × Light/Dark ×3폭: `wall-navigation-{expanded|collapsed}-{light|dark}-{1920|1440|1280}.png`
- 실제 로컬3334의4가지 최종 상태: `wall-navigation-local-{expanded|collapsed}-{light|dark}.png`
- Tooltip/모바일/Viewer 및 벤치마크 캡처, `wall-navigation-matrix.json`, 테스트/빌드/정적 검사 로그 포함.

## 로컬 적용·남은 제약

검증한 프런트 자산은 기존 소스와 동일한11.4.0-pre 백엔드 바이너리를 유지한 별도 런타임으로 로컬3334에 적용하고4가지 최종 상태를 재확인했다. 실행 provenance/소스와 자산 hash를 기록하고 최신 실제 DB 복사본을 사용한다. QA의 Viewer 설정이나 데이터는3334로 가져오지 않는다. 사용자3/조직 사용자3/대시보드47/데이터소스7/경보57/조직1의 행 hash가 적용 전후 일치한다. 운영 서비스·DB·Netdive·Prometheus·대시보드 JSON은 변경하지 않았다. 사용자의 기존 탭은 강제 새로고침하지 않고 이번 검증용 결과 탭을 남겼다.3317 health200,3318은 작업 전과 같이 미응답이며 서비스 설정은 변경하지 않았다.

실제03/05 등 모든 대시보드 내부 기능을 재검증한 작업은 아니다. native 경보 관리가 비활성인 현재 환경과 실제 즐겨찾기0건 조건을 구별했다. Viewer는 격리 환경의 실제 backend 권한 필터로 검증했으며 실제 운영 사용자 역할을 변경하지 않았다.

## REF-188 보완 — 메뉴 바로 아래 아코디언 (2026-11-13)

위 REF-187의 별도 하단 상세 영역은 사용자 정정에 따라 대체했다. 최신 화면은 `호스트 → 해당 목록 → 가상머신`, `가상머신 → 해당 목록 → 다음 메뉴`, `관리 → 기존 관리 그룹` 순서로 실제 DOM 안에서 연결된다. 각 상위 링크의 다음 sibling이 실제 Base UI Collapsible Panel이며 선택된 범위의 상세 영역은 항상1개다.

상위 메뉴 재클릭으로 접기/펼치고 다른 범위를 선택하면 그 메뉴 아래에서 연다. 기존 Link의 href/새 탭 동작·URL/wallNav와 폴더/검색 모델, 관리 권한 필터 및 고급 기본 접힘은 유지했다. 상위 메뉴에 반복되던 하위 범위 제목과 접기 버튼을 통합했다. 닫힌 Panel은 inert/aria-hidden으로 키보드에서 제외하며 전체264/64px 전환도 유지한다. 메뉴 소유자가 바뀌면 하위 DOM은 새 위치에 구성되지만 검색·스크롤 값은 기존 상위 상태에 보존하고 같은 메뉴의 전체 Sidebar 축소/복원에서는 입력 DOM도 유지한다.

변경 파일은 `WallNavigation.tsx`, `application.css`, 해당 테스트와 `DESIGN_SYSTEM.md` REF-188이다. 실제 Base UI Root/Panel과 기존 Link/Tooltip을 사용하며 별도 아코디언 엔진이나 새 영속 상태는 추가하지 않았다.

Ego의 실제 로컬 데이터에서 호스트/가상머신/관리의 목록 소유자와 상위 행 바로 다음 배치를 확인했다(상위 행 bottom→Panel top:216→217px,253→254px,475→476px). 마우스 재클릭·Enter 펼침·호스트03. 검색 후 다른 메뉴를 거친 값 복원·전체 접기/펼침의 동일 input 유지, Light/Dark 및700px Overlay를 확인했다. 관련3 suites/21 tests·ESLint·Betterer 통과, Production build 성공(기존 크기 경고2). 전체 TypeScript205개는 기존과 같고 신규0이다.

최신 캡처와 검증 로그는 로컬 `coherent-inline-navigation-20261113/validation`에 보존한다. 기존 사용자 관리 콘텐츠/다른 작업본/인덱스와 backend/RBAC/대시보드 JSON은 변경하지 않았다.

## REF-189 — 카테고리 목록 단순화

REF-188 뒤 사용자 정정으로 카테고리 아코디언의 반복 폴더/검색 컨트롤과 결과 요약을 제거했다. 선택 메뉴 바로 아래 실제 링크 목록·현재 위치·스크롤만 유지한다. 글로벌 헤더 검색과 Library의 폴더/검색 기능은 유지하며 이미 선택된 폴더 URL/query는 다음 메뉴 링크에도 보존한다. 실제 Ego 검증의 카테고리 내부 input=0/folder trigger=0, 글로벌 검색=1과 회귀 결과는 `WALL_MANAGEMENT_SYSTEM_REVIEW.md` 및 validation 증거에 기록했다.
