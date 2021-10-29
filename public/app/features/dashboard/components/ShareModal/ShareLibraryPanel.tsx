import React from 'react';
import { AddLibraryPanelContents } from 'app/features/library-panels/components/AddLibraryPanelModal/AddLibraryPanelModal';
import { ShareModalTabProps } from './types';

interface Props extends ShareModalTabProps {
  initialFolderId?: number;
}

export const ShareLibraryPanel = ({ panel, initialFolderId, onDismiss }: Props) => {
  if (!panel) {
    return null;
  }

  return (
    <>
      <p className="share-modal-info-text">라이브러리 패널을 만듭니다.</p>
      <AddLibraryPanelContents panel={panel} initialFolderId={initialFolderId} onDismiss={onDismiss!} />
    </>
  );
};
