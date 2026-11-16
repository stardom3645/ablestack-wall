import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';

import { ModalsContext } from '@grafana/ui';
import appEvents from 'app/core/app_events';
import { ShowConfirmModalEvent, ShowModalReactEvent } from 'app/types/events';

import { ModalsContextProvider } from './ModalsContextProvider';

function Outlet() {
  const { component: Component, props } = useContext(ModalsContext);
  return Component ? <Component {...props} /> : null;
}

it('notifies the original dismiss callback and closes the confirmation, while keeping confirmation separate', async () => {
  render(
    <ModalsContextProvider>
      <Outlet />
    </ModalsContextProvider>
  );
  const dismiss = jest.fn();
  const confirm = jest.fn();
  const show = () =>
    act(() => {
      appEvents.publish(
        new ShowConfirmModalEvent({
          title: 'QA preferences',
          text: 'Save organization preferences?',
          yesText: 'Confirm',
          noText: 'Cancel',
          onDismiss: dismiss,
          onConfirm: confirm,
        })
      );
    });
  show();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  show();
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  const Followup = () => (
    <div role="dialog" aria-label="Followup">
      Next confirmation
    </div>
  );
  const Original = ({ onDismiss }: { onDismiss: () => void }) => <button onClick={onDismiss}>Close original</button>;
  act(() => {
    appEvents.publish(
      new ShowModalReactEvent({
        component: Original,
        props: {
          onDismiss: () => appEvents.publish(new ShowModalReactEvent({ component: Followup, props: {} })),
        },
      })
    );
  });
  await userEvent.click(screen.getByRole('button', { name: 'Close original' }));
  expect(screen.getByRole('dialog', { name: 'Followup' })).toBeInTheDocument();
});
