import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';

import { panelScrollClass } from '../PanelScrollArea/PanelScrollArea';
import { VizPresentationContext } from '../VizPresentation/VizPresentation';

import { CustomScrollbar } from './CustomScrollbar';

let mockGutter = 0;
jest.mock('react-custom-scrollbars-2/lib/utils/getScrollbarWidth', () => ({
  __esModule: true,
  default: () => mockGutter,
}));
afterEach(() => {
  mockGutter = 0;
});

describe('CustomScrollbar', () => {
  it('renders correctly', () => {
    const tree = renderer
      .create(
        <CustomScrollbar>
          <p>Scrollable content</p>
        </CustomScrollbar>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('keeps the opt-in legend viewport inside its bounds without losing the vertical scroll range', () => {
    const { container } = render(
      <CustomScrollbar hideNativeScrollbars hideHorizontalTrack>
        <p>Legend content</p>
      </CustomScrollbar>
    );
    const viewport = screen.getByText('Legend content').parentElement;
    expect(viewport).toHaveStyle({ overflow: 'auto', marginRight: '0px', marginBottom: '0px', maxHeight: '100%' });
    expect(container.querySelector('.track-vertical')).toBeInTheDocument();
    expect(container.querySelector('.track-horizontal')).toHaveStyle({ display: 'none' });
  });

  it('uses an unmasked native Wall viewport when overlay scrollbar measurement is zero', () => {
    // JSDOM, like overlay-scrollbar environments, reports zero layout gutter.
    const measure = require('react-custom-scrollbars-2/lib/utils/getScrollbarWidth').default;
    expect(measure()).toBe(0);
    const content = () => (
      <VizPresentationContext.Provider value={{} as unknown as React.ContextType<typeof VizPresentationContext>}>
        <CustomScrollbar hideNativeScrollbars hideHorizontalTrack contentInset={16}>
          <p>Wall legend</p>
        </CustomScrollbar>
      </VizPresentationContext.Provider>
    );
    const { container, rerender } = render(content());
    const viewport = screen.getByText('Wall legend').parentElement!;
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(viewport).toHaveStyle({ overflow: 'auto', marginRight: '0px' });
    expect(viewport).toHaveClass(panelScrollClass);
    expect(container.querySelector('.track-vertical')).toHaveStyle({ display: 'none' });
    expect(container.querySelector('.track-horizontal')).toHaveStyle({ display: 'none' });
    // A later gutter remeasurement must not revive a painted but inert JS thumb.
    mockGutter = 15;
    rerender(content());
    expect(viewport.style.scrollbarGutter).toBe('stable');
    expect(viewport).toHaveStyle({ paddingInlineEnd: '10px' });
    expect(container.querySelector('.track-vertical')).toHaveStyle({ display: 'none' });
  });
});
