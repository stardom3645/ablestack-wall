# Wall Stat 디자인 및 상태 표현 검토 — REF-142

검증일: 2026-11-06. 전체 Wall의 공통 Stat 표시 경로를 대상으로 한다. 기존 대시보드·패널 모델·쿼리·Reduction·단위·Threshold·Override·외곽 Grid 좌표는 보존한다. 공통 기준표는 `public/app/features/wall-modern/DESIGN_SYSTEM.md` REF-142다.

## 원인과 수정

| 항목                     | 실제 원인                                                                                                                                                                                                                                                                                | 수정 및 보존                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 대시보드/미리보기 불일치 | WallChrome은 편집 경로에서 StatCardPresentationContext를 제공하지 않는다. 편집기는 OverviewPanelPresentation의 VizPresentationContext만 사용하여 native 숫자색/44px을 표시했고, 대시보드는 WallStatContent의 중립36px+6px 점을 표시했다. 값·Color Mode가 달라서 생긴 정상 차이가 아니다. | WallEditorPreview에 대시보드와 같은 wallStatCardPresentation을 연결한다. provider 변경만으로 query runner/패널 저장 모델을 재생성하지 않는다.                                                                                                                                                                 |
| 작은 점과 숫자색         | getStatCardPresentation이 숫자 Value Color를 중립색으로 바꾸고 별도의 indicator로 전달했다.                                                                                                                                                                                              | Value Color의 실제 필드 색을 숫자에 적용하고 dot을 제거한다. None은 중립. Mapping으로 실제 비숫자 텍스트가 제공된 경우만 기존 상태 Chip을 사용한다. 필드명/0/색상만으로 정상·주의·심각 및 전체 Health 배지를 생성하지 않는다.                                                                                 |
| 05의 별도 Stat 경로      | WallPanelContent가 Stat native FieldDisplay/옵션 경로를 우회하여 별도 요약 렌더링을 했다.                                                                                                                                                                                                | StatPanel은 native getFieldDisplayValues→BigValue→WallStatContent로 통일한다. 05의 Stat 서비스 제목을 헤더에 유지하고 이중 내부 padding을 제거한다. Root 용량 등 저장 타입이 Stat인 영역도 기존 모든 필드를 native Stat 규칙으로 표시한다. Gauge/Table 등의 별도 사용률·디바이스·용량 투영은 수정하지 않는다. |
| 다중 필드                | 기존 Auto grid는 정사각형 중심의 계산이라 숫자/라벨 읽기 공간과 일치하지 않았다.                                                                                                                                                                                                         | 기존 VizRepeater에 선택적인 gridItemMinSize만 추가한다. Wall Stat 토큰으로 가용 폭의 열 수를 계산하고 4개는3+1 대신2×2 등 균형 배치, 부족한 높이는 기존 PanelScrollArea로 스크롤한다. 다른 caller는 새 정책 opt-in 안 함. 명시 Orientation/텍스트 크기·Text Mode를 유지한다.                                  |
| 빈 값과 실제0            | native createNoValuesFieldDisplay는 값이 없어도 numeric0을 가진 placeholder를 반환한다. 숫자 NaN 검사만으로는 구별되지 않았다.                                                                                                                                                           | native FieldDisplay의 실제 view 연결 유무를 isNoValue로 전달해 실제0과 구별한다. null Mapping은 원본 null로 조회한다. placeholder를 실제 KPI로 표현하지 않으며 SCVM 빈 변수/쿼리는 수정하지 않는다.                                                                                                           |
| 선택 목록                | 단일 값/기존 다색 plugin logo가 남았다.                                                                                                                                                                                                                                                  | 이름 수치 (Stat), 설명 주요 지표의 값과 상태를 한눈에 표시합니다. 중립 숫자 glyph와 동일 타이포 토큰을 Gallery/현재 시각화에 사용한다. plugin ID stat 및 JSON 변경 없음.                                                                                                                                      |

색상은 현재 Wall의 기존 presentValueColor 대비 보정 정책을 재사용한다. 명시 Background/BackgroundSolid의 배경과 native 대비 계산을 유지하며, 새 그라데이션이나 색상 판정 엔진을 추가하지 않았다. 기존 명시 배경 그라데이션의 native 대비 정책까지 이번에 재설계한 것은 아니다.

## 실제 전후 비교

Chrome 동일 탭/뷰포트1656×929, 종합 대시보드 Glue 스토리지 디바이스 상태(panel81), 로컬 Glue 데이터 소스의 조회 결과9/0/9/0. 별도 탭의 뷰포트가 달라 최초 캡처는 참고로 남기고 `*-matched.png` 및 comparison.json을 최종 동일 조건 비교로 사용한다.

| 조건             | 수정 전                                                        | 수정 후                                                                                                          |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 대시보드 보기    | 숫자36px·중립 rgb(20,34,57), 필드마다6px 점                    | 숫자36px·UP/IN rgb(68,131,59), DOWN rgb(194,87,0), OUT rgb(224,47,68), 점0개                                     |
| 동일 패널 편집기 | wall-stat 경로, 숫자44px·색상 숫자                             | wall-stat-card 경로, 숫자36px·대시보드와 동일한 네 색                                                            |
| 값·명칭          | UP9/DOWN0/IN9/OUT0                                             | 동일. DOWN/OUT0도 기존 orange/red Override 유지. 정상이라고 추측해 녹색으로 바꾸지 않음.                         |
| 다중 필드        | 큰 보기에서 native 정사각형 중심2×2                            | 같은 큰 보기에서 가용 폭을 활용한4열. 중간 QA 폭506에서는2×2로 균형 배치. 외곽 패널 배치/저장 좌표는 변경 안 함. |
| 05 빈 SCVM       | 값이 없는 native placeholder가 일반 숫자 계층으로 보일 수 있음 | empty kind·14px 보조 표현. 쿼리·SCVM 변수값은 그대로 비어 있음.                                                  |

## 브라우저 검증

실데이터 조회와 합성 Fixture를 구분한다. QA142는 **새 격리 DB에만** 종합 panel81/QA129의8시리즈/QA125의문자열/QA108의용량 패널을 복사하여 만들었다. 복사한 쿼리/원본 raw frame은 변경하지 않았다. 제품이 자동으로 쿼리를 추가하는 기능은 없다. QA 제목에 격리 복사본을 표시한다. 운영/원본 대시보드에는 테스트 저장을 하지 않았다.

- 일반 수치: Threshold가 없는 QA108 용량의 unit bytes/decimals2·fixed text 색을 유지,754.70 GiB를 중립36px/작은 단위로 표시했다. 조회 시점 값이며 고정된 제품 상수로 사용하지 않는다.
- 1/2/4/8필드: 용량1개, 문자열 All values2개(UP/장애), Glue4개, 기존 QA129 실제 raw-frame8시리즈를 확인했다. label/name·값·단위의 대응과 긴 라벨 title/ellipsis 유지.
- Value Mapping: 기존 문자열 DOWN→장애 red만 Chip으로 표시한다. UP에는 정상이라는 새 문구/배지를 만들지 않는다. Chip 문자14px/전체높이34px, 같은 영역에 중복 dot 없음.
- 명시 색상: Glue 네 필드의 fixed Override, QA의 팔레트 Value 모드, Background Gradient, BackgroundSolid, None을 UI에서 확인했다. BackgroundGradient는 native linear-gradient/대비 전경을 유지한다. 테스트 설정은 취소했다.
- Text Mode: Name 실제4라벨, Value and name 실제 시리즈/단위, None UI 선택 후 label0/number0 확인. Auto/Value/Name/None/ValueAndName과 Background 대비는 unit test에서도 확인한다.
- 실제 Resize: QA8 패널506×258→313×196px.8개 유지,2열×4행, 각 항목80px·숫자33.9047px로 자연스럽게 fit. viewport162px/콘텐츠344px·가로300/300px, native wheel scrollTop0→182/최대182로 마지막 항목까지 도달했다. Resize 엔진은 수정하지 않았다. 배치 취소 후 Dirty0/원래 크기 복원.
- Light/Dark: 실제 숫자/Mapping/배경/Name·8개 목록과 편집기를 캡처했다. 동일한 정보 구조와 기존 테마 대비 정책을 사용한다.
- Sparkline: QA129 원본의 실제 time/number121포인트가 있는8시리즈에서 같은 절대 시간 범위로 Area 옵션을 켰다. native Canvas8개(각229×61)와 값8개를 확인했다. 기본 None에서는 Sparkline을 만들지 않는다. null/gap/시간 없는 필드의 배제는 unit test도 통과한다. 테스트 변경 취소.
- 저장: QA125 문자열 패널의 All values를 기존 편집기→저장 옵션→대시보드 저장 Drawer에서 저장. QA142 version3의 reduceOptions.values=true와 원래 Mapping을 API 및 새로고침에서 재확인했다. 최종 실행 스냅샷에도 같은 DB 복사 상태를 검증했다.
- 최종 편집기 상태 변경 사항 없음/QA Dirty0. 원본 종합version43·05version30의 전체 Dashboard JSON이 시작 시 복사본과 동일함을 API 비교로 확인했다. 사용자 기존 index도 동일하다.

