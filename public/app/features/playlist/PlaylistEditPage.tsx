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
import { updatePlaylist } from './api';
import { Playlist } from './types';
import { usePlaylist } from './usePlaylist';
import { getPlaylistStyles } from './styles';

interface ConnectedProps {
  navModel: NavModel;
}

export interface RouteParams {
  id: number;
}

interface Props extends ConnectedProps, GrafanaRouteComponentProps<RouteParams> {}

export const PlaylistEditPage: FC<Props> = ({ navModel, match }) => {
  const styles = useStyles2(getPlaylistStyles);
  const { playlist, loading } = usePlaylist(match.params.id);
  const onSubmit = async (playlist: Playlist) => {
    await updatePlaylist(match.params.id, playlist);
    locationService.push('/playlists');
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents isLoading={loading}>
        <h3 className={styles.subHeading}>플레이리스트 편집</h3>

        <p className={styles.description}>
          재생 목록은 미리 선택된 대시보드 목록을 순환합니다. 재생 목록은 상황 인식을 구축하거나 팀이나 방문자에게
          지표를 과시하는 좋은 방법이 될 수 있습니다.
        </p>

        <PlaylistForm onSubmit={onSubmit} playlist={playlist} />
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps: MapStateToProps<ConnectedProps, {}, StoreState> = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'playlists'),
});

export default connect(mapStateToProps)(PlaylistEditPage);
