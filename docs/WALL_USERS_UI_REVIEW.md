# Wall 사용자 관리 UI 검토 — REF-184

2026-11-13. 대상: 로컬 `http://localhost:3334/admin/users`, `codex/wall-modern-lite`의 HEAD `44a833458b`에 사용자 목록 작업본을 적용. 운영 환경은 변경하지 않았다.

## A. 기존 화면 문제

- 별도 아바타/빈 정보/삭제 열, 넓은 검색창, 영어 Invite, 기본 Select와 분홍색 X 버튼이 Wall의 다른 관리 UI와 달랐다.
- 실제 현재 세션은 조직 사용자 목록에 접근한다. 서버 전체 사용자와 조직 사용자를 구별해야 하며 서버 관리자 권한을 새로 부여하지 않았다.
- 긴 필드의 표시 폭과 작업 메뉴 위치, 검색·버튼 높이와 정렬을 개선할 필요가 있었다.
- 브라우저에서 하이픈 포함 검색어가 `wall\-qa\-01`로 API에 전달되어 결과가 비는 기존 결함을 확인했다.

## B. 구현

- 기존 Page 헤더를 사용자 관리/실제 조직 또는 서버 설명으로 구성. 헤더를 중복 생성하지 않았다.
- 로그인에 아바타를 결합하고 이메일·이름·최근 로그인 정렬 키를 유지. 긴 값은 ellipsis와 전체 title로 확인한다. 인증 출처는 실제 authLabels를 모두 표시한다.
- 검색과 Primary 버튼을 36px로 맞추고 검색 폭을 제한했다. 좁은 화면은 테이블 내부 가로 스크롤을 사용한다.
- 기본 역할은 Wall 공통 DropdownMenu와 Base UI RadioItem으로 선택한다. 메뉴를 열거나 Esc로 닫는 것만으로 변경하지 않는다.
- 조직 제거는 기존 metadata 권한과 ConfirmModal을 유지하며 위험 작업으로 구분한다. 서버 전체 사용자에는 기존 상세 경로를 연결한다.
- **기존 backend는 마지막 조직에서 제거한 orphan 계정을 삭제한다.** QA에서 이 동작을 확인했고 확인문구에 명시했다. 제거/계정 삭제 정책을 변경하지 않았다.
- 열린 메뉴가 데이터 배열 갱신으로 재생성되지 않도록 columns와 callback을 안정화했다.
- 검색용 정규식 escape는 클라이언트에 유지하고 API에 전달할 때 기존 Grafana unescape 함수를 사용한다. 서버 검색 query는 URL 인코딩하여 `&`, `+`, 괄호 등도 실제 검색어로 전달한다.
- 새로운 상태 판정·기능·UI 라이브러리는 추가하지 않았다.

## C. 변경 파일

- `public/app/features/admin/UserListPage.tsx`
- `public/app/features/admin/UserListAdminPage.tsx`
- `public/app/features/admin/Users/OrgUsersTable.tsx`
- `public/app/features/admin/Users/UsersTable.tsx`
- `public/app/features/admin/Users/WallUsers.tsx` (공통 표시/역할/작업 메뉴)
- `public/app/features/admin/Users/users.css` (사용자 목록에 한정)
- `public/app/features/users/UsersListPage.tsx`
- `public/app/features/users/UsersActionBar.tsx` 및 기존 테스트
- `public/app/features/admin/state/actions.ts`, `public/app/features/users/state/actions.ts` (검색어 전달만)
- `public/app/features/admin/Users/WallUsers.test.tsx`, `UsersTable.test.tsx`
- `public/app/features/users/state/userSearch.test.ts`
- `public/app/features/wall-modern/DESIGN_SYSTEM.md` REF-184
- `.betterer.results`: 해결된 기존 lint 항목 2개만 제거. 기준 완화 없음.

기존 Netdive·변수 선택기·Footer 작업과 Git index를 보존했다. 이 작업은 커밋/푸시하지 않았다.

## D. 기능 보존

기존 사용자 API, Redux, RBAC metadata, 외부 인증 동기화에 따른 비활성 역할, 라이선스 역할/Drawer 분기, 검색/필터/정렬, 초대 및 생성 경로, 상세 링크, 확인창과 페이지네이션을 유지했다.

`OrgUsersTable`의 새 표현은 `wallPresentation` opt-in이다. 조직 상세 관리 화면의 기존 caller는 native 표현을 유지한다. 백엔드/권한 정책/전역 테마/대시보드/Netdive는 수정하지 않았다.

## E. 검증

| 범위                | 결과                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 관련 Jest           | 7 suites / 33 tests 통과. 역할 변경·권한 없음/외부 동기화·제거 확인·메뉴 유지·정렬/페이지·검색어 인코딩 포함                                                                     |
| ESLint              | 변경 TypeScript 파일 통과                                                                                                                                                        |
| Betterer            | 3 규칙 검사 통과, 신규 위반 없음. 기존 2개 lint 항목 개선                                                                                                                        |
| 전체 TypeScript     | 기존 206개 진단으로 실패 상태 유지, 이번 변경 파일의 신규 진단 0. 전체 TS 통과로 판정하지 않음                                                                                   |
| Production frontend | `webpack.wall-preview.cjs` 성공, 기존 asset/entrypoint size 경고 2개. 백엔드 바이너리/버전은 기존 동일 소스 유지                                                                 |
| 브라우저 QA         | Ego, 복사 SQLite의 45개 합성 사용자. 권한 Viewer→Editor 실제 PATCH, 제거 취소/확인 실제 DELETE, 검색/빈 결과, 30+15 행 페이지 이동, 비활성 사용자, 초대 화면 진입, Tab/Arrow/Esc |
| UI                  | Light/Dark × 1920/1440/1280px, 긴 이름 title/말줄임, 검색/버튼 높이 및 y 일치, 문서 전체 가로 Overflow 없음                                                                      |

