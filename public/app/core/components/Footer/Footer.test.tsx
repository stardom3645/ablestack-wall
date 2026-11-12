import { render, screen, waitFor } from '@testing-library/react';

import { Footer } from './Footer';

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  global.fetch = originalFetch;
});

it('uses the browser year for copyright independently of the deployed version', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2027-06-15T12:00:00'));
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ version: 'v4.7.5-20261110' }) });
  render(<Footer />);
  expect(await screen.findByText('ABLESTACK v4.7.5-20261110')).toBeInTheDocument();
  expect(screen.getByText('2021-2027 ABLECLOUD Inc. All Rights Reserved.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Documentation' })).toBeInTheDocument();
});

it('keeps Wall branding when release metadata is unavailable', async () => {
  fetchMock.mockResolvedValue({ ok: false });
  render(<Footer />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.getByText('ABLESTACK Wall')).toBeInTheDocument();
});

it('aborts a pending release request when the footer unmounts', () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  const { unmount } = render(<Footer />);
  const signal = fetchMock.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
});
