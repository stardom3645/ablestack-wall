import { css } from '@emotion/css';
import { Pencil, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

import { textUtil } from '@grafana/data';
import type { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { Trans } from 'app/core/internationalization';

import { Button } from '../ui';

export function WallAnnotationDetails({
  start,
  end,
  html,
  alertText,
  avatar,
  state,
  tags,
  onEdit,
  onDelete,
  tokens,
}: {
  start: string;
  end?: string;
  html: string;
  alertText: string;
  avatar?: ReactNode;
  state?: ReactNode;
  tags: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  tokens: TimeSeriesPresentation;
}) {
  return (
    <section
      data-wall-annotation-details
      className={css({
        fontFamily: tokens.fontFamily,
        fontSize: tokens.tooltipFontSize,
        lineHeight: `${tokens.tooltipLineHeight}px`,
        color: tokens.text,
        '& header': {
          display: 'flex',
          alignItems: 'flex-start',
          gap: tokens.tooltipRowGap,
          padding: tokens.tooltipPadding,
          background: tokens.tooltipHeaderBackground,
          borderBottom: `1px solid ${tokens.border}`,
        },
        '& time': { display: 'block', fontVariantNumeric: 'tabular-nums', fontWeight: tokens.tooltipFontWeight },
        '& small': { color: tokens.muted, fontSize: tokens.legendHeaderSize },
        '& .wall-annotation-meta': { flex: 1, minWidth: 0 },
        '& .wall-annotation-body': { padding: tokens.tooltipPadding, overflowWrap: 'anywhere' },
        '& .wall-annotation-body a': { color: tokens.palette[0] },
        '& .wall-annotation-actions': { display: 'flex', gap: tokens.tooltipRowGap },
        '& .wall-annotation-actions button': { width: 28, height: 28, minHeight: 0, padding: 0 },
        '& .wall-annotation-tags': {
          display: 'flex',
          flexWrap: 'wrap',
          gap: tokens.tooltipRowGap,
          marginTop: tokens.tooltipRowGap,
        },
        '& .wall-annotation-tags span': {
          padding: '1px 6px',
          borderRadius: tokens.radius / 2,
          background: tokens.tooltipHeaderBackground,
          color: tokens.muted,
          fontSize: tokens.legendHeaderSize,
        },
      })}
    >
      <header>
        {avatar}
        {state}
        <div className="wall-annotation-meta">
          <small>{end ? '기간 이벤트' : '시점 이벤트'}</small>
          <time>{start}</time>
          {end && (
            <time>
              <Trans i18nKey="wall.wall-annotation-details.text-213edd25">→ </Trans>
              {end}
            </time>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="wall-annotation-actions">
            {onEdit && (
              <Button variant="ghost" aria-label="주석 편집" onClick={onEdit}>
                <Pencil size={14} />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" aria-label="주석 삭제" onClick={onDelete}>
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </header>
      <div className="wall-annotation-body">
        {html && <div dangerouslySetInnerHTML={{ __html: textUtil.sanitize(html) }} />}
        {alertText}
        {tags.length > 0 && (
          <div className="wall-annotation-tags">
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
