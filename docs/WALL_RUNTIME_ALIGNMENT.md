# Wall 개발 런타임 정합성 복구 — REF-140

조사·복구일: 2026-11-06 (KST).

## 1. 결론과 사용 주소

**현재 소스에서 프론트엔드와 백엔드를 함께 빌드한 격리 개발 환경은 `http://localhost:3320/`이다.**

기존 3317/3318 서비스, 원본 DB, 바이너리, 인증 설정, 사용자 탭은 교체하거나 재시작하지 않았다. 새 서비스는 SQLite Online Backup API로 만든 DB 복사본만 사용한다. 두 DB는 독립적이며 한쪽에서 저장한 변경이 다른 쪽에 자동 반영되지 않는다.

REF-138의 `/api/health=9.2.0` 관찰은 맞았지만, 이를 **공식 Grafana 9.2 백엔드가 실행 중이라는 증거로 해석한 부분은 정정한다.** 실행 파일은 11.4.0-pre 소스 계열의 오래된 개발 빌드이며 버전 메타데이터 주입이 누락된 상태였다. 이전 빌드의 정확한 미커밋 내용까지 복원할 출처 기록은 없어 현재 소스와 완전히 같다고 단정하지 않았다.

## 2. 기존 실행 경로 확인

| 조사 항목        | 확인 결과                                                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3317 listener    | PID1407, `/tmp/wall-modern-lite-runtime/grafana-source server ...`. 조사 시작부터 완료까지 같은 프로세스 유지.                                                                                                                                                                                              |
| 실행 파일        | arm64 Mach-O, Go1.23.2, 수정 시각2026-10-26. SHA256 `04faf85274573cd11b62336cbca885de7d0217b2c5183447c962758fc506c409`.                                                                                                                                                                                     |
| launchd          | 사용자 서비스 `com.ablestack.wall-modern.preview`, `~/Library/LaunchAgents/com.ablestack.wall-modern.preview.plist`. 직접 이 바이너리를 실행하며 별도 reverse proxy 없음.                                                                                                                                   |
| home / 정적 파일 | `/Users/hongwookryu/repository/GitHub/stardom3645/ablestack-wall`, static root는 그 아래 `public`. 프론트엔드만 Worktree에서 빌드한 뒤 `public/build`를 이 경로에 복사해 왔다.                                                                                                                              |
| 실제 설정        | `~/Library/Application Support/ABLESTACK/WallPreview/grafana.ini`. 경로·HTTP/3317·익명Org Admin·기존 secret_key 등을 읽었고 값은 변경하거나 보고서에 노출하지 않았다.                                                                                                                                       |
| DB·플러그인      | `/tmp/wall-modern-lite-runtime/data/grafana.db`, plugins/provisioning은 같은 runtime 아래 설정. 조사 시 별도 플러그인·provisioning 디렉터리는 존재하지 않았다.                                                                                                                                              |
| health 전달      | 3317 listener 자체의 `pkg/api/http_server.go:apiHealthHandler`가 `Cfg.BuildVersion/BuildCommit`을 반환. 다른 Grafana로 proxy한 응답이 아님.                                                                                                                                                                 |
| 3318             | PID13249 Python fixture, 별도 `com.ablestack.wall-modern.fixture` 서비스. 일부 Prometheus/Loki 시험 데이터의 upstream이며 `/api/health`의 backend 대상이 아님. 현재 launchd가 참조하는 `/tmp/.../metrics-fixture.py`는 없어 재기동 가능성은 별도 제약이다. 이 서비스를 이번에 중단하거나 재설치하지 않았다. |
| 3319             | 별도 로컬 read relay. Wall→CCVM `10.10.22.10:3001`, Glue→`10.10.22.11:9095`. 기존 프로토콜·포트를 유지했다.                                                                                                                                                                                                 |

## 3. 원인 확정

