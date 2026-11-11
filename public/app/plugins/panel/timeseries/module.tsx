import { PanelPlugin } from '@grafana/data';
import { commonOptionsBuilder } from '@grafana/ui';
import { WallMetricTypeEditor } from 'app/features/wall-modern/charts/WallMetricTypeEditor';
import { WallTimeSeriesOptions } from 'app/features/wall-modern/charts/metricProfiles';

import { TimeSeriesPanel } from './TimeSeriesPanel';
import { TimezonesEditor } from './TimezonesEditor';
import { defaultGraphConfig, getGraphFieldConfig } from './config';
import { graphPanelChangedHandler } from './migrations';
import { FieldConfig } from './panelcfg.gen';
import { TimeSeriesSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<WallTimeSeriesOptions, FieldConfig>(TimeSeriesPanel)
  .setPanelChangeHandler(graphPanelChangedHandler)
  .useFieldConfig(getGraphFieldConfig(defaultGraphConfig))
  .setPanelOptions((builder) => {
    builder.addCustomEditor({
      id: 'wallMetricType',
      path: 'wallMetricType',
      name: 'Metric type',
      category: ['Metric type'],
      editor: WallMetricTypeEditor,
      // The editor resolves missing values to Auto without materializing a new saved option.
      defaultValue: undefined,
    });
    commonOptionsBuilder.addTooltipOptions(builder, false, true);
    commonOptionsBuilder.addLegendOptions(builder);
    builder.addBooleanSwitch({
      path: 'wallLegendAuto',
      name: '범례 자동 배치',
      category: ['Legend'],
      defaultValue: undefined,
      description: '켜면 패널 크기에 따라 하단·우측을 선택합니다. 끄면 기존 범례 위치를 유지합니다.',
    });

    builder.addCustomEditor({
      id: 'timezone',
      name: 'Time zone',
      path: 'timezone',
      category: ['Axis'],
      editor: TimezonesEditor,
      defaultValue: undefined,
    });
  })
  .setSuggestionsSupplier(new TimeSeriesSuggestionsSupplier())
  .setDataSupport({ annotations: true, alertStates: true });
