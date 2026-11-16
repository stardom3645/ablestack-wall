import { act, render, screen } from 'test/test-utils';

import { createErrorNotification, createSuccessNotification } from 'app/core/copy/appNotification';

import { AppNotificationList } from './AppNotificationList';

it('keeps the remaining error lifetime when an earlier success notification disappears', () => {
  jest.useFakeTimers();
  const success = createSuccessNotification('Saved');
  const error = createErrorNotification('Query failed', 'Original error details');
  const { unmount } = render(<AppNotificationList />, {
    preloadedState: { appNotifications: { byId: { [success.id]: success, [error.id]: error }, lastRead: 0 } },
  });
  act(() => jest.advanceTimersByTime(3000));
  expect(screen.queryByRole('status', { name: 'Saved' })).not.toBeInTheDocument();
  expect(screen.getByRole('alert', { name: 'Query failed' })).toHaveTextContent('Original error details');
  act(() => jest.advanceTimersByTime(4000));
  expect(screen.queryByRole('alert', { name: 'Query failed' })).not.toBeInTheDocument();
  unmount();
  jest.useRealTimers();
});
