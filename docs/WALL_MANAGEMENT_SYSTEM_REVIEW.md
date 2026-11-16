# Wall 관리 UI 및 관리자 보호 검증 — REF-189/190

2026-11-13. 작업 브랜치 `codex/wall-modern-lite`, 기준 HEAD `44a833458bce1bc5190ca5c84caf7288ef3492e0`, Grafana `11.4.0-pre`. 기존 미커밋 작업과 Git index를 유지했다. 이번 변경은 아직 커밋하지 않았다.

## 1. 먼저 처리한 내비게이션 수정 — REF-189

카테고리 아코디언 안의 `모든 폴더`·`대시보드 찾기`·검색 결과 요약을 제거했다. 선택한 호스트/VM 등의 메뉴 바로 아래에는 해당 대시보드 링크만 표시한다. 글로벌 헤더의 검색과 대시보드 라이브러리의 실제 폴더/검색 기능은 유지한다. 이미 폴더 URL에 있으면 범위와 query 매개변수를 기존 링크에 보존한다. 각 카테고리 안에 별도의 검색 상태를 더 이상 생성하지 않는다.

현재 메뉴 Link, Base UI Collapsible, 범위별 스크롤, 64/264px 상태, `wall:sidebar:collapsed`, 현재 URL 활성화 및 Netdive 외부 링크를 유지했다. 기존의 서버 권한 필터를 통과한 관리 항목만 사용하며 고급은 기본 접힘이다. 저빈도 서버 관리 링크도 제거하지 않고 고급에 보존한다.

## 2. 화면별 구현 — REF-190

기준은 기존 REF-186 소수 계정 사용자 설정 화면이다. 새 외부 SaaS 화면을 실사했다고 주장하지 않는다. 기존 프레임과 실제 로컬 화면의 전후 캡처를 비교했다.

- 사용자: 현재 목록 구조 유지. 초대 진입 버튼 제거, 역할 설명/읽기 전용 보호 사유, 생성형 기본 아바타의 이니셜 대체. 서버 사용자 생성은 기존 `users:create` 권한이 있는 경우 `/admin/users/create`에서 계속 가능하다. 직접 초대 URL/API와 외부 인증은 삭제하지 않았다.
- 서비스 계정: 전체 폭 테이블을 Key 아이콘·이름·로그인 ID·기본 역할·실제 상태·토큰 수·작업 메뉴를 갖는 semantic 목록으로 변경했다. 토큰 원문을 목록에 노출하지 않는다. 검색/상태 필터와 기존 API/외부 관리 제한/라이선스 RolePicker를 유지했다. 생성·상세는 같은 프레임을 사용하며 상세 정보는 Label/값/편집 행으로 구성했다. 비활성화 확인창이 삭제를 안내하던 실제 오류와 기본 역할 편집의 쓰기 권한 검사 누락을 수정했다. 토큰 및 권한의 native 상세 표/Modal은 유지한다.
- 조직 기본 설정: 조직 정보와 표시·시간 설정으로 구분하고 환경 설정 필드를 가용 폭에 따라 두 열/한 열로 배치했다. 조직 이름과 환경 설정의 별도 저장 API, 환경 설정 확인창, 개인 설정 우선순위 및 native Picker를 유지한다.
- 데이터 소스: 기존 Wall 목록의 실제 데이터/기본 표시/탐색 링크를 유지하고 공통 프레임과 로고 영역을 통일했다. Prometheus 포함 공식 로고의 색과 비율을 유지한다. 플러그인 설정·인증·TLS·Save & Test API는 변경하지 않았다.
- 플러그인: 카드 그리드를 공식 로고·실제 이름/설명·제작자/유형·native 상태 표시의 compact 2열 목록으로 구성했다. 검색/유형/설치 상태/정렬/상세 URL/설치 로직 유지. 긴 설명은 두 줄로 표시하고 전체 원문은 title로 확인한다. 벤더 설명은 임의로 번역하지 않는다.
- 연결 추가: 같은 로고/항목 체계로 실제 연결 유형을 표시한다. 검색·권한 없는 사용자 안내·Angular 경고·기존 상세 진입을 유지한다. 검색 배경과 sticky 위치를 작업 프레임에 맞췄다.
- 팀/상관관계: 실제 라우팅/권한/원래 기능을 유지하면서 공통 설정 프레임과 제품 용어를 적용했다. 기능이 없는 가짜 화면이나 실제 API 없는 작업을 만들지 않았다.

