import { createContext, ReactNode, useContext } from 'react';

import './panelActions.css';

type PanelControls = { move?: ReactNode; actions?: ReactNode };
const PanelControlsContext = createContext<PanelControls>({});

/** Supply native actions from the Grid without coupling the panel/query subtree to layout state. */
export function PanelActionsProvider({ children, move, actions }: PanelControls & { children: ReactNode }) {
  return <PanelControlsContext.Provider value={{ move, actions }}>{children}</PanelControlsContext.Provider>;
}

/** The same reserved header slots serve native charts, compact data rows and text sections. */
export function WallPanelHeader({
  title,
  titleId,
  children,
  value,
}: {
  title: ReactNode;
  titleId?: string;
  children?: ReactNode;
  value?: ReactNode;
}) {
  const { move, actions } = useContext(PanelControlsContext);
  return (
    <div className="wall-panel-header" data-wall-panel-header="hybrid">
      <span className="wall-panel-header-grip">{move}</span>
      <div className="wall-panel-header-title" id={titleId}>
        {title}
      </div>
      {value && <div className="wall-panel-header-value">{value}</div>}
      {children && <div className="wall-panel-header-indicators">{children}</div>}
      {actions && <span className="wall-panel-header-menu">{actions}</span>}
    </div>
  );
}