## 변경 파일

- `public/app/plugins/panel/stat/StatPanel.tsx`
- `public/app/features/wall-modern/statPresentation.test.tsx`
- `public/app/features/wall-modern/statPresentation.ts`
- `public/app/features/wall-modern/modern.css`
- `public/app/features/wall-modern/workspace/DashboardWorkspace.tsx`
- `public/app/features/wall-modern/workspace/overviewPresentation.tsx`
- `public/app/features/wall-modern/panels/WallStatContent.tsx`
- `public/app/features/wall-modern/panels/statReadout.test.tsx`
- `public/app/features/wall-modern/panels/statReadout.ts`
- `public/app/features/wall-modern/editor/optionText.ts`
- `public/app/features/wall-modern/editor/WallPanelEditor.tsx`
- `public/app/features/wall-modern/editor/WallVisualizationGallery.tsx`
- `public/app/features/wall-modern/editor/WallPanelEditor.test.tsx`
- `public/app/features/dashboard-scene/panel-edit/PanelEditorRenderer.tsx`
- `packages/grafana-ui/src/components/VizRepeater/VizRepeater.tsx`
- `packages/grafana-ui/src/components/BigValue/BigValue.tsx`
- `packages/grafana-ui/src/components/BigValue/StatCardPresentation.ts`

추가 기록: DESIGN_SYSTEM.md REF142, AGENTS.md, WALL_AUTODEV_PROGRESS.md, 이 보고서.

실제 기술: 새 primitive/라이브러리는 없다. native BigValue/VizRepeater/Formatter/Reduction/Sparkline과 Wall React DOM을 재사용한다. 로컬 shadcn Card/Tabs/Button 및 Base UI 기반 Editor/Gallery Dialog는 기존 경계를 유지한다. 새 Stat 숫자 구조는 React DOM이며 Canvas를 shadcn으로 재개발했다고 설명하지 않는다. CSS 변경은 기존 modern.css의 Stat/glyph 표시 규칙이고, 실제 렌더러 연결·색 규칙·빈 상태·적응형 구조 변경과 구분한다.

## 검사 및 남은 제약

- 집중 Stat/StatReadout/Editor/BigValue/BigValueLayout **5suites51tests 통과**. 명시 크기/단위·raw 값·쿼리 설정·Mapping·실제0/빈 값·native Sparkline·fallback·균형 배치를 검증한다.
- 수정 production13roots 제한 TypeScript에서 PanelEditorRenderer의 기존 `Component on never` 오류1건이 남았다. 사전 사본을 compiler host로 주입한 동일 검사에서도 재현했다. 다른12roots의 진단0이며 전체 타입검사가 통과했다고 보고하지 않는다.
- 추가 Overview4tests 중 Gauge의 이전 selector/렌더러 기대 테스트1건 실패(3pass). 수정 전 Overview 소스에 대한 별도 run도 동일3pass/1fail. 이번에 Gauge 코드를 고치거나 기대값을 바꾸지 않았다.
- 수정 TS Lint0, 동일소스 backend/frontend production build성공, 정합 checker에서11.4.0-pre/commit4dad0b48a2·소스/정적파일/실행 바이너리 지문 일치.
- 기존 패널 취소 후 native Dashboard Dirty가 남는 경로를 관찰했다. 저장된 QA 설정은 그대로였으며 대시보드 변경 취소로 Dirty0 복원했다. 이는 기존 AUD-007/저장 정규화 영역의 후속 문제이며 이번 Stat 표시 변경으로 해결했다고 보고하지 않는다.
- SCVM 변수는 빈 테스트 제약 그대로다. 05의 값 있는 모든 서비스/용량 운영 조합·Firefox/Safari·장시간 갱신 부하는 이번 신규 실기 범위가 아니다. native Background Gradient의 모든 사용자 색에 대한 대비를 개선 완료했다고 표현하지 않는다.

기존3317/3318/3320/3321·운영 DB·사용자 미저장 탭은 유지한다. 중간3322/3323은 이 작업에서 만든 테스트 프로세스만 종료했다. 최종 검증 스냅샷은 **http://localhost:3324**, `~/Library/Application Support/ABLESTACK/WallPreview/coherent-stat142-release/`다. 기존 서버로 자동 전환하거나 원본 DB에 연결하지 않았다.

증거 디렉터리: `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-stat-ref142/`

- before/glue-view-matched.png, before/glue-editor-matched.png
- after/glue-view-matched.png, after/glue-editor-matched.png, after/glue-editor-dark.png
- after/qa-light.png, after/qa-dark.png, after/resize-small.png, after/visualization-picker.png, after/sparkline.png
- comparison.json, after/resize.json, after/color-modes.json, after/sparkline.json, persistence-results.json
- before/source/의 사전 소스, 테스트/기존 실패/제한 타입/린트/빌드 로그

---

## REF-143 — REF-142 실제 화면 품질 재검토 (2026-11-06)

### 범위 및 환경

REF-142의 같은 QA142 version3, 같은 여섯 패널과 저장 옵션을 재사용했다. 원본3324 DB를 온라인 백업한 **별도 로컬 개발 복사본**에서 검증했으며 원본 DB/서비스/사용자 미저장 탭을 변경하지 않았다. 공통 Stat 표시 경로를 개선했으며 UID/패널 ID별 조건은 추가하지 않았다. 대시보드 Grid/Drag/Resize 엔진과 다른 시각화 코드는 이번 수정 대상이 아니다.

Chrome, 주 비교 viewport1656×929, 패널435×258px/본문224px. 실제 조회 복사인 Glue·용량과 QA129/QA125의 명시 Fixture를 구분한다. Glue는 조회 당시9/0/9/0, 용량754.70GiB였다. 합성 목록은 실제 운영 성능 데이터로 주장하지 않는다. 새 외부 제품 벤치마크 실측을 수행한 작업은 아니다.

### 확인한 문제와 판단

| 대상             | 원인                                                                                                          | 변경 및 보존                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glue4            | 이전120px 최소폭 때문에 짧은 라벨/한 자리 수까지2×2였다. 높이가 넓은 가로 배치를 결정할 근거는 아니었다.      | native DisplayValue의 라벨·숫자·단위와 실제 Wall font 폭을 측정해 들어가는 열 수를 계산한다.435px에서4열, 부족하면2×2. 명시 Orientation은 native 경로를 유지한다.                                                                 |
| 8시리즈          | 균일 타일 배치로 긴 라벨이 약102px에 잘리고 최소80px 행 때문에 본문 밖으로 내려갔다.                          | 라벨이 숫자보다 지배적이고 최소 읽기 폭을 확보할 때만 이름/값 inline 행. 목록 수치는 공통 compactMetric22/26 토큰, 일반 KPI36은 유지. 기본435px에서8행 모두 보이며 라벨306px, 값 오른쪽 정렬. 좁고 낮으면 내부 목록만 스크롤한다. |
| Mapping          | UP은 미매핑 문자열, DOWN→장애에만 명시 red Mapping이 있다. 두 값의 Chip inset과 일반 문자열 행 높이가 달랐다. | 매핑 의미와 기존 Chip 유무는 유지한다. 공통 문자14px·34px 읽기 영역으로 라벨/값 기준선을 정렬. UP을 정상 Chip으로 만들지 않는다. 숫자 원본의 문자 Mapping도 실제 표시 문자를 기준으로 측정한다.                                   |
| 일반 용량        | 기존Auto의 왼쪽 정렬과 큰 숫자/작은 단위는 정상 설정이었다.                                                   | 숫자36/단위13·754.70GiB·기존Auto 정렬 유지. 불필요한 상태색/선/배지를 추가하지 않음.                                                                                                                                              |
| Background Solid | 짧은 숫자 기준의4열을 강제하면 높은 색상 세로 띠가 된다.                                                      | 실제 콘텐츠 필요폭에 가용 높이와 기존 읽기 폭 토큰을 함께 고려한다.435px에서는2×2 색상 면, 넓으면4열. 명시 background/전경 대비/색은 보존한다.                                                                                    |
| Name             | 숫자용36px 계층이 이름 전용 텍스트까지 확대했다.                                                              | Name은 기존section14px 역할을 사용하고 숫자/단위를 표시하지 않는다. explicit 글자 크기는 우선한다.                                                                                                                                |

