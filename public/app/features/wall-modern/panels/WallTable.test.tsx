import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren, useEffect } from 'react';

import { applyFieldOverrides, createTheme, DataFrame, FieldType, MappingType } from '@grafana/data';
import { Table } from '@grafana/ui';

import { wallApplicationTokens } from '../applicationTokens';
import { WallTypographyContext } from '../typography';

import { tableCellText, tableRowText, wallTableStyles } from './tablePresentation';
import { useWallTablePresentation } from './useWallTablePresentation';

// jsdom lacks the browser DOMRect factory used by Base UI's pointer anchor.
Object.defineProperty(window, 'DOMRect', {
  configurable: true,
  value: class {
    static fromRect({ x = 0, y = 0, width = 0, height = 0 } = {}) {
      return {
        x,
        y,
        width,
        height,
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        toJSON() {
          return { x, y, width, height };
        },
      };
    }
  },
});

const config = { defaults: {}, overrides: [] };
function makeData(rows = 200, wrap = false): DataFrame {
  return applyFieldOverrides({
    data: [
      {
        name: '운영 자원',
        length: rows,
        fields: [
          {
            name: '호스트',
            type: FieldType.string,
            values: Array.from(
              { length: rows },
              (_, i) => `host-${String(i).padStart(3, '0')}-long-infrastructure-name`
            ),
            config: { custom: { inspect: true } },
          },
          {
            name: '용량',
            type: FieldType.number,
            values: Array.from({ length: rows }, (_, i) => (i + 1) * 1024 ** 3),
            config: { unit: 'bytes', decimals: 2 },
          },
          {
            name: '상태',
            type: FieldType.number,
            values: Array.from({ length: rows }, (_, i) => i % 2),
            config: {
              mappings: [
                {
                  type: MappingType.ValueToText,
                  options: { '0': { text: '정상', color: 'green' }, '1': { text: '주의', color: 'orange' } },
                },
              ],
              custom: { cellOptions: { type: 'color-text' } },
            },
          },
          {
            name: '비고',
            type: FieldType.string,
            values: Array.from({ length: rows }, () => '운영 설명과 상세 자원 정보'),
            config: { custom: { cellOptions: { type: 'auto', wrapText: wrap } } },
          },
          {
            name: '저장시숨김',
            type: FieldType.string,
            values: Array.from({ length: rows }, () => 'hidden'),
            config: { custom: { hidden: true } },
          },
        ],
      },
    ],
    fieldConfig: config,
    theme: createTheme(),
    replaceVariables: (value) => value,
  })[0];
}
const selectFrame = jest.fn();
function Workspace({ data, sort = jest.fn() }: { data: DataFrame; sort?: (value: unknown) => void }) {
  const presentation = useWallTablePresentation([data], 0, selectFrame);
  return (
    <Table
      width={700}
      height={260}
      data={data}
      fieldConfig={config}
      presentation={presentation}
      onSortByChange={sort}
    />
  );
}
const draw = (data: DataFrame, sort?: (value: unknown) => void) => (
  <WallTypographyContext.Provider value={true}>
    <Workspace data={data} sort={sort} />
  </WallTypographyContext.Provider>
);

it('keeps native virtualization, formatting, mapping and hidden fields with a compact operations toolbar', () => {
  const data = makeData();
  const before = JSON.stringify(data.fields.map((field) => ({ values: field.values, config: field.config })));
  const { container } = render(draw(data));
  expect(screen.getByText('200행')).toBeInTheDocument();
  expect(screen.queryByText('저장시숨김')).not.toBeInTheDocument();
  expect(screen.getAllByRole('row').length).toBeLessThan(30);
  expect(screen.getAllByText('정상')[0]).toHaveClass('wall-table-status');
  expect(screen.getAllByText('GiB', { exact: false })[0]).toBeInTheDocument();
  expect(container.querySelector('[title="host-000-long-infrastructure-name"]')).toBeInTheDocument();
  expect(JSON.stringify(data.fields.map((field) => ({ values: field.values, config: field.config })))).toBe(before);
});

it('uses native column sorting and transient visibility, including wrapped columns, without writing field config', async () => {
  const user = userEvent.setup();
  const sort = jest.fn();
  const data = makeData(12, true);
  const { rerender } = render(draw(data, sort));
  await user.click(screen.getByRole('button', { name: '용량 컬럼 작업' }));
  await user.click(await screen.findByRole('menuitem', { name: '내림차순' }));
  expect(sort).toHaveBeenLastCalledWith([{ displayName: '용량', desc: true }]);
  expect(screen.getByRole('columnheader', { name: /용량/ })).toHaveAttribute('aria-sort', 'descending');
  await user.click(screen.getByRole('button', { name: '용량 컬럼 작업' }));
  await user.click(await screen.findByRole('menuitem', { name: '정렬 해제' }));
  expect(sort).toHaveBeenLastCalledWith([]);
  expect(screen.getByRole('columnheader', { name: /용량/ })).toHaveAttribute('aria-sort', 'none');
  await user.click(screen.getByRole('button', { name: '표시 컬럼 선택' }));
  await user.click(await screen.findByRole('menuitemcheckbox', { name: '비고' }));
  expect(screen.queryByRole('columnheader', { name: /비고/ })).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  rerender(draw({ ...data }, sort));
  expect(screen.queryByRole('columnheader', { name: /비고/ })).not.toBeInTheDocument();
  expect(data.fields[3].config.custom?.hidden).toBeUndefined();
  await user.click(screen.getByRole('button', { name: '표시 컬럼 선택' }));
  await user.click(await screen.findByRole('menuitem', { name: '전체 컬럼 표시' }));
  expect(screen.getByRole('columnheader', { name: /비고/ })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: /저장시숨김/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '표시 컬럼 선택' }));
  await user.click(await screen.findByRole('menuitemcheckbox', { name: '비고' }));
  await user.keyboard('{Escape}');
  rerender(draw({ ...data, name: '다른 결과 프레임' }, sort));
  expect(screen.getByRole('columnheader', { name: /비고/ })).toBeInTheDocument();
});

