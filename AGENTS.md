# ABLESTACK Wall 작업 지침

- Grafana=Wall, CloudStack=Mold, Skydive=Netdive, Ceph=Glue이다.
- ccvm/scvm 템플릿 패키징 시 cockpit-plugin은 최신 소스로 유지하지만, ablestack-monitor는 git pull하지 않고 수동 관리한다.
- 사용자가 명시적으로 재개하기 전에는 HTTPS 중앙 배포 및 443/19100 등 새 포트 전환을 다른 작업에 포함하지 않는다. 현재 프로토콜·포트·배포 방식을 유지한다.
- 운영 DB, 고객 환경, 백엔드 및 Grafana 버전 변경은 별도 요청 없이 하지 않는다.

## UI 일관성과 작업 기록

- UI 변경 전 [Wall 디자인·컴포넌트 기준표](public/app/features/wall-modern/DESIGN_SYSTEM.md)를 읽는다.
- 실제 참조한 디자인, 컴포넌트 원본/버전, 실제 import 경로, 적용 화면, CSS만 변경한 부분을 기준표에 기록한다. 구현이나 검증 결과가 달라지면 같은 표를 업데이트한다.
- shadcn/ui는 로컬 소스 컴포넌트이다. Base UI의 실제 primitive 사용과 단순 CSS 수정을 구분해서 보고한다. 존재하지 않는 Base UI Card/Section 패키지가 있다고 표현하지 않는다.
- 색·폰트·여백·모서리는 공통 토큰을 사용하고 새로운 화면마다 임의의 디자인 체계를 추가하지 않는다. Netdive/Mold와의 정합성은 기준표를 따른다.
- 디자인 참조는 정보 밀도·위계·조작 편의의 기준으로 사용하며, 타 제품의 특징적인 외형을 그대로 복제하지 않는다. 사용자가 거부한 큐브 단독 객체 버튼은 재도입하지 않고 Wall 제품군의 의미·명확한 명칭을 우선한다.
- 디자인 벤치마킹은 DESIGN_SYSTEM.md REF-22를 따른다. Dynatrace는 직접 조작·Hover·이동/크기 조절의 UX, Grafana는 시계열 탐색·분석 기능, Datadog은 정보 밀도·상태 표현, Linear/Notion은 절제된 컨텍스트 액션을 참고한다. shadcn/ui 로컬 컴포넌트와 실제 Base UI primitive로 Wall 토큰·타이포그래피·카드 체계에 통합한다. Dynatrace의 툴바 위치·아이콘 배열·선택 테두리·메뉴 형태를 그대로 옮기지 않는다. REF-21의 동작 검증을 외형 복제의 근거로 사용하지 않는다.
- Resize 핸들은 최신 사용자 지침인 DESIGN_SYSTEM.md REF-25의 이중 ㄴ자 선을 사용한다. 왼쪽은 ㄴ, 오른쪽은 좌우 반전하여 모서리에 맞춘다. 선의 가독성만 참고하며 Dynatrace의 이중 대각선을 복제하지 않는다. 이전 사각 아이콘/확장 화살표/빈약한 단일 L자로 되돌리지 않는다.
- Resize 선 색·굵기는 REF-34의 최신 사용자 수정과 공통 토큰을 따른다. Light는 사용자가 직접 지정한 #a3a3ad, Dark는 기존 중립 회색 #c9cad1, 선은 2px이다. REF-29의 이전 Light 색보다 이 값이 우선한다. Hover/조작 때도 핸들 선을 파란색으로 바꾸지 않는다. 이중 ㄴ자 모양과 기존 조작 기능은 유지한다.
- 스타일 반영 검증은 REF-31처럼 실제 사용 중인 탭의 computed style도 확인한다. 별도 검증 탭만 갱신하고 사용 탭에도 반영됐다고 보고하지 않는다. 실제 탭 갱신 전 각 탭의 미저장 배치를 확인하고, 미저장이 남아 있으면 보존 사실과 아직 갱신되지 않은 탭을 명확히 알린다.
- 개요의 성능 추이·스토리지 요약·서비스 상태는 REF-30의 WallTextPanel로 표시한다. 고정 제목 삭제나 단순 h2로 되돌리지 않는다. 관리자가 제목·설명을 편집/저장할 수 있는 3개 표시 전용 텍스트 패널이며 기존 PanelLayoutGrid를 재사용한다. 원본 JSON의 59개 데이터 패널과 구분하고 텍스트/배치는 기존 방식대로 브라우저에 저장한다. 이 교체는 사용자의 명시적 요청 범위이며 일반 레이아웃 기능 고도화 동결은 유지한다.
- 대시보드 변수는 고정된 가상머신/객체/필터 버튼으로 치환하거나 변수명을 하드코딩하지 않는다. 원래 변수 컨트롤의 label/name·순서·타입·선택값·hide 설정을 사용하며 변수 추가·삭제에 자동 대응한다.
- 현재 Workspace 시범 적용 범위는 UID `aec03x1adsi68f` (05. 스토리지센터 가상머신 상세 현황) 하나이다. 명시적 요청 없이 다른 대시보드나 경보 화면으로 확대하지 않는다.
- 하나의 대표 대시보드에서 공통 컴포넌트의 디자인·기능 검증을 먼저 완료한다. 이후 확장은 별도 요청에 따라 진행하며 여러 화면을 동시에 수정하지 않는다.
- 승인된 Stat 숫자·단위·상태 배지 디자인을 유지한다. 기존 JSON·UID·패널 ID·쿼리·변수·시간·자동 새로고침을 보존하고, UI 구성은 저장 모델을 변경하지 않는 투영으로 구현한다.
- 기존 Grafana 패널과 query runner를 재사용한다. 장식 목적의 가짜 수치·상태·증감률·미니 차트를 추가하지 않는다.
- 실제 데스크톱 브라우저에서 디자인과 기능을 확인하고, 실제 운영 데이터 검증과 fixture 검증을 구분한다.

