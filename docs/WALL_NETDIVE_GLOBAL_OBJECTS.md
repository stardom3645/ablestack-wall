# Wall 4-B 전역 객체 연계 — REF-183 (2026-11-12)

## A. 기존 구현 및 계약

Wall `codex/wall-modern-lite` HEAD44a833458b 작업본. 기존 변수 캐시 수정·회귀 테스트·Footer 작업은 보존한다.

기존 경로는 `netdive.ts`, `useNetdiveURL.ts`, `toolbar/WallNetdiveVMControl.tsx`, `WallNavigation.tsx`이다. Netdive UI HEAD3e4c9d4의 `ExternalObjectNavigation.ts`와 `WallNavigationAPI.ts`를 읽었다. Analyzer 현재 HEAD6c5bedf0 및 UI의 기존 dist 변경 상태는 읽기만 했다.

실제 허용 계약:

| ndKind     | ndID                 | 추가 문맥                                                               |
| ---------- | -------------------- | ----------------------------------------------------------------------- |
| vm         | 실제 libvirt VM UUID | 기존 UUID 방식                                                          |
| graph      | 실제 수집 node.id    | Mold Host ID/IP/이름으로 대체 불가                                      |
| kubernetes | 실제 수집 객체 UID   | ndClusterUID는 kube-system Namespace UID. Mold cluster ID나 이름이 아님 |

`ndv=1`, from/to는 기존 SceneTimeRange의 절대 Unix 밀리초, wallDashboard와 wallOrg는 실제 대시보드·조직이다. 새 host/node/pod 종류는 만들지 않았다. Netdive의 세션/RBAC/중복·클러스터 범위 검증을 우회하지 않는다. URL에 토큰/비밀번호/임의 return URL은 없으며 새 탭은 noopener/noreferrer다.

설치 `public/ablestack-netdive.json`을 Rail/객체 링크의 단일 기준으로 사용한다. 설정 로딩 중에는 옛 URL을 열지 않는다. 설정 파일404일 때만 기존 dashboard URL fallback을 허용하고, 오류/잘못된 설정이면 다른 사이트로 fallback하지 않는다. 설치 설정이 있으면 generic 전체 실행은 Rail에만 표시한다. 사용자 문맥 링크와 기존 Dashboard/Panel/Data Link, 저장된 JSON은 유지한다.

## B. 적용 범위

로컬 DB의 47개 대시보드와 native 관리/경보 화면 소스를 조사했다. 일반 대시보드별 원본 쿼리·필드 조사는 문서 끝의 목록과 로컬 검증 자료에 기록한다. 새 Kubernetes/Resource Explorer 화면은 만들지 않는다.

| 화면                                | 객체       | 연계 방식              | 상태             | 비고                                                                               |
| ----------------------------------- | ---------- | ---------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| Primary Rail                        | 전체       | 기존 외부 링크         | 기존 기능 재사용 | 설치 URL로 일반 탐색 1개                                                           |
| uservm                              | VM         | UUID 검증·공통 Toolbar | 기존 기능 재사용 | 명시 UUID 변수/실제 메트릭 검증                                                    |
| 08. 사용자 가상머신 별 상세         | VM         | 토폴로지 보기          | 구현 완료        | 기존 비집계 identity 쿼리의 단일 domain을 실제 UUID로 검증                         |
| 32. 유저 가상머신 상세 보고서       | VM         | 동일 공통 Toolbar      | 구현 완료        | 원래 SQL 변수·메트릭·쿼리는 유지                                                   |
| Host 종합/상세/장치/예측            | Host       | 자동 연결 제외         | 식별자 부족      | IP/instance만 있고 실제 Netdive node.id 없음                                       |
| 07. VM 목록·시리즈                  | VM         | 자동 연결 제외         | 식별자 부족      | 현재 join/group_left에 VM UUID 없음. domain/표시명/볼륨 UUID로 추정하지 않음       |
| 10. VM 예측                         | VM         | 자동 연결 제외         | 식별자 부족      | 검증 근거가 되는 기존 identity 쿼리 패널 없음                                      |
| 05/06 시스템 VM·스토리지·네트워크   | 자원       | 기존 패널/링크 유지    | 식별자 부족      | IP·Ceph 이름·장치 ID와 Netdive ID의 검증된 연결 없음                               |
| Cluster/Node/Pod/Workload/Container | Kubernetes | 신규 화면 없음         | 검증 불가        | 현재 Wall에 해당 전용 화면 및 scope/객체 UID 없음. builder의 수신 계약만 단위 검증 |
| native 경보 목록/상세               | Alert      | 기존 화면 유지         | 식별자 부족      | 저장된 57개 규칙 label key는 kind. 단일 객체 ID 없음. 런타임 instance 매핑 미검증  |
| 집계 KPI/평균/로그/보고서           | 집계       | 자동 연결 제외         | 기존 기능 재사용 | 임의 대표 객체를 선택하지 않음                                                     |

