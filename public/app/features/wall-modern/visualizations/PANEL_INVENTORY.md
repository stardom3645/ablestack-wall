# 05 Dashboard 패널 표시 변경 목록

대상 UID: `aec03x1adsi68f`. 저장 모델의 5개 탭·59개 패널을 그대로 화면에 투영한다.
시계열 35개는 기존 엔진/옵션을 유지하고, Stat 15 + Gauge 3 + Table 6의 표시 본문만 Workspace Context에서 교체한다.
플러그인 ID·JSON·쿼리·변환·필드 설정을 바꾸지 않아 native 편집/전체 화면/검사 경로를 유지한다.

| ID | 원래 영역 | 원래 타입 | 제목 | 새 표시 | 선택 근거 |
| ---: | --- | --- | --- | --- | --- |
| 28 | 대시보드 | stat | 가동 시간 | KPI 값 표시 | 기존 큰 수치·단위 유지, 장식/중첩 제거 |
| 138 | 대시보드 | stat | Glue 스토리지 디바이스 상태 | 상태별 수치 요약 | UP/DOWN과 IN/OUT은 겹치는 집합이므로 합산 파이 차트 금지 |
| 30 | 대시보드 | stat | vCPU 수 | KPI 값 표시 | 기존 큰 수치·단위 유지, 장식/중첩 제거 |
| 32 | 대시보드 | gauge | vCPU 사용률 | 수평 사용률 비교 | 반원 대신 비교 가능한 비율 + 원래 임계치 위치 |
| 34 | 대시보드 | stat | 메모리 합계 | KPI 값 표시 | 기존 큰 수치·단위 유지, 장식/중첩 제거 |
| 38 | 대시보드 | gauge | 메모리 사용률 | 수평 사용률 비교 | 반원 대신 비교 가능한 비율 + 원래 임계치 위치 |
| 36 | 대시보드 | stat | SWAP 합계 | KPI 값 표시 | 기존 큰 수치·단위 유지, 장식/중첩 제거 |
| 40 | 대시보드 | gauge | SWAP 사용률 | 수평 사용률 비교 | 반원 대신 비교 가능한 비율 + 원래 임계치 위치 |
| 8 | 대시보드 | stat | Root 디스크 용량 | 용량 관계 막대 + 원본 값 | 전체/사용중/사용 가능이 합치할 때만 세그먼트 표현 |
| 242 | 대시보드 | stat | Glue mon 데몬 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 241 | 대시보드 | stat | Glue mgr 데몬 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 237 | 대시보드 | stat | Glue mds 데몬 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 239 | 대시보드 | stat | Glue rgw 데몬 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 251 | 대시보드 | stat | NFS 데몬 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 240 | 대시보드 | stat | iSCSI 데몬 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 236 | 대시보드 | stat | 호스트 수집기 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 250 | 대시보드 | stat | 프로세스 수집기 | 공통 서비스 상태 목록 | 8개 독립 OK 카드 대신 compact row, 원래 mapping 유지 |
| 140 | 대시보드 | timeseries | vCPU 사용 현황 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 142 | 대시보드 | timeseries | 메모리 사용 현황 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 144 | 대시보드 | timeseries | 네트워크 트래픽 (bits/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 146 | 대시보드 | timeseries | 디스크 IO (ops/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 224 | 네트워크 상세 | stat | NIC 상태 | 상태별 수치 요약 | UP/DOWN과 IN/OUT은 겹치는 집합이므로 합산 파이 차트 금지 |
| 226 | 네트워크 상세 | table | NIC 별 상태 | 밀도형 엔티티 목록 | 모든 행/필드/링크 보존, 필드별 정렬 |
| 228 | 네트워크 상세 | table | NIC 연결 상태 변경 총 횟수 | 밀도형 엔티티 목록 | 모든 행/필드/링크 보존, 필드별 정렬 |
| 230 | 네트워크 상세 | table | 활성 NIC MTU | 밀도형 엔티티 목록 | 모든 행/필드/링크 보존, 필드별 정렬 |
| 176 | 네트워크 상세 | timeseries | 네트워크 수신 트래픽 (bits/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 174 | 네트워크 상세 | timeseries | 네트워크 송신 트래픽 (bits/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 172 | 네트워크 상세 | timeseries | 네트워크 수신 트래픽 (packets/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 170 | 네트워크 상세 | timeseries | 네트워크 송신 트래픽 (packets/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 168 | 네트워크 상세 | timeseries | 네트워크 수신 오류 트래픽 (packets/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 166 | 네트워크 상세 | timeseries | 네트워크 송신 오류 트래픽 (packets/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 164 | 네트워크 상세 | timeseries | 네트워크 수신 손실 트래픽 (packets/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 162 | 네트워크 상세 | timeseries | 네트워크 송신 손실 트래픽 (packets/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 160 | 네트워크 상세 | timeseries | ICMP 수신 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 158 | 네트워크 상세 | timeseries | ICMP 송신 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 156 | 네트워크 상세 | timeseries | UDP 수신 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 154 | 네트워크 상세 | timeseries | UDP 송신 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 152 | 네트워크 상세 | timeseries | TCP 수신 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 150 | 네트워크 상세 | timeseries | TCP 송신 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 148 | 네트워크 상세 | timeseries | TCP 연결 수 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 244 | 스토리지 상세 | table | 파일시스템 정보 | 단일 행 Compact Information / 복수 행 Compact Table (REF-17) | 원래 모든 frame/field/bytes/percent·타입/오류·링크 보존, 콘텐츠 높이 측정 및 하단 frame 선택기 제거 |
| 192 | 스토리지 상세 | timeseries | 디스크 읽기 (ops/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 194 | 스토리지 상세 | timeseries | 디스크 쓰기 (ops/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 188 | 스토리지 상세 | timeseries | 디스크 읽기 (bytes/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 190 | 스토리지 상세 | timeseries | 디스크 쓰기 (bytes/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 184 | 스토리지 상세 | timeseries | 디스크 읽기 평균 지연 (sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 186 | 스토리지 상세 | timeseries | 디스크 쓰기 평균 지연 (sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 246 | Glue 스토리지 디바이스 상세 | table | Glue 스토리지 디바이스 사용률 | Device Capacity View (REF-18) | 같은 transformed row의 디바이스·전체/사용/비율을 통합, cross-frame join 금지. 0~1 단위·원본/링크/추가 필드 보존, 비정상 비율은 원인+원본 표시 |
| 249 | Glue 스토리지 디바이스 상세 | table | Glue 스토리지 디바이스 별 PG 개수 | 밀도형 엔티티 목록 | 모든 행/필드/링크 보존, 필드별 정렬 |
| 131 | Glue 스토리지 디바이스 상세 | timeseries | 디스크 IOPS (ops/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 132 | Glue 스토리지 디바이스 상세 | timeseries | 디스크 처리량 (bytes) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 133 | Glue 스토리지 디바이스 상세 | timeseries | 디스크 읽기 쓰기 최대 지연 (sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 134 | Glue 스토리지 디바이스 상세 | timeseries | 디스크 사용률 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 212 | 프로세스 상세 | timeseries | 프로세스 수 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 214 | 프로세스 상세 | timeseries | CPU 사용 시간 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 216 | 프로세스 상세 | timeseries | 읽기 작업 (bytes/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 218 | 프로세스 상세 | timeseries | 쓰기 작업 (bytes/sec) | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 220 | 프로세스 상세 | timeseries | 가상 메모리 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |
| 222 | 프로세스 상세 | timeseries | 사용 메모리 | 기존 Time series | 선·색·축·그리드·Hover/Zoom/범례 유지; 공통 헤더만 적용 |

## 데이터 계약 확인

- 246: A=`ceph_osd_stat_bytes`(bytes), B=`ceph_osd_stat_bytes_used`(bytes), C=`used/total`(0~1). A/B의 bytes override 및 C의 percentunit/max=1/percentage thresholds 75·85 유지. identifier를 percent formatter에 전달하지 않는다.
- 244: A=size bytes, B=size−free bytes, C=100−free/size×100(percent 0~100), D=device_error. filter→merge→sort 변환 후의 모든 필드를 사용하며, 마운트 경로·타입·오류를 숨기지 않는다.
- 8: A=size, B=size−avail, C=avail. Root의 사용중은 예약 공간 때문에 244의 size−free와 다를 수 있다. free와 avail을 서로 대체하지 않는다.
- 32/38/40: percent 0~100, 절대 임계치 75/85를 그대로 사용. 0·100은 정상 범위, null/NaN/Infinity/범위 밖은 막대를 그리지 않고 값을 보존한다.
- 서비스 8개: 원래 값 매핑의 0→WARN, 1~9999→OK 유지. 없는 장애 기준을 임의로 추가하지 않는다. 원본 numeric 값도 tooltip/검사에서 확인 가능하다. 매핑 밖 값은 중립색으로 표시하며, 데이터가 없어도 서비스·사용률의 이름을 유지한다.
- 알려진 키가 없는 새 필드는 목록에 함께 표시한다. 모든 transformed frame/row를 표시하고 원래 data link 공급자를 호출한다. 숫자는 native display processor, identifier는 string 원문/기존 매핑을 사용한다.
- 합계/사용량/비율 모순은 표시 경고로 처리한다. 임의 clamp·/100 추측·강제 bytes 변환·값 보정은 하지 않는다.

## 검증 데이터의 한계

기존 loopback fixture는 bytes라는 문자열이 포함되면 용량/비율/차감식에 모두 1,200,000,000을 반환했다.
이는 C의 비율을 120,000,000,000%로 만들며 A/B/C 합계도 모순된다. 실제 SCVM 오류로 단정하지 않는다.
쿼리별 평가 시각과 라벨·수학적 관계를 갖춘 별도 임시 fixture로 정상 표시를 검증하고, 잘못된 C 및 합계는 단위 테스트/브라우저 오류 사례로 따로 검증한다.
제품 쿼리와 운영 DB는 수정하지 않았다. 새 UI의 원본 보존/오류 경고를 fixture 값 보정과 구분한다.
