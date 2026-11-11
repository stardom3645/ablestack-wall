import { useEffect, useRef } from 'react';

import type { Monaco, MonacoEditor, CodeEditorMonacoOptions } from '@grafana/ui';

/** Same Monaco engine and modified model as CodeEditor; only the baseline model is owned here. */
export function WallJsonDiff({
  monaco,
  editor,
  original,
  readOnly,
  active,
  options,
  onFocus,
  onSummary,
}: {
  monaco: Monaco;
  editor: MonacoEditor;
  original: string;
  readOnly: boolean;
  active: boolean;
  options: CodeEditorMonacoOptions;
  onFocus: (editor: MonacoEditor) => void;
  onSummary: (summary: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const focus = useRef(onFocus);
  focus.current = onFocus;
  const summary = useRef(onSummary);
  summary.current = onSummary;
  const instance = useRef<ReturnType<Monaco['editor']['createDiffEditor']>>();
  useEffect(() => {
    if (!host.current || !editor.getModel()) {
      return;
    }
    const baseline = monaco.editor.createModel(original, 'json');
    const diff = monaco.editor.createDiffEditor(host.current, {
      ...options,
      readOnly,
      originalEditable: false,
      renderSideBySide: false,
      ignoreTrimWhitespace: false,
      renderIndicators: true,
      enableSplitViewResizing: true,
    });
    instance.current = diff;
    diff.setModel({ original: baseline, modified: editor.getModel()! });
    const subscriptions = [
      diff.getOriginalEditor().onDidFocusEditorWidget(() => focus.current(diff.getOriginalEditor())),
      diff.getModifiedEditor().onDidFocusEditorWidget(() => focus.current(diff.getModifiedEditor())),
      diff.getOriginalEditor().onDidChangeCursorSelection(() => focus.current(diff.getOriginalEditor())),
      diff.getModifiedEditor().onDidChangeCursorSelection(() => focus.current(diff.getModifiedEditor())),
      diff.onDidUpdateDiff(() => {
        const changes = diff.getLineChanges();
        if (!changes) {
          return;
        }
        let added = 0,
          removed = 0;
        changes.forEach((change) => {
          if (change.originalEndLineNumber) {
            removed += change.originalEndLineNumber - change.originalStartLineNumber + 1;
          }
          if (change.modifiedEndLineNumber) {
            added += change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
          }
        });
        summary.current(changes.length ? `추가 ${added}줄 · 삭제 ${removed}줄` : '텍스트 변경 없음');
      }),
    ];
    const resize = new ResizeObserver(() => {
      if (!host.current?.clientWidth || !host.current.clientHeight) {
        return;
      }
      diff.updateOptions({ renderSideBySide: host.current.clientWidth >= 900 });
      diff.layout({ width: host.current.clientWidth, height: host.current.clientHeight });
    });
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      subscriptions.forEach((sub) => sub.dispose());
      diff.dispose();
      baseline.dispose();
      instance.current = undefined;
    };
    // Baseline/source and editor are immutable during this workspace session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, editor, original]);
  useEffect(() => {
    instance.current?.updateOptions({ readOnly });
  }, [readOnly]);
  useEffect(() => {
    if (active && instance.current) {
      focus.current(instance.current.getModifiedEditor());
    }
  }, [active]);
  return <div className="wall-json-diff" ref={host} aria-label="원본과 수정본 JSON 비교" />;
}