1. `pkg/cmd/grafana/main.go`의 기본 `version`은 **9.2.0**, 기본 `commit`은 **NA**다.
2. 기존 실행 파일의 `go version -m`에는 `-tags=oss`, `vcs.revision=9e170f6c58a1057d70e9f8ce8a76045bf4893b54`, `vcs.modified=true`가 있지만 **`-ldflags` 버전·커밋 주입이 없다.**
3. 그 리비전의 `package.json`도 **11.4.0-pre**이며, 현재 HEAD와의 tracked backend/Go module 차이는 없다. conf의 Light 기본값 변경은 별도다. 이전 빌드의 dirty 파일 내용까지 같았다는 뜻은 아니다.
4. 공식 빌드 경로인 `build.go`→`pkg/build/cmd.go`는 루트 package.json에서 버전을 읽고 `main.version/commit/buildstamp/buildBranch`를 linker flag로 넣는다. 기존 파일은 이 메타데이터 주입을 우회한 직접 빌드의 특성을 갖는다. 누가 어느 셸 명령으로 만들었는지까지 확인했다고 주장하지 않는다.
5. `pkg/cmd/grafana-server/commands/buildinfo.go`는 BuildStamp가 없으면 **프로세스 시작 시각**을 넣는다. 기존 로그의 최신 `compiled=` 날짜가 최신 바이너리 빌드를 의미하지 않았던 이유다.

즉, **오래된 소스 리비전의 바이너리를 계속 재사용하면서 프론트엔드만 갱신했고, 그 바이너리의 기본 버전 상수가 9.2.0으로 노출된 것**이 원인이다. 버전 상수만 바꾸거나 공식 Grafana 바이너리를 다운로드해 교체하지 않았다.

## 4. 목표 소스와 실제 새 빌드

| 항목           | 복구 환경                                                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 소스           | `codex/wall-autodev-20261030`, HEAD `4dad0b48a235a8904be829c91fe0dd086a0a94a3` + 현재 미커밋 Wall 변경. HEAD 하나로 dirty 소스 전체를 대표하지 않으며 별도 지문을 기록했다.                                                               |
| 목표 버전      | 루트 package.json의 **11.4.0-pre**. 최신 공식 Grafana나13계열로 업그레이드하지 않음.                                                                                                                                                      |
| 준비           | Makefile의 `gen-go`와 같은 OSS Wire 생성. Worktree에는 ignored `pkg/server/wire_gen.go`가 없어 처음 직접 빌드가 `undefined: Initialize`로 실패했고, 현재 소스에서 생성한 뒤 빌드했다. 다른 checkout의 생성 파일을 복사해 사용하지 않았다. |
| 백엔드         | Go1.23.2 / darwin-arm64 / CGO1 / oss. 공식 빌드와 같은 버전·커밋·브랜치·시각 linker flags. 출력은 새 runtime의 `bin/grafana`로 한정.                                                                                                      |
| 프론트엔드     | 같은 작업 트리에서 production webpack 재빌드. 공유 node_modules가 다른 checkout의 로컬 패키지를 해석하지 않도록 UI/SQL/Prometheus alias를 현재 root에 고정했다.                                                                           |
| 빌드 연결 증거 | 빌드 전후 backend/frontend source SHA256이 같은지 검사하고 binary/asset SHA256·명령·HEAD·버전을 `build-input.json`에 기록. runtime에 복사한 assets가 실제 출력과 같은지 확인한 후 `wall-runtime.json` 생성.                               |
| 실제 제공 확인 | HTTP로 받은 assets-manifest와 실제 app JS 바이트가 snapshot 파일과 일치. `/public/wall-build-info.json`, `/api/frontend/settings`, `/api/health`도 동일 출처/버전/커밋을 확인. 문자열 일치만으로 통과시키지 않음.                         |

기록된 실제 지문:

- backend source: `125fa397011de70a828b39f474a3595fc556c900a3b5ea5f71914b5251727cf1`
- frontend source: `1a4b5a02620bba420f16c451268d24b6253c8a070fa465fe55b56614a688afbb`
- 새 backend binary: `046cc09c56e1af84b8ef817b7f005519f5dcb74b376df19496b9a3eece5b8fcf`

