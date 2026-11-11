import { useContext, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';

import {
  PanelProps,
  buildHistogram,
  cacheFieldDisplayNames,
  getHistogramFields,
  getFieldDisplayName,
  formattedValueToString,
} from '@grafana/data';
import { histogramFieldsToFrame } from '@grafana/data/src/transformations/transformers/histogram';
import { TooltipDisplayMode, TooltipPlugin2, useTheme2 } from '@grafana/ui';
import { TooltipHoverMode } from '@grafana/ui/src/components/uPlot/plugins/TooltipPlugin2';
import { WallAnalyticActions } from 'app/features/wall-modern/charts/WallAnalyticActions';
import { WallAnalyticFrame } from 'app/features/wall-modern/charts/WallAnalyticFrame';
import {
  AnalyticHit,
  AnalyticInteraction,
  analyticTokens,
  analyticFrames,
  binLabel,
} from 'app/features/wall-modern/charts/analytic';
import { WallFontStatusContext, WallTypographyContext } from 'app/features/wall-modern/typography';

import { getDataLinks } from '../status-history/utils';

import { Histogram, getBucketSize } from './Histogram';
import { HistogramTooltip } from './HistogramTooltip';
import { Options } from './panelcfg.gen';

type Props = PanelProps<Options>;

export const HistogramPanel = ({ data, options, width, height, fieldConfig }: Props) => {
  const theme = useTheme2();
  const wall = useContext(WallTypographyContext),
    fonts = useContext(WallFontStatusContext);
  const tokens = useMemo(
    () => (wall ? { ...analyticTokens(theme), fontLoadRevision: fonts } : undefined),
    [wall, theme, fonts]
  );
  const source = useMemo(
    () => (wall ? analyticFrames(data.series, fieldConfig, theme) : data.series),
    [wall, data.series, fieldConfig, theme]
  );
  const plot = useRef<uPlot | null>(null),
    host = useRef<HTMLDivElement>(null),
    selected = useRef<AnalyticHit>();
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const pan = useRef(false);
  const interaction = useMemo<AnalyticInteraction>(
    () => ({
      ready: (u) => {
        plot.current = u;
      },
      selected: () => selected.current,
      panMode: () => pan.current,
      pick: (hit, e) => {
        selected.current = hit;
        setPoint({ x: e.clientX, y: e.clientY });
      },
    }),
    []
  );

  const histogram = useMemo(() => {
    if (!source.length) {
      return undefined;
    }

    // stamp origins for legend's calcs (from raw values)
    source.forEach((frame, frameIndex) => {
      frame.fields.forEach((field, fieldIndex) => {
        field.state = {
          ...field.state,
          origin: {
            frameIndex,
            fieldIndex,
          },
        };
      });
    });

    cacheFieldDisplayNames(source);

    if (source.length === 1) {
      const info = getHistogramFields(source[0]);
      if (info) {
        return histogramFieldsToFrame(info);
      }
    }
    const hist = buildHistogram(source, options);
    if (!hist) {
      return undefined;
    }

    return histogramFieldsToFrame(hist, theme);
  }, [source, options, theme]);

  if (!histogram || !histogram.fields.length) {
    return (
      <div className="panel-empty">
        <p>No histogram found in response</p>
      </div>
    );
  }

  const bucketSize = getBucketSize(histogram);

  const directBins =
    source.length === 1 &&
    source[0].fields.some((f) => f.values === histogram.fields[0].values) &&
    source[0].fields.some((f) => f.values === histogram.fields[1].values);
  const row = selected.current?.didx;
  const action =
    row != null && row < histogram.length
      ? {
          title: binLabel(histogram, row),
          rows: histogram.fields
            .slice(2)
            .filter((f) => !f.config.custom?.hideFrom?.viz)
            .map((f) => ({
              label: getFieldDisplayName(f, histogram),
              value: f.display ? formattedValueToString(f.display(f.values[row])) : String(f.values[row]),
            })),
          links: directBins ? histogram.fields.slice(2).flatMap((f) => getDataLinks(f, row)) : [],
        }
      : undefined;
  const render = (height: number) => (
    <Histogram
      options={options}
      theme={theme}
      legend={options.legend}
      rawSeries={source}
      structureRev={data.structureRev}
      width={width}
      height={height}
      alignedFrame={histogram}
      bucketSize={bucketSize}
      bucketCount={options.bucketCount}
      appearance={tokens}
      interaction={wall ? interaction : undefined}
    >
      {(builder, alignedFrame, xMinOnlyFrame) => {
        return (
          <>
            {options.tooltip.mode !== TooltipDisplayMode.None && (
              <TooltipPlugin2
                config={builder}
                hoverMode={
                  options.tooltip.mode === TooltipDisplayMode.Single ? TooltipHoverMode.xOne : TooltipHoverMode.xAll
                }
                render={(u, dataIdxs, seriesIdx, isPinned = false) => {
                  return (
                    <HistogramTooltip
                      series={histogram}
                      xMinOnlyFrame={xMinOnlyFrame}
                      dataIdxs={dataIdxs}
                      seriesIdx={seriesIdx}
                      mode={options.tooltip.mode}
                      sortOrder={options.tooltip.sort}
                      isPinned={isPinned}
                      maxHeight={options.tooltip.maxHeight}
                      allowBinLinks={!wall || directBins}
                    />
                  );
                }}
                maxWidth={options.tooltip.maxWidth ?? tokens?.tooltipMaxWidth}
              />
            )}
          </>
        );
      }}
    </Histogram>
  );
  return (
    <div ref={host} tabIndex={-1} style={{ width, height }} data-wall-histogram={wall || undefined}>
      {tokens ? (
        <WallAnalyticFrame tokens={tokens} height={height} plot={plot} pan={pan} allowPan={false}>
          {render}
        </WallAnalyticFrame>
      ) : (
        render(height)
      )}
      {wall && point && action && (
        <WallAnalyticActions
          key={`${point.x}/${point.y}`}
          data={action}
          point={point}
          returnFocus={host}
          onClose={() => setPoint(null)}
        />
      )}
    </div>
  );
};