색상 분석: Glue의 UP/IN green, DOWN orange, OUT red는 기존 필드별 fixed Override와 Value Color에서 왔다. Wall이 이름을 보고 상태를 추정한 색이 아니다. DOWN0/OUT0을 정상으로 재판정하거나 기존 색을 중립색으로 덮지 않았다. 색의 의미만으로 새 상태 텍스트/아이콘/밑줄을 생성할 근거가 없어 추가하지 않았다. 전체 Health 배지도 없다.

### 공통 구현

- `statLayout.ts`: native formatted FieldDisplay만 읽는 geometry 함수. 실제 label/value/unit, 글꼴 크기, 명시 text size, body width/height와 기존 scrollbar clearance를 사용한다. 원본 프레임/Reducer/Mapping/단위/색을 수정하지 않는다.
- `VizRepeater`: 선택적 `getGridDimensions` callback과 항목별 inline 표시 metadata. Wall Stat만 opt-in. 다른 caller는 기존 경로, explicit Orientation은 native 방향 계산을 유지한다. 이것은 Stat 내부 항목 배치이며 대시보드48열 좌표와 별개다.
- `WallStatContent`/`statReadout`/`typography`: 타일KPI36, 목록수치22, 이름14, 문자14와 작은 단위를 각 공통 역할로 구분. inline 실제 DOM 구조/간격/기준선 정리이며 외곽 카드 추가가 아니다.
- `WallChrome`/`WallPanelEditor`: 같은 presentation을 사용하며 self-hosted font 로딩 상태가 바뀌면 측정 callback도 갱신한다. 쿼리나 편집 버퍼 remount 없음.
- Sparkline/percent-change/TextNone은 기존 native 배치 fallback. 기존 명시 글자 크기, 단위, Value/Background/None 색 의미와 TextMode를 유지한다.

새 primitive/라이브러리 없음. 기존 native StatPanel→VizRepeater→BigValue, Wall React DOM 및 PanelScrollArea를 재사용한다. 기존 shadcn/Base UI 편집기·메뉴 외곽을 다시 만들지 않았다. 이번 작업을 Base UI 전용 Stat 패키지 사용이나 CSS만 변경한 작업으로 표현하지 않는다.

### 실제 브라우저 전후 및 반응형 검증

| 조건                      | 변경 전                                      | 변경 후                                                                                                              |
| ------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Glue435×258               | 2×2                                          | 4열 한 행, 네 숫자36px, 색/값 동일                                                                                   |
| Glue 실제Resize241×196    | 해당 크기 비교 신규                          | 2×2, 네 값36px, 본문162/content162px·스크롤 없음. 취소 후 원래435px 복원                                             |
| 8시리즈435×258            | 3열 타일, 라벨 약102px, 본문224/content256px | 1열 inline8행, 라벨306px, 값22px/행26px, 본문224/content224px·스크롤0                                                |
| 8시리즈 실제Resize296×196 | 해당 크기 비교 신규                          | 8개 모두 유지, 숫자22px, 본문162/content222px. 실제 wheel로scrollTop0→60(최대60), 마지막 값 경계408px=본문 하단408px |
| 8시리즈 넓은703px         | 검증용 확대                                  | 2열×4행, 스크롤 없이8개 유지. 중간25px 후보에서 실기 후 기본435px 밀도를 더 개선해 최종22px 선택                     |
| Mapping                   | plain/Chip 높이 차이                         | UP/장애 readout y353/h34px 동일, 글꼴14px. 미매핑/매핑 차이는 유지                                                   |
| Name                      | 숫자용36px 확대                              | 이름만14px·4열, 숫자/단위 없음                                                                                       |
| Background435px           | 색상 설정 자체는 유효                        | 기존 색상 그대로2×2, 넓은 공간4열. 불필요한 추가 색/상태 없음                                                        |

최종3328에서 기본6패널·Light/Dark·8목록 축소/휠/취소·Glue/8편집기 Preview·명시방향을 확인했다. Glue241px·703px 폭 확장은 같은 구현의 중간 검증3326/3327에서 수행했고 JSON에 저장하지 않았다. 최종색/값/본문/행 수는 DOM rect·computed font로 측정했다. 초기25px 후보는 기본 크기에서44px 스크롤이 남아 최종 목록용22px/행간2px으로 다시 검토했다. 중간 결과를 최종 결과로 대체 주장하지 않는다.

명시 Orientation: 기존 UI의 가로(enum horizontal) 선택은 native renderValues의 세로 누적, 세로(enum vertical)는 가로 나열 방식이다. 이 기존 대응을 이번 Auto 배치 개선에서 재해석하지 않았고 최종 편집기에서 두 방향을 선택해 x/y를 기록한 후 취소했다. 기능 명칭을 바꾸거나 JSON 값을 바꾸지 않았다.

긴 라벨은 title 속성에 전체 이름을 보존한다. 기본435px에서는306px의 텍스트 영역에 전체 이름이 들어가며 축소 후167px에서는 ellipsis와 전체 title을 유지한다. 마지막 항목은 삭제/필터링 없이 실제 스크롤로 접근했다. 최종 dashboard dirty0, 조사 배치와 옵션 모두 취소했다.

### 변경 파일

제품11파일(기존10+신규1):

- `public/app/features/wall-modern/panels/statLayout.ts` (신규)
- `public/app/features/wall-modern/panels/WallStatContent.tsx`
- `public/app/features/wall-modern/panels/statReadout.ts`
- `public/app/features/wall-modern/statPresentation.ts`
- `public/app/features/wall-modern/typography.ts`
- `public/app/features/wall-modern/WallChrome.tsx`
- `public/app/features/wall-modern/editor/WallPanelEditor.tsx`
- `public/app/plugins/panel/stat/StatPanel.tsx`
- `packages/grafana-ui/src/components/VizRepeater/VizRepeater.tsx`
- `packages/grafana-ui/src/components/BigValue/BigValue.tsx`
- `packages/grafana-ui/src/components/BigValue/StatCardPresentation.ts`

관련테스트2파일: `statPresentation.test.tsx`, `panels/statLayout.test.tsx`(신규).
기록: DESIGN_SYSTEM.md REF143, AGENTS.md, WALL_AUTODEV_PROGRESS.md, 본 문서.

### 검증 결과 및 한계

