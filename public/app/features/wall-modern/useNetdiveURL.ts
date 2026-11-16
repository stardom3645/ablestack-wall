import { useEffect, useState } from 'react';

import { config } from '@grafana/runtime';

import { netdiveBase } from './netdive';

// Optional public deployment configuration, following the existing release JSON pattern.
// No hostname/port inference, credentials or new backend API. One read per page load.
interface NetdiveConfiguration {
  url?: string;
  loaded: boolean;
  allowDashboardFallback?: boolean;
}
let pending: Promise<Omit<NetdiveConfiguration, 'loaded'>> | undefined;
export function useNetdiveURL() {
  return useNetdiveConfiguration().url;
}

export function useNetdiveConfiguration() {
  const [state, setState] = useState<NetdiveConfiguration>({ loaded: false });
  useEffect(() => {
    let active = true;
    pending ??= Promise.resolve()
      .then(() =>
        fetch(`${config.appSubUrl}/public/ablestack-netdive.json`, { credentials: 'same-origin', cache: 'no-store' })
      )
      .then(async (response) => {
        if (!response.ok) {
          return { allowDashboardFallback: response.status === 404 };
        }
        const data: unknown = await response.json();
        const url =
          data && typeof data === 'object' && 'version' in data && data.version === 1 && 'netdiveURL' in data
            ? netdiveBase(data.netdiveURL)
            : undefined;
        return { url, allowDashboardFallback: false };
      })
      .catch(() => ({ allowDashboardFallback: false }));
    pending.then((value) => {
      if (active) {
        setState({ ...value, loaded: true });
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return state;
}
