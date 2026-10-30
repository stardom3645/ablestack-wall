import { KpiPosition, sameKpiLayout } from './kpiLayout';

interface LayoutEntry {
  before: KpiPosition[];
  after: KpiPosition[];
}
interface CommandEntry {
  undo: () => boolean;
  redo: () => boolean;
}
type Entry = LayoutEntry | CommandEntry;
interface Controller {
  apply: (items: KpiPosition[]) => boolean;
  validate: (items: unknown) => KpiPosition[] | undefined;
  blocked: () => boolean;
}
const copy = (items: KpiPosition[]) => items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));

/** In-memory, per-grid transaction history. Query/time/data state is never recorded. */
export function createLayoutHistory() {
  const histories = new Map<string, { past: Entry[]; future: Entry[]; baseline?: KpiPosition[] }>();
  const listeners = new Set<() => void>();
  let active: { key: string; controller: Controller } | undefined;
  let snapshot = { canUndo: false, canRedo: false, blocked: false };
  const history = (key: string) => {
    let value = histories.get(key);
    if (!value) {
      value = { past: [], future: [] };
      histories.set(key, value);
    }
    return value;
  };
  const publish = () => {
    const value = active ? history(active.key) : undefined;
    snapshot = {
      canUndo: Boolean(value?.past.length),
      canRedo: Boolean(value?.future.length),
      blocked: active?.controller.blocked() ?? false,
    };
    listeners.forEach((listener) => listener());
  };
  const replay = (direction: 'undo' | 'redo') => {
    if (!active || active.controller.blocked()) {
      return false;
    }
    const value = history(active.key);
    const from = direction === 'undo' ? value.past : value.future;
    const to = direction === 'undo' ? value.future : value.past;
    const entry = from[from.length - 1];
    if (
      !entry ||
      !('before' in entry
        ? active.controller.apply(copy(direction === 'undo' ? entry.before : entry.after))
        : entry[direction]())
    ) {
      return false;
    }
    from.pop();
    to.push(entry);
    publish();
    return true;
  };
  return {
    getSnapshot: () => snapshot,
    getBaseline(key: string) {
      const value = histories.get(key);
      return value && (value.past.length || value.future.length) && value.baseline ? copy(value.baseline) : undefined;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect(key: string, controller: Controller) {
      const value = history(key);
      const entries = [...value.past, ...value.future];
      // Insertion commands intentionally change membership. Earlier layouts
      // become valid again when the intervening command is undone.
      if (
        !entries.some((entry) => !('before' in entry)) &&
        entries.some(
          (entry) => 'before' in entry && (!controller.validate(entry.before) || !controller.validate(entry.after))
        )
      ) {
        value.past = [];
        value.future = [];
        value.baseline = undefined;
      }
      const connection = { key, controller };
      active = connection;
      publish();
      return () => {
        if (active === connection) {
          active = undefined;
          publish();
        }
      };
    },
    record(key: string, before: KpiPosition[], after: KpiPosition[], baseline = before) {
      if (sameKpiLayout(before, after)) {
        return;
      }
      const value = history(key);
      value.baseline ??= copy(baseline);
      value.past.push({ before: copy(before), after: copy(after) });
      if (value.past.length > 50) {
        value.past.shift();
      }
      value.future = [];
      publish();
    },
    recordCommand(key: string, command: CommandEntry) {
      const value = history(key);
      value.past.push(command);
      if (value.past.length > 50) {
        value.past.shift();
      }
      value.future = [];
      publish();
    },
    clear(key: string) {
      histories.delete(key);
      publish();
    },
    clearAll() {
      histories.clear();
      publish();
    },
    refresh: publish,
    undo: () => replay('undo'),
    redo: () => replay('redo'),
  };
}
export type LayoutHistory = ReturnType<typeof createLayoutHistory>;
