import { act, render, screen } from '@testing-library/react';

import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { transformSceneToSaveModel } from 'app/features/dashboard-scene/serialization/transformSceneToSaveModel';

import { WallEditingProvider, useWallEditing } from './WallEditContext';
import { KpiPosition } from './kpiLayout';

const key = 'wall-modern:kpi-layout:v1:aec03x1adsi68f:1:1:storage';
const region = ':storage';
const at = (h: number): KpiPosition[] => [{ i: '1', x: 0, y: 0, w: 48, h }];
function Probe({ height }: { height: number }) {
  const editing = useWallEditing()!;
  return <output>{JSON.stringify({ saved: editing.saved(key, at(height)), draft: editing.draft(key) })}</output>;
}

beforeEach(() => localStorage.clear());

it.each(['untouched', 'server', 'legacy', 'draft'])(
  'updates late content heights only for untouched defaults, preserving the %s baseline',
  (mode) => {
    const scene = new DashboardScene({
      uid: 'aec03x1adsi68f',
      title: 'Wall',
      meta: { canEdit: true },
      ...(mode === 'server' ? { wallModern: { version: 1 as const, layouts: { [region]: at(160) }, texts: {} } } : {}),
    });
    scene.setInitialSaveModel(transformSceneToSaveModel(scene));
    if (mode === 'legacy') {
      localStorage.setItem(key, JSON.stringify({ version: 1, items: at(160) }));
    }
    const view = (height: number) => (
      <WallEditingProvider dashboard={scene}>
        <Probe height={height} />
      </WallEditingProvider>
    );
    const { rerender } = render(view(160));
    if (mode === 'draft') {
      act(() => scene.setState({ wallModern: { version: 1, layouts: { [region]: at(57) }, texts: {} } }));
    }
    rerender(view(92));
    const value = JSON.parse(screen.getByRole('status').textContent!);
    expect(value.saved).toEqual(at(mode === 'untouched' ? 92 : 160));
    if (mode === 'draft') {
      expect(value.draft).toEqual(at(57));
    }
    expect(scene.state.isDirty).toBeFalsy();
  }
);