## C. 수정 파일

- `public/app/features/wall-modern/netdive.ts`: URL 우선순위/generic launcher 구분, 기존 identity 쿼리의 단일 선택·실제 UUID 검증, 실제 수신 종류만 허용하는 공통 builder.
- `public/app/features/wall-modern/useNetdiveURL.ts`: 설정 완료와 fallback 허용 여부 공유. Rail의 기존 hook API 유지.
- `public/app/features/wall-modern/toolbar/WallNetdiveVMControl.tsx`: 기존 SceneQueryRunner 정의를 읽고 intent 후 UUID 검증. stale 응답 해제/12초 timeout/권한 실패 차단/기존 native link 유지.
- `public/app/features/wall-modern/toolbar/WallDashboardToolbar.tsx`: generic 전체 실행 중복 제거, 사용자/문맥 링크 및 DashboardLinksControls 유지.
- `netdive.test.ts` 및 두 Toolbar 테스트: 계약/모호성/SQL-domain→실제 UUID/원래 링크 불변/설정 대기·실패 회귀.
- `DESIGN_SYSTEM.md` REF183 및 본 문서: 실제 범위와 제약 기록.

추가 조회는 intent 후 identity 검증용이며, 원래 메트릭 쿼리·DB·Dashboard JSON·시계열·범례·59개 렌더러를 수정하지 않는다. 기존 REF182의 webpack 캐시/combobox 회귀 변경도 보존한다.

## D. 기능 검증

| 번호 | 항목               | 결과       | 실제 범위                                                                            |
| ---- | ------------------ | ---------- | ------------------------------------------------------------------------------------ |
| 01   | Rail 전체 실행     | PASS       | 실제3334 Rail 클릭 → /ui_v2/ 새 탭, 객체 파라미터/안내 없음                          |
| 02   | 기존 UUID VM       | PASS       | 실제 uservm→Netdive 같은 UUID                                                        |
| 03   | VM 토폴로지 보기   | PASS       | QA3342의 08 실제 i-2-17-VM→UUID1fdd690d-b0ca-45bf-9088-8534e409b866                  |
| 04   | 1-hop/상세         | PASS       | R10-Sparse-Clone3, 객체3·관계4와 상세 UUID                                           |
| 05   | Host 상세          | NOT TESTED | ID 계약 부족으로 링크 없음. 잘못된 액션0개는 브라우저 확인                           |
| 06   | Host 목록          | NOT TESTED | 실제 graph ID 없어 행 링크 미생성                                                    |
| 07   | K8s Cluster/Node   | NOT TESTED | 실제 Wall 화면/UID/클러스터 근거 없음                                                |
| 08   | K8s Pod            | NOT TESTED | 동명 Pod/복수 클러스터 실제 Wall 화면 없음. 수신부 범위 검증 소스 확인               |
| 09   | All/Multi          | PASS(unit) | UUID/domain 경로 차단. 실제 VM 대시보드 All/Multi 브라우저 재현은 미검증             |
| 10   | ID 누락            | PASS       | 정지 VM i-2-7-VM 메트릭 없음→링크 없음. 중복/불일치는 단위 검증                      |
| 11   | 시간/대시보드/조직 | PASS       | 실제 from/to 밀리초·wallOrg1·08 UID. 32 보고서도 자체 UID 전달                       |
| 12   | Netdive→Wall       | FAIL       | Wall 메트릭 클릭→기존 /api/wall/navigation 미배포404 안내                            |
| 13   | 메트릭 렌더링      | PASS(대표) | uservm/08 실제 VM 값·차트. 전체47개 브라우저 검증 아님                               |
| 14   | 조회/필터          | PASS(대표) | 기존 변수/runner/proxy/필터 테스트. 실제 선택 VM 변경                                |
| 15   | 중복/레이아웃      | PASS(대표) | QA08 Rail1/일반 Toolbar0/객체 액션1, CSS 변경 없음                                   |
| 16   | ID 부족/미지원     | PASS       | Host/집계에 자동 객체 버튼 없음. 빈/잘못된 ID 단위 차단                              |
| 17   | URL 정책           | PASS       | 기존 저장 HTTPS URL과 현재 설치 URL이 달라도 중앙 설정 사용. 운영 주소 하드코딩 없음 |

