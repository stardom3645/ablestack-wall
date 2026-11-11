import { SceneObjectStateChangedEvent } from '@grafana/scenes';
import { Dashboard } from '@grafana/schema';
import { CorsWorker } from 'app/core/utils/CorsWorker';
import * as createDetectChangesWorker from 'app/features/dashboard-scene/saving/createDetectChangesWorker';

import { DashboardScene } from '../scene/DashboardScene';

import { DashboardSceneChangeTracker } from './DashboardSceneChangeTracker';

jest.mock('../serialization/transformSceneToSaveModel', () => {
  return {
    transformSceneToSaveModel: () => {
      return {
        title: 'updated dashboard',
        invalidProp: () => 'function',
      };
    },
  };
});

describe('DashboardSceneChangeTracker', () => {
  it('drops queued comparisons on cancel and starts the next edit with a fresh worker', () => {
    const first = { onmessage: null, terminate: jest.fn() };
    const second = { onmessage: null, terminate: jest.fn() };
    const factory = jest
      .spyOn(createDetectChangesWorker, 'createWorker')
      .mockReturnValueOnce(first as unknown as CorsWorker)
      .mockReturnValueOnce(second as unknown as CorsWorker);
    const unsubscribe = jest.fn();
    const changeTracker = new DashboardSceneChangeTracker({
      subscribeToEvent: jest.fn().mockReturnValue({ unsubscribe }),
    } as unknown as DashboardScene);
    changeTracker.startTrackingChanges();
    expect(first.onmessage).not.toBeNull();
    changeTracker.stopTrackingChanges();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(first.onmessage).toBeNull();
    expect(first.terminate).toHaveBeenCalledTimes(1);
    changeTracker.startTrackingChanges();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(second.onmessage).not.toBeNull();
    changeTracker.terminate();
    expect(second.terminate).toHaveBeenCalledTimes(1);
  });

  it('should set _changesWorker to undefined when terminate is called', () => {
    const terminate = jest.fn();
    jest.spyOn(createDetectChangesWorker, 'createWorker').mockImplementation(
      () =>
        ({
          terminate,
        }) as unknown as CorsWorker
    );
    const changeTracker = new DashboardSceneChangeTracker({
      subscribeToEvent: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    } as unknown as DashboardScene);
    changeTracker.startTrackingChanges();

    expect(changeTracker['_changesWorker']).not.toBeUndefined();
    changeTracker.terminate();
    expect(changeTracker['_changesWorker']).toBeUndefined();
  });

  it('should remove non clonable properties before sending to worker', () => {
    const scene = new DashboardScene({});
    const postMessage = jest.fn();

    jest.spyOn(createDetectChangesWorker, 'createWorker').mockImplementation(() => {
      return {
        postMessage,
      } as unknown as CorsWorker;
    });
    jest.spyOn(DashboardSceneChangeTracker, 'isUpdatingPersistedState').mockImplementation(() => {
      return true;
    });
    jest.spyOn(scene, 'getInitialSaveModel').mockReturnValue({
      title: 'initial dashboard',
      invalidProp: () => 'function',
    } as unknown as Dashboard);

    const changeTracker = new DashboardSceneChangeTracker(scene);
    changeTracker.startTrackingChanges();

    scene.publishEvent({ type: SceneObjectStateChangedEvent.type, payload: { a: 1 } });

    expect(postMessage).toHaveBeenCalledWith({
      initial: { title: 'initial dashboard' },
      changed: { title: 'updated dashboard' },
    });
  });
});
