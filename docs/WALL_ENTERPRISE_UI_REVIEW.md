# Wall Enterprise UI 정밀 개선 — REF-191

2026-11-13. `codex/wall-modern-lite`, HEAD `44a833458b`. 작업 전 미커밋 78개 파일과 index를 `/tmp/wall-enterprise-baseline`에 보존했다. 운영 환경과 실제 사용자·팀·토큰을 수정하지 않는다. 실제3334는 조회 전용, 기능 변경 검증은 DB 복사본의3342를 사용한다.

## 변경 전 실제 화면 조사

Ego TaskSpace99에서 모든8개 관리 경로와 데이터소스·플러그인·서비스계정 상세를 방문했다. 실제 팀이 없어 팀 생성·상세·설정·권한과 상관관계 생성 폼은3342 복사본에서 확인했다. `/tmp/wall-enterprise-evidence/*-before.png`에 동일1440px 화면을 보존했다.

| 화면           | 확인한 문제                                                                                                                                    | 판정 / 우선순위         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 사이드바       | 전체 body 외에 상세 목록에340px/38vh cap이 있어 남는 공간과 내부 스크롤 공존. 상위/관리그룹 계층이 약함. 좁은 화면은 수동 접힘값을 그대로 사용 | 구조 개선 필요 / 1      |
| 서비스 계정    | 목록은 공통 멤버 목록이나 상세는 native role Select·토큰 table·상단 destructive 버튼. 긴 토큰 이름과 권한 표가 화면을 지배                     | 구조 개선 필요 / 2      |
| 조직 기본 설정 | 기존 두 폼의 책임은 분리됐지만 native 필드·설명·저장 피드백이 약하고 가로배치 밀도가 불균형                                                    | 구조 개선 필요 / 3      |
| 데이터 소스    | 공식 아이콘과 공통 목록은 유지할 만함. 상세는 플러그인 소유 설정 폼과 기존 헤더·탭 사용                                                        | 주변 UI 정합성 점검 / 4 |
| 플러그인       | 목록은 compact2열. 상세는 실제 로고·서명·readme·권한에 따른 설치제한 유지                                                                      | 주변 UI 정합성 점검 / 4 |
| 연결 추가      | 실제 플러그인 기반 목록·검색 재사용 가능                                                                                                       | 유지 및 반응형 검증 / 4 |
| 사용자         | 실제 admin1명, 관리보호 및 compact list 유지. 일반 역할 메뉴는 QA 사용자로 검증 필요                                                           | 유지 및 회귀 / 4        |
| 팀             | 실제0명. QA에서 구성원 native 권한 table과 설정 확인                                                                                           | 공통 정합성 개선 / 4    |
| 상관관계       | 실제0개. QA에서 실제3단계 생성 폼 확인                                                                                                         | 공통 정합성·회귀 / 4    |

TailAdmin Profile을 실제 방문했다. 하나의 `overflow-y:auto` 탐색 영역과 `scrollbar-width:none`, MENU/SUPPORT/OTHERS 구획을 확인했다. Wall은 메뉴 이름·색·아이콘을 복제하지 않고 기존 메뉴를 모니터링/연계 및 관리/지원으로 구분한다. 스크롤 기능은 native 입력 그대로 유지한다.

## 최종 결과

사이드바의 중첩 스크롤과 임의 높이 제한을 제거했고, 실제 메뉴를 **모니터링 / 연계 및 관리 / 지원**으로 구분했다. 반응형 레일과 임시 오버레이는 수동 접힘 설정을 덮어쓰지 않는다. 서비스 계정과 조직·팀 설정은 공통 Wall 프레임·컨트롤로 정리했다. 데이터 소스·플러그인·팀 상세는 실제 이름·공식 리소스·native Tab 링크를 재사용한다.

