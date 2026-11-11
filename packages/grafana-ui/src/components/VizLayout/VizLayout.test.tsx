import { render, screen } from '@testing-library/react';

import { TimeSeriesPresentationContext } from '../VizPresentation/TimeSeriesPresentation';

import { VizLayout } from './VizLayout';

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 168, height: 70 }],
}));

const contents = (width: number, height: number) => (
  <div data-testid="plot-size">
    {width} / {height}
  </div>
);
function layout(refined: boolean) {
  return (
    <TimeSeriesPresentationContext.Provider
      value={
        refined
          ? ({ refinedInteractions: true } as unknown as React.ContextType<typeof TimeSeriesPresentationContext>)
          : undefined
      }
    >
      <VizLayout
        width={280}
        height={200}
        legend={
          <VizLayout.Legend placement="right" width={400}>
            Legend
          </VizLayout.Legend>
        }
      >
        {contents}
      </VizLayout>
    </TimeSeriesPresentationContext.Provider>
  );
}

it('preserves Wall right placement on a narrow browser and sizes the plot from the measured constrained legend', () => {
  const width = jest.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(800);
  try {
    render(layout(true));
    expect(screen.getByText('Legend').closest('[style*="flex-direction"]')).toHaveStyle({ flexDirection: 'row' });
    expect(screen.getByTestId('plot-size')).toHaveTextContent('112 / 200');
  } finally {
    width.mockRestore();
  }
});

it('retains the native small-browser fallback for non-Wall callers', () => {
  const width = jest.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(800);
  try {
    render(layout(false));
    expect(screen.getByTestId('plot-size')).toHaveTextContent('280 / 130');
  } finally {
    width.mockRestore();
  }
});

it('uses measured legend width even on a wide browser when the requested width exceeds the panel', () => {
  const width = jest.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(1600);
  try {
    render(layout(true));
    expect(screen.getByTestId('plot-size')).toHaveTextContent('112 / 200');
  } finally {
    width.mockRestore();
  }
});