`WallAdminPage`는 기존 Grafana Page/NativeScrollbar, `WallUsersRegion`, Wall Typography/Surface 토큰을 재사용하는 공통 프레임이다. 별도 관리 시스템이나 새로운 폼 엔진이 아니다. 실행 버튼/메뉴는 기존 로컬 Wall Button 및 Base UI Menu를 사용하고, 복잡한 플러그인 Picker·Form·Dialog는 native 컴포넌트를 유지한다.

### 용어 정합성

| URL                               | 메뉴/주요 제목 | 적용 방식                                |
| --------------------------------- | -------------- | ---------------------------------------- |
| `/connections/datasources`        | 데이터 소스    | `managementTitles` 공통 메타데이터       |
| `/plugins`                        | 플러그인       | 동일                                     |
| `/connections/add-new-connection` | 연결 추가      | 기존 ‘새 연결 추가’ 제목 통일            |
| `/admin/users`                    | 사용자 관리    | 기존 사용자 화면 용어에 메뉴 일치        |
| `/org/serviceaccounts`            | 서비스 계정    | 공통 메타데이터, 상세에는 실제 계정 이름 |
| `/org`                            | 조직 기본 설정 | 기존 ‘기본 설정’ 제목 통일               |
| `/org/teams`                      | 팀             | 기존 기능 유지                           |
| `/datasources/correlations`       | 상관관계       | 기존 기능 유지                           |

Page의 native 탐색 메타데이터를 복사해서 해당 페이지의 node 제목만 투영하며 서버 navIndex를 변경하지 않는다. 같은 제목을 pageNav와 node에 중복 추가하지 않는다. 권한 없는 메뉴를 만들어 내지 않는다.

## 3. 관리자 보호

- 사용자 이름/메일이 아니라 실제 User ID와 Org ID를 비교한다. Server Admin과 조직 Admin을 별개로 처리하고 ID 0 익명 사용자를 실제 admin 계정과 동일시하지 않는다.
- 현재 조직 Admin의 자기 강등은 UI 읽기 전용 및 두 조직 역할 변경 API의 공통 helper에서 차단한다. 현재 사용자의 자기 조직 제거도 두 제거 endpoint에서 차단한다. 권한 미들웨어는 우회하지 않는다.
- 기존 저장소의 트랜잭션/rollback 기반 마지막 관리자 검증을 재사용한다. 판정에서는 비활성 사용자와 API용 서비스 계정을 제외하고 실제 사용 가능한 사람 Admin이 남도록 검사한다.
- UI는 현재 필터 결과의 행 수로 마지막 관리자를 추측하지 않고 해당 조직의 실제 멤버십 스냅샷을 읽는다. 조회할 수 없으면 self 보호와 서버 검증을 유지한다. 언마운트/조직 변경 뒤의 늦은 응답을 반영하지 않는다.
- 외부 인증 동기화와 custom RBAC의 native 제한을 유지한다. 보호된 Admin의 기본 역할 변경을 차단하며 새 역할 값이나 별도 권한 모델을 만들지 않았다.
- `/api/org/users/:id`는 `ShouldDeleteOrphanedUser=true`이므로 다른 조직 멤버십이 없으면 실제 서버 사용자도 삭제한다. 기존 경고는 이 동작과 일치하며 격리 API 시험에서 삭제 후 404를 확인했다. `/api/orgs/:orgId/users/:id`의 서버 관리자 제거 경로는 orphan 삭제 옵션을 켜지 않는 기존 동작을 유지한다.
- 기본 이미지와 사용자 지정 사진을 URL 모양만으로 단정하지 않는다. 기존 AvatarCache의 `GetIsCustom()` 결과를 이미지 응답의 `X-Wall-Avatar-Custom`으로 전달한다. false로 확인한 native 기본 이미지에만 이니셜을 사용하고 true/분류 없음/외부 이미지 URL은 기존 이미지를 보존한다. 새로운 API endpoint, 외부 조회 서비스, 업로드 기능은 추가하지 않았다.

