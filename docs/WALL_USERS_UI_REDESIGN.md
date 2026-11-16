# Wall 사용자 관리 Workspace 재설계 — REF-185

2026-11-13. `codex/wall-modern-lite`, HEAD `44a833458b` 기반 작업본. 대상은 로컬3334 `/admin/users`이며 이전 REF-184를 이어 개선했다. 운영 환경과 백엔드/인증/RBAC 정책은 변경하지 않는다.

## A. 기존 UI 문제 분석

최초 화면은 별도 Avatar·Login·Email·Name 열과 native Select/삭제 X를 사용했다. REF-184는 8열 정돈, 검색 크기, 메뉴 및 동작을 개선했지만 검색/초대/목록이 분리된 기존 정보 구조가 남았다. 사용자 식별 정보가 세 열로 흩어졌고 목록의 관리 범위·수·페이지 정보가 하나의 작업 흐름으로 연결되지 않았다.

기존 검색 이스케이프 보정, 메뉴 갱신 안정화, 역할 권한 조건 및 삭제 확인은 유지했다.

## B. 두 가지 레이아웃 방향

| 기준 | A. Management Workspace                                            | B. User Directory                                         |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 중심 | 관리 범위와 목록 작업 흐름                                         | 사용자 식별과 계정 탐색                                   |
| 구성 | 목록 맥락/주요 작업 → 검색·필터·정렬 → 목록 → 페이지               | 검색 → 프로필 중심 목록 → 각 계정의 역할·상태·작업        |
| 장점 | 서버/조직 범위 구별, 권한 관리, 많은 사용자와 페이지 이동에 적합   | 이름·로그인·이메일의 대응이 명확하고 빠르게 계정을 찾음   |
| 주의 | 단순 Card wrapper에 그치지 않도록 정보와 동작을 함께 재배치해야 함 | 계정별 카드/큰 행으로 변형하면 정보 밀도가 낮아질 수 있음 |

## C. 선택 이유

A를 선택하고 B의 프로필 셀을 적용했다. 사용자 관리는 계정 조회뿐 아니라 검색·정렬·권한 변경·제거를 반복하는 화면이다. 목록의 scope와 관리 작업을 같은 Surface 안에서 연결하면서, 2행 프로필로 동일 이름의 계정을 로그인 ID로 구별하도록 했다. KPI나 별도 통계 카드는 추가하지 않았다.

## D. 실제 구현

- 기존 Page의 제목/설명과 글로벌 Header/Rail을 보존했다.
- 목록 헤더: 실제 관리 범위(`전체 사용자` 또는 `조직 사용자`), API의 실제 사용자 수, 기존 생성/초대 및 외부 관리 링크.
- 도구 영역: 이름·로그인·이메일 검색, 기존 필터, 공통 정렬 메뉴. 검색과 정렬이 서로 인접한다.
- 사용자 셀: Avatar + 이름(없으면 로그인) + 고유 로그인 ID + 이메일. 긴 값은 ellipsis와 전체 title로 확인한다. 짧은 로그인 ID는 공간이 충분하면 생략하지 않는다.
- 조직 사용자 목록: 사용자 / 권한 / 상태 / 최근 로그인 / 인증 출처 / 작업의 6열. 서버 목록의 소속 조직·라이선스 역할은 실제 데이터에 따라 보존한다.
- 정렬: 기존 login/email/name/lastSeenAtAge의 asc/desc와 기본 순서. 기존 Redux/API만 호출하고 데이터 배열을 새 엔진으로 정렬하지 않는다.
- 하단: 실제 totalCount·page·perPage와 표시 행을 바탕으로 범위 및 기존 Pagination 표시. 갱신 중 이전 행이 잠시 남아도 범위가 전체 수를 넘지 않도록 제한했다.
- 기존 Base UI 역할/작업 메뉴 및 위험 작업 확인창을 유지했다. 마지막 조직에서 제거되는 계정도 삭제하는 기존 backend 정책을 확인 문구에 유지한다.

## E. 구조적 변화

