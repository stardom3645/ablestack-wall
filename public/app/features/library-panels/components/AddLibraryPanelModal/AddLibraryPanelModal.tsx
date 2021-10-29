import React, { useCallback, useEffect, useState } from 'react';
import { Button, Field, Input, Modal } from '@grafana/ui';
import { FolderPicker } from 'app/core/components/Select/FolderPicker';
import { PanelModel } from '../../../dashboard/state';
import { usePanelSave } from '../../utils/usePanelSave';
import { useAsync, useDebounce } from 'react-use';
import { getLibraryPanelByName } from '../../state/api';

interface AddLibraryPanelContentsProps {
  onDismiss: () => void;
  panel: PanelModel;
  initialFolderId?: number;
}

export const AddLibraryPanelContents = ({ panel, initialFolderId, onDismiss }: AddLibraryPanelContentsProps) => {
  const [folderId, setFolderId] = useState(initialFolderId);
  const [panelName, setPanelName] = useState(panel.title);
  const [debouncedPanelName, setDebouncedPanelName] = useState(panel.title);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => setWaiting(true), [panelName]);
  useDebounce(() => setDebouncedPanelName(panelName), 350, [panelName]);

  const { saveLibraryPanel } = usePanelSave();
  const onCreate = useCallback(() => {
    panel.libraryPanel = { uid: undefined, name: panelName };
    saveLibraryPanel(panel, folderId!).then((res) => {
      if (!(res instanceof Error)) {
        onDismiss();
      }
    });
  }, [panel, panelName, folderId, onDismiss, saveLibraryPanel]);
  const isValidName = useAsync(async () => {
    try {
      return !(await getLibraryPanelByName(panelName)).some((lp) => lp.folderId === folderId);
    } catch (err) {
      err.isHandled = true;
      return true;
    } finally {
      setWaiting(false);
    }
  }, [debouncedPanelName, folderId]);

  const invalidInput =
    !isValidName?.value && isValidName.value !== undefined && panelName === debouncedPanelName && !waiting;

  return (
    <>
      <Field
        label="라이브러리 패널 이름"
        invalid={invalidInput}
        error={invalidInput ? '이 이름의 라이브러리 패널이 이미 있습니다.' : ''}
      >
        <Input
          id="share-panel-library-panel-name-input"
          name="name"
          value={panelName}
          onChange={(e) => setPanelName(e.currentTarget.value)}
        />
      </Field>
      <Field label="폴더에 저장" description="라이브러리 패널 권한은 폴더 권한에서 파생됩니다.">
        <FolderPicker
          onChange={({ id }) => setFolderId(id)}
          initialFolderId={initialFolderId}
          inputId="share-panel-library-panel-folder-picker"
        />
      </Field>

      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onDismiss} fill="outline">
          취소
        </Button>
        <Button onClick={onCreate} disabled={invalidInput}>
          라이브러리 패널 만들기
        </Button>
      </Modal.ButtonRow>
    </>
  );
};

interface Props extends AddLibraryPanelContentsProps {
  isOpen?: boolean;
}

export const AddLibraryPanelModal: React.FC<Props> = ({ isOpen = false, panel, initialFolderId, ...props }) => {
  return (
    <Modal title="라이브러리 패널 생성" isOpen={isOpen} onDismiss={props.onDismiss}>
      <AddLibraryPanelContents panel={panel} initialFolderId={initialFolderId} onDismiss={props.onDismiss} />
    </Modal>
  );
};
