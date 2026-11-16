import { act, fireEvent, render, screen } from '@testing-library/react';

import { AppNotification, AppNotificationSeverity, timeoutMap } from 'app/types';

import AppNotificationItem from './AppNotificationItem';

const notification = (severity = AppNotificationSeverity.Error): AppNotification => ({
  id: 'notification-1',
  title: 'Request failed',
  text: 'The original backend message',
  icon: 'exclamation-triangle',
  severity,
  showing: true,
  timestamp: 100,
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it.each(Object.values(AppNotificationSeverity))('retains the %s announcement and original timeout', (severity) => {
  const clear = jest.fn();
  render(<AppNotificationItem appNotification={notification(severity)} onClearNotification={clear} />);
  const role = severity === 'error' || severity === 'warning' ? 'alert' : 'status';
  expect(screen.getByRole(role, { name: 'Request failed' })).toHaveTextContent('The original backend message');
  act(() => jest.advanceTimersByTime(timeoutMap[severity] - 1));
  expect(clear).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(clear).toHaveBeenCalledWith('notification-1');
});

it('preserves a custom error component, trace ID and manual close', () => {
  const clear = jest.fn();
  render(
    <AppNotificationItem
      appNotification={{ ...notification(), traceId: 'trace-123', component: <a href="/inspect">Inspect request</a> }}
      onClearNotification={clear}
    />
  );
  expect(screen.getByRole('link', { name: 'Inspect request' })).toHaveAttribute('href', '/inspect');
  expect(screen.getByText('Trace ID: trace-123')).toBeInTheDocument();
  expect(screen.queryByText('The original backend message')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }));
  expect(clear).toHaveBeenCalledWith('notification-1');
});

it('does not send a stale dismiss after unmounting', () => {
  const clear = jest.fn();
  const { unmount } = render(<AppNotificationItem appNotification={notification()} onClearNotification={clear} />);
  unmount();
  act(() => jest.runAllTimers());
  expect(clear).not.toHaveBeenCalled();
});