it('opens a real Base UI cell menu, copies native units/row, and exposes no unsupported filters or links', async () => {
  const user = userEvent.setup();
  const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(draw(makeData(3)));
  const cell = screen.getByTitle('host-000-long-infrastructure-name');
  fireEvent.contextMenu(cell, { clientX: 120, clientY: 100 });
  const menu = await screen.findByRole('menu', { name: '호스트 셀 작업' });
  expect(within(menu).queryByText('이 값으로 필터')).not.toBeInTheDocument();
  expect(within(menu).queryByRole('link')).not.toBeInTheDocument();
  await user.click(within(menu).getByRole('menuitem', { name: '셀 값 복사' }));
  expect(writeText).toHaveBeenLastCalledWith('host-000-long-infrastructure-name');
  fireEvent.contextMenu(screen.getByTitle('host-001-long-infrastructure-name'), { clientX: 120, clientY: 120 });
  await user.click(await screen.findByRole('menuitem', { name: '현재 행 복사' }));
  expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('2.00 GiB\t주의'));
  expect(writeText.mock.calls[writeText.mock.calls.length - 1][0]).not.toContain('hidden');
});

it('copies formatted values and escapes row delimiters without changing raw units/data', () => {
  const frame = makeData(1);
  const original = frame.fields[1].values[0];
  expect(tableCellText(frame.fields[1], 0)).toBe('1.00 GiB');
  expect(tableRowText([frame.fields[1]], 0, [2 * 1024 ** 3])).toBe('2.00 GiB');
  frame.fields[0].values[0] = 'host\t"a"';
  expect(tableRowText(frame.fields.slice(0, 2), 0)).toBe('"host\t""a"""\t1.00 GiB');
  expect(frame.fields[1].values[0]).toBe(original);
});

function MountProbe({ onMount, children }: PropsWithChildren<{ onMount: () => void }>) {
  useEffect(() => {
    onMount();
  }, [onMount]);
  return <>{children}</>;
}

it('keeps virtual cell component instances mounted when column geometry changes', () => {
  const data = makeData(50);
  const mount = jest.fn();
  const styles = {
    fontFamily: 'sans-serif',
    bodySize: 13,
    headerSize: 12,
    headerWeight: 500,
    text: '#111',
    muted: '#666',
    surface: '#fff',
    header: '#eee',
    divider: '#ddd',
    hover: '#eee',
    focus: '#00f',
    resizeHandleWidth: 8,
  };
  const presentation = {
    toolbarHeight: 0,
    styles,
    renderToolbar: () => null,
    renderColumnMenu: () => null,
    renderCell: (_props: unknown, native: () => React.ReactElement) => (
      <MountProbe onMount={mount}>{native()}</MountProbe>
    ),
  };
  const { rerender } = render(<Table width={700} height={260} data={data} presentation={presentation} />);
  const initial = mount.mock.calls.length;
  expect(initial).toBeGreaterThan(0);
  rerender(<Table width={760} height={260} data={data} presentation={presentation} />);
  expect(mount).toHaveBeenCalledTimes(initial);
});

it.each(['light', 'dark'] as const)(
  'uses common %s surfaces without altering native mapping colors or unit formatting',
  (mode) => {
    const theme = createTheme({ colors: { mode } });
    const styles = wallTableStyles(theme);
    expect(styles.text).toBe(wallApplicationTokens[mode].text);
    expect(styles.header).toBe(wallApplicationTokens[mode].soft);
    const data = makeData(2);
    const before = JSON.stringify(data.fields.map((field) => field.config));
    const framed = applyFieldOverrides({
      data: [data],
      fieldConfig: config,
      theme,
      replaceVariables: (value) => value,
    })[0];
    expect(tableCellText(framed.fields[1], 0)).toBe('1.00 GiB');
    expect(tableCellText(framed.fields[2], 1)).toBe('주의');
    expect(framed.fields[2].display!(1).color).toBe(theme.visualization.getColorByName('orange'));
    expect(JSON.stringify(data.fields.map((field) => field.config))).toBe(before);
  }
);