| 페이지                             | 문제                                                       | 변경 내용                                                                                                             | 화면 검증                                                            | 기능 검증                                                                                            | 상태                                                                  |
| ---------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 사이드바                           | 340px/38vh 하위 cap·중첩 스크롤·약한 계층·반응형 상태 혼용 | 한 scroll owner, 구획, 단계별 Typography, 1199px 이하 임시 rail/overlay, 수동 설정 유지                               | Light/Dark, 1920/1440/1280/1100/960/768, 펼침·접힘·Tooltip           | wheel·PageDown·End, reload·resize 복원·Escape, Viewer 메뉴 숨김                                      | COMPLETED                                                             |
| `/admin/users`                     | 이미 개선된 compact 목록과 주변 탐색의 정합성              | 기존 사용자 목록·보호·아바타·권한 UI 보존, 공통 탐색 적용                                                             | 실제1명과 QA2명, Light/Dark·768~1920                                 | 기존 사용자 회귀, Viewer의 server users API403, 역할 메뉴                                            | COMPLETED                                                             |
| `/org/serviceaccounts`             | 상세의 native 표·상단 destructive·긴 토큰 이름·역할 Select | 정보/토큰/접근 권한/하단 상태 작업, 명시적 이름 편집, 공통 역할·상태 메뉴, compact token metadata, native 삭제 확인   | 목록·상세·생성·만료일 폼·disabled·긴 이름, Light/Dark·6폭            | UI 생성→이름·역할 변경→만료 토큰 발급→취소/삭제→비활성/활성→계정 삭제, 실제 접근 권한 추가/변경/제거 | COMPLETED                                                             |
| `/org`                             | 폼 위계·컨트롤 혼용, 성공 후 오류, 취소 후 pending 잔류    | 별도 저장 범위·설명·pending/실제 오류·공통36px 컨트롤, legacy nav 갱신·dismiss 연결 수정                              | Light/Dark·6폭·실제403                                               | 이름 저장 성공·실제 orgs:write 거부 및 값 미변경, prefs 취소·재시도·저장/reload·원래7개 값 보존      | COMPLETED                                                             |
| `/connections/datasources` 및 상세 | 목록과 상세의 헤더·탭·폼 마감 차이                         | 실제 logo/제목/정보·탭을 공통 프레임으로, native plugin 폼/보안 필드 유지                                             | Prometheus/Loki/MySQL 설정, password masking, Light/Dark·작은 화면   | QA에서 Save & Test 성공, 별도 QA datasource 실제 connection refused·생성/삭제, Loki/MySQL health200  | PARTIALLY COMPLETED — 자격증명 교체·TLS 인증서 저장은 미검증          |
| `/plugins` 및 상세                 | 상세 제목·설명·탭·readme의 위계 차이                       | native 정보·액션·서명·탭/동작 유지, 공통 프레임·본문 Typography, 잘못된 복합 paragraph 제거                           | 목록·Prometheus 상세·Light/Dark·탭·실제 공식 logo                    | 플러그인 상세에서 QA 데이터 소스 생성 진입, 기본 권한/설치제한 유지                                  | PARTIALLY COMPLETED — 실제 plugin 설치/제거·라이선스 앱 설정은 미검증 |
| `/connections/add-new-connection`  | 주변 프레임과 로딩/완료 상태 구분 필요                     | 기존 목록·검색·공식 plugin 리소스 유지, 공통 프레임 적용                                                              | 실제 catalog211링크 로드 후 Light/Dark, 최초10개 logo 정상 로드 확인 | 실제 Prometheus 상세→신규 QA datasource 생성                                                         | PARTIALLY COMPLETED — catalog 모든211개 플러그인 실행·설치는 미검증   |
| `/org/teams` 및 상세               | 상세가 이전 native header·권한 표·설정 폼                  | 공통 실제 팀명·native tabs·permissions opt-in·설정 grid                                                               | QA의 실제 팀 생성·구성원·설정, Light/Dark                            | UI 팀 생성·이름 수정, 기존 TeamPages/TeamSettings/CreateTeam 회귀 및 공통 권한 API 흐름              | COMPLETED — OSS 범위; Team Sync/라이선스 역할은 미검증                |
| `/datasources/correlations`        | 생성 폼 마감, 외부 대상 빈 셀,1페이지 pagination           | 기존3단계 wizard·모델 유지, 외부 URL 유형 표시, 단일 페이지 pagination 제거, 빈 대상 정렬 guard·절제된 기존 삭제 제어 | empty·생성3단계·실제2행 목록·Light/Dark                              | 실제 QA external correlation 생성·상세 펼침·두 external 대상 정렬, 기존 query/external 회귀12tests   | COMPLETED — 외부 fixture 범위; 운영 규칙은 변경하지 않음              |

