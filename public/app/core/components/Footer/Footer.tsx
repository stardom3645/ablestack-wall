import React, { FC } from 'react';
import config from 'app/core/config';

export interface FooterLink {
  text: string;
  icon?: string;
  url?: string;
  target?: string;
}

export let getFooterLinks = (): FooterLink[] => {
  return [
    {
      text: '문서',
      icon: 'document-info',
      url: 'https://docs.ablecloud.io/',
      target: '_blank',
    },
    {
      text: '지원',
      icon: 'question-circle',
      url: 'https://github.com/ablecloud-team/ablestack-cloud/issues/new',
      target: '_blank',
    },
  ];
};

export let getVersionLinks = (): FooterLink[] => {
  const { buildInfo, licenseInfo } = config;
  const links: FooterLink[] = [];
  const stateInfo = licenseInfo.stateInfo ? ` (${licenseInfo.stateInfo})` : '';

  links.push({ text: `${buildInfo.edition}${stateInfo}`, url: licenseInfo.licenseUrl });

  if (buildInfo.hideVersion) {
    return links;
  }

  links.push({ text: `v${buildInfo.version} (${buildInfo.commit})` });

  if (buildInfo.hasUpdate) {
    links.push({
      text: `New version available!`,
      icon: 'download-alt',
      url: 'https://grafana.com/grafana/download?utm_source=grafana_footer',
      target: '_blank',
    });
  }

  return links;
};

export function setFooterLinksFn(fn: typeof getFooterLinks) {
  getFooterLinks = fn;
}

export function setVersionLinkFn(fn: typeof getFooterLinks) {
  getVersionLinks = fn;
}

export const Footer: FC = React.memo(() => {
  return (
    <footer className="footer">
      <div className="text-center">
        Copyright (c) 2021, ABLECLOUD.Co.Ltd<br></br>ABLESTACK Bronto - Powered By Apache CloudStack
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