- 집중6suites55tests 통과: Stat presentation/layout/readout, Editor, BigValue/Layout. 실제 짧은4개·큰숫자/단위·긴8개·매핑문자·background·명시크기·native fallback을 검증. JSDOM Canvas의 text width0은 테스트에서 결정적 text measure로 대체했고 실제 글꼴폭/최종모양은 브라우저 실측으로 검증했다.
- 수정 production11roots 제한 TypeScript 진단0, ESLint0. 전체 저장소 타입/테스트 통과를 주장하지 않는다. REF142에서 확인한 기존 Gauge 테스트1fail·PanelEditorRenderer 기존 타입 오류·AUD007 취소 후 Dirty 잔여는 이번 표시 작업에서 수정하지 않았다.
- 동일소스 backend/frontend build성공, checker 통과:11.4.0-pre /4dad0b48a235a8904be829c91fe0dd086a0a94a3, 실제 binary/source/static fingerprints 일치.
- API에서 전체 Dashboard JSON 비교: QA142version3, 종합version43,05version30 모두 시작 시와 동일. 쿼리/데이터소스/단위/Override/Threshold/저장 옵션 변경 없음. Git index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 동일. 기존 광범위 미커밋을 포함하는 커밋은 만들지 않았다.
- Windows/Firefox/Safari·터치·장시간 부하는 이번 실기 범위가 아니다. 명시 큰 글자/극단적인 작은 카드/수백 필드의 가독성을 모두 보장한다고 보고하지 않는다. Sparkline/percent-change는 기존 경로를 보존했고 이번에는 새 시각화 검증을 반복 확대하지 않았다.

최종 확인 URL: **http://localhost:3328/d/wall-stat-qa-142/ae56070?theme=light**

최종 런타임: `~/Library/Application Support/ABLESTACK/WallPreview/coherent-stat143-verified/`.
기존3317/3318/3320/3321/3324 서비스·DB·사용자 탭은 유지했고 HTTP health200을 확인했다. 이번 자체 중간3325/3326/3327만 종료했다.3317의 기존9.2 백엔드를 이번 Stat 범위에서 교체하지 않았으므로 최종 결과를 확인할 곳은3328이다.

증거 디렉터리: `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-stat-ref143/`

- `before/qa-light.png`, `before/qa.json`: 같은 viewport의 REF142 화면
- `after/light.png`, `after/qa.json`, `after/dark.png`, `after/dark.json`: 최종3328
- `after/small.json`, `after/small.png`: Glue241px 중간 검증
- `after/small-8-final.json`, `after/small-8-scroll-final.json`, `after/small-8-final.png`: 최종3328의296px 축소와 마지막 항목 접근
- `after/wide.json/png`:703px 중간 후보 검증
- `after/preview-glue-final.png`, `after/preview-8-final.png`, `after/orientation-final.json`: 최종 Preview/방향
- `persistence-results.json`, `changes.patch`, `before/source/`, 최종tests/build/lint/types 로그

---

## REF-144 — 명시적 Wall Modern Stat 표현 (2026-11-06)

### 기존 표현 분석과 변경 원칙

Background Solid가 여전히 Grafana와 유사했던 이유는 REF142/143이 **사용자가 저장한 Color Mode를 그대로 재현**했기 때문이다. native BigValueLayout의 BackgroundSolid는 실제 필드 색을 전체 배경에 쓰고 대비 전경을 계산한다. Background는 같은 색에서 native 그라데이션을 만든다. Value는 숫자색, None은 중립 표현이다. 이번에는 이 동작을 오류로 간주하거나 자동 변환하지 않고 별도 Presentation Style을 추가했다.

기존 FieldDisplay/Reducer/Formatter/Value Mapping/Threshold/Override·사용자색/쿼리 계산은 그대로다. Glue의 UP/DOWN/IN/OUT 이름으로 Health를 추정하지 않는다. 실제 색이 무엇인지 알 수 있어도 그 색의 의미가 정상/장애인지 자동 판정하지 않는다. 명시 Mapping의 장애 문구만 표시하며 상단 전체 상태 배지·새 쿼리는 없다.

### 스타일과 우선순위

| 표현 스타일              | 면과 숫자                                                                                                         | 설정 색의 표시                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 기존 Grafana 호환 표현   | REF143 Wall Stat typography/layout와 기존 native Color Mode를 유지                                                | Value=숫자색, BackgroundSolid=단색 배경, Background=native 그라데이션, None=중립 |
| Wall Soft Surface · 추천 | 공통 soft Surface/8px 반경·얇은 inset 경계. 셀 전체 높이가 아닌 실제 숫자/라벨 주변에만 면을 둠. 숫자는 panelText | 실제 계산된 필드 색을 작은 세로 Accent로 표시                                    |
| Wall Minimal             | 내부 면과 경계 없이 숫자·라벨 중심. 숫자는 panelText                                                              | 실제 색의 짧은 하단 Accent. 가운데 정렬 값은 Accent도 같은 중심선                |

- 새 옵션은 `options.wallStatStyle` (`legacy`/`soft`/`minimal`). 누락은 기존 호환 표현이며 기존 대시보드 JSON을 마이그레이션하거나 자동 저장하지 않는다.
- **스타일은 색을 어디에 그릴지, Color Mode는 색 표시의 사용 여부를 결정한다.** Soft/Minimal을 명시 선택하면 Value/Background/BackgroundSolid의 native field color를 Accent로 재표현한다. 원래 ColorMode enum·필드 색 설정은 유지하며 호환 표현을 선택하면 원래 숫자색/배경을 복원한다.
- ColorMode None이면 두 Wall 스타일도 Accent를 표시하지 않는다. 의미 있는 색 설정이 없는 text-colored 필드도 Accent가 없다. TextMode None에서는 숫자/Accent를 만들지 않고 기존 보조 그래프 정책을 유지한다.
- 스타일 선택기 아래에 현재 모드에 맞는 설명을 표시한다. 배경 모드가 보존되며 Accent로 재표현된다는 점, None일 때 Accent가 없다는 점을 숨기지 않는다. 기존 모드와 새 스타일의 지원 조합을 조용히 무시하는 경로는 만들지 않았다.
- 새 Stat의 자동 기본값을 Soft로 바꾸는 방안은 보류했다. 같은 plugin defaults가 기존 옵션이 누락된 패널에도 병합되므로 기존/신규 구분 없이 기본값만 바꾸면 기존 표현이 달라질 수 있다. 이번에는 **Soft를 추천 선택지로 제공**하고, 새 패널도 명시 선택으로 적용한다.

### 실제 구현과 디자인 판단

1. `StatPanel`의 native options 확장 타입을 별도 `types.ts`에 두었다. generated panelcfg/CUE·플러그인ID는 변경하지 않았다. 선택한 스타일을 BigValue에 전달하고 Pure VizRepeater의 표시 callback도 options 변경을 따라 갱신하여 즉시 전환한다. 별도 쿼리를 추가하거나 실행 경로를 다시 만들지 않는다.
2. BigValue는 저장 모델 대신 표시용 layout 입력만 조정한다. Modern 스타일에서는 native Value-mode의 neutral-surface foreground/Sparkline 경로를 사용하고 숫자는 공통 panelText로, 원래 native 계산 색은 Accent로 전달한다. native 데이터/색 계산 엔진을 새로 구현하지 않았다. 호환 스타일과 non-Wall fallback은 기존 동작이다.
3. `getStatCardPresentation`/`WallStatContent`는 같은 숫자·단위·라벨 DOM을 재사용한다. Soft의 면은 클릭/포인터를 받지 않는 장식 span이며 새 카드/별도 상태 모델이 아니다. Minimal은 그 면을 만들지 않는다. 실제 내부 콘텐츠 기반 REF143 배치와 기존 PanelScrollArea를 사용한다.
4. 최초 실제 Preview에서는 Soft가 neutral color이더라도 셀 전체 높이를 채워 긴 빈 카드처럼 보였다. 실기 후 **콘텐츠 주위 약82px 면**으로 좁혔다. Minimal의 밑줄도 숫자 중심선에 맞추고 가용 세로 여유 안으로 제한했다. 패널 border-box/48열 좌표는 그대로다.
5. 색/Radius/간격은 기존 surfaceTokens와 statReadout 토큰, 숫자/단위/목록은 기존 typography 역할을 사용한다. 새로운 전역 CSS/색 팔레트·그라데이션·그림자를 추가하지 않았다. inset box-shadow는 얇은 경계선 용도다. 텍스트에 scale/translate를 적용하지 않았으며 Accent에만 위치 정렬을 사용한다.
6. `WallStatStyleEditor`는 실제 `@base-ui/react/select`의 Root/Trigger/Portal/Positioner/Popup/List/Item·ItemText·ItemIndicator와 로컬 shadcn Button(`../ui`)을 사용한다. 기존 WallMeter의 `wall-metric-*` 공통 Surface/팝업/Motion 스타일을 재사용한다. 새 라이브러리 없음. 숫자 렌더링 자체를 Base UI 카드 패키지로 바꿨다고 설명하지 않는다.