`COMPLETED`는 위에 적은 범위의 구현·실기 검증 완료를 뜻한다. 미검증 기능까지 완료로 확대하지 않는다.

### 실제로 발견해 수정한 기능 결함

- 조직 이름 PUT은 성공했지만 `navIndexReducer.updateConfigurationSubtitle`이 존재하지 않는 legacy `apikeys` 등의 `parentItem`을 읽어 실패했다. 현재 navigation/RBAC가 제공하는 항목만 갱신하며 없는 메뉴를 생성하지 않는다. 부분 nav tree의 회귀 테스트를 추가했다.
- `ModalsContextProvider`가 원래 `onDismiss`를 덮어써 조직 prefs 취소 Promise가 해결되지 않았다. 원래 콜백을 전달하고, 먼저 기존 모달을 닫아 콜백이 후속 확인창을 열어도 지우지 않는다. 취소/확인/후속 모달 테스트와 브라우저 Escape·취소·재시도를 확인했다.
- 외부 correlation은 대상 data source가 없어 이름 정렬 시 undefined를 읽을 수 있었다. 실제 대상이 없는 경우 안정적으로 처리하며 쿼리·규칙·순서를 저장하지 않는다.

### 확인한 실제 측정값

- 1440×1000 긴 대시보드 목록에서 내부 scroll owner **0개**, 외곽 메뉴 owner **1개**. 실제 wheel 및 End로 `scrollTop=1146`, PageDown으로949px 이동했다. 키 입력 뒤 native scroll이 끝난 값을 사용했다.
- 12개 화면 × Light/Dark의24개 캡처, 핵심4개 화면 × 6폭 × 2테마의48개 DOM 측정에서 가로 overflow는0건이었다. 별도 live resize 1920→1100→960→1440에서264→64→64→264px, 수동 localStorage 값 `false` 유지. 수동 `true` 설정 역시 reload/좁힘/복귀 후 유지했다.
- native Select 외곽은36px·radius8px이며 invalid/disabled/focus 기능을 유지한다. 공통 관리 탭 안 불필요한 세로 scroll owner는0개였다.
- Viewer fixture에서 관리 메뉴 없음, `/api/serviceaccounts/search`와 `/api/users`는403. stale Admin UI의 org 저장도 실제 권한을 내린 뒤403으로 거부되고 백엔드 이름이 바뀌지 않았다.
- 토큰 원문은 생성 여부만 boolean으로 확인했고 로그·스크린샷·보고서에 저장하지 않았다. 만료 metadata와 삭제 후0개, 계정 삭제 후404만 기록했다.

### 테스트와 빌드

- 관련 Jest **33 suites / 175 tests 통과**. 사용자·조직·서비스 계정·팀·data source·plugin·correlations·navigation 및 공통 modal/nav reducer를 포함한다.
- 변경 TS/TSX 파일의 일반 ESLint **오류0·경고0**. Betterer와 같은 강화 규칙을 작업 전 파일과 비교한 신규 위반0개.
- full TypeScript는 기존205개 진단으로 실패하며 작업 전후 진단의 파일/위치/코드가 동일하다. 신규0개. 의존성 버전이나 baseline을 낮추지 않았다.
- full `betterer --strict --workers false`는 기존 WallDashboardLibrary/visualizations/workspace 등 미해결 이슈 때문에 실패한다. 마지막 실행의 better eslint 잔여3,873개, story/gf-form 검사는 기존 상태 유지. `.betterer.results`는 작업 전 바이트와 동일하다.
- 격리 source snapshot의 production webpack 빌드 성공. 기존 크기 경고2개와 오래된 Browserslist 안내를 기록했고 의존성은 변경하지 않았다. 백엔드는 새로 빌드하지 않고 현재 정상 동작하는 동일 binary를 재사용한다.