**보호 범위의 한계:** 현재 로그인한 조직의 멤버십 변경 API와 해당 저장소 검증이 대상이다. 서버 사용자 삭제/비활성화, 외부 인증 동기화, Enterprise 전용 역할 API 전체를 새 정책으로 재작성하지 않았다. PostgreSQL/MySQL에서 동시 관리 요청을 발생시키는 경합 검증은 수행하지 않았다. 이를 전 시스템의 모든 권한 상실 경로가 검증됐다는 의미로 확대하지 않는다.

## 4. 검증 환경 및 실제 결과

- 로컬 `3334`의 DB/설정을 복사한 loopback `3342`에서 새 프론트엔드와 백엔드를 검증했다. QA에서만 익명 접근을 끄고 복사한 admin 비밀번호를 임시 재설정해 실제 User ID/권한으로 로그인했다. 원래 3334의 인증 설정/비밀키/비밀번호는 변경하지 않는다.
- QA 계정/서비스 계정 CRUD와 토큰 발급·폐기는 QA DB에만 수행했다. 생성한 테스트 계정은 제거했다. 토큰과 비밀번호는 보고서·캡처·검증 로그에 기록하지 않았다. QA DB를 3334로 복사하지 않는다.
- Ego에서 8개 주요 화면 × 1920/1440/1280px × Light/Dark = 48개 캡처 및 DOM 측정. 가로 넘침 모두 **0px**, 헤더 font-family는 모든 화면에서 Wall Inter/Wall Pretendard 체계였다. 카탈로그의 항목 수는 로컬 플러그인과 원격 목록의 실제 도착 상태에 따라 달랐으며 임의 데이터로 채우지 않았다.
- 격리 API **32개** 요청: 자기 Admin→Viewer/Editor 및 자기 제거 403, 다른 일반 사용자 역할 변경/제거 정상, 다른 Admin이 남을 때 타 Admin 변경 정상, 마지막 사람 Admin의 강등/제거 400. 비활성 Admin과 서비스 계정 Admin이 남아 있어도 마지막 활성 사람 Admin을 제거하지 못했다. API용 계정 생성/역할 변경/토큰 발급·폐기/비활성화·활성화/삭제 정상.
- 실제 브라우저: 자기 Admin 읽기 전용·이니셜·초대 없음, 일반 사용자 역할 변경, 제거 취소/확인, 서비스 계정 생성→상세·토큰 Dialog→비활성화/활성화→삭제 확인. 조직 이름 변경/원복과 별도 환경 설정 확인·저장. 실제 Prometheus Save & Test 성공. 별도 QA 데이터 소스를 loopback의 닫힌 9번 포트로 생성하여 실제 connection refused 실패 표시도 확인한 후 제거했다. 원본 연결 정보는 변경하지 않았다. 플러그인 및 연결 유형 검색의 실제 URL·목록 갱신도 확인했다.
- 관련 React 회귀 **23 suites / 145 tests 통과**. 상세 정보 행 구조 변경 후 서비스 계정 추가/상세 **2 suites / 10 tests 재통과**. Avatar의 custom/default/분류 없음 3가지 회귀 포함.
- Go API/조직 저장소/Avatar 관련 테스트 통과. `CreateWithMember`가 ID 0의 가상 멤버십만 남기던 기존 테스트 fixture는 실제 사람 Admin을 생성해 검증하도록 수정했다. 제품 데이터를 보정한 것이 아니다.
- Production 프론트엔드 및 같은 소스의 OSS 백엔드 빌드 성공. Webpack의 기존 번들 크기 경고 2개와 Browserslist DB 노후 경고가 남는다.
- 변경 TypeScript 파일 ESLint 통과. 전체 TypeScript는 **기존과 같은 205개 진단**이며 수정 파일의 신규 오류는 없다. 기존 InteractiveTable 진단의 union 순서만 달라졌으며 같은 TS2322이다.
- **Betterer 전체 strict 실패.** 작업 전 보존 소스에서도 같은 기존 WallDashboardLibrary/visualizations/workspace 등의 위반으로 실패를 재현했다. 이번 수정 경로의 신규 위반은 정리했고 `.betterer.results`를 낮춰 통과시키지 않았다. 전체 저장소 정적 검사 통과나 RC 완료로 보고하지 않는다.