### 실제 브라우저 비교

최종 동일소스 환경 **http://localhost:3331**, Chrome1656×929. QA142 여섯 패널의 실제 데이터/설정을 그대로 사용해 호환→Soft→Minimal을 편집기에서 선택·미리보기·적용하고 Light/Dark에서 확인했다. 이 조사 변경은 저장하지 않고 모두 취소했다. 일반 용량/Glue는 기존 조회의 복사, 긴8시리즈/문자열 Mapping은 명시 Fixture이며 실제 운영 부하 검증으로 주장하지 않는다.

| 조건                | 확인 결과                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 동일6패널           | 항목 수4/8/2/1/4/4, 모든 스타일에서 동일. 숫자36px, inline 목록22px, 문자열/Name14px·단위 작은 baseline 유지                                                  |
| Background Solid4값 | 호환은 기존 색상 면2×2, Soft/Minimal은 실제 필요 폭 기준4열.9/0/9/0 동일. Soft는 중립 면, Minimal은 면0개, 큰 숫자는 둘 다 중립색                             |
| 일반 Value Color    | 호환 숫자색 유지. Modern에서 같은 필드 색을 Accent로 옮기고 숫자/단위는 중립. 고정 text 색의 일반 용량에는 Accent를 만들지 않음                               |
| Mapping             | 원문 UP과 명시 DOWN→장애를 그대로 보존. 호환은 기존 장애 Chip, Modern은 문구와 실제 red Accent. 전체 정상/장애 판정 없음                                      |
| None 및 Name        | ColorMode None에서 Accent0. Name은 이름만 표시하고 숫자/단위 없음. 편집기 설명도 None 정책과 일치                                                             |
| 실제Resize241×196   | Soft/Minimal Glue 모두2×2, 숫자4개36px, 본문162/content162px, Accent는 패널 안. Undo/취소로 원래435px 복원                                                    |
| 실제Resize296×196   | Soft8목록: 숫자22px 유지, 본문162/content222px. 실제 wheel0→60(최대60), 마지막 행 bottom408=본문 하단408px. 시리즈8개/전체 title 유지                         |
| 기본435×258         | 여섯 패널 모두 내부 스크롤0. Soft의8개 행과 긴 이름도 유지. Minimal에는 내부 Surface가 없음                                                                   |
| Gradient 복원       | 기존 native gradient→Soft→호환을 UI 전환. 네 배경의 computed linear-gradient 문자열이 전환 전후 완전히 동일. 원래 ColorMode는 UI에서 배경 그라데이션으로 유지 |
| 편집기/대시보드     | 동일한 공통 renderer. Soft의 neutral 숫자/원본 색 Accent/면과 기존 Mapping을 동일하게 확인. Select 클릭/ESC와 기존 native 취소 경로 사용                      |

비교를 다시 열 수 있도록 **격리 DB에만 새 QA144**를 만들었다. 기존 QA142의6패널을 세 스타일로 deep copy한18개이며, 각 행의 왼쪽=호환/가운데=Soft/오른쪽=Minimal이다. 테스트용 새 ID/title/gridPos와 optional wallStatStyle만 다르다. 원본18개 쿼리·FieldConfig·기존 native 옵션은 원본 패널과 모두 동일함을 API로 검증했다. 제품이 자동으로 테스트 쿼리를 추가하는 기능은 아니다.

- QA144 version1 저장 후 브라우저 새로고침:18패널/69개 readout, legacy23/soft23/minimal23, 미저장0. 저장된 options의 신규 필드를 기존 Dashboard API가 그대로 보존함을 확인했다.
- 기존 QA142version3·종합version43·05version30의 **전체 Dashboard JSON은 시작 시와 동일**. 새 QA144도 생성 직후 JSON과 최종 JSON이 동일하다. 검증 중에는 기존 native 패널 취소 후 비동기 Dirty가 남는 AUD007 경로가 보여 대시보드 변경 취소로 정리했으며 이를 이번 작업의 해결 항목으로 주장하지 않는다.
- 실제 사용자 기존3328/3324/3317 탭은 새로고침하거나 저장하지 않았다. 최종 사용자 결과는 새 비교 화면으로 별도 열었다.

### 변경 파일

제품10파일:

- `packages/grafana-ui/src/components/BigValue/StatCardPresentation.ts`
- `packages/grafana-ui/src/components/BigValue/BigValue.tsx`
- `public/app/plugins/panel/stat/types.ts` (신규, optional UI 옵션 타입)
- `public/app/plugins/panel/stat/module.tsx`
- `public/app/plugins/panel/stat/StatPanel.tsx`
- `public/app/features/wall-modern/statPresentation.ts`
- `public/app/features/wall-modern/panels/WallStatContent.tsx`
- `public/app/features/wall-modern/panels/statReadout.ts`
- `public/app/features/wall-modern/panels/statLayout.ts`
- `public/app/features/wall-modern/panels/WallStatStyleEditor.tsx` (신규)

관련테스트3파일: `statPresentation.test.tsx`, `panels/statLayout.test.tsx`, `panels/WallStatStyleEditor.test.tsx`(신규).
기록: DESIGN_SYSTEM.md REF144, AGENTS.md, WALL_AUTODEV_PROGRESS.md, 본 문서.

### 검사 및 남은 제약

- **7suites63tests 통과**. 기존 Stat/Readout/Layout·Editor·BigValue/Layout 및 스타일 선택기를 검증한다. 네 ColorMode×두 Modern 스타일의 같은 값/단위·색 Accent/None·기존 옵션 불변·스타일 전환/호환 복원·Mapping/Name/native fallback·컨트롤 설명을 포함한다.
- 수정파일을 포함한 production14roots 제한 TypeScript 진단0, ESLint0, `git diff --check`0. worktree 공유 node_modules가 다른 checkout을 가리키므로 테스트/빌드는 로컬 @grafana/ui alias로 실행했다. JSDOM gradient 파싱 한계는 위 브라우저 computed style 복원 검사로 보완했다.
- 동일소스 backend/frontend build 및 checker 통과:11.4.0-pre/4dad0b48a235a8904be829c91fe0dd086a0a94a3. source/static/binary 지문 일치. 버전 문자열만 바꾸지 않았다.
- 기존 전체 RC gate·Gauge baseline 테스트/PanelEditorRenderer 타입 오류·AUD007은 범위 밖이며 이번 통과로 해결 처리하지 않는다. Firefox/Safari/실제 터치/장시간 갱신·극단 크기와 사용자 색 전체 조합은 새 실기 범위가 아니다. Sparkline/percent change의 실제 운영 조합 전체를 반복 검증한 것은 아니며 native 경로 및 기존 관련 테스트를 유지했다.
- Git index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe 동일. 기존 광범위 미커밋 작업을 섞는 커밋은 만들지 않았다. 대시보드 Grid/Drag/Resize·다른 시각화·운영 DB·기존 백엔드/서비스는 변경하지 않았다.

최종 비교 화면: **http://localhost:3331/d/wall-stat-qa-144/46dcb68?theme=light**

원본 QA142도 같은 환경에서 기존 표현 그대로 조회할 수 있다. 새 스타일은 편집기 수치 표시→표현 스타일에서 명시 선택한다. 최종 런타임은 `~/Library/Application Support/ABLESTACK/WallPreview/coherent-stat144-release/`. 이번 자체 중간3329/3330만 종료하고 기존3317/3318/3320/3321/3324/3328은 유지했다.

증거 디렉터리: `/Users/hongwookryu/.codex/visualizations/2026/11/06/wall-stat-ref144/`

