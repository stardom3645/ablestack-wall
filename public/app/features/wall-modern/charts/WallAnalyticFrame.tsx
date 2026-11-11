import { css } from '@emotion/css';
import { RotateCcw, Hand, ZoomIn } from 'lucide-react';
import { ReactNode, RefObject, MutableRefObject, useState } from 'react';
import uPlot from 'uplot';

import {
  TimeSeriesPresentationContext,
  timeSeriesPlotStyles,
} from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { Trans } from 'app/core/internationalization';

import { wallSurfaceTokens } from '../surfaceTokens';
import { Button } from '../ui';

import { AnalyticAppearance } from './analytic';

export function WallAnalyticFrame({
  tokens,
  height,
  plot,
  pan,
  allowPan = true,
  children,
}: {
  tokens: AnalyticAppearance;
  height: number;
  plot: RefObject<uPlot | null>;
  pan: MutableRefObject<boolean>;
  allowPan?: boolean;
  children: (height: number) => ReactNode;
}) {
  const [moving, setMoving] = useState(pan.current);
  const mode = (next: boolean) => {
    pan.current = next;
    setMoving(next);
  };
  return (
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <div
        className={css({
          ...timeSeriesPlotStyles(tokens),
          height,
          fontFamily: tokens.fontFamily,
          color: tokens.text,
          minHeight: 0,
        })}
        data-wall-analytic
      >
        <div
          className={css({
            height: wallSurfaceTokens.controlSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: wallSurfaceTokens.contentGap,
            fontSize: tokens.legendFontSize,
            '& [aria-pressed=true]': { background: tokens.tooltipHeaderBackground, color: tokens.text },
            color: tokens.muted,
            '& .wall-button': {
              minHeight: wallSurfaceTokens.controlSize,
              height: wallSurfaceTokens.controlSize,
              padding: '0 6px',
              fontSize: tokens.legendFontSize,
            },
          })}
        >
          <div
            role="group"
            aria-label="차트 탐색 방식"
            title={
              allowPan
                ? '확대: 끌어서 범위 선택 · 이동: 끌어서 화면 이동 · Alt+드래그로도 이동'
                : '끌어서 구간 범위 확대'
            }
            style={{ display: 'flex', gap: 2 }}
          >
            <Button variant="ghost" aria-pressed={!moving} aria-label="확대 탐색" onClick={() => mode(false)}>
              <ZoomIn size={14} />
              <Trans i18nKey="wall.wall-analytic-frame.text-ecd829d8">확대</Trans>
            </Button>
            {allowPan && (
              <Button variant="ghost" aria-pressed={moving} aria-label="이동 탐색" onClick={() => mode(true)}>
                <Hand size={14} />
                <Trans i18nKey="wall.wall-analytic-frame.text-c686d054">이동</Trans>
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            aria-label="차트 범위 초기화"
            onClick={() => plot.current?.setData(plot.current.data)}
          >
            <RotateCcw size={14} />
            <Trans i18nKey="wall.wall-analytic-frame.text-ff75b4ff">초기화</Trans>
          </Button>
        </div>
        {children(Math.max(0, height - wallSurfaceTokens.controlSize))}
      </div>
    </TimeSeriesPresentationContext.Provider>
  );
}
