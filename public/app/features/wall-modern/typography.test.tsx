import { act, render, renderHook, waitFor } from '@testing-library/react';

import { FormattedValueDisplay } from '@grafana/ui/src/components/FormattedValueDisplay/FormattedValueDisplay';

import { wallTypography, wallTypographyVariables, useWallTypographyFonts } from './typography';

const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
afterEach(() => {
  if (originalFonts) {
    Object.defineProperty(document, 'fonts', originalFonts);
  } else {
    Reflect.deleteProperty(document, 'fonts');
  }
});

it('shares the role scale between DOM variables and Canvas/readout consumers', () => {
  expect(wallTypographyVariables).toMatchObject({
    '--wall-type-family': wallTypography.family,
    '--wall-type-kpi-size': `${wallTypography.roles.kpi.size}px`,
    '--wall-type-panel-weight': wallTypography.roles.panel.weight,
    '--wall-type-axis-size': `${wallTypography.roles.axis.size}px`,
  });
  expect(wallTypography.roles.dashboard.size).toBeGreaterThan(wallTypography.roles.section.size);
  expect(wallTypography.roles.section.size).toBeGreaterThan(wallTypography.roles.panel.size);
});

it('loads both mixed-script font faces before invalidating Canvas and never loads them outside the pilot', async () => {
  const load = jest.fn(() => Promise.resolve([{}, {}]));
  Object.defineProperty(document, 'fonts', { value: { load }, configurable: true });
  const outside = renderHook(() => useWallTypographyFonts(false));
  expect(outside.result.current).toBe('disabled');
  expect(load).not.toHaveBeenCalled();
  outside.unmount();
  // All requested weights resolve only when both faces are available.
  const callbacks: Array<(value: Array<Record<string, never>>) => void> = [];
  load.mockImplementation(() => new Promise((resolve) => callbacks.push(resolve)));
  const { result } = renderHook(() => useWallTypographyFonts(true));
  expect(result.current).toBe('loading');
  expect(load).toHaveBeenCalledTimes(8);
  expect(load).toHaveBeenCalledWith(expect.stringContaining('Wall Inter'), expect.stringContaining('가상머신'));
  await act(async () => {
    callbacks.forEach((resolve) => resolve([{}, {}]));
  });
  await waitFor(() => expect(result.current).toBe('ready'));
});

it('keeps a usable fallback when font loading fails', async () => {
  Object.defineProperty(document, 'fonts', {
    value: { load: () => Promise.reject(new Error('offline')) },
    configurable: true,
  });
  const { result } = renderHook(() => useWallTypographyFonts(true));
  await waitFor(() => expect(result.current).toBe('fallback'));
});

it('separates prefix/suffix unit typography without changing formatted values or native defaults', () => {
  const value = { prefix: '$', text: '12.30', suffix: ' GiB' };
  const { container, rerender } = render(<FormattedValueDisplay value={value} style={{ fontSize: 36 }} />);
  expect(container.textContent).toBe('$12.30 GiB');
  expect(container.querySelector('span:last-child')).toHaveStyle({ fontSize: `${36 * 0.6}px` });
  rerender(
    <FormattedValueDisplay
      value={value}
      style={{ fontSize: 36 }}
      unitStyle={{ fontSize: wallTypography.roles.unit.size, fontWeight: wallTypography.roles.unit.weight }}
    />
  );
  expect(container.querySelector('span:first-child')).toHaveStyle({ fontSize: '13px' });
  expect(container.querySelector('span:last-child')).toHaveStyle({ fontSize: '13px' });
  expect(container.textContent).toBe('$12.30 GiB');
});