초기 7 suites67tests/ESLint/Betterer 통과, production 빌드 성공(기존 크기 경고2), UI Context1개·다른 worktree UI source0 확인. 최종 재검증은 후속 기록을 따른다. 전체 TypeScript는 baseline208/수정본206진단으로 실패하며 정규화한 파일·진단 코드 비교에서 신규0/수정 파일 진단0이다. 전체 TS 통과로 보고하지 않는다.

## E. 남은 문제와 담당

검증 가능한 VM 상세/보고서와 URL·공통 계약 정리가 완료 범위다. Host/Kubernetes/목록/경보의 전역 객체 연계 전체가 완성됐다고 판단하지 않는다.

Netdive 담당에게 전달할 작업:

1. 기존 인증된 `/api/wall/navigation?vmUUID=<실제 UUID>`의 로컬8082 배포를 확인한다. 재현: Wall VM→Netdive 동일 VM→Wall 메트릭 클릭→API404 안내. 기존 org/catalog/권한 검증을 사용해 배포 후 왕복 검증한다. Wall에서 임의 return URL로 우회하지 않는다.
2. Mold Host ID→실제 graph node.id를 조직·사이트 범위에서 유일하게 확인하는 매핑 근거와 사용할 기존 인증/API 계약을 확정한다. IP/이름 대체 금지. 이번에 새 URL/API 규격은 생성하지 않았다.
3. K8s는 실제 Wall 화면에 object UID와 kube-system Namespace UID를 같은 클러스터 범위로 제공할 계약이 필요하다. Mold cluster ID/이름과 incarnation UID를 구분하고 재생성·중복·권한 거부 사례를 제공한다.

Wall 후속 조건:

- 실제 ID/화면이 제공되면 공통 builder와 기존 헤더/행 Data Link로 연결한다. 현재 UUID 없는 테이블·집계 시리즈의 쿼리/Transform/JSON을 자동 변경하지 않는다.
- 실제 alert instance가 단일 객체 ID를 제공하는 경우에만 관계를 검증한다. title/kind/instance IP로 객체를 추정하지 않는다.
- 운영 배포, Netdive 저장소 수정, 네트워크 변경, 신규 화면은 수행하지 않는다. 역할별/사이트별/다중 클러스터 통합 검증은 미완료다.

## 전체 일반 대시보드 조사 목록

