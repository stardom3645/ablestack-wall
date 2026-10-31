# Wall Modern Lite 디자인·컴포넌트 기준표

이 문서는 실제 구현과 검증의 기록이며, 다음 UI 작업 전에 읽고 변경 후 갱신한다.
사용자가 승인한 Stat 개선을 유지하며 현재 Workspace 범위는 **05. 스토리지센터 가상머신 상세 현황**
(UID `aec03x1adsi68f`) 하나이다. 기준표가 자동으로 다른 화면의 적용 범위를 넓히지는 않는다.
**대표 대시보드에서 공통 컴포넌트를 완성하고 검증한 뒤, 별도 요청으로 다른 대시보드에 확장한다.**
KPI 배치 조작의 최신 상태 전환 기준은 **REF-23**이다. REF-20/21의 클릭 편집 모드와 떠 있는 도구는 구현 이력이며 현재 동작 기준이 아니다.
최신 핸들 외형은 **REF-25 이중 ㄴ자**, 적용 범위는 **REF-26: 05번 5개 탭·59개 패널 전체**다. REF-24의 사각 아이콘은 후속 요청으로 대체됐다.
**REF-27: 레이아웃 편집은 현재 기능으로 안정화·동결한다. 명시적 재개 요청 전에는 기능/라이브러리 추가와 추가 고도화를 진행하지 않는다.**
**REF-30: 삭제했던 성능 추이·스토리지 요약은 Wall 텍스트 패널로 복원하고, 서비스 상태도 동일하게 대체한다.** REF-28의 삭제 선택은 사용자 정정으로 대체됐다.

**REF-32: 05번 패널 액션은 Wall 컨텍스트 도구 모음과 Base UI 메뉴를 사용한다. 기존 Grafana Dropdown은 이 Workspace에서 렌더링하지 않는다. 배치 엔진 동결은 유지한다.**

**REF-33: 사용자의 명시적 요청에 따라 개요 중앙의 성능 추이·사용률·스토리지 표시를 공유 48열 Grid로 연결한다. 성능 추이 확장 시 이웃 카드를 아래로 밀며, 나머지 영역과 탭의 배치 체계는 유지한다.**

**REF-34: Resize Light 선 색은 사용자가 직접 수정한 `#a3a3ad`가 최신 기준이다. REF-29/31의 이전 Light 색을 복원하지 않는다.**

**REF-35: 이동은 다른 패널 위로 충분히 들어가면 원래 두 자리를 교환하고, Resize는 기존 이웃 밀림을 유지한다. 드래그 미리보기는 시작 배치를 기준으로 계산하여 이웃 좌표가 누적해서 밀려나지 않게 한다.**

**REF-37: 교환이 확정되기 전의 작은 겹침으로 이웃을 미리 밀지 않는다. 잡은 패널은 native 픽셀 이동을 즉시 따르고, 이웃만 공통 180ms 전환을 사용한다. 위치 안내는 데이터 패널 트리와 분리하며 최초 배치 측정에는 이동 애니메이션을 적용하지 않는다.**

**REF-39: 기본은 탭 내부의 자유 배치다. 개요도 하나의 Grid이며 KPI·차트·사용률·스토리지·서비스·텍스트 사이의 고정 경계를 없앤다. 자원 사용률 32/38/40은 독립 패널이다. REF-33의 사용률 묶음과 REF-38의 그룹 제안은 현재 기본 구조가 아니다. 사용자 생성 그룹은 향후 별도 요청으로 다룬다.**

**REF-40: Wall 배치 편집은 완료된 이동·Resize를 작업 단위로 실행 취소/다시 실행한다. 상단 도구 모음과 Ctrl/Cmd+Z·Ctrl/Cmd+Shift+Z·Ctrl+Y를 제공하며 텍스트 입력의 기본 Undo를 가로채지 않는다. 기록과 최초 저장 기준은 탭 전환 동안 유지하고 저장 성공/전체 취소 때 해당 탭 기록을 비운다.**

**REF-41: Resize는 잡은 패널의 세로 위치와 반대쪽 모서리를 유지하고 이웃만 재배치한다. 이동 정렬은 18px 흡착/28px 해제, 자리 교환은 35% 진입/20% 유지로 안정화한다. 같은 줄·열의 크기가 다른 패널 교환은 전체 점유 범위와 간격을 보존한다. 원본 JSON·48열·저장/Undo 계약은 유지한다.**

**REF-42: 조작 중 Dot Grid는 패널 뒤의 빈 배경에만 표시한다. 패널 내용·그래프 위에 점을 덮는 전면 overlay는 사용하지 않는다. 점의 기존 진하기와 국소 빗금 안내는 유지한다.**

**REF-43: 05번 카드 표면은 surfaceTokens.ts의 반경 8px·선명한 중립 Border·단색/그림자 없음·가로 여백 16px을 기준으로 한다. 본문은 16px, 낮은 KPI/사용률/서비스/상태 집계는 세로 8px이다. 카드 간격 12px·섹션 간격 24px과 숫자/단위 기준선은 Light/Dark에서 같은 구조로 유지한다.**

**REF-45: 관리자의 다중 선택은 현재 탭에 한정한다. Ctrl/Cmd 또는 Shift+클릭으로 추가/해제하고, 패널 작업 영역에서 Ctrl/Cmd+A로 전체 선택, Esc로 해제한다. 선택만으로 Grid/dirty를 만들지 않으며 함께 이동은 상대 위치를 보존해 Undo 한 작업으로 기록한다. 저장되는 그룹·복제·삭제·일괄 Resize 기능으로 설명하지 않는다.**

**REF-46: 이동/Resize 중 강조 윤곽은 놓일 위치의1px 실선 하나다. 선택 marker·잡은 카드 테두리·native placeholder glow를 함께 그리지 않는다. 평상시 선택선은 카드 경계 안쪽에 겹쳐 그려 이중 테두리를 만들지 않는다. 배경 Dot·단일 패널 빗금·다중 선택/기존 배치 동작은 유지한다.**

**REF-47: 05번 카드 표면은 Soft Depth 토큰을 따른다. 반경8px·배치/내부 여백은 유지하고 카드에만 아주 약한 단일 Shadow를 적용한다. Text 섹션은 투명/무그림자이며 Hover·선택은 카드 전용 Border/Shadow로 구분한다. 차트가 쓰는 기존 surface/border/shadow/text 토큰과 패널 전용 토큰을 섞지 않는다. REF-43의 카드 무그림자 기준은 이 사용자 요청으로 대체됐다.**

**REF-48: 정지 상태의 선택선은 공통 selectionStroke=2px, offset=-2px로 카드 안쪽에 그린다. REF-46의 이동/Resize 중 놓일 위치1px 실선·중복 윤곽 제거는 그대로 유지한다.**

**REF-49: Hover/focus는 이동·더보기의 간결한 컨트롤과 기존 Resize 핸들만 표시한다. 보기·공유를 포함한 전체 패널 툴바는 선택된 패널에만 표시하며 다중 선택에서는 마지막 선택 하나가 액션 대상이다. Hover의 더보기에도 native 작업 전체를 남기고, 조작 중 잡은 핸들의 표시 구조는 종료까지 유지한다.**

**REF-50: 최신 패널 조작은 A-Hybrid다. 플로팅 dock/선택 시 확장 툴바를 제거하고 실제 헤더의 좌측 Grip·제목·우측 더보기 슬롯을 사용한다. 28px hit area를 미리 확보해 Hover/Focus에도 제목 위치·패널 크기를 바꾸지 않는다. 작업은 native 권한 메뉴로 통합하며 Text는 투명 표면을 유지한다. Resize는 우측 하단의 이중 ㄴ자 하나이며 선을 경계에서6px 안쪽에 둔다. 클릭/누름에는 배치 안내를 표시하지 않고 실제6px 이동/Resize 중에만 표시한다. REF-49의 선택 툴바와 REF-36의 누름 즉시 빗금은 이 사용자 요청으로 대체된다.**

**REF-51: 05번 모션은 motion.css 공통 토큰을 따른다. Hover 피드백120ms·메뉴 진입160ms/퇴장100ms·이웃 배치200ms이며 overshoot 없이 빠르게 정착한다. 잡은 패널/Resize/배치 안내는 포인터를 즉시 따르고, 최초 측정·키보드 도구 표시는 지연하지 않는다. reduced-motion에서는 포털 팝업 자체를 포함해 전환을 끈다. 데이터/숫자/차트 경로에는 애니메이션을 추가하지 않는다.**

**REF-52: 05번은 기존 직접 조작/A-Hybrid/48열/모션을 유지한다. 일반·키오스크는 같은 Workspace와 좌표를 사용하고 키오스크는 조작 UI만 숨긴다. 상단은 native 대시보드 설정, 개별 편집은 native 패널 편집기다. Wall 배치/텍스트는 dashboard.wallModern(version1)에 보존하여 기존 Grafana 저장 창·서버 저장·버전 관리·이탈 확인과 연결한다. LocalStorage는 기존 배치 이전용 초기값일 뿐 영구 저장으로 표현하지 않는다. 이번 명시적 요청은 REF-26/39/40의 로컬 저장 제한과 원본 JSON에 Wall 메타데이터를 쓰지 않던 기준을 대체하며, native panels/gridPos/쿼리/단위는 그대로 보존한다.**

## 벤치마킹 원칙 — REF-22 (2026-10-28)

**Dynatrace처럼 사용하기 편하면서도 외형은 명확하게 ABLESTACK Wall인 제품을 만든다.**
단일 제품의 화면을 옮기지 않고, 여러 제품의 장점을 Wall의 한 가지 디자인 체계로 재구성한다.
이 원칙은 이전 REF-09/20/21의 외형·배치 참고 기록보다 우선하며, 이미 검증한 기능과 데이터 보존 조건은 유지한다.

| 참조 대상 | 참고할 가치 | Wall 적용 기준 | 그대로 옮기지 않을 것 / 확인 경계 |
| --- | --- | --- | --- |
| Dynatrace | 직접 조작, Hover 피드백, 패널 이동·크기 조절 | 선택과 조작 가능 상태를 명확히 하고, 드래그 중 격자·배치 미리보기로 결과를 예측 가능하게 한다 | 툴바 위치, 아이콘 배열, 선택 테두리, 메뉴 형태의 조합을 그대로 복제하지 않는다. REF-21의 실제 데모 조작은 동작 관찰 근거이며 Wall 외형의 승인 근거가 아니다 |
| Grafana | 시계열 탐색과 데이터 분석 | 기존 렌더러·쿼리·시간 탐색·Hover·Zoom·범례 상호작용을 보존한다 | 기존 관리 화면의 외형을 독립 제품의 디자인 기준으로 삼지 않는다 |
| Datadog | 모니터링 정보 밀도와 상태 표현 | 중요 수치·단위·상태를 빠르게 구별하도록 정보 위계를 구성한다 | 이번 요청은 참조 방향의 지정이며 새 사이트 실사나 특정 UI 구현 검증을 완료했다는 뜻은 아니다 |
| Linear / Notion | 절제된 컨텍스트 액션과 메뉴 | 선택한 대상과 작업 범위를 명확히 하고, 핵심 조작과 보조 작업을 구분한다 | 특정 제품의 메뉴 배치·스타일·아이콘 조합을 복제하지 않는다. 이번 요청에서 새 사이트 실사는 수행하지 않았다 |
| shadcn/ui + Base UI | 실제 컴포넌트와 디자인 시스템 구현 | 로컬 shadcn 구성과 실제 Base UI primitive를 사용하고 Wall 공통 토큰에 연결한다 | 외부 제품 외형의 복제 근거로 삼지 않는다. 기존 실제 import 표를 유지하며 사용하지 않은 primitive를 사용했다고 기록하지 않는다 |

컨텍스트 액션은 먼저 **선택한 대상·수행할 작업·저장 범위**를 Wall의 명칭과 정보 위계로 정한 뒤 배치한다.
타일 바로 위 툴바를 기본 해법으로 고정하지 않으며, 도구 위치·순서·선택 표시·메뉴를 함께 검토한다.
아이콘이나 색만 바꾸고 참조 제품의 특징적인 구성을 유지하는 것으로 차별화를 충족했다고 판단하지 않는다.
선택과 Hover는 조작을 안내하는 피드백으로 사용하고, 과도한 장식이나 불필요한 상시 액션을 늘리지 않는다.
색·폰트·여백·모서리·카드 외형은 기존 Wall 토큰, `typography.ts`, 승인된 compact 카드 기준을 재사용한다.

| REF-22 기록 당시 구현 검토 | 상태 / 후속 반영 |
| --- | --- |
| KPI 선택 카드 위의 floating 도구 및 선택 외곽선 | 당시 최종 디자인 표준으로 고정하지 않기로 결정했다. 이후 REF-23에서 floating 도구를 제거하고, 조작 중에만 선택 강조를 표시하도록 변경했다 |
| 직접 선택·상단 편집 공통 진입, 선택 카드의 핸들, 격자·미리보기, 저장·취소 | 검증된 동작을 보존한다. 외형 변경을 이유로 기능을 다시 개발하거나 저장 범위를 확대하지 않는다 |
| 이번 반영 범위 | 사용자 원칙과 실제 소스 검토를 기준으로 문서·작업 지침만 갱신했다. UI 코드·import·CSS·JSON은 변경하지 않았으며 새 브라우저 검증은 수행하지 않았다 |

## 디자인 참조와 적용 결정

