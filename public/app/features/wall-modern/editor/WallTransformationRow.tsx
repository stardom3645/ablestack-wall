import { Draggable } from '@hello-pangea/dnd';
import { ChevronDown, GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

import { Collapsible } from '../components/ui/collapsible';
import { Button } from '../ui';

/** Presentation only; actions and field editors remain native transformation components. */
export function WallTransformationRow({
  id,
  index,
  title,
  disabled,
  actions,
  children,
}: {
  id: string;
  index: number;
  title: string;
  disabled: boolean;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <Draggable draggableId={id} index={index}>
      {(drag) => (
        <div
          ref={drag.innerRef}
          {...drag.draggableProps}
          className="wall-transform-row"
          data-disabled={disabled || undefined}
        >
          <Collapsible.Root defaultOpen={false}>
            <div className="wall-transform-row-heading">
              <span {...drag.dragHandleProps} aria-label={`${title} 순서 변경`} className="wall-work-query-grip">
                <GripVertical size={14} />
              </span>
              <Collapsible.Trigger render={<Button variant="ghost" size="sm" />} className="wall-transform-select">
                <span className="wall-transform-order">{index + 1}</span>
                <span>{title}</span>
                <ChevronDown size={14} />
              </Collapsible.Trigger>
              <div className="wall-transform-actions">{actions}</div>
            </div>
            <Collapsible.Panel keepMounted className="wall-transform-settings">
              {children}
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      )}
    </Draggable>
  );
}
