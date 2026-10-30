# ABLESTACK Wall Modern Lite

Grafana 11.4.0-pre의 기존 기능을 사용하는 프런트엔드 시범 구현입니다.
Grafana 버전, 백엔드, 배포 설정 및 운영 DB는 변경하지 않습니다.

디자인 참조·실제 컴포넌트 import·CSS 조정·검증 이력은
[디자인·컴포넌트 기준표](./DESIGN_SYSTEM.md)에서 관리합니다. 후속 UI 변경 전 이 표를 읽고 변경 후 갱신합니다.

현재 `05. 스토리지센터 가상머신 상세 현황`에는 기존 Row 대신 Wall 전용 Dashboard Workspace를
적용합니다. 실제 Base UI Tabs, shadcn 로컬 Card, Wall Section 구성으로 기존 59개 패널을 재사용하며,
저장 모델을 재배치하지 않습니다. 다른 대시보드의 화면 구조는 변경하지 않습니다.

## 구조와 적용 범위

- `WallChrome.tsx`: `/dashboards`, 폴더 목록, `/d/:uid`에 적용하는 Wall 셸.
- `WallDashboardLibrary.tsx`: 기존 Search API 결과를 사용하는 검색·분류·즐겨찾기·카드/목록 화면.
- `useWallDashboards.ts`: 검색 페이지네이션, 성공 후 즐겨찾기 반영, 기존 서비스와 상태 동기화.
- `WallDashboardHeading.tsx`: 기존 DashboardPage와 DashboardSceneRenderer가 함께 쓰는 제목 영역.
- `ui.tsx`: shadcn/ui의 로컬 컴포넌트 구성 방식을 사용하는 Base UI Button, CVA, cn, Card.
- `modern.css`: Light/Dark 의미 토큰, Wall 영역의 패널 제목·메뉴·범례 스타일.
- `visualization.ts`: 캔버스와 포털 툴팁에서 함께 사용하는 Wall 시각화 토큰.
- `chartTokens.ts`: UID `aec03x1adsi68f`의 Time series 전용 Light/Dark 팔레트·선·영역·축·범례·툴팁 토큰.
- `timeSeriesPresentation.ts`: native 프레임의 표현 복사본만 생성. 명시 색상/override·임계치·단위·결측·쿼리와 원래 데이터 벡터를 보존하며 Grafana/uPlot 엔진을 재사용.
- `toolbar/WallDashboardToolbar.tsx`, `WallTimeRangeControl.tsx`: 대표 UID의 Workspace에만 적용하는 통합 도구 모음. 로컬 shadcn Button/Popover와 Base UI Menu를 사용하며 기존 Scene 시간/갱신/변수 및 공유·편집 동작에 연결합니다.
- 최신 Toolbar 외형은 `DESIGN_SYSTEM.md` REF-09의 밀도·구조를 참고하되, REF-10의 복제 금지 및 REF-11의 동적 변수 표현 원칙을 따릅니다. 2단 Card 대신 42px 바/32px 컨트롤을 사용하며, `WallScopeControl.tsx`는 기존 variableControls의 추가·삭제에 대응합니다. REF-12 `WallVariableControl.tsx`는 선택형 변수의 통합 shadcn Button/Popover 트리거를 구성하고 내부 선택·URL 동기화는 native 입력기를 재사용합니다. 다른 변수 타입은 기존 입력을 유지합니다. 시간 고급 설정은 native 입력·시간대·이력을 보존합니다.
- 실선 Line의 `linePixelAlign: false`는 uPlot의 정수 스냅만 해제합니다. 선 보간·실제 결측·Canvas 배율을 강제로 바꾸지 않습니다.
- `tailwind.config.cjs`: `wl-` 접두사 및 Preflight 비활성화로 Grafana CSS와 충돌 방지.

Base UI 1.0.0은 React 18과 호환됩니다. 기존 date-fns 3.6.0을 유지하기 위해
date-fns 4 peer dependency가 있는 Base UI 1.9.0 대신 1.0.0을 고정했습니다.
Tailwind 3.4.17은 전용 CSS에만 독립 PostCSS 규칙으로 적용합니다.
전체 Grafana의 Sass/Emotion 빌드 방식은 유지합니다.

shadcn/ui는 런타임 UI 패키지를 별도 설치하는 방식이 아니라 로컬 컴포넌트 소스로 관리합니다.
참고: https://ui.shadcn.com/docs/installation/manual
Base UI: https://base-ui.com/react/overview/quick-start

## 기존 기능 보존

