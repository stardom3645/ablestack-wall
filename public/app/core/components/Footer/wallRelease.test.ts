import { loadWallReleaseVersion } from './wallRelease';

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});

afterAll(() => {
  global.fetch = originalFetch;
});

it('loads the deployed release without browser caching and respects the app subpath', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ version: 'v4.7.5-20261110' }) });
  const controller = new AbortController();
  expect(await loadWallReleaseVersion('/wall', controller.signal)).toBe('v4.7.5-20261110');
  expect(fetchMock).toHaveBeenCalledWith('/wall/public/ablestack-release.json', {
    cache: 'no-store',
    signal: controller.signal,
  });
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ version: 'v4.7.6-20261111' }) });
  expect(await loadWallReleaseVersion('/wall')).toBe('v4.7.6-20261111');
});

it.each([null, {}, { version: null }, { version: 475 }, { version: '' }, { version: 'ABLESTACK v4.7.5' }])(
  'uses default branding for invalid metadata %j',
  async (metadata) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => metadata });
    expect(await loadWallReleaseVersion()).toBeUndefined();
  }
);

it('uses default branding when the file is missing, invalid JSON, or unreachable', async () => {
  fetchMock.mockResolvedValue({ ok: false });
  expect(await loadWallReleaseVersion()).toBeUndefined();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => {
      throw new SyntaxError();
    },
  });
  expect(await loadWallReleaseVersion()).toBeUndefined();
  fetchMock.mockRejectedValue(new TypeError('Network error'));
  expect(await loadWallReleaseVersion()).toBeUndefined();
});
