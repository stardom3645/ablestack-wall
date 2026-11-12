import { useEffect, useState } from 'react';

import { config } from '@grafana/runtime';

import { netdiveBase } from './netdive';

// Optional public deployment configuration, following the existing release JSON pattern.
// No hostname/port inference, credentials or new backend API. One read per page load.
let pending: Promise<string | undefined> | undefined;
export function useNetdiveURL() {
  const [url, setURL] = useState<string>();
  useEffect(() => {
    let active = true;
    pending ??= Promise.resolve()
      .then(() =>
        fetch(`${config.appSubUrl}/public/ablestack-netdive.json`, { credentials: 'same-origin', cache: 'no-store' })
      )
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const data: unknown = await response.json();
        return data && typeof data === 'object' && 'version' in data && data.version === 1 && 'netdiveURL' in data
          ? netdiveBase(data.netdiveURL)
          : undefined;
      })
      .catch(() => undefined);
    pending.then((value) => {
      if (active) {
        setURL(value);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return url;
}