- 05번 대시보드의 타이포그래피는 `public/app/features/wall-modern/typography.ts` 단일 토큰을 사용한다. DOM/CSS·Stat/Gauge·uPlot 축/범례/툴팁에서 글꼴과 크기를 따로 정의하지 않는다. 자체 호스팅된 Wall Inter / Wall Pretendard와 폰트 로딩 후 Canvas 재구성을 유지하고, 다른 UID로의 확대는 별도 요청에 따른다.

- 최신 05번 시각화 기준은 DESIGN_SYSTEM.md REF-15와 visualizations/PANEL_INVENTORY.md를 따른다. 이 UID의 5개 탭에서 시계열 35개는 유지하고, 비시계열 24개의 데이터 표시만 Workspace Context로 교체한다. 저장 타입/JSON/쿼리·변환·단위/임계치를 바꾸지 않는다. percentunit·percent·bytes 및 free/avail을 구분하고, 비정상 값은 clamp/추측 보정하지 않고 원본+경고로 표시한다. 검증 fixture 수정과 제품 표시 수정은 구분해 보고한다.

- KPI 배치 조정은 DESIGN_SYSTEM.md REF-23을 따른다. 단순 클릭/Hover로 전체 편집 모드를 켜지 않는다. 관리자의 Hover/키보드 focus에서 실제 사용 가능한 핸들을 안내하고, 마우스 6px 이동 임계값을 넘은 실제 조작 중에만 격자·선택 강조·크기/배치 안내를 표시한다. 종료 즉시 안내를 제거하고 실제 배치 차이가 있을 때만 저장·취소를 표시한다. Viewer/권한 없음/좁은 화면에서는 작동하지 않는 핸들을 렌더링하지 않는다. REF-21의 카드 클릭 편집 진입/상시 격자는 대체되지만 초기 데이터 활성화·권한·저장 범위 검증은 유지한다. 실제 사용 탭의 새로고침 후 첫 표시·클릭/핸들 클릭/이동/Resize/종료/저장·취소를 확인하며, 탭 전환으로 초기 로딩 오류를 우회하지 않는다.
- REF-26에 따라 위 직접 조작 UX는 사용자가 승인한 05번 UID의 5개 탭·59개 패널 전체에 적용한다. 기존 섹션/탭 안에서 배치를 조정하고, 48열 표시 좌표와 관리자별 브라우저 로컬 저장을 사용한다. 원본 Dashboard JSON/Scenes grid state는 바꾸지 않는다. 기존 KPI v1 저장은 유지하고 나머지는 탭/섹션별 키로 분리한다. 미저장 배치는 탭 전환 시 보존하며 페이지 새로고침 시 마지막 저장 배치로 돌아간다. 다른 UID 확대나 서버 저장은 별도 요청에 따른다.
- 레이아웃 편집은 REF-27을 안정화 기준으로 동결한다. 사용자가 명시적으로 다시 요청하기 전에는 새로운 편집 기능·라이브러리·추가 고도화를 진행하지 않는다. 클릭/Hover는 조회 상태, 실제 핸들 조작 중에만 Grid/안내, 실제 변경 후에만 저장·취소를 유지한다. 창 이탈/버튼 해제 누락은 진행 중 조작만 취소하고 이전 미저장 배치는 보존한다. 이후 요청은 05번 데이터 시각화·조회 UX에 집중하되 레이아웃 확장으로 해석하지 않는다.