| 제목                                | UID                 | 데이터 패널 수 | 적용 판정        |
| ----------------------------------- | ------------------- | -------------- | ---------------- |
| 01. 종합 대시보드                   | `fec03giqwtw5cf`    | 23             | 식별자 부족      |
| 02. 호스트 종합 현황                | `aec03sr91pfk0f`    | 13             | 식별자 부족      |
| 03. 호스트 상세 현황                | `eec03wg41s35sa`    | 54             | 식별자 부족      |
| 04. 호스트 장치 정보 현황           | `aez0lcjg2i5tsf232` | 21             | 식별자 부족      |
| 05. 스토리지센터 가상머신 상세 현황 | `aec03x1adsi68f`    | 59             | 식별자 부족      |
| 06. 클라우드센터 가상머신 상세 현황 | `aec03xkh27s3kf`    | 48             | 식별자 부족      |
| 07. 사용자 가상머신 종합 현황       | `fec03xz3etj40e`    | 9              | 식별자 부족      |
| 08. 사용자 가상머신 별 상세 현황    | `cec03ydxllt6of`    | 28             | 구현 완료        |
| 09. 호스트 자원 사용량 추이 예측    | `dec03yu94q134c`    | 13             | 식별자 부족      |
| 10. 가상머신 자원 사용량 추이 예측  | `eec03zcj2h7uob`    | 9              | 식별자 부족      |
| 11. 종합 로그 현황                  | `fec0459ca1ypsc`    | 6              | 식별자 부족      |
| 12. 핵심 운영 모니터링 대시보드     | `aevqaoeukd0jkf`    | 11             | 식별자 부족      |
| 21. 종합 Alert 대시보드             | `cec0401ywqzuoa`    | 6              | 식별자 부족      |
| 22. 세부 Alert 대시보드             | `dec041amqw4cge`    | 56             | 식별자 부족      |
| 31. 클러스터 상태 보고서            | `fec04uh7zzapsf`    | 23             | 식별자 부족      |
| 32. 유저 가상머신 상세 보고서       | `eec04uyimo5j4a`    | 24             | 구현 완료        |
| Alert Rule                          | `fe4ec9efgaakgc`    | 0              | 검증 불가        |
| Report                              | `ee79hcncm13wge`    | 0              | 검증 불가        |
| admin                               | `aerd4v9a11ywwd`    | 0              | 검증 불가        |
| viewer                              | `besru2u7sm2v4d`    | 0              | 검증 불가        |
| 가상머신 상세 현황                  | `uservm`            | 28             | 기존 기능 재사용 |
| 호스트 상세 현황                    | `Q3Jkjf54zs`        | 54             | 식별자 부족      |
| 호스트 종합 현황                    | `fasdasdasdw`       | 13             | 식별자 부족      |

일반/기존 23개, QA 24개다. 31번 클러스터 보고서는 인프라 집계이며 Kubernetes 클러스터 상세 화면으로 간주하지 않는다. 패널 수는 native 중첩 panels를 재귀적으로 읽은 데이터 패널 수이며 05번은 기존59개를 보존한다.

## 최종 로컬 반영 결과

7 suites68tests, ESLint, Betterer 통과. 최종 production build는 기존 크기 경고2로 성공했다. 전체 TypeScript는 기존206진단/수정 파일0으로 실패 상태를 유지하며 신규 오류를 추가하지 않았다.

로컬3334는 `coherent-netdive-4b-20261112`의 기존11.4.0-pre/44a833458b backend와 별도 fingerprint로 기록한 frontend 작업본을 사용한다. 기존 실행본은 원복용으로 보관하고 기존 hashed lazy chunk도 유지했다. 기존 사용자 탭은 강제 갱신하지 않았다. 격리 QA3342는 종료했다. 대시보드/데이터소스/경보규칙/조직 행 hash가 이전 실행본과 동일하다. 운영 DB/서비스/네트워크 및 Netdive UI/Analyzer 저장소는 수정하지 않았다.

Ego 실기: 실제3334의 08 VM 선택→검증 링크, Rail 전체 실행 새 탭(객체 파라미터 없음), UUID·org·시간·대시보드 전달, 동일 VM의1-hop/상세를 확인했다. generic Rail1/Toolbar0/객체 액션1이며 Dark와 REF182의 embedded variable popup도 정상이다. 32 보고서와 ID 없는 정지 VM/Host 액션 차단은 같은 빌드의 격리 QA에서 검증했다. Test12 역방향 API404는 남아 있으며 왕복 완료로 보고하지 않는다.

로컬 증거: `WallPreview/global-4b-20261112/verification.json`, `wall-08-after.png`, `netdive-vm-after.png`, 빌드/정적검사 로그.
