import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { getBackendSrv } from '@grafana/runtime';
import { appEvents } from 'app/core/app_events';
import { setStarred } from 'app/core/reducers/navBarTree';
import { contextSrv } from 'app/core/services/context_srv';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import type { DashboardSearchItem } from 'app/features/search/types';
import { useDispatch } from 'app/types';

import { WallDashboardStarredEvent } from './events';

export function useWallDashboardSource() {
  const [items, setItems] = useState<DashboardSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [revision, setRevision] = useState(0);
  const [pendingStars, setPendingStars] = useState<Set<string>>(new Set());
  const pending = useRef(new Set<string>());
  const dispatch = useDispatch();
  useEffect(() => {
    const subscription = appEvents.subscribe(WallDashboardStarredEvent, ({ payload }) => {
      setItems((current) =>
        current.map((item) => (item.uid === payload.uid ? { ...item, isStarred: payload.isStarred } : item))
      );
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    (async () => {
      // The existing Search API enforces organization and dashboard permissions.
      // Exhaust pages rather than silently truncating large installations.
      const result: DashboardSearchItem[] = [];
      for (let page = 1; ; page++) {
        const batch = await getBackendSrv().get<DashboardSearchItem[]>('/api/search', { limit: 1000, page });
        result.push(...batch);
        if (batch.length < 1000) {
          break;
        }
        if (!active) {
          return;
        }
      }
      if (active) {
        setItems(result);
      }
    })()
      .catch(() => {
        if (active) {
          setError('대시보드를 불러오지 못했습니다. 다시 시도해 주세요.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const toggleStar = useCallback(
    async (item: DashboardSearchItem) => {
      if (!contextSrv.isSignedIn || pending.current.has(item.uid)) {
        return;
      }
      pending.current.add(item.uid);
      setPendingStars(new Set(pending.current));
      try {
        const isStarred = await getDashboardSrv().starDashboard(item.uid, item.isStarred);
        setItems((current) => current.map((entry) => (entry.uid === item.uid ? { ...entry, isStarred } : entry)));
        dispatch(setStarred({ id: item.uid, title: item.title, url: item.url, isStarred }));
      } finally {
        pending.current.delete(item.uid);
        setPendingStars(new Set(pending.current));
      }
    },
    [dispatch]
  );

  return { items, loading, error, toggleStar, pendingStars, reload: () => setRevision((v) => v + 1) };
}

export type WallDashboardSource = ReturnType<typeof useWallDashboardSource>;
export const WallDashboardContext = createContext<WallDashboardSource | undefined>(undefined);
export function useWallDashboards() {
  const value = useContext(WallDashboardContext);
  if (!value) {
    throw new Error('Wall dashboard provider is missing');
  }
  return value;
}
