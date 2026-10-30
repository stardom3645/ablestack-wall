import { css } from '@emotion/css';
import { Draggable } from '@hello-pangea/dnd';
import { Copy, GripVertical, Trash2, Variable } from 'lucide-react';
import { ReactElement, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime';
import { SceneVariable } from '@grafana/scenes';
import { Button, ConfirmModal, Icon, IconButton, useStyles2, useTheme2 } from '@grafana/ui';
import { t } from 'app/core/internationalization';
import { useWallSettings } from 'app/features/wall-modern/management/SettingsPresentationContext';
import { Button as WallButton } from 'app/features/wall-modern/ui';

import { getDefinition } from './utils';

export interface VariableEditorListRowProps {
  index: number;
  variable: SceneVariable;
  onEdit: (identifier: string) => void;
  onDuplicate: (identifier: string) => void;
  onDelete: (identifier: string) => void;
}

export function VariableEditorListRow({
  index,
  variable,
  onEdit: propsOnEdit,
  onDuplicate: propsOnDuplicate,
  onDelete: propsOnDelete,
}: VariableEditorListRowProps): ReactElement {
  const theme = useTheme2();
  const wallSettings = useWallSettings();
  const styles = useStyles2(getStyles);
  const definition = getDefinition(variable);
  const variableState = variable.state;
  const identifier = variableState.name;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDeleteVariableModal = (show: boolean) => () => {
    setShowDeleteModal(show);
  };
  const onDeleteVariable = () => {
    reportInteraction('Delete variable');
    propsOnDelete(identifier);
  };

  return (
    <Draggable draggableId={JSON.stringify(identifier)} index={index}>
      {(provided, snapshot) =>
        wallSettings ? (
          <div
            className="wall-collection-row"
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={provided.draggableProps.style}
            data-dragging={snapshot.isDragging || undefined}
          >
            <div
              className="wall-collection-grip"
              {...provided.dragHandleProps}
              aria-label={t('wall.settings.reorder-variable', '변수 순서 조정')}
            >
              <GripVertical size={15} />
            </div>
            <span className="wall-collection-symbol">
              <Variable size={17} />
            </span>
            <WallButton
              className="wall-collection-row-main"
              variant="ghost"
              onClick={() => propsOnEdit(identifier)}
              data-testid={selectors.pages.Dashboard.Settings.Variables.List.tableRowNameFields(identifier)}
            >
              <span className="wall-collection-row-title">
                {variableState.label || identifier}
                <code>
                  {variableState.label && variableState.label !== identifier ? identifier : variableState.type}
                </code>
              </span>
              <span className="wall-collection-row-description" title={definition}>
                {definition}
              </span>
            </WallButton>
            <div className="wall-collection-row-actions">
              <WallButton
                size="icon"
                variant="ghost"
                aria-label={t('wall.settings.duplicate-variable', '변수 복제')}
                title={t('wall.settings.duplicate-variable', '변수 복제')}
                onClick={() => {
                  reportInteraction('Duplicate variable');
                  propsOnDuplicate(identifier);
                }}
              >
                <Copy size={15} />
              </WallButton>
              <WallButton
                size="icon"
                variant="ghost"
                aria-label={t('wall.settings.delete-variable', '변수 삭제')}
                title={t('wall.settings.delete-variable', '변수 삭제')}
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={15} />
              </WallButton>
            </div>
            <ConfirmModal
              isOpen={showDeleteModal}
              title={t('ablestack-wall.dashboard.delete-variable', 'Delete variable')}
              body={
                t('ablestack-wall.dashboard.are-you-sure-you-want-to-delete', 'Are you sure you want to delete:') +
                ` ${identifier}?`
              }
              confirmText={t('ablestack-wall.dashboard.delete-variable-confirmation-yes', 'Delete variable')}
              onConfirm={onDeleteVariable}
              onDismiss={handleDeleteVariableModal(false)}
            />
          </div>
        ) : (
          <tr
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              userSelect: snapshot.isDragging ? 'none' : 'auto',
              background: snapshot.isDragging ? theme.colors.background.secondary : undefined,
              ...provided.draggableProps.style,
            }}
          >
            <td role="gridcell" className={styles.column}>
              <Button
                size="xs"
                fill="text"
                onClick={(event) => {
                  event.preventDefault();
                  propsOnEdit(identifier);
                }}
                className={styles.nameLink}
                data-testid={selectors.pages.Dashboard.Settings.Variables.List.tableRowNameFields(variableState.name)}
              >
                {variableState.name}
              </Button>
            </td>
            <td
              role="gridcell"
              className={styles.definitionColumn}
              onClick={(event) => {
                event.preventDefault();
                propsOnEdit(identifier);
              }}
              data-testid={selectors.pages.Dashboard.Settings.Variables.List.tableRowDefinitionFields(
                variableState.name
              )}
            >
              {definition}
            </td>

            <td role="gridcell" className={styles.column}>
              <div className={styles.icons}>
                <IconButton
                  onClick={(event) => {
                    event.preventDefault();
                    reportInteraction('Duplicate variable');
                    propsOnDuplicate(identifier);
                  }}
                  name="copy"
                  tooltip="Duplicate variable"
                  data-testid={selectors.pages.Dashboard.Settings.Variables.List.tableRowDuplicateButtons(
                    variableState.name
                  )}
                />
                <IconButton
                  onClick={(event) => {
                    event.preventDefault();
                    setShowDeleteModal(true);
                  }}
                  name="trash-alt"
                  tooltip="Remove variable"
                  data-testid={selectors.pages.Dashboard.Settings.Variables.List.tableRowRemoveButtons(
                    variableState.name
                  )}
                />
                <ConfirmModal
                  isOpen={showDeleteModal}
                  title={t('ablestack-wall.dashboard.delete-variable', 'Delete variable')}
                  body={
                    t('ablestack-wall.dashboard.are-you-sure-you-want-to-delete', 'Are you sure you want to delete:') +
                    ` ${variableState.name}?`
                  }
                  confirmText={t('ablestack-wall.dashboard.delete-variable-confirmation-yes', 'Delete variable')}
                  onConfirm={onDeleteVariable}
                  onDismiss={handleDeleteVariableModal(false)}
                />

                <div {...provided.dragHandleProps} className={styles.dragHandle}>
                  <Icon name="draggabledots" size="lg" />
                </div>
              </div>
            </td>
          </tr>
        )
      }
    </Draggable>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    dragHandle: css({
      cursor: 'grab',
      marginLeft: theme.spacing(1),
    }),
    column: css({
      width: '1%',
    }),
    nameLink: css({
      cursor: 'pointer',
      color: theme.colors.primary.text,
    }),
    definitionColumn: css({
      width: '100%',
      maxWidth: '200px',
      cursor: 'pointer',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    iconPassed: css({
      color: theme.v1.palette.greenBase,
      marginRight: theme.spacing(2),
    }),
    iconFailed: css({
      color: theme.v1.palette.orange,
      marginRight: theme.spacing(2),
    }),
    icons: css({
      display: 'flex',
      gap: theme.spacing(2),
      alignItems: 'center',
    }),
  };
}
