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
  const [panelTitle, setPanelTitle] = useState(panel.title);
  const [debouncedPanelTitle, setDebouncedPanelTitle] = useState(panel.title);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => setWaiting(true), [panelTitle]);
  useDebounce(() => setDebouncedPanelTitle(panelTitle), 350, [panelTitle]);

  const { saveLibraryPanel } = usePanelSave();
  const onCreate = useCallback(() => {
    panel.title = panelTitle;
    saveLibraryPanel(panel, folderId!).then((res) => {
      if (!(res instanceof Error)) {
        onDismiss();
      }
    });
  }, [panel, panelTitle, folderId, onDismiss, saveLibraryPanel]);
  const isValidTitle = useAsync(async () => {
    try {
      return !(await getLibraryPanelByName(panelTitle)).some((lp) => lp.folderId === folderId);
    } catch (err) {
      err.isHandled = true;
      return true;
    } finally {
      setWaiting(false);
    }
  }, [debouncedPanelTitle, folderId]);

  const invalidInput =
    !isValidTitle?.value && isValidTitle.value !== undefined && panelTitle === debouncedPanelTitle && !waiting;

  return (
    <>
      <Field
        label="라이브러리 패널 이름"
        invalid={invalidInput}
        error={invalidInput ? '이 이름의 라이브러리 패널이 이미 있습니다.' : ''}
      >
        <Input name="name" value={panelTitle} onChange={(e) => setPanelTitle(e.currentTarget.value)} />
      </Field>
      <Field label="폴더에 저장" description="라이브러리 패널 권한은 폴더 권한에서 파생됩니다.">
        <FolderPicker onChange={({ id }) => setFolderId(id)} initialFolderId={initialFolderId} />
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