- 05번 패널 액션의 최신 기준은 DESIGN_SYSTEM.md REF-32이다. Wall PanelActionDock과 Base UI menu DOM을 사용하며, 별도 Grafana Dropdown 또는 개별 absolute 이동/메뉴 버튼을 다시 추가하지 않는다. native 권한 필터·href·callback·검사 하위 메뉴를 재사용하고, 레이아웃 엔진 동결은 유지한다.

- 개요 중앙 배치의 최신 기준은 DESIGN_SYSTEM.md REF-33이다. 명시적 사용자 요청으로 성능 추이 텍스트·차트·사용률 묶음·스토리지 표시를 공유 48열 Grid에 연결해 충돌한 이웃을 아래로 민다. 기존 분리된 열/지역 Grid로 되돌리지 않는다. 사용률 내부 조작과 상위 이동을 구분하고, 이전 저장 키와 원본 59개 패널을 보존한다. 다른 탭·영역의 추가 레이아웃 고도화는 계속 동결한다.

- 패널 이동 충돌의 최신 기준은 DESIGN_SYSTEM.md REF-35이다. 이동은 드래그 시작 배치를 기준으로 hover 대상과 원래 자리를 교환하고, Resize는 REF-33의 밀림을 유지한다. 이웃을 이미 밀린 좌표에서 다시 밀어내는 동작으로 되돌리지 않는다. 기존 native Grid helper·빈 공간·저장 계약·사용자 직접 수정한 핸들 색은 보존한다. 사용자 탭에 미저장 배치가 있으면 소스 반영을 위해 강제로 새로고침하지 않는다.
- 배치 안내는 DESIGN_SYSTEM.md REF-36을 따른다. 이동 핸들을 누른 동안은 해당 항목의 현재 자리·크기만 국소 빗금으로 표시하고, 실제 6px 이동/Resize 중에만 놓을 자리와 전체 Dot Grid를 표시한다. 일반 클릭/Hover는 조회 상태이며 해제/cancel/blur/버튼 해제 누락에서 안내를 제거한다. 점·빗금 색과 크기는 공통 토큰을 사용하고 사용자 Resize 색은 보존한다. 단순 누름만으로 draft·저장 UI를 변경하지 않는다.
- 이동감은 DESIGN_SYSTEM.md REF-37을 따른다. 교환 확정 전의 작은 겹침으로 이웃을 아래로 미리 밀지 않는다. 잡은 카드는 native 픽셀 좌표를 즉시 따르고, 이웃은 공통 motion 토큰과 기존 Grid 애니메이션 활성화 클래스로 이동한다. 최초 배치 측정·reduced motion은 애니메이션에서 제외하고, 실시간 위치 안내 때문에 데이터/액션 트리를 매 move마다 다시 구성하지 않는다. 차트 입력은 실제 layout gesture 동안만 차단하고 종료 즉시 복원한다. 새 DnD 라이브러리·다른 UID 확대는 하지 않는다.
- 그룹/섹션/복제의 현재 한계와 다음 설계 제안은 DESIGN_SYSTEM.md REF-38을 따른다. 현재 고정 section·별도 Grid·ID 32/38/40의 사용률 Card를 사용자 생성 그룹 기능으로 설명하지 않는다. native Copy와 새 ID를 만드는 Duplicate를 구분한다. 탭 내부 공통 배치, 동적 그룹 소속, 독립 패널 복제의 저장/취소는 아직 미구현 제안이며 버튼만 추가해 완성됐다고 보고하지 않는다.
- 최신 배치 구조는 DESIGN_SYSTEM.md REF-39가 우선한다. 사용자의 명시적 요청으로 개요도 탭 내부 단일 Grid로 통합했으며 KPI·차트·텍스트·사용률·스토리지·서비스 사이에 고정 이동 경계를 두지 않는다. 32/38/40 사용률은 독립 Card이고 -1004 강제 그룹은 최종 트리에 없다. REF-33의 강제 묶음과 REF-38의 그룹 제안을 기본 구조로 복원하지 않는다. 그룹 생성/패널 복제는 향후 별도 범위다. 최초 측정의 legacy 배치 이어받기와 기존 저장 키를 보존하고, 새 통합 배치는 :tab:overview:free-layout에 저장한다. Viewer도 같은 독립 구조를 보되 조작 핸들은 DOM에 만들지 않는다. 기존 5개 탭·59개 데이터 패널·원본 JSON은 유지한다.
- 배치 편집 이력은 DESIGN_SYSTEM.md REF-40을 따른다. 완료된 이동/Resize와 이웃 좌표를 한 작업으로 기록하고 탭별 최근 50개의 Undo/Redo 및 최초 saved baseline을 페이지 세션 동안 유지한다. 입력창의 기본 Undo를 가로채지 않으며 다른 UID/읽기 전용/native 전체 편집에는 연결하지 않는다. 저장 성공/전체 취소 때 해당 탭 이력을 비우고 저장 실패 때는 유지한다. 기록 때문에 Grid가 상시 보이거나 원래 배치로 Undo한 뒤 dirty가 남지 않게 한다. 이력과 실제 배치 저장을 구분하며 원본 데이터/JSON은 보존한다.
- Resize 이탈·이동 흡착의 최신 기준은 DESIGN_SYSTEM.md REF-41이다. 조작 중 Resize 항목의 y/반대쪽 모서리를 고정하고 native 임시 static 우선순위로 이웃만 양보하게 한다. 시작 snapshot에서 재계산하여 밀림을 누적하지 않으며 임시 잠금은 저장하지 않는다. 같은 줄/열의 크기가 다른 교환은 전체 범위·간격을 보존하여 작은 겹침 때문에 잡은 항목이 아래로 떨어지지 않게 한다. 공통 panelSnap의 18px 흡착/28px 해제·35% 진입/20% 유지·12%p 대상 전환 여유를 유지한다. REF-40 Undo/Redo·48열·로컬 저장·사용자 Resize 색·단순 클릭 조회/실제 조작 중에만 Grid 계약은 보존하고, 신규 편집 기능 확대 동결은 유지한다.
- Dot Grid 레이어는 DESIGN_SYSTEM.md REF-42를 따른다. 실제 이동/Resize 중 컨테이너 배경으로만 그려 패널 사이·빈 공간에 표시하고, 카드/그래프 위를 덮는 z-index 전면 pseudo overlay를 다시 추가하지 않는다. 기존 점의 색·반경·간격과 국소 빗금 안내, 조작 상태·배치 계산은 유지한다.
- 05번 표면/간격/기준선의 최신 기준은 DESIGN_SYSTEM.md REF-43과 surfaceTokens.ts이다. 카드 반경8px, Light #cbd5e1/Dark #45566f Border, 단색/그림자없음, 가로16px·본문세로16px(낮은 KPI/사용률/서비스/집계는8px), 카드12px/섹션24px을 공통으로 사용한다. CSS 외곽 여백을 중복하지 말고 native PanelChromePresentation의 선택적 contentPadding과 렌더러 innerWidth/innerHeight를 함께 맞춘다. 단위에 KPI행간을 상속시켜 기준선을 다시 어긋나게 하지 않는다. 타이포그래피는 기존 typography.ts를 유지한다. REF-43 검증 때 실제 사용 탭 개요에 미저장 배치가 있어 갱신하지 않았으므로 후속 반영 전 미저장 상태를 다시 확인한다.
- 기본 테마는 DESIGN_SYSTEM.md REF-44에 따라 conf/defaults.ini의 Light다. sample.ini 예시도 Light를 유지한다. 사용자/조직의 명시 테마·theme URL과 기존 수동 Light/Dark 전환을 강제로 덮어쓰지 않는다. REF-44에서 실제 사용 탭의 5개 영역 미저장0 확인 후 갱신했고 기본Light/카드8px을 검증하여 REF-43의 미반영 주의는 해소됐다.
- 다중 선택은 DESIGN_SYSTEM.md REF-45를 따른다. 관리자의 현재 탭에서 Ctrl/Cmd 또는 Shift+클릭 추가/해제, 작업 영역 안 Ctrl/Cmd+A 전체 선택, Esc 해제를 제공한다. 입력/차트 일반 조작·외부 단축키를 보호하며 선택만으로 Grid/dirty를 만들지 않는다. 다중 이동은 상대 위치를 보존하는 기존 native Grid/Undo 한 작업이고, 선택/임시 잠금/외곽 ID는 저장하지 않는다. 다중 선택 중 Resize 핸들은 DOM에서 제거하고 영구 그룹·복제·삭제 기능으로 설명하지 않는다. 하단 선택 도구가 저장/취소를 덮지 않도록 끝 여유 공간을 유지한다. REF-45 검증 당시 실제 사용 탭에 미저장 배치1건이 있어 갱신하지 않았으므로 후속 반영 전 다시 확인한다. 다른 기능 확대 동결은 유지한다.
- 조작 윤곽의 최신 기준은 DESIGN_SYSTEM.md REF-46이다. 이동/Resize 중 놓일 위치의1px 실선만 강조하고 marker/카드 경계/native placeholder glow를 겹쳐 그리지 않는다. native GlobalStyles placeholder의 !important 배경·그림자를 Wall 범위에서만 명시적으로 무효화하고 DOM/배치 엔진은 유지한다. 정지 선택선은 카드 안쪽offset=-1px, 위치 라벨은 중립 Border다. 전체 Grid 외곽 점선은 복원하지 않고 배경Dot·기존 빗금·핸들색·다중 선택/저장 계약을 유지한다.
- 05번 최신 Surface는 DESIGN_SYSTEM.md REF-47의 Soft Depth다. surfaceTokens.ts의 card 전용 기본/Hover/선택 Border·단일 약한 Shadow와 panelText/panelMuted를 사용하고 기존8px 반경·여백/배치를 유지한다. Text 섹션은 투명/무그림자/투명 border1px로 기존 geometry를 보존한다. 차트가 쓰는 legacy surface/border/shadow/text/muted를 패널 depth 토큰으로 바꾸지 않으며 배치 편집/데이터는 수정하지 않는다. REF-47에서 실제 사용 탭5개 영역 미저장0을 확인 후 새 스타일을 갱신했으므로 REF-45/46의 미반영 주의는 해소됐다.
- 선택 테두리 최신 기준은 DESIGN_SYSTEM.md REF-48이다. surfaceTokens.selectionStroke=2px과 offset=-2px로 카드 안쪽에 한 번 그려 선택을 명확히 한다. REF-46의 조작 중 놓일 위치1px 선·중복 윤곽 제거·native placeholder 숨김은 유지하고, 카드 geometry·Shadow·데이터·배치 동작은 바꾸지 않는다.

