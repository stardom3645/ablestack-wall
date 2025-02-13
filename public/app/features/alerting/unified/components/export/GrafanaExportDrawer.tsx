import * as React from 'react';

import { Drawer } from '@grafana/ui';
import { t } from 'app/core/internationalization';

import { RuleInspectorTabs } from '../rule-editor/RuleInspector';

import { ExportFormats, ExportProvider } from './providers';

interface GrafanaExportDrawerProps {
  activeTab: ExportFormats;
  onTabChange: (tab: ExportFormats) => void;
  children: React.ReactNode;
  onClose: () => void;
  formatProviders: Array<ExportProvider<ExportFormats>>;
  title?: string;
}

export function GrafanaExportDrawer({
  activeTab,
  onTabChange,
  children,
  onClose,
  formatProviders,
  title = 'Export',
}: GrafanaExportDrawerProps) {
  const grafanaRulesTabs = Object.values(formatProviders).map((provider) => ({
    label: provider.name,
    value: provider.exportFormat,
  }));
  return (
    <Drawer
      title={title}
      subtitle={t(
        'ablestack-wall.alert.select-format-download',
        'Select the format and download the file or copy the contents to clipboard'
      )}
      tabs={
        <RuleInspectorTabs<ExportFormats> tabs={grafanaRulesTabs} setActiveTab={onTabChange} activeTab={activeTab} />
      }
      onClose={onClose}
      size="md"
    >
      {children}
    </Drawer>
  );
}