## 5. 대상별 상태

`COMPLETED`는 명시된 현재 개발 환경/시험 범위 기준이다. 미실행 설치·외부 인증·다른 DB의 동시성 검증을 포함하지 않는다.

| 대상              | 구현                    | 화면 검증 | 기능 검증                | 남은 문제                                                                          |
| ----------------- | ----------------------- | --------- | ------------------------ | ---------------------------------------------------------------------------------- |
| 관리자 보호       | COMPLETED               | COMPLETED | COMPLETED (SQLite/API32) | 다른 DB 경합·Enterprise 별도 API는 NOT VERIFIED                                    |
| 사용자 초대 제거  | COMPLETED               | COMPLETED | COMPLETED                | 직접 URL/인증 API는 기존 권한 정책 유지                                            |
| 사용자 관리       | COMPLETED               | COMPLETED | COMPLETED                | 서버 기본 이미지 분류false 확인. 실제 외부 인증/업로드 사진은 mock 외 NOT VERIFIED |
| 서비스 계정       | COMPLETED               | COMPLETED | COMPLETED (브라우저/API) | 외부 관리/Enterprise 실환경은 NOT VERIFIED                                         |
| 조직 기본 설정    | COMPLETED               | COMPLETED | PARTIALLY COMPLETED      | 실제 저장 실패 강제 재현은 NOT VERIFIED                                            |
| 데이터 소스       | COMPLETED               | COMPLETED | PARTIALLY COMPLETED      | 모든 플러그인의 인증/TLS 조합·삭제 시험 미실행                                     |
| Prometheus 아이콘 | COMPLETED               | COMPLETED | COMPLETED                | 공식 로고/단위/연결 모델 유지                                                      |
| 플러그인          | COMPLETED               | COMPLETED | PARTIALLY COMPLETED      | 실제 설치/업데이트는 수행하지 않음                                                 |
| 연결 추가         | COMPLETED               | COMPLETED | PARTIALLY COMPLETED      | 모든 외부 연결 유형의 신규 연결은 미실행                                           |
| 팀                | COMPLETED (공통 프레임) | COMPLETED | PARTIALLY COMPLETED      | 실제 팀 CRUD는 미실행, 기존 테스트 통과                                            |
| 상관관계          | COMPLETED (공통 프레임) | COMPLETED | PARTIALLY COMPLETED      | 실제 상관관계 CRUD는 미실행, 기존 테스트 통과                                      |
| 고급 메뉴         | COMPLETED               | COMPLETED | COMPLETED                | 실제 서버 권한 필터 결과만 표시                                                    |
| 사이드바          | COMPLETED               | COMPLETED | COMPLETED                | 기존 폴더/검색 기능은 라이브러리·헤더에 유지                                       |
| 공통 컴포넌트     | COMPLETED               | COMPLETED | COMPLETED                | 플러그인 내부 native Form/Picker는 의도적으로 유지                                 |

## 6. 증거 및 변경 파일