### Go의 Worktree 메타데이터 한계

이 호스트의 Go1.23.2 `cmd/go/internal/vcs/vcs.go`는 `.git` **디렉터리**를 인식하지만 linked Worktree의 `.git` **파일**을 인식하지 않는다. `-buildvcs=true`로 빌드해도 자동 `vcs.revision`이 없었다. 이를 새 바이너리의 자동 VCS stamp가 존재한다고 보고하지 않는다.

검사기는 일반 checkout에서 revision이 빠지거나, 존재하는 revision이 다르면 거부한다. linked Worktree 예외는 **실제 build 동작이 남긴 빌드 입력 기록·동일 source 지문·동일 artifact hash·명시적 linked commit**이 모두 맞을 때만 허용한다. 임의의 11.4 문자열을 넣은 파일을 사후 승인하는 방식과 구분한다.

## 5. 격리 구성과 DB 검증

Runtime:

`/Users/hongwookryu/Library/Application Support/ABLESTACK/WallPreview/coherent-20261106/`

- `bin/grafana`: 새 빌드. 기존 `/tmp/.../grafana-source`는 그대로다.
- `home/conf`, `home/public`: 동일 소스의 설정 기본값과 정적 snapshot.
- `grafana.ini`: 기존 설정의 복사본. auth/security 내용과 secret_key는 동일하며 경로·static root·시험 port만 분리했다.
- `data/grafana.db`: 원본을 read-only로 열고 SQLite Online Backup API로 복사. 실행 중인 WAL DB 파일을 단순 cp하지 않았다.
- `plugins`, `provisioning`, `logs`: 모두 새 runtime 안에 격리했다.
- 사용자 launchd **`com.ablestack.wall-modern.coherent`**: 검사기의 `run`을 통해 시작한다. source/artifact/config 불일치·보호된3317/3318/3319 port·runtime 밖 DB·GF 환경변수 경로/인증 override를 거부한다.

새 브라우저 주소는 **localhost**를 사용해 기존 **127.0.0.1** 탭의 쿠키와 분리했다. 포트만 다르게 하면 쿠키가 분리되지 않기 때문이다. 인증 정책·비밀번호·cookie name·secret key는 변경하지 않았다.

| DB 검증                 | 결과                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 원본 접근               | 기존 backend를 재시작하거나 새 backend를 원본 DB에 연결하지 않음.                     |
| 복사본 integrity_check  | ok                                                                                    |
| 시작 migration 로그     | **performed=0, skipped=610**                                                          |
| migration_log 행·스키마 | 시작 전후709행과 전체 schema SQL 동일.709행 수와 현재 등록된 skip610을 혼동하지 않음. |
| 보존 수                 | dashboard40, data_source7, user3, user_auth_token1                                    |
| 대표 JSON               | 종합·05·QA129·QA128의 dashboard JSON이 기존3317 API와 동일                            |

이번 복사본에는 새 스키마 전환이 없었다. 이 결과를 실제 Grafana9.2 고객 DB의11.4 업그레이드 검증으로 확대하지 않는다. 실제 운영 마이그레이션은 별도 승인·전체 백업·플러그인 및 경보 호환성 검증이 필요하다.

## 6. API·화면·테스트 결과