- 패널 액션 노출의 최신 기준은 DESIGN_SYSTEM.md REF-49이다. Hover/focus에서는 작은 이동·더보기와 기존 Resize 핸들만 표시하고, 전체 보기/공유 툴바는 마지막 선택 패널 하나에만 표시한다. compact 더보기에도 native 권한 필터를 거친 모든 작업을 유지한다. 잡은 핸들은 조작 종료까지 dock 구조를 고정하며, 툴바 확대를 위해 드래그 중 위치가 바뀌지 않게 한다. 선택/조작/dirty는 별개이며 기존 배치 엔진·저장·그래프 입력은 유지한다.

- 패널 조작 최신 기준은 DESIGN_SYSTEM.md REF-50 A-Hybrid다. PanelActionsProvider/WallPanelHeader를 사용해 헤더 안 좌측 Grip·제목·우측 native 작업 DropdownMenu를 배치한다. 외부 floating dock 및 선택 시 확장 툴바를 복원하지 않는다. 28px 조작 슬롯/4px gap을 미리 확보해 Hover 시 제목이 움직이지 않게 한다. 낮은 사용률/서비스 행과 투명 Text 헤더도 같은 슬롯을 사용한다. 우측 하단 Resize 이중 ㄴ자는 기존 색/2px을 유지하고 경계에서6px 안으로 띄운다. 마우스 누름에는 안내를 만들지 않고 실제6px 조작 중에만 Grid/안내를 표시하며 종료 즉시 제거한다.48열·충돌/다중 선택·저장·Undo 계산은 유지한다.