| 항목         | 최초                         | REF-184                              | 이번 REF-185                                                |
| ------------ | ---------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| 사용자 식별  | Avatar/Login/Email/Name 분산 | Avatar+Login, Email/Name 별도        | 하나의 프로필 셀에 모두 유지                                |
| 조직 목록 열 | 10열                         | 8열                                  | 6열                                                         |
| 관리 도구    | 넓은 검색 + Invite           | 검색 + 떨어진 초대                   | scope/수/주요 작업과 검색·필터·정렬을 Workspace 안에서 구분 |
| 정렬         | 열 헤더                      | 열 헤더                              | 공통 메뉴, 동일 API 키/방향/기본 순서 유지                  |
| 사용자 수    | 목록 맥락에서 불명확         | 미표시                               | 실제 API totalCount와 페이지 범위                           |
| 행 높이      | 약48.5px                     | 53px                                 | 61px: 실제 프로필 2행을 담으며 카드 목록으로 변환하지 않음  |
| 1280px QA    | 과거 전체 조건 미측정        | 다수 사용자에서 내부83px 가로 스크롤 | 6열/짧은 ID를 가로 스크롤 없이 표시                         |

단순히 이전 테이블 바깥에 Surface만 추가한 변경이 아니다. 식별 정보의 그룹화, 열 배치, 정렬의 진입 위치, 주요 작업의 계층과 API count/paging 연결이 바뀌었다.

## F. 변경 파일

- `public/app/features/admin/Users/WallUsers.tsx`: Workspace·헤더·정렬·프로필·Footer 공통 구성. 이전 역할/작업 메뉴 재사용.
- `public/app/features/admin/Users/users.css`: 사용자 영역과 메뉴에 한정한 디자인/반응형 마감.
- `public/app/features/admin/Users/OrgUsersTable.tsx`: Wall의 6열 투영, 기존 non-Wall 열/정렬 유지.
- `public/app/features/admin/Users/UsersTable.tsx`: 서버 목록 프로필 그룹과 기존 부가 열/상세 링크 보존.
- `public/app/features/admin/UserListAdminPage.tsx`: 전체 사용자 Workspace와 기존 필터/생성/정렬 연결.
- `public/app/features/users/UsersListPage.tsx`, `UsersActionBar.tsx`: 조직 Workspace와 초대/검색/필터/정렬 연결.
- `public/app/types/user.ts`, `public/app/features/admin/state/reducers.ts`, `public/app/features/users/state/reducers.ts`: 기존 응답의 totalCount를 선택적 frontend state로 보존. API 모델 변경 없음.
- 관련 `UsersTable.test.tsx`, `WallUsers.test.tsx`, `UsersActionBar.test.tsx`, `UsersListPage.test.tsx`, 두 `state/reducers.test.ts`.
- `public/app/features/wall-modern/DESIGN_SYSTEM.md` REF-185 및 이 보고서.

이전 Netdive·변수·Footer 변경과 사용자 Git index를 보존했다. 글로벌 테마/사이드바/헤더, Dashboard, Prometheus, Kubernetes 및 backend 파일은 수정하지 않았다. 이 작업은 커밋/푸시하지 않았다.

## G. 검증

| 항목                | 결과                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기존 시나리오       | 변경 전 기존33tests 통과. 재설계 후에도 유지했으며 정렬 테스트는 이동된 실제 메뉴를 통해 동일 API 키를 검증                                                       |
| 관련 Jest           | 9 suites / 51 tests 통과. 기존33 + 관련 reducer12 + 프로필/방향·기본 정렬/totalCount/페이지 범위/초대 필터6                                                       |
| TypeScript          | 변경 전206 / 변경 후206. 행 번호를 정규화한 진단 multiset 동일, 추가0/제거0. 전체 TS 통과로 판정하지 않음                                                         |
| ESLint              | 변경 TS/TSX 파일 통과                                                                                                                                             |
| Betterer            | 3 규칙 통과, 신규 위반/기준 완화 없음                                                                                                                             |
| Production frontend | 기존 wrapper로 빌드 성공, 기존 asset/entrypoint size 경고2개                                                                                                      |
| 실제 QA             | 복사 SQLite의 합성 사용자99명 + 기존 admin = 100명. 검색20명, 마지막 페이지10명/비활성 계정, 이름/이메일/하이픈 ID 검색, 이름 정렬 asc/desc·최근 로그인·기본 순서 |
| 변경 동작 QA        | Viewer→Editor 실제 PATCH, 제거 취소 및 실제 DELETE, 마지막 조직 계정 삭제 확인. 합성 계정에만 수행했고 마지막 읽기 검증을 위해 해당 fixture를 복원                |
| 메뉴·키보드         | 외부 클릭 닫기, Esc 닫기 및 종료 후 Trigger 포커스 복귀, 검색 Tab→정렬의 Focus Visible 확인                                                                       |
| 초대                | 기존 초대 폼 진입만 확인, 제출/메일 발송 없음. 초대 대기 필터는 callback/상태/필터된 수를 단위 테스트로 확인                                                      |