- `before/light.png`, `before/qa.json`, `before/source/`: 시작 화면/소스
- `after/dashboard-{legacy,soft,minimal}-{light,dark}.png/json`: 동일QA142 여섯 패널의3스타일
- `after/compare-{light,dark}.png`, `after/compare-lower-{light,dark}.png`: 저장된QA144 나란히 비교
- `after/soft-small-glue.png/json`, `after/minimal-small.png/json`, `after/soft-small-scroll.png/json`: 실제 축소/스크롤
- `after/editor-soft-final.png/json`, `after/gradient-restoration.json`, `after/none-policy.png`: Preview/호환/None
- `qa144-created.json`, `qa144-compatibility.json`, `persistence-results.json`, `after/reload.json`: 저장 모델/원본 보존 증거
- `changes.patch`, 최종tests/types/lint/build/runtime-check 로그. 초기후보 editor-soft-light는 전체 높이를 채우던 중간안이며 최종안은 editor-soft-final/compare 캡처를 따른다.

## REF-148 — 단일 상태·수치 Auto Fit 및 다중 값 보존 (2026-11-09)

단일 값에 한해 작은 Chip 대신 실제 값 텍스트를 표시하고 패널의 가용 공간에 맞춰 자동 크기를 적용했다. 공통 Stat 렌더링 경로를 수정하여01/12/다른 Wall 대시보드와 편집기 Preview가 같은 규칙을 사용한다. 원본 Dashboard JSON과 쿼리/시각화 옵션은 변경하지 않았다.

### 실제 원인과 구현

REF142에서 매핑 문자열을 정확히 인식하는 공통 WallStatContent로 통일했지만 `kind=status && indicator`를 실제 표시 개수와 관계없이 Chip으로 처리했다. `tokens.status`의14px 상한까지 적용해 native BigValue auto-fit이 다시 줄어들었다. 이전 경로는 native fit 또는36/44px KPI 경로를 사용했으며, 이를 상태용14px 역할로 통합하면서 단일 값의 중요도까지 낮아졌다. 이번 변경 전3333의 실제01/12 Mold·Cube에서 **14px,34px 높이의 Chip**을 측정했다. 과거 모든 버전의 실행 화면까지 재현한 것은 아니다.

- native VizRepeater의 실제 `count`로 단일 값을 구분한다. 쿼리 수·프레임 수·필드 이름이나 상태 문자열로 판정하지 않는다.
- 기존 BigValue `buildLayout`이 계산한 uncapped `autoValueSize`를 재사용하고 기존 `fitStatValue`로 Wall Inter/Pretendard의 실제 Canvas 폭, 현재 너비·높이, Prefix/Suffix·단위를 최종 맞춘다. 별도 폰트 엔진이나 CSS scale을 추가하지 않는다.
- 실제 문자열 source/reducer 결과와 no-data를 구분한다. native 값을 읽는 기존 helper를 분리했으며 reducer/formatter/매핑/통계 결과는 바꾸지 않는다.
- 단일 값 Grid만 실제 본문 높이를 사용해 상태 Chip의 최소 높이가 작은 패널에서 불필요한 스크롤을 만들지 않게 한다. 명시 Orientation과 Sparkline/percent-change의 native fallback을 유지한다.
- 단일 값에는 Chip·dot·Accent·내부 Soft Surface를 생성하지 않는다. 명시된 ColorMode·Mapping/Threshold 색과 native Background Solid/Gradient 대비를 사용한다. 단일 값의 soft/minimal 선택값은 JSON에 유지하지만 이 경우 원래 ColorMode를 우선하며, 다중 값에서 기존 soft/minimal 표현을 계속 사용한다. Name/None·No Data 및 명시 글자 크기는 기존 의미를 유지한다.
- 다중 값의 기존 profile·그리드·간격·매핑 Chip·상태색·단위·목록 스크롤은 그대로다. REF147의 미완료 상태 원 크기 변경은 이번 요청에 포함하지 않고 원래 CSS로 되돌려 보류했다.
- 시각화 선택기는 `상태·수치 (Stat)` / `주요 지표의 값과 상태를 명확하게 표시합니다.`로 표시한다. 기존 중립 숫자 glyph를 재사용하고 plugin ID/stat 저장 모델은 유지한다.

### 브라우저 실측

Chrome 실제 데스크톱1656px 뷰포트, 자체 호스팅 Inter/Pretendard 모두 loaded 확인. 실제01/12의 원본 쿼리와 현재10.10.13 인프라 변수를 URL에서 선택했다. 저장 변수·쿼리는 수정하지 않았다. 원본 고객 환경에 배포한 것이 아니라 로컬의 원본 대시보드 복사본으로 실제 Prometheus/Glue를 조회한 검증이다.

| 실제 조건               | 패널 border box   | 변경 전 → 후 값 크기 | 결과                                              |
| ----------------------- | ----------------- | -------------------- | ------------------------------------------------- |
| 01 Mold/Cube            | 109×152px         | 14 →36.9452px        | 같은 초록색 OK, Chip 없음                         |
| 12 Mold/Cube            | 109×228px         | 14 →36.9452px        | 너비 제한이 같아 동일 크기, 명시 Orientation 유지 |
| 01 Mold 실제 Resize     | 246×192px         | 88.2px               | 현재 body에 맞게 즉시 확대                        |
| 01 Mold 실제 Resize     | 356×276px         | 147px                | 원본 값·색 그대로                                 |
| 01 Mold 축소            | 137×108px         | 41.6667px            | 텍스트 전체 표시                                  |
| UNKNOWN Fixture 축소    | 109×108px         | 11.4791px            | 7글자 전체 표시, Chip·잘림 없음                   |
| 단일 OK Fixture         | 328×228px         | 113.4px              | 원본 Mapping 결과                                 |
| ERROR / UNKNOWN Fixture | 328×228px         | 80.432 /49.6352px    | 실제 글자 폭에 맞게 차등 축소                     |
| 긴 한글 문자열 Fixture  | 328×228px         | 22.4332px            | 전체 문자열 유지                                  |
| 단위 있는 수치 Fixture  | 328×228px         | 76.5291px            | 기존 Formatter의1.12 TiB, 작은 단위               |
| 명시 valueSize Fixture  | 328×228px         | 42px                 | UNKNOWN의 사용자 지정값 보존                      |
| Mold 편집기 Preview     | 현재 Preview body | 198.8px              | 실제 패널과 동일 single flag·Chip 없음            |

Resize 세 작업 뒤 모두 취소해 기존109×152px/36.9452px로 복원했고 dirty0을 확인했다. Grid/저장/충돌 코드는 수정하지 않았다. 실제 Chrome UI에서110%로 확대(dpr1→1.1, innerWidth1656→1505)했을 때 ERROR69.7262px·UNKNOWN43.0285px·긴 한글19.3541px로 재계산됐고 단일 readout의 scrollWidth 초과0이었다.100%로 복원(dpr1/1656)했다. 초기 Tab.pressKey 방식은 브라우저 배율을 바꾸지 못했으며 `zoom.json/zoom-attempt.png`는 성공 증거가 아니다. 실제 성공 증거는 `zoom-actual.json/png`다.

Light/Dark01 및 QA142/QA148, 실제 폰트 로딩, Background Solid/Gradient·명시 크기·Name Mode·ColorMode None·Null을 확인했다. Null Fixture는 전후 모두 수치 readout을 생성하지 않으며 값을0이나 상태로 바꾸지 않는다. 편집기 및 시각화 선택기 진입 후 옵션을 변경하지 않고 복귀해 dirty0을 확인했다.

### 다중 값 회귀 및 데이터 보존

- 실제01/12 호스트의3개 값과01 시스템 VM의3개 값은 기존36px·색·간격을 유지했다.
- QA142의4개 Glue 값은36px,8개 긴 시리즈는22px,2개 Mapping은14px,Name은14px을 유지한다. Background Solid의 다중 셀과 기존 스크롤 경로도 유지한다.
- 같은 합성 데이터를3333(이전)/3334(수정)에 명시적으로 생성한 QA148에서 **2/3/4/8개 값과Name의 전체 측정 JSON(텍스트·font·색·Chip·각 rect)이 동일**함을 assert했다. 실제 값 하나를 복제해 운영 데이터처럼 표현하지 않았으며 Fixture는 합성 데이터라고 제목에 표시했다.
  -01 v44,12 v3,QA142 v3,05 v30의 전체 Dashboard JSON이 원본과 동일하다. QA148만 두 격리 DB에 신규 생성했고 기존 대시보드·데이터 소스의 저장 동작을 바꾸지 않았다.

