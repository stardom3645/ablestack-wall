import { PropsWithChildren, ReactNode, useMemo } from 'react';

import { PageLayoutType, NavModelItem } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import NativeScrollbar from 'app/core/components/NativeScrollbar';
import { Page } from 'app/core/components/Page/Page';
import { PageTabs } from 'app/core/components/Page/PageTabs';
import type { PageInfoItem } from 'app/core/components/Page/types';
import { usePageNav } from 'app/core/components/Page/usePageNav';
import { PageInfo } from 'app/core/components/PageInfo/PageInfo';
import { WallUsersRegion } from 'app/features/admin/Users/WallUsers';

import { managementTitles } from '../managementNavigation';

import './admin.css';

/** Shared settings frame; page-specific forms, permissions and API actions stay native. */
export function WallAdminPage({
  navId,
  title,
  description,
  context,
  detailNav,
  info,
  actions,
  children,
  wide = false,
  isLoading = false,
}: PropsWithChildren<{
  navId: string;
  title?: string;
  description?: ReactNode;
  context?: ReactNode;
  detailNav?: NavModelItem;
  info?: PageInfoItem[];
  actions?: ReactNode;
  wide?: boolean;
  isLoading?: boolean;
}>) {
  const heading = title ?? detailNav?.text ?? managementTitles[navId];
  const native = usePageNav(navId);
  const navigation = useMemo(() => {
    if (!native) {
      return undefined;
    }
    const node = { ...native.node, text: managementTitles[navId] ?? native.node.text };
    return { ...native, node, main: native.node === native.main ? node : native.main };
  }, [native, navId]);
  return (
    <Page
      navId={navId}
      navModel={navigation}
      pageNav={detailNav ?? (title ? { text: title } : undefined)}
      layout={PageLayoutType.Custom}
    >
      <NativeScrollbar>
        <div className={`wall-users-page-content wall-admin-page${wide ? ' wall-admin-wide' : ''}`}>
          <WallUsersRegion>
            <header className="wall-users-workspace-header">
              <div>
                <div className="wall-admin-title">
                  {detailNav?.img && <img src={detailNav.img} alt="" />}
                  <h1 title={heading}>{heading}</h1>
                </div>
                {description &&
                  (typeof description === 'string' ? (
                    <p>{description}</p>
                  ) : (
                    <div className="wall-admin-description">{description}</div>
                  ))}
                {info && (
                  <div className="wall-admin-context">
                    <PageInfo info={info} />
                  </div>
                )}
                {context && <div className="wall-admin-context">{context}</div>}
              </div>
              {actions && <div className="wall-users-toolbar-actions">{actions}</div>}
            </header>
            {detailNav?.children && (
              <div className="wall-admin-tabs">
                <PageTabs navItem={detailNav} wallPresentation />
              </div>
            )}
            {isLoading ? <LoadingPlaceholder text="불러오는 중" /> : children}
          </WallUsersRegion>
        </div>
      </NativeScrollbar>
    </Page>
  );
}
