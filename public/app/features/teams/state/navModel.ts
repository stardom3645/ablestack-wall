import { Team, TeamPermissionLevel } from 'app/types';
import config from 'app/core/config';
import { NavModelItem, NavModel } from '@grafana/data';

export function buildNavModel(team: Team): NavModelItem {
  const navModel = {
    img: team.avatarUrl,
    id: 'team-' + team.id,
    subTitle: '회원 및 설정 관리',
    url: '',
    text: team.name,
    breadcrumbs: [{ title: '팀', url: 'org/teams' }],
    children: [
      {
        active: false,
        icon: 'users-alt',
        id: `team-members-${team.id}`,
        text: '회원',
        url: `org/teams/edit/${team.id}/members`,
      },
      {
        active: false,
        icon: 'sliders-v-alt',
        id: `team-settings-${team.id}`,
        text: '설정',
        url: `org/teams/edit/${team.id}/settings`,
      },
    ],
  };

  if (config.licenseInfo.hasLicense) {
    navModel.children.push({
      active: false,
      icon: 'sync',
      id: `team-groupsync-${team.id}`,
      text: 'External group sync',
      url: `org/teams/edit/${team.id}/groupsync`,
    });
  }

  return navModel;
}

export function getTeamLoadingNav(pageName: string): NavModel {
  const main = buildNavModel({
    avatarUrl: 'public/img/user_profile.png',
    id: 1,
    name: 'Loading',
    email: 'loading',
    memberCount: 0,
    permission: TeamPermissionLevel.Member,
  });

  let node: NavModelItem;

  // find active page
  for (const child of main.children!) {
    if (child.id!.indexOf(pageName) > 0) {
      child.active = true;
      node = child;
      break;
    }
  }

  return {
    main: main,
    node: node!,
  };
}