| 검증                       | 결과 및 범위                                                                                                                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| health / frontend settings | 200,11.4.0-pre, full commit4dad0b48…                                                                                                                                                                                                                                                                 |
| 실행 파일·출처 검사        | 새 실행 경로/버전/linked commit/실제 빌드 입력·source/artifact hashes 일치. Go 자동 VCS stamp는 위 한계대로 부재.                                                                                                                                                                                    |
| 대시보드                   | 대표4개 JSON 조회200·동일. QA129의4개 plot·20개 시리즈 범례 실제 렌더링.                                                                                                                                                                                                                             |
| Tooltip·Shared Crosshair   | Source Tooltip1개/20행·같은 Timestamp의 Crosshair4개, 이탈 정리. 서로 다른 차트 폭에 맞는 X 좌표로 표시.                                                                                                                                                                                             |
| 범례                       | Right20 scrollTop326/최대326, 기존 Last\*17.32% 표시.                                                                                                                                                                                                                                                |
| 데이터 소스·관리           | 목록7개200. 관리/데이터 소스/플러그인 화면 진입 확인. 서버 관리자 설정403은 기존 익명Org Admin과 동일한 접근 제한. 사용자/조직/권한 API200, 실제 서버 관리자 로그인 검증으로 확대하지 않음.                                                                                                          |
| backend query              | native TestData `csv_content` POST200, 실제 입력값1.25/2.5/3.75와 timestamp 그대로 반환. QA raw_frame은 frontend 처리이므로 별도 서버 조회 증거로 쓰지 않음.                                                                                                                                         |
| 실제 연결                  | Glue vector(1)200, 기존3318 fixture200. CCVM은 초기502 후 최종3317/3320 모두200으로 회복했다. 새 backend의 native Prometheus query API도 실제 CPU 시계열1frame/21포인트를200으로 반환했다. URL·저장쿼리·프로토콜을 변경하지 않았으며 초기 오류를 지속 장애로 보고하지 않는다.                        |
| 플러그인                   | 기존49개 중 누락 없음. native 기본 동작으로 `grafana-lokiexplore-app`1.0.10이 새 격리plugins에 자동 설치돼 API 목록50개. 기존3317 플러그인 경로는 변경 안 함.                                                                                                                                        |
| 로그인·세션                | 로그인 폼 표시, 복사된 token1개와 auth/security 설정 유지. 기존 사용자 쿠키는 건드리지 않음. 새 호스트의 Viewer 표시명은 쿠키를 공유하지 않는 익명 컨텍스트이며 기존 익명Org Admin 정책은 유지한다. **실제 비밀번호 로그인·토큰 갱신·서버 관리자 권한 실기는 자격증명을 임의 사용하지 않아 미검증.** |
| 검사기                     | 잘못된 버전·다른 revision·빌드 후 source 변경·asset 교체·원본DB 경로·환경override·기존port 차단 등9개 unit 통과.                                                                                                                                                                                     |
| native Go                  | `pkg/api`의 health API 검사와 `pkg/services/auth/authimpl` 테스트 통과. 전체 Go/프론트엔드 회귀 검사 통과를 의미하지 않음.                                                                                                                                                                           |
| webpack                    | 성공. bundle size 경고2개 및 오래된 Browserslist 데이터 경고는 남겨 두고 종속성을 임의 갱신하지 않음.                                                                                                                                                                                                |

### 발견했지만 이번에 바꾸지 않은 사항

- xychart 중복 등록 경고와 macOS `/proc` process-start 조회 오류가 남는다. 런타임 복구를 이유로 플러그인/메트릭 서비스 전체를 바꾸지 않았다.
- Infinity 데이터 소스 레코드는 있지만 플러그인이 없고 dummy URL을 사용한다. 레코드를 삭제하거나 플러그인을 임의 설치하지 않았다.
- 지원되지 않는 방식으로 raw_frame을 backend API에 직접 요청했을 때 nil handler500이 관찰됐다. 올바른 CSV 서버 시나리오는200이다. client-side Fixture 성공과 backend 조회 성공을 혼동하지 않으며 잘못된 시나리오의 예외 처리는 별도 과제다.
- 실비밀번호 로그인·실역할별 접근·OAuth·알림 발송·장시간 부하·고객 데이터 검증은 완료하지 않았다. 기존 RC gate도 별개다.

## 7. 재발 방지 및 재현 명령

추가 파일:

- `scripts/wall-preview-check.py`: build / record / check / run. 제품 로직이나 버전 상수를 변경하지 않는다.
- `scripts/webpack/webpack.wall-preview.cjs`: 기존 production config와 현재 checkout의 로컬 package alias.
- `scripts/tests/test_wall_preview_check.py`:9개 회귀 검사.
- Makefile `wall-preview-check`: 기존 개발 명령에서 검사기 접근.

