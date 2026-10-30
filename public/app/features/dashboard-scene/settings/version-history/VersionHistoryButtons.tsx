import { GitCompareArrows } from 'lucide-react';

import { Tooltip, Button, Stack } from '@grafana/ui';
import { t } from 'app/core/internationalization';
import { useWallSettings } from 'app/features/wall-modern/management/SettingsPresentationContext';
import { Button as WallButton } from 'app/features/wall-modern/ui';

type VersionsButtonsType = {
  hasMore: boolean;
  canCompare: boolean;
  getVersions: (append: boolean) => void;
  getDiff: () => void;
  isLastPage: boolean;
};
export const VersionsHistoryButtons = ({
  hasMore,
  canCompare,
  getVersions,
  getDiff,
  isLastPage,
}: VersionsButtonsType) => {
  const wallSettings = useWallSettings();
  if (wallSettings) {
    return (
      <div className="wall-settings-footer-actions">
        {hasMore && (
          <WallButton size="sm" disabled={isLastPage} onClick={() => getVersions(true)}>
            {t('ablestack-wall.dashboard.show-more-versions', 'Show more versions')}
          </WallButton>
        )}
        <WallButton
          size="sm"
          disabled={!canCompare}
          onClick={getDiff}
          title={t('wall.settings.compare-help', '비교할 버전 두 개를 선택하세요.')}
        >
          <GitCompareArrows size={15} />
          {t('ablestack-wall.dashboard.compare-versions', 'Compare versions')}
        </WallButton>
      </div>
    );
  }
  return (
    <Stack>
      {hasMore && (
        <Button type="button" onClick={() => getVersions(true)} variant="secondary" disabled={isLastPage}>
          {t('ablestack-wall.dashboard.show-more-versions', 'Show more versions')}
        </Button>
      )}
      <Tooltip content="Select two versions to start comparing" placement="bottom">
        <Button type="button" disabled={!canCompare} onClick={getDiff} icon="code-branch">
          {t('ablestack-wall.dashboard.compare-versions', 'Compare versions')}
        </Button>
      </Tooltip>
    </Stack>
  );
};
