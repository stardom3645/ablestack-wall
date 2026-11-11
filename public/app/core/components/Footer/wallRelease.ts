// Product release metadata is supplied at deployment time, independently of Grafana buildInfo.
export async function loadWallReleaseVersion(appSubUrl = '', signal?: AbortSignal): Promise<string | undefined> {
  try {
    const response = await fetch(`${appSubUrl}/public/ablestack-release.json`, {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) {
      return undefined;
    }

    const release: unknown = await response.json();
    if (typeof release !== 'object' || release === null || !('version' in release)) {
      return undefined;
    }
    const version = release.version;
    // Accept release suffixes without rendering arbitrary deployment content as a product version.
    return typeof version === 'string' && /^v\d+\.\d+\.\d+(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/.test(version)
      ? version
      : undefined;
  } catch {
    // Missing files, invalid JSON, offline requests and unmount cancellation use the default branding.
    return undefined;
  }
}
