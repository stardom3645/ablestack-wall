# Wall–Netdive VM 연동 1차 개발

Wall 기준 `db802e4218`에서 `codex/wall-netdive-vm` 별도 worktree로 구현했다. Netdive UI `3e4c9d4`와 Analyzer `1a20064f`의 실제 코드를 계약으로 사용했다. 운영 DB·대시보드 배포·서비스 재시작·Grafana/플러그인 버전 변경은 하지 않았다.

## 실제 구조와 구현

Wall은 Grafana 11.4.0-pre 기반 React/Scenes 앱이다. 기존 QueryVariable·SceneTimeRange·DashboardLink/getLinkSrv·Datasource proxy를 재사용하며 native 패널·쿼리 runner·Data Link·Panel Link는 수정하지 않았다. 기존 Mold 연동은 monitor의 SQL `vm_instance.instance_name` 변수와 대시보드 JSON/포털 링크를 포함하며, 실제 사용자 VM 템플릿에는 별도의 Prometheus UUID 변수가 있다.

현재 소스와 실제 3334 화면의 Primary Rail에는 Netdive 항목이 없었다. 기존 일반 Netdive 진입은 일부 대시보드의 Dashboard Link와 공통 Toolbar에 있었다. 기존 링크·변수·패널·클릭 동작을 보존했다. 새로운 VM 컨트롤은 패널마다 추가하지 않고 기존 공통 Dashboard Toolbar에 한 번 표시한다.

- `netdive.ts`: 실제 `label_values(libvirt_domain_info_meta{정적 조건},uuid)` QueryVariable만 인식한다. 변수 이름은 고정하지 않는다. 단일 UUID·완료된 변수·동일 UUID에 대응하는 domain 변수가 있는 경우 그 값도 대조한다. SQL/이름/IP/Custom 변수나 동적 selector는 자동 연결하지 않는다.
- `WallNetdiveVMControl`: 사용자가 관계 탐색을 열 때만 현재 조직의 기존 Prometheus proxy로 해당 UUID의 실제 메트릭을 조회한다. dashboard의 정적 selector를 보존하며 UUID·domain·exporter instance가 유일해야 링크를 제공한다. 현재 Wall 메트릭에서 확인할 수 없는 Netdive graph 중복은 수신 Netdive가 최종 차단한다. UP 레코드를 임의 우선하지 않는다.
- 검증 중·All/복수·오류·미수집·중복·선택 domain 불일치는 안내하고 링크를 제공하지 않는다. 선택/조직/대시보드 변경 시 이전 링크를 즉시 무효화하고 요청 구독을 해제하며 12초 timeout을 둔다. 시간 변경은 새 링크 문맥에 반영한다.
- URL은 기존 native DashboardLink로 만들어 `getLinkSrv().getAnchorInfo`를 사용한다. 새 탭/`noopener noreferrer`, `includeVars=false`, `keepTime=false`이며 필요한 문맥만 명시한다. 토큰·쿠키·Mold 비밀정보·임의 return URL은 전달하지 않는다. Wall datasource 권한과 Netdive 세션/RBAC는 각각 유지한다.

## URL 설정

이 소스에는 재사용 가능한 중앙 Netdive URL 설정이 없었다. 하드코딩된 환경 주소나 현재 hostname에서 포트를 추정하지 않았다.

1. 기존 Netdive Dashboard Link가 있으면 그 목적지의 검증 가능한 UI base를 재사용한다. 원래 링크 자체는 바꾸지 않는다.
2. 새 중앙 설정은 기존 `public/ablestack-release.json` 배포 패턴을 따라 선택적인 정적 `public/ablestack-netdive.json`을 읽는다. 새 backend API가 아니다. 예시는 `public/ablestack-netdive.example.json`이다.
3. 중앙 설정이 유효하면 기존 `PrimaryItem`으로 Primary Rail에 일반 Netdive 진입을 **한 번** 제공한다. 설정이 없으면 새 Rail 항목을 표시하지 않는다. 기존 Toolbar 일반 링크는 별도 사용자 링크로 그대로 보존한다.
4. 중앙 URL과 기존 Netdive 링크들의 base가 충돌하면 객체 연결을 차단한다. 일반 사용자 링크는 삭제/교체하지 않는다. HTTP(S)·명시 UI 경로만 허용하며 credentials/query/hash를 중앙 설정에 넣을 수 없다.

```json
{ "version": 1, "netdiveURL": "http://netdive.example:8082/ui_v2/" }
```