- 05번 모션은 DESIGN_SYSTEM.md REF-51과 motion.css를 따른다. Hover120ms/팝업 진입160ms·퇴장100ms/이웃 배치200ms를 공통 토큰으로 사용하고 잡은 패널·Resize·안내는 지연하지 않는다. 최초 측정과 키보드 도구 표시는 즉시이며 포털 Popup root에도 reduced-motion을 적용한다. 숫자·차트 데이터 tween, 카드 lift/과도한 spring·장식 효과·새 애니메이션 라이브러리는 추가하지 않는다.

- 편집/저장 최신 기준은 DESIGN_SYSTEM.md REF-52다.05번의 A-Hybrid/48열/모션/직접 조작을 유지하고 별도 global layout mode로 되돌리지 않는다. 상단은 native 대시보드 설정이며 panel editor도 native를 재사용한다. kiosk/일반/Viewer는 같은 Grid와 좌표를 사용하고 kiosk는 UI 노출만 바꾼다. Wall 배치와4개 Text는 dashboard.wallModern(version1)에 보존해 기존 Grafana 저장 창/API/버전/Dirty/취소/이탈 확인과 연결한다. LocalStorage는 이전용 초기값이며 영구 저장으로 표현하지 않는다.48열 좌표를24열로 축소하지 않으며 native panels/gridPos/쿼리/단위는 그대로 보존한다. 이번 명시적 서버 저장 요청이 과거 로컬 전용/JSON 미변경 제한보다 우선하며 다른 UID로 확대하지 않는다. 저장 baseline에 열린 Drawer/설정/PanelEditor를 복제하지 않는다.

- 로컬 미리보기(3317)는 사용자 launchd 서비스 `com.ablestack.wall-modern.preview`, 테스트 데이터(3318)는 `com.ablestack.wall-modern.fixture`로 유지한다. plist는 `~/Library/LaunchAgents/`, 런타임/로그는 `/tmp/wall-modern-lite-runtime/`에 있다. 수정 후 두 서비스와 3317 `/api/health`·대시보드 HTTP 응답을 확인한다. 서버를 재시작해야 하면 기존 서비스의 `launchctl kickstart -k gui/$(id -u)/<label>`을 사용하며 별도 foreground 서버를 중복 실행하지 않는다. 실제 사용 탭에 미저장 변경이 있으면 강제 새로고침하지 않는다. 이 구성은 로컬 개발 전용이며 운영 배포를 변경하지 않는다.

