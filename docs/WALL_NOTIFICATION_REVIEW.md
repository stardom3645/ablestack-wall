# Wall 저장·오류 알림 — REF-192

2026-11-13, `codex/wall-modern-lite`. 기존 미커밋 작업과 Git index를 보존한다.

## 원인과 변경

저장 성공·오류는 공통 `AppNotificationItem`이 Grafana `Alert`를 직접 사용했고, 연결 테스트도 같은 원색 배경 Alert를 사용했다. 관리 화면을 정리해도 이 별도 공통 경로에는 기존 표현이 남았다.

- `public/app/features/wall-modern/WallNotice.tsx`: 중립 Surface·단일 Border·8px Radius, 상태별20px 아이콘,14px 제목/13px 본문·Inter/Pretendard. 실제 Base UI Button을 사용하는 기존 로컬 `ui`의 닫기 버튼을 재사용한다. 새 알림 라이브러리나 판정 엔진은 없다.
- `core/components/AppNotifications/AppNotificationItem.tsx`: 같은 알림의 제목·본문·React component·Trace ID를 공통 표현에 전달한다. 기존3/5/7초 timeout은 유지하고 unmount 때 해당 timer를 정리한다.
- `AppNotificationList.tsx`: ID key와 안정적인 닫기 callback으로 앞 알림 삭제가 뒤 알림의 수명을 다시 시작하지 않게 한다. 좁은 화면에 맞는 폭, 긴 목록 스크롤, 알림이 없을 때 없는 DOM을 사용한다. 기존 Redux·AppEvents·중복 제거·저장 이력은 그대로다.
- `features/datasources/components/DataSourceTestingStatus.tsx`: 실제 저장/연결 결과를 같은 WallNotice로 표시한다. 기존 메시지 마스킹·상세 펼침·실제 링크·권한을 유지한다. 상태 제목과 backend 메시지를 분리하고 중복 live announcement를 제거한다.
- 관련 Item/List 회귀 테스트와 `DESIGN_SYSTEM.md` REF-192를 추가했다.

대시보드·편집기·관리 화면이 사용하는 공통 AppNotification 경로에 적용한다. 플러그인 자체 안내문, 폼 검증, 확인 Dialog와 경보 데이터는 일괄 변경하지 않았다. API·쿼리·Dashboard JSON·인증/RBAC 정책은 변경하지 않는다.

## 실제 Ego 검증

변경 검증은3342의 격리된 DB 복사본에서만 수행했다. 원래3334의 계정·조직·데이터소스를 시험 변경하지 않았다.

| 조건                | 확인 결과                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 조직 이름 저장 성공 | 실제 PUT 성공으로 발생한 `Organization updated` 알림 표시·자동 해제                                                                                |
| 저장 권한 거부      | QA 사람 계정을 Admin에서 Viewer로 되돌리고 기존 actions reloadcache API로 권한 cache를 갱신한 뒤, 기존 열린 폼에서 실제 저장 거부·원래 메시지 표시 |
| 객체 미존재         | 없는 서비스 계정 조회의 실제 backend 오류 알림·Enter로 닫기                                                                                        |
| 연결 실패           | 별도 QA Prometheus의 `127.0.0.1:1` 실제 connection refused를 중립 배너에 표시; 검증 후 해당 QA 데이터소스 삭제                                     |
| 연결 성공           | 복사본의 실제 Wall Prometheus Save & Test 성공·기존 상세/대시보드·Explore 링크 보존                                                                |
| Light / Dark        | Light1440px 및 Dark768px 실제 화면 확인                                                                                                            |
| 작은 화면           | 400px에서 오류 배너352px, x32~384px로 viewport 안에 표시·가로 overflow 없음·전체 실제 오류 문구 확인                                               |
| 닫기                | 마우스와 키보드 Enter로 닫기·native 자동 닫힘 확인                                                                                                 |

1440px 저장 알림은404px×55px, 닫기28px, Light 배경`#fff`·Border`#dfe1e5`·Radius8px였다. Dark 배경은`#202329`로 현재 Wall 토큰과 일치했다. 캡처를 실제 이미지로 열어 확인했다.

## 테스트와 제한

- 관련4 suites / **17 tests 통과**.4 severity의 역할·timeout, custom component·Trace ID·수동 닫기, unmount cleanup, 앞 알림 삭제 후 뒤 알림의 남은 수명, 실제 DataSourceTestingStatus·기존 reducer를 포함한다.
- 변경6개 TS/TSX의 ESLint 오류0·경고0. Betterer와 같은 강화 규칙의 작업 전후 비교 신규 위반0개. baseline은 변경하지 않았다.
- Production webpack 성공, 기존 크기 경고2개. 의존성 변경 없음.
- 전체 TypeScript는 기존205개로 실패한다. 진단의 파일·위치·코드는 작업 전과 동일하다. 기존1건의 union 출력 순서만 달랐으며 신규 진단은 없다.
- 추가로 시도한 alerting `Templates.test.tsx`는 기존 jsdom/MSW의 `TransformStream is not defined`로 실행되지 않았다. 해당 suite를 통과했다고 보고하지 않으며 이번 작업에서 테스트 환경이나 경보 기능을 변경하지 않았다.
- 모든 플러그인의 자체 배너·실제 모바일 하드웨어·Firefox·스크린리더 실기는 미검증이다.

## 화면

- [기존 저장 알림](/tmp/wall-notifications-evidence/save-before.png)
- [변경 후 저장 알림](/tmp/wall-notifications-evidence/save-light-after.png)
- [다크·768px](/tmp/wall-notifications-evidence/save-dark-768-after.png)
- [실제 저장 거부·400px](/tmp/wall-notifications-evidence/save-rejected-light-400-after.png)
- [실제 연결 실패](/tmp/wall-notifications-evidence/connection-error-light-after.png)
- [실제 연결 성공·다크](/tmp/wall-notifications-evidence/connection-success-dark-after.png)

## 로컬3334 반영

검증 자산을 `~/Library/Application Support/ABLESTACK/WallPreview/coherent-notifications192-20261113`로 반영했다. 백엔드는 기존 동일 SHA256 `d9931aa75168979a698f038be6921aaba5675e66b1aa701a19ac5805b9c65a24`, Grafana11.4.0-pre를 사용한다. 프런트엔드 fingerprint는 `7a8498fa8824eaa7896f9970e530d5173847cf19b33c56c7b86d3cab4ef5fc07`이다.

주요9개 테이블의 전체 행 해시가 반영 전후 동일하다. 대시보드47·데이터소스7·경보57·사용자3·팀0·토큰3과 migration709건을 보존했고 QA DB를 반영하지 않았다. health200·Prometheus `OK`, 실제3334 오류 알림의 중립 배경·8px·마우스 닫기를 확인했다. 실제3334에서는 저장 시험을 하지 않았다.

브라우저의 일반 build-info 요청은 이전 정적 메타데이터를 cache에서 반환했다. cache-busting한 실제 HTTP 응답, 현재 HTML의 `app.9db6487d8d81cfdeeeb4.js`, runtime 검사로 새 자산을 확인했다. 사용자 다른 탭의 캐시나 미저장 작업을 삭제·강제 갱신하지 않았다.

최종 증거·캡처·테스트 로그·보존 기록은 runtime `validation/`에 보존한다. 운영 배포·운영 DB·3317/3318·Netdive 및 기존 Footer 변경은 수행하지 않는다. 커밋·푸시는 수행하지 않는다.