| 기준 ID | 참조 | 적용 결정 | 실제 적용 위치 | 상태 |
| --- | --- | --- | --- | --- |
| REF-01 | 사용자가 첨부한 ABLESTACK Wall 통합 모니터링 대시보드 이미지 | 제품 셸, 푸른 회색 표면, ABLESTACK 브랜드와 한글 제목 | `WallChrome.tsx`, `modern.css` | 기존 구현 유지 |
| REF-02 | 사용자가 첨부한 2번 이미지의 Revenue 카드 | 남색 수치, 작은 단위, 왼쪽 정렬, 은은한 그림자, 실제 매핑에 따른 상태 배지 | `StatCardPresentation.ts`, `statPresentation.ts`, `StatPanel.tsx` | 사용자 승인, 유지 |
| REF-03 | [Tailkits shadcn/ui Dashboard](https://tailkits.com/templates/shadcn-ui-dashboard/) | 상단 탐색 탭, 독립 KPI Card, 넓은 차트 영역과 보조 요약 영역, Section 간 위계와 여백 | `workspace/DashboardWorkspace.tsx` | 시범 구현. 공개 미리보기만 참조하며 유료 템플릿 소스는 사용하지 않음 |
| REF-04 | [shadcn/ui Base Tabs](https://ui.shadcn.com/docs/components/base/tabs), [공식 소스](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/tabs.tsx) | Root/List/Trigger/Content 구성과 실제 Base UI의 선택·키보드·ARIA 동작 | `components/ui/tabs.tsx` | MIT 소스 구성에서 Wall 스타일로 조정 |
| REF-05 | [shadcn/ui Card 공식 소스](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/card.tsx) | Card/Header/Title/Description/Content의 로컬 소스 구성 | `components/ui/card.tsx` | MIT 소스 구성에서 Wall 토큰과 의미 있는 제목 태그로 조정 |
| REF-06 | Netdive `AppStyles.ts`, `NetdiveAntdProvider.tsx`; Mold `tokens.less` | 제품군 기본색 `#1677ff`, 푸른 회색 경계선, 일관된 Light/Dark 의미 토큰 | `modern.css`, `visualization.ts`, `statPresentation.ts` | 2026-10-27 소스에서 기본색·중립색 재확인. 제품 간 자동 동기화 패키지는 아직 없음 |
| REF-07 | [Tailkits shadcn/ui Dashboard](https://tailkits.com/templates/shadcn-ui-dashboard/), 사용자가 첨부한 SaaS 차트 이미지 | 청색·청록·보라 중심의 시리즈, 낮은 채우기, 절제된 수평 그리드, 숫자 정렬과 읽기 쉬운 툴팁. 수치·보간·분석 동작을 장식에 맞춰 바꾸지 않음 | `chartTokens.ts`, `timeSeriesPresentation.ts`, 공통 `TimeSeriesPresentation.ts` | 대상 UID의 Time series에만 적용. 유료 코드/새 차트 엔진 사용 없음 |
| REF-08 | [shadcn/ui Base Popover](https://ui.shadcn.com/docs/components/base/popover), [공식 소스](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/popover.tsx) | Root/Trigger/Portal/Positioner/Popup 구성. 로컬 shadcn Button과 함께 사용 | `components/ui/popover.tsx`, `toolbar/*` | Base UI 1.0.0 API 유지. Toolbar의 이전 2단 Card 외형은 REF-09로 대체 |
| REF-09 (Toolbar 밀도·구조 참고) | 사용자 첨부 6개 Toolbar 이미지: [기본형](design-references/toolbar-overview.png), [객체 팝오버 — 2번 이미지](design-references/toolbar-objects.png), [필터](design-references/toolbar-filters.png), [시간](design-references/toolbar-time.png), [갱신](design-references/toolbar-refresh.png), [설정](design-references/toolbar-settings.png) | 32px 컨트롤, 42px 바깥 묶음, 4px 간격과 얇은 경계. 객체/필터 → 시간+이전·다음 → 갱신 → 정보. 보조 작업은 별도 그룹. 팝오버는 낮은 헤더·넓은 입력·32px 목록. 기능을 전부 복제하지 말라는 사용자 지침에 따라 기존 변수/시간 기능에만 연결 | `toolbar/WallDashboardToolbar.tsx`, `WallScopeControl.tsx`, `WallTimeRangeControl.tsx`, `toolbar.css` | 2단 Card 제거. Node/Edge 필터 엔진·별도 Settings 화면 추가 없음. 원본 참조 PNG는 개발 기록으로 보관하며 런타임 UI에 import하지 않음 |
| REF-10 (REF-11로 변수 표현 대체) | 2026-10-27 사용자 피드백: 큐브 단독 객체 버튼은 복제 수준이라 거부 | 참조의 컴팩트한 밀도는 유지하되, Wall 가상머신 메뉴와 같은 Cpu 아이콘·파란 의미 표면·가상머신 한글 명칭으로 재설계. 특징적인 아이콘 단독 외형을 그대로 옮기지 않음 | `toolbar/WallScopeControl.tsx`, `toolbar.css` | REF-09의 외형 충실 복제 요구보다 최신 피드백 우선. 이후 디자인도 Wall의 의미와 식별성을 먼저 검토 |
| REF-11 (동적 변수 원칙 유지) | 사용자 첨부 변수 행: 대상·로그 레벨·로그 파일·검색, vm 선택값. 변수는 향후 추가/삭제 가능 | 고정 가상머신/필터 버튼 제거. 기존 variableControls와 VariableValueSelectors를 직접 렌더링해 변수 label/name·순서·현재 값·입력 타입·숨김 설정 유지. 원래 Query/Custom/TextBox 등 변수 구현·의존성·URL 동기화 재사용 | `toolbar/WallScopeControl.tsx`, `toolbar.css` | 새 primitive로 변수 엔진을 대체하지 않음. 이 영역은 native Scenes 컨트롤 + Wall CSS; shadcn/Base UI는 기존 시간/갱신/정보 영역에서 사용. 대표 UID만 적용 |
| REF-12 (Toolbar 기준 유지) | 사용자 요청: 통합 변수 드롭다운, 자원 아이콘 + 보조 변수명 + 강조 선택값 + ChevronDown | MultiValueVariable만 로컬 shadcn Button/Popover 기반 통합 트리거로 표시. 미선택/전체/첫 값 외 N개 요약. TextBox/AdHoc/알 수 없는 타입은 native 입력 유지. 시간과 같은 32px 높이와 토큰 | `toolbar/WallVariableControl.tsx`, `WallScopeControl.tsx`, `toolbar.css` | CSS만 덮지 않고 트리거 React 구조 교체. 실제 옵션·선택·검색·멀티 blur commit·오류·로딩은 native VariableValueSelectWrapper 유지. 고정 scvm/객체 종류 없음 |
| REF-13 (개요 표시 기준) | 기존 SaaS 참조 REF-01/02/03/07 및 사용자 요청: 개요의 KPI·성능·사용률·서비스 차별화 | 개요 21개 패널만 Wall 소유 Header/Title/아이콘/메뉴 버튼 슬롯으로 구성. KPI 강조 면, 시계열 중립 차트 면, 공통 사용률 그룹, 스토리지 inset, 서비스 소형 상태 타일. 승인된 Stat 값/배지 유지 | `workspace/overviewPresentation.tsx`, `overview.css`, `DashboardWorkspace.tsx` | 5개 탭/59개 패널/저장 JSON 유지. 개요 밖에는 Context 공급 없음. 변수 빈 값 제약은 수정하지 않음 |
| REF-14 (05 Typography 기준) | [Pretendard v1.3.9](https://github.com/orioncactus/pretendard/tree/v1.3.9), [Inter v4.1](https://github.com/rsms/inter/tree/v4.1), 기존 Wall 제품군 참조 | 고유 CSS family Wall Inter(영문·숫자) → Wall Pretendard(한글)로 혼합. 자체 호스팅 가변 WOFF2·font-display swap·tnum·공통 역할 토큰을 HTML/Canvas에 공급. 폰트 완료 후 Canvas config 재구성 | `typography.ts`, `typography.css`, `public/fonts/wall/*`, 공통 표시 어댑터 | 05 UID에만 opt-in. 기존 글로벌 Inter face/다른 UID의 family 미변경. 두 파일과 OFL 라이선스·핀된 source/SHA를 배포물에 포함 |
| REF-15 (현재 표시 방식 기준) | 사용자의 Dashboard Visualization Redesign 요청: 05번 전체 5개 탭의 데이터 의미에 따른 표시 재설계 | 시계열 35개는 기존 렌더러/스타일 유지. Stat 15·Gauge 3·Table 6은 Workspace에서만 Wall 데이터 표시 컴포넌트로 교체. 반원→수평 비교, 용량 관계, compact 서비스 목록, 파일시스템/OSD/NIC/PG 엔티티 목록. 기본 KPI 장식 제거 | `visualizations/model.ts`, `WallPanelContent.tsx`, `visualizations.css`, Workspace 투영 | 최신 요청에 따라 REF-13의 개요 한정 표시 범위를 05번의 5개 탭으로 확장. 다른 UID로 확대하지 않음. 저장된 59개 패널 ID·타입·쿼리·필드 설정·변환은 그대로 |
| REF-16 (핵심 자원·사용률 밀도) | 사용자 요청: 광택·파란 강조선 제거, 220~280px compact KPI와 한 카드의 Usage Bar | KPI 최대 260px·96px 높이·32px 제목·12px grid 간격, 좌측 정렬. 단색 surface/1px border/기존 약한 shadow. 사용률 64px 행·25px 수치/13px 단위·5px 둥근 막대 | `workspace/compactResourceTokens.ts`, `DashboardWorkspace.tsx`, `overviewPresentation.tsx`, `overview.css`, `visualizations/WallPanelContent.tsx`, `visualizations.css` | 05 개요의 28/30/34/36과 32/38/40만. 서비스·스토리지·시계열 스타일 유지. REF-13의 KPI/사용률 gradient 및 REF-15의 128px/52px 밀도를 대체 |
| REF-17 (파일시스템 밀도) | 사용자 요청: 파일시스템 정보의 단일/소수 값은 Compact Information, 복수 행은 compact Table | 한 행은 Key-Value dl, 복수 행은 모든 frame/field를 합친 짧은 table. 측정된 콘텐츠 높이 + 기존 chrome 여백으로 104~360px 자동 산정. 단일 지표는 최대 280px, 소수 Key-Value는 최대 560px 폭. 하단 native frame 선택기 없음 | `visualizations/WallFilesystemInfo.tsx`, `filesystem.css`, `WallPanelContent.tsx`의 filesystem 분기 | panel 244에만 적용. 쿼리·변환·필드명·단위·JSON 미변경, 다른 목록과 시계열 유지 |
| REF-18 (Device Capacity View) | 사용자 요청: Glue 사용률 panel 246의 실제 DataFrame/단위 확인 후 디바이스별 통합 표시 | 같은 transformed row의 디바이스·전체·사용·비율만 하나의 compact 행에 표시. 얇은 연속 Capacity Bar, 원래 formatter/임계치/링크 유지. 별도 frame은 이름/행 순서로 추측 join하지 않음 | `visualizations/WallDeviceCapacityView.tsx`, `deviceCapacity.css`, `WallPanelContent.tsx`의 devices 분기 | 05 panel 246만. 원본/쿼리/변환/JSON 미변경, missing/비정상/불일치는 원본+원인 표시 |
| REF-19 (Glue 상태 요약 정렬) | 2026-10-28 사용자 첨부: 상태 수치가 카드 경계에 붙는 문제 | panel 138의 본문 padding 0 → 좌우 14px/하단 12px, 4열 grid, 기존 gauge 숫자 토큰으로 위계 강화. inset 그림자 제거/단색 surface | `visualizations/visualizations.css`의 panel 138 범위 | CSS 정렬 수정만. 렌더러·기능·값·색·JSON 변경 없음. NIC 상태/Root 용량/다른 패널 미변경 |
| REF-20 (KPI 간편 배치 시범) | 사용자 요청: Dynatrace 방식의 선택 핸들/격자/미리보기/저장·취소 | 관리자+원래 canEdit 권한, 핵심 자원 4개만. 기존 Grid 엔진으로 48열 자유 이동/resize, 선택 핸들·px/격자 크기, 브라우저 로컬 저장·취소 | `workspace/KpiLayoutPilot.tsx`, `kpiLayout.ts`, `kpiLayout.css`, Workspace 연결 | Dashboard JSON/Scenes state 미변경. 일반 조회자는 기존 grid. 새 드래그 라이브러리/전체 편집기 없음. 다른 관리자·브라우저와 저장 동기화 없음 |
| REF-21 (직접 타일 선택·진입 경로 수정) | 사용자 첨부 및 실제 Dynatrace Playground 조작: 선택 시 떠 있는 도구/양쪽 resize, 점 격자·스냅·주변 재배치 | 관리자 KPI 직접 클릭 또는 상단 편집 → 동일한 inline 모드. 선택 카드만 상단 배치 도구와 SW/SE 핸들 렌더. 비활성 핸들 DOM 제거. 전체 편집은 별도 메뉴 | `KpiLayoutPilot.tsx`, `kpiLayout.css`, `StorageDashboardWorkspace.tsx`, `DashboardWorkspace.tsx`, `toolbar/WallDashboardToolbar.tsx` | REF-20의 별도 버튼 중심 진입보다 우선. 실제 사용 탭의 초기 조회·직접 클릭·상단 편집·이동/양쪽 resize/취소 검증. JSON/쿼리/데이터 미변경 |
| REF-22 (벤치마킹 통합 원칙) | 2026-10-28 사용자 지침: Dynatrace UX / Grafana 분석 / Datadog 밀도·상태 / Linear·Notion 컨텍스트 액션 / shadcn·Base UI 구현 | 여러 제품의 장점을 Wall 고유 컨텍스트 액션과 기존 토큰·타이포그래피·카드 체계로 통합. Dynatrace 툴바 위치·아이콘 배열·선택 테두리·메뉴 형태를 그대로 복제하지 않음 | 이 문서의 벤치마킹 원칙 표, 루트 `AGENTS.md` | 이후 디자인 판단의 우선 기준. 현재 KPI floating 도구는 재검토 대상으로 기록. 이번 반영은 문서만 변경하며 구현 완료로 간주하지 않음 |
| REF-23 (직접 조작과 미저장 변경 분리) | 사용자 요청 및 첨부한 어색한 대각선 Resize 아이콘: 클릭/Hover는 조회 유지, 실제 조작 때만 격자, 변경이 있을 때만 저장·취소 | 관리자 KPI 4개에 Hover/focus 핸들. 마우스 6px 임계값 이후 기존 Grid 엔진으로 이동/Resize. 종료 시 격자·미리보기·크기·강조 제거. floating 도구/기본 배치/전체 편집 상태 제거. 화살표 대신 작은 모서리 그립 | `workspace/KpiLayoutPilot.tsx`, `kpiLayout.ts`, `kpiLayout.css`, `kpiLayout.test.tsx` | REF-20/21의 클릭 편집 진입·상시 격자·도구 위치를 대체. 48열 좌표/실제 카드 크기·간격/로컬 저장 계약 유지. 패널 디자인·데이터·차트·다른 UID 미변경 |
| REF-24 (Wall 사각 Resize 핸들) | 사용자 첨부: 기존 L자 표시는 빈약함. 후속 정정: 이중 대각선은 Dynatrace 외형이므로 거부 | 20px 사각 프레임 안에 작은 사각 윤곽과 모서리 조절점, 24px 조작 영역. Wall surface/border/text/primary/radius/shadow 토큰, 핸들 Hover/조작 시 파란 강조. 좌우는 조절 방향에 맞게 반전 | `workspace/kpiLayout.css`의 기존 handle/corner-grip | CSS 표시만 변경. 이중 대각선 시안은 폐기하며 최종 적용으로 기록하지 않음. REF-23의 임계값·상태·엔진·저장 계약 유지 |
| REF-25 (이중 ㄴ자 Resize 핸들) | 최신 사용자 정정: 선의 가독성은 참조하되, Wall은 대각선 대신 모서리에 맞는 두 겹의 ㄴ자 | 사각 버튼 외곽/내부 사각 아이콘 제거. 12px·7px 직각 선 2겹, 1.7px stroke, 좌우 반전. 기존 Wall text/primary 색·24px hit area·Hover/focus/조작 상태 유지 | `workspace/kpiLayout.css`의 corner-grip/pseudo-element | REF-24 외형 대체. 이전의 빈약한 단일 L자 복원이 아니다. 대각선/화살표/타 제품 툴바 복제 없음 |
| REF-26 (05번 전체 직접 조작 확장) | 사용자 요청: 상단 KPI에서 검증한 조작을 05번 전체 패널에 적용 | 공통 PanelLayoutGrid + 기존 CSS 배치 측정 투영, 기존 탭/섹션 안에서 59개 모두 이동/Resize. 임계값/조작 중 안내/실제 변경 후 저장·취소 재사용. 탭 전환 시 미저장 상태 보존 | `workspace/PanelLayoutGrid.tsx`, `WorkspacePanelLayout.tsx`, `panelLayout.ts`, `DashboardWorkspace.tsx`; 기존 `KpiLayoutPilot.tsx`는 호환 wrapper | 05 UID 관리자+canEdit만. 48열·기존 KPI 저장 계약 유지, 다른 영역은 탭/섹션별 표시 좌표 키. JSON/쿼리/변환/단위/패널 타입/권한 미변경. 다른 UID 확대 없음 |
| REF-27 (배치 기능 안정화·동결 / KPI 정렬) | 사용자 요청: 클릭/Hover의 상시 Grid 방지, 조작 중에만 안내, 저장·복원 유지 및 좌측 치우침 수정. 이후 배치 고도화 중단 | 일반 상태 Grid 명시적 제거. 핸들에서 시작한 gesture만 인정하고 창 이탈·버튼 해제 누락·pointer/touch cancel 시 진행 중 조작만 복구. KPI 본문 6px → 제목과 동일한 공통 14px padding | `workspace/PanelLayoutGrid.tsx`, `kpiLayout.css`, `kpiLayout.test.tsx`, `visualizations/visualizations.css` | 기능/라이브러리 추가 없음. 59개/기존 저장 계약/원본 JSON 유지. 미저장 기존 사용자 탭은 보존하고 이전 구현이 남은 검증 탭만 갱신. 명시적 요청 전 배치 기능 동결 |
| REF-28 (고정 섹션 문구 삭제) | 사용자 지적: 성능 추이/CPU·메모리·네트워크·디스크 및 스토리지 요약이 실제 패널이 아닌 고정 문구인지 확인, 삭제 또는 텍스트 바 대안 | 실제 Dashboard JSON 패널이 아닌 WorkspaceSection의 JSX 고정 제목·설명임을 확인. 두 곳을 제목 없는 기존 section 레이아웃 wrapper로 변경하여 표시 문구 삭제 | `workspace/DashboardWorkspace.tsx` | 05 개요만. 21개 패널/4개 uPlot·기존 grid 영역·저장 키·쿼리/JSON 유지. 새 텍스트 패널/편집 기능 추가 없음. REF-27 동결 유지 |
| REF-29 (Resize 선 색·굵기) | 사용자 요청: 이중 ㄴ자 모양은 유지하고 선/색은 앞서 첨부한 Dynatrace 핸들과 동일하게 | 참조 PNG의 선 중심 픽셀 RGB(43,44,51)=#2b2c33을 Light 토큰으로 적용. Dark는 대비를 위한 중립 #c9cad1. 양쪽 직각 선 2px, Hover/조작 시 파란색 전환 제거 | `modern.css`의 --wall-resize-color/--wall-resize-stroke, `workspace/kpiLayout.css` | CSS 표시만 수정. 12px·7px 이중 ㄴ자 및 조작 기능/상태/저장 유지. 공식 Dynatrace 토큰이 아닌 사용자 제공 이미지의 픽셀 기준. REF-27 동결 유지 |
| REF-30 (고정 문구를 텍스트 패널로 대체) | 사용자 정정: 삭제가 아니라 텍스트 패널로 교체. 서비스 상태도 같은 방식으로 변경 | 성능 추이/스토리지 요약/서비스 상태를 WallTextPanel로 구성. 제목·설명 편집/취소/저장, 내용 재로드, 기존 이동/Resize 재사용. 48px 기본 텍스트 바·Wall 토큰·안쪽 컨텍스트 액션 | `workspace/WallTextPanel.tsx`, `textPanel.css`, `DashboardWorkspace.tsx`, `WallTextPanel.test.tsx` | 원본 데이터 59개와 별도의 표시 텍스트 3개. 브라우저 로컬 저장이며 Grafana JSON에 text 플러그인을 추가한 것이 아님. 사용자 요청 범위의 대체만 수행, 다른 레이아웃 기능 확장은 동결 유지 |
| REF-31 (실제 사용 탭의 이전 색상 갱신) | 최신 사용자 참조 `codex-clipboard-8e8fefb2-9136-4d4e-8448-ac8e68ed67bc.png`: 이 색 그대로 적용 | 새 PNG의 선 중심 RGB(43,44,51)=#2b2c33으로 REF-29와 같음. 실제 사용 탭은 이전 RGB(21,35,59)/1px가 남아 있었음. 5개 탭 미저장 0 확인 후 실제 탭 갱신, Light 복원 및 양쪽 RGB(43,44,51)/2px 확인 | 실제 localhost 3317 사용 탭, 기존 resize 토큰 | 제품 코드/모양/동작/저장 변경 없음. 별도 검증 탭의 결과만으로 사용자 탭 반영을 주장하지 않는 검증 기준 추가 |

## 실제 컴포넌트와 import 경로

경로는 저장소 기준이다. `@/components/ui/*`라는 가상 경로를 이 저장소에서 사용한다고 주장하지 않는다.

| 구현 분류 | 실제 컴포넌트 | 실제 import | 역할 / 경계 |
| --- | --- | --- | --- |
| shadcn/ui 로컬 컴포넌트 | Tabs, TabsList, TabsTrigger, TabsContent | `../components/ui/tabs` (Workspace에서) | 기존 Row 대신 탭 패널을 실제로 구성 |
| Base UI primitive | Tabs.Root, Tabs.List, Tabs.Tab, Tabs.Panel | `@base-ui/react/tabs` (`components/ui/tabs.tsx`에서) | 선택 상태, ARIA 연결, 키보드와 비활성 패널 수명 관리 |
| shadcn/ui 로컬 컴포넌트 | Card, CardHeader, CardTitle, CardDescription, CardContent | `../components/ui/card` | 실제 React Card 트리로 KPI·차트·사용률·요약 영역 구성. Base UI Card는 존재한다고 가정하지 않음 |
| Wall 전용 구성 | DashboardWorkspace, WorkspaceSection | `./DashboardWorkspace` | Section은 Wall이 소유한 의미 있는 HTML `section` + 제목이며 외부 라이브러리로 가장하지 않음 |
| Wall 연결 계층 | StorageDashboardWorkspace | `app/features/wall-modern/workspace/StorageDashboardWorkspace` | 저장된 Row/패널을 변경 없이 화면 구성으로 투영 |
| 기존 Base UI 사용 | Button, Menu, 기존 목록 Tabs | `@base-ui/react/button`, `@base-ui/react/menu`, `@base-ui/react/tabs` | 제품 셸/목록의 기존 구현 유지. 이번 Workspace에서 새로 구현한 기능과 구별 |
| Grafana 렌더러 재사용 | VizPanel.Component, activateInActiveParents | `@grafana/scenes`, `app/features/dashboard-scene/utils/utils` | 동일 패널 객체·query runner·변수·field config·메뉴·툴팁을 사용. 새 시각화 엔진이 아님 |
| CSS 조정만 해당 | Card 안의 native PanelChrome 테두리·외곽 여백 정리 | `modern.css`의 `.wall-dashboard-workspace` 범위 | 중첩 테두리를 없애는 표현 조정. 이것을 shadcn 컴포넌트 구현이라고 설명하지 않음 |
| 기존 Stat 표현 | getStatCardPresentation, StatCardPresentationContext | `@grafana/ui/src/components/BigValue/StatCardPresentation` | 승인된 Stat 표현을 유지. Workspace 구조와 별개 |
| Wall 시계열 어댑터 | presentTimeSeriesFrames | `app/features/wall-modern/timeSeriesPresentation` (`TimeSeriesPanel.tsx`에서) | field config의 화면용 복사본에만 팔레트·자동 포인트·선·채우기 반영. 원래 values/쿼리/저장 모델 유지 |
| 기존 시계열 엔진 | TimeSeries → GraphNG → uPlot, PlotLegend, TimeSeriesTooltip | `app/core/components/TimeSeries/TimeSeries`, `@grafana/ui/src/components/uPlot/PlotLegend` | 기존 축 스케일·결측·범례 클릭·확대·툴팁·주석 동작 재사용. shadcn/Base UI 차트라고 부르지 않음 |
| 공통 표현 계약 / CSS 조정 | TimeSeriesStyleConfigContext, TimeSeriesPresentationContext, 스타일 함수 | `@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation` | 설정 Context는 TimeSeriesPanel만 읽고 유효 Context는 그 내부에만 제공. 축/그리드는 uPlot 설정, 범례/툴팁/커서는 토큰 기반 Emotion 표현이며 새 UI primitive가 아님 |
| shadcn/ui 로컬 구성 | Popover / PopoverTrigger / PopoverContent, Button | `../components/ui/popover`, `../ui` | 별도 Wall Toolbar React 트리와 팝오버 구성. Toolbar는 Card를 사용하지 않으며 Workspace Card는 그대로 유지. 기존 Grafana 버튼에 CSS만 덮어쓰는 구성이 아님 |
| Base UI 실제 primitive | Popover.Root/Trigger/Portal/Positioner/Popup; Menu.Root/Trigger/RadioGroup/RadioItem | `@base-ui/react/popover`, `@base-ui/react/menu`; Button은 `@base-ui/react/button` | 팝오버와 갱신 메뉴의 열기/닫기·포커스·Escape·선택 상태 담당 |
| 기존 시간·갱신 기능 재사용 | TimePickerContent, TimePickerButtonLabel, useTimeSync; SceneTimePicker / SceneRefreshPicker | `@grafana/ui/src/components/DateTimePickers/TimeRangePicker/TimePickerContent`, `@grafana/scenes` | 입력·시간대·회계연도·주 시작일·이력·URL 동기화·이동/확대·자동 갱신·쿼리 취소 유지. 날짜 입력 내부는 native UI임을 구분 |
| Wall 연결 / 구조 교체 | WallDashboardToolbar / WallTimeRangeControl | `app/features/wall-modern/toolbar/WallDashboardToolbar` (`DashboardSceneRenderer.tsx`에서) | 대상 Workspace만 기존 Controls 대신 렌더링. AppChromeUpdate로 기존 상단 액션을 비워 중복 제거. 편집·전체 화면 등은 native 도구로 복귀 |
| 변수 연결 / 구조 교체 | WallScopeControl, WallVariableControl, VariableValueSelectWrapper | `./WallVariableControl`, `../components/ui/popover`, `../ui`, `@grafana/scenes` | 동적 variableControls 유지. 선택형 변수만 통합 트리거 + native 선택기를 구성하고 다른 타입/주석 컨트롤은 원래 UI 유지 |

설치 버전은 `@base-ui/react` **1.0.0**, React **18.2**, Tailwind **3.4.17**이다.
최신 참조 사이트가 Tailwind 4를 사용해도 이 작업에서 전체 Grafana 빌드를 업그레이드하지 않는다.
shadcn/ui는 단일 런타임 패키지 import가 아닌 로컬 소스로 사용한다. 원본 구성의 MIT 라이선스는
`components/ui/SHADCN-LICENSE.txt`에 보관한다.

## 지속적으로 유지할 시각 규칙

| 항목 | 공통 기준 | 소유 파일 |
| --- | --- | --- |
| 기본색·표면·경계·텍스트 | `--wall-primary`, `--wall-surface`, `--wall-border`, `--wall-text`, `--wall-muted` 사용 | `modern.css` |
| Stat 숫자·단위·상태 | 승인된 Stat 토큰 유지. 상태는 실제 mapping에서만 배지로 표현 | `statPresentation.ts`, 공통 Stat 어댑터 |
| Workspace Card | 의미별 Card + Header/Content, 14px 모서리, 기존 제품 토큰의 테두리·그림자 | `components/ui/card.tsx`, `modern.css` |
| 탐색 | 개요 / 네트워크 / 스토리지 / Glue 디바이스 / 프로세스의 5개 Tabs | `workspace/model.ts` |
| 간격 | Card 사이 16px, Section 사이 24px, 제목과 설명의 위계 유지 | `.wall-dashboard-workspace` 범위 |
| 시각화 의미 | 원래 수치·단위·시리즈·임계값·매핑·쿼리 유지. 가짜 변화율/차트 금지 | 기존 Grafana 렌더러 |
| 시계열 팔레트 | 자동 Classic/ByName에만 Wall 팔레트. Light/Dark 색상 및 native 색상 인덱스/이름 해시 사용. 명시 색·매칭 override·임계치/연속 색상·Hue/Scheme 그라데이션 우선 | `chartTokens.ts`, `timeSeriesPresentation.ts` |
| 시계열 선·포인트 | 기본 선 2px, Auto 포인트는 과밀 표시 억제. 명시 Always/Points/lineWidth=0 및 실제 결측의 고립점은 native 동작 유지. 결측을 임의 연결하지 않음 | 같은 공통 토큰·어댑터 |
| 실선 래스터 표현 | 실선 Line에만 `linePixelAlign: false` → native uPlot `pxAlign: false`. 선 좌표를 정수로 반올림하지 않으며 linear/step 보간·실제 데이터·명시 점선/포인트는 유지 | `chartTokens.ts`, `TimeSeries/utils.ts` |
| Toolbar | REF-09의 컴팩트 바: 32px 높이, 6px 컨트롤 모서리, 바깥 4px padding/간격과 9px 모서리. 시간·이동 및 간격·갱신은 연결된 경계선. 공유·편집·Netdive는 별도 보조 그룹. 객체/필터를 여는 아이콘과 낮은 정보 버튼 유지 | `toolbar/toolbar.css`, `components/ui/popover.tsx` |
| 시계열 영역·축·범례·툴팁 | 기존 양수 fill만 최대 9% opacity gradient, 0/stacking/의미 있는 fill 유지. 자동 세로 그리드는 생략하고 은은한 수평 점선, 11px 축/범례, 12px 툴팁/모서리. 긴 시리즈명은 줄바꿈해 실제 수치·단위를 가리지 않음 | `chartTokens.ts`, 공통 `TimeSeriesPresentation.ts` |
| 배포 | 기존 프로토콜·포트 사용. HTTPS 중앙 배포/새 포트 전환과 분리 | 저장소 공통 지침 |

## Workspace 구조 및 기능 보존

| 원본 Row ID | 원본 영역 | Workspace 구성 | 실제 패널 수 |
| --- | --- | --- | --- |
| 24 | 대시보드 | 개요: 핵심 자원 / 성능 추이 / 자원 사용률 / 스토리지 요약 / 서비스 상태 | 21 |
| 178 | 네트워크 상세 | 네트워크 탭 | 19 |
| 196 | 스토리지 상세 | 스토리지 탭 | 7 |
| 136 | Glue 스토리지 디바이스 상세 | Glue 디바이스 탭 | 6 |
| 210 | 프로세스 상세 | 프로세스 탭 | 6 |

- 원래 Row와 `gridPos`, 패널 ID를 저장 모델에서 수정하지 않는다. 화면에서는 해당 패널 객체를 Card로 구성한다.
- 선택 탭은 `wallTab` URL 매개변수에만 보관한다. 기존 `from`, `to`, `var-*`, `refresh` 매개변수는 유지한다.
- 비활성 탭은 기본 Base UI 동작으로 언마운트한다. 기존 scene activation helper가 쿼리 수명을 관리하며, 숨겨진 59개 패널을 한꺼번에 실행하지 않는다.
- 정상 URL의 해당 UID는 기존 Grafana Scenes 렌더러로 연결한다. 편집·전체 화면·kiosk에서는 같은 엔진의 원래 화면을 사용한다. `scenes=false`는 기존 legacy renderer 진단 경로로 유지하며 Workspace를 적용하지 않는다. 다른 UID의 엔진 선택은 바꾸지 않는다.
- 전체 대시보드 편집 중에는 원래 Grid를 사용한다. Workspace는 사용자의 저장 레이아웃을 덮어쓰는 편집기가 아니다.
- 새로 추가된 개요 패널/알 수 없는 Row는 추가 지표 영역에 보존한다. 기존 패널을 번호 목록 때문에 조용히 누락하지 않는다.

## 변경·검증 기록

| 일자 | 변경 | 검증 결과 |
| --- | --- | --- |
| 2026-10-27 | 대상 대시보드 Stat 14개 디자인 개선 | 1800px Light/Dark, 기존 값·단위·패널 위치·크기 보존; 관련 64개 테스트 통과 |
| 2026-10-27 | Row 대신 Workspace 구성, 실제 Base UI Tabs + shadcn 로컬 Card, 기준표와 AGENTS 지침 추가 | 프로덕션 빌드·ESLint·10개 suite/80개 테스트 통과. 1800px 브라우저 Light/Dark 확인. 5개 탭에서 21/19/7/6/6개 원래 패널 표시 |
| 2026-10-27 | 대상 UID Time series의 Wall 팔레트·선·채우기·자동 포인트·축·범례·툴팁 개선 | 프로덕션 빌드·ESLint·11개 suite/95개 테스트 및 8개 snapshot 통과. 1800px Light/Dark, 범례 선택/복원, 툴팁 고정/닫기, 패널 176 전체 화면/탭 복귀 확인 |
| 2026-10-27 | 선의 정수 픽셀 스냅 보정 후 Wall Toolbar 구조 교체 | 빌드·ESLint·12개 suite/109개 테스트·8개 snapshot 통과. 기존 타입 진단 130개 외 신규 0개. 1800px Light/Dark 및 시간·공유·편집·갱신 URL 동작 검증 |
| 2026-10-27 | 사용자 첨부 Toolbar 6개 이미지(REF-09)를 기준으로 컴팩트 바와 객체/필터/시간 팝오버 재구성 | 빌드·ESLint·9개 suite/80개 테스트 통과. 기존 타입 진단 130개 외 신규 0개. 1800px Light/Dark, 바 42px/컨트롤 32px 실측. 5개 탭·Stat·시계열·저장 JSON 불변 |

### 컴팩트 Toolbar 검증 (최초 REF-09 구현 기록, 객체 버튼은 REF-10으로 변경)

| 항목 | 참조 이미지 / 실제 결과 |
| --- | --- |
| 높이·밀도 | 참조의 42px 바/32px 컨트롤을 따라 실제 브라우저에서도 42px/32px 확인. 기존 2단 Card와 ‘조회 조건’ 제목/변수 행을 제거 |
| 형태 | 바 4px padding/간격, 얇은 경계선, 컨트롤 6px/바 9px 모서리, 15~18px 아이콘. 시간+이전·다음 및 간격+새로고침은 한 테두리로 연결. 최초 주 분석 바 폭 약 526px(REF-10 라벨 추가 후 폭 증가)(기존 자동 갱신 간격도 유지) |
| 객체 | 2번 이미지의 넓은 팝오버 구성. 큐브 단독 버튼은 REF-10에 따라 Cpu 아이콘+가상머신 명칭으로 대체. 기존 scvm 선택기를 그대로 사용하며 열기/닫기·Light/Dark 확인. 실제 운영 Mold 쿼리 결과까지 검증하지는 않음 |
| 필터 | 원래 추가 변수와 주석 컨트롤만 연결. 숨김 변수/숨김 주석 레이어를 필터로 표시하지 않음. 별도 Node/Edge 엔진·가짜 필터 개수 없음 |
| 시간 | 4번 이미지의 상단 요약/32px 프리셋/선택된 왼쪽 표시/시간대 footer 구성. 최근 2시간 선택 → 이전/다음 → 1시간 복귀와 from/to/var-*/refresh 보존 확인. 고급 설정에서 native 날짜 입력·시간대·이력·전체 프리셋 유지 |
| 갱신 | 5번 이미지처럼 작은 간격 메뉴/선택 점 표시, 메뉴 왼쪽 정렬. 기존 Off/Auto/허용 간격 및 쿼리 취소·새로고침 유지. 브라우저에서 꺼짐→1m 복귀 확인 |
| 부가 작업 | Netdive·공유·권한별 편집을 분석 바 밖의 보조 그룹으로 분리. 기존 handler와 권한 판단 유지. 6번 Settings 화면을 별도 재개발하지 않음 |
| 구조·범위 | 대상 UID에 신규 Toolbar 1개/기존 Toolbar 0개. 기존 Grafana Toolbar를 CSS로 감춘 구성이 아님. Workspace/Stat/시계열 코드와 저장 dashboard JSON 작업 전 SHA/내용 비교 동일 |
| 테스트 | native 변수 입력 값 변경 후 팝오버 닫힘에도 값 유지, 상대 범위의 이전/다음, 고급 날짜 폼 접근, Viewer 제한, 최소 갱신 간격, 공유 URL 보존 등 80개 통과 |
| 캡처 | `compact-toolbar-primary-light.jpg`, `compact-toolbar-light.jpg`, `compact-toolbar-dark.jpg`, `compact-toolbar-objects-light.jpg`, `compact-toolbar-time-light.jpg`, `compact-toolbar-refresh-light.jpg`. 모두 1800px 브라우저에서 캡처하며 원본 참조는 `design-references/`에 보관 |

현재 화면 검증은 복제 DB/loopback fixture 기준이다. 작업 중 기존 브라우저 탭이 편집 상태로 바뀌어
그 상태를 저장/폐기하지 않고 보존했으며, 최종 디자인 검증은 별도 탭에서 진행했다.

### 실선 문제의 원인과 검증

| 항목 | 확인 / 조치 |
| --- | --- |
| Show points | 개요의 원본 4개는 이미 `never`. Auto 억제 어댑터도 적용되므로 이번 점처럼 보이는 선을 Auto 포인트 탓으로 처리하지 않음 |
| Line style / 보간 | 원본은 실선 기본값(`dash` 없음), `linear` 보간. 매끄럽게 보이도록 임의 spline을 강제하지 않으며 사용자 점선·StepAfter와 Always 포인트 보존 테스트 추가 |
| Canvas 해상도 | 실제 브라우저 DPR=1, canvas 467×228과 CSS 크기 467×228 동일. transform 없음, image-rendering auto. CSS 확대·저해상도 강제 설정 문제가 아님 |
| 렌더링 원인 | 설치된 uPlot의 기본 `pxAlign=1`이 경로 좌표를 정수 반올림. 낮은 기울기에서 한 픽셀 단차가 반복되어 작은 점이 이어진 듯 보임 |
| 실제 수정 | TimeSeries utils → UPlotSeriesBuilder에 `pxAlign=false` 전달. native path는 유지하고 소수 좌표를 보존. 축/점선 그리드나 점/막대의 기존 스냅은 변경하지 않음. CSS만 수정한 것이 아님 |
| 화면 | `toolbar-graph-before.png`, `toolbar-graph-after.png`를 같은 1800px/DPR=1 환경에서 확인. 보정 후 낮은 기울기의 실선 계단 표현 개선 |

### Toolbar 1차 검증 기록 (외형은 REF-09로 대체)

| 항목 | 결과 |
| --- | --- |
| 실제 구조 / 중복 | Workspace에 신규 Toolbar 1개, `.wall-native-toolbar` 0개, `.wall-dashboard-controls` 0개. 기존 스타일 클래스를 새 버튼에 재사용하지 않음 |
| 시간 | 1h→6h 프리셋, 2026-10-27 09:00~10:00 절대 범위 입력, 이전/다음 30분 이동 및 1h 복귀 확인. native parser/Scene 시간 객체 사용. 절대 범위 이력은 기존 localStorage 형식/키 유지 |
| 갱신 | 1m→5m→꺼짐→1m 및 URL 반영 확인. native SceneRefreshPicker를 활성화해 기존 타이머·최소 간격·Auto·쿼리 취소 재사용. interval 메뉴 keyboard/Escape 확인 |
| 공유 / 편집 | native 공유 창의 링크/내보내기/공개 대시보드 탭 유지. 편집 시 원래 Grid와 저장 도구, 저장 없이 종료/폐기 후 5개 탭과 신규 Toolbar 복귀 확인 |
| 권한 / 링크 | Viewer 권한의 편집 버튼 미노출 및 최소 갱신 간격 테스트. readonly→editable 경로는 native 판단 사용. Netdive의 getLinkSrv로 계산한 주소·새 창 설정 유지. 실제 원격 Netdive 접속 성공까지 검증한 것은 아님 |
| 변수 / 탐색 | 원래 variableControls를 그대로 렌더링. 시간·갱신·공유 변경 시 기존 var-* 보존. 중복 Home/대시보드 목록은 표시만 제외하고 저장 링크 JSON은 유지. 그 외 사용자 링크는 유지 |
| 디자인 | 기존 Wall 토큰 기반 Light/Dark Toolbar·간격 메뉴·시간 팝오버 확인. 날짜 입력 폼 자체는 native TimePickerContent 재사용 |
| 저장 / 범위 | 원본 Monitor DB 및 복제 DB의 dashboard JSON 불변. 승인된 Workspace/Stat/Gauge/modern.css 불변. 대표 UID 외 적용 없음 |
| 기록 | `dashboard-toolbar-light.jpg`, `dashboard-toolbar-dark.jpg` 및 선 보정 전후 PNG. 실제 고객 데이터/SSO 검증과 분리된 loopback fixture 검증 |

### Time series 개선의 변경 경계

- 대상 UID의 Time series만 opt-in한다. 전체 화면/kiosk에서도 같은 팔레트를 유지하고, 패널 편집에서는 원래 편집 동작을 사용한다.
- `WallChrome.tsx`는 범위와 토큰만 제공한다. 승인된 Workspace/Stat/Gauge와 `modern.css`는 이번 변경에서 수정하지 않는다.
- `TimeSeriesPanel.tsx`는 기존 준비된 프레임의 표현 복사본을 만들고 기존 TimeSeries에 전달한다.
- `TimeSeries.tsx`, `utils.ts`, `UPlotAxisBuilder.ts`는 opt-in 축·그리드·커서 설정만 추가한다. 범례와 툴팁은 같은 복사본의 색상/단위 포맷터를 사용한다.
- `VizLegend.tsx`, `TooltipPlugin2.tsx`, `TimeSeriesTooltip.tsx`는 유효 Context가 있을 때만 공통 스타일을 적용한다. 다른 패널의 동일 공통 컴포넌트에는 새 스타일을 적용하지 않는다.
- 테스트는 `timeSeriesPresentation.test.tsx`에서 원본 불변성, 명시 설정 우선순위, native scale/결측 고립점/툴팁 색상/범례 렌더링 및 적용 범위를 확인한다.

### Time series 검증 기록

| 검증 | 결과 |
| --- | --- |
| 데스크톱 디자인 | 1800px Light/Dark에서 개요의 시계열 4개 확인. Stat/Gauge와 5개 탭 유지. 명시된 메모리 시리즈 색상은 자동 팔레트 교체에서 제외 |
| 범례 / 툴팁 | 네트워크 패널 176에서 범례 선택 시 해당 시리즈만 표시하고 다시 선택해 복원. 고정 툴팁의 시각·시리즈·실제 포맷된 단위와 native 주석 버튼 유지. 긴 이름을 줄바꿈하고 480px 표면 안에서 수치가 잘리지 않는지 확인 (`scrollWidth` 478px) |
| 전체 화면 / 시간 | 패널 176 보기에서도 Wall 시계열 1개 유지. 복귀 후 네트워크 탭, 변수, 1시간 범위와 1분 자동 새로고침 URL 유지 |
| 범위 격리 | 다른 UID `fec03giqwtw5cf`에 canvas 23개가 렌더링된 상태에서 새 시계열 적용 표식 0개, Workspace 0개 확인. 다른 화면/패널의 렌더러 분기는 기존 동작 유지 |
| 소스 / DB 보존 | Workspace/Stat/Gauge/`modern.css`를 작업 시작 SHA-256과 비교해 동일. 원본 Monitor DB SHA-256 및 복제 DB의 모든 dashboard JSON 동일 |
| 정확성 테스트 | 원본 vectors/단위 포맷/thresholds/links/negative-Y/로그 스케일/보간 유지. 명시 색상 및 매칭 override, stacking, 0 fill, Always/Points, 0 선폭 유지. native 범위 계산과 결측의 고립점 검증 |
| 타입 검사 | 기존 진단 130개, 신규 진단 0개. 전체 타입 검사 성공을 의미하지 않음 |
| 화면 기록 | `timeseries-before-light.jpg`, `timeseries-overview-light.jpg`, `timeseries-overview-dark.jpg`, `timeseries-tooltip-light.jpg` |

화면 검증 전 loopback fixture가 Grafana의 요청 step을 따르도록 임시 fixture만 보정했다.
이전 fixture는 최소 30초 간격을 강제하여 요청이 5/10초인 경우 가짜 결측과 고립점을 만들었다.
전후 캡처 모두 보정된 동일 fixture를 사용한다. 제품 코드에서는 결측 보간이나 데이터 포인트 삭제를 하지 않는다.

### 이번 Workspace 검증의 구체적 범위

| 검증 | 결과 |
| --- | --- |
| 저장 모델 | projection 호출 전후 scene 직렬화 동일. Row의 접힘 상태·원래 패널 객체와 query runner를 유지하는 테스트 통과 |
| DB / JSON | 원본 Monitor DB SHA-256 동일. 격리 복제 DB의 모든 dashboard JSON을 작업 전후 비교해 동일 |
| 탭 | 마우스 선택 및 Base UI 키보드 방향키/Enter 테스트. 브라우저 직접 새로고침 후 선택 탭 유지 |
| 시간 / 자동 새로고침 | 브라우저에서 1시간 범위와 1분 간격 적용. `wallTab`, `var-*`, `from/to`, `refresh` URL 유지 확인 |
| 원래 패널 도구 | 네트워크 패널 ID 176의 메뉴 → 전체 화면 → 원래 네트워크 탭 복귀 확인 |
| 편집 | 전체 대시보드 편집은 원래 Grid로 전환. 저장 없이 종료/폐기 후 Workspace 복귀 확인 |
| 적용 범위 | 다른 UID의 호스트 대시보드에서 기존 13개 패널 표시, Workspace/새 Tabs 0개 확인. 기존 경보 코드는 수정하지 않음 |
| 타입 검사 | 수정 전후 기존 진단 130개, 신규 진단 0개. 기존 React 타입 문제는 별도이며 전체 타입 검사 성공으로 보고하지 않음 |
| 화면 기록 | `workspace-overview-light.jpg`, `workspace-overview-dark.jpg` (1800px 데스크톱의 전체 페이지 캡처) |

관련 테스트: `workspace/DashboardWorkspace.test.tsx`, 기존 `DashboardPageProxy.test.tsx`,
`DashboardSceneRenderer.test.tsx`, 승인된 Stat 및 Wall UI 테스트.

검증에는 실제 고객 환경과 분리된 복제 DB 및 loopback fixture를 사용한다.
화면 검증 결과를 운영 데이터 정확성, 실제 Mold/SSO 연동 또는 고객 환경 배포 성공으로 확대 해석하지 않는다.

### REF-10 객체 버튼 검증 (2026-10-27)

| 항목 | 결과 |
| --- | --- |
| 변경 범위 | 대상 Workspace 객체 버튼만 Cpu 아이콘 + 가상머신 명칭으로 변경. 기존 Base UI Popover와 Grafana 변수 선택기 유지 |
| 브라우저 | 데스크톱 1800px에서 Light/Dark 확인. 객체 팝오버 열기/닫기 정상. 이후 Light 복원 |
| 검증 | Toolbar 기존 테스트 8개, 해당 TSX ESLint, 프런트엔드 빌드, diff 공백 검사 통과. 실제 Mold 조회는 이번 검증 범위에서 제외 |
| 이미지 | 로컬 검증 산출물 wall-object-selector-light.jpg / wall-object-selector-dark.jpg |

### REF-11 동적 변수 표현

| 항목 | 변경 내용 |
| --- | --- |
| 원인 | 변수는 이미 native 선택기에 연결돼 있었으나 첫 변수를 고정 가상머신 객체로 분류하고 나머지를 필터 팝오버로 감췄음. 실제 변수 의미/선택값이 바에 드러나지 않음 |
| 구조 | `variableControls.map(control => control.Component)`로 원래 컨트롤 직접 렌더링. 변수명/객체 종류/개수 하드코딩 제거. label/name과 현재 값 표시, hideVariable/hideLabel은 native 판정 |
| 보존 | 선택·입력·다중 선택·All·검색·종속 변수·오류/로딩·주석 컨트롤은 기존 엔진 사용. JSON/쿼리 수정 없음 |
| 회귀 검증 | Toolbar 8개 테스트 통과. 변수 입력 변경, 동적 추가/삭제, 변수 숨김/라벨 숨김을 확인. 기존 시간/갱신/공유/권한 테스트 유지 |
| 브라우저 | 1800px Light/Dark에서 원본 변수명 scvm 직접 표시 및 combobox 메뉴 열기 확인. 현재 URL의 var-scvm은 빈 값이므로 빈 선택값을 임의 명칭으로 대체하지 않음. 숨김 변수 ceph_hosts는 표시하지 않음. 실제 운영 데이터소스 옵션 조회 성공은 미검증 |
| 완료 검사 | ESLint·프런트엔드 빌드·diff 공백 검사 통과. 스크린샷 wall-dynamic-variables-light.jpg / wall-dynamic-variables-dark.jpg |

### REF-12 통합 변수 선택 컨트롤 (2026-10-27)

| 항목 | 구현 / 검증 |
| --- | --- |
| 실제 import / 구조 | `WallVariableControl.tsx`: `../ui` Button, `../components/ui/popover` Popover/Trigger/Content; 이 로컬 shadcn 구성은 실제 `@base-ui/react/button`, `@base-ui/react/popover` 사용. Lucide Layers2 + 보조 label/name + 강조 summary + ChevronDown |
| 상태 | 빈 값은 미선택, native $__all은 전체, 복수는 실제 첫 라벨 외 N개. 숫자 0 유지. 숨김/라벨 숨김/읽기 전용/aria-busy 및 전체 선택값 title 유지. 옵션/선택 이벤트를 새로 구현하지 않음 |
| 기능 경계 | 원래 VariableValueSelectWrapper로 검색/선택/멀티 blur commit·오류/로딩 유지. 타입은 MultiValueVariable instanceof로 판정. 다른 타입 및 주석 컨트롤은 native 그대로 유지 |
| 브라우저 | 1800px Light/Dark 미선택·입력값 10.10.32.11 강조 확인. native custom 입력이 var-scvm URL과 동기화되며 from/to, refresh, ceph_hosts 유지. 검증 전 URL 복원. 데이터소스 옵션 조회 성공을 의미하지 않음 |
| 디자인 / 범위 | Toolbar 구조 유지. 변수 32px 높이와 공통 경계/모서리/여백. 시간/갱신 연결 구분선만 색 대비 65%로 완화(CSS). 대상 UID 외 화면/패널/JSON 수정 없음 |
| 캡처 | wall-variable-dropdown-light.jpg, wall-variable-dropdown-selected-light.jpg, wall-variable-dropdown-dark.jpg |
| 완료 검사 | Toolbar 11개 테스트, ESLint, 프런트엔드 빌드, diff 공백 검사 통과. 변수 추가/삭제·숨김·TextBox·미선택/전체/복수 요약·native 단일 선택 및 multi blur commit 검증. 전체 타입 검사는 기존 오류가 남으며 새 Wall 파일 진단 없음 |
| 테스트 환경 | native Select CSS를 읽는 jsdom/nwsapi 오류 때문에 선택기 테스트 2개만 getComputedStyle을 고정하고 Base UI 포커스 복원 후 원복. 실제 디자인은 데스크톱 브라우저에서 확인 |

### REF-13 개요 시각화 고도화 (2026-10-27)

| 유형 | 기존 경로 / 변경 구조 | 보존 경계 |
| --- | --- | --- |
| 공통 제목·메뉴 | VizPanel → PanelChrome. `PanelChromePresentationContext`의 선택적 Header/MenuButton 슬롯으로 Wall CardHeader/CardTitle과 Button/Ellipsis를 실제 렌더링. native titleItems·설명·주석·로딩·오류·메뉴 overlay 유지 | 패널 제목 ID/aria-labelledby, native menu handler·권한 유지. 새 헤더 높이 44px(서비스 38px)를 native 내부 크기 계산에도 전달해 canvas CSS 확대를 하지 않음 |
| KPI Stat | StatPanel → BigValue → FormattedValueDisplay 유지. 승인된 큰 수치/작은 단위·데이터 링크 그대로. 상단 의미 아이콘/얇은 강조선과 낮은 대비 면 구분 | 기존 숫자/단위/명시 글자 크기/상태 배지/실제 매핑은 유지 |
| Time series | TimeSeriesPanel → native TimeSeries/GraphNG/uPlot 유지. overviewChartTokens 공급으로 자동 색상만 Wall 제품 청색·청록·보라 적용, 기본 선 2.2px, fill 상한 6%, 은은한 수평 실선 grid·12px 범례·14px tooltip 여백 | 원래 값/벡터/단위/thresholds/명시 색·선폭·포인트/보간/negative-Y/stacking/결측·링크 그대로. 개요 4개는 원래 showLegend=false이므로 임의로 범례를 켜지 않음 |
| Gauge | GaugePanel → VizRepeater → Gauge/Flot 호/임계치 유지. 선택적 renderGaugeValue 슬롯으로 FormattedValueDisplay HTML 숫자·작은 단위 분리. 호는 최대 8px, 값은 원래 포맷/임계치 의미색 사용 | 숫자/퍼센트 변환/min/max/threshold marker·label/데이터 링크 callback 유지. 명시 valueSize 우선. Context 없는 화면의 DOM은 기존 nativeGauge 그대로 |
| 서비스·스토리지 | 기존 Stat 렌더러에 실제 상태 배지를 유지한 작은 inset 타일/스토리지 요약 면. 서비스 상태를 임의 합산하거나 가짜 정상률을 추가하지 않음 | 원래 8개 서비스 패널·스토리지 2개 패널 모두 유지 |

| 실제 컴포넌트 분류 | import / 변경 범위 |
| --- | --- |
| shadcn 로컬 구성 | `../components/ui/card` CardHeader/CardTitle, `../ui` Button. Button primitive는 실제 `@base-ui/react/button`이며 CardHeader/Title은 로컬 HTML 구성 |
| 공통 opt-in 슬롯 | `@grafana/ui/src/components/PanelChrome/PanelChromePresentation`, `@grafana/ui/src/components/VizPresentation/VizPresentation`. 브랜드 코드는 app의 overviewPresentation.tsx에 유지 |
| 렌더러 재사용 | `@grafana/ui/src/components/FormattedValueDisplay/FormattedValueDisplay`, native PanelMenu/Dropdown, native uPlot/Flot |
| CSS만 해당 | `workspace/overview.css`: 개요 role 표면·강조선·타이포/여백·메뉴 위치·구 native titleItems 배치. 다른 탭에는 role 속성과 Provider를 추가하지 않음. 기존 modern.css 수정 없음 |

검증 환경은 격리 복제 DB와 loopback fixture이다. 실제 SCVM 조회나 운영 배포 검증을 의미하지 않는다.

| 검증 항목 | 실제 결과 |
| --- | --- |
| 데스크톱 디자인 | 1702px Light/Dark 확인. 개요 21개 Header, uPlot 4개, Gauge HTML readout 3개, 서비스 8개 유지. Light로 복원 |
| 분석 동작 | CPU 커서/툴팁 고정·닫기, 원래 단위/시각/시리즈 표시 확인. 드래그 확대 시 native from/to 변경·기존 var-*/refresh 유지, 새 메뉴 → native 보기 전체 화면 → 개요 복귀 확인. 검증 전 시간 URL 복원 |
| 범례 | 원본 개요 4개가 모두 showLegend=false임을 확인하고 숨김 유지. 범례 렌더링/값/선택의 회귀는 기존 Time series suite로 검증 |
| 범위 격리 | 네트워크 탭 패널 19개에서 개요 role/Chrome 0개. 5개 탭 합계 59개 및 원래 모델/Row 상태 불변 테스트 통과. 복제 DB 전체 dashboard JSON, 기존 modern.css·Workspace model·변수 컨트롤 SHA 동일 |
| 빌드·정적 검사 | 프런트엔드 프로덕션 빌드 및 ESLint 통과. 전체 TS 기존 130개 진단, 변경 파일 신규 진단 0개 |
| 테스트 | 6개 suite, 58개 중 57개 통과. native PanelChrome 메뉴의 show-on-hover 가시성 테스트 1개 실패. HEAD의 기존 PanelChrome으로도 동일 실패를 재현한 기존 항목. 새 Header/오류/메뉴 callback, Gauge 값·단위·min/max·데이터 링크, 시계열 불변성, Stat 및 Workspace 회귀 통과 |
| 캡처 | overview-refinement-final-light.png / overview-refinement-final-dark.png / overview-refinement-services-light.png / overview-refinement-services-dark.png / overview-refinement-tooltip-light.png |

시각 평가: native 기본 제목·툴바 버튼 모양과 동일한 흰색 카드의 반복을 개요에서 제거했다.
숫자·단위·서비스 배지는 기존 의미를 유지하며, Gauge 값은 실제 HTML 표시 구조로 분리했다.
고급 컨텍스트 메뉴 내용·검사 화면 및 uPlot/Flot 분석 엔진은 native 그대로이므로 모든 내부 UI를 대체한 것은 아니다.

### REF-14 타이포그래피 시스템 (2026-10-27)

공통 원본은 `typography.ts`의 wallTypography이다. CSS 변수는 같은 객체에서 생성한다.
HTML 역할, Stat/Gauge 값·단위, uPlot Canvas 축과 DOM 범례/툴팁을 같은 원본에 연결한다.
숫자 포맷·소수점·데이터 단위·명시된 valueSize/titleSize 설정은 유지한다.

| 역할 | 크기(px) | 굵기 | 행간(px) |
| --- | ---: | ---: | ---: |
| 대시보드 제목 | 24 | 700 | 32 |
| 섹션 제목 | 14 | 600 | 20 |
| 패널 제목 | 12 | 600 | 18 |
| 서비스 소형 제목 | 11 | 600 | 16 |
| 본문 | 13 | 400 | 20 |
| 보조 설명 | 11 | 400 | 16 |
| 도구 컨트롤 | 12 | 500 | 18 |
| KPI 수치 | 36 | 700 | 42 |
| Gauge 수치 | 25 | 700 | 30 |
| 단위 | 13 | 500 | 18 |
| 서비스 상태 | 14 | 600 | 20 |
| 차트 축 | 11 | 400 | 16 (Canvas는 native 단일 행 baseline 유지) |
| 범례 | 11 | 500 | 16 |
| 툴팁 | 12 | 500 | 18 |

| 변경 영역 | 실제 경로 / 처리 |
| --- | --- |
| 폰트 파일 | `public/fonts/wall/InterVariable.woff2` 352,240 bytes, `PretendardVariable.woff2` 2,057,688 bytes. 전체 한글 지원을 위해 full font 사용. 최초 2개 약 2.41MB, 이후 정적 캐시 재사용. 외부 CDN·OS 폰트 설치·새 npm 의존성 없음 |
| 출처 / 라이선스 | 같은 폴더의 `sources.json`에 공식 repo의 고정 commit·SHA-256·크기 기록. `Inter-LICENSE.txt`, `Pretendard-LICENSE.txt`에 OFL 원문 보존. 폰트 바이너리 변형 없음 |
| 정적 자산 경로 | 기존 CSS loader는 url 변환을 하지 않으므로 CSS 배포 위치 public/build 기준 `../fonts/wall/...` 및 버전 query 사용. Grafana subpath와 기존 public/fonts 배포 경로를 유지. webpack/배포 자동화 수정 없음 |
| 범위 / 로딩 | WallChrome은 05 UID에만 Typography/FontStatus Context·data scope·CSS 변수 공급. 두 face를 400/500/600/700으로 명시 로드한 뒤 상태 ready로 변경. 실패 시 swap fallback으로 내용을 유지. root/개요 Provider의 fontLoadRevision 변경으로 native Canvas를 재구성 |
| 포털 | 공통 Popover와 Toolbar interval Menu는 Context가 활성화될 때만 같은 family/CSS 변수 적용. 별도 CSS/폰트 체계를 생성하지 않음 |
| uPlot | 기존 UPlotAxisBuilder가 Wall family를 무시하고 theme family를 사용하던 경로 수정. optional fontFamily/fontWeight만 추가해 기본 경로는 유지. 새 face 자체에 tnum 적용하여 Canvas가 DOM numeric CSS에만 의존하지 않음. 탭별 축 기본 11px/400. 오른쪽 tick 잘림 방지 여백은 axis.size×2에서 파생 |
| Stat / 단위 | native getStatCardPresentation에 optional typography 속성, FormattedValueDisplay에 unitStyle 추가. 기본 native 단위 비율은 유지하며 05의 기본 단위만 역할 토큰으로 지정. 기존 modern.css의 단위 !important 규칙은 새 scope만 제외. 색상 배경(plain) 대비·명시 크기 유지 |
| CSS 구분 | typography.css는 새 primitive 구현이 아니라 scoped 역할 스타일과 font-face. 기존 shadcn/Card/Button 및 native Canvas 표시 계약이 같은 TS 토큰을 소비. 구조/데이터/변수 모델 변경 없음 |

| 검증 | 결과 |
| --- | --- |
| 폰트 메타데이터 | FontTools로 Inter opsz 14~32/wght 100~900, Pretendard wght 45~930 확인(CSS 노출 100~900). Pretendard 한글 글리프 확인. 두 face의 tnum 치환 후 0~9 advance 폭이 각각 모두 동일 |
| 브라우저 폰트 | 1702px Light/Dark. 실제 DOM의 font-status=ready, 제목·섹션·패널·KPI/Gauge family 모두 Wall Inter/Wall Pretendard 확인. 제목 24/700/32, 섹션 14/600/20, 패널 12/600/18, KPI 36/700/42, Gauge 25/700/30, 단위 13px 실측 |
| 숫자 안정성 | 실제 KPI 40과 24가 같은 44.40625px 폭. HTML tabular-nums + face tnum 적용. 로딩 직후/교체 후 빈 화면을 만들지 않으며 글꼴 준비 후 Canvas를 다시 구성 |
| 메뉴 / 차트 | 시간 팝오버도 같은 family·12px 확인. 실제 uPlot config의 font=400 11px Wall family 및 non-Wall theme font 보존 테스트 통과. 개요의 범례는 원래 숨김이므로 표시 옵션 유지하고 DOM PlotLegend 회귀 테스트로 검증 |
| 다른 화면 | 01. 종합 대시보드에서 typography scope 0개, 기존 Inter/Pretendard family 그대로. 검증 후 05 Light·1h·1m·빈 scvm URL로 복원 |
| 화면 | typography-light.png / typography-dark.png / typography-services-dark.png |
| 완료 검사 | 프로덕션 빌드·ESLint·공백 검사 통과. 이번 변경 관련 8개 suite/58개 테스트 통과(폰트 로딩/실패 fallback, 단위 분리/native 기본 비율, Canvas font/여백, Stat/Gauge/Toolbar/Workspace). 전체 TS는 기존 130개 오류가 남으며 변경 파일 신규 진단 0개. 복제 DB 전체 dashboard JSON 동일 |
| 최종 상태 | 최신 빌드 재시작 후 두 폰트 ready, 1702px Light/Dark 재캡처. Light·from=now-1h·refresh=1m·var-scvm 빈 값·var-ceph_hosts=cube01 및 개요 21개 패널 유지 |

### REF-15 데이터 의미별 표시 재설계 (2026-10-27)

전체 59개별 결정과 데이터 계약은 [패널 변경 목록](visualizations/PANEL_INVENTORY.md)에 기록한다.
브랜치는 `codex/wall-modern-lite`이며 기존 변경을 보존한다.

| 유형 / 수 | 변경 | 근거 / 보존 경계 |
| --- | --- | --- |
| KPI Stat 4 | Wall KPI 숫자·단위, 평평한 카드와 128px 밀도 | 원래 reduceOptions와 포맷터/소수점/단위 및 data link 사용. 큰 숫자 장점 유지, 공통 장식·아이콘·항상 보이는 메뉴 제거 |
| 사용률 Gauge 3 | 52px 수평 비교 행과 원래 임계치 marker | percent/percentunit 단위 계약에 따라 위치 계산. source thresholds 75/85와 색 유지. 범위 밖/NaN/null은 정상화하지 않고 채운 막대를 그리지 않음 |
| Root 용량 Stat 1 | 전체·사용중·사용 가능과 사용 비율 막대 | total>0, 0≤used≤total, total≈used+available 검증. 모순이면 원본 수치를 보존하고 경고. free와 avail 구분 유지 |
| 서비스 Stat 8 | 하나의 공통 영역 안의 상태 행 | 기존 mapping의 OK/WARN 및 원본 값 사용. 매핑 밖 값은 중립색, 데이터 없음에도 이름 보존. 없는 장애 임계치를 만들지 않음. 반복된 Card와 헤더 제거, 메뉴는 hover/focus에서 접근 |
| 상태 요약 Stat 2 | 분리된 UP/DOWN·IN/OUT 또는 전체/UP/DOWN 수치 | 서로 겹치는 집합을 합산 파이 차트로 만들지 않음. native formatter와 원래 색상 모드 유지 |
| Table 6 | 모든 frame/row/field를 보존하는 엔티티 목록. FS/OSD에는 용량/사용률 막대 추가 | identity와 단위/임계치/매핑 유지, 모든 필드별 정렬·원본 data-link row index 지원. 행 수에 맞춰 표시 높이 결정. 원본 Table의 열 너비/선택/검사 기능은 native 보기에서 제공 |
| Time series 35 | 현재 선·팔레트·축·그리드·툴팁·범례·uPlot 유지 | 비개요에서는 overview chart tokens로 덮지 않음. 기존 native zoom/hover/legend callbacks와 query runner 유지. 공통 패널 제목/메뉴 슬롯만 Wall 구조 사용 |

| 구조 / 실제 import | 역할 |
| --- | --- |
| `WallPanelContentContext` / `WallPanelContent` | NativeWorkspacePanel이 UID 범위 안의 panel ID별 kind만 제공. stat/Gauge/table 플러그인의 본문 렌더링 분기. Context 없으면 원래 component로 반환. 편집/전체 화면에서는 native renderer 유지 |
| `getFieldDisplayValues`, `getDisplayProcessor`, native field.display/getLinks | `@grafana/data`, `@grafana/ui` DataLinksContextMenu 재사용. 이미 실행된 기존 query runner·변환·override 결과를 소비하며 추가 쿼리·백엔드·JSON 갱신 없음 |
| 로컬 shadcn Button/Card, 실제 Base UI | `../ui`, `../components/ui/card`; Button은 `@base-ui/react/button`. 목록 정렬은 실제 `@base-ui/react/menu` RadioGroup/RadioItem. 데이터 행/막대는 Wall의 의미 있는 HTML 표시 컴포넌트이며 shadcn 차트 엔진이라고 부르지 않음 |
| `model.ts` | unit-aware usageFraction, capacityRelation, metricField, thresholdMarks, fieldText. source 값을 repair/clamp하거나 bytes/percent를 추측하지 않음 |
| `visualizations.css` | 새 컴포넌트 내부 레이아웃·공통 토큰 기반 표시. 단순 CSS로 native Table/Gauge를 숨기는 방식이 아님. Workspace에서 Table 본문과 Flot Gauge가 실제로 렌더링되지 않음 |
| 높이 / 카드 구조 | sparse 목록은 행 수로 높이 산정(150~560px, 넘는 행은 스크롤). 서비스·사용률은 Card wrapper 제거. 원래 saved gridPos는 변경하지 않음 |

| 검증 | 결과 |
| --- | --- |
| 패널 / 차트 수 | Light/Dark 5개 탭 모두 21/19/7/6/6개 패널, 4/15/6/4/6개 uPlot 확인. 기존 59개 정보 보존, native Gauge 0개, 새 목록 내부 Table 0개 |
| 데이터 표시 | OSD 1/2/3TiB·40/78/92%와 원래 75/85 임계치 확인. FS 타입·마운트·bytes·percent·장치 오류 확인. Root 120/70/50GiB와 원본 size-avail 정의 확인. 값은 모두 격리 fixture 예시 |
| 데이터 오류 | 브라우저에서 OSD raw ratio=1,200,000,000 주입 시 120,000,000,000% 원본 표시 + 경고 + meter 0개. FS raw 사용률40%와 size/used의 50%/30% 불일치를 별도 경고. 100% clamp·임의 재계산·원본 숨김 없음. 오류 flag 제거 후 원래 정상 fixture 복원 |
| 정렬 / 원래 Table | OSD 사용률 descending 정렬 시 osd.2→osd.1→osd.0 확인. 메뉴→보기에서 원래 native Table과 동일한 필드/값·정렬 버튼을 확인. 이때 새 display 0개 |
| 차트 조작 | 네트워크 176 범례 선택/복원, 원래 single tooltip 값·Gib/s 단위·시각 확인, drag zoom의 from/to 절대 시간 변경과 기존 var-*/refresh/wallTab 유지 확인. 원래 now-1h URL 복원 |
| 범위 격리 | 01. 종합 대시보드에서 새 display/kind 0개 확인. 검증 후 05 개요·Light·now-1h·1m·빈 scvm·cube01로 복원 |
| 검사 | 프로덕션 빌드·ESLint·공백 검사 통과. 9개 suite/69개 테스트 통과. 데이터 없음의 제목 보존·매핑 밖 서비스 값의 중립 표시 포함. 전체 타입 검사는 기존 130개 진단, 변경 파일 신규 0개 |
| 캡처 | semantic-{overview,network,storage,devices,processes}-{light,dark}.jpg 10개. semantic-invalid-device.jpg / semantic-invalid-filesystem.jpg / semantic-legend-selection.jpg / semantic-chart-tooltip.jpg / semantic-overview-final-light.jpg |

검증은 실제 SCVM 데이터를 받을 수 없는 환경의 복제 DB/loopback fixture 기준이다.
fixture의 기존 범용 bytes 응답·시각 불일치를 정상/오류별 테스트 데이터로 분리한 것이며, 제품 쿼리/실제 수치를 보정한 것이 아니다.
실제 고객 환경의 SCVM/Glue 데이터 정확성이나 운영 배포 성공까지 검증한 것으로 확대 해석하지 않는다.

### REF-16 구현 경계

- 기존 로컬 shadcn Card/Header/Content 및 Base UI Button 메뉴를 유지한다. 새 라이브러리나 가짜 Progress primitive를 도입하지 않는다.
- `CompactUsageBar`는 실제 Wall React 표시 컴포넌트다. Gauge의 기존 `getFieldDisplayValues` 결과, 숫자/단위 formatter, threshold color 및 data link를 재사용한다. `CapacityTrack`의 native 임계치 marker와 접근성 meter를 유지한다.
- 카드 폭·높이·간격·padding·막대 높이는 `compactResourceTokens.ts`, 글꼴/숫자/단위 크기는 기존 `typography.ts`, Light/Dark 색은 기존 Wall surface/border/text 토큰을 사용한다.
- CSS 조정: 대상 KPI grid/card/header와 Usage Bar 표시만. 데이터/쿼리/단위/임계치/순서/JSON을 변경하지 않는다. 검증은 데스크톱 Light/Dark의 표시/밀도와 변경 파일 lint 및 화면용 build에 한정한다.

- 브라우저 확인: 1530px 데스크톱에서 KPI 4개 각각 260×96px, computed background-image=none·border-top=1px·Light shadow alpha 0.02. 사용률 24/68/68%의 기존 fixture 값과 75/85 임계치 표시, 숫자 25px·막대 5px·native Gauge canvas 0개 확인. Light/Dark 모두 깨짐 없음. 변경 파일 ESLint 및 프로덕션 빌드 통과. 광범위한 테스트는 실행하지 않음. 캡처 `compact-resource-light.jpg`, `compact-resource-dark.jpg`.

### REF-17 파일시스템 정보 전용 표시

- 기존 filesystem kind(panel 244)만 `WallFilesystemInfo`로 분리한다. 한 행/소수 필드와 서로 다른 단일 값 frame(6개 이하)은 semantic dl, 복수 파일시스템 행은 semantic table로 자동 선택하며, 모든 frame/row/field와 원래 field display formatter/data links를 보존한다. frame마다 schema가 다르면 필드 합집합과 frame 이름을 표시하며 선택기로 나머지를 숨기지 않는다.
- 실제 import는 기존 로컬 shadcn `Button`(`../ui`, 내부 `@base-ui/react/button`) 및 바깥 Workspace의 `Card`/`CardContent`다. 새 Table/Information Card 본문은 Wall 소유 HTML 표시 컴포넌트이며 Base UI Table primitive를 사용했다고 주장하지 않는다.
- 표 헤더 버튼의 정렬은 화면용 순서만 바꾸며 링크에 원래 row index를 전달한다. 실제 필드명·숫자·단위는 EntityValue/getDisplayProcessor를 재사용한다. 새로운 용량/비율을 추정하지 않고, 기존 명시적 A/B/C 계약이 있을 때만 데이터 모순 경고를 유지한다.
- `ResizeObserver`로 본문 높이를 측정해 기존 native chrome 여백만 더하고, 많은 행은 최대 높이에서 스크롤한다. 기존 saved gridPos/높이는 변경하지 않는다. 단일 사이즈 값에 불필요한 막대·용량 관계 경고·빈 table/하단 frame 선택기를 만들지 않는다.
- CSS 범위는 새 파일시스템 컴포넌트와 panel 244의 단일 정보 폭에 한정한다. 폰트/색/테두리는 기존 Wall 공통 토큰을 사용한다.

- REF-17 검증: 관련 표시 테스트 15개, 변경 파일 ESLint, 프로덕션 빌드 및 공백 검사 통과. 단일 `사이즈 1.12 GiB`는 단위 테스트에서 정보 모드/원본 값·config 보존·table/선택기 없음 확인. 브라우저에서는 격리 fixture의 소수 scalar frame이 560×164px 정보 카드, 기존 두 filesystem 행이 168px 표로 자동 전환됨을 Light/Dark에서 확인. 하단 combobox 0개. 임시 fixture flag/소스는 검증 전 상태로 복원. 저장 JSON 미변경. 캡처 `filesystem-compact-information-{light,dark}.jpg`, `filesystem-compact-table-{light,dark}.jpg`.

### REF-18 DataFrame·단위 근거 및 구현 경계

| 검사 대상 | 실제 확인 결과 | 결론 |
| --- | --- | --- |
| native 검사 → 데이터 → 패널 변환 적용/형식화 끄기 | ceph_daemon, Value #A, Value #B, Value #C의 3행 | 원본 merge→filter 결과를 소비. query runner/Transformation/JSON 수정 없음 |
| osd.0 | A=1099511627776, B=439804651110.4, C=0.4 | bytes → 1 TiB / 410 GiB, percentunit → 40% |
| osd.1 | A=2199023255552, B=1715238139330.56, C=0.78 | 2 TiB / 1.56 TiB / 78% |
| osd.2 | A=3298534883328, B=3034652092661.7603, C=0.92 | 3 TiB / 2.76 TiB / 92% |
| field config | A/B bytes override, C percentunit / max 1 / percentage thresholds 75·85 | 원본 비율 0~1을 native formatter가 한 번만 %로 표시. 원래 C의 LCD gauge는 새 표시에서 사용하지 않음 |
| 거대 퍼센트 | 이전 fixture /tmp/wall-semantic-fixture-original.py는 bytes 문자열이 든 비율 query C에도 1200000000 반환. 데이터소스 URL은 loopback 3318 | 120000000000%는 원본 fixture 비율 오류. 현재 native 변환 결과 C는 0.4/0.78/0.92이며 재현되지 않음. 실제 고객 Ceph 데이터 오류로 단정하지 않음 |

- WallDeviceCapacityView는 기존 shadcn Card 바깥 구조와 로컬 Button(../ui → 실제 Base UI Button), @base-ui/react/menu의 필드 정렬을 유지하는 Wall 소유 React 표시 구조다. CSS로 native Table을 가리는 방식이 아니다.
- 같은 변환 행의 명시적 A/B/C만 묶는다. 다른 frame/row는 동일 osd 문자열이어도 합치지 않는다. 누락 값은 —, 원본 사용률이 없거나 비정상·용량 불일치이면 원본 값을 유지하고 막대를 그리지 않는다. 원본 값을 /100, clamp, 용량 비율로 덮어쓰지 않는다.
- 식별자와 extra field, frame 이름, 필드별 정렬 및 원래 valueRowIndex의 data link를 보존한다. 임계치 marker/color는 기존 field config/processor를 사용한다. 본문 높이 측정으로 필요한 공간만 사용하며 큰 목록은 스크롤한다.
- 새 CSS는 wall-device-capacity 범위다. 공통 색/typography 토큰을 사용하고 다른 패널 유형/탭 스타일은 수정하지 않는다.

- REF-18 검증: 브라우저 Light/Dark에서 osd.0 1TiB/410GiB/40%, osd.1 2TiB/1.56TiB/78%, osd.2 3TiB/2.76TiB/92%를 확인. Capacity Bar 높이 5px, 원래 75/85 임계치와 녹색/황색/적색, native Table 0개 확인. 변경 파일 ESLint·프로덕션 빌드·관련 테스트 16개 통과(원본 비율 오류와 별도 frame 미결합 포함). 테스트 fixture/쿼리/JSON은 이번 변경에서 수정하지 않음. 캡처 device-capacity-light.jpg / device-capacity-dark.jpg.

### REF-19 원인과 범위

- 실제 DOM에서 panel 138의 본문 padding=0px, 왼쪽 inset 3px 그림자를 확인했다. 제목은 좌우 padding 14px인데 본문은 border 바로 안쪽에 붙어 정렬이 어긋났다.
- panel 138 선택자로만 본문 여백·4열 정렬·숫자 크기를 조정하고 단색 surface/no inset을 적용한다. 기존 공통 typography gauge 역할 토큰과 Wall surface 색을 사용한다. UI primitive 추가/구조 변경 없이 CSS만 수정한다. UP/DOWN과 IN/OUT은 겹칠 수 있는 집합이므로 합산하거나 원형 비율로 바꾸지 않는다.

- REF-19 검증: 데스크톱 Light/Dark에서 UP 2 / DOWN 1 / IN 3 / OUT 0 확인. 본문 좌우 padding 14px/하단 12px, 첫 label의 카드 경계 inset 15px(border 포함), 동일 폭 4열, shadow none 확인. 카드 높이 112px와 native 값/색 유지. 프로덕션 빌드·공백 검사 통과, CSS만의 국소 변경이므로 추가 테스트는 작성/실행하지 않음. 캡처 glue-status-summary-light.jpg / glue-status-summary-dark.jpg.

### REF-19 추가 수정: 넓은 화면의 우측 빈 공간

- 사용자 후속 피드백에 따라 panel 138의 grid stretch를 제한한다. 카드 최대 폭은 360px, 좌측 정렬, 좁은 부모에서는 width 100%로 축소한다. 본문은 동일 폭 1fr 4열 대신 내용 폭 auto 4열 + space-between으로 배치해 마지막 열 뒤의 남는 열 공간을 제거한다. 이 기준이 위의 동일 폭 4열 기록보다 우선한다.
- 상태 값·색·순서·높이 112px·기존 padding 14px/12px는 유지한다. 다른 스토리지 카드의 폭은 변경하지 않는다. CSS만의 국소 수정이다.

- 폭 추가 수정 검증: 부모 405px에서도 해당 카드 폭 360px, 열 폭 약 16/36/16/24px, 마지막 열부터 카드 경계까지 15px(기본 padding+border) 확인. UP 2/DOWN 1/IN 3/OUT 0 유지. 프로덕션 빌드·공백 검사 통과. 캡처 glue-status-summary-compact-width.jpg.

### REF-20 Scenes/Grid 분석 및 시범 저장 범위 (2026-10-28)

| 항목 | 소스 근거 / 선택 |
| --- | --- |
| 현재 엔진 | @grafana/scenes 5.20.3 SceneGridLayoutRenderer는 react-grid-layout을 사용. 저장소 설치본은 기존 patch 1.4.4, react-resizable 3.0.5. KpiLayoutPilot은 같은 설치 엔진을 직접 import하고 native VizPanel/activation/query runner는 그대로 렌더링 |
| Scenes 전체 Grid를 활성화하지 않는 이유 | DefaultGridLayoutManager.editModeChanged는 원본 grid에 isDraggable/isResizable을 쓰고, SceneGridLayout.onLayoutChange/onResizeStop은 원본 x/y/width/height를 갱신한다. 이 시범은 JSON 미변경 조건이 있으므로 위치를 React 상태의 표시 좌표로 분리한다 |
| 세밀한 조절 | Scenes dist의 GRID_COLUMN_COUNT=24, GRID_CELL_HEIGHT=30, margin=8 고정. 기존 RGL은 cols/rowHeight를 받으므로 시범은 48열, rowHeight 6 + gap 12로 세로 피치 18px. 최대 폭 1076px에서 가로 피치 약22.7px, 기본 w12/h6=260×96px |
| 24열 JSON 호환 한계 | 48열의 홀수 x/w는 기존 24열에 매핑하면 0.5칸이다. 저장 JSON에 임의 반올림/반영하지 않는다. 실제 원본 저장·타 사용자 공유는 별도 설계가 필요하며 이번 범위에서 제외 |
| 저장 | 키 wall-modern:kpi-layout:v1:dashboardUID:orgID:userID. version 및 4개 ID/좌표/범위/겹침 검증 후 브라우저 localStorage에 좌표만 저장. 원본 panel/query/model은 저장하지 않음. 서버 API/DB save 호출 없음 |
| 취소 / 실패 | 취소는 draft를 적용하지 않고 기존 저장/기본 배치로 복귀. 새로고침도 미저장 draft 폐기. 저장 실패 시 오류와 draft를 유지한다. 기본 배치 버튼도 draft만 바꾸며 저장을 따로 해야 한다 |
| 권한 | contextSrv.user.orgRole=Admin 또는 isGrafanaAdmin, 그리고 DashboardScene.canEditDashboard 모두 필요. 일반 Editor/Viewer는 진입 버튼·핸들·관리자 local 배치 적용 없음. local 저장은 보안 권한을 만들거나 서버 권한을 바꾸지 않음 |
| 실제 UI primitive | 기존 로컬 shadcn Card/Content 및 Button(../ui → @base-ui/react/button). 이동/resize/collision/placeholder는 기존 react-grid-layout. 별도 dnd 라이브러리·새 패널 editor·포인터 엔진 없음 |
| 범위 / 제약 | 05 개요 panel 28/30/34/36. 다른 패널은 조정 불가. 가용 폭 760px 미만은 기존 compact grid 유지, 조정 진입 비활성. 원본 59개 패널/탭/시간/변수/refresh/권한 유지 |

- 선택한 카드의 이동/우하단 resize 핸들만 표시하고 드래그 중 점선 격자와 native 배치 placeholder를 표시한다. 크기는 px와 48열 격자 w×h를 함께 표시한다. 충돌 시 엔진이 다른 KPI를 밀며, 빈 위치는 자동 상단 압축하지 않는다. reduced-motion에서는 이동 transition을 끈다.
- 기존 @types/react-grid-layout의 legacy React class 선언 충돌은 runtime을 바꾸지 않는 타입 어댑터로 한정한다. Props는 기존 public 타입을 재사용하며 React-facing children/resizeHandle 선언만 현재 React 타입에 맞춘다.

- REF-20 브라우저 검증: 관리자 역할에서 진입 버튼 확인. 선택 카드의 resize 핸들 visible / 나머지 hidden 확인. 기존 엔진의 이동·충돌 처리 확인. 260×96px(w12/h6)→305×132px(w14/h8)→283×132px(w13/h8) 조절 확인. 취소 시 260×96px 및 핸들 0개로 복원. 283×132px 저장 후 reload에서 editing=false 및 동일 크기 복원 확인. DB의 23개 저장 JSON은 기준과 모두 동일. 기본 배치로 복원 후 시범 모드 제공.
- REF-20 검사: Workspace 3개 suite/12개 테스트(관리자·Editor·Viewer 구분, 무권한 local 적용 방지, 비정상·중복·겹침 좌표 거부, 저장/취소/재로드/저장 실패, 기존 59개 Scene 직렬화 불변) 통과. 변경 파일 ESLint·프로덕션 빌드 통과. 전체 타입 검사는 기존 130개 진단이며 새 파일 진단 0개.

- REF-20 최종 화면: Light/Dark 조정 모드에서 점선 격자·선택 테두리·이동/resize 핸들·px/격자 크기 가독성을 확인했다. 빈 아래 위치로 옮긴 카드가 상단으로 재압축되지 않으며 취소로 기본 배치가 복원됨을 확인했다. 현재 검증 브라우저는 기본 배치의 Light 조정 모드로 제공한다. 캡처 kpi-layout-pilot-light.jpg / kpi-layout-pilot-dark.jpg / kpi-layout-moved-light.jpg.

### REF-21 실제 데모 관찰과 동작 오류 수정 (2026-10-28)

| 항목 | 관찰 / 수정 근거 |
| --- | --- |
| 실제 참조 | https://wkf10640.apps.dynatrace.com/ui/apps/dynatrace.dashboards/dashboard/dynatrace.dashboards.getting-started 의 기존 탭에서 pie 타일 4×4→5×5 조절, 한 칸 이동 후 원래 크기·위치로 복원했다. Save as new/Discard changes는 호출하지 않아 기존 사용자 draft를 보존했다 |
| 조작 패턴 | 전체 편집 화면 이동 없이 타일 선택 시 위에 도구 모음, 양쪽 하단 resize, grid 단위 표시와 스냅·주변 타일 재배치. 애니메이션의 내부 easing/정확한 duration은 단정하지 않는다. Wall은 기존 RGL 140ms transition과 조작 중 transition none을 유지 |
| 비활성 핸들 오류 | RGL이 readonly/비선택 카드에도 resize span을 렌더링했으며 기존 Grafana hover 스타일로 보일 수 있었다. isResizable=false여서 화살표가 보여도 동작하지 않았다. 선택 카드만 resizeHandles=[sw,se], 나머지는 []로 하여 DOM 자체 제거 |
| 진입 경로 불일치 | 기존 상단 편집은 dashboard.onEnterEditMode를 호출하고 시범 모드는 별도 배치 조정 버튼이었다. 이제 대상 UID 관리자+canEdit에서 상단 편집은 wallLayout=kpi/wallTab 해제로 inline 진입, 전체 편집은 추가 편집 옵션의 명시적 메뉴로 분리. Editor/Viewer 권한 기준 유지 |
| 직접 선택 | 관리자 read-only KPI를 직접 누르면 선택한 KPI로 inline 조정 시작. 데이터 링크/패널 메뉴 등 실제 button/a/input 이벤트는 가로채지 않는다. 모드 URL은 query/var/time과 분리된 표시 상태이며 저장/취소 시 제거 |
| 초기 데이터 표시 | 자식 Scene wrapper가 먼저 활성화되면 activateInActiveParents(child)가 early return하여 parent 활성화를 건너뛸 수 있었다. 부모들을 useLayoutEffect에서 root→parent 순서로 activate하고 각 참조를 소유·해제한다. 공통 부모를 첫 카드 cleanup이 비활성화하지 않도록 refcount를 균형 유지. query/변환/저장 모델 변경 없음 |
| 디자인 범위 | 기존 로컬 shadcn Button 및 같은 react-grid-layout 엔진을 유지. 타 제품의 maximize/duplicate/editor 기능·아이콘 배열을 복제하지 않고 배치에 필요한 size/move만 Wall 도구 모음으로 제공. 대상 KPI 4개만 조정 |

- 실제 대시보드 탭에서 새로고침 후 탭을 바꾸지 않고 가동40s/vCPU24/메모리1GiB/SWAP1GiB 확인, 조회 모드 resize DOM 0개 확인. 상단 편집 → inline 모드, 취소 → 원래 URL, 메모리 직접 클릭 → panel34 선택 및 양쪽 핸들만 렌더 확인. 오른쪽 조절 283×114px/왼쪽 조절 283×96px, 떠 있는 move 핸들로 이동 및 취소 복원 확인. Light/Dark 캡처 inline-layout-actual-light.jpg / inline-layout-actual-dark.jpg.
- 회귀 테스트는 비선택 resize DOM 제거, 직접 클릭, 공통 URL 진입/종료, native engine drag 동안 data-interacting/placeholder, 부모 refcount, 관리자 toolbar inline/full-editor 경로를 포함한다. 기존 Scenes 데이터·59개 직렬화 불변 검사를 유지한다.

- REF-21 최종 검사: 관련 4개 suite/27개 테스트 통과, 변경 파일 ESLint·프로덕션 빌드·공백 검사 통과. 전체 타입 진단은 기존 130개로 신규 Wall 진단 없음. 저장 DB의 23개 Dashboard JSON은 기준과 모두 동일. 초기 표시를 탭 전환으로 우회하지 않았고, 이전 시범 탭도 새 코드로 갱신하여 이전 비활성 핸들이 남지 않도록 확인했다.

### REF-23 실제 조작과 미저장 변경의 상태 분리 (2026-10-28)

| 상태 | 표시 / 전환 |
| --- | --- |
| 일반 조회 / 단순 카드 클릭 | 전체 편집 상태 없음. Grid·선택 테두리·크기 안내·저장/취소 없음 |
| 관리자 Hover / 키보드 focus | 카드 안의 작은 GripVertical 이동 버튼과 양쪽 아래 모서리 그립. 동작하지 않는 화살표나 카드 위 floating 툴바 없음 |
| 핸들 누름 / 6px 미만의 마우스 흔들림 | 기존 RGL/Resizable의 mousedown 시작을 보류한다. 임계값 전에 release하면 엔진 조작을 시작하지 않으며 배치를 바꾸지 않는다 |
| 실제 이동 / Resize | 보류한 원점과 누적 이동을 기존 엔진에 전달한다. 해당 조작 중에만 점선 격자·native placeholder·1px 선택 강조·실제 px 및 격자 크기를 표시한다 |
| 조작 종료 | 격자·미리보기·강조·크기 안내를 즉시 제거한다. 순서에 독립적인 실제 i/x/y/w/h 비교로 저장 배치와 다를 때만 작은 저장·취소 행을 표시한다. 원위치 복귀 시 변경 없음 |
| 미저장 / 저장 / 취소 | Grid가 남지 않는다. 취소는 마지막 저장 배치, 저장은 기존 version 1/localStorage 키 계약을 사용한다. 서버 저장이나 Dashboard JSON 갱신 없음 |
| 이전 wallLayout=kpi / 상단 편집 | 개요의 첫 이동 핸들 focus로 연결하고 표시용 URL flag를 제거한다. 실제 조작·전체 편집 모드를 시작하지 않는다. 별도 전체 대시보드 편집 메뉴는 유지한다 |

- 구현은 `KpiLayoutPilot.tsx`의 이벤트/React 상태 구조 변경이다. CSS만으로 기존 편집 모드를 가린 것이 아니다. React capture의 임계값 어댑터 이후 이동·Resize·스냅·충돌/주변 재배치·미리보기는 기존 react-grid-layout 1.4.4 / react-resizable 3.0.5가 담당한다. 다른 패널 본문·메뉴·차트의 마우스 이벤트는 가로채지 않는다.
- 엔진 계산 근거: 설치된 `react-grid-layout/lib/calculateUtils.js`의 calcXY는 containerPadding=0이어도 margin을 빼므로, 원래 12px margin 방식에서는 세로 드래그가 한 칸 옆으로 이동하며 인접 카드를 밀었다. 제품 전용 어댑터에서 엔진 margin=0, 폭=가용폭+12px, rowHeight=18px, 항목 내부 gutter=12px로 같은 48열 좌표를 표현한다. 실제 카드 w12/h6=260×96px·좌표 피치·12px 간격·기존 저장 좌표는 유지한다. 라이브러리나 공통 Grafana Grid 소스는 수정하지 않는다.
- 실제 primitive/import: 기존 `Button`은 `../ui` → `@base-ui/react/button`, 바깥 Card는 기존 `../components/ui/card`다. 이동 아이콘은 `lucide-react`의 GripVertical. Resize 모서리는 Wall 소유 CSS 표시이며 Base UI primitive로 가장하지 않는다. 새 라이브러리 도입 없음. 색·글꼴·모서리는 기존 Wall 토큰, 크기/피치는 기존 kpiGrid를 사용한다.
- CSS 변경은 KPI 4개 조작 안내·Hover/focus·엔진 gutter 투영에만 한정한다. Resize 그립은 기존 Grafana의 bottom/rotation 스타일보다 명확한 범위 선택자로 배치하여 카드 안쪽 모서리에 표시한다. 단색 카드/Stat 숫자·단위/데이터·시계열 스타일은 유지한다.

| 검증 범위 | 결과 |
| --- | --- |
| 실제 사용 Chrome 탭 / 첫 표시 | 탭 전환 없이 새로고침 후 40s / 24 / 1GiB / 1GiB, 카드 각각 260×96px 확인. 단순 카드·이동 핸들·Resize 핸들 클릭 후 data-interacting=false / background-image=none / 저장 컨트롤 0개 |
| 실제 세로 이동 / 저장·복원 | 메모리 x=544 유지, y=0→108px 이동. 다른 세 KPI 좌표 유지. 저장·새로고침 후 같은 배치 복원 확인 후, 원래 y=0으로 이동하여 저장 복원 |
| 실제 Resize / 취소 | Light 오른쪽 조절 283×114px, Dark 왼쪽 조절 237×114px, 실제 값 1GiB 유지. 종료 후 Grid none / 크기 안내 0 / 선택 강조 0. 취소 시 4개 원래 260×96px·위치 복원 및 저장 컨트롤 제거 |
| 메뉴 / 조작 범위 | 기존 메모리 메뉴의 보기·편집·공유·탐색 표시 확인. 메뉴 클릭은 layout 조작을 시작하지 않음. 차트/쿼리 코드 변경 없음. 이번에는 광범위한 차트 기능 재검증을 수행하지 않음 |
| 관련 테스트 | 두 suite 16개 통과. 임계값 미만에서는 엔진 drag/placeholder 자체 없음, 실제 조작 중 Grid 상태·native preview·크기 안내, 종료·원위치 복귀·저장/취소·재로드·저장 실패·세로 이동의 원래 열 보존·권한·기존 59개 직렬화 보존 포함. 조작 중 상태는 native engine 테스트로 검증했으며 브라우저 캡처는 Hover/조작 종료 화면 |
| 빌드 / 저장 모델 | 변경 TypeScript 파일 ESLint·프로덕션 build·공백 검사 통과. 전체 타입/전체 테스트 재실행 없음. 격리 DB의 23개 Dashboard JSON이 기존 기준과 모두 동일 |
| 실제 캡처 | direct-layout-hover-light.jpg / direct-layout-hover-dark.jpg. direct-layout-unsaved-light.jpg는 Resize 종료 뒤 Grid 없이 저장·취소가 표시되는 중간 검증 캡처 |

검증 데이터는 기존 로컬 fixture이며 실제 SCVM/고객 데이터 검증으로 확대하지 않는다. 최종 브라우저 배치는 원래 네 KPI의 위치·크기로 복원한다.

### REF-24 Resize 핸들 외형 정정 (2026-10-28)

- 사용자가 참고 이미지의 이중 대각선을 Dynatrace의 특징적 외형으로 지적했다. 이 시안은 즉시 폐기하고 재도입 금지로 AGENTS.md에도 기록했다. 기존 L자와 확장 화살표도 복원하지 않는다.
- 최종 표시: 20px 사각 외곽, 9px 사각 윤곽 + 5px 모서리 조절점, 24px hit area. 좌우는 수평 반전하고 대각선 stroke/rotation은 사용하지 않는다. Wall 기존 토큰으로 Light/Dark 색·4px 모서리·얇은 border/약한 shadow를 적용한다. 핸들 Hover/실제 조작 때만 primary 강조한다.
- `kpiLayout.css`의 기존 span/pseudo-element 표시만 변경했다. JSX/import/실제 Base UI primitive 추가 없음. 이전 중복된 `.wall-dashboard-workspace` 범위 선택자를 정리해 일반 상태에서는 핸들이 숨고 해당 카드 Hover/focus에서만 보이는 기준을 유지한다.
- 임계값·이동/Resize·Grid 상태·저장·데이터 코드는 변경하지 않았다. 외형 시안 조작 검증에서 283×114px Resize/취소 복원을 확인했고, 최종 사각 조절점은 실제 사용 탭 새로고침 후 Light/Dark 표시를 확인했다. 프로덕션 빌드·공백 검사 통과. CSS 외형 변경이므로 전체 테스트는 반복하지 않았다.
- 최종 실제 캡처: resize-anchor-grip-light.jpg / resize-anchor-grip-dark.jpg. 이전 resize-square-grip-* 캡처는 거부된 이중 대각선 시안이며 최종 결과로 제시하지 않는다.

### REF-25 / REF-26 공통 패널 직접 조작 (2026-10-28)

| 항목 | 구현 / 유지 경계 |
| --- | --- |
| 최신 핸들 | 사용자 정정에 따라 두 겹의 직각 ㄴ자 선을 좌우 모서리에 맞춘다. 사각 프레임/대각선/확장 화살표 없음. 동일 CSS를 59개 패널에 사용 |
| 공통 조작 엔진 | 기존 KpiLayoutPilot의 6px 임계값·native Grid handoff·조작 중 안내·실제 좌표 비교·저장/취소를 PanelLayoutGrid로 분리. react-grid-layout 1.4.4 / react-resizable 3.0.5 그대로 사용. 기존 KPI wrapper는 v1 key, 48열/18px pitch/260×96 기본값·저장 좌표 유지 |
| 기존 화면 투영 | WorkspacePanelLayout이 승인된 CSS Grid의 실제 패널 rect/row/간격을 읽어 48열로 투영한다. 섹션 표면·제목·5개 탭은 유지. 원래 VizPanel 객체와 query runner를 그대로 렌더링하며 모델을 reparent/복제하지 않음 |
| 다양한 패널 크기 | KPI 이외의 영역은 2px 세로 pitch로 54px 서비스·64px 사용률·가변 높이 목록을 유지한다. 가로/세로 간격은 각 원래 CSS Grid에서 측정. 48열 투영의 가로 반올림은 있을 수 있다. kind/type별 최소 크기와 범위/겹침 검증, 원본 데이터 설정과 독립된 표시 좌표만 저장 |
| 조작 범위 | 개요: 핵심 자원/성능 추이/자원 사용률/스토리지 요약/서비스 상태 각 영역. 나머지 4개 탭: 해당 탭 안에서 이동. 섹션/탭 사이의 패널 이동이나 전체 편집기 개발은 포함하지 않음 |
| 저장 키 / 미저장 | KPI 기존 키 유지. 나머지는 기존 키 + :region:탭ID:원래grid클래스. 선택 영역의 저장/취소로 범위가 분명한 상태 유지. Workspace의 메모리 cache가 미저장 좌표를 탭 전환 시 보존하고 저장/취소 시 제거. 페이지 새로고침은 마지막 저장 배치. schema는 version 1의 i/x/y/w/h만 |
| 내용 높이 / 오류 | native onHeight 보고를 사용해 조작 전 기본 row 높이를 재계산하고 가짜 미저장 변경을 만들지 않는다. 저장된/미저장 사용자 배치는 유지. 잘못된 조작 좌표는 이전 draft로 엔진을 되돌리며 원본 모델은 저장하지 않음 |
| UI primitive/import | 공통 이동/저장/취소 Button은 기존 ../ui → @base-ui/react/button, 기존 Card는 ../components/ui/card. GripVertical은 lucide-react. ㄴ자 핸들은 Wall CSS pseudo-element이며 새 Base UI primitive라고 부르지 않음. 기존 kpi CSS 선택자 이름은 호환용으로 유지하되 공통 Grid가 사용 |
| 디자인 보존 | 글꼴·숫자/단위·색·테두리·카드 외형·차트 옵션은 그대로. compact 서비스/사용률에서는 이동 핸들을 값 위로 옮겨 상태값을 가리지 않음. 조회/단순 클릭에서는 Grid/선택 강조/저장 UI 없음 |

| 검증 | 결과 |
| --- | --- |
| 실제 Light / Dark 5개 탭 | 각각 패널·이동 핸들 수 21/19/7/6/6 = 59, uPlot 수 4/15/6/4/6 = 35. 일반 상태 Grid/조작 강조 0. 실제 원래 값·단위가 표시되는 로컬 fixture 기준 |
| 실제 시계열 이동 / 미저장 | 프로세스 panel 222를 y=544→560px 이동. 네트워크로 전환 후 돌아와 같은 미저장 좌표·저장/취소 표시 유지. 원래 패널/쿼리 객체 유지 |
| 실제 저장 / 새로고침 | 위 배치 저장 후 실제 탭 새로고침에서 y=560px 복원. 다시 y=544px로 이동·저장하여 검증 전 위치 복귀 |
| 실제 Resize / 취소 | 프로세스 panel 212의 실제 높이 256→276px, canvas 렌더 유지. 종료 즉시 Grid/크기 안내/강조 0, 오류 없음. 취소 시 256px 복원 |
| 차트 분석 동작 | 원래 glue-mon 범례 선택/복원은 layout 조작을 켜지 않음. canvas drag Zoom은 from/to 절대 시간으로 변경되고 var-scvm/var-ceph_hosts/refresh/wallTab 유지, 배치 저장 UI 0. 기존 now-1h URL로 복원. Tooltip 엔진은 미변경이며 이번 별도 Tooltip 캡처 검증은 수행하지 않음 |
| 자동 검사 | 관련 3개 suite 20개 테스트, 변경 파일 ESLint, 프로덕션 빌드·공백 검사 통과. 전체 타입 검사는 기존 130개 진단으로 Wall 파일 신규 진단 없음. 기존 59개 직렬화 보존·일반 조회자 핸들 없음·native gesture·미저장 탭 복원·내용 높이/다른 ID 개수 지원 포함 |
| 캡처 | full-layout-{overview,network,storage,devices,processes}-{light,dark}.jpg. 공통 이중 ㄴ자와 서비스 핸들 위치는 최종 화면에서 별도 확인 |

운영/고객 DB와 실제 SCVM을 수정하거나 검증하지 않았다. 저장 DB JSON 불변은 격리 개발 DB 기준으로 확인하며, 서버 저장/다른 사용자 공유 기능을 추가한 것으로 설명하지 않는다.

### REF-27 안정화 기준 (2026-10-28)

- 기존 48열/5개 탭/59개 패널/관리자 권한/로컬 저장 키와 좌표 schema를 유지한다. 새로운 편집 기능이나 라이브러리를 추가하지 않는다. 별도 재개 요청 전 레이아웃 추가 고도화는 중단한다.
- Grid의 data-interacting=false에서는 background-image/outline을 명시적으로 제거한다. 카드 클릭/Hover/focus를 조작 상태로 승격하지 않으며, 실제 handle에서 시작한 gesture와 6px 임계값을 재확인한다. 차트 본문 이벤트는 변경하지 않는다.
- window blur / 문서 숨김 / pointer·touch cancel / mouse buttons=0 복귀 시 진행 중 조작을 rollback하고 native 엔진을 정리한다. 이전에 완료한 미저장 draft는 유지하며, abort를 저장 변경으로 처리하지 않는다.
- KPI 제목은 14px, 본문은 6px이어서 숫자가 제목보다 8px 왼쪽에 붙었다. 본문을 같은 --wall-kpi-padding 토큰(14px)으로 변경했다. compact 카드 폭·높이/행의 좌측 정렬·숫자와 단위·데이터는 바꾸지 않았다.
- 실제 브라우저에서 이전 REF-21 편집 UI/상시 버튼이 남은 별도 탭을 확인했다. 이 탭의 원래 KPI 좌표가 기본 배치임을 확인하고 새 빌드로 갱신했다. 사용 중인 다른 탭의 미저장 스토리지 배치는 저장/취소/새로고침하지 않고 보존했다.
- 검증 탭 첫 표시에서 KPI 4개 title/value의 x 좌표가 각각 271/271, 543/543, 815/815, 1087/1087로 일치했다. 단순 카드·핸들 클릭 후 Grid none / data-interacting=false / 저장 UI 0을 확인했다.
- 실제 SWAP Resize 96→114px 종료 시 Grid 제거, 취소→96px 및 저장 UI 제거, 다시 저장·새로고침→114px 복원 확인 후 원래 96px로 되돌려 저장했다. native 차트 Zoom은 시간 URL만 변경하며 배치 조작/저장 UI를 켜지 않았다. 기존 now-1h URL로 복원했다.
- 두 관련 suite 17개 테스트(중단 gesture의 복구와 이전 draft 유지, 버튼 해제 누락, panel body drag 격리 포함), 변경 TS 파일 ESLint·프로덕션 빌드·공백 검사 통과. 전체 테스트/전체 타입 검사는 반복하지 않았다. 검증은 기존 격리 fixture 기준이며 운영 데이터 검증이 아니다.
- 실제 캡처: layout-stable-kpi-alignment-light.jpg. 이 기준을 유지하고 이후 작업은 사용자가 요청하는 05번 데이터 시각화·조회 UX 범위에서 진행한다.

### REF-28 고정 섹션 제목 정리 (2026-10-28)

- `WorkspaceSection title="성능 추이" description="CPU · 메모리 · 네트워크 · 디스크"`와 `title="스토리지 요약"`은 Dashboard JSON의 text/row 패널이 아닌, Workspace JSX의 고정 문구였다. 사용자가 제시한 두 대안 중 삭제를 적용했다.
- 두 wrapper를 기존 `wall-workspace-section` 클래스의 div로 바꿔 고정 제목·보조 설명 DOM을 제거했다. 내부 grid와 실제 패널 제목·크기/상대 배치·렌더러·데이터를 유지한다. grid의 내부 영역 명칭은 저장/취소의 작업 범위를 식별하는 메타데이터로 유지하며 저장 키는 바꾸지 않는다.
- 표시만 삭제하는 국소 React 변경이며 CSS 덮어쓰기나 새 primitive/import 도입은 없다. 사용자의 대안 이미지와 같은 텍스트 바/타일 편집 기능을 새로 개발하지 않는다. 레이아웃 편집 동결은 유지한다.
- 실제 Light 브라우저에서 개요의 h2가 핵심 자원/서비스 상태만 남고 해당 두 제목·보조 설명은 삭제됨을 확인했다. 기존 21개 패널·4개 uPlot, 조회 상태 Grid/저장 컨트롤 0 확인. 변경 파일 ESLint·프로덕션 빌드·공백 검사 통과. 단순 문구/구조 정리이므로 추가 테스트는 작성하거나 반복하지 않았다.
- 실제 캡처: overview-fixed-headings-removed-light.jpg. 사용자 미저장 배치가 있는 탭은 그대로 보존하고 변경 없는 검증 탭을 갱신했다.


### REF-29 Resize 핸들 선 표시 (2026-10-28)

- 참조는 사용자가 앞서 올린 `codex-clipboard-0379a0f8-487f-4b2d-ac89-b493989bb6b5.png`의 양쪽 핸들 선이다. PNG 픽셀을 읽어 선 중심의 RGB(43,44,51), 가장자리의 보간 색 RGB(96,97,102)를 확인했다. Light에는 중심 색 #2b2c33을 적용하며 공식 제품 CSS 토큰/버전의 값이라고 주장하지 않는다.
- 기존의 남색 Wall text 상속과 선택/핸들 Hover 시 primary 전환을 전용 중립 토큰으로 교체했다. --wall-resize-color(Light #2b2c33, Dark #c9cad1), --wall-resize-stroke(2px)를 modern.css에서 관리한다. 이중 ㄴ자의 크기(12/7px)·방향·배치·24px hit area는 유지한다.
- CSS만의 표시 수정이다. JSX/import/primitive/의존성/gesture/저장/쿼리 변경 없음. 05번 59개가 사용하는 공통 핸들에 적용되며 다른 컴포넌트 색은 바꾸지 않는다.
- 실제 Light 브라우저에서 양쪽 pseudo-element 색 rgb(43,44,51), 두께 2px, 12px/7px 모양 유지 확인. 핸들 Hover/클릭 뒤에도 같은 중립색이며 일반 상태 Grid/저장 UI 0. Dark는 rgb(201,202,209)/2px 가독성 확인 후 Light로 복귀. 사용자 미저장 탭은 보존했다.
- 프로덕션 빌드·공백 검사 통과. 국소 CSS 외형 수정이므로 테스트를 추가/반복하지 않았다. 최종 실제 캡처 resize-reference-color-light.jpg / resize-reference-color-dark.jpg.


### REF-30 텍스트 패널 대체 (2026-10-28)

- REF-28의 삭제는 사용자 의도와 달랐다. 성능 추이(설명: CPU · 메모리 · 네트워크 · 디스크), 스토리지 요약, 서비스 상태(기존 설명 포함)를 독립 WallTextPanel로 복원/대체한다. 핵심 자원 및 다른 탭의 제목은 이번 범위에서 변경하지 않는다.
- 단순 고정 h2를 Card로 감싼 것에 그치지 않고, version 1의 title/description 내용 모델과 실제 관리자 편집·취소·저장·재로드를 제공한다. 일반 조회자는 기본 텍스트만 표시한다. plain text로 렌더링하며 HTML을 실행하지 않는다. 잘못된 저장 형식은 기본 내용, 저장 실패는 입력 내용/오류 유지로 처리한다.
- 3개 텍스트 표시의 내부 view ID는 -1001/-1002/-1003이며 저장 JSON의 panel ID가 아니다. data-wall-text-panel로 구별하여 data-wall-panel-id의 기존 59개는 유지한다. native Grafana text 플러그인/서버 패널을 생성한 것이 아니다. 별도 쿼리·데이터·시계열 엔진 추가 없음.
- 키는 기존 관리자별 base + :text-content:trends/storage/services, :text-layout:trends/storage/services. 내용은 title/description만, 배치는 기존 i/x/y/w/h 계약만 브라우저에 저장한다. 원래 데이터 패널 저장 키나 JSON은 변경하지 않는다. 텍스트 편집 저장과 배치 저장/취소는 구분한다.
- 실제 import: ../components/ui/card의 로컬 shadcn Card, ../components/ui/popover의 로컬 shadcn Popover/Trigger/Content → @base-ui/react/popover, ../ui Button → @base-ui/react/button. 폼 input/textarea는 HTML이며 존재하지 않는 Base UI 입력 primitive를 사용했다고 주장하지 않는다. ./PanelLayoutGrid의 기존 엔진/6px 임계값/조작 중 Grid/이중 ㄴ자/실제 변경 후 저장·취소를 재사용한다. 라이브러리 및 일반 레이아웃 기능을 추가하지 않는다.
- 기본 높이 48px, 단색 surface/공통 border·radius·shadow, 제목/보조 설명은 typography.ts 역할 토큰. 액션은 패널 안에 편집과 기존 이동 핸들만 배치하며 참조 이미지의 floating 툴바/아이콘 배열은 복제하지 않는다.
- 실제 Light/Dark에서 텍스트 3개 높이 48px, 기존 개요 데이터 21개·uPlot 4개 확인. 제목 수정 취소→원문, 임시 제목 저장·새로고침→복원 확인 후 원래 성능 추이로 다시 저장했다. Resize 48→56px 및 폭 축소 후 취소→48px, 이동 y=8px 후 취소→원위치 확인. 원본 데이터/다른 사용자 미저장 탭은 수정하지 않았다.
- 관련 2개 suite 9개 테스트(권한/형식 검증/편집·취소·재로드/HTML 문자열 비실행/저장 실패/59개 원본 직렬화 보존), ESLint·프로덕션 빌드·공백 검사 통과. 전체 타입은 기존 130개 진단, 새 Wall 진단 없음. 실제 데이터 검증은 기존 격리 fixture 범위다.
- 실제 캡처: text-panels-overview-light.jpg, text-panels-services-light.jpg, text-panels-services-dark.jpg. 레이아웃 기능 동결은 지속하며 이 3개 텍스트 대체를 일반 편집기 고도화 재개로 해석하지 않는다.


### REF-31 실제 사용 탭 반영 확인 (2026-10-28)

- 새 참조 PNG 양쪽 선 중심의 최빈 픽셀은 RGB(43,44,51)이며 가장자리 보간 색은 RGB(96,97,102), RGB(149,149/150,153)이다. 코드의 Light 토큰은 이미 같은 #2b2c33이었으므로 불필요한 색상 재변경은 하지 않았다.
- 실제 사용 Chrome 탭 1296910772에서는 이전 빌드의 남색 rgb(21,35,59), 1px 선이 표시됐다. 별도 QA 탭의 반영과 실제 사용 탭의 반영이 달랐던 것이 원인이었다. 열린 패널 메뉴를 닫고 5개 탭의 미저장 배치가 모두 0임을 확인한 뒤 이 실제 탭을 갱신했다.
- 실제 탭을 원래 Light로 복원하고 양쪽 핸들의 computed border color rgb(43,44,51), width 2px를 확인했다. 모양/기능/저장 키/데이터 설정은 변경하지 않았다. 최종 캡처 resize-reference-actual-user-tab.jpg는 별도 QA가 아닌 실제 사용 탭이다.
- 이번에는 제품 코드 변경/새 빌드/테스트 반복 없이 실제 UI 반영을 바로잡고 검증 기준만 갱신했다.


### REF-32 패널 컨텍스트 액션 구조 교체 (2026-10-28)

| 항목 | 현재 기준 / 실제 구현 |
| --- | --- |
| 참조 | 사용자가 첨부한 Grafana 메뉴·이동 버튼 겹침 화면과 Dynatrace 패널 도구 이미지. 직접 조작·필요할 때만 액션 노출을 참고한다. Dynatrace의 좌측 크기 배지/아이콘 배열·툴바 형태를 복제하지 않는다 |
| Wall 구성 | 카드 우측 상단 경계의 하나의 34px 도구 모음에 관리자 이동 핸들, 명시적 보기·공유, 추가 작업 Chevron을 배치한다. 크기는 실제 이동/Resize 중에만 별도 안내한다. 텍스트 패널도 이동·기존 텍스트 편집을 같은 도구 모음에 배치한다 |
| 실제 구조 변경 | `workspace/PanelActionDock.tsx`, `WallPanelActions.tsx`가 별도 React DOM을 소유한다. 기존 `PanelMenu`의 trigger만 교체했던 방식에서 벗어나 `PanelChromePresentation.hideMenu`로 native Dropdown 자체를 렌더링하지 않는다. 다른 대시보드와 native 보기/편집/검사 화면의 원래 렌더러는 유지한다 |
| shadcn 로컬 구현 | `../ui` Button은 기존 shadcn/ui MIT 기반 로컬 composition → `@base-ui/react/button`. 새 `../components/ui/dropdown-menu`는 기존 Wall toolbar 패턴을 따른 로컬 composition이며, 공식 shadcn DropdownMenu 소스를 그대로 가져왔다고 주장하지 않는다 |
| 실제 Base UI import | `components/ui/dropdown-menu.tsx` → `@base-ui/react/menu` 1.0.0 설치 버전. Root/Trigger/Portal/Positioner/Popup/Item/Group/GroupLabel/Separator/SubmenuRoot/SubmenuTrigger를 실제 사용한다. 기존 텍스트 편집은 `../components/ui/popover` → `@base-ui/react/popover` 유지 |
| 원래 동작·권한 | 각 `VizPanel.state.menu`의 등록 activation behavior를 실행하고 permission-filtered `PanelMenuItem[]`의 href/onClick/subMenu를 재사용한다. 보기/공유/탐색/검사/편집/확장 항목을 재작성하거나 권한을 우회하지 않는다. 메뉴 준비는 해당 카드 진입 시에만 수행하고 참조를 unmount 시 해제한다 |
| URL 연결 | 기존 href를 그대로 보유하며 일반 local link는 locationService로 탐색한다. modified click은 브라우저 원래 동작을 유지한다. 보기·편집 전환은 기존 DashboardSceneUrlSync.updateFromUrl을 같은 이벤트에서 실행하여 Workspace 종료 중 Scene 상태와 URL이 어긋나지 않도록 한다 |
| CSS 역할 | `workspace/panelActions.css`는 새 DOM의 정렬/여백/단색 surface/테두리/메뉴 위계를 담당한다. 기존 Wall 색과 typography.ts 역할 토큰을 사용한다. `kpiLayout.css`는 이동 버튼의 개별 absolute 위치를 없애며, Resize 이중 ㄴ자 색·모양·gesture/저장 좌표는 유지한다. 차트 렌더러/팔레트/쿼리/데이터 설정은 수정하지 않는다 |
| 적용 범위 | UID aec03x1adsi68f의 59개 데이터 패널 및 기존 3개 Wall 텍스트 표시. 공유·검사·native 패널 편집기 자체의 디자인 변경이나 전체 레이아웃 편집 기능 확장은 포함하지 않는다 |

기존 REF-27의 48열/6px 의도 판별/조작 중에만 Grid/실제 변경 후 저장·취소/브라우저 로컬 저장 계약은 유지한다.

| 검증 | 결과 |
| --- | --- |
| 실제 Light/Dark 5개 탭 | 기존 데이터 패널 21/19/7/6/6 = 59 유지, 도구 모음은 개요 24개(기존 텍스트 3개 포함)/그 외 19/7/6/6. 중복 native 메뉴 버튼과 평상시 Grid 모두 0 |
| 실제 기존 기능 | 보기 → native ViewPanelScene 및 복귀, 공유 모달 열기/닫기, 검사 → 데이터 원래 값 40s 및 inspect URL, 실제 포인터 편집 → native 편집기 및 편집 종료 확인. 편집/공유 창의 내용이나 대시보드를 서버에 저장하지 않음 |
| 실제 레이아웃/차트 | 핸들 단순 클릭은 Grid·배치 저장 0. 가동 시간 이동 y=359→395px 후 Grid 0/배치 저장 1, 취소 후 원위치. native uPlot drag Zoom은 from/to를 절대 시간으로 변경하고 변수/갱신 파라미터 유지, Grid·배치 저장 0. 기존 시간 범위로 복원 |
| 실제 사용 탭 | Chrome 1296910772의 5개 탭 미저장 배치가 모두 0임을 확인한 뒤 최신 빌드로 갱신. 별도 QA 탭만 반영한 것으로 끝내지 않음. Light로 확인 후 펼친 메뉴는 닫아 일반 조회 상태로 정리 |
| 자동 검사 | 관련 6개 suite 33개 테스트, 변경 파일 ESLint, 프로덕션 빌드, 공백 검사 통과. 전체 tsc는 기존 130개 진단으로 Wall/PanelMenu/새 presentation 타입의 신규 진단 없음 |
| 추가 검사 한계 | 별도로 실행한 공유 PanelChrome.test.tsx의 show-on-hover 가시성 단언 1개는 JSDOM에서 실패했다. 전체 UI suite 통과로 보고하지 않는다. 이번 변경의 중복 메뉴 렌더링 제거는 overviewPresentation.test와 실제 브라우저로 확인 |
| 데이터 보존 | 격리 개발 DB의 23개 Dashboard JSON을 기존 기준 파일과 정규화 비교하여 변경 0 확인. 실제 고객/운영 DB·쿼리·임계치·단위·패널 ID·저장 JSON은 수정하지 않음. 화면 값 확인은 기존 로컬 fixture 기준 |
| 실제 캡처 | panel-actions-actual-user-light.jpg / panel-actions-actual-user-dark.jpg, panel-actions-detail-light.jpg, panel-actions-services-light.jpg / panel-actions-services-dark.jpg |

| 변경 파일 | 역할 |
| --- | --- |
| workspace/PanelActionDock.tsx / panelActions.css | 공통 컨텍스트 도구 모음의 DOM과 표시 토큰 |
| workspace/WallPanelActions.tsx / WallPanelActions.test.tsx | native 메뉴 모델 → Base UI 표시/동작 연결 및 검증 |
| components/ui/dropdown-menu.tsx | 실제 Base UI primitive 로컬 composition |
| workspace/PanelLayoutGrid.tsx / KpiLayoutPilot.tsx / WorkspacePanelLayout.tsx / kpiLayout.css | 기존 Grid에 공통 액션 slot 연결, 이동 버튼 개별 위치 제거, 크기 안내 정렬 |
| workspace/DashboardWorkspace.tsx / StorageDashboardWorkspace.tsx | 59개 모델별 액션 연결, 기존 Scene URL 처리 연결, clip 영역과 외부 도구 모음 분리 |
| workspace/WallTextPanel.tsx / textPanel.css | 기존 텍스트 편집과 이동 진입 통합 |
| workspace/overviewPresentation.tsx / overviewPresentation.test.tsx | 중복 native menu 비활성 및 header/status 보존 검사 |
| packages/grafana-ui/src/components/PanelChrome/PanelChromePresentation.ts / PanelMenu.tsx | 선택적 hideMenu 계약. Wall provider 외 기존 Dropdown 유지 |
| DESIGN_SYSTEM.md / 저장소 AGENTS.md | 현재 기준과 실제 import/검증 기록 갱신 |


### REF-33 개요의 이웃 카드 밀림 (2026-10-28)

| 항목 | 현재 기준 / 구현 |
| --- | --- |
| 요청·참조 | 사용자가 첨부한 성능 추이 제목 바와 옆 자원 사용률 카드 화면. 너비 확장 시 이웃이 아래로 이동하는 직접 조작을 참고하며 외형은 기존 Wall 유지. 이번 요청은 REF-27 동결 중 이 배치 경계 문제에 대한 명시적 변경 요청이다 |
| 원인 | 기존 CSS 2:1 열 안에 제목/차트/사용률/스토리지의 개별 PanelLayoutGrid가 있었다. 제목의 48열은 왼쪽 열만 의미하여 옆 카드와 충돌 계산이나 연쇄 이동이 불가능했다 |
| 실제 구조 변경 | `workspace/OverviewFlowLayout.tsx`에서 개요 중앙의 2개 텍스트, 4개 시계열, 사용률 묶음, 2개 스토리지 표시를 한 48열 PanelLayoutGrid에 배치한다. 첫 화면의 기존 DOM 위치·크기를 측정하여 열과 2px 행 좌표로 투영한다. 초기 측정은 legacy Grid 복원 commit 이후 수행하고, 예약 측정은 unmount 시 폐기한다 |
| 밀림 엔진 | 기존 react-grid-layout 1.4.4/react-resizable 3.0.5의 resize/drag collision 및 compactType=null을 사용한다. 별도 충돌/드래그 엔진이나 라이브러리를 추가하지 않는다. 충돌한 이웃의 x·폭은 보존하고 y를 아래로 이동하며, 차트의 원래 폭·높이와 데이터 렌더러는 그대로다 |
| 저장·이전 배치 | 새 키는 기존 관리자별 base + :region:overview:workspace-flow. 기존 text-layout/region별 키는 삭제·덮어쓰지 않는다. 새 공유 저장이 없으면 원래 화면(기존 로컬 저장 포함)의 실측을 출발 배치로 사용한다. 새 공유 저장에는 9개 표시 항목의 i/x/y/w/h만 저장하며, 미저장 탭 복원/저장·취소 계약은 유지한다 |
| 표시 ID와 데이터 | -1001/-1002는 기존 Wall 텍스트, -1004는 사용률 묶음의 표시 전용 ID다. 저장 Dashboard의 panel ID를 만들거나 바꾸지 않는다. 사용률 묶음 안의 원래 32/38/40 패널과 query runner/단위·임계치·개별 메뉴·내부 배치 기능을 유지한다 |
| 중첩 이벤트 | PanelLayoutGrid는 nearest .wall-kpi-pilot에 속한 핸들만 의도 판별한다. 사용률 내부는 기존 draggableCancel 영역으로 감싸 내부 조작이 상위 묶음 이동이 되지 않게 한다. 부모 도구 모음은 자식 조작 표면과 중복되지 않도록 표시한다 |
| 실제 컴포넌트 | WallTextPanel의 내용·편집 hook을 useWallTextPanel로 분리하여 공유 Grid에서도 기존 Card/Popover/Button을 그대로 사용한다. import는 ../components/ui/card, ../components/ui/popover → @base-ui/react/popover 1.0.0, ../ui → @base-ui/react/button 1.0.0. 새 primitive/공식 shadcn 컴포넌트 도입으로 설명하지 않는다 |
| CSS 변경 | overviewFlow.css는 사용률 묶음의 높이·스크롤과 부모/자식 액션 중복만 처리한다. 카드·폰트·색·시계열 스타일을 재설계하지 않는다. KPI, 서비스 상태 및 다른 4개 탭의 배치 범위는 그대로다 |

| 검증 | 결과 |
| --- | --- |
| 실제 Light | 성능 추이 819→1183px 확장 시 사용률은 제목과 같은 y에서 아래 60px로 이동. 4개 차트는 404×280px 유지. 조작 종료 Grid 0, 개요 Workspace 저장 UI 1. 취소 시 제목 819px/사용률 상대 y=0/저장 UI 0 복원 |
| 실제 Dark | 동일한 확장과 사용률 상대 y=60px, 기존 uPlot 4개·단위·임계치 표시, 종료 Grid 0 확인. 취소 후 Light로 복원 |
| 실제 중첩 조작 | vCPU 사용률 내부 이동 시 변경 그룹은 내부 자원 사용률 1개뿐이며 바깥 공유 배치 좌표는 유지. 내부 취소 후 모든 저장 UI 0 |
| 자동 검사 | 관련 4개 suite 16개 테스트 통과. 서로 다른 열의 행 위치 투영, native Resize의 이웃 밀림·취소·브라우저 저장/재생성 복원, 내부 Grid의 이벤트 소유권, 기존 텍스트 편집과 원본 59개 직렬화 보존 포함. 저장·복원은 자동 테스트로 검증했으며 실제 브라우저 저장을 수행한 것으로 기록하지 않는다 |
| 빌드·타입 | 프로덕션 빌드 통과(기존 경고 2개). 전체 tsc는 기존 130개 진단이며 Wall 신규 진단 없음. 변경 파일 ESLint와 공백 검사를 수행한다 |
| 캡처·환경 | overview-flow-expanded-light.jpg / overview-flow-expanded-dark.jpg. 기존 로컬 fixture 기준, 운영/고객 DB·백엔드·저장 Dashboard JSON을 변경하지 않는다 |

변경 파일: workspace/OverviewFlowLayout.tsx, OverviewFlowLayout.test.tsx, overviewFlow.css, DashboardWorkspace.tsx, WallTextPanel.tsx, PanelLayoutGrid.tsx 및 이 기준표/AGENTS.md.

REF-33 실제 사용 탭 반영: 5개 탭 미저장 0 확인 후 Chrome 1296910772를 갱신했다. 이 탭에서도 제목 너비 1184px 확장/사용률 상대 y=60px/데이터 패널 21개/uPlot 4개/종료 Grid 0을 확인하고 캡처 overview-flow-expanded-actual.jpg를 남겼다. 검증 후 취소로 원래 배치를 복원했으며 미저장 컨트롤 0이다. 개발 DB의 기존 23개 Dashboard JSON 비교 결과 변경 0, 최종 ESLint·공백 검사 통과.


### REF-34 사용자가 직접 수정한 Resize 색 반영 (2026-10-28)

| 항목 | 현재 기준 / 검증 |
| --- | --- |
| 원본 변경 | 사용자가 modern.css의 Light --wall-resize-color를 #a3a3ad로 직접 수정했다. 해당 값과 사용자 소스 변경을 그대로 보존했다 |
| 범위 | 공통 이중 ㄴ자 핸들의 Light 색만 갱신. 기존 Dark #c9cad1, 2px 선, 모양·좌표·gesture는 그대로다. 새 컴포넌트/import/primitive/의존성 도입 없음 |
| 반영 작업 | 프로덕션 프런트엔드 빌드 통과(기존 경고 2개). 격리된 3317 미리보기 서버의 asset manifest를 갱신하고 실제 사용 Chrome 탭을 새로고침했다. 5개 탭의 미저장 배치 0을 확인한 후 진행했다 |
| 실제 화면 | 원래 Light 조회 상태로 복원한 실제 사용 탭에서 양쪽 핸들의 ::before/::after border color가 rgb(163,163,173)=#a3a3ad, 두께 2px임을 확인. 미저장 배치 0. Dark는 원래 토큰 rgb(201,202,209) 유지도 확인했다 |
| 기록 | 제품 CSS를 다시 덮어쓰지 않았으며 AGENTS.md와 이 기준표의 최신 색 기준만 갱신했다. 국소 색 반영이므로 기능 테스트는 추가·반복하지 않음. 실제 캡처 resize-user-a3a3ad-light.jpg |


### REF-35 이동 시 원래 자리 교환 (2026-10-28)

| 항목 | 현재 기준 / 구현 |
| --- | --- |
| 요청·원인 | 사용자가 아래 패널을 계속 밀어 위치를 바꿀 수 없다고 보고했다. 기존 compactType=null 자유 배치 충돌이 이동에도 사용되며, 엔진의 이미 밀린 좌표가 다음 drag frame에 누적됐다 |
| 표시와 엔진의 역할 | `workspace/layoutMovement.ts`에서 원래 두 자리의 교환/drop 정책만 구현한다. react-grid-layout 1.4.4의 실제 공개 index.js export인 calculateUtils.calcXY, utils.moveElement/correctBounds/sortLayoutItems/compact를 재사용한다. 설치된 타입 선언이 해당 export를 빠뜨려 실제 signature에 한정한 타입 adapter를 둔다. 새 DnD 라이브러리나 편집기를 도입하지 않는다 |
| 교환 기준 | 원래 배치에서 서로 겹치는 면적이 작은 쪽 면적의 50% 이상이면 교환 대상으로 선택한다. 같은 대상은 35%까지 유지해 경계 떨림을 줄인다. x/y만 교환하고 w/h·패널 정보는 보존한다. 다른 크기는 native 충돌 정리로 겹치지 않게 밀며, 관계없는 빈 공간은 위로 압축하지 않는다 |
| 안정된 preview | 매 frame과 mouse/touch release에서 같은 드래그 시작 snapshot으로 계산한다. 이미 밀린 preview를 다시 기준으로 삼지 않는다. 놓을 자리와 이웃 위치를 함께 native 엔진에 반영한다. 빈 곳으로 이동하거나 원래 자리로 돌아오는 동작도 유지한다. 스크롤 중 컨테이너 위치 변화는 포인터 좌표에 반영한다 |
| 기존 계약 | 이동/Resize를 분리해 Resize는 REF-33의 아래 밀림을 그대로 사용한다. 6px 의도 판별, 중첩 핸들 소유권, 조작 중에만 Grid/안내, 실제 차이 후 저장·취소, 기존 저장 키/schema/48열을 유지한다. touch 종료에서는 changedTouches로 마지막 위치를 확인한다 |
| UI·소스 범위 | 기존 Button/PanelActionDock/이중 ㄴ자와 #a3a3ad Light 색은 유지. 새 shadcn/Base UI primitive/import나 CSS 변경 없음. 기존 05번 공통 PanelLayoutGrid에만 적용하고 데이터·query runner·단위·임계치·원본 Dashboard JSON은 변경하지 않는다 |

| 검증 | 결과 |
| --- | --- |
| 실제 Light 교환 | 개요 vCPU 차트 140의 top 413→709px, 네트워크 차트 144의 top 709→413px로 정확히 교환. 두 카드 404×280px 유지, 옆 메모리 142는 원위치. uPlot 4개 유지. 종료 Grid 0, 저장 UI 1 |
| 실제 역방향 | 같은 vCPU 차트를 다시 위로 이동하여 두 원래 위치 복귀. 종료 Grid 0·저장 UI 0. 별도 저장 없이 실제 차이가 사라지는 것도 확인 |
| 실제 Dark | 같은 교환과 종료 Grid 0/저장 UI 1 확인 후 취소로 원래 배치·Light 복원. 캡처 panel-swap-overview-light.jpg / panel-swap-overview-dark.jpg |
| 자동 검사 | 관련 4개 suite 26개 테스트 통과. 여러 frame에서 이웃이 달아나지 않음, 가로/세로 교환, 경계 유지·원점 복귀, 다른 높이·빈 공간, native live preview/release·취소·저장/재생성, touch release, 기존 Resize 밀림·중첩 동작·중단 복구를 포함 |
| 타입·빌드 | 변경 파일 ESLint·프로덕션 빌드·공백 검사 통과. 전체 tsc는 기존 130개 진단이며 Wall 신규 진단 0. 격리 DB의 기존 23개 Dashboard JSON 비교 결과 변경 0 |
| 실제 사용 탭 주의 | Chrome 1296910772에는 핵심 자원 및 개요 Workspace의 미저장 변경 2개가 남아 있다. 원래 사용자 작업을 보존하기 위해 이 탭은 새로고침하지 않았다. 새 동작 검증은 별도 Chrome 1296910792에서 수행했다. 사용자가 저장 또는 취소한 후 새로고침해야 기존 사용 탭에 새 코드가 적용된다. 이를 실제 사용 탭 반영 완료로 보고하지 않는다 |

변경 파일: workspace/PanelLayoutGrid.tsx, layoutMovement.ts, layoutMovement.test.ts, panelLayout.test.tsx 및 DESIGN_SYSTEM.md/AGENTS.md. 실제 데이터 검증은 기존 격리 로컬 fixture 기준이다.

### REF-36 이동 자리 안내와 Dot Grid 가독성 (2026-10-28)

| 항목 | 현재 기준 / 구현 |
| --- | --- |
| 요청·참조 | 사용자의 이동 핸들을 누른 동안 해당 크기·위치를 빗금으로 안내하고 점 격자를 진하게 해달라는 요청. 기존 Wall 디자인과 직접 조작 UX를 유지하며 새로운 외부 디자인·아이콘·라이브러리를 도입하지 않음 |
| 상태 구분 | 이동 핸들을 누르면 해당 항목의 현재 자리에 국소 빗금 안내만 표시한다. 6px 이동 임계값을 넘은 실제 이동 또는 Resize 중에는 놓을 자리와 전체 Dot Grid를 표시한다. 일반 카드 클릭/Hover는 변경하지 않는다. 단순 핸들 클릭도 배치를 변경하거나 저장 UI를 만들지 않는다 |
| 실제 표시 구조 | PanelLayoutGrid에 별도 pointer-events:none footprint DOM을 추가했다. 기존 native Grid의 preview 또는 현재 draft의 x/y/w/h로 위치·크기를 계산하며, 현재 자리/놓을 자리, 실제 px 크기, 1부터 시작하는 열·행과 48열 격자 크기를 표시한다. 기존 도구 모음의 중복 크기 배지는 제거했다. mouseup/cancel/blur/버튼 해제 누락에서 안내를 정리한다 |
| 공통 토큰 / CSS | modern.css의 --wall-layout-grid-dot은 Light #8394ac / Dark #8298b5, 점 반지름 1.35px이다. 카드 뒤에 가리던 점을 pointer-events:none 전경 레이어로 이동했다. 빗금·바탕색도 --wall-layout-preview-stripe/fill 공통 토큰을 사용한다. 조작 항목·안내·메뉴보다 아래에 두어 데이터 조작을 가로채지 않는다 |
| 컴포넌트와 import | 새 안내는 Wall 전용 표시 div이며 shadcn/Base UI primitive라고 표현하지 않는다. 기존 PanelActionDock의 로컬 ../ui Button → @base-ui/react/button 1.0.0 연결을 유지한다. 이번 변경에서 새 primitive/import/의존성은 없다. CSS만의 변경은 점·빗금·레이어 스타일이며, 누른 상태와 해제 조건·안내 DOM은 실제 React 구조 변경이다 |
| 보존 | REF-35의 자리 교환, REF-33의 Resize 밀림, 기존 48열 계산·저장/복원·권한·중첩 소유권을 유지한다. 사용자 수정 Light Resize 색 #a3a3ad, Dark #c9cad1, 이중 ㄴ자 2px 선은 변경하지 않는다. 데이터·쿼리·단위·임계치·Dashboard JSON을 수정하지 않음 |

| 검증 | 결과 |
| --- | --- |
| 실제 누른 상태 | Light에서 가동 시간 이동 핸들을 누르는 동안 현재 자리 260 × 96px / 1열·1행 / 격자 12 × 6 빗금 확인. 전체 Grid·저장 UI는 0. 해제 즉시 안내 0 |
| 실제 이동 Light/Dark | 개요 vCPU 차트 이동 중 404 × 280px의 놓을 자리와 짙어진 Dot Grid 확인. 종료 직후 Grid·안내 0. 역방향 이동 또는 취소로 원래 배치 복원, 기존 uPlot 4개 유지. 실제 캡처 layout-held-footprint-light.png, layout-drag-feedback-light.png, layout-drag-feedback-dark.png |
| 자동 검사 | 관련 4개 suite 28개 테스트 통과. 핸들 누름·6px 미만 이동·해제·cancel·버튼 해제 누락, native 이동/Resize·저장/복원·중첩 동작 포함. 프로덕션 빌드(기존 경고 2개), 변경 파일 ESLint·공백 검사 통과. 전체 tsc는 기존 130개 진단이며 Wall 신규 진단 0 |
| 실제 사용 탭 반영 | 이전 REF-35에 남았던 미저장 변경은 이후 없어졌다. 실제 사용 Chrome 1296910772의 5개 탭 모두 미저장 0 확인 후 새로고침했다. 개요 Light에서 점 #8394ac·Resize #a3a3ad·미저장 0을 확인했다. REF-35의 미반영 주의는 이 확인으로 해소됨 |
| 환경·한계 | 실제 브라우저 화면은 기존 격리 로컬 fixture 기준이다. 운영/고객 데이터를 검증한 것으로 보고하지 않는다. 저장/복원 회귀는 자동 테스트 기준이며 이번 브라우저 검증에서 배치를 저장하지 않았다 |

변경 파일: modern.css, workspace/kpiLayout.css, workspace/PanelLayoutGrid.tsx, workspace/kpiLayout.test.tsx 및 DESIGN_SYSTEM.md/AGENTS.md.

### REF-37 패널 이동감 비교와 렌더링 안정화 (2026-10-28)

| 비교 / 원인 | 실제 관찰 | Wall 반영 |
| --- | --- | --- |
| [Dynatrace Getting started](https://wkf10640.apps.dynatrace.com/ui/apps/dynatrace.dashboards/dashboard/dynatrace.dashboards.getting-started) | 실제 데모 Pie 타일을 이동하고 같은 자리로 복귀했다. 이동 중 translate 값은 57.25/114.5/143.125/171.75px처럼 연속 픽셀 좌표이며 transition:none, 정착 시 transform 0.2s이다. 기존 데모의 미저장 변경은 폐기하거나 저장하지 않았다 | 즉시 포인터 추종과 이웃 자리 이동을 분리한다는 조작 원칙만 참고. 타일 외형·도구 배열·아이콘·라이브러리를 복제하지 않음 |
| 애니메이션 차단 | Grafana getDashboardGridStyles의 .react-grid-item.cssTransforms에 transitionProperty:none !important가 있어 기존 Wall의 140ms CSS도 실제로 차단됐다. prefers-reduced-motion=false인데 computed property가 none인 것을 확인 | 기존 엔진의 react-grid-layout--enable-move-animations 클래스를 실제 gesture 이후 연결한다. 공통 --wall-layout-move-duration:180ms / --wall-layout-move-easing:cubic-bezier(0.2,0,0,1)을 사용한다. 첫 화면 실측·일반 클릭에서는 활성화하지 않으며 reduced motion 계약 유지 |
| 이웃의 불필요한 왕복 | REF-35에서도 교환 임계값 전에는 native 자유 배치 충돌로 이웃을 아래로 민 뒤, 교환 시 위로 올리고 있었다. 실제 computed y가 원래 356px보다 아래 549px에서 위로 이동하는 것을 포착했다 | 작은 겹침에서는 원래 drop 자리와 이웃을 유지하고 native 잡은 카드만 픽셀 이동한다. 기존 50% 진입/35% 유지 조건이 성립하면 한 번 교환한다. 빈 공간 이동과 다른 크기의 native 충돌 정리·Resize 밀림은 보존 |
| 반복 렌더링 | 매 move의 preview 상태가 PanelLayoutGrid 전체를 렌더링하며 renderPanel/renderActions와 Grid props/children을 매번 다시 구성했다 | LayoutFootprint.tsx의 독립 상태로 안내만 갱신하고 같은 셀의 중복 갱신을 생략한다. 콘텐츠·액션·Grid 좌표/children은 useMemo로 재사용한다. native 데이터 컴포넌트 자체의 실시간 갱신은 막지 않는다 |
| 차트와 이동 충돌 | 이동 경로의 다른 차트에서 hover Tooltip이 나타나는 것을 실제 캡처에서 확인 | 실제 layout gesture 동안에만 .wall-workspace-panel의 pointer-events를 끄고 종료 즉시 복원한다. 이동 핸들/Resize 핸들은 카드 콘텐츠 밖에 있어 native 조작을 유지한다 |

| 구현 / 검증 | 결과 / 경계 |
| --- | --- |
| 실제 컴포넌트 | LayoutFootprint는 React forwardRef/useImperativeHandle/useState로 분리한 기존 Wall 안내 DOM이다. 새 shadcn/Base UI primitive/import/라이브러리 없음. 기존 ../ui Button → @base-ui/react/button 1.0.0, native react-grid-layout 1.4.4/react-resizable 3.0.5를 계속 사용한다. CSS만의 변경은 motion 토큰·transform 전환·조작 중 compositor 힌트/차트 pointer-events이며 상태 분리·memo·교환 대기는 TypeScript 구현 변경이다 |
| 실제 Light | 첫 표시 140/144 차트는 원래 404×280px, top 413/709px 유지. 드래그 중 잡은 카드 transform 245→282→319px 및 duration 0s, 이웃은 원래 356px에서 317.256→224.143→164.751→127.109px처럼 목표 60px로 이동하고 duration 0.18s임을 확인. 임의 FPS 향상률을 주장하지 않는다 |
| 실제 Dark·완료 상태 | Dark에서도 잡은 카드 0s/이웃 0.18s 확인. Light/Dark 왕복 이동·취소 후 Grid/안내/미저장 0, uPlot 4개 유지. 실제 Resize 후 저장 UI 1/종료 Grid 0, 취소로 원래 배치 복원. 일반 클릭도 Grid 0. 조작 중 chart pointer-events:none, 종료 후 auto 복원 확인 |
| 자동 회귀 | 관련 4개 suite 30개 테스트 통과. 1px 단위의 실제 native translate 연속 이동에서도 패널/액션 callback은 초기 각 4회만 호출되고 move마다 증가하지 않는 검사, 교환 전 이웃 고정, 기존 save/restore·cancel·Resize·중첩·중단 복구 포함. 최종 변경 파일 ESLint 및 production build 통과(기존 경고 2개). 전체 tsc 기존 130개 진단, Wall 신규 진단 0 |
| 실제 사용 탭 | Chrome 1296910772는 확인 시 미저장 배치가 있어 강제로 새로고침하지 않았다. 마지막 확인은 개요 Workspace 미저장 1개이다. 새 코드의 실제 조작 검증은 Chrome 1296910792에서 수행하고 이 최신 검증 탭을 남겼다. REF-36의 이전 반영 완료와 이번 미반영 상태를 구분한다 |
| 데이터 / 캡처 | 기존 격리 로컬 fixture 기준. 기존 23개 Dashboard JSON 정규화 비교 변경 0. UID·panel ID·쿼리·단위·임계치·저장 key/schema·48열은 변경하지 않음. 최종 Light 캡처 wall-movement-smooth-final-light.png, Dark 캡처 wall-movement-smooth-dark.png. 외부 운영/고객 환경은 변경하지 않음 |

변경 파일: workspace/PanelLayoutGrid.tsx, LayoutFootprint.tsx, layoutMovement.ts, layoutMovement.test.ts, kpiLayout.test.tsx, kpiLayout.css, modern.css 및 DESIGN_SYSTEM.md/AGENTS.md.

### REF-38 이동 경계·그룹·복제의 현재 한계와 다음 설계 제안 (2026-10-28)

사용자 요청: 섹션별 이동 경계의 이유, 섹션 생성 가능 여부, 자원 사용률 그룹에 사용자가 항목을 추가할 수 있는지 설명하고 Dynatrace 타일의 복제 등 기능 확장 방향을 검토한다. 첨부 3개 이미지를 기준으로 아래를 구분한다. 이번 기록은 소스 분석이며 기능 구현 완료나 새로운 저장 방식의 확정을 뜻하지 않는다.

| 질문 | 실제 소스 기준의 현재 상태 |
| --- | --- |
| 이동 경계 | DashboardWorkspace의 핵심 자원 KpiLayoutPilot, 중앙 OverviewFlowLayout, 서비스 상태 WorkspacePanelLayout은 각각 별도 Grid/배치 키다. 패널 소속은 서로 옮길 수 없다. 중앙 내부만 REF-33에서 통합됐으며 탭 전체가 하나의 Grid인 것은 아니다 |
| 섹션 생성 | WorkspaceSection은 코드로 고정한 HTML section과 제목이며 사용자 생성/삭제 모델·UI가 없다. 성능 추이/스토리지 요약/서비스 상태의 WallTextPanel은 별도 표시 텍스트이고 사용자가 새 그룹을 만드는 기능이 아니다 |
| 자원 사용률 | model.ts overviewSections.usage의 고정 ID 32/38/40을 DashboardWorkspace의 Card/CardContent/내부 WorkspacePanelLayout으로 렌더링한다. 바깥 Grid에서는 표시 전용 -1004 묶음이고 안쪽은 원래 3개 패널이다. 사용자 항목 추가·제거·그룹 해제는 구현되지 않았다 |
| 원래 Grafana 기능 | 이 저장소 11.4 DefaultGridLayoutManager.addNewRow()의 SceneGridRow/RowActions와 duplicatePanel()의 native 패널·데이터 상태 clone이 존재한다. 현재 Card 안의 자유로운 중첩 그룹은 이 Row를 그대로 노출한 기능이 아니다 |
| 복사와 복제 | PanelMenuBehavior의 Copy는 copyPanel로 패널 JSON을 복사한다. Duplicate는 실제 isEditing일 때만 노출되며 새 ID의 VizPanel과 데이터 상태를 복제한다. Wall의 간편 이동은 이 isEditing 상태를 켜지 않으므로 복제 버튼은 연결되어 있지 않다. 현재 Copy가 있다는 이유로 Duplicate가 구현됐다고 보고하지 않는다 |
| 새 패널의 표시 | overviewSections와 displayKinds는 기존 panel ID 목록 기준이다. 복제된 새 ID는 기존 사용률 그룹에 자동 진입하지 않으며 분류에 따라 추가 지표/native 표시로 남을 수 있다. 복제 버튼 추가에 앞서 동적 소속·표시 역할과 저장 배치 검증을 설계해야 한다 |

| 다음 설계 제안 — 아직 미구현 | 기준 |
| --- | --- |
| 탭 | 기존 5개 작업 영역을 유지하고 각 탭 안의 배치는 하나의 좌표계로 통합하는 방향. 현재 고정 Grid 경계를 사용자가 섹션 경계로 오해하지 않도록 한다. 탭 간 이동은 별도 기능 범위로 구분한다 |
| 텍스트 | 성능 추이 같은 제목·설명은 이동 가능한 텍스트 타일이다. 텍스트가 보이지 않는 이동 장벽을 만들지 않는다 |
| 패널 | 데이터 표시·쿼리·단위·임계치·상호작용을 담당한다. 이름 변경만으로 다른 데이터 의미/단위로 바뀌지 않는다. 새 ID에도 표시 역할을 전달할 수 있어야 한다 |
| 그룹 | 자원 사용률처럼 사용자가 명시적으로 묶는 선택형 컨테이너로 정의한다. 그룹 전체 이동과 자식 이동의 대상을 명확히 하며 추가/빼기/그룹 해제를 별도 작업으로 제공하는 방향. 초기에는 한 단계의 그룹을 권장하고 무제한 중첩은 기본값으로 삼지 않는다 |
| 도구 모음 | 이동·크기 안내·확대/보기·복제·편집·추가 작업을 권한/선택 대상에 맞춰 연결하는 방향. 데이터 패널, 텍스트, 그룹에 같은 기능이 모두 존재한다고 가정하지 않는다. Dynatrace 전체 제품 기능을 구현한 것으로 표현하지 않으며 외형 복제 원칙 REF-22 유지 |
| 저장 계약 | 배치/그룹 표시 설정과 실제 패널 생성/복제/쿼리 변경을 구별한다. 실제 독립 패널 복제는 새 ID와 Dashboard 저장 내용 증가가 필요하므로 현재의 원본 JSON 불변/로컬 배치 저장과 동일한 작업으로 취급하지 않는다. 기존 ID·데이터는 보존하고 새 패널 내용 저장/취소를 명확히 설계한다 |
| 진행 순서 | 05번 탭 내부 공통 배치·동적 소속 모델 → 선택형 그룹과 자식 편집 → native 복제·편집 및 저장/취소 연결. 다른 UID 확장·신규 데이터 엔진·운영 DB 변경은 포함하지 않는다 |

이번 변경은 이 기준표와 AGENTS.md의 분석 기록뿐이다. 제품 코드·Dashboard JSON·브라우저 배치·컴포넌트 import·CSS는 수정하지 않았고 새 브라우저 조작 검증은 수행하지 않았다. 위 제안은 현재 구현과 구별하여 후속 작업 범위를 정하는 근거로 사용한다.

### REF-39 고정 경계 제거와 독립 사용률 패널 (2026-10-28)

| 항목 | 현재 결정 / 실제 구현 |
| --- | --- |
| 사용자 결정·근거 | 사용자가 고정 섹션/그룹을 기본으로 적용하지 말고 완전한 자유 배치로 변경하도록 명시했다. 편집 가능한 그룹 생성·추가·해제가 없는 상태에서 강제 그룹을 두는 것은 일관되지 않으므로, 자원 사용률은 독립 패널로 판단·분리했다. 참조는 이번 사용자 요청과 기존 REF-22/37의 직접 조작 원칙이며 외부 UI를 새로 복제하지 않는다 |
| 개요의 공통 좌표계 | FreeOverviewLayout.tsx가 개요의 데이터 패널 21개와 표시 텍스트 4개를 한 48열/2px 행 Grid로 투영한다. KPI·시계열·스토리지·서비스·사용률·텍스트 사이에 숨겨진 Grid 경계가 없다. 기존 다른 네 탭은 이미 각각 하나의 Grid여서 그대로다. 5개 탭을 합치거나 탭 사이 드래그 기능을 새로 추가한 것은 아니다 |
| 강제 그룹 제거 | 원래 Gauge 패널 32/38/40을 Compact Usage Bar 디자인 그대로 각각 독립 Card로 표시한다. 최종 트리에 표시용 -1004 묶음·자원 사용률 헤더·내부 Grid가 없다. 서비스 상태도 각 원래 패널을 같은 좌표계의 독립 타일로 이동할 수 있다. 사용자 생성 그룹 기능·패널 복제는 이번 범위에서 추가하지 않음 |
| 제목의 역할 | 핵심 자원도 resources/-1005 표시 텍스트로 바꿔 기존 성능 추이/-1001, 스토리지 요약/-1002, 서비스 상태/-1003와 함께 이동·크기 조절·텍스트 편집이 가능하다. 제목이 배치 영역을 제한하지 않는다. -1005는 Wall 표시 ID이며 Grafana JSON에 새 데이터 패널을 추가한 것이 아니다 |
| 이전 배치 이어받기 | 최초 통합 시 기존 KPI/region/shared-flow/text 배치가 복원된 DOM의 모든 데이터 패널·텍스트 위치를 연속 두 frame의 안정된 실측으로 가져온다. 기존 포함 관계는 풀고 native compact(null)로 새 공통 gutter 충돌만 정리한다. 기존 localStorage 키는 삭제·덮어쓰지 않는다. 통합 저장은 관리자별 기존 base + :tab:overview:free-layout의 version 1/i/x/y/w/h만 사용하며 저장 전에는 자동으로 영속화하지 않는다 |
| 이전 코드의 경계 | 기존 OverviewFlowLayout·KpiLayoutPilot·usage Card 구성은 이전 저장 위치를 읽는 최초 측정 경로에만 남는다. FreeOverviewLayout의 profile 확정 이후에는 최종 단일 Grid로 교체된다. 이를 현재 화면의 편집 가능한 섹션/그룹 기능이라고 설명하지 않는다. 작은 화면에서는 비중첩 fallback 목록을 사용하며 이번 디자인 검증은 데스크톱 기준이다 |
| 권한·조작 | PanelLayoutGrid에 readOnly 표시 경로를 추가하여 Viewer도 독립 패널 구성을 보되 이동 Button/Resize handle은 렌더링하지 않는다. 관리자만 기존 편집 권한과 로컬 배치 저장을 사용한다. 6px 임계값·180ms 이웃 전환·빗금 안내·단순 클릭/Hover·저장/취소 계약은 유지한다. 상단 편집 도움말도 핵심 자원 한정 문구에서 패널 배치 문구로 수정했다 |
| 실제 컴포넌트/import | FreeOverviewLayout → ./PanelLayoutGrid, ./WallTextPanel의 기존 useWallTextPanel 및 react-grid-layout 1.4.4의 utils.compact를 사용한다. 독립 카드의 실제 로컬 shadcn Card는 ../components/ui/card, 텍스트 편집 Popover/Button은 ../components/ui/popover → @base-ui/react/popover 1.0.0 및 ../ui → @base-ui/react/button 1.0.0을 재사용한다. Base UI Card/Section을 새로 도입했다고 표현하지 않는다. freeOverview.css는 독립 사용률·서비스의 공통 Card 경계/표면과 fallback 배치만 처리한다 |

| 검증 | 결과 |
| --- | --- |
| 첫 표시 / 59개 정보 | 새로고침 후 첫 개요의 최종 Grid 1/타일 25/데이터 패널 21/사용률 묶음 0 확인. 최초 쿼리 로딩 후 native uPlot 4개가 활성화됨을 확인했다. 탭 전환으로 초기 로딩을 우회하지 않았다. 나머지 탭의 단일 Grid와 패널 수는 19/7/6/6으로 총 59개 유지 |
| 실제 경계 이동 Light | 가동 시간 28을 원래 KPI 영역에서 차트 영역으로 이동: y=60→520px, 차트 140은 y=60px로 재배치. 개요 저장 UI는 1개이며 종료 Grid 0/uPlot 4개, 취소로 복원. 서로 다른 크기의 충돌 정리는 기존 native helper를 사용하므로 항상 두 원래 좌표만 바뀐다고 설명하지 않는다 |
| 실제 독립 사용률 | 32 패널을 x=857/y=248에서 원래 KPI 위치 x=0/y=60px로 독립 이동했다. 동일한 개요 Grid이며 다른 두 사용률과 함께 움직이지 않는다. 값 24.00%/68.00%/68.00%, 기존 임계치 75%/85% 표시 유지. 종료 후 취소로 복원 |
| 실제 Dark / 분석 기능 | Dark에서도 기존 KPI 영역 밖으로 이동·취소, 종료 Grid 0 확인. native 차트 drag Zoom은 from/to를 절대 시간으로 변경하고 배치 Grid/저장 UI는 0이었다. 원래 시간 URL로 복원했으며 변수·refresh는 유지 |
| 자동 검사 | 관련 6개 suite 39개 테스트 통과. 서로 다른 종전 영역의 KPI/사용률 이동·취소·저장/재생성, 독립 사용률 투영 및 gutter 정리, Viewer 핸들 DOM 0, 기존 59개 원본 직렬화·탭 키보드·텍스트 편집·중단 복구 포함. production build(기존 경고 2개)·변경 파일 ESLint 통과. 전체 tsc는 기존 130개 진단이며 Wall 신규 진단 0 |
| 실제 사용 탭 반영 | Chrome 1296910772의 5개 탭 모두 미저장 0 확인 후 최종 빌드로 갱신했다. 이 실제 탭에서 Dark/단일 Grid/타일 25/데이터 21/uPlot 4/묶음 0/저장 UI 0 및 새 편집 도움말을 확인했다. 이전 REF-37의 미반영 주의는 해소됐다 |
| 데이터·화면 근거 | 기존 로컬 fixture 기준이며 운영 데이터 검증으로 표현하지 않는다. 저장 JSON·UID·원래 panel ID·쿼리·변환·단위·임계치·시간 기능은 수정하지 않는다. 실제 캡처 free-overview-light.png, free-overview-actual-dark.png, free-overview-kpi-cross-section-light.png, free-overview-independent-usage-light.png, free-overview-cross-section-dark.png |

변경 파일: workspace/FreeOverviewLayout.tsx, FreeOverviewLayout.test.tsx, freeOverview.css, DashboardWorkspace.tsx, PanelLayoutGrid.tsx, WallTextPanel.tsx, toolbar/WallDashboardToolbar.tsx 및 DESIGN_SYSTEM.md/AGENTS.md.

### REF-40 배치 편집 실행 취소·다시 실행 (2026-10-28)

| 항목 | 구현 / 현재 기준 |
| --- | --- |
| 요청·범위 | 사용자의 편집 작업 뒤로/앞으로 가기 요청을 Wall 배치 편집의 Undo/Redo로 구현했다. 05번의 이동·Resize와 그로 인해 이동한 이웃 좌표 전체가 대상이며 텍스트 타일의 위치/크기도 포함한다. 브라우저 뒤로/앞으로, 시간 범위 이동, native Grafana 전체 편집기 또는 저장한 텍스트 내용의 이력을 대체하지 않는다 |
| 작업 단위 | layoutHistory.ts는 drag/Resize 종료 시 검증된 i/x/y/w/h의 before/after를 불변 복사한다. 한 gesture는 한 작업이며 중간 frame·단순 클릭·원래 자리 복귀·중단된 gesture는 기록하지 않는다. native Grid의 쿼리/Scene/필드 설정은 기록하지 않는다. 탭별 최근 50개 작업을 현재 페이지 세션의 메모리에 보관한다 |
| 상단 표시 | toolbar/WallLayoutHistoryControls.tsx를 기존 Wall Toolbar의 보조 작업 그룹에 연결했다. 실행 취소/다시 실행은 기록이 생기면 표시하며 불가능한 방향은 disabled다. 전부 Undo해 저장 UI가 사라져도 Redo는 유지한다. 실제 gesture 도중에는 기록 재생을 막고, 새 작업을 확정하면 이전 Redo 분기를 폐기한다 |
| 저장·전체 취소 | 배치 저장 성공 또는 기존 취소 버튼은 현재 탭의 Undo/Redo를 비운다. localStorage 저장 실패 시 배치와 이력을 유지한다. Undo/Redo 자체는 브라우저 저장이나 Grafana 저장을 수행하지 않으며 변경된 결과를 기존 배치 저장으로 확정한다. 기존 version 1 배치 key/schema는 유지하고 새 이력 필드를 영속화하지 않는다 |
| 탭 재진입 | LayoutHistoryContext의 provider가 native Page 바깥의 DOM 없는 공통 React 부모로 toolbar/Workspace를 연결한다. 탭별 저장 key와 기존 draftCache를 재사용한다. bootstrap 재측정으로 기본 geometry가 달라질 수 있으므로 기록이 있는 동안 최초 saved baseline도 함께 보존한다. 이를 생략하면 Undo한 뒤에도 dirty가 남는 문제가 실제 브라우저에서 발생해 보완했다 |
| 단축키·입력 보호 | Ctrl/Cmd+Z는 Undo, Ctrl/Cmd+Shift+Z와 Windows Ctrl+Y는 Redo다. 입력창·textarea·select·contenteditable·textbox·dialog·menu와 IME 조합 중에는 기본 동작을 유지한다. 처리 가능한 이력을 실제 재생했을 때만 preventDefault한다. 다른 UID/읽기 전용/전체 편집 화면에는 활성 배치 controller를 연결하지 않는다 |
| 실제 UI·import | WallLayoutHistoryControls → ../ui의 로컬 shadcn-style Button → @base-ui/react/button 1.0.0을 실제 사용한다. Undo2/Redo2는 기존 lucide-react 0.468.0 아이콘이다. history state는 React Context/useSyncExternalStore이며 새 편집 엔진이나 라이브러리를 도입하지 않는다. 기존 wall-toolbar-group/control/icon 클래스·높이·색·테두리 토큰을 재사용하며 이번 작업에 새 CSS는 없다 |

| 검증 | 결과 |
| --- | --- |
| 실제 Light 이동 | 28 패널 y=60→520px 이동 후 Undo로 y=60px/저장 UI 0, Redo로 y=520px/저장 UI 1 확인. Undo 시 반대 방향 버튼이 살아 있고 native uPlot 4개를 유지한다. 캡처 layout-history-undo-light.png |
| 실제 탭·키보드 | 네트워크에서는 개요의 Undo를 표시하지 않고 개요 재진입 후 기록을 복원한다. 재측정 이후 Undo로 저장 UI 0을 확인했다. 실제 Mac Cmd+Z/Cmd+Shift+Z 재생과 Dark 표시를 확인했다. Windows 조합과 입력 보호는 자동 테스트로 검증했다 |
| 실제 Resize·새 분기 | 260×108px → 286×140px Resize, Cmd+Z로 이전 크기/저장 UI 0, Cmd+Shift+Z로 같은 변경 크기 복원. 이전 이동 Undo 이후 새 Resize 시 기존 Redo가 비활성화됨을 확인했다. 취소 후 Grid/저장 UI/편집 기록 버튼 0. 캡처 layout-history-redo-dark.png |
| 자동 검사 | 관련 8개 suite 45개 테스트 통과. immutable/no-op/50개 한계, 이동 충돌 전체 snapshot, Resize 분리, 입력창 보호·Mac/Windows 단축키, 탭별 draft와 재측정된 saved baseline, 새 분기, 저장 성공·실패·전체 취소 및 기존 데이터/표시 회귀를 포함. 최종 production build(기존 경고 2개)·ESLint·공백 검사 통과 |
| 실제 사용 탭 | Chrome 1296910772의 5개 탭 미저장 0 확인 후 최종 빌드로 갱신했다. 실제 사용 탭 Dark에서 Resize→Undo로 원래 271×108px/좌표와 저장 UI 0 복원, Redo→취소까지 확인했다. 최종 Grid/저장 UI/기록 버튼 0, uPlot 4개이며 배치는 저장하지 않았다. 캡처 layout-history-actual-dark.png |
| 데이터 검증 경계 | 기존 격리 로컬 fixture 기준이다. 격리 DB의 기존 23개 Dashboard JSON 정규화 비교 변경 0. 전체 tsc는 기존 130개 진단이며 Wall/변경 renderer 신규 진단 0이다. 운영/고객 DB·Grafana 버전·쿼리·단위·임계치·Dashboard JSON은 변경하지 않는다. source renderer의 provider 추가는 DOM을 만들지 않으며 05번 Workspace에서만 단축키가 활성화된다 |

변경 파일: workspace/layoutHistory.ts, LayoutHistoryContext.tsx, PanelLayoutGrid.tsx, layoutHistory.test.ts, PanelLayoutHistory.test.tsx, toolbar/WallLayoutHistoryControls.tsx, WallDashboardToolbar.tsx, dashboard-scene/scene/DashboardSceneRenderer.tsx 및 DESIGN_SYSTEM.md/AGENTS.md.

### REF-41 전체 너비 Resize 이탈 및 이동 흡착 안정화 (2026-10-28)

| 항목 | 원인 / 구현 기준 |
| --- | --- |
| 요청·디자인 참조 | 사용자의 전체 폭 텍스트 Resize 스크린샷과 더 넓은 이동 허용 범위 요청을 근거로 기존 직접 조작만 안정화한다. REF-22/37의 즉각적인 카드 이동·이웃 애니메이션·빗금/Dot 표시를 유지한다. 새로운 외부 디자인 실사·아이콘 복제·편집 기능·라이브러리를 추가하지 않았다 |
| 하단 이탈 원인 | RGL 1.4.4의 compact(null)도 충돌을 정리하며 원래 배열 순서를 따른다. 개요에서 데이터 뒤에 있는 표시 텍스트를 넓히면 조작 대상이 다른 패널보다 나중에 배치되어 아래로 밀렸다. 실제 Light에서 성능 추이의 대각선 확장으로 y=180→1036px 재현. CSS나 데이터 로딩 문제가 아니다 |
| Resize 우선순위 | layoutMovement.ts의 panelResizePreview가 gesture 시작 snapshot에서 매번 계산한다. 조작 항목만 native compact에 임시 static으로 전달해 충돌 우선순위를 확보한 뒤 i/x/y/w/h만 반환하므로 잠금 상태를 저장하지 않는다. SE는 원래 left/y, SW는 원래 right/y를 고정하고 이웃이 양보한다. 축소하면 이전 frame에서 밀린 이웃이 원래 자리로 복귀한다. PanelLayoutGrid의 onResize/onResizeStop 모두 같은 미리보기를 적용한다 |
| 폭·높이가 다른 자리 교환 | 같은 줄/같은 높이 또는 같은 열/같은 폭의 교환은 시작/끝 범위와 기존 간격을 유지하고 중간의 정렬된 타일만 크기 차이만큼 이동한다. 단순히 두 left/top을 교환해 1열 겹침이 생기고 잡은 KPI가 아래로 내려가던 문제를 제거했다. 다른 충돌은 기존 native correctBounds/compact가 정리하고 각 항목의 w/h는 바꾸지 않는다 |
| 자석 정렬 | kpiLayout.ts의 공통 panelSnap으로 관리한다. 원래 위치·컨테이너 경계·인접 행/열의 시작/끝/맞닿는 가장자리를 18px 이내에서 정렬하고, 이미 잡은 정렬은 28px를 벗어나야 해제한다. px 기준이므로 2px 행 격자나 데스크톱 폭에 따라 감도가 달라지지 않는다. 멀리 떨어진 타일은 흡착 후보에서 제외하며 native 48열 반올림·경계 제한을 유지한다 |
| 교환 허용·경계 떨림 | 작은 쪽 면적 대비 겹침 진입 기준을 50%→35%, 이전 대상 유지 기준을 35%→20%로 변경했다. 이전 대상과 새 후보의 겹침 차이가 12%p 이내면 기존 대상을 유지한다. 교환 전의 약한 겹침으로 이웃을 계속 아래로 미는 동작은 되살리지 않는다 |
| 상태·저장 | 6px 실제 조작 임계값, 단순 클릭/Hover 조회 상태, 해제 즉시 Grid/미리보기 제거, 실제 변경 때만 저장/취소, 창 이탈 중단, 탭별 50개 Undo/Redo, 로컬 version 1 저장을 유지한다. 원래 패널 데이터·59개 정보·5개 탭·JSON·권한·시간/변수는 변경하지 않는다 |
| 실제 컴포넌트/import와 CSS 경계 | PanelLayoutGrid → ./layoutMovement와 ./kpiLayout의 계산/gesture 연결을 수정했다. 기존 react-grid-layout 1.4.4, react-resizable 3.0.5와 실제 local Button → @base-ui/react/button 1.0.0을 재사용한다. 이번 변경에 새 shadcn/Base UI 컴포넌트나 CSS 수정은 없다. Resize의 사용자 색 Light #a3a3ad / Dark #c9cad1·2px 이중 ㄴ자를 유지한다 |

| 검증 | 실제 결과 / 한계 |
| --- | --- |
| 실제 Light | 정상 1515px 데스크톱에서 성능 추이를 이웃과 겹치도록 늘리고 최종 1247px(48열)까지 확장해도 y=180px 유지. 이웃 사용률만 아래로 이동하고 종료 Grid 0 확인. 폭 260/286px KPI는 110px 이동으로 같은 줄에서 순서를 교환하며 y=60px 유지. Undo로 저장 UI 0 복원. 캡처 layout-stability-resize-light.png, layout-stability-swap-light.png |
| 실제 사용 탭 Dark | Chrome 1296910772의 5개 탭 미저장 0 확인 후 최종 빌드로 갱신했다. 1730px 데스크톱에서 성능 추이 965×60→1447×108px(48열) 확장 중/종료 모두 y=180px 유지. 종료 Grid 0/uPlot 4개, Undo/Redo 각각 원래/확장 크기 복원 확인. 캡처 layout-stability-resize-active-dark.png, layout-stability-resize-actual-dark.png |
| 실제 클릭·이동·SW | 이동 핸들 단순 클릭은 Grid/dirty 0. 실제 사용 탭에서 가로 110px·세로 10px 비껴간 이동도 y=60px 같은 줄에 붙고 자리 교환됨을 확인했다. SW 확장은 vCPU 수 x=271,w=271→x=30,w=512px로 오른쪽 끝 약542px/y=60px 유지. 검증 변경은 저장하지 않고 취소했으며 최종 Grid/dirty/이력 버튼 0, native uPlot 4개다 |
| 자동 검사 | 관련 8개 suite 50개 테스트 통과. 전체 폭 Resize 우선순위·배열 순서 독립성·SW/축소 복원·임시 static 미저장·native Resize release/Undo/Redo·폭이 다른 KPI의 가로 교환/역교환·18/28px 흡착·35/20% 교환 및 기존 저장/취소/권한/59개 보존을 포함한다. 기존 region 캐시 테스트의 300px drop 기대값은 새로운 가장자리 흡착 결과296px로 명시적으로 갱신했다. fixture 데이터 보정은 없다 |
| 빌드·데이터 경계 | production build 성공(기존 경고 2개), 변경 TS/TSX ESLint·공백 검사 통과. 전체 tsc는 기존 130개 진단이며 Wall/변경 renderer 진단 0. 격리 로컬 DB의 23개 Dashboard JSON 정규화 비교 변경 0. 기존 로컬 fixture 기준이며 운영/고객 데이터 검증이 아니다. 운영 DB·백엔드·Grafana 버전·프로토콜/포트는 변경하지 않았다 |

변경 파일: workspace/PanelLayoutGrid.tsx, layoutMovement.ts, kpiLayout.ts, layoutMovement.test.ts, PanelLayoutHistory.test.tsx, panelLayout.test.tsx 및 DESIGN_SYSTEM.md/AGENTS.md. 기존 편집 기능 동결은 유지하며 이번 사용자 요청의 오류·허용 범위 안정화만 적용했다.

### REF-42 조작 중 Dot Grid 배경 레이어 정리 (2026-10-28)

| 항목 | 적용 / 검증 |
| --- | --- |
| 참조·원인 | 사용자의 패널 위 Dot 과밀 피드백이 근거다. kpiLayout.css의 data-interacting=true::before가 z-index:2 전면 레이어여서 카드·그래프 위까지 점을 덮었다. 새 외부 디자인이나 컴포넌트는 참조하지 않았다 |
| CSS 변경 | 점의 radial-gradient를 같은 data-interacting=true 컨테이너의 실제 background로 옮기고 전면 ::before를 제거했다. 기존 불투명 Wall surface가 점을 가려 빈 공간·패널 사이에서만 격자를 보인다. 색·반경·간격·외곽 점선·국소 빗금 미리보기·레이아웃 로직은 유지한다 |
| 실제 import 구분 | 제품 변경은 workspace/kpiLayout.css 한 파일뿐이다. 새 shadcn/ui/Base UI 컴포넌트·import·상태·엔진 변경은 없다. 기존 Grid와 Card/텍스트/차트 렌더러를 그대로 사용한다 |
| 실제 화면 | Light 이동 및 실제 사용 탭 Dark Resize 중 카드 숫자·제목·사용률·그래프 위 Dot이 없고 빈 배경에만 표시됨을 캡처로 확인했다. Dark 조작 중 computed style은 컨테이너 radial-gradient/::before content none, 종료 후 background none/interacting=false다. grid-background-move-light.png, grid-background-resize-dark.png |
| 반영·보존 | 실제 사용 탭의 5개 탭 미저장 0 확인 후 새 빌드로 갱신했다. 검증 변경은 취소했으며 최종 dirty 0/native uPlot 4개다. production build 성공(기존 경고 2개), Prettier·공백 검사 통과. CSS 표시 수정이므로 동작 전체 테스트는 반복하지 않았다. 로컬 fixture UI 검증이며 원본 JSON·데이터·저장 배치는 수정하지 않았다 |

### REF-43 카드 표면·간격·기준선 통일 (2026-10-28)

| 항목 | 실제 기준 / 구현 |
| --- | --- |
| 디자인 참조·범위 | 사용자의 Radius 약8px, 명확한 Border, 강한 그림자/장식 gradient 배제, 16px 중심 Padding, 간격 토큰/기준선/Light·Dark 일관성 지침을 적용했다. 새 외부 레퍼런스나 컴포넌트 도입은 없다. 05번 5개 탭에만 적용하고 기존 자유 배치·텍스트/데이터 59개·시계열 디자인·단위·임계치·쿼리·URL 계약은 유지한다 |
| 단일 표면 토큰 | surfaceTokens.ts: radius=8, padding=16, compactPadding=8, contentGap=8, cardGap=12, sectionGap=24, headerHeight=44, shadow=none. Light border #cbd5e1, Dark border #45566f로 이전 #e4eaf2/#304057보다 대비를 높였다. 기존 단색 surface와 텍스트/상태 색 의미를 유지한다 |
| 실제 적용 / import | WallChrome → ./surfaceTokens의 wallSurfaceVariables를 statPilot=true일 때만 DOM에 공급한다. statPresentation.ts, visualization.ts의 대표 화면용 분기, chartTokens.ts 및 workspace/overviewPresentation.tsx는 같은 TS 토큰을 사용한다. 기존 로컬 shadcn Card/Title/Content와 Base UI Tabs/Button/Menu를 계속 사용하며 새 primitive를 사용한 것으로 표현하지 않는다. 다른 UID의 wallVisualization 기본값과 기본 native Padding은 유지한다 |
| 실제 렌더링 여백 | PanelChromePresentation의 선택적 contentPadding.horizontal/vertical을 추가했다. native PanelChrome의 DOM inset과 children에 전달하는 innerWidth/innerHeight 계산에 함께 적용하므로 CSS만으로 Canvas를 잘라내지 않는다. 본문은 가로/세로16px, 낮은 KPI/사용률/서비스/집계는 가로16·세로8px이다. 제목은 가로16px이며 고정된 작은 카드 높이는 유지한다. 파일시스템/디바이스 자연 높이에도 변경된 header+padding을 반영한다 |
| CSS 정리 | modern.css·overview.css·textPanel.css가 12/14px 카드 반경과 제각각의 header/body 좌우 inset을 공통 토큰으로 바꾼다. visualizations.css/filesystem.css/deviceCapacity.css의 중복 6/8/14/24px 외곽 Padding을 없애 native content inset 한 곳에서 담당한다. 카드 그림자와 스토리지 장식 inset 선을 제거한다. Grid 사이 간격도 공통 cardGap을 사용하지만 저장된 좌표를 새 배치로 덮어쓰지 않는다 |
| 숫자·단위 기준선 | 원래 단위 span이 KPI의 42px line-height를 상속해 단위가 있는 값의 줄 상자가 50px이었고, 단위 없는 vCPU만42px이었다. 단위에 기존 typography.ts unit.line=18을 적용했다. 실제 브라우저에서 KPI4개 모두 수치 top=43px/높이42px/왼쪽17px(테두리1+Padding16)로 같고, 제목도왼쪽17px이다. 숫자·단위·tabular-nums·색 의미는 그대로다 |

| 검증 | 결과 / 경계 |
| --- | --- |
| 실제 Light/Dark | 별도 검증 탭에서 5개 탭 모두 패널 수21/19/7/6/6, 모든 카드 computed radius8px/shadow none 확인. Light border rgb(203,213,225), Dark rgb(69,86,111)이다. 카드 구조·정보 순서·기준선은 양쪽 동일하다. 캡처 card-system-overview-light.png, card-system-overview-dark.png, card-system-storage-light.png |
| 실제 조회 | 파일시스템 기존 fixture의 2개 행·필드/단위 유지, content clientHeight=scrollHeight=112px로 여백 변경 후 잘림 없음 확인. native Time series Hover 툴팁도radius8px/동일Border/그림자없음. drag Zoom으로 from/to만 절대 시간으로 바뀌고 배치 dirty/Grid0 확인 후 원래 시간·Light 테마로 복원했다 |
| 실제 사용 탭 반영 경계 | Chrome1296910772의 개요에 미저장 배치1건, 나머지 탭0건 확인했다. 배치를 보존하기 위해 새로고침하지 않았으며 해당 실제 탭은 기존 radius14px/옛 Border 상태다. 새 스타일은 별도 검증 탭과 최종 build에 반영됐다. 사용자에게 저장 또는 취소 뒤 새로고침이 필요함을 알렸다. 별도 검증 화면을 실제 사용 탭에 반영한 것으로 보고하지 않는다 |
| 자동 검사 | 관련6개 suite에서62개 통과. 새 native contentPadding의 DOM 여백과 renderer266×50px 계산, 기존 Stat/단위/타이포그래피/59개 데이터/Workspace를 포함한다. 기존 native show-on-hover menu icon 가시성 테스트1건은 수정 전 Padding 구현으로 되돌려도 같은 실패를 확인했다. 그1건은 최종 선별 실행에서 제외했고 테스트 본문은 변경하지 않았다 |
| 빌드·데이터 | production build 성공(기존 경고2개), 변경TS/TSX ESLint·공백 검사 통과. 전체 tsc는 기존130개 진단, Wall/PanelChrome 신규진단0. 격리 로컬 DB23개 Dashboard JSON 정규화 비교 변경0. fixture UI 검증이며 운영/고객 데이터 검증으로 표현하지 않는다. 운영DB·백엔드·배포/포트·Grafana버전은 수정하지 않았다 |

주요 변경 파일: surfaceTokens.ts, WallChrome.tsx, statPresentation.ts, visualization.ts, chartTokens.ts, modern.css; workspace/compactResourceTokens.ts, overviewPresentation.tsx, overview.css, textPanel.css, kpiLayout.ts, PanelLayoutGrid.tsx, FreeOverviewLayout.tsx, OverviewFlowLayout.tsx; visualizations/visualizations.css, filesystem.css, deviceCapacity.css, WallFilesystemInfo.tsx, WallDeviceCapacityView.tsx; packages/grafana-ui/src/components/PanelChrome/PanelChromePresentation.ts, PanelChrome.tsx, PanelChrome.test.tsx 및 본 기준표/AGENTS.md.

### REF-44 기본 Light 테마 (2026-10-28)

| 항목 | 적용 / 검증 |
| --- | --- |
| 요청·범위 | 사용자가 기본 테마를 Dark가 아니게 요청해 제품 기본값을 Light로 변경했다. 이는 명시적으로 요청된 기본 설정 변경이며 다른 UID에 Workspace 스타일을 확장한 것이 아니다 |
| 수정 파일 | conf/defaults.ini의 [users] default_theme=light, conf/sample.ini의 같은 설정 예시도light로 통일했다. CSS·컴포넌트·테마 전환 함수·DB는 수정하지 않았다 |
| 선택 우선순위 | 기존 pkg/services/preference/prefimpl/pref.go와 pkg/api/index.go의 사용자/조직 테마 및 유효한 theme URL 우선순위를 유지한다. 이미 선택한 테마를 강제로 Light로 덮어쓰지 않는다. Wall Toolbar의 toggleTheme(true)는 기존 runtime-only 전환 그대로다 |
| 실제 검증 | 격리3317 서버를 기존 config/포트로 재시작했다. theme URL 파라미터 없는 접속에서 Light, 수동 전환 Dark, 다시 새로고침 시 기본 Light 확인. 기본값 변경만으로 충분해 프론트엔드 재빌드·전체 테스트는 반복하지 않았다 |
| 실제 사용 탭 / REF-43 후속 | Chrome1296910772의 5개 탭 모두 미저장0을 다시 확인했다. 안전하게 갱신한 실제 사용 탭에서 theme=light, 카드radius8px 확인. 이전 REF-43의 미저장으로 인한 스타일 미반영은 해소됐다. 캡처 default-theme-actual-light.png. 기존 데이터/배치는 변경하지 않았다 |

실제 변경은 설정2개 및 본 기준표/AGENTS.md뿐이며 새 UI 라이브러리·import·디자인 참조는 없다.

### REF-45 다중 선택·키보드 전체 선택·함께 이동 (2026-10-28)

| 항목 | 실제 기준 / 구현 |
| --- | --- |
| 요청·참조 | 사용자의 다중 선택 스크린샷과 키보드 전체 선택 요청으로 이 범위의 편집 기능을 명시적으로 재개했다. 참조의 복제/삭제 아이콘·떠 있는 중앙 툴바를 복제하지 않고 Wall의 기존 선택색/8px/표면 토큰과 우측 하단 컨텍스트 도구로 구성했다. 다른 UID나 편집 기능 전반의 확장을 허용한 것으로 해석하지 않는다 |
| 선택 방식 | PanelSelection.tsx: 일반 제목/텍스트 헤더 클릭은 단일 선택, Ctrl/Cmd 또는 Shift+클릭은 항목 추가/해제다. 빈 Grid 배경·해제 버튼·Esc는 선택을 비운다. 현재 탭의 데이터 패널과 표시 텍스트를 선택하며 개요는21+4=25개, 네트워크는19개다. 탭 전환/새로고침 시 선택을 초기화하고 다른 탭까지 동시에 선택하지 않는다 |
| 키보드·권한 | PanelLayoutGrid에 포커스 가능한 관리자 작업 영역을 두고 그 안에서만 Ctrl/Cmd+A를 처리한다. 입력/textarea/select/contenteditable/textbox/dialog/menu와 IME/Alt 조합은 보호한다. Grafana의 기존 document Escape가 먼저 소비하던 문제를 실제 브라우저에서 확인해, 이 작업 영역에만 캡처 우선순위를 적용했다. 외부 입력/브라우저 단축키는 가로채지 않고 Viewer/좁은 fallback에는 선택 UI·핸들·키 핸들러를 활성화하지 않는다 |
| 상태·화면 | data-marked는 현재 선택, 기존 data-selected는 실제 조작 항목이다. 선택만으로 Dot Grid·배치 저장/취소·Undo 기록을 만들지 않는다. 선택 중 전체 작업 영역의 기본 파란 focus outline은 제거하고 개별 선택 테두리/개수를 안내한다. 하단 도구가 기존 배치 저장/취소를 가리지 않도록 스크롤 끝에72px의 여유 공간을 확보했다. 카드 위치는 밀지 않는다 |
| 실제 UI / import | PanelSelectionControls → ../ui의 로컬 shadcn-style Button → @base-ui/react/button 1.0.0을 재사용한다. X는 기존 lucide-react 0.468.0이다. 선택 개수·함께 이동 안내·현재 탭 전체 선택·해제만 실제 기능으로 표시한다. 새 컴포넌트 엔진·드래그 라이브러리·가짜 복제/삭제 버튼을 추가하지 않았다 |
| 함께 이동 | 선택한 패널 중 하나의 기존 이동 핸들을 잡는다. selectionBounds/snapPanelPosition/panelGroupMovePreview가 선택 항목의 상대 x/y/w/h를 유지하며 전체 묶음의48열 경계를 제한한다. 선택 항목의 실제 footprint에만 native RGL compact 우선순위를 주므로 외곽 경계 안의 빈 공간에 있는 비선택 패널을 강제로 그룹에 넣지 않는다. 단일 패널의 기존 교환 정책은 유지하고 다중 이동과 충돌 이웃 좌표 전체를 기존 Undo/Redo의 한 작업으로 기록한다 |
| 배치 안내·Resize 경계 | 원래6px 임계값과 배경 Dot/종료 즉시 제거를 유지한다. 다중 외곽 배치 안내는 투명한 점선 경계로 표시해 사이에 있는 비선택 차트를 빗금으로 덮지 않는다. 다중 선택 중 Resize 핸들은 렌더링에서 제거하며 크기 변경은 단일 패널로 수행한다. 선택을 저장되는 그룹 모델이나 일괄 Resize 기능으로 표현하지 않는다 |
| 저장 계약 | 선택 ID·임시 static·@wall-selection 경계 ID는 Dashboard JSON이나 localStorage 배치에 저장하지 않는다. 기존 실제 좌표만 저장/취소하고 저장 성공·취소 시 선택도 해제한다. 원래59개 데이터/쿼리/단위/임계치/UID/시간 URL과 배치 key/version1을 유지한다 |

| 검증 | 실제 결과 / 한계 |
| --- | --- |
| 실제 Light | Cmd+클릭2개 선택, Cmd+A25개, Esc0개, 선택만으로 dirty/Grid0 확인. 개요의28/30을 함께 y=60→240px로 이동하면서 x=0/260px·w/h를 보존했다. Cmd+Z 한 번에 둘 다y=60px/dirty0, Redo로 함께 재생됨을 확인했다 |
| 실제 취소·도구 겹침 | 초기 하단 도구가 취소 버튼을 가리는 문제를 실제 native 클릭으로 발견하고 하단 여유 공간으로 수정했다. 최종 빌드에서2개 선택·함께 이동 후 선택을 먼저 지우지 않고도 취소 버튼이 동작하며 dirty/selection/history0으로 돌아온다. 검증 배치는 저장하지 않았다 |
| 실제 Dark / 탭·입력·분석 | 성능 추이 텍스트+두 시계열을3개 선택한 상태에서 Grid/dirty0, uPlot4 확인. 검색 입력에서 Cmd+A는3개 선택을 유지하며25개로 확장하지 않는다. 탭 전환은선택0, 네트워크 영역 Cmd+A는19개로 한정된다. 패널 선택1개를 유지한 일반 차트 drag Zoom은 시간 URL만 바꾸고 Grid/dirty0이었다. 원래 시간/기본Light로 복원했다 |
| 캡처·검증 화면 | panel-multiselect-light.png, panel-multiselect-dark.png, panel-select-all-light.png. 별도 검증 탭 Chrome1296910792를 Light/3개 선택/dirty0의 검토 가능한 상태로 남겼다. 선택 상태는 페이지 세션 UI일 뿐 저장된 배치 변경이 아니다 |
| 실제 사용 탭 반영 경계 | Chrome1296910772에는 개요 미저장 배치1건/실제 gesture0이 있어 강제로 갱신하지 않았다. 새 기능은 최종 source/build 및 별도 검증 탭에 반영됐으며 기존 사용 탭에 반영됐다고 보고하지 않는다. 기존 미저장 배치를 저장 또는 취소한 뒤 새로고침해야 한다 |
| 자동 검사 | 관련9개 suite57개 테스트 통과. 선택 토글·저장/dirty 분리·입력/차트 보호·Mac/Windows 전체 선택·Esc/외부 shortcut 우선순위·Viewer 제외·native 다중 이동과 Undo/Redo·gesture Esc 중단·그룹 경계 제한/빈 공간/임시 잠금 미저장 및 기존 배치 저장/복원/59개 정보 보존을 포함한다 |
| 빌드·데이터 | production build 성공(기존 경고2개), 변경TS/TSX ESLint·공백 검사 통과. 전체 tsc는 기존130개 진단이며 Wall 신규진단0. 격리 DB23개 Dashboard JSON 정규화 비교 변경0. 기존 로컬 fixture UI 검증이며 운영/고객 데이터·백엔드·버전·배포/포트는 수정하지 않았다 |

변경 파일: workspace/PanelSelection.tsx, PanelSelection.test.tsx, PanelLayoutGrid.tsx, layoutMovement.ts, layoutMovement.test.ts, LayoutFootprint.tsx, kpiLayout.css 및 DESIGN_SYSTEM.md/AGENTS.md.

### REF-46 조작 윤곽선 중복 제거 (2026-10-28)

| 항목 | 적용 / 근거 |
| --- | --- |
| 사용자 참조 | Dynatrace와 Wall의 조작 중 이미지 비교에서 Wall이3개의 선처럼 보인다는 피드백을 적용했다. 참조는 경계의 명확성·시각적 단순함의 기준이며 제품의 툴바·핸들 외형을 복제하지 않는다 |
| 정확한 중복 원인 | kpiLayout.css의 선택 marker outline-offset1px, Wall2px 점선 footprint, native RGL placeholder의 파란 fill/glow가 겹쳤다. Grafana GlobalStyles/dashboardGrid.ts는 placeholder background/boxShadow를 !important로 지정하므로 기존 background:transparent만으로는 없어지지 않았다 |
| 조작 중 단일 강조 | data-interacting=true에서는 선택 pseudo contour를 제거하고 잡은/함께 움직이는 카드의 border-color를 transparent로 둔다. 놓일 위치 footprint만1px solid Wall primary로 남긴다. native placeholder DOM과 계산은 유지하되 visibility:hidden 및 명시적인 local background/box-shadow !important로 시각 효과를 제거한다. 전체 Grid의 외곽 점선도 없애고 배경 Dot만 유지한다 |
| 정지·라벨 | 평상시 선택 outline은 offset=-1px로 카드 경계 안에 겹쳐 그려 평행한 두 선을 만들지 않는다. 위치/크기 라벨은 primary 대신 기존 중립 Border를 사용한다. 단일 패널 빗금, 투명한 다중 외곽 안내, 사용자 이중ㄴ Resize 색/굵기, 선택·키·이동·Resize·Undo·저장 계산은 변경하지 않는다 |
| 실제 변경 / import 경계 | 제품 수정은 workspace/kpiLayout.css 한 파일이다. 새 shadcn/Base UI 컴포넌트나 import, 렌더러·엔진 변경은 없다. 기존 컴포넌트/토큰·RGL1.4.4의 표시 override만 사용하며 native GlobalStyles 자체는 수정하지 않았다 |
| 실제 Light 검증 | 얇은 성능 추이 텍스트 패널의 실제 Resize 중 guide=1px solid rgb(22,119,255)/shadow none, marker::before content none, 움직이는 카드 border transparent, placeholder hidden/background transparent/shadow none, Grid outline none을 동시 측정했다. 캡처 single-contour-resize-light.png. 종료 후 Grid0, 취소로 원래 배치 복원 |
| 실제 Dark 검증 | 가동 시간 이동 중 guide=1px solid rgb(105,167,255), marker none, placeholder hidden/shadow none 확인. 캡처 single-contour-move-dark.png. 종료/취소 후 dirty/Grid0과 Light 복원 확인 |
| 빌드·반영 경계 | production build 성공(기존 경고2개), CSS Prettier·공백 검사 통과. 표시 CSS 수정이므로 배치 전체 테스트는 반복하지 않았다. 기존 로컬 fixture UI 검증이며 데이터/JSON은 수정하지 않았다. 실제 사용 탭은 진입 시 미저장1건이 있어 갱신하지 않고 보존했다. 검증 탭과 최종 source/build의 반영을 실제 사용 탭 반영으로 혼동하지 않는다 |

### REF-47 Soft Depth 표면·대비 미세 조정 (2026-10-28)

| 참조 / 컴포넌트 | 관찰·결정 / 실제 적용 |
| --- | --- |
| [TailAdmin Analytics](https://demo.tailadmin.com/analytics) | 공개 실화면과 computed style을 확인했다. 밝은 카드/옅은 페이지 배경·절제된 텍스트 위계를 참고한다. 실제 KPI reference는 radius16px/shadow none이었으며 이 외형을 복제하지 않는다. Wall은 사용자가 요청한8~10px 범위의 기존8px을 유지하고 아주 약한 단일 shadow만 추가했다 |
| Dynatrace Dashboards | 기존 사용자 제공 이미지의 정돈된 대비와 REF-22의 절제 원칙을 유지한다. [신규 Dashboards 공식 문서](https://docs.dynatrace.com/docs/analyze-explore-automate/dashboards-and-notebooks/dashboards-new/components/dashboard-component-data)를 검색·확인했다. 이번에 새 테넌트의 최신 UI를 실시간 실사했다고 주장하지 않으며 툴바/선택/배치 조작은 변경하지 않는다 |
| 실제 UI / import | 기존 로컬 shadcn Card/Header/Title/Content와 Base UI Tabs/Button/Menu를 재사용한다. 새 컴포넌트·primitive·import나 라이브러리는 없다. source surfaceTokens.ts와 기존 CSS5개만 수정했다. WallChrome의 기존 wallSurfaceVariables 경로가05번에만 새 토큰을 공급한다 |

| 의미 토큰 | Light | Dark |
| --- | --- | --- |
| page canvas | #f2f5f9 | #121a27 |
| panel surface / radius | 기존 #ffffff / 8px | 기존 #1c2635 / 8px |
| card Border | #c3cfdd | #4c5e78 |
| card Shadow (단일) | 0 1px 3px rgb(16 24 40 / 5%) | 0 1px 3px rgb(0 0 0 / 18%) |
| Hover Border / Shadow | #adbbce / 0 2px 4px rgb(16 24 40 / 7%) | #60748f / 0 2px 4px rgb(0 0 0 / 22%) |
| 선택 Border / Shadow | 기존 Wall primary / 0 2px 5px rgb(16 24 40 / 9%) | 기존 Wall primary / 0 2px 5px rgb(0 0 0 / 26%) |
| 패널 제목·숫자 / 보조 텍스트 | #142239 / #5d6e86 | #f1f5fa / #b5c2d5 |

| 구현 범위 | 보존 / 검증 |
| --- | --- |
| 토큰 분리 | surfaceTokens.ts의 기존 visualization surface/border/shadow 키는 그대로 두고 cardBorder/cardShadow/Hover/선택/panelText/panelMuted를 추가했다. --wall-bg만 페이지 명도에 적용한다. 패널 전용 텍스트 alias는 비시계열 Card/텍스트/섹션 제목에 한정하며 시계열 헤더 제목에는 명시적인 panelText만 적용한다. 축·범례·툴팁이 쓰는 legacy Wall text/muted/border/shadow는 변경하지 않았다 |
| CSS 적용 | modern.css의 Card 경계, overview.css의 기존 role별 경계 및 상속형 Hover/선택 토큰, freeOverview.css의 독립 사용률/서비스, visualizations.css의 KPI/상태 집계가 같은 card 토큰을 사용한다. hover/marked의 변수만 바꾸므로 상태별 새 CSS 체계를 흩어놓지 않는다. 0-offset glow·복수 shadow·새 transition은 추가하지 않았다 |
| 텍스트 섹션 | textPanel.css에서 background transparent/box-shadow none/border transparent로 변경했다. 기존1px border geometry는 유지해 텍스트 기준선·크기·배치를 바꾸지 않으며 텍스트 편집/이동/선택 기능도 유지한다. 4개 표시 텍스트의 실제 computed background는 transparent, shadow none이다 |
| 실제 Light 비교 | before 배경 rgb(247,249,252)→rgb(242,245,249), 카드 white 유지. 기본 카드 Border rgb(195,207,221)/shadow5%, Hover Border rgb(173,187,206)/shadow7%, 선택 Border rgb(22,119,255)/shadow9%를 확인했다. 선택만으로 dirty0 유지. 캡처 soft-depth-before-light.png, soft-depth-light.png |
| 실제 Dark 비교 | 배경 rgb(18,26,39), 카드 rgb(28,38,53), Border rgb(76,94,120), 단일shadow18% 확인. 제목/수치 rgb(241,245,250), 단위/설명 rgb(181,194,213)이다. Hover Border rgb(96,116,143)/shadow22%, 선택 기존 primary/shadow26%이며 섹션은 투명/무그림자다. 캡처 soft-depth-dark.png. 확인 후 Light/선택0/dirty0으로 복원했다 |
| 실제 사용 탭 반영 | Chrome1296910772의 현재 조작0·5개 탭 미저장0을 확인한 뒤 갱신했다. 실제 사용 화면에서 Light/새 page배경/카드 단일shadow5%/텍스트 섹션 transparent를 확인했다. REF-45/46의 미저장으로 인한 미반영 주의는 해소됐다. 캡처 soft-depth-actual.png |
| 간단 검사 / 경계 | production build 성공(기존 경고2개), surfaceTokens ESLint·변경 파일 Prettier·공백 검사 통과. 기존 Time series/Stat 관련31개 테스트 통과. 추가 테스트·전체 배치 테스트는 작성/반복하지 않았다. 기존 로컬 fixture UI 기준이며 운영 데이터 검증으로 표현하지 않는다. Dashboard JSON·59개 데이터·쿼리·단위·임계치·그래프 스타일·배치 편집·저장 로직은 수정하지 않는다 |

변경 파일: surfaceTokens.ts, modern.css, workspace/overview.css, freeOverview.css, textPanel.css, visualizations/visualizations.css 및 본 기준표/AGENTS.md. 강한 그림자·gradient·광택·glass·레이아웃 재구성·신규 애니메이션은 추가하지 않았다.

### REF-48 선택 테두리 가독성 강화 (2026-10-28)

| 항목 | 적용 / 검증 |
| --- | --- |
| 사용자 참조 | 선택한 가동 시간/vCPU 두 카드의 선이 너무 가늘다는 사용자 이미지 피드백을 적용했다. 새 외부 참조·컴포넌트·import는 없다 |
| 실제 변경 | surfaceTokens.ts에 selectionStroke=2와 --wall-selection-stroke를 추가하고 kpiLayout.css의 선택 pseudo outline/offset을 이 공통 토큰과 음수 inset으로 연결했다. 2px을 안쪽으로 그리므로 카드 크기·간격·모서리·기존 Border/Shadow는 바뀌지 않는다. 이동/Resize 안내선은1px 그대로이며 중복선·native placeholder glow는 복원하지 않는다 |
| 실제 검증 | Light rgb(22,119,255)/Dark rgb(105,167,255)의2px solid, offset=-2px 확인. 두 KPI의 engine 크기260×108/286×108px도 유지된다. production build(기존 경고2개), surfaceTokens ESLint·Prettier·공백 검사 통과. 표시 토큰 변경이므로 전체 테스트는 반복하지 않았다 |
| 실제 사용 탭 | 현재 선택 ID28/30을 읽어 보존하고5개 탭 미저장0·gesture0 확인 후 갱신했다. 두 항목을 다시 선택해 실제 사용 탭의2px/offset-2px을 확인했다. 캡처 selection-stroke-actual.png. 데이터·배치 변경/저장은 수행하지 않았다 |


### REF-49 Hover 빠른 작업과 선택 툴바 분리 (2026-10-28)

| 항목 | 실제 적용 / 검증 |
| --- | --- |
| 디자인 참조 | 사용자가 제공한 Dynatrace KPI/시계열 Hover 이미지 두 장에서 선택 전 노출을 줄이는 원칙을 참고했다. 외부 사이트를 새로 실사했다고 표현하지 않는다. 기존 Wall 오른쪽 액션 위치·버튼 외형·이중 ㄴ자 핸들·색을 유지하며 시계 아이콘이나 가짜 작업을 추가하지 않는다 |
| 컴포넌트 구조 | PanelActionDock의 expanded context와 data-wall-panel-dock=compact/selected로 구분한다. WallPanelActions는 compact에서 보기/공유 직접 버튼을 DOM에 생성하지 않고 더보기 메뉴에 native 작업 전체를 넣는다. selected는 기존 보기/공유 직접 버튼과 나머지 메뉴를 사용한다. CSS로 전체 툴바를 숨기는 방식과 구분된다 |
| 실제 import / 버전 | 기존 로컬 shadcn 기반 Button은 ../ui → ui.tsx → @base-ui/react/button, DropdownMenu는 ../components/ui/dropdown-menu → @base-ui/react/menu를 사용한다. Base UI 1.0.0, lucide-react 0.468.0의 MoreHorizontal/ChevronDown을 실제 사용한다. 신규 의존성·primitive는 없다 |
| 선택 / 조작 | PanelLayoutGrid는 마지막 선택 ID 하나에만 expanded를 전달한다. 선택하지 않은 패널 Hover/focus는 작은 이동 핸들과 더보기이며 선택된 툴바는 pointer가 떠나도 유지한다. 다중 선택의 다른 항목은 compact이고 기존 전체 선택/그룹 이동은 유지한다. 조작 시작 전의 dock 대상을 별도 presentation state에 보관해 새로 잡은 이동 핸들이 드래그 중 확장/재배치되지 않으며 release/abort 후 해제한다 |
| CSS만 변경한 부분 | panelActions.css는 compact의 툴바 배경/테두리/그림자를 제거하고 더보기 버튼만 기존 surface/border로 표현한다. selected는 기존 툴바를 유지하고 이웃 패널 아래 가려지지 않게 z-index를 보장한다. 기존 카드·그래프·48열 위치 계산·저장 모델은 수정하지 않는다 |
| 권한 / 기능 보존 | 원래 VizPanelMenu의 권한 필터·href·callback·검사 하위 메뉴를 재사용한다. 선택할 수 없는 Viewer/fallback도 compact 더보기에서 원래 보기/공유에 접근할 수 있다. native modified link 동작과 메뉴 활성화/해제 수명주기를 유지한다 |
| 실제 브라우저 | 1515px 데스크톱에서 첫 표시 후 KPI 본문 클릭/Hover 시 선택0·전체 툴바0·dirty0, compact 이동/더보기만 표시됨을 확인했다. 더보기의 보기/편집/공유/탐색/검사 유지, header 선택 후 pointer 이탈에도 전체 툴바1 유지, 두 패널 다중 선택 시 마지막 하나만 전체 툴바, Esc 해제를 확인했다. compact 핸들 실제 이동 후 dirty1·gesture0·선택 툴바1, 취소 후 원래 좌표·dirty0·선택0 복원도 확인했다 |
| Light / Dark | 실제 Light/Dark Hover와 선택 화면을 확인했다. Dark 툴바 background rgb(28,38,53), text rgb(237,242,250), opacity1이다. 캡처 dock-hover-light.png, dock-selected-light.png, dock-hover-dark.png, dock-selected-dark.png. QA는 Light/선택0/dirty0으로 복원했다 |
| 실제 사용 화면 | 현재 사용자 화면의 28/30/34/36 선택을 읽어 보존했다. 5개 탭 미저장0·gesture0 확인 후 새 빌드로 갱신하고 네 선택을 복원했다. 전체 툴바는 마지막 SWAP 합계 하나, dirty0이다. 캡처 dock-selected-actual.png |
| 검증 / 경계 | production build 성공(기존 경고2개), 변경 TS/TSX ESLint·Prettier·공백 검사 통과. 관련5 suites/36 tests 통과(축소 메뉴에서 native 보기/공유 유지 및 다중 선택 툴바1개 검증 포함). 로컬 DB의23개 Dashboard JSON은 기존 baseline과 동일하다. 실제 로컬 fixture UI 검증이며 운영 데이터/고객 환경은 변경하지 않는다 |

변경 파일: workspace/PanelActionDock.tsx, PanelLayoutGrid.tsx, WallPanelActions.tsx, panelActions.css, WallPanelActions.test.tsx, PanelSelection.test.tsx 및 본 문서/AGENTS.md. 다른 UID·패널 표시·쿼리·시간·배치 계산/저장 기능은 범위 밖이다.


### REF-50 A-Hybrid 헤더 조작 / Resize 모서리 간격 (2026-10-28)

| 항목 | 실제 구현 / 검증 |
| --- | --- |
| 참조 / 범위 | 사용자의 A-Hybrid 명세와 모서리 침범 이미지(804c0fc2)를 직접 적용했다. Dynatrace의 직접 조작 편의만 참고하며 플로팅 외형은 제거한다. 05번 UID의5개 탭에 한정하며 외부 제품의 신규 실사나 라이브러리 도입은 없다 |
| React 구조 | PanelActionDock.tsx를 PanelActionsProvider/WallPanelHeader의 공통 슬롯으로 교체했다. Grid는 move/actions를 context로 공급하고 실제 native PanelChrome의 renderHeader가 같은 슬롯을 소비한다. 카드 외부 형제 dock DOM은 제거했다. DashboardWorkspace의 fallback도 actions provider를 사용한다. 기존 크기0 헤더인 사용률/서비스는 본문 제목·값 행에 같은 Header를 연결해 헤더 행을 추가하지 않는다 |
| 실제 shadcn/Base UI | CardHeader/CardTitle는 ../components/ui/card의 기존 로컬 shadcn 소스, Button은 ../ui → @base-ui/react/button, DropdownMenu는 ../components/ui/dropdown-menu → @base-ui/react/menu 1.0.0이다. Text 더보기도 같은 DropdownMenu에서 기존 텍스트 편집을 연다. 편집 Popover는 기존 @base-ui/react/popover이며 공통 PopoverContent에 명시적 anchor 전달만 추가했다. GripVertical 14px/MoreHorizontal 16px은 기존 lucide-react 0.468.0이다 |
| 슬롯 / 가독성 | --wall-panel-control-size=28px, gap=4px 공통 토큰을 사용한다. 슬롯 공간은 항상 유지하고 Hover/focus 때 opacity·pointer-events만 바뀐다. native 헤더 높이·데이터 영역 높이·카드 크기는 그대로다. 제목은 min-width0/flex/ellipsis이며 임계치·값·단위는 기존 렌더러를 사용한다. Text 제목/설명은 기존 투명 표면/무그림자이며 좁은 폭에서 말줄임 처리한다 |
| 메뉴 | 보기/공유/편집/탐색/검사/기타 native 작업과 하위 메뉴·href·callback·권한 필터를 모두 우측 추가 작업에 유지한다. 선택해도 별도 보기/공유 툴바는 만들지 않는다. 현재 구현되지 않은 독립 복제/삭제 기능을 추가하지 않는다. 메뉴가 열린 동안 trigger 슬롯은 계속 표시한다 |
| Resize / 조작 | 우측 하단만 기존 native Resize를 노출한다. 선12/7px 이중 ㄴ자·2px·Light #a3a3ad/Dark #c9cad1을 유지하고 --wall-resize-inset=6px로 경계와 분리했다.24px 조작 영역은 카드 경계 안에 맞춘다.48열·충돌·저장/복원·다중 선택/Undo/Redo 계산은 유지한다. 이동은 좌측 Grip에서만 시작한다. 손잡이 클릭/마우스 누름의 held 안내를 없애고 실제6px 이동/Resize 중에만 안내를 표시한다 |
| CSS만 변경한 부분 | panelActions.css는 내부 flex 슬롯·고정 hit area·표시 상태·focus ring을 담당한다. modern.css의 공통 조작 토큰, overview.css의 헤더 좌우8px, textPanel.css의 말줄임, visualizations.css의 낮은 행 정렬, kpiLayout.css의 Resize 선 inset이 외형 수정이다. 떠 있는 툴바를 CSS로 숨겨 남겨두는 방식이 아니다 |
| KPI / 좁은 폭 |1515px 데스크톱 첫 표시에서 개요25개 타일의 Header/Grip/메뉴가 각각25개, 플로팅 DOM0이다. KPI 제목 rect는 idle/hover 모두 x297/y394/162×18px로 동일하다. 검증용144px 카드에서 Grip right293 ≤ title left297/right355 ≤ menu left363으로 겹치지 않고 ellipsis다. Resize/취소로 원래248px 카드 폭을 복원했다 |
| 실제 조작 | Grip 단순 클릭은 dirty0/guide0/Grid0. Grip 이동으로 가동 시간 x0→286, Resize로260×108→312×124px, 다중 이동으로28/30의 상대x0/260을 유지한 y60→180px를 확인했다. 각 종료 active0/guide0, 취소로 원래 배치·dirty0 복원. 다중 선택2에서는 Resize DOM0을 유지한다 |
| 차트 / Text | 네트워크612px 차트의 Grip은 card left256 대비 x265에 있어 좌측 접근이 유지된다. 실제 Tooltip 표시, Zoom으로 시간 URL 변경, 범례 선택 후 dirty0/marked0 확인. Zoom 시간은 now-1h로 복원했다. 실제 사용 탭의 성능 추이! 더보기 → 텍스트 편집에서 기존 제목/설명 로딩 확인 후 취소했다. 저장 텍스트는 수정하지 않았다 |
| Light / Dark / 반영 | Light/Dark에서 같은 헤더 정보 위계와 Resize inset6px 확인. 캡처 hybrid-light.png, hybrid-dark.png, hybrid-narrow.png, hybrid-header-detail.png. 실제 사용 탭5개 미저장0·gesture0 확인 후 새 빌드를 갱신하고 사용자 선택 -1001 및 제목 성능 추이!를 보존했다. 실제 탭 floating0/header25/dirty0, Text bg transparent/shadow none이다. 캡처 hybrid-actual.png |
| 검증 / 경계 | production build 성공(기존 경고2개), 변경 TS/TSX ESLint·Prettier·공백 검사 통과. 직접 관련5 suites36tests와 헤더 슬롯으로 갱신한 기존 배치 fixture3 suites12tests 통과. 전체 tsc는 기존 외부/legacy 진단130개로 실패하며 wall-modern 진단은0이다. 전체 제품 회귀·운영 데이터 검증은 수행하지 않았다. 로컬DB23개 Dashboard JSON은 기존baseline과 동일하다 |

변경 파일: workspace/PanelActionDock.tsx, PanelLayoutGrid.tsx, WallPanelActions.tsx, overviewPresentation.tsx, DashboardWorkspace.tsx, WallTextPanel.tsx, panelActions.css, overview.css, textPanel.css, kpiLayout.css; visualizations/WallPanelContent.tsx, visualizations.css; modern.css, components/ui/popover.tsx. 기존 테스트 fixture8개와 본 기준표/AGENTS.md도 갱신했다. 데이터·쿼리·단위·임계치·원본59개 패널·차트 선/축/범례 스타일·배치 좌표/크기는 변경하지 않았다.


### REF-51 조작 피드백과 배치 모션 정리 (2026-10-28)

| 항목 | 실제 적용 / 검증 |
| --- | --- |
| 참조 / 범위 | 사용자의 기존 애니메이션 고도화 요청과 Wall A-Hybrid/REF-37을 기준으로 한다. 새 외부 디자인 실사·애니메이션 라이브러리·편집 기능은 없다. scope는 기존 data-wall-typography=storage-vm인05번 화면 및 동일 scope를 가진 포털 팝업이다 |
| 공통 토큰 | motion.css에 feedback120ms, enter160ms, exit100ms, layout200ms를 정의했다. feedback easing은 cubic-bezier(0.2,0,0,1), 배치/진입 easing은 cubic-bezier(0.22,1,0.36,1)로 overshoot 없는 빠른 정착이다. 기존 --wall-layout-move-* 변수를 같은 scope에서 이 토큰에 연결하고 다른 UID의 기본180ms는 바꾸지 않는다 |
| Hover / Focus | 예약된 Grip/메뉴 슬롯과 Resize는 opacity120ms만 전환한다. 제목 위치·카드 크기·아이콘 모양/색은 그대로다. 헤더 버튼의 배경·색, 카드 Border/약한 Shadow도 같은120ms로 연결한다. 키보드 focus-within의 도구는 duration0s로 즉시 표시한다. 카드 lift/scale, 강한 Shadow, 장식적 gradient는 추가하지 않는다 |
| 메뉴 / Popover | Base UI Popup의 data-starting-style/data-ending-style과 --transform-origin을 사용한다. 열림은3px/scale0.985→정상 + opacity160ms, 닫힘은 위치 이동 없이 opacity100ms다. Menu/Popover의 mount/unmount·포커스·충돌/위치 보정은 기존 Base UI에 맡긴다. 실제 primitive/import는 기존 @base-ui/react/menu, @base-ui/react/popover 1.0.0과 로컬 shadcn composition이며 이번 변경은 CSS 표시만이다 |
| 배치 | native Grid의 이웃 transform과 조작 후 컨테이너 height는200ms 공통 easing으로 연결한다. 최초 측정은 Grid transition none이며 기존 enable-move-animations 클래스가 있을 때만 높이 전환을 사용한다. 잡은 패널·다중 선택 이동 멤버·Resize·조작 중 카드 표면은 transition none으로 지연을 없앤다. 위치 안내 transform/크기와 Grid 표시/제거는 즉시이며 새 모션 상태/루프/포인터 엔진을 추가하지 않는다 |
| 실제 브라우저 |1515px Light 첫 표시에서 item transition-property none, Grid duration0s, header opacity120ms 확인. 실제 Grip 이동 중 잡은 항목0s·이웃 transform200ms·Grid height200ms·배치 안내1, 종료 안내0 확인. Resize 중 항목/카드0s와 종료 active0/guide0 확인 후 취소로dirty0 복원했다. 메뉴 진입 중 opacity0.998/transform이 정상값에 수렴하는 실제 CSS 상태와160ms 전환을 관찰했고 Esc 후 popup detached를 확인했다. Dark도 같은160ms와 기존 rgb(28,38,53) 표면이다 |
| reduced motion | 기존 .wall-modern * 규칙은 자식에만 적용되어 포털 팝업 root 자체를 빠뜨릴 수 있었다. 새 공통 media 규칙은 scope root와 자식 모두 animation/transition none !important로 처리한다. 이 검증 환경의 실제 matchMedia는 false이며 OS 환경 설정이나 전역 사용자 설정은 변경하지 않았다. reduced 환경의 실사 완료로 표현하지 않는다 |
| 실제 사용 탭 |5개 탭 미저장0·gesture0 확인 후 새 빌드를 갱신했다. 사용자 선택 -1001/성능 추이!를 복원하고 실제 scope layout200ms/header120ms/dirty0 확인. 캡처 motion-actual.png. QA의 Light/Dark 메뉴 캡처는 motion-menu-light.png, motion-menu-dark.png이며 검증용 배치 변경은 취소했다 |
| 보존 / 검사 | motion.css 및 WallChrome.tsx의 CSS import만 제품 변경했다. 데이터·숫자·시계열 path·쿼리·59개 패널·배치 저장/충돌/Undo·A-Hybrid 구조는 그대로다. production build 성공(최종 Grafana 경고2개), Prettier·WallChrome ESLint·공백 검사 통과. CSS 표시 변경이므로 새 단위 테스트나 전체 회귀는 추가/반복하지 않았다. 실제 로컬 fixture UI 검증이며 운영 데이터 검증은 아니다 |


### REF-52 직접 편집과 서버 일괄 저장 통합 (2026-10-29)

| 요청과 기존 구현 대조 | 결정 / 실제 수정 |
| --- | --- |
| 전역 편집을 거쳐야 한다는 전제 | 기존 REF-23/50 이후 직접 조작은 이미 상시 사용 가능했다. 이를 다시 구현하거나 클릭 편집 모드로 되돌리지 않는다. 남아 있던 상단 편집→wallTab 초기화/wallLayout=kpi focus 진입과 전체 편집 우회를 제거하고 대시보드 설정/관리 메뉴로 교체했다 |
| 배치가 달라지는 원인 | isWallModernRoute가 kiosk를 제외하고 Renderer가 isEditing일 때 Workspace를 제외하여 native24열 Scene 화면으로 전환했다. 상세 탭도 관리자 storageKey 존재 여부로 CSS/Grid 렌더링을 나눴다.05번은 같은 Workspace/Grid를 사용하며 kiosk/readOnly는 계산이 아닌 조작 UI 정책이다. 키오스크의 Sidebar/Topbar는 숨기되 기존 공간을 예약해 실제 타일 rect까지 동일하게 유지한다 |
| 영구 저장 실패의 원인 | PanelLayoutGrid.save는 localStorage.setItem만 실행했고 Grafana Save API/Scene dirty와 연결되지 않았다. native gridPos로 반올림하지 않고 Wall48열 문서를 별도 JSON 필드로 저장한다. native24열 원본은 그대로 유지하므로 기본 Grafana의 전체24열 화면은 이 배치를 해석하지 않는다 |

| 구현 / 컴포넌트 | 계약 |
| --- | --- |
| wallDocument.ts | version1/layouts/texts 형태의 JSON 확장이다. x/y/w/h의48열·2px row pitch를 그대로 보존한다. 사용자별 기존 key 접두사를 제거해 서버에서 공유하는 region key를 사용한다. native 추가/삭제 ID는 기존 항목 위치를 유지하고 새 ID만 native 크기를48열로 정확히2배 확장해 마지막 줄에 배치한다. 기존48열을24열로 줄이거나 반올림하지 않는다 |
| WallEditContext.tsx | native DashboardScene.state.wallModern이 모든 탭·패널/설정 왕복의 임시 문서다. 기존 로컬 배치는 초기값으로 읽고 서버 문서가 우선한다. 변경 완료 시에만 native transaction/change tracking을 시작하며 원위치 Undo는 metadata-only dirty를 만들지 않는다. 서버 저장 성공의 baseline과 취소 기준을 공유한다 |
| PanelLayoutGrid / 상세 Grid | 기존 엔진/흡착/충돌/6px 임계값/다중 선택·이동·Undo를 그대로 사용한다. Wall provider 안에서는 개별 로컬 저장 UI를 렌더링하지 않는다. 다른 탭/설정에서 되돌아와도 draft는 Scene 문서에서 복원한다. Viewer/키오스크도 같은 계산을 사용하고 버튼/Resize는 DOM에서 제거한다. 빈 Grip 슬롯은 남겨 헤더 제목도 움직이지 않는다 |
| 서버 저장 / native 연결 | DashboardSceneState/PERSISTED_PROPS와 양방향 serializer에 wallModern 전달만 추가했다. Dashboard.openSaveDrawer→기존 SaveDashboardForm/useSaveDashboard→POST /api/dashboards/db→saveCompleted/버전 관리를 사용한다. 새 저장 API·DB schema·backend·자동 저장·포인터 엔진은 없다 |
| 저장/취소/오류 | 실제 변경이 있을 때 하단 고정 global 저장/취소를 표시한다. 저장은 native 창을 열고 native 오류/버전 충돌 처리도 재사용한다. 성공 후 기준점을 갱신하고 열린 Drawer/설정/패널 편집기 자체는 baseline에 복제하지 않는다. 취소는 마지막 성공한 전체 대시보드 기준점으로 돌아간다. 실패 때 임시 상태를 지우지 않는다 |
| 이탈 / 권한 | 기존 DashboardPrompt의 route block/beforeunload를 사용한다. 저장 가능한 익명 Admin 프리뷰를 isSignedIn=false라는 이유로 경고에서 제외하던 부분을05번 canSave 기준으로 보완했다. 키오스크는 권한을 바꾸지 않으며 native 메뉴의 보기·공유·검사 등은 유지하고 편집/복제/삭제만 숨긴다. 기존 관리자 레이아웃 권한과 native 패널/설정 권한을 구분한다 |
| native 개별 편집 / 설정 | 패널 메뉴 편집은 기존 PanelEditor(Queries/Transformations/데이터소스/옵션)다. 설정은 기존 일반·변수·시간·권한·JSON 등 화면을 재사용한다. 설정 진입 전에 Scene URL state를 동기화해 URL이 원래 화면으로 되돌아오는 race를 방지했다. 재진입 시 native onEnterEditMode가 임시 기준점을 덮어쓰지 않도록05번에 한정해 가드한다. 관리 메뉴의 패널 추가/라이브러리 추가도 기존 native 메서드를 사용한다 |
| Text / 디자인 | 기존4개 WallTextPanel의 내용도 같은 JSON 문서에 보존한다. 텍스트 적용은 임시 문서를 바꾸고 실제 서버 기록은 대시보드 저장 때 수행한다. 로컬 shadcn Card/Button/DropdownMenu와 Base UI1.0.0의 기존 import를 재사용하며 새 패키지/새 디자인/설정 재개발은 없다. CSS는 고정 저장 바·키오스크 공간 예약뿐이고 A-Hybrid/모션/차트 외형은 유지한다 |
| 설정 보존 | native serializer가 프리뷰 런타임의9.2.0 pluginVersion으로 일부 원본11.4.0-pre 표기를 갱신하는 것을 실제 Diff에서 발견했다. null/undefined를 정규화한 나머지 설정이 같으면 이전 pluginVersion을 보존한다. 실제로 옵션을 바꾼 패널의 native 저장을 막거나 사용자가 변경한 쿼리를 되돌리지 않는다 |

| 실제 검증 | 결과 |
| --- | --- |
| 키오스크 / ESC |1515px 브라우저에서 개요25개 타일의 모든 DOM rect를 비교해 진입·종료 모두 동일했다. 키오스크 이동/Resize DOM0·설정/저장 UI0, ESC 후 핸들50개 복원(25타일×Grip/Resize). URL kiosk 제거 시 Scene kioskMode도 함께 해제한다 |
| Resize / 설정 / 패널 편집 | 가동 시간260×108→286×126px으로 변경 후 설정 왕복·패널 편집기 왕복에서도 그대로 유지. 조회 화면에는 query UI0, native 편집기에는 Queries1/Transformations0·기존 데이터소스/옵션이 표시됨을 확인했다. 원래 배치로 Undo하면 Dirty0이며 Redo/이탈 취소 뒤에도 변경을 보존했다 |
| 이탈 경고 | 미저장 상태에서 대시보드 목록 링크를 누르면 기존 저장되지 않은 변경 사항 모달이 표시되고 취소/폐기/대시보드 저장을 제공했다. beforeunload도 동일 ignoreChanges 가드를 사용한다. 실제 브라우저 새로고침 확인창 자체의 조작 실사를 완료했다고 표현하지 않는다 |
| 실제 서버 / 버전 / 새로고침 | 로컬3317 테스트 서버에서 UI 저장으로 버전15→16, 이후 보완한 UI 저장으로18/19가 생성됐고, API/DB 읽기로 x0/y30/w11/h63 및 다른 KPI w9가 손실 없이 기록됨을 확인했다. 새로고침 후286×126px 복원·저장 창 닫힘/Dirty0 확인. 마지막엔 검증용 크기/위치를 기존 값으로 공식 Save API를 통해 복원했다(최종20). 원본 native panels 배열은 작업 전 JSON과 완전히 같고4개 Text 내용도 보존된다. SQL은 읽기 검증뿐이며 직접 DB 수정은 하지 않았다 |
| 실제 사용 화면 | 기존 사용자 탭5개 미저장0·gesture0을 확인하고 새 빌드를 갱신했다. 상단 편집0/설정1·개요21개 데이터·25개 A-Hybrid 헤더·Dirty0 확인. 캡처 editing-integrated-actual.png. 운영/고객 환경을 바꾸거나 실데이터 검증으로 표현하지 않는다 |
| 검사 / 한계 | production build 성공(기존 경고2개), 변경 파일 ESLint·Prettier·공백 검사 통과. 직접 관련6 suites40개 및 문서/추가삭제 정합성 최종4개(기존3개 포함), native 저장 성공/오류·overwrite2개 통과. 초기 넓은 SaveDrawer 수트의 Save as Copy1개는 JSDOM CSS :has resolver 오류로 미통과였으며 대상 저장 성공/오류는 별도 실행해 통과했다. 전체 tsc는 기존 React/외부 타입 진단130개가 남고 수정 기능의 신규 진단은 없다. 전체 제품 회귀/새 복제 기능 개발은 하지 않았다 |

주요 파일: workspace/WallEditContext.tsx, wallDocument.ts, PanelLayoutGrid.tsx, WorkspacePanelLayout.tsx, StorageDashboardWorkspace.tsx, WallTextPanel.tsx, WallPanelActions.tsx, PanelActionDock.tsx, layoutHistory.ts, DashboardWorkspace.tsx; toolbar/WallDashboardToolbar.tsx; model.ts, modern.css, workspace/panelActions.css; dashboard-scene의 DashboardScene/Renderer/UrlSync, 양방향 serializer, DashboardPrompt 및 관련 테스트/이 문서/AGENTS.md.

제약: 서버가 관리하는 공유 문서이므로 사용자별 로컬 배치와 달리 동일 대시보드를 보는 사용자에게 공유된다. 기존 서버 저장 권한·provisioning 제한·버전 충돌 정책을 그대로 따른다. Wall48열 확장을 이해하지 않는 native 전체24열 렌더러/외부 도구는 원래 gridPos를 표시한다. 다른 UID/백엔드/HTTPS·포트/배포 구성은 변경하지 않는다.


### REF-53 패널 정렬 안내와 자석 피드백 (2026-10-29)

| 항목 | 실제 구현 / 검증 |
| --- | --- |
| 범위 / 참조 | 사용자의 PowerPoint식 수평·수직 정렬 안내와 자석 느낌 요청을 반영한다. 외부 UI/아이콘을 복제하거나 새 라이브러리를 사용하지 않았다. 기존05번48열·2px 세로 좌표를 유지하고 Grid 축소/저장 좌표 변환은 하지 않는다. 이 명시적 요청 범위의 흡착/안내만 조정하며 그 외 편집 기능 동결은 유지한다 |
| 원인 | 기존 이동의 drop 좌표 흡착과 RGL의 잡은 카드 pixel 추적이 분리되어 실제 카드가 흡착된 위치를 보여주지 않았다. Resize는 이웃 가장자리 흡착이 없었다. React-resizable의 node는 카드가 아니라 handle이므로 카드 closest를 찾아 피드백을 적용한다 |
| 공통 토큰 | workspace/kpiLayout.ts panelSnap: 진입24px/해제38px, guideReach240px. 이전18/28px보다 정렬 유지 여유를 늘린다. 기존 swap35%/20%·target margin12%p·48열·native 충돌은 유지한다. 안내선은 기존 --wall-primary의1px 점선으로 Light/Dark에 대응하며 카드 표면/차트 스타일 토큰을 변경하지 않는다 |
| 실제 렌더링 | layoutMovement.ts의 이동/Resize 좌표 계산과 PanelLayoutGrid의 CSS 개별 translate/Resize dimensions를 연결한다. native pointer 누적 상태는 건드리지 않고 실제 흡착 축만 표시 보정한다. Resize 반대 모서리·min/max·시작 snapshot 기반 충돌을 보존한다. 단순 클릭/6px 이하 움직임은 기존 계약을 유지하고 임시 data-wall-magnet 속성은 stop/abort에서 제거한다 |
| 정렬선 | LayoutFootprint에 재사용 가능한 AlignmentGuide 표시를 추가한다. Grid의 trailing gutter를 제외한 실제 카드 가장자리만 비교하여 수평/수직 모서리가 일치할 때만 선을 그린다. 현재 미리보기 배치의 이웃을 기준으로 하고 중복 선은 합치며 멀리 떨어진 패널은 제외한다. 조작 종료 시 footprint와 함께 제거하고 Dot은 계속 카드 뒤 배경에만 그린다 |
| 컴포넌트 / CSS 구분 | 기존 Wall PanelLayoutGrid/LayoutFootprint + react-grid-layout1.4.4/react-resizable를 재사용한다. 새 shadcn/Base UI primitive나 새 편집기를 도입하지 않았다. 기존 A-Hybrid의 로컬 components/ui/dropdown-menu→@base-ui/react/menu와 WallPanelHeader는 유지한다. kpiLayout.css는 실제 계산된 임시 위치/크기와 안내선을 표시하며 CSS만으로 흡착을 흉내내지 않는다 |
| 실제 브라우저 |1715px 데스크톱의 별도 QA 탭에서 Light/Dark 확인. 원래108px 높이의 KPI를18px Resize해도108px 유지/dirty0. 크게 Resize하면 좌상단 x256/y386을 고정한 채172px 높이로 변경되고 dirty1, 취소 후108px 복원. 실제 이동 중 native transform12px에 correction -12px가 적용되며 카드 rect가 정렬 위치에 유지됨을 관찰했다. 조작 중 안내선2~3개, 종료 후 안내선0/active0/magnet0. Dark 안내선 rgb(105,167,255)와 같은 정렬 rect 확인. 모든 QA 배치 변경은 취소하고 서버에 저장하지 않았다 |
| 검증 / 보존 | 직접 관련 layoutMovement12tests 통과(Resize 흡착·유지·해제/반대 모서리·min/max 및 visible-edge 안내 추가), 변경 TS/TSX ESLint·Prettier 및 production build 통과(기존 경고2개). 전체 tsc 기존130개 진단, 이번 변경 파일 진단0. 쿼리/단위/59개 패널/5탭/서버 저장/Undo 계약은 변경하지 않는다. 실제 운영 데이터 검증/전체 제품 회귀는 하지 않았다 |
| 사용자 탭 / 실행 | 실제 사용 탭1296910772에 미저장 작업이 있어 자동갱신하지 않았다. 미저장 작업과 해당 탭의 기존 bundle을 보존하고 별도 QA 탭에 최신 빌드를 로딩했다. 사용자 탭에서는 저장 또는 취소 후 새로고침해야 새 흡착/안내가 반영된다. launchd 미리보기는 빌드 manifest 갱신을 위해 재시작 후3317 health200을 확인했다 |

변경 파일: workspace/kpiLayout.ts, layoutMovement.ts, layoutMovement.test.ts, PanelLayoutGrid.tsx, LayoutFootprint.tsx, kpiLayout.css 및 본 기준표/AGENTS.md.


### REF-54 이웃 우선 흡착을 Grid 칸별 흡착으로 정정 (2026-10-29)

| 항목 | 구현 / 검증 |
| --- | --- |
| 사용자 정정 / 우선순위 | REF-53의 이웃 가장자리에서만 자석 효과를 주는 해석을 대체한다. 모든 빈 Grid 칸에서도 이동/Resize가 단계적으로 붙는다. 이웃 정렬선은 보조 안내로 유지하되 이웃/시작 위치가 중간 Grid 칸을 건너뛰어 잡아당기지 않는다 |
| 좌표 / 토큰 | 48열 저장 모델은 그대로다. 가로1열, 세로 visible Dot 간격12px(기존2px 저장 row의6개)을 실제 조작 단위로 사용한다. panelSnap.cellHold=0.62로 반 칸을 조금 넘겨야 다음 칸으로 넘어가도록 앞뒤 떨림을 방지한다. rowPixels=12를 Dot 배경과 이동/Resize가 공유한다. 기존 미조작 배치/크기는 일괄 정렬하지 않으며 원래 값/반대 모서리·min/max는 보존한다. REF-53의24/38px 이웃 자석 토큰은 더 이상 사용하지 않는다 |
| 구현 / CSS 구분 | layoutMovement.ts gridCoordinate/interactionRowStep으로 실제 배치 좌표를 계산한다. PanelLayoutGrid는 이웃과 일치하는 축뿐 아니라 매 Grid 칸에 실제 잡은 카드의 translate/Resize 크기를 맞춘다. 다중 이동도 selection hull의 Grid 이동량을 사용해 상대 위치를 보존한다. native pointer 누적/48열 충돌/교환·Undo·서버 저장은 유지한다. 새 shadcn/Base UI primitive·DnD 라이브러리는 없다. 기존 kpiLayout.css와 LayoutFootprint 정렬선을 그대로 재사용하는 렌더링 옵션/계산 변경이다 |
| 검증 | 직접 관련12tests 통과. 이웃이 없는 여러 가로 칸과 세로12px stop, 칸별 유지/해제, Resize/반대 모서리·제한, 기존 교환/다중 이동을 확인했다.1715px 실제 브라우저에서 가동 시간 y386→482(12px×8)로 이동 후dirty1, 취소로 복원. Resize는 폭301→332(1열), 높이108→120(12px)로 변하고dirty1/종료active0 확인 후 취소했다. 조작 중 원래 native 연속 좌표에 Grid 보정이 적용됨을 DOM에서 확인했다. 약한 겹침 때 교환 전 원래 drop slot을 유지하는 기존 충돌 계약은 그대로다 |
| 반영 / 범위 | production build 성공(기존 경고2개), 변경 파일 ESLint/Prettier 통과. 서버3317 정상 응답. 실제 사용 탭1296910772는 미저장1을 보존하여 강제갱신하지 않고 별도 검증 탭만 갱신한다. 검증 배치는 서버에 저장하지 않는다. 다른 UID/차트/데이터/기존 저장 문서는 변경하지 않는다 |


### REF-55 Text 패널 Hover 표면 (2026-10-29)

| 항목 | 적용 / 검증 |
| --- | --- |
| 참조 / 범위 | 사용자가 첨부한05번 성능 추이 Text 패널과 Dynatrace식 Hover 시 영역 식별 요청을 반영한다. 외형 복제가 아니라 기존 Wall8px 반경/단색 surface/절제된 border를 사용한다.05번의4개 WallTextPanel만 대상이다 |
| 기본 / 상호작용 | 평상시 REF-47의 투명 배경·투명1px border·그림자 없음은 유지한다. 카드 또는 Grid tile Hover, focus-within, 내부 aria-expanded=true 동안 기존 --wall-surface와 --wall-card-border-hover로 불투명한 영역을 표시한다. border 두께/내부 padding/타이포그래피/좌표/크기는 변경하지 않는다. REF-47의 투명 정책에 대한 이 명시적 Hover 예외가 우선한다 |
| 실제 컴포넌트 / CSS 구분 | 제품 변경은 workspace/textPanel.css뿐이다. 기존 WallTextPanel.tsx→../ui→components/ui/card.tsx의 로컬 shadcn Card를 재사용하며 새 Base UI primitive는 없다. 기존 추가 작업/편집 Popover와 A-Hybrid는 변경하지 않는다 |
| 실제 화면 | 별도1715px 브라우저에서 Light Hover rgb(255,255,255), border rgb(173,187,206), Dark Hover rgb(28,38,53), border rgb(96,116,143), shadow none 확인. 성능 추이953×48px 크기는 그대로이며 해제 시4개 Text 모두 rgba(0,0,0,0) 복귀/dirty0/Grid0 확인. Light 캡처 text-hover-light.png. 배경 변경에 따른 전체 회귀나 새 테스트는 추가하지 않았으며 Prettier/production build(기존 경고2개)/공백 검사 통과 |
| 사용자 탭 / 실행 | 기존 두 사용자 탭1296910772/1296910969 모두 미저장1이어서 새로고침하지 않았다. 최신 빌드는 별도 검증 탭에서 확인했다. 기존 탭은 사용자가 저장/취소 후 갱신해야 새 Hover가 반영된다.3317 launchd 서버를 유지하고 health 정상 응답 확인. 데이터/차트/Grid/배치 저장은 변경하지 않는다 |


### REF-56 패널 Command Menu + Drill-in Inspector (2026-10-29)

| 항목 | 실제 적용 / 검증 |
| --- | --- |
| 참조 / 범위 | 사용자 요청의 Command Menu/Click Drill-in과 기존 REF-22/47의 절제된 컨텍스트 액션·Soft Depth를 기준으로 한다. 기존 TailAdmin Surface 참조의 위계/밀도만 적용하고 특정 외형을 복제하지 않았다.05번 UID의 WallPanelActions를 사용하는 데이터 패널 메뉴만 변경하며 다른 UID·Text 타일의 별도 텍스트 편집·대시보드 설정은 확대하지 않는다 |
| 실제 컴포넌트 / import | WallPanelActions.tsx→../components/ui/dropdown-menu.tsx→@base-ui/react/menu1.0.0의 Menu.Root/Trigger/Portal/Positioner/Popup/Item/Separator를 사용한다. 로컬 shadcn composition이며 SubmenuRoot/SubmenuTrigger/Flyout은 이 메뉴에서 사용하지 않는다. Grip/제목/우측···/Resize의 A-Hybrid 구조는 유지한다 |
| Command 구조 | 제목(말줄임)→보기/편집/공유의 동등 폭 Quick action→탐색/검사/추가 작업 및 실제 native 확장 기능→하단 위험 작업이다. 권한 때문에 없는 Quick action은 새로 만들거나 비활성 가짜 버튼으로 표시하지 않는다. panelCommandModel.ts는 native divider/group label만 제거하고 실제 leaf·href·onClick을 유지하며 nested 삭제도 root 하단으로 분리한다. Copy와 Duplicate는 다른 원래 native 액션으로 유지한다 |
| Drill-in / 키보드 | 검사/추가 작업/공유의 하위 항목/확장 하위 메뉴는 Click으로 같은 Popup 내용을 교체하고 뒤로 가기와 ESC는 한 단계 복귀한다. root ESC는 Popup만 닫는다. native 메뉴 키보드 탐색/권한·callback을 유지하며 복귀 때 원래 진입 Item으로 포커스를 돌린다. focus preventScroll을 사용하고 메뉴 닫힘/패널·제목 변경에서 내부 path를 초기화한다. Hover로 하위 메뉴를 열지 않는다 |
| Surface / 공통 토큰 | surfaceTokens.ts wallCommandTokens/Variables에 폭240px, 높이284px envelope, 반경12px, 항목36px/아이콘15px, 중립 Hover/명확한 Border/단일 약한 Shadow를 정의한다. 기존 typography.ts와 --wall-soft/surface/text/muted를 재사용한다. 높이는 Base UI available-height/viewport에 맞춰 제한하고 긴 항목 목록만 내부 스크롤한다. DropdownMenuContent는 기존 typography 변수와 전달 style을 병합하여 menu 전용 토큰을 Portal에 전달한다. 이 변경은 새 표시 구조+Base UI 이벤트이며 panelActions.css만 덮은 Grafana Flyout이 아니다 |
| 위치 / 이벤트 | Portal/Positioner의 자동 collision 처리를 재사용한다. path별 폭·높이가 같아 실제 화면 좌표 클릭으로 root↔검사 전환 시 rect(296,275,240,284)가 같았다. selector 자동 클릭은 페이지 자체를 scrollIntoView하기도 하므로 그 경우를 Popup 자체의 이동으로 오인하지 않는다. root/Popup에 기존 no-drag scope를 적용하고 Popup mouseDown/click 전파를 차단해 Grip/Resize와 분리한다 |
| 키오스크 | WallEditContext에 기존 kiosk UI 상태 boolean만 추가하고 저장/권한 계산은 바꾸지 않는다. kiosk에서 보기/공유·허용된 탐색/도움은 유지하고 편집·복제·삭제·복사/라이브러리·새 경보 및 Inspector 진입을 숨긴다. Inspector는 Data에서도 Query/JSON 탭을 제공하므로 메뉴의 쿼리 leaf만 숨기는 우회 대신 진입 자체를 숨긴다. 일반 Viewer는 native 허용 액션을 유지하며 kiosk를 보안 경계로 표현하지 않는다 |
| 실제 액션 검증 | 로컬 fixture UI에서 보기→native viewPanel=panel-28와40s 표시, 편집→editPanel=28/native 쿼리·시각화 설정, 공유→원래 패널 공유 창 확인. 검사 Data/Query/JSON 각각 inspectTab=data/query/json URL과 원래 Drawer/실제 테이블·request·JSON을 확인했다. 삭제→기존 확인 창을 열고 취소했으며25타일/dirty0 유지. 복제/삭제 callbacks 및 native href/synchronize 보존은 단위 테스트로도 검증했다. 실제 복제/삭제/서버 저장은 수행하지 않았다 |
| 실제 UX 검증 | Light 흰 Surface/Dark rgb(28,38,53),240×284px/12px 확인. root/검사/추가 작업이 단일 menu DOM이고 ESC 복귀 후 root ESC는 닫힘을 확인했다. 우측 하단 anchor(1544,605,28,28)에서는 side=top/Popup(1332,315,240,284)으로 viewport 안에 표시됐다. kiosk는 Grip0/Resize0/관리 메뉴0, Popup ESC는 kiosk 유지·다음 ESC로 일반 Grip25/Resize25 복원. 메뉴 클릭 중 Grid0/dirty0, 별도 실제 Resize301×108→332×120 및 Grip y386→482는 dirty1/종료active0이고 취소로 복원. 차트 Drag Zoom은 from/to만 갱신하고 layout dirty0/Grid0이었다. 운영 데이터 검증으로 표현하지 않는다 |
| 검사 / 반영 | 관련2 suites9tests 통과(실제 native URL·callback, 단일 Popup/ESC·뒤로 가기/재열림 초기화, danger 분리·권한 정책), 변경 파일 ESLint/Prettier 및 production build 통과(기존 경고2개). 전체 tsc는 기존130개 오류가 남고 변경 파일 진단은 없다. 기존 사용자 탭1296910969/1296910772는 미저장1이어서 갱신하지 않았다. 미저장0인1296910978을 최신 검증 화면으로 갱신했고 마지막25타일/dirty0/active0이다. 서버3317 health200/launchd 유지 |

변경 파일: workspace/WallPanelActions.tsx, panelCommandModel.ts(신규), WallEditContext.tsx(kiosk UI flag만), panelActions.css, components/ui/dropdown-menu.tsx(style 병합), surfaceTokens.ts(메뉴 토큰), WallPanelActions.test.tsx/panelCommandModel.test.ts 및 본 기준표/AGENTS.md. 캡처: command-menu-light.png, command-inspector-light.png, command-menu-dark.png, command-menu-edge.png. 원본59개 데이터 패널/JSON·쿼리·변수·48열·저장/Undo 엔진은 변경하지 않는다.


### REF-57 Command Menu 밀도와 단일 패널 복사·붙여넣기 (2026-10-29)

| 항목 | 실제 구현 / 계약 |
| --- | --- |
| 범위 / 참조 | 사용자가 승인한 REF-56 Command Menu와 REF-22의 정보 밀도 원칙을 유지한다.05번 UID 하나에 적용하며 Dynatrace의 외형·툴바·메뉴를 복제하지 않는다. 차트·데이터·A-Hybrid·48열 Grid·다중 선택 엔진을 새로 만들거나 변경하지 않는다 |
| 상단 / 하단 밀도 | 보기·편집·공유의 순서/3열/50px 높이/아이콘/간격/배경을 유지한다. 하단/Drill-in은 wallCommandTokens.itemHeight=32px, 아이콘15px, padding-block4px, divider margin-block3px로 통일한다. 폭240px을 유지하고 기본 envelope는284→252px이다. 실제 하위 항목 수에 따라 같은 메뉴 전체 envelope를 늘리므로 Drill-in 때 흔들리지 않으며 viewport 높이가 부족할 때만 available-height 제한/내부 scroll을 사용한다. 기능을 숨겨 scroll을 없애지 않는다 |
| 실제 컴포넌트 / import | 기존 WallPanelActions.tsx→../components/ui/dropdown-menu.tsx→@base-ui/react/menu1.0.0의 Root/Trigger/Portal/Positioner/Popup/Item/Separator를 그대로 재사용한다. 로컬 shadcn composition의 실제 이벤트/구조 변경이다. surfaceTokens.ts와 panelActions.css는 하단 밀도/shortcut 표시를 담당한다. 새로운 라이브러리나 가짜 Base UI Card 패키지는 없다 |
| 복사 명령 | 기존 추가 작업 Drill-in 안 native Copy를 패널 복사로 연결하고 Copy 아이콘·macOS⌘C/기타Ctrl+C 안내를 표시한다. 기존 복제와 구분하며 상단 공유를 바꾸거나 root 메뉴/quick 칸을 추가하지 않는다. config만 deep clone하고 실제 DataFrame·캐시·원본 ID/Scene 객체·OS clipboard는 변경하지 않는다. 복사 자체는dirty0이다 |
| 내부 버퍼 / 단축키 | PanelClipboardContext.tsx의 Scene별 메모리 버퍼는 같은 대시보드의5개 탭 전환 동안 유지된다. Ctrl/Cmd+C는 기존 선택 단일 native 패널 또는 명확히 포커스된 패널만 복사한다. Ctrl/Cmd+V는 현재 활성 탭에 붙인다. 입력/textarea/select/contenteditable/Monaco/CodeMirror/Ace·textbox/combobox/dialog/menu·일반 텍스트 선택·조작 중·다중 선택 복사는 가로채지 않는다. menu 안의 명확한 현재 패널 Copy 단축키만 별도로 지원한다. 빈 버퍼/다른 UID/키오스크/읽기 전용에서는 기본 붙여넣기를 방해하지 않는다 |
| native 복제 경로 | panelClipboard.ts는 gridItemToPanel→cloneDeep→PanelModel→buildGridItemForPanel과 dashboardSceneGraph.getNextPanelId를 사용한다. 대시보드 전체의 새 양수 ID를 할당하고 원본 targets/datasource/options/fieldConfig/overrides/thresholds/transformations를 독립 객체로 유지한다. native Duplicate callback이나 OS clipboard JSON paste를 억지로 호출해 다른 Row에 들어가는 방식을 사용하지 않는다 |
| Row / 탭 /48열 배치 | 각 Workspace 탭의 실제 SceneGridRow(rowId)에 새 native child를 추가한다. native24열 gridPos는 해당 Row의y에 앵커링해 DashboardModel의 y 정렬 때문에 다음 Row로 넘어가지 않게 한다. 실제 위치와 원본48열 w/h는 wallModern.layouts에 저장하고 기존 항목의 최대 y+h 아래에 빈 위치를 추가한다. 기존 패널을 compact/재정렬하지 않는다. React 렌더 이전 연속 붙여넣기도 Scene 문서의 예약 위치를 합쳐 서로 겹치지 않는다 |
| Wall 표시 상속 | wallModern.panelSources[newId]=원본 표시ID를 보존한다. 신규 ID도 KPI·사용률·상태·용량 등 기존 Wall 표시 의미/카드 유형을 유지한다. 원본을 나중에 삭제해도 저장된 설정과 표시ID가 독립적으로 남는다. 원본59개 ID/표시 설정은 변경하지 않는다 |
| 저장 / 취소 | 붙여넣기 때 native edit tracking/dirty만 시작하고 자동 서버 저장은 하지 않는다. 기존 하단 저장→native Save Drawer/API/버전 관리와 전체 취소 baseline을 재사용한다. native panels와 wallModern 문서를 함께 저장하므로 다른 탭의 복사 패널도 새로고침 후 복원된다. 취소 직후 native ID가 제거되고 React draft가 한 프레임 남는 경우 PanelLayoutGrid가 사라진 ID를 bounds 렌더에서 제외해 undefined 오류를 방지한다. 정상 항목의 배치 계산은 바꾸지 않는다 |
| wire 설정 보존 | 대상 UID의 hydrate 이전 raw baseline을 deep clone한다. DashboardModel이 collapsed Row의 threshold를 in-place 정규화하던 문제를 막는다. serializer는 JSON wire 표현에서 실제 설정이 같으면 원본 pluginVersion/base-null·생략 표현까지 원래 객체를 보존한다. 쿼리/옵션을 실제로 바꾼 패널은 native 변경을 저장한다. Row 내부 wire 순서는 원래 ID 순서를 유지하고 새 ID만 뒤에 추가하여 Row-y 앵커 복사본을 재로딩했을 때 order-only dirty가 발생하지 않게 한다. 현재 Row membership과 실제 gridPos 변경은 유지하며 다른 UID의 serializer 결과는 바꾸지 않는다 |
| 제한 | 이번 복사 대상은 실제 Grafana ID/설정 모델을 가진 단일 native 데이터 패널이다. 음수ID의4개 Wall 표시 전용 Text 타일과 다중 복사는 대상이 아니다. 버퍼는 새로고침/다른 Dashboard Scene 이동 시 초기화되며 대시보드 간/OS clipboard 전달은 지원하지 않는다. 기존 패널 복제·삭제 등의 기능을 새 기능으로 설명하지 않는다 |

| 검증 | 결과 / 근거 |
| --- | --- |
| 실제 메뉴 / Light·Dark |1715px 실제 사용 탭에서 양쪽 테마 모두240×252px, quick3개 각각50px, 하단3개 각각32px 확인. 기본 목록 clientHeight97/scrollHeight97로 내부 scroll0이다. Dark surface rgb(28,38,53)를 유지하고 추가 작업의 패널 복사⌘C·ESC 한 단계 복귀를 확인했다. 캡처 clipboard-menu-compact.png / clipboard-menu-compact-dark.png / clipboard-copy-command-dark.png |
| 실제 키 입력 / 탭 이동 | 브라우저 자동화의 가상 clipboard 대신 macOS 실제 Cmd+C/V로 원본28을 복사하고 같은 탭에252/253, 네트워크에254 생성 확인. 동일한40s/289×96px 카드 표면(outer301×108px)·서로 다른 ID·겹치지 않는 위치를 확인했다. 최종 저장 검증에서는252 개요/253 네트워크의 두 복사본을 사용했다. 테스트 환경 fixture 값이며 운영 실데이터 검증으로 표현하지 않는다 |
| 실제 저장 / 새로고침 | native UI Save25 뒤 개요22/네트워크20 및 해당 복사 패널/40s 복원을 확인했다. API 읽기 Diff에서 신규252/253 외 원본 native 패널/Row 기록 변경0·원래 Wall 배치 region 변경0을 확인했다. Row 순서 보완 후 재로딩한 복사 패널의 메뉴 열기/복사만으로dirty0을 실제 확인했다 |
| 실제 취소 / 키오스크 | 추가254 붙여넣기는dirty1, native 취소 후254제거/기존253유지/dirty0/오류0을 실제 확인했다. 키오스크 Grip0/dirty0, 추가 작업에는 도움만 있으며 복사/편집/복제/삭제/검사0이다. 일반 모드 복귀 후 전체 명령을 확인했다. 버퍼가 이미 있는 상태에서 disabled/readOnly의 Ctrl/Meta+C/V 차단은 provider 이벤트 테스트로 검증했다 |
| 관련 검사 | 직접 관련6 suites36tests 통과: 복사 독립성/동일·다른 Row/연속 paste/new ID/동일 크기/직렬화 왕복/native 취소/키보드 입력·텍스트 선택 보호/읽기 전용/원본 설정 표현/재로드 순서/사라진 ID 안전 렌더/기존 선택·Command 기능. 변경 파일 ESLint·Prettier·공백 검사 및 production build 통과(기존 경고2개). 전체 tsc는 기존 React/외부 타입 진단130개이며 이번 변경 파일 신규 진단은 없다 |
| 원복 / 서버 | 검증용 복사본은 공식 Save API로 작업 전20의 원본을26으로 복원했다. 원본 panels와 wallModern 문서가 작업 전과 정확히 같음을 확인했다. 실제 사용 탭을 갱신하여21/19/7/6/6=59개 데이터 패널·복사본0·dirty0·조작0을 확인하고 Light로 돌려두었다.3317/3318 launchd 서버를 유지하며 SQL 직접 변경/운영·고객 환경 변경은 없다 |

변경 파일: workspace/panelClipboard.ts(신규), PanelClipboardContext.tsx(신규), panelClipboard.test.ts(신규), WallPanelActions.tsx, WallEditContext.tsx, PanelLayoutGrid.tsx, StorageDashboardWorkspace.tsx, DashboardWorkspace.tsx, FreeOverviewLayout.tsx, WorkspacePanelLayout.tsx, model.ts, wallDocument.ts, panelActions.css, PanelSelection.test.tsx; surfaceTokens.ts; dashboard-scene/serialization의 양방향 serializer; 본 기준표와 AGENTS.md. 레이아웃/차트 엔진이나 상단 quick 액션 디자인은 변경하지 않는다.


### REF-58 빠른 복제와 복제·붙여넣기 실행 취소 (2026-10-29)

| 항목 | 변경 / 검증 |
| --- | --- |
| 최신 사용자 정정 | REF-56/57의 상단 보기·편집·공유를 **보기·편집·복제**로 대체한다.3열/50px 높이/아이콘 크기/Surface는 그대로다. 공유는 추가 작업 Drill-in으로 이동하여 기능과 원래 callback을 보존한다. native 권한으로 허용된 실제 복제만 승격하고 kiosk/readOnly에서는 새 복제 액션을 만들지 않는다 |
| 문제 원인 | native 복제와 REF-57 붙여넣기는 Scene/Wall 문서를 변경했지만 기존 layoutHistory에는 이동/Resize 좌표만 기록됐다. 따라서 미저장 저장 바는 표시되지만 Undo로 복제를 되돌릴 수 없었다. 미저장 변경을 숨기거나 저장을 자동화하는 문제 회피는 하지 않는다 |
| 실제 구현 | WallPanelActions→PanelClipboardContext.duplicate는 기존 REF-57의 native JSON→PanelModel→buildGridItemForPanel 파이프라인을 사용한다. 복사는 내부 버퍼만 변경하고 복제는 버퍼를 덮어쓰지 않고 즉시 같은 탭에 삽입한다. layoutHistory에 recordCommand를 추가해 native 패널 삽입/제거·동일48열 배치·panelSources를 한 작업으로 Undo/Redo한다. 원본 쿼리/옵션/데이터는 변경하지 않는다 |
| 이력 / 저장 계약 | 동일한 탭별50개 이력과 기존 컨트롤/키보드 Ctrl/Cmd+Z·Ctrl/Cmd+Shift+Z·Ctrl+Y를 재사용한다. 삽입으로 ID 목록이 바뀔 때 이전 이력을 초기화하지 않는다. Undo는 새 ID만 제거하고 Redo는 같은 ID·설정을 복원한다. 다른 탭/텍스트 변경은 덮어쓰지 않는다. 현재 Gesture/kiosk/readOnly·ID 충돌에서는 재생하지 않는다. 실제 저장/전체 취소는 기존처럼 이력을 비운다 |
| Dirty / 안내 | 마지막 복제를 Undo해 저장 기준으로 돌아오면 native dirty0과 동시에 하단 안내도 제거된다. 원래 다른 미저장 변경이 있었다면 그 변경의 저장 안내는 유지한다. 기존 고정 저장 바의 긴 문구를 변경 사항으로 줄이고 기존 실행 취소·다시 실행 컨트롤을 함께 넣어 긴 화면에서도 접근한다. 대시보드 밖으로 나가는 브라우저 뒤로가기는 Undo로 바꾸지 않으며 미저장 이탈 보호는 유지한다 |
| 컴포넌트 / CSS 구분 | 기존 로컬 shadcn Button/DropdownMenu→@base-ui/react/menu1.0.0과 WallLayoutHistoryControls를 재사용한다. panelCommandModel은 native Duplicate를 quick3번째로 이동하고 Share를 More로 이동한다. 새로운 UI 라이브러리·히스토리 시스템·DnD 엔진·카드/차트 CSS는 추가하지 않았다 |
| 실제 브라우저 | 별도1715px Light 검증 탭에서 quick3개 보기/편집/복제 각각50px을 확인했다. 복제→개요22/ID252/dirty1/저장 바 Undo 표시, 하단 실행 취소→개요21/ID252제거/dirty0/저장 바 제거, 상단 다시 실행→같은252 하나 복원/dirty1을 확인했다. Cmd+Z와 Cmd+Shift+Z로도 제거/복원 정상이다. 마지막 전체 취소로 검증 복제와 이력을 지웠으며 서버 저장은 하지 않았다. 공유가 추가 작업 안에 남아 있음도 확인했다 |
| 검사 / 사용자 상태 | 직접 관련5 suites29tests 통과: 반복 삽입 Undo/Redo·정확한 saved baseline 복원·Grid 재연결 이력 유지·이동/삽입 순차 이력·기존 저장/메뉴 기능 포함. 변경 파일 ESLint/Prettier·production build 통과(기존 경고2개). 기존 사용자 탭1296910978은 개요22/미저장1이어서 갱신하지 않고 그대로 보존했다. 새 빌드는 별도 검증 탭에서 확인한다. 캡처 duplicate-quick-actions.png. 서버3317은 launchd로 유지한다 |

변경 파일: workspace/WallPanelActions.tsx, panelCommandModel.ts/관련 테스트, PanelClipboardContext.tsx, panelClipboard.ts/관련 테스트, layoutHistory.ts/관련 테스트, wallDocument.ts(panelSources 정합성), WallEditContext.tsx(저장 바의 기존 Undo/Redo 컨트롤 재사용), 기준표/AGENTS.md. 사용자 기존 미저장 복제 작업을 강제 저장·취소·새로고침하지 않는다.

REF-58 최종 확인: 전체 TypeScript 검사는 기존130개 외 이번 변경 파일 신규 진단0이다. 최신 빌드 후3317 health200을 확인했고 사용자 탭의 개요22/미저장1은 그대로 보존했다. 상세 메뉴 캡처는 duplicate-quick-actions-detail.png이며 새 검증 탭은 개요21/dirty0 상태다.


### REF-59 프레임 입력과 연속적인 직접 조작 모션 (2026-10-29)

| 항목 | 변경 / 유지 기준 |
| --- | --- |
| 사용자 요청 / 원인 | Dynatrace 대비 이동·Resize가 끊겨 보인다는 명시적 요청이다. 이전 REF-54는 잡은 카드의 pixel 좌표까지 Grid stop에 즉시 고정하여 가로 약30px/세로12px 단위의 계단 운동을 만들었다. native RGL의 flushSync/배치 계산도 모든 mousemove에서 실행됐다. easing만 길게 늘리지 않고 입력 빈도와 실제 표시 좌표를 함께 조정한다 |
| 입력 / native 재사용 | gestureMotion.frameMouseInput은 실제6px intent 이후에만 활성화된다. document capture에서 최신 mousemove 하나를 requestAnimationFrame마다 기존 react-draggable/RGL로 전달한다. mouseup 직전 마지막 샘플은 동기 flush하여 마지막 위치를 누락하지 않는다. 종료/취소/Esc/blur/unmount에서 frame과 listener를 제거한다. 드래그 외 차트·텍스트·단축키 이벤트는 가로채지 않으며 touch 경로는 기존 native를 유지한다. 새로운 DnD/애니메이션 라이브러리나 편집 엔진은 없다 |
| 연속 표시 / 흡착 | 논리 좌표·48열·12px 조작 stop·cellHold0.62·충돌·교환은 유지한다. 잡은 카드는 raw pointer pixel을 따라가고 각 Grid stop 근처에서 smoothstep 자기장으로 당겨진다. 공통 panelSnap.visualCaptureFraction0.45/visualCapturePixels12를 사용한다. stop 전환 때 카드 전체가 한 열씩 뛰지 않으며 놓을 자리 안내는 계속 정확한 Grid 좌표다. 다중 선택도 같은 pixel delta를 모든 구성원에 적용해 상대 위치를 보존한다 |
| Resize / 저장 좌표 | Resize 표시도 pointer 크기와 제한값 안에서 연속적으로 추적하고 각 stop 근처에서 흡착한다. 기존 반대 모서리/y·min/max·원본 snapshot 충돌 처리를 사용한다. 저장/Undo에는 종전 정수48열·2px row 문서만 반영하고 fractional 표시값·임시 dataset·animation은 저장하지 않는다 |
| 성능 / 재계산 | 같은 논리 Grid 위치/크기 안에서 이전 collision preview를 재사용한다. Grid 배경Dot/국소 안내와 패널/차트 subtree 재사용은 유지한다. 매 조작 때 모든 패널에 will-change를 주던 규칙을 제거하고 잡은 카드만 compositor hint를 사용한다. native Grid API/기존 query runner/Canvas 엔진은 그대로다 |
| 이웃 / 놓기 | motion.css의 grid 전용180ms/easing cubic-bezier(0.2,0.8,0.2,1), 안착140ms 토큰을 사용한다. 잡은 카드에는 지속 tween 지연을 넣지 않는다. 놓은 직후 실제 native 배치는 확정하고 마지막 표시 rect와 확정 rect의 차이만 Web Animations API로 짧게 연결한다. 재조작 시 이전 settle을 취소하며 reduced-motion에서는 실행하지 않는다. spring/overshoot/카드 lift/장식 효과는 없다. popup/hover의 기존120/160/100ms는 유지한다 |
| 실제 표시 / CSS 구분 | PanelLayoutGrid의 입력·pixel 표시·preview 캐시와 gestureMotion.ts가 실제 동작 변경이다. kpiLayout.css의 data-wall-magnet transform/resize dimensions는 pointer 누적과 별개인 표시 전용이다. motionEnabled class 이전의 최초 측정은 animation0이며 active/settling 카드의 native transform transition은 중복하지 않는다. 기존 shadcn Button·Base UI 작업 메뉴를 재사용하며 새 UI primitive는 추가하지 않는다. 핸들의 이중ㄴ자/#a3a3ad·Dark#c9cad1/2px을 유지한다 |
| 벤치마킹 한계 | 제공된 Dynatrace Playground URL을 실제 재방문했으나 이번 실행에서는 Dock/Shell만 표시되고 대시보드 iframe 본문이 비어 있어 같은 조건의 실시간 조작 비교를 완료하지 못했다. 기존 REF-22의 직접 조작 원칙과 실제 Wall의 계단 운동/입력 경로를 기준으로 개선했으며 Dynatrace와 동일 FPS/지연/체감이라고 주장하지 않는다 |

| 검증 | 결과 |
| --- | --- |
| 관련 검사 |5 suites36tests 통과:1px 입력에서 한 열 크기 점프 없이 연속 흡착,40개 입력→프레임당 최신1개, mouseup 전 마지막 위치 flush/commit 순서, dispose 후 잔여 frame 무효화, 기존 교환/Resize 제한/다중 선택·이동/Undo·삽입 이력 보존. 전체 tsc는 기존130개이고 이번 변경 파일 신규 진단0. 변경 파일 ESLint/Prettier·production build(기존 경고2개) 통과 |
| 실제 Light |1715px 검증 탭에서 가동 시간 y386→482(96px) 이동, Undo→386을 확인했다. Resize301×108→332×120px에서 x256/y386 앵커가 유지되고 종료 active0/magnet0/오류0이었다. 서로 다른 폭301/332px의 카드 교환은 가동 시간 x588/vCPU x256으로 같은 줄에서 이뤄졌고 끝없이 아래로 미는 회귀가 없다. 다중28/30 이동도 x256/557의 상대 간격을 유지하고 둘 다 y482에 놓였다 |
| 실제 Dark / 종료 | Dark에서도 같은332×120px Resize/dirty1/종료active0/오류0을 확인했다. 기존 핸들색 rgb(201,202,209)와 grid easing 토큰이 적용됐다. 마지막 전체 취소로 검증 배치를 복원하고 Light/dirty0으로 돌려두었다. 검증용 배치는 서버에 저장하지 않았다. 캡처 motion-resize-dark.png. 입력/조작 정확성 검증이며 프레임 드롭이나 실제60/120fps를 계측했다고 표현하지 않는다 |
| 사용자 상태 / 서버 | 기존 사용자 탭의 미저장 작업은 강제 갱신하지 않는다. 최신 빌드는 미저장0인 별도 확인 탭에 반영하며3317 launchd 서버를 유지한다. 다른 UID/쿼리/단위/데이터/저장 스키마/Copy·Undo 계약은 변경하지 않는다 |

변경 파일: workspace/gestureMotion.ts(신규), gestureMotion.test.ts(신규), PanelLayoutGrid.tsx, kpiLayout.ts, kpiLayout.css, motion.css 및 본 기준표/AGENTS.md.


### REF-60 조작 중 Grid 고정과 같은 프레임 미리보기 (2026-10-29)

| 항목 | 최신 기준 / 검증 |
| --- | --- |
| 사용자 정정 / 원인 | Dot 사이에 패널이 놓이는 표시를 허용하면 안 된다는 요청이다. REF-59의 raw pointer+smoothstep 표시 보간을 대체한다. 이 보간은 논리 저장 좌표가 맞아도 실제 이동·Resize 카드가 두 Grid stop 사이에 표시되게 하므로 제거한다 |
| Grid 표시 고정 | PanelLayoutGrid의 이동 표시 x/y는 snapPanelPosition의 정수48열/12px 조작 stop 결과만 사용한다. 다중 이동도 같은 Grid delta로 위치를 갱신한다. Resize의 x/y/w/h도 snapPanelResize 결과만 사용하며 native/미리보기와 같은 pixel 반올림을 적용한다. 원래 반대 모서리·min/max·충돌·교환·48열/2px 저장 정밀도는 보존한다. 미조작 기존 배치를 일괄 반올림하지 않는다 |
| 미리보기 동기화 | 실제 브라우저 Resize 관찰 중 imperative 크기와 React LayoutFootprint 사이에 한 프레임 차이가 발견됐다. 논리 배치 preview가 달라진 경우에만 작은 overlay의 show를 flushSync로 같은 paint에 확정한다. 같은 Grid stop 안의 입력은 기존 preview를 재사용한다. 패널 데이터/차트 subtree를 새로 구성하거나 engine의 전체 상태를 매번 저장하지 않는다 |
| 유지되는 최적화 | REF-59의 프레임당 최신 입력1개/마지막 mouseup 동기 flush/취소 cleanup·preview 캐시·이웃180ms·놓기140ms·reduced-motion은 유지한다. 실제 조작 중 잡은 카드의 좌표·크기를 easing/보간해 Grid 중간으로 이동시키지 않는다. 손에 잡힌 패널의 Grid 고정이 모션 부드러움보다 우선한다. 새 라이브러리/차트·패널 디자인 변경은 없다 |
| 실제 컴포넌트 / CSS 구분 | 제품 코드는 PanelLayoutGrid.tsx의 실제 표시 좌표/크기와 overlay commit 변경이다. gestureMotion.ts의 magneticPixel과 kpiLayout.ts의 visualCapture 토큰은 제거했다. CSS 배경/Border/핸들·Grid 엔진/Row 모델/저장 계약은 변경하지 않는다. 기존 로컬 shadcn 및 Base UI 메뉴를 재사용하며 새 primitive는 없다 |
| 회귀 검사 | 직접 관련5 suites37tests 통과. 포인터가 Dot 사이에 있어도 실제 held card가0→21px Grid stop에만 표시되는 것, live Resize가253→274px/108→120px의 Grid 크기에만 표시되는 것을 native RGL 컴포넌트에서 확인한다. 다음 React batch 전에 읽는 이벤트 관찰에서도 실제274px와 preview262px(기존 gutter12px)이 같은 프레임에 일치함을 검증한다. 입력 flush/교환/다중 이동/Undo·복사 이력 기존 검사도 통과. ESLint/Prettier·production build 통과(기존 경고2개) |
| 실제 브라우저 |1715px Light 확인 탭에서 작은 Resize 입력(+10,+4px)은301×108px/dirty0을 유지하고, 다음 stop(+24,+13px)은332×120px/dirty1로 바뀌었다. 실제 Resize 중 DOM 관찰에서332×120/preview320×108px과693×156/preview681×144px이 각각 같은 프레임에 일치했다. 기존 gutter12px을 뺀 visible footprint와 실제 Card 크기가 일치하며 임의 보간 크기는 없다. 종료active0/임시magnet0을 확인했다 |
| 원복 / 사용자 작업 | 검증용 Resize는 모두 취소해 원래301×108px/x256/y386·dirty0으로 복원하고 선택도 해제했다. 서버 저장은 하지 않았다. 사용자 기존 탭의 미저장1은 보존하고 최신 빌드는 미저장0 확인 탭에만 반영했다.3317 launchd 서버 health200 유지. 작업 후 정지 캡처는 Resize 완료 화면이며 Dot이 있는 조작 중 동영상으로 표현하지 않는다 |

변경 파일: workspace/PanelLayoutGrid.tsx, gestureMotion.ts, gestureMotion.test.ts, kpiLayout.ts, PanelSelection.test.tsx 및 본 기준표/AGENTS.md. REF-59의 연속 표시/visualCapture 부분만 대체하고 그 외 입력·이웃 모션·원본 데이터/저장 동작은 유지한다.


### REF-61 Dot 경계와 배치 셀·카드 간격 구분 (2026-10-29)

| 항목 | 원인 / 변경 / 검증 |
| --- | --- |
| 실제 원인 | 사용자가 재첨부한 첫 KPI의 좌표는 Grid에 고정됐지만 LayoutFootprint가 w×pitch-gapX / h×rowPitch-gapY의 **카드 크기**로 파란 외곽선을 그렸다. Dot은 간격을 포함한 native 배치 셀 경계를 나타내므로 오른쪽·아래 선이 항상12px 앞, 즉 Dot 사이에 표시됐다. REF-60의 카드/미리보기 가시 크기 일치만 검사한 것은 이 기준 차이를 놓친 검증이었다 |
| 수정 | LayoutFootprint.tsx의 파란 외곽선/빗금은 w×pitch / h×rowPitch의 **전체 배치 셀**에 맞춘다. 카드의 실제 크기는 기존대로 셀에서 gutter를 뺀 값이며 크기 안내에 카드라고 명시한다. aria-label은 Grid 영역과 카드 크기를 구분한다. 간격·카드 실제 크기·Grid 위치·쿼리·JSON·저장/Undo·이동/Resize 계산은 바꾸지 않는다 |
| Dot / 실제 프레임 | 현재 사용 탭1296910978에서 실제 Resize 중 측정했다. Dot pitch30.145833px/세로12px, backgroundPosition -15.0729px -6px이며 origin(0,60), native 셀362×120px와 파란 outline362×120px가 같았다. 카드350×108px와 gutter12px은 그 안에 들어간다. 가로12열 경계361.75px는 기존 native rounding으로362px, 세로60/180px는 Dot에 정확히 맞는다. Dot phase나 실제 셀 좌표가 반 칸 어긋난 것이 아니었다 |
| 관련 검사 |3 suites22tests 통과(held 좌표·Resize·preview 같은 프레임·기존 선택/교환·입력 flush). native RGL 이벤트 안에서 읽는 회귀 검사도 outer274px/preview274×120px로 같으며 실제 카드262×108px 안내는 보존된다. 변경 파일 ESLint/Prettier와 production build 통과(기존 경고2개). 스타일/새 라이브러리/새 편집 엔진은 없다 |
| 실제 사용 화면 | 사용자께서 이전 미저장 작업을 취소하여 현재 탭 dirty0/active0임을 먼저 확인했다. 조사용 Resize는 원복하고 새 빌드를 별도 탭 대신 **현재 사용 중인 탭**에 갱신했다. 실시간 셀/outline 일치를 확인한 뒤 검증 Resize도 취소하여 가동 시간 outer301×108px/x256/y386·25타일·dirty0·active0으로 복원하고 선택을 해제했다. 서버 저장은 하지 않았고3317 health200을 유지한다. grid-cell-boundary-final.png는 검증 후 평상시 화면이며 조작 중 캡처라고 표현하지 않는다 |

변경 파일: workspace/LayoutFootprint.tsx, PanelSelection.test.tsx 및 본 기준표/AGENTS.md. 파란 배치 안내는 간격을 포함한 셀의 외곽선이라는 기준이 REF-46/60의 visible-card 크기 안내 외곽선보다 우선한다. 카드 내부 gutter를 없애거나 모드별 카드 크기를 바꾸는 방식으로 해결하지 않는다.


### REF-62 미리보기와 놓은 뒤 패널의 동일 경계·배치 확정 (2026-10-29)

| 항목 | 원인 / 최신 기준 |
| --- | --- |
| 사용자 요구 / 정정 | 빗금과 파란 선은 놓았을 때 실제 패널이 차지할 위치·크기를 그대로 예측해야 한다. REF-61의 간격 포함 셀 외곽선은 실제 카드보다12px 넓고 높아 이 의미를 깨뜨렸다. **미리보기는 실제 카드 border box**이며, Dot에 맞춰 보이게 하려고 gap을 포함시켜 확장하지 않는다. 카드 간격/원래 배치 자체는 변경하지 않는다 |
| 공통 기하 계산 | panelGeometry.ts의 panelPixelRect가 Grid 위치→실제 패널의 left/top/width/height를 계산한다. LayoutFootprint와 실제 이동/Resize 표시가 같은 함수를 사용한다. 표시 크기는 native outer 셀에서 기존 trailing gutter12px을 뺀 카드 크기다. label/aria-label도 그 실제 패널 크기를 표시한다. Dot은 Grid 배치의 보조 가이드이며 파란 선은 놓은 뒤의 실제 패널 경계라는 기준이 우선한다 |
| 확정 시점 | 기존 stop 콜백은 native mouseup의 새 pointer/container/collision 상태에서 applyMove/applyResize를 다시 실행했다. 이제 rAF 마지막 입력 flush 후 화면에 표시한 gesture.preview 전체 배치를 그대로 검증·확정한다. native Grid items와 해당 item/placeholder도 같은 결과로 맞추므로 release 때 다른 compact 결과가 끼어들지 않는다. 이웃 위치를 포함한 같은 preview 한 건으로 기존 Undo/Redo에 기록한다. 유효하지 않은 preview의 기존 오류/복원 처리는 유지한다 |
| 유지 | 실제6px intent·48열/Grid stop·교환/밀림·다중 선택·기존 query runner·변수/단위/임계치·일괄 저장/취소·reduced-motion·입력 프레임 병합/preview 재사용/이웃 모션을 유지한다. 새로운 차트/편집 엔진·라이브러리는 없다. 변경은 Wall 표시 기하/확정 경로이며 shadcn/Base UI 작업 메뉴와 Card는 기존 것을 재사용한다 |
| 실측 근거 / 진단 | 단일 패널 drop 직전 **렌더된 LayoutFootprint.getBoundingClientRect**를 tile의 data-wall-drop-preview에 한 건만 남긴다. 다음 조작에서 지우는 DOM 전용 진단이며 save model/LocalStorage/서버/계정 상태나 외부 telemetry에 기록하지 않는다. 실제 drop 후에는 outer Grid item 대신 카드 border box인 .wall-workspace-panel의 rect와 비교한다. 다중 선택 hull을 단일 카드로 비교하는 진단은 생성하지 않는다 |

| 검증 | 결과 |
| --- | --- |
| 실제 Light Resize | 놓기 직전 렌더된 미리보기 x256/y386/w350/h132px, 놓은 뒤 실제 카드도 x256/y386/w350/h132px. x/y/w/h 차이 모두0px. 간격 포함 outer 셀을 카드로 잘못 비교하지 않는다 |
| 실제 Light 카드 교환 | 미리보기 x588/y386/w289/h96px, 놓은 뒤 실제 카드도 같은 값이며 네 항목 차이0px. 이웃 교환 동작을 유지한다 |
| 실제 Dark Resize | 미리보기와 실제 카드 모두 x256/y386/w350/h132px, 네 항목 차이0px. 캡처 prediction-matches-panel-dark.png는 drop 후 실제 결과다. 진단값과 실제 rect는 settle 종료 후 비교했다 |
| 회귀 검사 | 직접 관련5 suites39tests 통과. native RGL에서 Resize 후 mouseup 좌표를 의도적으로 다르게 보낸 경우에도 마지막262×108px 미리보기와 같은 카드 크기로 확정되고 Undo가 원복됨을 확인한다. 이동도 마지막 drop y300px 이후 mouseup y610px에 재계산하여 이동하지 않고, 예고한 y300px와 이웃 좌표를 확정한다. 기존 교환/입력 flush/다중 이동/복사 이력 검사도 통과한다 |
| 빌드 / 범위 | 변경 파일 ESLint/Prettier·production build 통과(기존 경고2개), 전체 tsc는 기존130개이고 이번 변경 파일 신규 진단0이다. 다른 UID/데이터/백엔드/저장 스키마는 변경하지 않았다 |
| 실제 사용 화면 |1296910978의 dirty0/active0 확인 후 **현재 사용 탭**에 새 빌드를 반영했다. 조사용 Resize/교환은 모두 취소하고 Light·25타일·dirty0/active0·가동 시간 카드289×96px/x256/y386으로 복원했다. 서버 저장은 수행하지 않고3317 launchd 서버를 유지한다 |

변경 파일: workspace/panelGeometry.ts(신규), LayoutFootprint.tsx, PanelLayoutGrid.tsx, PanelSelection.test.tsx 및 본 기준표/AGENTS.md. REF-61의 셀 전체를 파란 예측 경계로 사용하는 정책을 폐기하며, REF-60의 같은 paint preview/좌표 고정과 기존 실제 카드 간격은 보존한다.


### REF-63 조작 중 키오스크·읽기 전용 전환 취소 (2026-10-30)

| 항목                 | 구현 / 검증                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 원인              | 실제 Drag/Resize 중 readOnly가 true로 바뀌면 핸들 권한만 바뀌고 진행 중 native gesture·Grid·footprint가 남았다. 키오스크/권한 전환이 drop으로 처리되거나 차트 입력 차단이 남을 수 있는 상태였다. 수정 전 native RGL 회귀 테스트에서 data-interacting=true·resize marker·footprint 잔류를 재현했다                                                                                   |
| 수정                 | PanelLayoutGrid의 readOnly 전환 effect가 기존 abortGesture를 호출한다. pending input/rAF/임시 표시를 제거하고 native Grid를 현재 draft로 재구성한다. 진행 중 한 조작만 취소하며 이전 완료 작업과 미저장 draft/Undo는 유지한다. UI 정책 전환을 배치 변경/저장으로 취급하지 않는다                                                                                                    |
| 범위 / 실제 컴포넌트 | 기존05번 Workspace의 공통 PanelLayoutGrid/useEffect·abort 경로만 사용한다. shadcn/Base UI primitive·CSS·새 라이브러리·새 엔진·다른 UID·데이터·쿼리·저장 모델 변경은 없다. REF-62의 실제 카드 미리보기/last preview 확정은 유지한다                                                                                                                                                  |
| 검증                 | 수정 전 신규 테스트1개 실패로 재현, 수정 후 관련3 suites16tests 통과. 이전 완료 이동→진행 중 Resize→readOnly→일반 모드 복귀에서 Grid/표시/Resize 핸들이 제거되고 이전 이동/원래 크기는 남으며 Undo가 그 이동 한 건만 복원한다. ESLint/Prettier 통과. 네이티브 Grid 컴포넌트 테스트이며 실제 브라우저에서 버튼을 누른 채 키오스크를 전환하는 동시 입력 실사를 했다고 표현하지 않는다 |
| 자율 실행 / 보존     | 기존 사용자의 staged/unstaged 작업을 건드리지 않도록 로컬 WIP snapshot 기반 별도 관리 Worktree/개발 브랜치에서 수정·커밋한다. 기존 원본 index를 유지하고 원본 파일이 snapshot과 같을 때만 검증된 변경을 반영한다. 상세 커밋/실행 결과는 docs/WALL_AUTODEV_PROGRESS.md에 기록한다                                                                                                    |

변경 파일: workspace/PanelLayoutGrid.tsx, PanelSelection.test.tsx 및 본 기준표/AGENTS.md. 저장/취소/48열/직접 조작의 기존 기준은 유지한다.
### REF-64 Wall 패널 편집 Workspace (2026-10-30)

| 항목             | 구현 / 검증 기준                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 범위             | 05번 UID의 native PanelEditor에만 Wall 프레임을 적용한다. 별도 편집 모델을 만들지 않고 다른 UID는 기존 DOM/Tab/VisualizationButton을 유지한다. 대시보드 배치와 차트 스타일은 변경하지 않는다                                                                                                                                                                                                                                           |
| 실제 컴포넌트    | editor/WallPanelEditor.tsx의 Frame·Preview·Options·DataTabs·VisualizationButton. 로컬 shadcn Card는 components/ui/card.tsx의 HTML composition이며 Base UI Card가 아니다. Tabs는 components/ui/tabs.tsx → @base-ui/react/tabs, Button은 ui.tsx → @base-ui/react/button을 실제 사용한다. 설치된 Base UI 1.0.0 / React 18.2.0을 유지한다                                                                                                  |
| 디자인 참조      | 새로운 외부 디자인을 가져오지 않고 기존 REF-22/47/50의 정보 위계·Soft Depth·컴팩트한 조작을 편집 작업 공간에 적용한다. 기존 typography.ts·surfaceTokens.ts의 폰트/간격/8px 표면과 headerHeight를 재사용한다. panelEditor.css는 이 프레임의 표면/영역 배치만 담당한다                                                                                                                                                                   |
| 네이티브 기능    | Query·Transform·Alert 탭의 실제 모델/개수/URL sync, 쿼리 및 변환 편집기, 시각화 선택/옵션 검색/Field Options/Overrides를 그대로 렌더링한다. 테이블 미리보기와 시각화 선택은 기존 핸들러에 연결한다. 상단 저장/취소/라이브러리 권한 액션은 native NavToolbarActions를 유지한다. 이 버튼과 모든 플러그인 폼까지 Wall로 전면 재구현했다고 표현하지 않는다                                                                                 |
| 테마 원인 / 수정 | Grafana Monaco 테마가 mount 당시 색으로 등록되고 활성 테마가 남아 Light→Dark에서 흰 배경 또는 검은 문자가 나타났다. 이 Wall 프레임에서만 native Monaco/theme 정의 함수와 editor.setTheme를 재사용해 현재 테마를 동기화한다. 코드 편집기를 remount하거나 쿼리 버퍼/모델을 변경하지 않는다                                                                                                                                               |
| 검증             | native 편집/옵션/쿼리 관련 36 tests 통과. 새 통합 검사는 Base UI 클릭·방향키+Enter→native 탭/URL 상태, URL→탭, 비대상 native fallback, 테마 전환 중 편집 DOM/미저장 버퍼 유지를 검증한다. 실제 브라우저에서 미리보기 전체 폭·테이블 전환·Transform URL·옵션 검색·시각화 선택기·제목 변경/취소·이동 draft의 편집기 왕복을 확인했다. Dark 코드 배경 rgb(17,18,23)/기본 문자 rgb(212,212,212), Light 흰 배경/검은 문자 및 폰트 ready 확인 |

변경 파일: editor/WallPanelEditor.tsx·panelEditor.css·WallPanelEditor.test.tsx, native PanelEditorRenderer/PanelEditControls/PanelOptionsPane 및 PanelDataPane/3개 탭 헤더, surfaceTokens.ts. 실제 저장/변환/쿼리 처리 로직은 변경하지 않는다.
### REF-65 네이티브 삭제와 Wall 메타데이터 정리 (2026-10-30)

| 항목        | 원인 / 수정 / 검증                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 재현        | 실제 탭 간 붙여넣기→Resize→저장→새로고침→삭제→저장에서 native 패널은 없어졌지만 wallModern.layouts의 삭제 ID와 panelSources 매핑이 남았다. 네이티브 새 ID가 재사용될 때 잘못된 표시 유형을 이어받을 수 있었다                                                                                                                                                                                                                                           |
| 수정        | 05번 DashboardScene.removePanel에서 기존 native 삭제 후 removeWallPanel을 호출한다. 삭제한 ID의 배치와 매핑만 제거하고 다른 패널 좌표·표시 원본 ID 값·텍스트는 보존한다. 다른 UID의 삭제는 기존 동작 그대로다. native 전체 취소는 패널과 Wall 메타데이터를 함께 복원한다                                                                                                                                                                                |
| 실제 검증   | 테스트 패널252를 네트워크에 붙여넣고 Resize한 뒤 버전27 저장/새로고침에서 새 ID와354×116px 카드 크기를 확인했다. drop 직전 예측 rect와 실제 카드 x/y/w/h가 동일했다. 수정 전 삭제 저장28에는 메타데이터252가 남았고, 수정 후 실제 삭제 저장29에서는 모든 layouts와 panelSources에서252가 제거됐다. 네이티브 버전26 복원으로 검증 전 구성까지 되돌렸고, 최종 버전30의 JSON은 원본과 version 외 모두 동일하다. 운영 환경이 아닌3317 로컬 fixture 검증이다 |
| 회귀 / 범위 | native serialize→remove→cancel 검사에서 다른 배치/텍스트 보존·매핑 제거·패널 복원을 확인하며 비대상 UID의 메타데이터는 변경하지 않는다. CSS·shadcn/Base UI·쿼리·48열 계산·저장 API/버전 구현 변경은 없다                                                                                                                                                                                                                                                |

변경 파일: DashboardScene.tsx, workspace/wallDocument.ts·wallDocument.test.ts. 이 삭제 정리는 새 복제/그룹/편집 기능 추가가 아니다.
### REF-66 데이터 도착 후 기본 높이와 정보 카드 밀도 (2026-10-30)

| 항목      | 원인 / 구현 / 검증                                                                                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 원인      | 첫 Grid 측정 때 데이터가 아직 없으면 WallEditingProvider가 큰 초기 높이를 defaults에 고정했다. 후속 Filesystem/Entity의 onHeight가 바뀌어도 같은 지역의 기본 배치가 갱신되지 않았다. records는 행당60px 추정으로 NIC/PG의 마지막 행에 불필요한 내부 스크롤이 생겼다                         |
| 기본 배치 | 저장된 서버 배치·이전 로컬 배치·현재 draft·Undo/Redo baseline·진행 중 gesture가 없는 **미조작 기본값만** 최신 콘텐츠 높이를 반영한다. 이 과정은 Dirty/서버 저장을 만들지 않는다. 저장/수동 Resize한 크기를 데이터 갱신 때문에 덮어쓰지 않는다                                               |
| 정보 카드 | 기존 WallEntityList의 내용 wrapper에 ResizeObserver를 연결하여 실제 scrollHeight에 공통 headerHeight/padding을 더한다. 기존150~560px 한도와 큰 목록의 내부 스크롤은 유지한다. 행의 수치·필드·순서·DataLink/정렬은 그대로다. 신규 primitive/엔진/CSS 변경 없이 기존 Wall 컴포넌트를 수정했다 |
| 실제 화면 | 로컬 fixture의 파일시스템2행 카드는318→190px, NIC2행 카드246px, Glue PG3행 카드312px이다. NIC 내부 clientHeight/scrollHeight=170/170, PG=236/236으로 마지막 eth1/osd.2·PG96까지 보인다. Light/Dark에서 확인했으며 사용자 저장 배치는 강제로 줄이거나 늘리지 않았다                          |
| 회귀      | untouched/server/legacy/draft4개 조건의 높이 baseline 보존 검사 통과. records 실측 높이 검사 및 기존 모든 field/단위/링크/상태 검사17개 통과. 변경된 폰트/화면폭의 자연스러운 줄바꿈도 내용 observer로 측정한다                                                                             |

변경 파일: workspace/WallEditContext.tsx·WallEditContext.test.tsx, visualizations/WallPanelContent.tsx·WallPanelContent.test.tsx. 48열 좌표 계산·수동 배치·데이터 의미는 유지한다.
### REF-67 본문 스크롤과 고정 Wall Shell (2026-10-30)

| 항목          | 구현 / 검증                                                                                                                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 원인          | native NativeScrollbar는 wrapper 없이 documentElement를 스크롤하는 shim이었다. 긴 네트워크/스토리지 탭에서 전체 Wall Shell이 페이지 위로 밀려 사이드바와 공통 헤더까지 사라졌다                                                                                                                    |
| 적용          | NativeScrollbar에 명시적 scrollContainer opt-in만 추가한다. 기본 호출은 기존 document 스크롤/DOM을 그대로 유지한다. DashboardSceneRenderer의 승인된05번 Workspace에서만 bounded div를 사용하고 같은 요소를 native onSetScrollRef에 연결한다. Wall Shell의 overflow도 해당 UID에만 제한한다         |
| 기능 보존     | 기존 native scrollTo의 높이 대기/재시도와 dashboard remember/restoreScrollPos를 재사용한다. 스크롤 때문에48열 배치·Dirty·쿼리·그리드 엔진·패널 높이를 저장하지 않는다. native PanelEditor/다른 UID의 스크롤 정책은 변경하지 않는다                                                                 |
| 실제 브라우저 | 1730×873px에서 document 높이873/scrollY0, 본문 top68/height805이며 사이드바 top0/height873이다. 하단 패널 메뉴→native 편집기→복귀에서 본문 scrollTop743→743·사이드바 top0을 확인했다. 최종 키오스크 전후 모든 카드의 transform/width/height가 동일하며 핸들/설정0, ESC 복귀와 공유 보존을 확인했다 |
| 검사          | 기존 caller의 wrapper 없는 DOM/document ref 및 opt-in 컨테이너의 scrollTop/scrollTo 회귀2개 통과. 공통 기능 관련13 suites112tests 및 표시 컴포넌트17tests가 통과했다. production build 성공(기존 경고2개). 새 UI/애니메이션 라이브러리는 없다                                                      |

변경 파일: core/components/NativeScrollbar.tsx·NativeScrollbar.test.tsx, DashboardSceneRenderer.tsx, modern.css. CSS 부분은 UID 한정 overflow 처리이고 실제 스크롤 소유권/복원은 opt-in 컴포넌트 변경이다.
## REF-68 — 편집·설정 Workspace의 실제 UI 교체 (2026-10-31)

사용자가 이전의 외곽 프레임 중심 변경과 90점 평가를 수용하지 않았다. 기능 검사 결과를 시각적 완성도로 간주하지 않는다. 이번 변경은 UID `aec03x1adsi68f`에 한정하며, REF-50/52/58/60/62의 A-Hybrid·직접 조작·48열·저장·Quick 액션 정책을 되돌리지 않는다.

| 대상           | 실제 표시 구조·컴포넌트 변경                                                                                                                                                                                             | 재사용하는 native 기능 / CSS만 변경한 부분                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 디자인 참조    | 기존 REF-22의 제품별 역할, REF-47의 Soft Depth, REF-50의 A-Hybrid를 따른다. 새 외부 템플릿을 복제하거나 새로운 디자인 체계를 추가하지 않았다                                                                             | `surfaceTokens.ts`, `typography.ts`, 기존 Wall local shadcn 소스와 설치된 `@base-ui/react` **1.0.0** 사용                                                                               |
| 편집 상단      | `PanelEditorRenderer`에서 native AppChrome 작업 바를 장착하지 않고 Wall 헤더에 뒤로·취소·저장/복사본 저장 액션을 통합한다. `WallDashboardToolbar`의 `analysisOnly` 구성으로 변수·시간·갱신을 재사용한다                  | 기존 `PanelEditor.onDiscard`, library save/unlink, `DashboardScene.openSaveDrawer`, native URL/권한 필터. 일반 대시보드 Toolbar 구성은 변경하지 않음                                    |
| 옵션 탐색      | `WallOptionNavigator`의 패널·시각화·필드·재정의 4영역과 검색으로 나눈다. 실제 `../components/ui/tabs` → `@base-ui/react/tabs`, `OptionsPaneCategory`의 opt-in → `@base-ui/react/collapsible` **Root/Trigger/Panel** 사용 | native 옵션 descriptor·custom render·필드/Override callback·검색 결과·showCategory URL·기존 펼침 상태 유지. custom field 속성은 시각화 영역, 표준 필드 속성은 필드 영역으로 분류        |
| 쿼리 작업부    | `QueryOperationRowHeader/Action`의 Wall opt-in 헤더·실제 Base UI Button, datasource/options/inspector 작업 바·쿼리/표현식 추가 footer를 별도 구조로 렌더한다                                                             | native query runner·datasource picker·plugin Builder/Code·Monaco·query copy/hide/delete·기존 DnD props와 callbacks. 입력 테두리·여백·중립 Surface는 scoped CSS                          |
| 설정 Workspace | `WallSettingsContext`에서 native `Page`의 헤더/가로 탭 대신 왼쪽 탐색·스크롤 본문·공통 작업 헤더를 실제 렌더한다. native nav 모델의 URL·active·권한 필터를 재사용한다                                                    | 일반·주석·변수·링크·버전·권한·JSON 경로와 React Router 이동 보존. 다른 UID는 원래 Page/Toolbar/옵션/쿼리 DOM 유지                                                                       |
| 일반 설정      | `WallGeneralSettings`의 정보·시간·조회 경험·편집 정책 영역, 실제 `@base-ui/react/input`, `@base-ui/react/switch` Root/Thumb, local Tabs/Buttons, 중립 태그 입력/칩                                                       | native title/description/tags/folder/time/refresh/tooltip/live/preload/editable callbacks·시간 검증·폴더/시간대/요일 picker·삭제 확인. 태그 추가/제거/중복 방지 의미 유지               |
| 변수 목록·편집 | `WallSettingsCollection` 목록/행으로 table을 대체한다. 기존 DnD와 modal을 그대로 연결한다. 일반 정보와 쿼리 영역을 분리하고 `VariableTextField/Area/Legend`의 Wall 분기에서 실제 입력/제목 구조를 교체한다               | 원래 변수 이름/타입/정의·순서·검증·편집·복제·삭제 확인·종속성·변수별 native 편집기 유지. 다중 값/All/쿼리 옵션을 새 엔진으로 구현하지 않음                                              |
| 주석·링크      | 같은 collection 컴포넌트로 제목/설명·행·추가/순서/복제 액션을 정리한다                                                                                                                                                   | 원래 datasource 이름·built-in 구분·순서·삭제 확인·edit callback 보존                                                                                                                    |
| 버전           | `WallVersionHistory`에서 실제 table/selection/restore 작업을 새 구조로 렌더하고 native 비교·복원 modal에 연결한다. 줄무늬/보라색 Latest 태그 대신 단색 Surface와 중립 현재 버전 badge 사용                               | 원래 version ID·날짜·작성자·message·두 버전 비교 제한·pagination·복원 확인/실행 유지                                                                                                    |
| JSON·권한      | JSON 영역의 실제 높이 컨테이너와 Wall 적용/저장 버튼, 공유 `useWallMonacoTheme`의 테마 동기화. native Permissions는 새 설정 탐색 안에서 유지한다                                                                         | JSON parse/save/version/conflict와 native Monaco, 권한 API/모델 자체는 재구현하지 않음. JSON 5px 축소를 수정하고 실제 407px/23행 표시 확인. 권한 변경/새 JSON 저장 검증은 실행하지 않음 |
| 상태·취소      | 05번 최초 `onEnterEditMode` baseline에서도 overlay/editPanel/editview를 제외한다. 기존 저장 성공 baseline과 같은 계약                                                                                                    | 설정 URL에서 최초 진입 후 취소하면 이전 설정 화면이 되살아나는 문제 수정. native 확인·URL 정리·쿼리/배치/저장 모델은 유지                                                               |

새 Card/Section 패키지를 설치하거나 Base UI에 Card가 있다고 표현하지 않는다. 구조 교체와 scoped CSS 마감을 구분한다. 데이터소스별 쿼리/Transform/표준 필드의 전문 편집기는 의도적으로 native를 재사용하며, 이 영역까지 전부 Wall 컴포넌트로 교체했다고 보고하지 않는다.

실제 검증·남은 제약·스크린샷·커밋은 `docs/WALL_AUTODEV_PROGRESS.md`의 2026-10-31 기록을 따른다. 다른 UID·그래프 스타일·Grid 엔진·데이터/59개 패널·JSON 저장 내용은 이번 변경 대상이 아니다.
## REF-69 — 편집 컨트롤의 접근성·선택 상태 안정화 (2026-10-31)

| 항목          | 확인 / 변경                                                                                                                                                                                                                                                                     | 보존 범위                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 옵션 탐색     | 기존 옵션 탭은 실제 브라우저에서 `aria-controls`가 없고 option tabpanel도 0개였다. 로컬 `components/ui/tabs`의 **TabsContent → @base-ui/react/tabs Panel**을 사용해 실제 tab/tabpanel의 ID·aria-controls·aria-labelledby를 연결한다                                             | 동일 4개 영역·표시 설정·native descriptor·검색 결과·접기와 액션. 선택 영역만 native editor를 렌더하며 다른 UID는 기존 경로 유지                           |
| 없는 영역     | mounted navigator의 현재 그룹이 없어지면 첫 사용 가능한 영역을 표시한다. 기존 native 값/설정을 변경하는 effect 없이 표시 선택만 계산한다                                                                                                                                        | 그룹 제거는 props 변경 fixture에서 검증했다. native 시각화 선택기는 옵션 pane을 재마운트하므로 그 경로에서 빈 화면이 실제 발생했다고 확대 해석하지 않는다 |
| 설정 선택     | 일반 설정의 툴팁 동기화/편집 허용 여부는 화면 전환이 아닌 값 선택이다. private Choice를 실제 **@base-ui/react/radio-group RadioGroup + @base-ui/react/radio Root** (설치된1.0.0)로 바꾼다. 숫자/boolean 값을 문자열로 저장하지 않고 원래 타입 그대로 native callback에 전달한다 | 같은 항목/순서/선택값과 native tooltip/editable 처리. 기존 segmented Surface·높이38px·토큰을 재사용하고 focus-visible만 기존 primary 토큰으로 표시        |
| 접근성 / 입력 | 옵션은 Arrow로 초점 이동 후 Enter 선택, 설정 Radio는 Arrow로 선택한다. 실제 보조 input은 aria-hidden=true이며 중복 관리 컨트롤로 노출하지 않는다                                                                                                                                | 검색·입력·차트·Grid 및 저장 모델을 변경하지 않는다. CSS 변경은 Choice 클래스/checked/focus selector의 기존 스타일 이관뿐                                  |
| 검사          | 관련3 suites9 tests 기본 Jest 통과. native 값 타입·선택값·영역 제거 fallback·tabpanel 연결·검색·Override 액션/접기와 편집기 기존 동작 포함. production build 성공(기존 경고2개), 변경 strict 신규 진단0                                                                         | 전체 회귀/전체 tsc 반복은 하지 않았다. 실제 로컬 fixture 브라우저에서 확인하며 실제 SCVM·계정 권한 검증과 구분한다                                        |

변경 파일은 WallOptionNavigator(.tsx/.test.tsx), WallGeneralSettings(.tsx/.test.tsx), management.css다. 새 라이브러리·레이아웃 기능·데이터 변경 없이 REF-68의 구성과 REF-62의 배치 계약을 유지한다.
