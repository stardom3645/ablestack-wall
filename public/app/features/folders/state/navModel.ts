import { NavModel, NavModelItem } from '@grafana/data';

import { FolderDTO } from 'app/types';

export function buildNavModel(folder: FolderDTO): NavModelItem {
  const model = {
    icon: 'folder',
    id: 'manage-folder',
    subTitle: '폴더 대시보드 및 권한 관리',
    url: '',
    text: folder.title,
    breadcrumbs: [{ title: '대시보드', url: 'dashboards' }],
    children: [
      {
        active: false,
        icon: 'apps',
        id: `folder-dashboards-${folder.uid}`,
        text: '대시보드',
        url: folder.url,
      },
    ],
  };

  model.children.push({
    active: false,
    icon: 'library-panel',
    id: `folder-library-panels-${folder.uid}`,
    text: '패널',
    url: `${folder.url}/library-panels`,
  });

  if (folder.canAdmin) {
    model.children.push({
      active: false,
      icon: 'lock',
      id: `folder-permissions-${folder.uid}`,
      text: '권한',
      url: `${folder.url}/permissions`,
    });
  }

  if (folder.canSave) {
    model.children.push({
      active: false,
      icon: 'cog',
      id: `folder-settings-${folder.uid}`,
      text: '설정',
      url: `${folder.url}/settings`,
    });
  }

  return model;
}

export function getLoadingNav(tabIndex: number): NavModel {
  const main = buildNavModel({
    id: 1,
    uid: 'loading',
    title: 'Loading',
    url: 'url',
    canSave: true,
    canEdit: true,
    canAdmin: true,
    version: 0,
  });

  main.children![tabIndex].active = true;

  return {
    main: main,
    node: main.children![tabIndex],
  };
}
