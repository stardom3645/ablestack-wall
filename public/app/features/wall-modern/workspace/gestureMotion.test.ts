import { fireEvent } from '@testing-library/react';

import { finishPanelMove, frameMouseInput } from './gestureMotion';

afterEach(() => jest.restoreAllMocks());

it('finishes only a moving tile transform before the existing drop measurement', () => {
  const moving = document.createElement('div');
  const resizing = document.createElement('div');
  const neighbour = document.createElement('div');
  moving.dataset.wallMagnet = 'move';
  resizing.dataset.wallMagnet = 'resize';
  const transform = { transitionProperty: 'transform', playState: 'running', finish: jest.fn() };
  const opacity = { transitionProperty: 'opacity', playState: 'running', finish: jest.fn() };
  const content = { playState: 'running', finish: jest.fn() };
  const finished = { transitionProperty: 'transform', playState: 'finished', finish: jest.fn() };
  for (const node of [moving, resizing, neighbour]) {
    Object.defineProperty(node, 'getAnimations', { value: () => [transform, opacity, content, finished] });
  }
  finishPanelMove([moving, resizing, neighbour]);
  expect(transform.finish).toHaveBeenCalledTimes(1);
  expect(opacity.finish).not.toHaveBeenCalled();
  expect(content.finish).not.toHaveBeenCalled();
  expect(finished.finish).not.toHaveBeenCalled();
});

it('keeps the instant path when there is no compositor animation API', () => {
  const node = document.createElement('div');
  node.dataset.wallMagnet = 'move';
  Object.defineProperty(node, 'getAnimations', { value: undefined });
  expect(() => finishPanelMove([node])).not.toThrow();
});

it('coalesces samples into one native movement per frame and flushes release before commit', () => {
  let paint: FrameRequestCallback = () => {};
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 7;
  });
  const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const order: string[] = [];
  const nativeMove = (e: MouseEvent) => order.push(`move:${e.clientX}`);
  const nativeUp = () => order.push('commit');
  document.addEventListener('mousemove', nativeMove);
  document.addEventListener('mouseup', nativeUp);
  const dispose = frameMouseInput(document, () => order.push('release'));
  try {
    for (let x = 1; x <= 40; x++) {
      fireEvent.mouseMove(document, { buttons: 1, clientX: x });
    }
    expect(order).toEqual([]);
    paint(16);
    expect(order).toEqual(['move:40']);
    fireEvent.mouseMove(document, { buttons: 1, clientX: 60 });
    fireEvent.mouseUp(document);
    expect(order).toEqual(['move:40', 'move:60', 'release', 'commit']);
    expect(cancel).toHaveBeenCalledWith(7);
    fireEvent.mouseMove(document, { buttons: 1, clientX: 80 });
    dispose();
    paint(32);
    expect(order).not.toContain('move:80');
  } finally {
    dispose();
    document.removeEventListener('mousemove', nativeMove);
    document.removeEventListener('mouseup', nativeUp);
  }
});