- 정렬/흡착 최신 기준은 DESIGN_SYSTEM.md REF-53이다.48열·저장 좌표는 유지하고 panelSnap의24px 진입/38px 해제·guideReach240px를 사용한다. 실제 흡착 축의 카드 표시와 drop 좌표를 맞추고 Resize도 native min/max/반대 모서리를 보존하여 흡착한다. 정렬선은 현재 미리보기 이웃의 visible edge가 정확히 일치할 때만 표시하고 stop/abort에서 제거한다. react-resizable callback node는 handle이므로 closest tile을 사용한다. 기존6px 의도/충돌/다중 선택/Undo/일괄 저장을 유지하며 추가 기능 확장으로 해석하지 않는다. REF-53 당시 실제 사용 탭에 미저장 작업이 있어 갱신하지 않았으므로 후속 반영 전 다시 확인한다.

- 흡착 최신 기준은 DESIGN_SYSTEM.md REF-54가 REF-53보다 우선한다. 이웃 가장자리만이 아니라 모든 Grid 칸에 이동/Resize 표시와 실제 좌표를 맞춘다. 가로1열/세로 visible Dot12px를 사용하며 저장48열·2px 정밀도와 기존 미조작 배치는 유지한다. panelSnap.cellHold0.62/rowPixels12가 공통 기준이다. 이웃 정렬선은 보조이며 중간 Grid 칸을 건너뛰는24/38px 이웃 흡착으로 되돌리지 않는다. 다중 이동은 hull의 상대 위치를 보존하고 기존 충돌/저장/Undo를 유지한다. 실제 사용 탭의 미저장 작업을 보존하고 갱신 전 확인한다.

- Text 패널 표면 최신 기준은 DESIGN_SYSTEM.md REF-55다. 평상시는 기존 투명/무그림자 섹션 제목이며 Hover/focus-within/내부 메뉴 열린 동안만 기존 단색 --wall-surface·--wall-card-border-hover로 불투명 영역을 드러낸다. border1px/크기/좌표는 유지한다. REF-47의 상시 투명을 Hover까지 강제하거나 Text에 상시 카드 표면·그림자를 추가하지 않는다. REF-55 당시 사용자 Wall 탭2개에 미저장이 있어 갱신하지 않았으므로 반영 전 다시 확인한다.

- 패널 메뉴 최신 기준은 DESIGN_SYSTEM.md REF-56이다.05번 WallPanelActions는 제목/보기·편집·공유 Quick actions/일반 작업/하단 위험 작업의 Command Menu이며 검사·더보기·확장 하위 메뉴는 같은240×284 Popup의 Click Drill-in으로 전환한다. native href/callback/권한·삭제 확인을 유지하고 Grafana 그룹 헤더/Flyout을 복원하지 않는다. Base UI Menu primitive와 surfaceTokens의 메뉴 토큰을 사용한다. ESC는 하위에서 한 단계 복귀·root에서 닫기, 패널/메뉴 종료 시 path 초기화다. kiosk는 native Inspector의 자체 Query/JSON 탭 노출을 피하도록 진입을 숨기되 보기·공유는 유지한다. 저장/48열/A-Hybrid 엔진은 변경하지 않는다. REF-56 당시 사용자 탭2개는 미저장1로 보존했으며1296910978만 최신 빌드로 갱신했다.

- 패널 메뉴 밀도/복사·붙여넣기 최신 기준은 DESIGN_SYSTEM.md REF-57이다. 보기·편집·공유 quick3칸/50px은 유지하고 하단/Drill-in32px·240×252px 기본 envelope와 viewport 제한만 사용한다. 추가 작업 안 패널 복사와 Ctrl/Cmd+C/V는 실제 단일 native 패널 설정을 Scene별 내부 버퍼로 복사하고 같은 UID의 현재 탭 Row에 새 ID로 붙인다. 쿼리/옵션/threshold/변환은 deep clone,48열 크기는 wallModern.layouts, 표시 유형은 panelSources로 보존한다. native Row membership과 wire 내부 ID순서를 유지하며 기존 패널을 재배치하지 않는다. 복사만dirty0,붙여넣기는 native 일괄 저장/취소를 따른다. 입력/코드/일반 텍스트 선택/버퍼없음/다른UID/kiosk/readOnly는 기본 키동작을 보호한다.4개 Wall 표시 Text 타일/다중 복사/대시보드 간 전달은 대상이 아니다. 취소의 ID제거 직후 stale draft를 렌더링하지 않으며 원본 panel wire 표현을 레이아웃 저장만으로 바꾸지 않는다. 다른 기능 확대 동결은 유지한다.

