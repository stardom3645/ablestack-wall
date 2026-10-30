import { Redo2, Undo2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { Button } from '../ui';
import { useLayoutHistory } from '../workspace/LayoutHistoryContext';
import { LayoutHistory } from '../workspace/layoutHistory';

export function WallLayoutHistoryControls() {
  const history = useLayoutHistory();
  return history ? <BoundHistoryControls history={history} /> : null;
}
function BoundHistoryControls({ history }: { history: LayoutHistory }) {
  const { canUndo, canRedo, blocked } = useSyncExternalStore(
    history.subscribe,
    history.getSnapshot,
    history.getSnapshot
  );
  if (!canUndo && !canRedo) {
    return null;
  }
  return (
    <div className="wall-toolbar-group" role="group" aria-label="배치 편집 기록">
      <Button
        className="wall-toolbar-control wall-toolbar-icon"
        size="icon"
        variant="outline"
        disabled={!canUndo || blocked}
        onClick={history.undo}
        aria-label="실행 취소"
        aria-keyshortcuts="Control+z Meta+z"
        title="실행 취소 (Ctrl/Cmd+Z)"
      >
        <Undo2 size={16} />
      </Button>
      <Button
        className="wall-toolbar-control wall-toolbar-icon"
        size="icon"
        variant="outline"
        disabled={!canRedo || blocked}
        onClick={history.redo}
        aria-label="다시 실행"
        aria-keyshortcuts="Control+Shift+z Meta+Shift+z Control+y"
        title="다시 실행 (Ctrl/Cmd+Shift+Z)"
      >
        <Redo2 size={16} />
      </Button>
    </div>
  );
}
