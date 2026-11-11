import { render, screen, waitFor } from '@testing-library/react';

import { Footer } from './Footer';

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
});

afterAll(() => {
  global.fetch = originalFetch;
});

it('renders the deployed product version with the approved copyright', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ version: 'v4.7.5-20261110' }) });
  render(<Footer />);
  expect(await screen.findByText('ABLESTACK v4.7.5-20261110')).toBeInTheDocument();
  expect(screen.getByText('2021-2026 ABLECLOUD Inc. All Rights Reserved.')).toBeInTheDocument();
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