초대 폼은 진입만 검증했으며 실제 이메일 발송/계정 생성은 하지 않았다. 현재 세션에서 접근할 수 없는 서버 전체 사용자 화면/상세 및 라이선스 RBAC UI는 브라우저 미검증이다. 서버 테이블의 정렬·상세 경로·페이지 이동은 단위 테스트로 검증했다. 일반/관리자 권한 조합은 단위 테스트와 기존 permission 코드 보존으로 확인했으며 별도 실제 로그인 계정을 변경하지 않았다.

## F. 전후 및 실행 환경

수정 전 실제3334와 수정 후 실제3334를 같은 1440×1000px 조건으로 비교한다. QA 다수 사용자 화면은 실제 사용자 화면과 구분한다.

- 기존 검색 폭 약1000px → 최대400px, 검색/Primary 버튼 36px 및 y 일치.
- 기존 조직 테이블 10열 → 8열. 아바타와 로그인 통합, 의미 없는 빈 열 제거. 이메일·이름·최근 로그인 정렬 및 권한/출처/상태/작업은 유지.
- QA 행 높이53px, 긴 값은 화면에 따라 제한하며 전체 값을 title로 확인한다. 작은 화면에서 내부 스크롤로 오른쪽 작업을 확인한다.
- 로컬 적용 runtime: `~/Library/Application Support/ABLESTACK/WallPreview/coherent-users-20261113`.
- 별도 source snapshot과 build-input/wall-runtime fingerprint에 작업본 및 기존 backend 출처를 기록한다. 이전 runtime과 호환 lazy chunk를 보존한다.
- 로컬3334 DB는 실제 기존 DB의 최신 복사본만 사용한다. QA seed DB를 사용하지 않는다.
- 스크린샷·측정·테스트 로그는 위 runtime의 `validation` 디렉터리에 보존한다. 기존 사용자 탭은 강제 갱신하지 않는다.

## G. 다음 대상 / 남은 제약

- 사용자 상세 및 생성/초대 폼 내부의 영문·native 컨트롤은 이번 목록 개선 범위 밖이다.
- 팀·서비스 계정은 다음 별도 화면 검토 대상이다.
- 실제 서버 관리자/라이선스 환경의 추가 시각 검증과 초대 발송 통합 검증은 별도로 필요하다.
- 전체 TypeScript 기존 206개 오류는 이 사용자 목록 작업에서 해결하지 않았다.

### 최종 실측 및 로컬 반영 확인

| 뷰포트    | 검색/초대 버튼        | 목록 내부 가로 스크롤 범위 | 문서 가로 Overflow |
| --------- | --------------------- | -------------------------- | ------------------ |
| 1920×1000 | 높이36px, y168px 일치 | 0px                        | 0px                |
| 1440×1000 | 높이36px, y168px 일치 | 0px                        | 0px                |
| 1280×1000 | 높이36px, y168px 일치 | 83px                       | 0px                |

Light/Dark 양쪽에서 동일한 geometry를 확인했다. 1280px에서는 실제 브라우저 wheel 입력으로 목록의 scrollLeft가0→83px 이동했다. 로그인 헤더 선택 시 기존 `sort=login-asc` API 요청을 확인했다. 키보드 Tab으로 사용자 초대 링크에 Focus Visible이 표시되고, 역할 메뉴 Arrow/Esc 종료 후 기존 Editor 값이 유지됐다.

실제3334의 검색/빈 결과/초기화·작업 메뉴 Esc·Light/Dark 확인 완료. 실제 사용자1행(서비스 계정 제외),8열, Wall Inter/Wall Pretendard와13px 본문을 computed style에서 확인했다. API health는 database=ok,11.4.0-pre,commit44a833458b다. 실행 바이너리·frontend fingerprint/자산 검증이 통과했다. 로컬 launcher 검사는 Python3.9.20으로 실행했다(저장소의 기본 Python3.8은 기존 launcher의 Path.is_relative_to를 지원하지 않음).

최종 DB 행 hash는 user3 / org_user3 / dashboard47 / data_source7 / alert_rule57 / org1 모두 이전과 동일하며 합성 QA 계정은0이다. QA3342는 종료했고3334만 새 로컬 runtime으로 유지한다. 기존3317은 health200,3318은 미응답 상태이며 두 launchd 등록을 읽기 확인했고 변경하지 않았다.

- [수정 전 실제3334,1440px](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-20261113/validation/wall-users-before-1440.png>)
- [수정 후 실제3334,1440px](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-20261113/validation/wall-users-after-1440.png>)
- [수정 후 실제3334 Dark](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-20261113/validation/wall-users-after-dark-1440.png>)
- [다수 사용자 QA,1440px](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-20261113/validation/wall-users-qa-light-1440.png>)
- [QA Dark 역할 선택](</Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-users-20261113/validation/wall-users-role-menu-dark.png>)