현재 환경 확인:

```sh
make wall-preview-check \
  WALL_PREVIEW_RUNTIME="$HOME/Library/Application Support/ABLESTACK/WallPreview/coherent-20261106" \
  WALL_PREVIEW_URL=http://localhost:3320
```

새 소스로 갱신할 때는 다른 runtime 디렉터리를 선택한다. `build`는 기존 바이너리 덮어쓰기를 거부한다.

```sh
python3 scripts/wall-preview-check.py build --runtime "$WALL_PREVIEW_RUNTIME"
# 해당 디렉터리의 home/conf·home/public에 현재 소스 출력 복사
# 기존 설정 복사 → 경로와 loopback 시험 port만 분리
# 원본은 read-only로 열어 SQLite backup()으로 data/grafana.db 복사
python3 scripts/wall-preview-check.py record --runtime "$WALL_PREVIEW_RUNTIME"
python3 scripts/wall-preview-check.py run --runtime "$WALL_PREVIEW_RUNTIME"
```

build 단계는 Wire→동일 source 지문 기록→Go OSS build→production webpack→지문 불변 확인을 수행한다. record는 그 실제 build 결과와 복사한 runtime을 대조한다. check/run은 다시 현재 source·binary·asset·config를 검사한다. HTTP 검사에 기존3317을 지정하면9.2.0 응답과 기대 버전 불일치를 명확히 표시한다.

실행 중인3320은 정합성이 검증된 snapshot이다. 이후 소스를 수정해도 자동 배포되지는 않으며 검사는 source 변경을 진단한다. 검사를 피하려고 manifest의 hash나 version을 수동 편집하지 않는다.

## 8. 기존3317의 안전한 전환 절차 — 이번에 실행하지 않음

1. 기존 각 탭의 미저장 작업을 사용자와 확인하고 저장/보존한다. agent가 강제 새로고침·취소하지 않는다.
2. 승인된 시점의 최신 원본 DB·설정·플러그인을 다시 복사하고 새 runtime에서 재검증한다. 오늘의 복사본으로 그 이후 변경을 덮어쓰지 않는다.
3. 실제 비밀번호 로그인·세션 갱신·서버 관리자·OAuth/관련 플러그인을 추가 검증한다.
4. 기존plist와 실행 파일을 백업하고, **명시적 전환 승인 후**에만3317이 검증된 새 바이너리/정적snapshot/승인된 DB 경로를 사용하도록 바꾼다. 원본DB에 연결할 경우에도 승인과 복구 계획을 별도로 확인한다.
5. health·실제출처·대표 기능을 다시 검사한다. 실패하면 기존 실행 경로와 **기존 DB**로 되돌린다. 새 버전에서 변경된 DB를 이전 바이너리에 연결하는 것을 롤백으로 취급하지 않는다.

3320은 이미 조회 가능한 별도 환경이므로 이 전환을 서두르기 위해 기존 세션이나 DB를 위험에 노출할 필요가 없다.

## 9. 근거·기록

- 실제 실행 상태·기존 바이너리 Go build info·baseline: `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-runtime-ref140/`
- 새 runtime: `build-input.json`, `wall-runtime.json`, `backend/frontend-build.log`, `db-before/after-start.json`, `api-results.json`, `testdata-query.json`, `datasource-query-results.json`, `logs/`.
- [Grafana11.4 업그레이드 가이드](https://grafana.com/docs/grafana/latest/upgrade-guide/upgrade-v11.4/)와 [백업 가이드](https://grafana.com/docs/grafana/latest/administration/back-up-grafana/)는 별도 시험 및 설정·플러그인·DB 백업의 기준으로 참조했다. 사용자 지침에 따라 기존 서비스를 중단하지 않았으며 DB 복사는 [SQLite Online Backup API](https://www.sqlite.org/backup.html)를 사용했다. 공식 최신 바이너리를 적용한 것이 아니다.