예시 주소를 기본 운영 주소로 적용하지 않았다. 실제 배포 설정을 명시해야 하며 subpath는 기존 Grafana `appSubUrl`을 따른다. 설정은 페이지 로드마다 한 번 읽고 공유하며 없는 파일/잘못된 설정은 비활성 상태다. 기존 프로토콜·포트·배포 정책을 유지한다. monitor의 `configSkydiveLink`에는 기존 URL을 HTTPS로 바꾸는 코드가 있으나 실행·변경하지 않았다.

## 확인한 Netdive 계약

```text
/ui_v2/?ndv=1&ndKind=vm&ndID=<libvirt VM UUID>
  &from=<epoch milliseconds>&to=<epoch milliseconds>
  &wallDashboard=<실제 dashboard UID>&wallOrg=<현재 org ID>
```

Netdive는 같은 Analyzer origin의 기존 세션 접근을 확인하고 authoritative SyncReply 후 canonical 그래프에서 VM UUID를 해석한다. 유일한 객체이면 기존 1-hop Explorer와 상세 패널을 연다. 잘못된 UUID·미존재·중복·권한 실패는 명시 상태이며 다른 객체로 대체하지 않는다. 로그인 상대 복귀 경로, 브라우저 새로고침, 전체 보기 진입을 지원한다. `wallOrg`는 권한 증명이 아니며 Wall 복귀 catalog의 검증된 orgId와 대조된다.

선택 시간은 Wall 메트릭 복귀 문맥이며 과거 관계 데이터 조회가 아니다. Netdive는 `wallPanel`도 지원하지만 이번 Dashboard 단위 동작에는 임의 panel ID를 전달하지 않는다. hop/filter 전체 상태나 임의 Wall 화면 URL을 직렬화하지 않는다.

역방향은 이미 구현된 인증 API `GET /api/wall/navigation?vmUUID=...`가 실제 Wall 조직·dashboard UID·UUID 변수·메트릭을 확인한 경우만 가능하다. 임의 URL, Netdive 토큰을 Wall 토큰으로 사용하거나 조직을 우회하는 동작을 추가하지 않았다.

## 검증 결과 — 2026-11-12

원본 3334 runtime DB를 read-only SQLite backup으로 복사한 격리 QA를 사용했다. QA는 다른 포트·전용 로그인 쿠키·별도 DB/정적 자산을 사용하고 경보 평가/발송은 비활성화했다. Grafana native 11.4.0-pre 기존 binary(`4dad0b48…`)에 새 production frontend를 연결했으며, 새 backend 전체 빌드/배포라고 보고하지 않는다. 기존 사용자 탭은 갱신하지 않았다. 실제 사용자 VM export 복사본과 실제 Prometheus를 QA DB에만 추가했다. 검증 후 자체 프로세스와 ego-browser TaskSpace를 종료했다.

| 항목                                      | 결과                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 실제 Wall 메트릭 → 현재 Netdive VM 그래프 | 123건 중 122 유일 / 1 중복 / 0 미존재. Wall 현재 메트릭 identity는 123건 모두 유일했지만 graph 중복 1건은 Netdive에서 차단                           |
| Wall VM → Netdive 새 탭                   | 실제 선택 VM, 1-hop 3개 객체, 기존 상세 패널 확인                                                                                                    |
| 중복 graph UUID                           | `ambiguous`, Explorer 없음, 선택 0 확인                                                                                                              |
| 전체 선택 / 잘못된 UUID / 미존재          | 안내 또는 invalid/not-found, 다른 객체로 대체하지 않음                                                                                               |
| 일반 Rail 진입                            | 객체 링크/Explorer 없이 기존 전체 보기                                                                                                               |
| 이름/SQL 기반 기존 VM 화면                | 새 객체 동작 없음, 기존 일반 Netdive 링크 유지                                                                                                       |
| 새로고침                                  | 같은 객체를 다시 검증해 1-hop 복원                                                                                                                   |
| 기존 사용자 Dashboard Link                | 원래 링크 및 새 탭 목적지 유지                                                                                                                       |
| 메트릭·테마·패널                          | 실제 CPU/메모리/트래픽 표시 및 기존 공통 UI 확인. 패널·데이터·시각화 소스/JSON 미수정                                                                |
| 원본 DB                                   | dashboard 47 / datasource 7 / alert_rule 57 / org 1의 전체 레코드 hash 전후 동일                                                                     |
| Jest                                      | 기존 관련 5 suites 42개 통과 → 7 suites 55개 통과, 신규 실패 0. native LinkSrv·DashboardLinksControls·AlertLabels 포함                               |
| ESLint                                    | 변경 TS/TSX 통과                                                                                                                                     |
| Production frontend build                 | 통과, 기존 webpack asset/entrypoint 크기 경고 2개. 처음 worktree에 빠진 package-local node_modules는 기존 설치를 연결해 해결, install/lock 변경 없음 |
| 전체 TypeScript                           | **통과 아님.** 동일 worktree/의존성의 기준 소스와 변경 소스 모두 기존 208개 진단, 신규 0. shared React/플러그인 타입 부채는 별도                     |
| 역방향 현재 환경                          | 현재 Analyzer에 API 미배포(404) 안내 확인. 이번 Wall 환경 왕복 성공으로 계산하지 않음                                                                |