기본 역할의 metadata 권한/외부 인증 동기화 제한과 라이선스/RolePickerDrawer 분기는 유지했다. 현재 실제 세션은 조직 사용자 권한이며 서버 전체 사용자 및 라이선스 UI를 실제 로그인으로 검증하지 않았다. 서버 테이블 정보·정렬·상세 경로·페이지 콜백은 단위 테스트로 검증했다.

## H. 테마 및 반응형

Ego Chromium에서 Light/Dark × 1920/1440/1280px을 실측했다. 모두 검색/정렬 높이36px 및 같은 y좌표, 6열·행61px, 목록 가로 스크롤 범위0px, 문서 가로 Overflow0px, 짧은 로그인 ID 잘림 없음이다. 긴 이름/이메일의 실제 전체 값은 title로 보존한다.

QA 캡처 파일과 `wall-users-redesign-measurements.json`, 기능/테스트 로그는 로컬 runtime의 `validation`에 보존한다.

## I. 동일 조건의 전후 비교

최초 `/tmp/wall-users-before-1440.png`, 이전 `/tmp/wall-users-after-1440.png`, 이번 `wall-users-redesign-after-1440.png`를 1440×1000px/Light/실제 admin1행으로 비교한다. 운영자가 사용하는 실제 계정에 권한 변경·삭제를 수행하지 않는다. 20/100명 화면은 합성 QA 데이터임을 구별한다.

## J. 남은 제약

- 사용자 상세/생성·초대 폼 내부, 팀/서비스 계정은 이번 목록 구조 재설계 대상이 아니다.
- 서버 관리자 실제 로그인, 라이선스 RBAC/Drawer, LDAP 등 실제 외부 인증 및 초대 발송 통합 검증은 미완료다.
- 전체 TypeScript 기존206개 오류는 남아 있다.
- non-Wall 조직 상세 caller는 기존 native 표현을 유지하며 이번 UI를 무조건 확대하지 않는다.

### 최종 실제3334 확인 및 재현 자료

로컬 active runtime은 `~/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113`이다. 기존과 동일한 backend binary/source hash를 유지하며 frontend 작업본을 별도 source snapshot/fingerprint로 기록했다. Python3.9.20으로 runtime 검사와 실제 HTTP frontend/backend 정합성 검사를 통과했다.

실제3334에서 Light/Dark,1440×1000px, admin1행·6열·행61px, Wall Inter/Wall Pretendard, count1명·범위1–1/1명, 문서 가로 Overflow0을 확인했다. 검색0명→초기1명 복원과 정렬 메뉴 Esc 포커스 복귀를 검증했다. 다른 사용자 탭은 강제로 새로고침하지 않았다.

실제 데이터의 적용 전후 최종 row hash는 user3 / org_user3 / dashboard47 / data_source7 / alert_rule57 / org1 모두 동일하다. QA 계정은 포함되지 않았고 별도3342는 종료했다. 기존3317 health200,3318 미응답 상태를 확인했으며 두 서비스를 변경하지 않았다.

| 비교                | 실제 동일 조건의 캡처                                                                                                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 최초 Grafana 구조   | [최초 화면](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-before-1440.png>)                                                                                                                                                                                  |
| REF-184 스타일 개선 | [이전 화면](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-after-1440.png>)                                                                                                                                                                                   |
| REF-185 구조 재설계 | [이번 화면](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-redesign-after-1440.png>)                                                                                                                                                                          |
| REF-185 Dark        | [이번 Dark](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-redesign-after-dark-1440.png>)                                                                                                                                                                     |
| 100명 QA            | [1440px Light](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-redesign-light-1440.png>), [1280px Dark](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-redesign-dark-1280.png>) |
| 20명 QA             | [검색된20명](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-redesign-20-users.png>)                                                                                                                                                                           |
| 마지막 페이지       | [실제10명/91–100,비활성 포함](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-workspace-20261113/validation/wall-users-redesign-pagination.png>)                                                                                                                                                        |
