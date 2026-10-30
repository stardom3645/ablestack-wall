import { createLayoutHistory } from './layoutHistory';

const at = (y: number) => [{ i: '28', x: 0, y, w: 12, h: 54 }];
it('stores immutable transactions, skips no-ops and discards redo when branching', () => {
  const history = createLayoutHistory();
  const apply = jest.fn(() => true);
  history.connect('a', { apply, blocked: () => false, validate: (items) => items as ReturnType<typeof at> });
  const after = at(10);
  history.record('a', at(0), after);
  after[0].y = 99;
  history.record('a', at(10), at(10));
  expect(history.undo()).toBe(true);
  expect(apply).toHaveBeenLastCalledWith(at(0));
  expect(history.undo()).toBe(false);
  expect(history.redo()).toBe(true);
  expect(apply).toHaveBeenLastCalledWith(at(10));
  history.undo();
  history.record('a', at(0), at(20));
  expect(history.redo()).toBe(false);
  expect(history.getSnapshot()).toMatchObject({ canUndo: true, canRedo: false });
});
it('bounds history to 50 completed operations and protects active gestures', () => {
  const history = createLayoutHistory();
  let blocked = false;
  const apply = jest.fn(() => true);
  history.connect('a', { apply, blocked: () => blocked, validate: (items) => items as ReturnType<typeof at> });
  for (let y = 1; y <= 60; y++) {
    history.record('a', at(y - 1), at(y));
  }
  blocked = true;
  expect(history.undo()).toBe(false);
  expect(apply).not.toHaveBeenCalled();
  blocked = false;
  for (let i = 0; i < 50; i++) {
    expect(history.undo()).toBe(true);
  }
  expect(apply).toHaveBeenLastCalledWith(at(10));
  expect(history.undo()).toBe(false);
});

it('keeps movement history across insertion commands and replays both in chronological order', () => {
  const history = createLayoutHistory();
  let inserted = false;
  const apply = jest.fn(() => true);
  const controller = {
    apply,
    blocked: () => false,
    validate: (items: unknown) => (inserted ? undefined : (items as ReturnType<typeof at>)),
  };
  history.connect('a', controller);
  history.record('a', at(0), at(10));
  inserted = true;
  history.recordCommand('a', {
    undo: () => {
      inserted = false;
      return true;
    },
    redo: () => {
      inserted = true;
      return true;
    },
  });
  history.connect('a', controller);
  expect(history.undo()).toBe(true);
  expect(inserted).toBe(false);
  expect(history.undo()).toBe(true);
  expect(apply).toHaveBeenLastCalledWith(at(0));
  expect(history.redo()).toBe(true);
  expect(apply).toHaveBeenLastCalledWith(at(10));
  expect(history.redo()).toBe(true);
  expect(inserted).toBe(true);
});