- 최신 패널 quick 액션은 DESIGN_SYSTEM.md REF-58의 보기·편집·복제다. REF-57의 공유 quick 금지를 대체하며 공유는 추가 작업 Drill-in에 보존한다. 복제와 붙여넣기는 기존 native JSON/PanelModel/48열 배치 파이프라인과 layoutHistory.recordCommand를 사용해 한 작업으로 Undo/Redo하고, 패널 ID 추가·제거로 이전 이동 이력을 지우지 않는다. 복제를 전부 Undo해 원래 상태가 되면 native dirty와 저장 바도 제거하되 다른 미저장 변경은 유지한다. 기존 하단 저장 바에 같은 Undo/Redo 컨트롤을 제공하며 브라우저 뒤로가기의 미저장 이탈 보호는 끄지 않는다. 사용자 기존 미저장 탭은 강제 갱신하지 않는다.

- 직접 조작 모션 최신 기준은 DESIGN_SYSTEM.md REF-59다. native48열/논리 Grid 흡착·충돌·저장·Undo는 유지하면서 잡은 패널의 표시 pixel은 연속 pointer+각 stop 근처 smoothstep 흡착으로 처리한다. mouse 입력은 실제6px intent 이후 rAF당 최신1개로 native 엔진에 전달하고 mouseup 전에 동기 flush한다. 종료/abort/unmount에서 frame/listener/임시 표시를 제거한다. 다중 이동은 같은 표시 delta를 공유한다. 이웃180ms/놓기140ms 공통 motion 토큰과 reduced-motion을 따르며 잡은 카드에 지속 tween 지연을 주지 않는다. 처음 측정/차트 일반 입력은 영향이 없고 새 엔진·라이브러리·확대 기능은 추가하지 않는다. REF-54의 카드 자체 계단 표시만 대체하며 논리 cellHold0.62와 저장 정밀도는 보존한다.

- Grid 고정 최신 기준은 DESIGN_SYSTEM.md REF-60이다. 조작 중 실제 패널 위치/크기는 snapPanelPosition/snapPanelResize와 같은 정수 Grid 결과에 정확히 고정한다. REF-59의 raw pointer/smoothstep/visualCapture 표시 보간은 제거했으며 다시 도입하지 않는다. 부드러움은 입력 rAF 병합·preview 재사용·이웃/종료 모션에서 확보한다. 미리보기는 논리 Grid가 변한 경우에만 작은 overlay를 같은 paint에 확정하여 한 stop 늦게 표시되지 않게 한다.48열/12px 조작 stop·2px 저장 정밀도/기존 gutter·반대 모서리·충돌·Undo·저장과 사용자 미저장 탭은 보존한다.

- Dot/파란 배치 안내 기준은 DESIGN_SYSTEM.md REF-61이다. Dot은 간격 포함 Grid 셀 경계이므로 LayoutFootprint의 외곽선은 w×pitch / h×rowPitch 전체 셀 크기를 사용한다. gutter12px을 빼서 파란 선이 Dot 사이에 오도록 되돌리지 않는다. 실제 카드 크기·padding/gutter·저장 좌표는 유지하고 크기 안내에 카드 크기를 구분한다. REF-60의 조작 중 좌표 고정/동일 프레임 preview는 유지하며 셀과 outline의 실제 DOM rect 일치도 검증한다. 실제 사용 탭은 미저장0 확인 후 반영하고 조사용 배치는 원복한다.

- 미리보기/놓기 최신 기준은 DESIGN_SYSTEM.md REF-62다. 파란 선·빗금·크기 안내는 panelPixelRect가 계산한 **최종 실제 카드 border box**를 예측한다. REF-61의 간격 포함 셀 크기 외곽선을 복원하지 않는다. native outer 셀/gutter와 실제 카드 rect를 혼동하지 않는다. mouseup에서 배치를 다시 계산하지 않고 마지막 화면의 gesture.preview를 native items와 draft/Undo에 동일하게 확정한다. 실측은 drop 직전 렌더된 preview DOM rect와 drop 후 실제 카드 DOM rect의 x/y/w/h를 비교한다. data-wall-drop-preview는 다음 조작에서 지우는 단일 패널 DOM 진단이며 저장/전송하지 않는다. 기존 Grid·모션·데이터·일괄 저장/취소는 유지한다.

- 조작 중 키오스크/읽기 전용 전환은 DESIGN_SYSTEM.md REF-63을 따른다. readOnly 전환 시 진행 중 Drag/Resize와 pending 입력·Grid/footprint만 기존 abort 경로로 취소하고 이전 완료 draft/Undo는 보존한다. 전환을 drop·저장으로 처리하지 않는다. 자율 개발은 기존 사용자 index/미커밋 작업을 보존하는 관리 Worktree를 재사용하고 진행/커밋/검증은 docs/WALL_AUTODEV_PROGRESS.md에 기록한다.

