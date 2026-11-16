# Wall 패널 이동 모션 — REF-194

2026-11-16. 현재 위치 결정 체계를 고정하고 화면의 이동 전환만 개선했다.

## 원인과 수정

기존 `[data-wall-magnet]`에는 `transition: none !important`가 적용되어, rAF로 입력을 병합해도 확정된 Grid 칸 사이를 화면이 즉시 점프했다. 이것을 실제 제품의 낮은 FPS 측정 결과로 단정하지 않는다.

- `motion.css` / `workspace/kpiLayout.css`: 이동 중인 타일에만64ms transform 전환과 기존 Grid easing을 적용한다. 새로운 JS 프레임 루프·관성·raw pointer 보간은 없다. 이웃180ms·놓기140ms·빗금280ms는 유지한다.
- `workspace/gestureMotion.ts`: release rect 측정 전에 이동 타일의 실행 중인 transform CSS transition만 끝낸다. 다른 속성·차트·Resize·이웃 애니메이션은 종료하지 않는다.
- `workspace/PanelLayoutGrid.tsx`: 기존 mouse release 및 touch stop 측정 지점에서 위 표시 전환만 완료한다. preview 확정·저장·Undo·취소는 원래 코드를 유지한다.
- 모션 감소 설정에서는 전환을 끈다. 종료/abort/unmount에서 기존 attribute·DOM 정리에 따라 compositor hint도 해제된다.

## 이동 체계 보존 증거

다음 파일은 작업 전과 바이트가 같다: `layoutMovement.ts`, `panelGeometry.ts`, `kpiLayout.ts`, `wallDocument.ts`. `PanelLayoutGrid`의 `applyMove` / `applyResize` 계산 함수도 변경 전과 동일하다.48열·흡착 거리·교환/충돌·6px 의도·rAF 입력 병합을 변경하지 않았다. Git index와 기존 다른 작업을 보존했다.

Ego의 종합 대시보드23개 타일에서 같은 입력 경로를 변경 전후 재생했다. 저장하지 않고 시험 후 Undo와 선택 해제로 복원했다.

| 조건           | 실제 확인                                                                              |
| -------------- | -------------------------------------------------------------------------------------- |
| 단일 이동      | 23개 전체 타일의 시작·최종 transform/width/height가 변경 전후 동일                     |
| 놓는 위치      | 변경 전후 모두 `x397 / y213 / width101 / height144`인 동일한 drop preview              |
| 다중 이동      | 실제2개 선택 후 같은 경로 재생, 전체 타일 시작·최종 위치가 변경 전후 동일              |
| 화면 전환      | 단일/다중 각각8회 표본 중6회에서 transform CSS transition 실행 확인, 적용 duration64ms |
| Reduced motion | 모든 표본 transition0초·실행 중 전환0개                                                |
| 종료/Undo      | interacting=false, 원래 배치로 Undo 후 변경 취소 버튼 없음                             |

입력 경로는 브라우저에서 스크립트로 재생한 검증이다. 자동화 탭의 rAF가 약1Hz로 제한되는 현상도 관찰되어, 이 결과를 실제 제품 FPS나 물리 마우스의 성능 수치로 보고하지 않는다. 전체 대시보드·브라우저·하드웨어의 장시간 성능 검증은 수행하지 않았다.

## 테스트와 로컬 반영

- 모션·입력 병합·위치 계산·패널 액션 관련3 suites /30 tests 통과, 변경 TS/TSX ESLint 오류0.
- 기존 `kpiLayout.test.tsx`16개 중6개 실패는 변경 전 frozen source에서도 동일하게 재현된다. 이번 작업에서 기존 계산이나 테스트를 고쳐 실패를 숨기지 않았다.
- Production webpack 성공, 기존 크기 경고2개. 새 의존성·UI 기능은 없다.
- 로컬3334 `coherent-motion194-20261116`에 반영했다. 동일 Grafana11.4.0-pre 백엔드를 사용하며 health200·Prometheus OK. 주요9개 테이블의 전체 행 해시와 migration709건을 반영 전후 보존했다. 운영 서비스·운영 DB·3317/3318은 변경하지 않았다.

변경 전후 표본·원시 테스트 로그·기하 보존 해시·실행 정합성은 해당 runtime의 `validation/`에 보존한다. 커밋·푸시는 수행하지 않았다.