### 변경 파일과 자동 검증

제품8파일:

- `packages/grafana-ui/src/components/BigValue/BigValue.tsx`: count 기반 단일 값 및 native auto-fit 전달, 실제 문자열 식별.
- `packages/grafana-ui/src/components/BigValue/StatCardPresentation.ts`: optional singleValue/autoValueSize 표시 계약.
- `public/app/plugins/panel/stat/StatPanel.tsx`: 실제 source/reducer 문자열 여부 전달.
- `public/app/features/wall-modern/panels/WallStatContent.tsx`: 단일 값 Auto Fit·Chip/장식 제외·기존 다중 값 유지.
- `public/app/features/wall-modern/panels/statLayout.ts`: 단일 값의 실제 body 높이 사용.
- `public/app/features/wall-modern/panels/statReadout.ts`: 원본 scalar 읽기 helper 재사용.
- `public/app/features/wall-modern/editor/optionText.ts` 및 `WallVisualizationGallery.tsx`: 표시 이름·설명만 변경.

관련 `statPresentation.test.tsx`와 `panels/statLayout.test.tsx`를 보강했다. Stat/Readout/Layout·native BigValue/Layout **5suites63tests 통과**, 제품8roots 제한 TypeScript 진단0·대상 ESLint0·diff check0. 기존 snapshot/RC 전체 통과로 확대하지 않는다. 동일 checkout backend/frontend build 및 실제3334 runtime checker 통과(11.4.0-pre, HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3), webpack은 기존 size 경고2건이다.

### 실행 환경과 남은 제약

검증 주소: **http://localhost:3334/d/fec03giqwtw5cf?theme=light&var-ccvmip=10.10.13.10&var-hostips=10.10.13.1%7C10.10.13.2%7C10.10.13.3&var-cubeips=10.10.13.1:9090%7C10.10.13.2:9090%7C10.10.13.3:9090**

최종 runtime은 `~/Library/Application Support/ABLESTACK/WallPreview/coherent-stat148/`다.3333 Dashboard DB의 온라인 복사본에 앞선 연결 작업에서 사용한3321의 datasource 행을 복사한 별도 검증 DB이며 원본 DB는 변경하지 않았다. 기존3317/3318/3321을 교체하지 않는다.3333 검증 backend는 권한 반영을 위해 같은 바이너리/설정으로 한 번 재시작했으며 checksum을 확인했다. 새 backend로 기존 운영 DB를 마이그레이션하지 않았다. 최종3317/3318/3321/3333/3334 health200이다. 기존 사용자 탭과 index tree0423fc0071bb143a81f8064df2bec6e8f3a43afe를 보존했고 기존 광범위 미커밋을 혼합한 커밋은 만들지 않았다.

**제약:** 사용자 VM 현황은 MySQL 인증 오류1045로 실제 수치 비교를 완료하지 못했다. 최종 재검사에서 기존3321도 driver:bad connection이므로 Stat 회귀로 단정하지 않으며 계정·권한·비밀번호는 이 작업에서 수정하지 않았다. 실제 VM 값의 검증 대신 명시 합성2/3/4/8개 값을 사용한 회귀와 호스트·시스템 VM 실데이터를 구분한다.3333의 이전 Glue proxy 연결은 실패하여 이전 Glue OK 실측은 없고,3334의 실제 Glue0→OK 표시를 확인했다. clock 플러그인 미설치·경보 datasource 누락·로그 no-data 등 기존 환경 오류도 남아 있다. Firefox/Safari·실제 터치·장시간 갱신 및 Sparkline/percent-change 전 조합의 실브라우저 검증은 이번 범위가 아니다. 관련 native 자동 테스트를 유지했다.

증거: `/Users/hongwookryu/.codex/visualizations/2026/11/09/wall-single-stat-ref148/`

- `before/overview.png`, `before/core12.png` 및 `after/overview-final.png`, `after/core12.png`: 실제 대시보드 전후.
- `before/qa148.png`, `after/qa148.png`, `after/qa148-bottom.png`, `after/qa148-dark.png`: 같은 합성 데이터 비교.
- `after/resize-measurements.json`, `after/narrow-unknown.json`, `after/zoom-actual.json`, `after/editor-metrics.json`: 실제 크기·배율·Preview.
- `after/multi-regression.json`, `after/json-preservation.json`, 각 테스트/타입/lint/build/runtime 로그와 `changes.patch`: 보존·회귀·소스 근거.

### 실제01 전후 캡처

변경 전(3333,14px Chip):

![변경 전 종합 대시보드](/Users/hongwookryu/.codex/visualizations/2026/11/09/wall-single-stat-ref148/before/overview.png)

변경 후(3334,약37px 상태 문자열):

![변경 후 종합 대시보드](/Users/hongwookryu/.codex/visualizations/2026/11/09/wall-single-stat-ref148/after/overview-final.png)

## REF-149 — 사용자 직전 현황 표현 복원 (2026-11-09)

REF148의 다중 값 비교는3333의 REF142 이후 표현을 기준으로 했으므로, 사용자가 보던3321의 중립 숫자+작은 상태 원을 보존했다는 근거로 해석하면 안 된다. 비교 기준을 잘못 선택해 숫자 자체가 초록/빨강으로 바뀐 차이를 놓쳤다.

단위 없는 정수형 다중 수치의 legacy Value Color 표현을 기존의 중립 숫자+필드색6px 원으로 복원했다. 공통 WallStatContent에서 실제 다중 값/숫자·단위/표현 설정으로 분기하며 UID·제목·ID 예외는 없다. 단일 값 REF148 Auto Fit·색, 단위 있는 값·명시 Background·Soft/Minimal·Mapping 문자열·Name/None은 유지한다. field 색은 그대로 원에 사용하고 상태 의미/데이터/쿼리/배치는 바꾸지 않는다.

현재 사용자3334를 같은 주소에서 갱신했다. 두 IAB 탭의 미저장0을 확인한 뒤 reload했고, 실제호스트 전체/실행/정지의 숫자색이 모두 rgb(20,34,57), 글자36px, 실행/정지의 원이 기존 green/red·6px임을 확인했다. 단일Mold OK에는 원이 없고 같은 Auto Fit 경로를 유지한다. 기존 Dashboard JSON 전체는 동일하다.

제품4파일: BigValue.tsx·StatCardPresentation.ts의 foreground 전달, WallStatContent.tsx의 이전 숫자/원 DOM 및 폭 예약, statReadout.ts의 원래6px 공통 토큰. statPresentation.test.tsx의 회귀 기대값을 사용자 직전 표현으로 고치고 단일 값/단위 지표와 구분하는 테스트를 추가했다. 관련3suites51tests, 대상Lint·빌드 통과. 제한TS 및 실제runtime checker 로그는 증거 디렉터리를 따른다. 다른 기능 전체 회귀로 확대하지 않는다.

동일소스 빌드를 검증한 새 runtime `coherent-stat149-restore`가 기존3334를 제공하며, 이전 `coherent-stat148`의 전체 DB 온라인 복사본·같은 설정/인증/포트를 사용했다. 기존 바이너리/정적파일을 덮어쓰지 않았으며 운영/3317/3321은 변경하지 않았다. 기존3334 backend만 교체했고 원본 Dashboard JSON 전체 동일을 비교했다.

증거: `/Users/hongwookryu/.codex/visualizations/2026/11/09/wall-stat-restore-ref149/`의 `host-restored.png`, `dashboard-restored.png`, `computed.json` 및 관련 로그.

REF149 최종: optional numeric 타입 선언을 바로잡아 제한 TypeScript 진단0을 확인한 뒤 같은 복원 JS assets로 재빌드했다. 현재3334는 `coherent-stat149-final`(PID47964)이며 중간restore는정지했다. 최종runtime checker/health200·전체DashboardJSON동일을확인했다. 사용자 화면에서 검증한 JS asset 경로와 최종 JS asset 경로가 모두 동일하므로 추가 강제갱신은하지않았다.

## REF-150 — 시각화 선택 목록 Stat 행 정렬 (2026-11-09)

