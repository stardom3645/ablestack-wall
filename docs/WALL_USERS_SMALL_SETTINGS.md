# REF-186 — 소수 계정 중심 사용자 관리

2026-11-13 · `codex/wall-modern-lite` / HEAD `44a833458b` 작업본 · Grafana 11.4.0-pre

## 디자인 판단

기존 REF-185는 1명에게도 6개 열의 표, 큰 검색창, 카드 외곽, 범위 Footer를 표시했다. 이름/역할/작업보다 구조 자체가 강했고, 화면 폭에 따라 한 계정을 과도하게 펼쳤다.

| 검토 방향                    | 장점                                                                                      | Wall에서의 제약                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A. Compact Member List       | 계정과 역할·작업을 빠르게 읽고 소수 계정에 자연스럽게 확장                                | 목록만 바꾸면 기존 디렉터리의 도구 밀도가 남을 수 있음                                           |
| B. Account Management        | 본인 계정과 추가 계정의 관계가 명확                                                       | 익명 조직 관리자·서비스 계정·서버/조직 권한이 다른 환경에서 본인·주관리자를 추정하면 오해를 만듦 |
| C. Minimal Settings **선정** | 콘텐츠 폭·페이지 제목·주요 작업·보조 도구를 함께 재구성하여 1명에도 완결된 설정 화면 제공 | 대량 목록 전용 정보 밀도는 목표가 아님. 실제 다중 페이지의 native Pagination은 유지              |

C를 페이지 구조로, A를 계정 표현으로 사용했다. 현재 로그인 계정이나 시스템 건강 상태를 추정하지 않았다. 빈 공간은 가짜 요약 카드로 채우지 않고 콘텐츠 폭과 정렬로 마감했다.

## 실제 참조