스크린샷·DOM matrix와 비밀값 없는 API 결과는 로컬 검증 런타임의 `validation/`에 보관한다. 주요 비교는 `*-before.png`와 `*-light-1440.png`; Light/Dark/각 폭은 `matrix.json`으로 연결한다. 이 보고서는 전후 캡처와 개별 로그를 근거로 하며, 코드 테스트만으로 디자인 완료를 판정하지 않는다.

주요 변경: `wall-modern/WallNavigation.tsx` 및 회귀, `managementNavigation.ts`, `management/WallAdminPage.tsx`, `management/admin.css`; `admin/Users/OrgUsersTable.tsx`, `WallUsers.tsx`, `organizationProtection.ts`, `users.css`, `users/UsersActionBar.tsx`; `serviceaccounts` 목록/상세/생성/정보 행; `org` 설정; `connections` 목록/추가/검색/항목; `plugins/admin` 목록/항목; `teams/TeamList.tsx`, `correlations/CorrelationsPage.tsx`; `pkg/api/org_users.go`, `pkg/services/org/orgimpl/store.go`, `pkg/api/avatar/avatar.go` 및 관련 테스트. 전체 정확한 변경 목록은 `validation/changed-files.json`에 기록한다.

운영 환경·고객 DB·인증 정책·대시보드 JSON·데이터 수집·Netdive 내부 코드는 변경하지 않는다. 로컬 3334 반영 시에는 QA 설정/DB가 아니라 기존 실행본의 최신 DB/원래 인증 설정을 다시 복사하고, DB 행 및 migration_log 전후 해시를 검증한다. 로컬 반영 결과는 validation의 runtime-apply.json을 확인한다.

## 7. 로컬 3334 최종 반영

- 실행본: `~/Library/Application Support/ABLESTACK/WallPreview/coherent-management-system-20261113`, PID39839. 동일 소스 스냅샷의 프론트엔드/백엔드이며 Grafana 버전은11.4.0-pre다.
- 기존3334의 최신 DB를 원래 서비스 정지 후 다시 복사했다. 사용자3(서비스 계정 포함), 조직 멤버십3, 대시보드47, 데이터 소스7, 경보57, 조직1 및 migration_log709개 행의 전후 해시가 모두 동일하다. QA 계정0, 마이그레이션 변경0이다.
- `/api/health`, 대시보드 HTTP200, 실제 Prometheus health OK. 실제3334 Ego 화면에서도 카테고리 내 검색/폴더0·글로벌 검색1과 보호된 관리자 읽기 전용·초대 없음·동일 Wall 폰트를 확인했다. 사용자의 다른 탭은 강제 새로고침하지 않았다.
- 기존 미커밋 Netdive/기타 작업의 예상 밖 변경0, Git index 보존. 변경 소스는44개 파일이며 검증 자료는 실행본 `validation/`에 보관했다.
- 보조3317은 health200이나 로그인/대시보드가 `plugin_setting` 테이블 부재로 실패하는 별도 환경 문제가 있다.3318 Fixture는 기존 launchd 종료512/HTTP000 상태다. 이번3334 작업에 이를 섞어 DB 초기화·마이그레이션·서비스 재시작을 하지 않았다.

## 8. 개발 브랜치 통합 재검증 (2026-11-16)

`codex/wall-modern-lite` 통합 시 조직 저장소 테스트의 fixture 두 곳을 정리했다. 역할 변경 fixture는 실제 사용자 계정을 생성하며, 삭제 테스트는 조직 자동 등록을 끈 실제 사람 Admin을 명시적으로 추가하고 실제 반환된 조직/사용자 ID를 사용한다. 실제 사용자/운영 DB를 변경하거나 마지막 관리자 보호 조건을 완화하지 않는다. API의 자기 강등 차단 및 Avatar 테스트와 관련 프런트엔드29 suites/185 tests를 재확인했다. 단순 체크 표시와 시간 입력 안내는 기존 i18n 규칙에 맞춰 표현하며 신규 Betterer 위반을 허용하지 않는다.
