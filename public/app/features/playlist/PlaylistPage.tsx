import React, { FC, useState } from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { NavModel } from '@grafana/data';
import Page from 'app/core/components/Page/Page';
import { StoreState } from 'app/types';
import { GrafanaRouteComponentProps } from '../../core/navigation/types';
import { getNavModel } from 'app/core/selectors/navModel';
import { useDebounce } from 'react-use';
import { PlaylistDTO } from './types';
import { ConfirmModal } from '@grafana/ui';
import PageActionBar from 'app/core/components/PageActionBar/PageActionBar';
import EmptyListCTA from '../../core/components/EmptyListCTA/EmptyListCTA';
import { deletePlaylist, getAllPlaylist } from './api';
import { StartModal } from './StartModal';
import { PlaylistPageList } from './PlaylistPageList';
import { EmptyQueryListBanner } from './EmptyQueryListBanner';

interface ConnectedProps {
  navModel: NavModel;
}
export interface PlaylistPageProps extends ConnectedProps, GrafanaRouteComponentProps {}

export const PlaylistPage: FC<PlaylistPageProps> = ({ navModel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [hasFetched, setHasFetched] = useState(false);
  const [startPlaylist, setStartPlaylist] = useState<PlaylistDTO | undefined>();
  const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistDTO | undefined>();
  const [forcePlaylistsFetch, setForcePlaylistsFetch] = useState(0);

  const [playlists, setPlaylists] = useState<PlaylistDTO[]>([]);

  useDebounce(
    async () => {
      const playlists = await getAllPlaylist(searchQuery);
      if (!hasFetched) {
        setHasFetched(true);
      }
      setPlaylists(playlists);
      setDebouncedSearchQuery(searchQuery);
    },
    350,
    [forcePlaylistsFetch, searchQuery]
  );

  const hasPlaylists = playlists && playlists.length > 0;
  const onDismissDelete = () => setPlaylistToDelete(undefined);
  const onDeletePlaylist = () => {
    if (!playlistToDelete) {
      return;
    }
    deletePlaylist(playlistToDelete.id).finally(() => {
      setForcePlaylistsFetch(forcePlaylistsFetch + 1);
      setPlaylistToDelete(undefined);
    });
  };

  const emptyListBanner = (
    <EmptyListCTA
      title="아직 생성된 재생목록이 없습니다"
      buttonIcon="plus"
      buttonLink="playlists/new"
      buttonTitle="플레이리스트 생성"
      proTip="플레이리스트를 사용하여 사용자 제어 없이 TV에서 대시보드를 순환할 수 있습니다."
      //proTipLink="http://docs.grafana.org/reference/playlist/"
      //proTipLinkTitle="Learn more"
      //proTipTarget="_blank"
    />
  );

  if (hasPlaylists) {
    content = (
      <>
        {playlists!.map((playlist) => (
          <Card heading={playlist.name} key={playlist.id.toString()}>
            <Card.Actions>
              <Button variant="secondary" icon="play" onClick={() => setStartPlaylist(playlist)}>
                플레이리스트 시작
              </Button>
              {contextSrv.isEditor && (
                <LinkButton key="edit" variant="secondary" href={`/playlists/edit/${playlist.id}`} icon="cog">
                  플레이리스트 편집
                </LinkButton>
              )}
            </Card.Actions>
          </Card>
        ))}
      </>
    );
  }
  const showSearch = playlists.length > 0 || searchQuery.length > 0 || debouncedSearchQuery.length > 0;

  return (
    <Page navModel={navModel}>
      <Page.Contents isLoading={!hasFetched}>
        {showSearch && (
          <PageActionBar
            searchQuery={searchQuery}
            linkButton={{ title: '새 플레이리스트', href: '/playlists/new' }}
            setSearchQuery={setSearchQuery}
          />
        )}

        {!hasPlaylists && searchQuery ? (
          <EmptyQueryListBanner />
        ) : (
          <PlaylistPageList
            playlists={playlists}
            setStartPlaylist={setStartPlaylist}
            setPlaylistToDelete={setPlaylistToDelete}
          />
        )}
        {!showSearch && emptyListBanner}
        {playlistToDelete && (
          <ConfirmModal
            title={playlistToDelete.name}
            confirmText="Delete"
            body={`Are you sure you want to delete '${playlistToDelete.name}' playlist?`}
            onConfirm={onDeletePlaylist}
            isOpen={Boolean(playlistToDelete)}
            onDismiss={onDismissDelete}
          />
        )}
        {startPlaylist && <StartModal playlist={startPlaylist} onDismiss={() => setStartPlaylist(undefined)} />}
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps: MapStateToProps<ConnectedProps, {}, StoreState> = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'playlists'),
});

export default connect(mapStateToProps)(PlaylistPage);

export interface StartModalProps {
  playlist: PlaylistDTO;
  onDismiss: () => void;
}

export const StartModal: FC<StartModalProps> = ({ playlist, onDismiss }) => {
  const [mode, setMode] = useState<any>(false);
  const [autoFit, setAutofit] = useState(false);

  const modes: Array<SelectableValue<any>> = [
    { label: 'Normal', value: false },
    { label: 'TV', value: 'tv' },
    { label: 'Kiosk', value: true },
  ];

  const onStart = () => {
    const params: any = {};
    if (mode) {
      params.kiosk = mode;
    }
    if (autoFit) {
      params.autofitpanels = true;
    }
    locationService.push(urlUtil.renderUrl(`/playlists/play/${playlist.id}`, params));
  };

  return (
    <Modal isOpen={true} icon="play" title="플레이리스트 시작" onDismiss={onDismiss}>
      <VerticalGroup>
        <Field label="모드">
          <RadioButtonGroup value={mode} options={modes} onChange={setMode} />
        </Field>
        <Checkbox
          label="자동 맞춤"
          description="패널 높이가 화면 크기에 맞게 조정됩니다."
          name="autofix"
          value={autoFit}
          onChange={(e) => setAutofit(e.currentTarget.checked)}
        />
      </VerticalGroup>
      <Modal.ButtonRow>
        <Button variant="primary" onClick={onStart}>
          {playlist.name} 시작
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
