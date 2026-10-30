import { MoreHorizontal, Pencil } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import { Popover, PopoverContent } from '../components/ui/popover';
import { Button } from '../ui';

import { PanelActionsProvider, WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { useWallEditing } from './WallEditContext';
import { KpiPosition } from './kpiLayout';
import { validatePanelLayout } from './panelLayout';

import './textPanel.css';

export const textPanelDefinitions = {
  resources: { id: -1005, title: '핵심 자원', description: '가동 시간과 가상머신에 할당된 자원입니다.' },
  trends: { id: -1001, title: '성능 추이', description: 'CPU · 메모리 · 네트워크 · 디스크' },
  storage: { id: -1002, title: '스토리지 요약', description: '' },
  services: { id: -1003, title: '서비스 상태', description: '스토리지 데몬과 수집기의 상태를 확인합니다.' },
} as const;
type TextPanelName = keyof typeof textPanelDefinitions;
interface TextContent {
  title: string;
  description: string;
}
const textPanelSize = { height: 48, gap: 12, rowPitch: 2 };

export function readTextPanel(key: string | undefined, fallback: TextContent): TextContent {
  if (key) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (
        saved?.version === 1 &&
        typeof saved.title === 'string' &&
        saved.title.trim() &&
        saved.title.length <= 120 &&
        typeof saved.description === 'string' &&
        saved.description.length <= 500
      ) {
        return { title: saved.title, description: saved.description };
      }
    } catch {
      /* Invalid browser preferences fall back to the initial text, never to HTML. */
    }
  }
  return { title: fallback.title, description: fallback.description };
}

/** Display-only text model: no source dashboard ID, query runner or server save operation. */
export function useWallTextPanel(name: TextPanelName, storageKey?: string) {
  const persistence = useWallEditing();
  const definition = textPanelDefinitions[name];
  const contentKey = storageKey ? `${storageKey}:text-content:${name}` : undefined;
  const resolveText = () =>
    persistence && contentKey
      ? persistence.text(contentKey, readTextPanel(contentKey, definition))
      : readTextPanel(contentKey, definition);
  const [content, setContent] = useState(resolveText);
  const [draft, setDraft] = useState(content);
  const [open, setOpen] = useState(false);
  const editorAnchor = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setContent(resolveText()), [contentKey, definition, persistence?.revision]);
  const panels = useMemo(
    () => [{ id: definition.id, title: content.title, type: 'wall-text', width: 48, height: 30, model: content }],
    [definition, content]
  );
  const initialLayout = useMemo(
    () => [
      {
        i: String(definition.id),
        x: 0,
        y: 0,
        w: 48,
        h: (textPanelSize.height + textPanelSize.gap) / textPanelSize.rowPitch,
      },
    ],
    [definition]
  );
  const validate = useMemo(() => (value: unknown) => validatePanelLayout(value, [String(definition.id)]), [definition]);
  const save = () => {
    if (!contentKey) {
      return;
    }
    const next = { title: draft.title.trim(), description: draft.description.trim() };
    if (!next.title) {
      setError('제목을 입력해 주세요.');
      return;
    }
    try {
      if (persistence) {
        persistence.updateText(contentKey, next);
      } else {
        localStorage.setItem(contentKey, JSON.stringify({ version: 1, ...next }));
      }
      setContent(next);
      setOpen(false);
      setError('');
    } catch {
      setError('이 브라우저에 저장하지 못했습니다. 입력 내용은 유지됩니다.');
    }
  };
  const editor = () =>
    contentKey &&
    !persistence?.layoutReadOnly && (
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setDraft(content);
            setError('');
          }
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="wall-text-panel-edit" ref={editorAnchor} />}
            aria-label={`${content.title} 추가 작업`}
            title="추가 작업"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="wall-panel-actions-item"
              onClick={() => {
                setDraft(content);
                setError('');
                setOpen(true);
              }}
            >
              <Pencil size={14} />
              <span>텍스트 편집</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <PopoverContent anchor={editorAnchor} className="wall-text-panel-popover" aria-label="텍스트 패널 편집">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <h3>텍스트 패널 편집</h3>
            <label>
              제목
              <input
                value={draft.title}
                maxLength={120}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </label>
            <label>
              설명
              <textarea
                value={draft.description}
                maxLength={500}
                rows={3}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>
            <p className="wall-text-panel-hint">
              {persistence ? '대시보드 저장 시 서버에 반영됩니다.' : '이 브라우저에 저장됩니다.'}
            </p>
            {error && <p role="alert">{error}</p>}
            <div className="wall-text-panel-form-actions">
              <Button render={<button type="button" />} size="sm" variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button render={<button type="submit" />} size="sm">
                {persistence ? '텍스트 적용' : '텍스트 저장'}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    );
  const card = (fill: boolean) => {
    const body = (
      <Card
        className="wall-text-panel"
        data-wall-text-panel={name}
        style={{ height: fill ? '100%' : textPanelSize.height }}
      >
        <WallPanelHeader
          title={
            <div className="wall-text-panel-content">
              <h2>{content.title}</h2>
              {content.description && <p>{content.description}</p>}
            </div>
          }
        />
      </Card>
    );
    return fill ? body : <PanelActionsProvider actions={editor()}>{body}</PanelActionsProvider>;
  };
  return { content, panels, initialLayout, validate, card, editor };
}

export function WallTextPanel({
  name,
  storageKey,
  draftCache,
}: {
  name: TextPanelName;
  storageKey?: string;
  draftCache: Map<string, KpiPosition[]>;
}) {
  const { content, panels, initialLayout, validate, card, editor } = useWallTextPanel(name, storageKey);
  return (
    <div className="wall-text-panel-region">
      <PanelLayoutGrid
        panels={panels}
        initialLayout={initialLayout}
        validate={validate}
        storageKey={storageKey ? `${storageKey}:text-layout:${name}` : undefined}
        draftCache={draftCache}
        rowPitch={textPanelSize.rowPitch}
        gapX={textPanelSize.gap}
        gapY={textPanelSize.gap}
        maxWidth={Infinity}
        minimumWidth={200}
        bounds={() => ({ minW: 12, minH: initialLayout[0].h, maxH: 300 })}
        label={`${content.title} 텍스트 패널`}
        original={card(false)}
        renderPanel={() => card(true)}
        renderActions={editor}
      />
    </div>
  );
}
