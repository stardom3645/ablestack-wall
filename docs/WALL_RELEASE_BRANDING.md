# Wall 로그인 릴리스 표시

Wall Footer는 Grafana 내부 buildInfo와 별도로 `${appSubUrl}/public/ablestack-release.json`을 읽는다.
기본 파일은 `{"version": null}`이며 누락/HTTP 실패/잘못된 JSON/유효하지 않은 버전은 `ABLESTACK Wall`로 표시한다.
저작권은 `2021-{브라우저 현재 연도} ABLECLOUD Inc. All Rights Reserved.`로 표시한다. 브라우저의 로컬 Date.getFullYear()를 렌더 시 읽으므로 외부 통신 없이 동작한다. 열린 화면의 연도는 새로고침/재렌더 시 갱신하며 자정 타이머를 추가하지 않는다. 배포 JSON과 제품 버전에는 영향을 주지 않는다.

## 배포 계약

CCVM의 Wall 설치 경로가 기존 구성과 같다면 대상 파일은 다음과 같다.

`/usr/share/ablestack/ablestack-wall/grafana/public/ablestack-release.json`

```json
{
  "version": "v4.7.5-20261110"
}
```

버전은 v/V 접두사의 `숫자.숫자.숫자` 및 선택적인 영숫자 릴리스 suffix와 기존 Mold의 `V4.0-4.0.15` 형식을 허용한다. 기존 값의 대소문자/숫자를 원문 그대로 보존하며 새 릴리스 번호로 추측 변환하지 않는다.
정상 파일을 읽으면 두 번째 줄에 `ABLESTACK v4.7.5-20261110`을 표시한다.
Footer가 mount될 때 `cache: no-store`로 조회하고 언마운트 시 요청을 취소한다.
파일 교체 후 페이지 새로고침으로 반영하며 JS 재빌드나 서비스 재시작은 필요 없다.
처음 이 기능을 넣는 경우에는 수정된 Wall 프런트엔드를 빌드/배포해야 한다.

후속 monitor 작업에서는 `config_wall.py`가 같은 CCVM의
`/usr/share/cloudstack-management/webapp/config.json`의 `buildVersion`을 읽어 위 JSON을 생성한다.
정상 값만 임시 파일+원자적 교체로 기록하고, 원본 읽기 실패 시 기존 정상 파일을 유지한다.
배포 계정이 쓰고 Wall 서비스가 읽을 수 있어야 한다.
이는 Mold와 같은 ABLESTACK 릴리스 표시이며 Grafana 엔진 버전을 변경하지 않는다.

이번 Wall 변경에는 monitor/cockpit-plugin 수정이나 운영 배포가 포함되지 않는다.

## 검증 및 적용 위치

사용자 요청으로 `diplo-260908`과 `codex/wall-modern-lite`에 동일한 Footer 소스를 적용했다.
Footer/로더 테스트 11개와 ESLint를 통과했다. 로컬 preview production 설정 빌드 및 실제 데스크톱 로그인 기본 문구와 `v4.7.5-20261110` 파일 주입 표시를 확인하고 기본값을 원복했다.
이는 로컬 검증이며 CCVM 운영 배포는 수행하지 않았다.