- 패널 renderer, gridPos, query, transformation, variable, 시간 및 자동 새로고침 로직은 재사용합니다.
- 대시보드 JSON, UID, 데이터소스, 경보, 사용자 또는 인증 설정을 변경하지 않습니다.
- 관리 Drawer는 기존 BrowseDashboardsPage의 폴더 생성·권한·이동·삭제 도구를 재사용합니다.
- Search API가 반환한 조직/권한 범위만 표시합니다. 분류는 화면 전용이며 저장하지 않습니다.
- 즐겨찾기는 기존 DashboardSrv를 사용하고, 두 원래 렌더러에서 변경한 결과도 이벤트로 동기화합니다.
- 서버 URL의 appSubUrl을 제거한 뒤 React Router에 전달하여 서브 경로 배포를 지원합니다.
- 편집·전체 화면·kiosk URL 전환 때 셸의 부모를 교체하지 않아 대시보드를 재마운트하지 않습니다.
- 명시적인 kiosk에서는 셸 내비게이션을 숨겨 기존 임베딩 용도를 보존합니다.
- 기존 CommandPalette와 이전 화면 복귀 동작을 보존합니다.

## Netdive·Mold 디자인 정합성

Netdive의 `AppStyles.ts`, `NetdiveAntdProvider.tsx` 및 Mold의 `tokens.less`를 확인했습니다.
기본 포인트 색상 `#1677ff`, 밝은 표면, 푸른 회색 경계선, 작은 둥근 모서리,
의미별 색상 토큰을 맞췄습니다. `assets/ablestack-mark.png`는 현재 Netdive에서
사용하는 ABLESTACK 이미지의 복사본입니다. Netdive 소스 자체는 수정하지 않았습니다.
제품 간 토큰이 자동으로 동기화되는 공통 패키지는 아직 없습니다.

## 검증과 실행

```sh
yarn build
yarn jest public/app/features/wall-modern \
  public/app/features/dashboard/containers/DashboardPageProxy.test.tsx \
  public/app/features/dashboard-scene/scene/DashboardSceneRenderer.test.tsx --runInBand
```

로컬 화면 검증은 기존 Go 소스를 별도 임시 바이너리로 빌드해 진행했습니다.
저장소의 HCI DB를 `/tmp/wall-modern-lite-runtime/data/grafana.db`로 복제했고,
데이터소스 주소를 복제본에서만 loopback으로 변경했습니다.
화면의 모니터링 수치는 격리된 HTTP fixture 응답이며 실제 운영 수치가 아닙니다.
실행 설정도 `/tmp`에 한정되며 운영 프로토콜·포트·배포 설정과 무관합니다.
처음 시도한 공식 11.4.0 바이너리는 이 저장소의 CSSFiles HTML 템플릿과 맞지 않아,
최종 화면 검증에는 저장소 소스에서 빌드한 런타임을 사용했습니다.

## 제한과 후속 검증

- 기존 종합 대시보드의 23개 패널 및 24열 배치를 보존하므로 참고 이미지의
  5개 KPI/재배치된 차트 구조를 그대로 복제하지 않습니다. 패널 재배치는 별도 결정이 필요합니다.
- 실제 고객 환경의 SSO, 권한 계정별 동작, 실시간 데이터 및 Mold iframe 통합은 아직 검증하지 않았습니다.
- 작은 화면용 CSS와 메뉴 동작은 추가했지만 실제 모바일 브라우저 검증은 추가로 필요합니다.
- 전체 TypeScript 검사는 기존 React 타입 중복 문제 등으로 실패합니다.
  수정 전 소스도 동일 의존성에서 검사해 신규 오류와 구분했습니다.
- 기존 AppChrome 테스트의 `Go to home` 접근성 이름 기대 실패는 수정 전 소스에서도 재현했습니다.
  관련 없는 기존 테스트나 React 의존성을 억지로 변경하지 않았습니다.
- 초기 구현 이후 새 Grafana 기능을 추가할 경우, 기존 관리 도구와의 접근 경로도 함께 점검해야 합니다.

## 1차 검증 결과

- 정식 `yarn build` 성공: Grafana 및 의존 작업 12개 완료. 번들 크기 권고 경고는 남아 있습니다.
- 신규 UI와 DashboardPageProxy/DashboardSceneRenderer 관련 38개 테스트 통과.
- 수정 파일 ESLint 및 `git diff --check` 통과.
- 전체 타입 검사에는 기존 오류가 남아 있지만 수정 전 소스 대비 새로운 진단 유형은 없습니다.
- 실제 브라우저에서 이름 검색, 관리 Drawer의 기존 폴더 목록, Light/Dark 표시,
  시간 범위 `now-6h`, 새로고침 `1m`의 URL 반영을 확인했습니다.
- Scenes와 기존 렌더러에서 모두 패널을 표시했습니다. 기존 렌더러에서는 격리한 MySQL
  데이터소스로 인한 변수 조회 실패가 표시되며, 운영 MySQL 연동 성공을 의미하지 않습니다.
- 검증 화면의 수치는 로컬 fixture입니다. 경보 발송을 막기 위해 임시 런타임의 평가 기능은 껐습니다.
- 좁은 상단 KPI 카드의 제목은 기존 패널 크기에 따른 결과이며 이번 시각화 개선 범위에서 제외했습니다.

## 시각화 내부 개선