- [Vercel 공식 Members 문서](https://vercel.com/docs/rbac/managing-team-members#adding-team-members-and-assigning-roles): 사용자 제공 이미지와 같은 초대·역할 선택 이미지에서 주 동작과 보조 설명의 위계를 확인했다.
- [Linear 공식 Members and roles 문서](https://linear.app/docs/members-roles): 계정·역할과 overflow 관리 작업, 외부 인증에 의한 제약을 확인했다.
- 사용자 제공 Vercel/Linear 화면과 기존 Wall Typography/Surface/Button/Menu를 함께 참고했다. **로그인된 Vercel/Linear 설정 화면을 직접 조작하지 않았다.** 공개 문서와 이미지 검토를 실제 앱 검증으로 표현하지 않는다. 타 제품의 역할이나 초대 링크 기능은 구현하지 않았다.

## 실제 구현

- 사용자 목록만 `PageLayoutType.Custom`과 기존 `NativeScrollbar`를 사용한다. 최대 960px(좌우 padding 포함), 실 콘텐츠 912px의 설정 영역으로 제한했다. 글로벌 Header/Primary Rail/라우팅은 유지한다.
- 단일 제목·설명과 실제 권한이 있는 초대/생성 작업을 배치했다. 테이블 헤더와 카드 컨테이너를 제거하고 semantic `ul/li` 계정 목록으로 구성했다.
- 32px 기존 Avatar, 실제 이름/로그인 ID/이메일 → 기존 역할 선택/더보기 → 실제 활성 상태/최근 활동/인증 정보로 위계를 나눴다. 누락 정보에는 불필요한 대시를 채우지 않는다.
- 최근 활동은 실제 `lastSeenAt`을 기존 Formatter로 표시한다. 활성 상태는 실제 `isDisabled` 기준이며 건강/온라인을 추측하지 않는다. 조직 역할은 한국어와 실제 API 역할명을 함께 제공하며 서버 관리 권한과 혼동하지 않는다.
- 검색은 기본적으로 작은 Ghost 동작이며 열었을 때 기존 FilterInput·debounce·Redux·API를 사용한다. 활성 검색어는 유지되고 빈 입력 Escape는 검색 Trigger로 focus를 돌린다. 정렬과 실제 다중 페이지의 Pagination도 기존 엔진을 사용한다.
- 단일 페이지에는 불필요한 Pager/범위 Footer를 표시하지 않는다. 기존 외부 인증 동기화·metadata 권한·licensed RolePicker/Drawer·확인창·삭제 API를 보존했다.
- 사용자 추가 요청에 따라 권한 필터된 기존 팀/상관관계 링크를 `고급`으로 그룹화했다. 기존 Collapsible로 기본 접힘, 해당 직접 URL에서는 자동 펼침/활성 표시한다. 권한이나 경로를 새로 만들지 않았다.
- 실제 브라우저 검토에서 로그인 ID가 남은 공간에도 일찍 생략되던 문제를 발견해 프로필의 flex 가용 폭을 수정했다. 검색 Focus도 native Input의 기존 효과와 중복되지 않게 사용자 영역에서 정리했다.

## 주요 변경 파일

| 파일                                                                            | 역할                                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `public/app/features/admin/Users/WallUsers.tsx`, `users.css`                    | 공통 설정 프레임·목록·프로필·검색/정렬·상태/역할/작업 표현                          |
| `public/app/features/admin/Users/OrgUsersTable.tsx`, `UsersTable.tsx`           | 실제 조직/서버 데이터와 native 역할/위험 작업 재사용. non-Wall 조직 상세 Table 유지 |
| `public/app/features/admin/UserListPage.tsx`, `UserListAdminPage.tsx`           | 기존 권한별 탭/범위와 사용자 콘텐츠 프레임 연결                                     |
| `public/app/features/users/UsersListPage.tsx`, `UsersActionBar.tsx`             | 조직 사용자 콘텐츠·초대/검색·기존 pending 초대 기능 보존                            |
| `public/app/features/wall-modern/managementNavigation.ts`, `WallNavigation.tsx` | 기존 팀·상관관계만 접힌 고급 그룹에 배치                                            |
| 관련 테스트, `DESIGN_SYSTEM.md` REF-186                                         | 검색/목록/기능/권한/고급 직접 URL 회귀와 실제 component/primitive/CSS 범위 기록     |

새 패키지·편집 엔진·인증 정책·API·DB 스키마 변경은 없다. 기존 Netdive/Footer 및 다른 작업본과 Git index를 보존한다.

## 실제 브라우저 검증

Ego TaskSpace 89, 별도 localhost:3342 QA에서 실제 Grafana backend와 복사 DB를 사용했다. 1명은 로컬3334의 기존 실제 계정 데이터 복사본, 3/5/10명은 사용 불가능한 암호와 example.invalid 주소의 격리 테스트 계정이다. 테스트 계정을3334 또는 운영 DB에 추가하지 않았다.

| 조건                                                | 결과                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1/3/5/10명 × Light/Dark × 1920/1440/1280px (24조합) | 실제 DOM 항목 수 일치, 사용자 영역 Table 0, 가로 document overflow 0px, 단일 페이지의 불필요한 Pager 없음                                                                            |
| 실제 가용 폭                                        | 콘텐츠 wrapper960px / 목록912px. 1440px·1명에서 wrapper x384 / 목록 x408. 10명에서는 native 세로 스크롤 공간에 따라 x376.5 / x400.5, 목록 폭은 동일                                  |
| 1명 환경                                            | H1 24px/32px, 이름14px/600, 보조정보12px, Avatar32px. 계정 행108.69px, 목록 위 큰 Card/표 헤더/상시 검색/Footer 없음                                                                 |
| 소수 목록·긴 이름                                   | 5명은1000px높이 내 표시, 10명은 native 본문 wheel로 마지막 행까지 접근. 긴 이름·로그인·이메일 title 보존, 일반 로그인ID100px 실제 폭에서 생략 없음                                   |
| 검색·빈 결과                                        | `wall-member-08` 검색1명, 존재하지 않는 검색어 Empty State, clear 후10명 복원. 빈 검색 Escape→Trigger focus                                                                          |
| 정렬                                                | 로그인 내림차순의 첫 항목 wall-member-09, 기본 순서 복원 후 admin. 원본 데이터를 UI에서 임의 재정렬하지 않음                                                                         |
| 역할·작업                                           | 테스트 wall-member-02 Viewer→Editor 실제 PATCH 및 API 재조회 일치. 조직 제거 취소 후 유지, 확인 후9명 및 해당 조회 빈 배열 확인. 기존 orphan 계정 삭제 정책을 확인문구에 그대로 명시 |
| 키보드·메뉴                                         | 검색 Enter, 역할 메뉴 ArrowDown/Escape, Trigger focus 복귀 확인. 권한 없는/외부 인증 동기화 역할은 기존 단위 테스트와 코드 분기 보존                                                 |
| 고급 메뉴                                           | 최초 팀/상관관계 숨김, 고급 클릭 시 기존 링크 노출. `/org/teams` 직접 진입·새로고침 후 고급 expanded=true/팀 aria-current=page                                                       |
| 초대                                                | 기존 `/org/users/invite` 화면 진입. 초대 이메일 발송은 수행하지 않음                                                                                                                 |
| 콘솔                                                | 검색·역할 메뉴·스크롤 검증 구간 Runtime console error/exception 0건. 전체 제품의 콘솔 무오류를 뜻하지 않음                                                                           |

브라우저 기능 검증의 권한 변경·제거는 **3342 QA에만** 실행했다. 실제 사용자나 운영 데이터 변경은 수행하지 않았다.

## 테스트·빌드

- 관련 Jest **11 suites / 65 tests 통과**. 기존 duplicate manual mock 경고는 남아 있다.
- 변경 TS/TSX ESLint 통과.
- Betterer precommit strict: 관련14개 파일, 3개 규칙 모두 기존 상태 유지. 기존 누적 이슈 3937/20/745를 해결했다고 보고하지 않는다.
- Production webpack5.95.0 빌드 성공. 기존 asset/entrypoint 크기 경고2개 유지. 로컬 snapshot의 분리 캐시·실제 checkout alias를 사용했다.
- 전체 `tsc --noEmit`: 기준206개→205개. 파일/행/진단코드 비교 신규0; 이전 WallNavigation 테스트의 잘못된 testing-library `exact` 옵션1개 제거. ReactNode/Element 출력 순서 차이는 신규 오류로 세지 않았다. 전체 TypeScript 통과 상태는 아니다.

## 로컬 적용 및 보존

검증된 프런트 자산을 별도 `coherent-small-users-20261113` 런타임으로 로컬3334에 적용하고 실제1명 Light/Dark를 재확인했다. 기존 binary SHA와 backend source fingerprint가 동일한지 확인하고, 인증·권한·secret·기존 포트는 유지한다. DB는 기존3334의 최신 복사본만 사용하며 QA DB를 가져오지 않는다. 실행 provenance와 변경 전후 캡처·DOM측정·검사 로그는 해당 runtime의 `validation`에 보관했다. 사용자3/조직사용자3/대시보드47/데이터소스7/경보57/조직1의 행 hash가 적용 전후 일치하고 QA 계정0건을 확인했다. 운영 배포나3317/3318 서비스 설정은 변경하지 않는다.

## 전후 화면과 증거

- 변경 전 같은1440×1000 Light: `validation/wall-small-users-before.png`
- 변경 후 실제3334: `validation/wall-small-users-local3334-light.png`, `validation/wall-small-users-local3334-dark.png`
- 24조합 캡처: `validation/wall-small-users-after-{1|3|5|10}-{light|dark}-{1920|1440|1280}.png`
- 측정: `validation/wall-small-users-matrix-{1|3|5|10}.json`
- 긴 이름/스크롤: `validation/wall-small-users-long-name.png`, `validation/wall-small-users-scroll-bottom.png`
- 참조 공개 문서: `validation/wall-small-users-vercel-doc.png`, `validation/wall-small-users-linear-doc.png`

이전의 6열 표를 세로 목록으로 바꾸는 데 그치지 않고, 페이지 폭·주요 작업 위치·기본 도구 노출·프로필/메타데이터 위계·단일 페이지 하단을 함께 재구성했다. 시각적 평가는 위 캡처를 기준으로 하며 테스트 개수로 디자인 완성도를 점수화하지 않는다.

## 남은 제약

현재 로컬 세션은 익명 Org Admin이며 서버 UsersRead 권한이 없다. 서버 전체 사용자/상세·서버 생성, licensed 역할/Drawer 및 실제 외부 IdP 환경은 브라우저 미검증이다. 관련 native 분기와 테스트는 보존했으며 인증을 변경해 검증을 우회하지 않았다. 실제 초대 발송·운영 사용자 변경은 미수행이다. 사용자가 많은 경우의 native 다중 페이지는 기존 기능/테스트를 유지하되 이번 브라우저 검증은 요청한10명 이내에 집중했다.
