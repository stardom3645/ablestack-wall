import { PanelPlugin, VizOrientation, SelectFieldConfigSettings } from '@grafana/data';
import { BarGaugeDisplayMode, BarGaugeNamePlacement, BarGaugeSizing, BarGaugeValueMode } from '@grafana/schema';
import { commonOptionsBuilder, sharedSingleStatPanelChangedHandler } from '@grafana/ui';
import { addWallMeterOptions } from 'app/features/wall-modern/panels/WallMeterOptions';

import { addStandardDataReduceOptions } from '../stat/common';

import { barGaugePanelMigrationHandler } from './BarGaugeMigrations';
import { BarGaugePanel, WallBarOptions } from './BarGaugePanel';
import { defaultOptions } from './panelcfg.gen';
import { BarGaugeSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<WallBarOptions>(BarGaugePanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    addWallMeterOptions(builder, false);
    addStandardDataReduceOptions(builder);
    builder.addRadio({
      path: 'orientation',
      name: 'Orientation',
      defaultValue: VizOrientation.Auto,
      showIf: (o) => o.displayMode !== 'heat-strip',
      settings: {
        options: [
          { value: VizOrientation.Auto, label: 'Auto' },
          { value: VizOrientation.Horizontal, label: 'Horizontal' },
          { value: VizOrientation.Vertical, label: 'Vertical' },
        ],
      },
    });
    commonOptionsBuilder.addLegendOptions(builder, true, false);
    commonOptionsBuilder.addTextSizeOptions(builder);

    builder
      .addRadio<WallBarOptions['displayMode'], SelectFieldConfigSettings<WallBarOptions['displayMode']>>({
        path: 'displayMode',
        name: 'Display mode',
        settings: {
          options: [
            { value: BarGaugeDisplayMode.Gradient, label: 'Gradient · 범위 색상' },
            { value: BarGaugeDisplayMode.Lcd, label: 'Segmented Bar' },
            { value: BarGaugeDisplayMode.Basic, label: 'Basic' },
            { value: 'heat-strip', label: 'Heat Strip' },
          ],
        },
        defaultValue: defaultOptions.displayMode,
      })
      .addBooleanSwitch({
        path: 'wallMeterUseThresholds',
        name: '기존 임계치 색상 사용',
        defaultValue: true,
        description: '끄면 일반 임계치 색 대신 선택한 테마를 사용합니다. 고정색·색상 Override·값 매핑은 유지합니다.',
      })
      .addRadio({
        path: 'wallHeatAggregation',
        name: '시간 구간 집계',
        defaultValue: 'last',
        description:
          '시간 필드와 서로 다른 시점의 측정값 2개 이상이 필요합니다. 오른쪽 수치는 기존 Calculation을 따릅니다.',
        showIf: (options) => options.displayMode === 'heat-strip',
        settings: {
          options: [
            { value: 'last', label: '마지막 값 (Null 포함)' },
            { value: 'mean', label: '평균 (유효값)' },
            { value: 'max', label: '최댓값 (유효값)' },
            { value: 'min', label: '최솟값 (유효값)' },
          ],
        },
      })
      .addRadio({
        path: 'valueMode',
        name: 'Value display',
        settings: {
          options: [
            { value: BarGaugeValueMode.Color, label: 'Value color' },
            { value: BarGaugeValueMode.Text, label: 'Text color' },
            { value: BarGaugeValueMode.Hidden, label: 'Hidden' },
          ],
        },
        defaultValue: defaultOptions.valueMode,
      })
      .addRadio({
        path: 'namePlacement',
        name: 'Name placement',
        settings: {
          options: [
            { value: BarGaugeNamePlacement.Auto, label: 'Auto' },
            { value: BarGaugeNamePlacement.Top, label: 'Top' },
            { value: BarGaugeNamePlacement.Left, label: 'Left' },
            { value: BarGaugeNamePlacement.Hidden, label: 'Hidden' },
          ],
        },
        defaultValue: defaultOptions.namePlacement,
        showIf: (options) => options.displayMode !== 'heat-strip' && options.orientation !== VizOrientation.Vertical,
      })
      .addRadio({
        path: 'namePlacement',
        name: 'Name placement',
        settings: {
          options: [
            { value: BarGaugeNamePlacement.Auto, label: 'Auto' },
            { value: BarGaugeNamePlacement.Hidden, label: 'Hidden' },
          ],
        },
        defaultValue: defaultOptions.namePlacement,
        showIf: (options) => options.displayMode !== 'heat-strip' && options.orientation === VizOrientation.Vertical,
      })
      .addRadio({
        path: 'namePlacement',
        name: 'Name placement',
        defaultValue: defaultOptions.namePlacement,
        showIf: (o) => o.displayMode === 'heat-strip',
        settings: {
          options: [
            { value: BarGaugeNamePlacement.Auto, label: 'Auto' },
            { value: BarGaugeNamePlacement.Hidden, label: 'Hidden' },
          ],
        },
      })
      .addBooleanSwitch({
        path: 'showUnfilled',
        name: 'Show unfilled area',
        description: 'When enabled renders the unfilled region as gray',
        defaultValue: defaultOptions.showUnfilled,
        showIf: (options) => options.displayMode !== 'heat-strip',
      })
      .addRadio({
        path: 'sizing',
        showIf: (o) => o.displayMode !== 'heat-strip',
        name: 'Bar size',
        settings: {
          options: [
            { value: BarGaugeSizing.Auto, label: 'Auto' },
            { value: BarGaugeSizing.Manual, label: 'Manual' },
          ],
        },
        defaultValue: defaultOptions.sizing,
      })
      .addSliderInput({
        path: 'minVizWidth',
        name: 'Min width',
        description: 'Minimum column width (vertical orientation)',
        defaultValue: defaultOptions.minVizWidth,
        settings: {
          min: 0,
          max: 300,
          step: 1,
        },
        showIf: (options) =>
          options.displayMode !== 'heat-strip' &&
          options.sizing === BarGaugeSizing.Manual &&
          (options.orientation === VizOrientation.Auto || options.orientation === VizOrientation.Vertical),
      })
      .addSliderInput({
        path: 'minVizHeight',
        name: 'Min height',
        description: 'Minimum row height (horizontal orientation)',
        defaultValue: defaultOptions.minVizHeight,
        settings: {
          min: 0,
          max: 300,
          step: 1,
        },
        showIf: (options) =>
          options.displayMode !== 'heat-strip' &&
          options.sizing === BarGaugeSizing.Manual &&
          (options.orientation === VizOrientation.Auto || options.orientation === VizOrientation.Horizontal),
      })
      .addSliderInput({
        path: 'maxVizHeight',
        name: 'Max height',
        description: 'Maximum row height (horizontal orientation)',
        defaultValue: defaultOptions.maxVizHeight,
        settings: {
          min: 0,
          max: 300,
          step: 1,
        },
        showIf: (options) =>
          options.displayMode !== 'heat-strip' &&
          options.sizing === BarGaugeSizing.Manual &&
          (options.orientation === VizOrientation.Auto || options.orientation === VizOrientation.Horizontal),
      });
  })
  .setPanelChangeHandler(sharedSingleStatPanelChangedHandler)
  .setMigrationHandler(barGaugePanelMigrationHandler)
  .setSuggestionsSupplier(new BarGaugeSuggestionsSupplier());