기존 TimeSeries는 uPlot, Gauge는 Flot gauge, Stat은 BigValue와 Sparkline을 사용합니다.
캔버스의 선·채움·축·게이지 두께는 CSS만으로 바뀌지 않으므로 기존 렌더러에
선택적인 `VizPresentationContext`를 연결했습니다. Wall의 일반 대시보드 화면에서만
제공하며 편집·전체 화면·kiosk에서는 제공하지 않습니다. Provider가 없는 경우 기존
렌더링 경로를 유지합니다. 별도 패널 구현이나 대시보드 JSON 마이그레이션은 없습니다.

| 수정 지점 | 표현 변경 및 보존 범위 |
| --- | --- |
| `packages/grafana-ui/src/components/VizPresentation/VizPresentation.ts` | 공통 표현 계약, 복사본을 사용하는 선/채움 조정, 글자 대비 보정 |
| `public/app/core/components/TimeSeries/{TimeSeries.tsx,utils.ts}` | 일반 선의 두께, 옅은 opacity gradient, 축 서체·그리드 색상. 단위·축 범위·보간·null·시리즈 색상·숨김 및 stacking 유지 |
| `packages/grafana-ui/src/components/uPlot/config/UPlotAxisBuilder.ts` | 선택적인 축 글자 크기와 그리드 색상 전달. 기본값 유지 |
| `packages/grafana-ui/src/components/uPlot/plugins/TooltipPlugin2.tsx` | 기존 툴팁 포털의 Wall 서체·경계·그림자. 고정·닫기·데이터 링크·주석·확대 로직 재사용 |
| `packages/grafana-ui/src/components/Gauge/Gauge.tsx` | 얇은 게이지/임계값 띠, 배경 트랙·수치 서체. min/max·중립점·백분율·임계값·라벨·링크 유지 |
| `packages/grafana-ui/src/components/BigValue/{BigValue.tsx,BigValueLayout.tsx}` | 자동 글자 크기의 상한, 숫자 정렬·굵기, 기존 Sparkline 표현. 매핑·단위·상태색 의미·정렬·명시적 글자 크기 유지 |
| `packages/grafana-ui/src/components/VizLegend/VizLegend.tsx` | 안정적인 Wall 스타일 클래스. 기존 table/list·계산 열·정렬·시리즈 선택·색상 선택 재사용 |

Stacking과 Hue/Scheme 그라데이션은 색과 면적이 데이터 의미를 표현하므로 원래
채움 설정을 유지합니다. 숨겨진 선(`lineWidth: 0`), 막대·점, 보간·변환 설정도 유지합니다.
수치 텍스트만 표면과의 대비를 최소 4.5:1로 보정합니다. 중립적인 검정/흰색은
테마 전경색으로, 상태색은 같은 색조로 명도를 조정하며 원래 색상 매핑을 수정하지 않습니다.

### 시각화 검증

- 프로덕션 `yarn build` 성공. 새 런타임 라이브러리나 백엔드 변경 없음.
- 관련 11개 Jest suite, 81개 테스트 및 8개 snapshot 통과(`visualization.test.tsx` 포함).
- Chrome **1681 × 1206**에서 01. 종합 대시보드 확인. 23개 패널의 위치·너비·높이를
  DOM으로 변경 전후 비교해 동일함을 확인했습니다.
- Scenes와 `scenes=false` 기존 렌더러에서 각각 23개 패널 표시를 확인했습니다.
- Light/Dark 캔버스, 중립 Stat 대비, 툴팁 고정/닫기, 범례의 개별 시리즈 선택/복원을 확인했습니다.
- 원본 Monitor DB의 SHA-256 동일 여부를 확인했습니다. 로컬 실행은 복제 DB와 fixture이며
  운영 데이터 정확성, 실제 MySQL/Mold/SSO 연결 성공을 의미하지 않습니다.
- 전체 TypeScript 진단은 수정 전/후 같은 의존성에서 각각 130개이며 신규 진단은 없습니다.
  기존 React 타입 중복은 이 UI 작업에서 강제로 의존성을 교체하지 않고 별도 문제로 유지합니다.

개요의 패널 표시 계층은 `workspace/overviewPresentation.tsx` / `overview.css`에서 관리합니다.
공통 Header/Menu 슬롯 및 Gauge HTML readout은 개요 21개에만 공급하며, 다른 탭은 기존 렌더러를 유지합니다.
디자인·컴포넌트 경계와 검증은 DESIGN_SYSTEM.md REF-13을 따릅니다.

05번의 글꼴과 역할별 크기·굵기·행간은 `typography.ts`에서 관리합니다. `typography.css`는
그 토큰으로 HTML에 적용하고, 차트/Stat/Gauge 어댑터도 같은 값을 사용합니다.
자체 호스팅 폰트와 라이선스·출처는 `public/fonts/wall/`에 있으며 상세 기준은 DESIGN_SYSTEM.md REF-14입니다.

05번의 5개 탭에 대한 최신 데이터 표시 기준은 `visualizations/PANEL_INVENTORY.md`와
DESIGN_SYSTEM.md REF-15입니다. 비시계열 24개의 표시 본문을 WallPanelContent로 교체하며,
시계열 35개 및 native 편집/전체 화면/검사 기능은 유지합니다. 저장된 패널 타입과 쿼리는 변경하지 않습니다.
