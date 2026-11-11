import { ChevronDown, ChevronRight, PanelLeftClose } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Monaco, MonacoEditor } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';

import { PanelScrollArea } from '../../../../../packages/grafana-ui/src/components/PanelScrollArea/PanelScrollArea';
import { Button } from '../ui';

import { JsonSymbol, jsonSymbolPathAt, nativeJsonSymbols } from './jsonOutline';

export function WallJsonOutline({
  editor,
  monaco,
  onSelect,
  onFallback,
  onCollapse,
  onPathChange,
}: {
  editor: MonacoEditor;
  monaco: Monaco;
  onSelect: (symbol: JsonSymbol, path: string[]) => void;
  onFallback: () => void;
  onCollapse: () => void;
  onPathChange: (path: string) => void;
}) {
  const [symbols, setSymbols] = useState<JsonSymbol[]>([]);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState(editor.getPosition());
  const currentPath = position ? jsonSymbolPathAt(symbols, position) : [];
  const selected = currentPath[currentPath.length - 1];
  const currentPathLabel = currentPath.map((symbol) => symbol.name).join(' › ');
  useEffect(() => {
    const cursor = editor.onDidChangeCursorPosition(({ position }) => setPosition(position));
    return () => cursor.dispose();
  }, [editor]);
  useEffect(() => onPathChange(currentPathLabel), [currentPathLabel, onPathChange]);
  useEffect(() => {
    let disposed = false;
    let request: InstanceType<Monaco['CancellationTokenSource']> | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      request?.cancel();
      request?.dispose();
      const next = new monaco.CancellationTokenSource();
      request = next;
      void nativeJsonSymbols(editor, next.token)
        .then((result) => {
          if (!disposed && !next.token.isCancellationRequested) {
            setSymbols(result);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!disposed && !next.token.isCancellationRequested) {
            setFailed(true);
          }
        });
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };
    const change = editor.onDidChangeModelContent(schedule);
    // Language support is loaded lazily by the existing engine.
    refresh();
    timer = setTimeout(refresh, 400);
    return () => {
      disposed = true;
      clearTimeout(timer);
      change.dispose();
      request?.cancel();
      request?.dispose();
    };
  }, [editor, monaco]);
  const render = (items: JsonSymbol[], path: string[] = []) => (
    <ul>
      {items.map((item, index) => {
        const names = [...path, item.name];
        const id = `${item.range.startLineNumber}:${item.range.startColumn}:${index}`;
        const open = expanded.has(id);
        return (
          <li key={id}>
            <div
              className="wall-json-outline-row"
              data-selected={selected === item || undefined}
              style={{ paddingInlineStart: `calc(${Math.min(path.length, 4)} * var(--wall-card-gap))` }}
            >
              {item.children?.length ? (
                <button
                  type="button"
                  aria-label={`${item.name} ${open ? '접기' : '펼치기'}`}
                  aria-expanded={open}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (open) {
                        next.delete(id);
                      } else {
                        next.add(id);
                      }
                      return next;
                    })
                  }
                >
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="wall-json-outline-spacer" />
              )}
              <button
                type="button"
                className="wall-json-outline-key"
                title={names.join(' › ')}
                aria-current={selected === item ? 'location' : undefined}
                onClick={() => {
                  onSelect(item, names);
                }}
              >
                {item.name}
              </button>
            </div>
            {open && item.children && render(item.children, names)}
          </li>
        );
      })}
    </ul>
  );
  return (
    <aside className="wall-json-outline" aria-label="JSON 구조 탐색">
      <header className="wall-json-outline-heading">
        <span>
          <Trans i18nKey="wall.wall-json-outline.text-f1b39127">문서 구조</Trans>
        </span>
        <Button size="icon" variant="ghost" aria-label="문서 구조 접기" title="문서 구조 접기" onClick={onCollapse}>
          <PanelLeftClose size={15} />
        </Button>
      </header>
      <PanelScrollArea className="wall-json-outline-scroll" aria-label="JSON Key 계층">
        {symbols.length ? (
          <nav aria-label="JSON Key 이동">{render(symbols)}</nav>
        ) : (
          <div className="wall-inspect-empty">
            {failed ? '구조를 불러오지 못했습니다.' : '표시할 구조가 없습니다.'}
            <Button size="sm" variant="ghost" onClick={onFallback}>
              <Trans i18nKey="wall.wall-json-outline.text-6c98e325">빠른 구조 탐색</Trans>
            </Button>
          </div>
        )}
      </PanelScrollArea>
    </aside>
  );
}
