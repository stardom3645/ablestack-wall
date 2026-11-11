import { CheckCircle2, ChevronDown, CircleAlert, PanelLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ClipboardButton, CodeEditor, Monaco, MonacoEditor, useTheme2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';

import { panelScrollTokens } from '../../../../../packages/grafana-ui/src/components/PanelScrollArea/PanelScrollArea';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { wallSurfaceTokens } from '../surfaceTokens';
import { wallEditorFontFamily, wallEditorTypography } from '../typography';
import { Button } from '../ui';

import { WallJsonDiff } from './WallJsonDiff';
import { WallJsonOutline } from './WallJsonOutline';
import { JsonSymbol } from './jsonOutline';
import { inspectJsonSyntax } from './jsonWorkspace';

export function WallJsonWorkspace({
  text,
  original,
  readOnly,
  error,
  onChange,
  onRestore,
  onApply,
}: {
  text: string;
  original: string;
  readOnly: boolean;
  error?: string;
  onChange: (text: string) => void;
  onRestore: () => void;
  onApply: () => void;
}) {
  const theme = useTheme2();
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [path, setPath] = useState('');
  const workbench = useRef<HTMLDivElement>(null);
  const outlineToggle = useRef<HTMLElement>(null);
  const [view, setView] = useState('code');
  const [compared, setCompared] = useState(false);
  const [engine, setEngine] = useState<{ monaco: Monaco; editor: MonacoEditor }>();
  const [cursor, setCursor] = useState({ line: 1, column: 1, selected: 0 });
  const [marker, setMarker] = useState<{ line: number; column: number; message: string }>();
  const [diffSummary, setDiffSummary] = useState('');
  const active = useRef<MonacoEditor>();
  const ownedEditor = useRef<MonacoEditor>();
  const errorFocus = useRef<{ line: number; column: number }>();
  const subscriptions = useRef<Array<{ dispose: () => void }>>([]);
  const syntax = useMemo(() => inspectJsonSyntax(text), [text]);
  const changed = text !== original;
  const panelError =
    !readOnly && !syntax.error && (!syntax.value || typeof syntax.value !== 'object' || Array.isArray(syntax.value))
      ? '패널 JSON은 객체여야 합니다.'
      : undefined;
  const problem = syntax.error || panelError || error;
  const position = syntax.line ? { line: syntax.line, column: syntax.column ?? 1 } : marker;
  const options = useMemo(
    () => ({
      fontSize: wallEditorTypography.body.size,
      lineHeight: wallEditorTypography.body.line,
      fontFamily: `${theme.typography.fontFamilyMonospace}, ${wallEditorFontFamily}`,
      tabSize: 2,
      lineNumbersMinChars: 3,
      padding: { top: wallSurfaceTokens.compactPadding, bottom: wallSurfaceTokens.compactPadding },
      insertSpaces: true,
      folding: true,
      bracketPairColorization: { enabled: true },
      matchBrackets: 'always' as const,
      renderLineHighlight: 'line' as const,
      scrollBeyondLastLine: false,
      scrollbar: { verticalScrollbarSize: panelScrollTokens.rail, horizontalScrollbarSize: panelScrollTokens.rail },
      minimap: { enabled: false },
      contextmenu: true,
      find: { addExtraSpaceOnTop: false },
    }),
    [theme]
  );
  const observe = (editor: MonacoEditor) => {
    active.current = editor;
    const update = () => {
      const point = editor.getPosition(),
        selection = editor.getSelection();
      if (point) {
        setCursor({
          line: point.lineNumber,
          column: point.column,
          selected: selection ? (editor.getModel()?.getValueInRange(selection).length ?? 0) : 0,
        });
      }
    };
    update();
  };
  const mount = (editor: MonacoEditor, monaco: Monaco) => {
    ownedEditor.current = editor;
    setEngine({ editor, monaco });
    observe(editor);
    subscriptions.current.push(editor.onDidChangeCursorSelection(() => observe(editor)));
    subscriptions.current.push(editor.onDidFocusEditorWidget(() => observe(editor)));
    const model = editor.getModel();
    const markers = () => {
      const next =
        model &&
        monaco.editor
          .getModelMarkers({ resource: model.uri })
          .find((item) => item.severity === monaco.MarkerSeverity.Error);
      setMarker(next ? { line: next.startLineNumber, column: next.startColumn, message: next.message } : undefined);
    };
    subscriptions.current.push(
      monaco.editor.onDidChangeMarkers((resources) => {
        if (resources.some((uri) => uri.toString() === model?.uri.toString())) {
          markers();
        }
      })
    );
    markers();
  };
  useEffect(
    () => () => {
      subscriptions.current.forEach((sub) => sub.dispose());
      subscriptions.current = [];
    },
    []
  );
  const action = (id: string) => {
    const editor = view === 'code' ? engine?.editor : (active.current ?? engine?.editor);
    editor?.focus();
    void editor?.getAction(id)?.run();
  };
  const focusError = () => {
    const point = errorFocus.current,
      editor = ownedEditor.current;
    if (!point || !editor) {
      return;
    }
    errorFocus.current = undefined;
    editor.setPosition({ lineNumber: point.line, column: point.column });
    editor.revealLineInCenter(point.line);
    editor.focus();
  };
  useEffect(() => {
    if (view === 'code') {
      focusError();
    }
  }, [view]);
  const jumpToError = () => {
    if (!position || !engine) {
      return;
    }
    errorFocus.current = { line: position.line, column: position.column };
    if (view !== 'code') {
      setView('code');
    } else {
      focusError();
    }
  };
  const restore = () => {
    const editor = engine?.editor,
      model = editor?.getModel();
    if (editor && model) {
      editor.pushUndoStop();
      editor.executeEdits('wall-json-restore', [{ range: model.getFullModelRange(), text: original }]);
      editor.pushUndoStop();
    }
    onRestore();
  };
  useEffect(() => {
    const host = workbench.current;
    if (!host) {
      return;
    }
    let width = 0;
    const resize = new ResizeObserver(() => {
      if (host.clientWidth && host.clientWidth !== width) {
        width = host.clientWidth;
        if (width < 480) {
          setOutlineOpen(false);
        }
      }
    });
    resize.observe(host);
    return () => resize.disconnect();
  }, []);
  const selectSymbol = (symbol: JsonSymbol, names: string[]) => {
    setPath(names.join(' › '));
    const reveal = () => {
      const editor = engine?.editor;
      if (!editor) {
        return;
      }
      const point = { lineNumber: symbol.selectionRange.startLineNumber, column: symbol.selectionRange.startColumn };
      editor.setPosition(point);
      editor.revealPositionInCenter(point);
      editor.focus();
    };
    if (view !== 'code') {
      setView('code');
      requestAnimationFrame(reveal);
    } else {
      reveal();
    }
  };
  const unmount = () => {
    const model = ownedEditor.current?.getModel();
    ownedEditor.current = undefined;
    // Native wrapper keeps models by default. Dispose only this workspace's model,
    // after the shared Diff editor has released it during the same unmount.
    queueMicrotask(() => {
      if (model && !model.isDisposed()) {
        model.dispose();
      }
    });
  };
  return (
    <div ref={setPortalHost} className="wall-inspector-json-workspace">
      <div className="wall-json-commandbar">
        <Tabs
          value={view}
          onValueChange={(value) => {
            setView(String(value));
            if (value === 'code' && engine) {
              observe(engine.editor);
            }
            if (value === 'diff') {
              setCompared(true);
            }
          }}
        >
          <TabsList variant="line" aria-label="JSON 작업 모드">
            <TabsTrigger value="code">
              <Trans i18nKey="wall.wall-json-workspace.text-e94a043c">코드</Trans>
            </TabsTrigger>
            {!readOnly && (
              <TabsTrigger value="diff" disabled={!engine}>
                <Trans i18nKey="wall.wall-json-workspace.text-81b94d3d">변경 비교</Trans>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        <div className="wall-json-tools" role="group" aria-label="JSON 탐색 도구">
          <Button
            ref={outlineToggle}
            size="sm"
            variant="ghost"
            disabled={!engine}
            aria-pressed={outlineOpen}
            aria-controls="wall-json-structure"
            onClick={() => setOutlineOpen((value) => !value)}
          >
            <PanelLeft size={15} />
            <Trans i18nKey="wall.wall-json-workspace.text-090a643c">구조</Trans>
          </Button>
          <Button size="sm" variant="ghost" disabled={!engine} onClick={() => action('actions.find')}>
            <Trans i18nKey="wall.wall-json-workspace.text-68819ee9">찾기</Trans>
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button size="sm" variant="ghost" disabled={!engine}>
                  <Trans i18nKey="wall.wall-json-workspace.text-ed182fa7">편집 도구</Trans>
                  <ChevronDown size={14} />
                </Button>
              }
            />
            <PopoverContent portalContainer={portalHost} className="wall-json-tool-menu" aria-label="JSON 편집 도구">
              <Button size="sm" variant="ghost" onClick={() => action('editor.action.quickOutline')}>
                <Trans i18nKey="wall.wall-json-workspace.text-49ee6410">기호로 이동</Trans>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => action('editor.foldAll')}>
                <Trans i18nKey="wall.wall-json-workspace.text-4274646a">모두 접기</Trans>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => action('editor.unfoldAll')}>
                <Trans i18nKey="wall.wall-json-workspace.text-2225f1f1">모두 펼치기</Trans>
              </Button>
              <ClipboardButton
                size="sm"
                variant="secondary"
                disabled={!cursor.selected}
                getText={() => {
                  const editor = active.current,
                    selection = editor?.getSelection();
                  return selection ? (editor?.getModel()?.getValueInRange(selection) ?? '') : '';
                }}
              >
                <Trans i18nKey="wall.wall-json-workspace.text-c8c48b27">선택 복사</Trans>
              </ClipboardButton>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="wall-json-workbench-grid" ref={workbench} data-outline-open={outlineOpen || undefined}>
        <div id="wall-json-structure" hidden={!outlineOpen} className="wall-json-structure-host">
          {engine && (
            <WallJsonOutline
              editor={engine.editor}
              monaco={engine.monaco}
              onSelect={selectSymbol}
              onPathChange={setPath}
              onCollapse={() => {
                setOutlineOpen(false);
                outlineToggle.current?.focus();
              }}
              onFallback={() => action('editor.action.quickOutline')}
            />
          )}
        </div>
        <div className="wall-json-editor-surface">
          <div className="wall-json-code" hidden={view !== 'code'} role="tabpanel" aria-label="JSON 코드">
            <CodeEditor
              containerStyles="wall-json-monaco"
              width="100%"
              height="100%"
              language="json"
              showLineNumbers
              showMiniMap={false}
              value={text}
              readOnly={readOnly}
              monacoOptions={options}
              onChange={(value) => {
                setMarker(undefined);
                onChange(value);
              }}
              onEditorDidMount={mount}
              onEditorWillUnmount={unmount}
            />
          </div>
          {compared && engine && (
            <div className="wall-json-compare" hidden={view !== 'diff'} role="tabpanel" aria-label="JSON 변경 비교">
              <WallJsonDiff
                monaco={engine.monaco}
                editor={engine.editor}
                original={original}
                readOnly={readOnly}
                active={view === 'diff'}
                options={options}
                onFocus={observe}
                onSummary={setDiffSummary}
              />
            </div>
          )}
        </div>
      </div>
      {problem && (
        <div className="wall-json-validation" data-invalid aria-live="polite">
          <strong>
            <Trans i18nKey="wall.wall-json-workspace.text-ddff578b">JSON 확인 필요</Trans>
            {position && ` · ${position.line}행 ${position.column}열`}
          </strong>
          <p>{problem}</p>
          {position && (
            <Button size="sm" variant="ghost" onClick={jumpToError}>
              <Trans i18nKey="wall.wall-json-workspace.text-947448ec">오류 위치로 이동</Trans>
            </Button>
          )}
        </div>
      )}
      <footer className="wall-json-footer">
        <div className="wall-json-status">
          <span title={path || undefined}>
            {cursor.line}
            <Trans i18nKey="wall.wall-json-workspace.text-a81eb0f2">행 · </Trans>
            {cursor.column}
            <Trans i18nKey="wall.wall-json-workspace.text-cfc1e124">열</Trans>
            {cursor.selected ? ` · ${cursor.selected}자 선택` : ''}
            {path ? ` · ${path}` : ''}
          </span>
          <span className="wall-json-source-note">{readOnly ? '읽기 전용' : '편집 가능'}</span>
          <span className="wall-json-document-state" data-changed={changed || undefined}>
            {changed ? '변경 사항 있음' : '변경 없음'}
          </span>
          <span className="wall-json-syntax" data-invalid={Boolean(problem) || undefined}>
            {view === 'code' &&
              (problem ? <CircleAlert size={14} /> : <CheckCircle2 size={14} color={theme.colors.success.text} />)}
            {problem ? 'JSON 확인 필요' : 'JSON 문법 오류 없음'}
          </span>
          {view === 'diff' && <span>{diffSummary || '비교 계산 중'}</span>}
        </div>
        {!readOnly && (
          <div className="wall-json-change-actions">
            <div className="wall-json-apply">
              <Button size="sm" variant="ghost" disabled={!changed} onClick={restore}>
                <Trans i18nKey="wall.wall-json-workspace.text-c227ad8d">원본 복원</Trans>
              </Button>
              <Button size="sm" variant="default" disabled={!changed || Boolean(problem)} onClick={onApply}>
                <Trans i18nKey="wall.wall-json-workspace.text-e01dd02f">적용</Trans>
              </Button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
