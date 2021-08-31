import React, { FC } from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { NavModel } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';

import Page from 'app/core/components/Page/Page';
import { StoreState } from 'app/types';
import { GrafanaRouteComponentProps } from '../../core/navigation/types';
import { getNavModel } from 'app/core/selectors/navModel';
import { PlaylistForm } from './PlaylistForm';
import { createPlaylist } from './api';
import { Playlist } from './types';
import { usePlaylist } from './usePlaylist';
import { getPlaylistStyles } from './styles';

interface ConnectedProps {
  navModel: NavModel;
}

interface Props extends ConnectedProps, GrafanaRouteComponentProps {}

export const PlaylistNewPage: FC<Props> = ({ navModel }) => {
  const styles = useStyles2(getPlaylistStyles);
  const { playlist, loading } = usePlaylist();
  const onSubmit = async (playlist: Playlist) => {
    await createPlaylist(playlist);
    locationService.push('/playlists');
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents isLoading={loading}>
        <h3 className={styles.subHeading}>새 플레이리스트</h3>

        <p className={styles.description}>
          플레이리스트는 선택한 대시보드의 목록을 순환하며 보여줍니다. 플레이리스트는 시스템의 현재 상황 모니터링을
          구성하거나 사용자에게 다양한 지표를 보여줄 수 있습니다.
        </p>

        <PlaylistForm onSubmit={onSubmit} playlist={playlist} />
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps: MapStateToProps<ConnectedProps, {}, StoreState> = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'playlists'),
});

export default connect(mapStateToProps)(PlaylistNewPage);
