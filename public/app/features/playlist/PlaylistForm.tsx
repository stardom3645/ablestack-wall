import React, { FC } from 'react';
import { config } from '@grafana/runtime';
import { Button, Field, Form, HorizontalGroup, Input, LinkButton } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';

import { Playlist } from './types';
import { TagFilter } from '../../core/components/TagFilter/TagFilter';
import { SearchSrv } from '../../core/services/search_srv';
import { usePlaylistItems } from './usePlaylistItems';
import { PlaylistTable } from './PlaylistTable';
import { DashboardPickerByID } from 'app/core/components/editors/DashboardPickerByID';

interface PlaylistFormProps {
  onSubmit: (playlist: Playlist) => void;
  playlist: Playlist;
}

const searchSrv = new SearchSrv();

export const PlaylistForm: FC<PlaylistFormProps> = ({ onSubmit, playlist }) => {
  const { name, interval, items: propItems } = playlist;
  const { items, addById, addByTag, deleteItem, moveDown, moveUp } = usePlaylistItems(propItems);
  return (
    <>
      <Form onSubmit={(list: Playlist) => onSubmit({ ...list, items })} validateOn={'onBlur'}>
        {({ register, errors }) => {
          const isDisabled = items.length === 0 || Object.keys(errors).length > 0;
          return (
            <>
              <Field label="이름" invalid={!!errors.name} error={errors?.name?.message}>
                <Input
                  type="text"
                  {...register('name', { required: '이름은 필수입니다.' })}
                  placeholder="이름"
                  defaultValue={name}
                  aria-label={selectors.pages.PlaylistForm.name}
                />
              </Field>
              <Field label="인터벌" invalid={!!errors.interval} error={errors?.interval?.message}>
                <Input
                  type="text"
                  {...register('interval', { required: '인터벌은 필수입니다.' })}
                  placeholder="5m"
                  defaultValue={interval ?? '5m'}
                  aria-label={selectors.pages.PlaylistForm.interval}
                />
              </Field>

              <PlaylistTable items={items} onMoveUp={moveUp} onMoveDown={moveDown} onDelete={deleteItem} />

              <div className="gf-form-group">
                <h3 className="page-headering">대시보드 추가</h3>

                <Field label="이름으로 추가">
                  <DashboardPickerByID onChange={addById} id="dashboard-picker" isClearable />
                </Field>

                <Field label="태그로 추가">
                  <TagFilter
                    isClearable
                    tags={[]}
                    hideValues
                    tagOptions={searchSrv.getDashboardTags}
                    onChange={addByTag}
                    placeholder={''}
                  />
                </Field>
              </div>

              <HorizontalGroup>
                <Button variant="primary" disabled={isDisabled}>
                  저장
                </Button>
                <LinkButton variant="secondary" href={`${config.appSubUrl}/playlists`}>
                  취소
                </LinkButton>
              </HorizontalGroup>
            </>
          );
        }}
      </Form>
    </>
  );
};