- 05번 패널 편집 Workspace는 DESIGN_SYSTEM.md REF-64를 따른다. WallPanelEditor 프레임/로컬 shadcn Card·Base UI Tabs/Button을 사용하되 native Query/Transform/옵션/권한/저장·취소 모델을 유지한다. 다른 UID는 native fallback이다. Monaco 테마는 프레임 안에서 native 정의 함수와 setTheme로 동기화하고 편집 버퍼를 remount하지 않는다. 기존 48열/대시보드 배치/차트 스타일은 변경하지 않는다.

- 05번 native 패널 삭제는 DESIGN_SYSTEM.md REF-65를 따른다. DashboardScene.removePanel이 삭제한 ID의 Wall layouts/panelSources만 함께 정리한다. 다른 좌표·텍스트·복제본의 표시 원본 ID 값은 보존하며 native 취소는 패널과 메타데이터를 함께 복원한다. 다른 UID의 삭제와 쿼리/저장 API는 변경하지 않는다.

- 콘텐츠 높이는 DESIGN_SYSTEM.md REF-66을 따른다. 서버/legacy/draft/Undo 기준점과 진행 중 조작이 없는 미조작 기본 배치만 데이터 도착 후 높이를 갱신한다. WallEntityList는 행당 고정 추정 대신 실제 콘텐츠+공통 chrome 높이를 측정하고 기존 한도/큰 목록 스크롤을 유지한다. 자동 높이 측정은 Dirty를 만들거나 사용자 저장·Resize 크기를 덮어쓰지 않는다.

- 05번 긴 대시보드의 스크롤은 DESIGN_SYSTEM.md REF-67을 따른다. NativeScrollbar.scrollContainer opt-in으로 본문만 스크롤하며 같은 요소를 native 스크롤 저장/복원에 연결한다. 기존 다른 caller는 wrapper 없는 document 스크롤을 유지한다. Wall Shell overflow 제한은 승인 UID에만 적용하며 사이드바/공통 헤더와 키오스크 geometry를 유지한다.

- 편집·설정 화면의 최신 기준은 DESIGN_SYSTEM.md REF-68이다. 05번의 WallManagement 헤더/설정 왼쪽 탐색, 옵션 4영역과 Base UI Collapsible, 쿼리 작업부, 일반 폼 및 변수·주석·링크·버전 collection 구조를 사용한다. 외곽 Card만 추가한 이전 편집기로 되돌리지 않는다. native query/Transform/Field/Override/picker/권한·저장·복원 로직은 재사용하고 다른 UID는 native UI를 유지한다. 최초 편집 baseline에도 overlay/editPanel/editview를 넣지 않는다. 기능 테스트 통과를 전체 디자인 완성도 90점의 근거로 사용하지 않으며 실제 화면과 native로 남은 부분을 구분해 기록한다.
- 로컬 preview의 설정 원본은 `~/Library/Application Support/ABLESTACK/WallPreview/grafana.ini`에 보존하고 기존 launchd preview 서비스가 이 파일을 사용한다. 2026-10-31 임시 폴더 설정 파일 소실로 재시작 실패가 재현되어 기존 설정 그대로 위치만 보존했다. 런타임/DB/로그·3317/3318·localhost 바인딩·기존 인증 정책은 유지하며 새 환경 전환이나 운영 설정으로 사용하지 않는다.

- 편집 컨트롤의 접근성 기준은 DESIGN_SYSTEM.md REF-69다. 옵션 탐색은 local TabsContent로 실제 tab–tabpanel ID를 연결하고 현재 그룹이 없으면 사용 가능한 영역을 표시한다. 일반 설정의 툴팁 동기화·편집 허용 선택은 Base UI RadioGroup/Radio로 숫자·boolean native 값을 그대로 전달한다. 이 값 선택을 tabpanel 없는 Tabs로 되돌리지 않는다. 기존 Surface·타이포그래피·저장·Grid·다른 UID의 경로를 보존한다.

- 패널 편집 화면의 최신 구조는 DESIGN_SYSTEM.md REF-70이다. 사용자의 2026-11-01 직접 요청으로 05번 편집기는 큰 Canvas와 단일 Inspector(표현·데이터·패널 정보)로 변경한다. REF-68의 상하 preview/query 3분할을 이 UID에 복원하지 않는다. native data/options pane의 버퍼·descriptor·플러그인 캐시·저장/취소/권한을 재사용하고, 다른 UID와 대시보드 Grid는 변경하지 않는다. Dynatrace의 인컨텍스트 전체 대시보드 Details를 동일하게 구현했다고 표현하지 않는다.
