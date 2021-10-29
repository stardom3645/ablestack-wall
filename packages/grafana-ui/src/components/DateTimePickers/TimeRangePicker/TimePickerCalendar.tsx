import React, { FormEvent, memo } from 'react';
import { css } from '@emotion/css';
import { DateTime, GrafanaTheme2, TimeZone } from '@grafana/data';
import { useTheme2 } from '../../../themes';
import { Header } from './CalendarHeader';
import { Portal } from '../../Portal/Portal';
import { selectors } from '@grafana/e2e-selectors';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import { Body } from './CalendarBody';
import { Footer } from './CalendarFooter';

export const getStyles = (theme: GrafanaTheme2, isReversed = false) => {
  return {
    container: css`
      top: -1px;
      position: absolute;
      ${isReversed ? 'left' : 'right'}: 544px;
      box-shadow: ${theme.shadows.z3};
      background-color: ${theme.colors.background.primary};
      z-index: -1;
      border: 1px solid ${theme.colors.border.weak};
      border-radius: 2px 0 0 2px;

      &:after {
        display: block;
        background-color: ${theme.colors.background.primary};
        width: 19px;
        height: 100%;
        content: ${!isReversed ? ' ' : ''};
        position: absolute;
        top: 0;
        right: -19px;
        border-left: 1px solid ${theme.colors.border.weak};
      }
    `,
    modal: css`
      position: fixed;
      top: 20%;
      left: 25%;
      width: 100%;
      z-index: ${theme.zIndex.modal};
    `,
    content: css`
      margin: 0 auto;
      width: 268px;
    `,
    backdrop: css`
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: #202226;
      opacity: 0.7;
      z-index: ${theme.zIndex.modalBackdrop};
      text-align: center;
    `,
  };
};

export interface TimePickerCalendarProps {
  isOpen: boolean;
  from: DateTime;
  to: DateTime;
  onClose: () => void;
  onApply: (e: FormEvent<HTMLButtonElement>) => void;
  onChange: (from: DateTime, to: DateTime) => void;
  isFullscreen: boolean;
  timeZone?: TimeZone;
  isReversed?: boolean;
}

const stopPropagation = (event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation();

function TimePickerCalendar(props: TimePickerCalendarProps) {
  const theme = useTheme2();
  const styles = getStyles(theme, props.isReversed);
  const { isOpen, isFullscreen } = props;
  const ref = React.createRef<HTMLElement>();
  const { overlayProps } = useOverlay(props, ref);

  if (!isOpen) {
    return null;
  }

  if (isFullscreen) {
    return (
      <FocusScope contain restoreFocus autoFocus>
        <section
          className={styles.container}
          onClick={stopPropagation}
          aria-label={selectors.components.TimePicker.calendar.label}
          ref={ref}
          {...overlayProps}
        >
          <Header {...props} />
          <Body {...props} />
        </section>
      </FocusScope>
    );
  }

  return (
    <Portal>
      <FocusScope contain autoFocus restoreFocus>
        <section className={styles.modal} onClick={stopPropagation} ref={ref} {...overlayProps}>
          <div className={styles.content} aria-label={selectors.components.TimePicker.calendar.label}>
            <Header {...props} />
            <Body {...props} />
            <Footer {...props} />
          </div>
        </section>
      </FocusScope>
      <div className={styles.backdrop} onClick={stopPropagation} />
    </Portal>
  );
});

TimePickerCalendar.displayName = 'TimePickerCalendar';

const Header = memo<Props>(({ onClose }) => {
  const theme = useTheme2();
  const styles = getHeaderStyles(theme);

  return (
    <div className={styles.container}>
      <TimePickerTitle>Select a time range</TimePickerTitle>
      <Icon name="times" onClick={onClose} />
    </div>
  );
});

Header.displayName = 'Header';

export const Body = memo<Props>(({ onChange, from, to, timeZone }) => {
  const value = inputToValue(from, to);
  const theme = useTheme2();
  const onCalendarChange = useOnCalendarChange(onChange, timeZone);
  const styles = getBodyStyles(theme);

  return (
    <Calendar
      selectRange={true}
      next2Label={null}
      prev2Label={null}
      className={styles.body}
      tileClassName={styles.title}
      value={value}
      nextLabel={<Icon name="angle-right" />}
      prevLabel={<Icon name="angle-left" />}
      onChange={onCalendarChange}
      locale="en"
    />
  );
});

Body.displayName = 'Body';

const Footer = memo<Props>(({ onClose, onApply }) => {
  const theme = useTheme2();
  const styles = getFooterStyles(theme);

  return (
    <div className={styles.container}>
      <Button className={styles.apply} onClick={onApply}>
        시간 범위 적용
      </Button>
      <Button variant="secondary" onClick={onClose}>
        취소
      </Button>
    </div>
  );
});

Footer.displayName = 'Footer';

export function inputToValue(from: DateTime, to: DateTime, invalidDateDefault: Date = new Date()): Date[] {
  const fromAsDate = from.toDate();
  const toAsDate = to.toDate();
  const fromAsValidDate = dateTime(fromAsDate).isValid() ? fromAsDate : invalidDateDefault;
  const toAsValidDate = dateTime(toAsDate).isValid() ? toAsDate : invalidDateDefault;

  if (fromAsValidDate > toAsValidDate) {
    return [toAsValidDate, fromAsValidDate];
  }
  return [fromAsValidDate, toAsValidDate];
}

function useOnCalendarChange(onChange: (from: DateTime, to: DateTime) => void, timeZone?: TimeZone) {
  return useCallback(
    (value: Date | Date[]) => {
      if (!Array.isArray(value)) {
        return console.error('onCalendarChange: should be run in selectRange={true}');
      }

      const from = dateTimeParse(dateInfo(value[0]), { timeZone });
      const to = dateTimeParse(dateInfo(value[1]), { timeZone });

      onChange(from, to);
    },
    [onChange, timeZone]
  );
}

function dateInfo(date: Date): number[] {
  return [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
}
export default memo(TimePickerCalendar);
TimePickerCalendar.displayName = 'TimePickerCalendar';