원인은 `.wall-viz-catalog-item > span:first-of-type`이었다. 일반 img 다음 설명 span을 가정했지만 Stat의42도 span이어서 설명용 flex:1/column이 숫자 미리보기에 적용됐다. 실제 설명은 inline으로 남았다. 사용자 첨부와 같은 증상을 실제3334에서 재현했고,42영역이331.03px까지 늘어나 제목x702/설명x789에 놓이는 것을 측정했다.

`editor/WallVisualizationGallery.tsx`와 `editor/panelEditor.css` 두 파일만 표시 구조를 수정했다. 모든 항목에28px 아이콘 슬롯과 별도 설명 슬롯을 명시하고 위치 기반 selector를 제거했다. Stat42는 공통 compactMetric22px 토큰으로 같은 슬롯에 표시한다. native plugin/선택 callback·기존 Base UI Dialog/로컬 Button·명칭·설명·사용 중 배지는 유지한다. 실제Stat 렌더러/폰트/상태 원·단일AutoFit·쿼리/JSON/배치 파일은 수정하지 않았다.

실제 IAB1280px 화면에서 변경 후 Stat 아이콘28×28·제목과설명x399로 시계열/막대차트/게이지와 일치했다. 제목y328/설명y352로 기존20px제목+4px간격의 두 줄 구조가 복원됐다. 사용중과비선택,Light/Dark,현재Stat재선택→팝업닫힘/변경사항없음·편집기복귀dirty0을 확인했다. 임시검증탭은저장없이닫았다. 실제사용IAB2탭의미저장0확인후같은3334를갱신했고 호스트3/3/0 중립숫자36px·기존상태원유지를다시실측했다.

대상 ESLint·CSS PostCSS구문·동일소스backend/frontend빌드통과. 제한TS 및 실제runtimechecker 로그는 증거폴더를따른다. 단순표시수정에 구현을반복하는새테스트를추가하지않고실제DOM기하와선택동작을검증했다. 전체Dashboard저장JSON은이전runtime과동일하다.

현재3334 active runtime은 `~/Library/Application Support/ABLESTACK/WallPreview/coherent-gallery150-final/`(PID49952)이다. 기존coherent-stat149-final의전체DB온라인복사본과같은인증/설정/포트를사용하며서버소스는동일하다. 운영/3317/3321/다른개발환경은변경하지않았다. 중간coherent-gallery150는빌드만했으며실행하지않았다. 기존미커밋작업/index를보존했고혼합커밋없음.

증거: `/Users/hongwookryu/.codex/visualizations/2026/11/09/wall-gallery-ref150/` — before/dialog.png·metrics.json, after/dialog.png·dialog-dark.png·unselected.png/JSON·host-unchanged.json 및빌드/Lint/타입/checker로그.

## REF-153 - Larger existing Stat state dots (2026-11-09)

Explicit user request to improve legibility of the small state dots. Only common statReadout tokens and WallStatContent's existing marker size/space reservation changed. Dots use25% of rendered number size, rounded to integer pixels with7..10px bounds. Actual36px values now have9px markers instead of6px; compact22px values resolve to7px. The original8px gap, circular shape, eligibility, original field color and neutral number remain. No new markers on single values/units/mapped text/modern styles; no new state inference, query, model or layout changes.

Actual user editor tab and overview were refreshed only after the native status reported no changes. Browser measured36px numbers unchanged and green/red marker6->9px; actual values3/0 and native colors were identical before/after. Dark markers9px likewise use their original theme field colors. Small-number bound is the shared sizing rule, not a claim that every small panel was individually browser-tested. No resize or editor option changes were performed.

Modified product files: panels/statReadout.ts, panels/WallStatContent.tsx. Existing statPresentation.test.tsx expectation updated to9px. Related2suites47tests pass; target lint and targeted TS diagnostics0. Same-source backend/frontend build and runtime source/artifact/HTTP check pass. All44 persisted dashboards match prior runtime exactly. Current3334: coherent-dot153, PID86596, copied complete prior DB/config/authentication, unchanged backend source fingerprint. Old runtime retained/stopped by exact PID; production and other services unchanged. Existing index retained/no mixed commit.

Evidence: /Users/hongwookryu/.codex/visualizations/2026/11/09/wall-stat-dot-ref153/ with before/after editor and dashboard JSON metrics, actual Light/Dark screenshots, task-only changes.patch and test/build/check logs. Preview clip screenshots were discarded because the browser capture ignored the clip origin; full viewport screenshots are the visual proof.

## REF-164 — Single Stat alignment and available-size fitting (2026-11-10)

Compared the actual saved overview panels without editing JSON. Error log96 uses horizontal orientation, Auto justification/text, sum reduction, unit short, Value color and red thresholds. System VM17 uses Auto orientation, Center justification, lastNotNull and three query targets with existing overrides. Three targets do not imply three displayed values: this session returned one displayed4. Host3 currently has No Data; its multi-field appearance was not claimed as visually verified.

The settings difference exposed a Wall rendering defect: BigValue passed `centered` only for explicit Center. Its single Auto content inherited a row flex direction and lacked an explicit available body height. Separately, single Stat grid/horizontal repeater geometry reserved16px of list-scrollbar clearance even for a nonoverflowing single item. This reduced the fitting width and shifted its center. Neither thresholds nor the reducer caused the alignment difference.

Changed only the Wall single-readout path in BigValue.tsx, panels/WallStatContent.tsx, panels/statLayout.ts and VizRepeater.tsx. A single value now centers in its real body box and simple chart-free readouts use that body's height/column layout. Existing native auto-size ceiling, loaded-font text/unit fitting and explicit font sizes are reused. The existing Stat-only gridItemMinSize opt-in gates the horizontal clearance correction. Multi-item geometry/profiles/markers and native non-Wall paths remain unchanged. Orientation, Text/Color Mode, mappings, thresholds, query/reduction and formatting remain stored and used as before; no new state inference or decorations.

Actual Ego TaskSpace25 at isolated3334, 1378px desktop: error1 and VM4 both71.6667px with86px usable content height. Readout center offset is below0.01px in both axes. Short mapped OK is32.5619px in56×86; existing2.37years remains complete at18.4529px. Device81 retains UP15/DOWN0/IN15/OUT0 and36px values, matching the before snapshot. Dark dashboard and error editor preview use the same single layout. Preview fits337.5px to554×405 available content; at900px viewport it fits136.667px to761×164 after the existing responsive editor stacks. Screenshots were inspected at actual UI sizes. The preview's different size reflects its different content box, not a different color/alignment rule.

Limits: automated pointer Resize attempts did not commit a dimension change or produce dirty state; successful dashboard Resize/cancel is therefore unverified. No Grid change was made to bypass that limitation. Narrow/wide fitting was verified with actual editor viewport changes and a resize-prop regression test. Host3's unavailable data prevents an actual three-value visual comparison. No new save was performed; all45 persisted Dashboard JSON documents exactly match coherent-tabs163. Explicit sizing/modes/mapping/modern-style compatibility is covered by existing tests, not claimed as individually exercised UI options.

Validation:3 suites52 tests pass (statReadout, statLayout, statPresentation), including the new single Auto/size-change/multi-profile regression. The initial broad test invocation encountered linked-worktree deep import resolution; a programmatic invocation then lacked NODE_ENV=test. Final run explicitly maps local UI sources and sets NODE_ENV=test, and passes. Existing duplicate-mock warnings remain. Target ESLint, coherent backend/frontend build and source/artifact/HTTP checker pass. Build source is HEAD4dad0b48a235a8904be829c91fe0dd086a0a94a3 plus preserved worktree changes. Current3334 runtime is coherent-stat164-verified, PID8048, copied full prior DB/config/auth; prior runtime retained.3317 health/dashboard both200, existing3318 service unavailable and untouched. Production/backend version/auth settings were not changed. Existing staged/unstaged work preserved; no mixed commit.

Evidence: `/Users/hongwookryu/.codex/visualizations/2026/11/10/wall-stat-ref164/` — before.png, after.png, dark.png, editor-dark.png, editor-narrow.png, browser-metrics.json, multi-before.json and validation logs. resize.png is an unsuccessful input attempt, not Resize proof.
