import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { ConfirmModal, Drawer, Modal, ModalTabsHeader } from '@grafana/ui';

import { Dialog } from '../components/ui/dialog';

import { WallModalProvider } from './WallModalProvider';

describe('shared Wall modal frame', () => {
  it('names a custom tabbed header and keeps the native tab callback', async () => {
    const onChangeTab = jest.fn();
    render(
      <WallModalProvider>
        <Modal
          isOpen
          title={
            <ModalTabsHeader
              title="패널 공유"
              icon="share-alt"
              tabs={[
                { value: 'link', label: '링크' },
                { value: 'embed', label: '임베드' },
              ]}
              activeTab="link"
              onChangeTab={onChangeTab}
            />
          }
        >
          <input aria-label="링크 주소" />
        </Modal>
      </WallModalProvider>
    );
    const dialog = screen.getByRole('dialog', { name: /패널 공유/ });
    expect(dialog).toHaveClass('wall-modal');
    expect(dialog).toHaveStyle('--wall-modal-close-size: 30px');
    await userEvent.click(screen.getByRole('tab', { name: '임베드' }));
    expect(onChangeTab).toHaveBeenCalledWith(expect.objectContaining({ value: 'embed' }));
  });

  it('retains independent escape and backdrop dismissal policies', async () => {
    const onDismiss = jest.fn();
    const onClickBackdrop = jest.fn();
    const { rerender } = render(
      <WallModalProvider>
        <Modal isOpen title="설정" closeOnEscape={false} closeOnBackdropClick={false} onDismiss={onDismiss} />
      </WallModalProvider>
    );
    await userEvent.keyboard('{Escape}');
    fireEvent.click(document.querySelector('.wall-modal-backdrop')!);
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(
      <WallModalProvider>
        <Modal
          isOpen
          title="설정"
          closeOnBackdropClick={false}
          onDismiss={onDismiss}
          onClickBackdrop={onClickBackdrop}
        />
      </WallModalProvider>
    );
    fireEvent.click(document.querySelector('.wall-modal-backdrop')!);
    expect(onClickBackdrop).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('restores keyboard focus and closes with the Wall button', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <WallModalProvider>
          <button onClick={() => setOpen(true)}>열기</button>
          <Modal isOpen={open} title="변경 확인" onDismiss={() => setOpen(false)}>
            <input aria-label="내용" />
            <Modal.ButtonRow>
              <button onClick={() => setOpen(false)}>취소</button>
            </Modal.ButtonRow>
          </Modal>
        </WallModalProvider>
      );
    }
    render(<Example />);
    const trigger = screen.getByRole('button', { name: '열기' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('preserves destructive confirmation and its async disabled state', async () => {
    let resolve!: () => void;
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        })
    );
    render(
      <WallModalProvider>
        <ConfirmModal
          isOpen
          title="패널 삭제"
          body="설정을 삭제할까요?"
          confirmationText="삭제"
          confirmText="삭제 확인"
          onConfirm={onConfirm}
          onDismiss={jest.fn()}
        />
      </WallModalProvider>
    );
    const button = screen.getByRole('button', { name: '삭제 확인' });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), '삭제');
    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-ui-button', 'destructive');
    resolve();
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('shares the frame with the local Base UI gallery dialog', async () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog open title="시각화 선택" onOpenChange={onOpenChange}>
        <p>사용 가능한 시각화</p>
      </Dialog>
    );
    expect(screen.getByRole('dialog', { name: '시각화 선택' })).toHaveClass('wall-modal', 'wall-studio-dialog');
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('returns focus from a programmatically opened Base UI dialog after its owner unmounts it', async () => {
    function Picker() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>시각화 변경</button>
          {open && (
            <Dialog open title="시각화 선택" onOpenChange={setOpen}>
              <input aria-label="검색" autoFocus />
            </Dialog>
          )}
        </>
      );
    }
    render(<Picker />);
    const trigger = screen.getByRole('button', { name: '시각화 변경' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('carries the same presentation into the native drawer without changing its close action', async () => {
    const onClose = jest.fn();
    render(<div className="main-view" />);
    render(
      <WallModalProvider>
        <Drawer title="대시보드 저장" subtitle="검증용" onClose={onClose}>
          <input aria-label="저장 메시지" />
          <Modal.ButtonRow>
            <button>저장</button>
          </Modal.ButtonRow>
        </Drawer>
      </WallModalProvider>
    );
    const dialog = await screen.findByRole('dialog', { name: /대시보드 저장/ });
    expect(dialog).toHaveClass('wall-drawer');
    expect(dialog.closest('.wall-drawer-root')).toHaveStyle('--wall-modal-close-size: 30px');
    expect(screen.getByRole('textbox', { name: '저장 메시지' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