### 명시적 미검증과 환경 제한

- Ego에서 별도 `wall-enterprise-qa.localhost:3342` origin의 native 확대 단축키를 시험했지만 실제 width/DPR 변화가 없었다. **실제 브라우저 Zoom은 NOT VERIFIED**이며, 이를 검증했다고 보고하지 않는다. 대신768~1920px의 실제 viewport와 live resize를 검증했다. Firefox·터치 하드웨어도 미검증이다.
- 라이선스 RBAC/Team Sync, 서드파티 전체 설정/설치, 인증서·실제 자격증명 교체는 미검증이다. native feature flag·권한·복잡한 picker와 API를 보존하며 가짜 메뉴를 만들지 않았다.
- source-owned Prometheus/Loki/MySQL 설정 폼 및 plugin 원문은 기존 구현을 유지했다. 해당 영역까지 전부 shadcn/Base UI로 재작성했다고 표현하지 않는다.
- 구3317은 health200이지만 login500,3318은 응답 없음이라는 기존 환경 문제가 남아 있다. 이번 검증·반영 대상은3334이며 두 launchd 서비스·설정·DB는 변경하지 않았다.

### 수정 경로

- `wall-modern/WallChrome.tsx`, `WallNavigation.tsx`, `useNavigationLayout.ts`, `application.css`, `managementNavigation.css` — 단일 탐색·계층·반응형 상태.
- `wall-modern/management/WallAdminPage.tsx`, `WallChoice.tsx`, `admin.css`, core `PageTabs.tsx` — 공통 실제 제목/리소스·탭·유한 선택 메뉴·컨트롤.
- `serviceaccounts/ServiceAccountPage.tsx`, `ServiceAccountsListPage.tsx`, `ServiceAccountCreatePage.tsx`, profile/role/token 컴포넌트, `ServiceAccountPermissions.tsx` — 서비스 계정 UI.
- core `AccessControl/Permissions.tsx`, `PermissionList.tsx`, `PermissionListItem.tsx` — 기존 처리의 opt-in presentation. 기본 caller 유지.
- `OrgDetailsPage.tsx`, `OrgProfile.tsx`, core `SharedPreferences.tsx`, `navModel.ts`, `ModalsContextProvider.tsx` — 설정과 실제 오류·취소 결함.
- `DataSourceTabPage.tsx`, `PluginDetailsPage.tsx`/`PluginDetailsBody.tsx`, `TeamPages.tsx`/`TeamSettings.tsx`/`TeamPermissions.tsx`/`CreateTeam.tsx`, correlation page/생성 폼 — 세부 화면 정합성.
- 관련 회귀 테스트와 `DESIGN_SYSTEM.md` REF-191. 전체 파일 목록·원시 검증 결과는 runtime validation에 보존한다.

### 변경 전후 화면

- [서비스 계정 변경 전](/tmp/wall-enterprise-evidence/service-detail-before.png), [변경 후](/tmp/wall-enterprise-evidence/service-detail-light-after.png)
- [조직 설정 변경 전](/tmp/wall-enterprise-evidence/org-before.png), [변경 후](/tmp/wall-enterprise-evidence/org-light-after.png)
- [탐색 Light 펼침](/tmp/wall-enterprise-evidence/navigation-expanded-light.png), [Light 접힘](/tmp/wall-enterprise-evidence/navigation-collapsed-light.png), [Dark 펼침](/tmp/wall-enterprise-evidence/navigation-expanded-dark.png), [Dark 접힘](/tmp/wall-enterprise-evidence/navigation-collapsed-dark.png)
- [실제403 저장 오류](/tmp/wall-enterprise-evidence/org-permission-error-after.png), [Viewer 탐색](/tmp/wall-enterprise-evidence/viewer-navigation-after.png)
- [연결 성공](/tmp/wall-enterprise-evidence/datasource-save-success-after.png), [실제 연결 거부](/tmp/wall-enterprise-evidence/datasource-save-failure-after.png)

