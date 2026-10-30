import { STORAGE_VM_DASHBOARD_UID } from '../statPresentation';

export const workspaceTabs = [
  { id: 'overview', label: '개요', rowId: 24, description: '가상머신의 핵심 자원과 서비스 상태를 확인합니다.' },
  {
    id: 'network',
    label: '네트워크',
    rowId: 178,
    description: 'NIC 연결 상태부터 수신·송신 트래픽과 프로토콜 지표까지 확인합니다.',
  },
  {
    id: 'storage',
    label: '스토리지',
    rowId: 196,
    description: '파일시스템과 디스크의 처리량, IOPS, 지연 시간을 확인합니다.',
  },
  {
    id: 'devices',
    label: 'Glue 디바이스',
    rowId: 136,
    description: '스토리지 디바이스별 사용률, PG 분포와 성능을 확인합니다.',
  },
  {
    id: 'processes',
    label: '프로세스',
    rowId: 210,
    description: '프로세스의 CPU, 메모리 및 읽기·쓰기 작업을 확인합니다.',
  },
] as const;

export type WorkspaceTab = (typeof workspaceTabs)[number]['id'];
export interface WorkspacePanel<T> {
  id: number;
  presentationId?: number;
  title: string;
  type: string;
  width: number;
  height: number;
  model: T;
}
export interface WorkspaceGroup<T> {
  rowId: number;
  panels: Array<WorkspacePanel<T>>;
}

export const overviewSections = {
  resources: [28, 30, 34, 36],
  usage: [32, 38, 40],
  storage: [138, 8],
  services: [242, 241, 237, 239, 251, 240, 236, 250],
  trends: [140, 142, 144, 146],
};

export function selectedWorkspaceTab(search: string): WorkspaceTab {
  const value = new URLSearchParams(search).get('wallTab');
  return workspaceTabs.find((tab) => tab.id === value)?.id ?? 'overview';
}

// Keep the existing renderer stable during native edit/view routes; only its body changes.
export function usesStorageWorkspaceRenderer(uid: string | undefined, forceOld: boolean) {
  return uid === STORAGE_VM_DASHBOARD_UID && !forceOld;
}

/** Match source rows by ID, never by translated title; preserve unrecognised rows/panels. */
export function panelsForTab<T>(groups: Array<WorkspaceGroup<T>>, tab: WorkspaceTab) {
  const definition = workspaceTabs.find((item) => item.id === tab)!;
  if (tab !== 'overview') {
    return groups.filter((group) => group.rowId === definition.rowId).flatMap((group) => group.panels);
  }
  const detailIds = new Set<number>(workspaceTabs.filter((item) => item.id !== 'overview').map((item) => item.rowId));
  return groups.filter((group) => !detailIds.has(group.rowId)).flatMap((group) => group.panels);
}