기존 Netdive의 14개 실패와 Wall의 테스트/TypeScript 부채는 서로 다른 저장소의 결과다. 이번에는 Netdive·Analyzer 소스를 변경하지 않았다. AlertLabels 회귀와 원본 rule 보존은 실제 경보 평가/발송이나 로그 스트림 성공을 의미하지 않는다. 전체 Grafana test suite와 고객 인증/OAuth/SSO·실제 운영 배포는 미검증이다.

측정 요약은 `docs/measurements/wall-netdive-vm-2026-11-12.json`에 기록했다. 로컬 evidence에는 실제 화면 `wall-vm-ready.png`, `netdive-entry.png`, `wall-all-blocked.png`, `netdive-duplicate-blocked.png`, `netdive-missing.png`와 원본 로그가 있다. UUID/주소가 포함된 QA 원본은 커밋하지 않았다.

## 남은 의존성과 Netdive 전달 사항

| 우선순위   | 대상                | 필요한 작업                                                                                                                                                                                                                                  |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 운영 전 | 역방향              | Analyzer `1a20064f`와 UI `3e4c9d4` 배포 확인. 기존 Wall 인증서가 Go 기본 TLS 검증에 실패한 문제는 유효한 인증서/신뢰로 해결. 검증 끄기·포트 전환 없음                                                                                        |
| P1         | Wall 보호 API       | 현 Netdive catalog는 anonymous-readable 조직 범위다. 보호된 조직은 별도 최소 권한 인증 위임 계약 필요. 현재 조직 ID 전달을 인증으로 취급하지 않음                                                                                            |
| P1         | VM 기존 관리자 화면 | 기존 monitor/admin 템플릿은 instance_name SQL 변수다. 실제 Mold UUID·수집 UUID의 검증된 전달 경로를 먼저 추가해야 한다. 이번에 변수/SQL/대시보드를 임의 변경하지 않음                                                                        |
| P1         | Host                | Wall Host 변수는 exporter instance, Mold Host ID와 Netdive agent의 권위 있는 매핑이 부족. 이름/IP 자동 연결 금지                                                                                                                             |
| P1         | Kubernetes          | Mold cluster ID, kube-system incarnation UID, 객체 UID의 scoped 계약 필요. 기존 23 Node–VM 매칭은 모든 Pod/Cluster Wall label 계약을 대체하지 않음. raw UID clone 충돌은 Netdive backend 후속                                                |
| P1         | 경보                | monitor VM 규칙은 domain, Host 규칙은 instance 중심이며 4개 template 모두 UUID 없음. 실제 개별 metric series의 식별 label을 보존해야 하며 집계 규칙에는 단일 객체 링크를 붙이지 않음. UUID join의 cardinality·NoData·임계치 의미를 먼저 검증 |
| P2         | 테스트 부채         | Wall 공유 타입 진단 208개를 별도 정리하고 전체 release gate와 역할별 운영 왕복 검증 필요                                                                                                                                                     |

Netdive에는 v1 계약 유지, graph 중복 최종 차단 유지, API 배포/인증서·조직별 인증 범위 확인을 전달해야 한다. 현재 Wall은 Graph 전체를 별도 조회하지 않으므로 Wall 메트릭 유일성을 Netdive 객체 유일성의 보장으로 설명하면 안 된다.

## 배포 준비와 롤백

이번 변경은 code/config 준비이며 운영 반영은 별도 승인 후 진행한다. 새 frontend artifact와 실제 Netdive URL의 정적 설정을 함께 준비한다. 기존 UUID query dashboard는 JSON 수정 없이 지원하며 이름/SQL 기반 dashboard에는 기능을 강제하지 않는다. 객체 진입에는 Netdive UI가 필요하고 역방향은 Analyzer API와 Wall 신뢰/권한 조건까지 충족해야 한다.

배포 전에는 현재 frontend artifact·설정 파일을 보관하고 별도 계정/조직에서 일반 진입·UUID·중복·권한·시간을 확인한다. UI는 기존 artifact로 되돌리고 새 정적 설정을 제거/복원하면 롤백된다. 기존 사용자 대시보드·메뉴 링크·DB schema는 변경하지 않았으므로 DB 되돌리기는 필요하지 않다. 운영 서비스 재시작·대시보드 배포는 이 작업에서 수행하지 않았다.