### 로컬3334 최종 반영 및 보존 확인

- 실행 경로: `~/Library/Application Support/ABLESTACK/WallPreview/coherent-enterprise-ui-final-20261113`. 기존 로컬3334 프로세스만 교체했다. 운영 서비스·3317/3318 launchd는 변경하지 않았다.
- Grafana **11.4.0-pre**, HEAD `44a833458bce1bc5190ca5c84caf7288ef3492e0`. 백엔드 SHA256 `d9931aa75168979a698f038be6921aaba5675e66b1aa701a19ac5805b9c65a24`는 기존과 동일하다. 프런트엔드 fingerprint는 `ccb322409c0eb2f845366a516a4ae4ccc807968ee9071cc6bb297d9af474abd6`이며 실제3334의 `/public/wall-build-info.json`과 일치한다.
- 실제 로컬 DB를 일관된 backup으로 복사했으며 QA DB를 반영하지 않았다. 반영 직전·직후 user3 / org_user3 / dashboard47 / data_source7 / alert_rule57 / org1 / migration_log709 / team0 / api_key3의 **전체 행 해시가 동일**하다. QA 계정0개, 신규 마이그레이션0개다. `/api/health`200, 실제 Wall Prometheus 연결 `OK`.
- Ego의 실제3334에서 조직 설정·기존 서비스계정 Admin·사용자 목록을 조회했다. 실제 제목·3개 메뉴 구획·동일 빌드·가로 overflow 없음 확인. 다른 사용자 탭은 강제 갱신하지 않았고 이전 자산도 보존했다.
- 종합 대시보드도 읽기 전용으로 열어 제목·차트 렌더링·카테고리 하위 탐색을 확인했다. 일부 패널에는 조회 오류가 표시되어 **대시보드 전체 데이터 정상으로 판정하지 않는다**. 이번 작업에서 해당 쿼리·저장 모델·데이터소스를 변경하지 않았으며 조회 오류의 원인 분류는 별도 확인 대상이다.
- 최종8개 기본 화면 Light/Dark 방문16회에서 수집된 `Runtime.exceptionThrown`은0개다. 별도의 console.debug 관측으로 CDP 이벤트 구조와 수집 동작을 확인했다. 네트워크 오류나 모든 기능의 무오류를 의미하지 않는다.
- 작업 전78개 파일 중61개는 바이트 동일, 요청 범위의17개는 기존 변경 위에 개선했다. 삭제0개, 기존 Git index 그대로다. Netdive·기존 Go 변경·Betterer baseline은 동일하며 commit/push는 수행하지 않았다. 이번 작업 파일은 총44개이며 상세 목록은 검증 디렉터리의 `changed-files.json`에 보존한다.
- 테스트용3342 프로세스를 종료하고 임시 로그인 비밀을 삭제했다. 원래3334 실행 경로는 rollback 용도로 보존한다.

최종 화면: [로컬3334 조직 설정](/tmp/wall-enterprise-evidence/local3334-org-final.png), [기존 서비스 계정](/tmp/wall-enterprise-evidence/local3334-service-final.png), [사용자 목록](/tmp/wall-enterprise-evidence/local3334-users-final.png).

전체 캡처·DOM 측정·테스트 로그·작업 파일 목록·원시 보존 증거는 최종 runtime의 `validation/`에 보존한다. Ego 업데이트 알림은 확인했으나 브라우저 업그레이드는 수행하지 않았다.
