import { screen, render, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { useToggle } from 'react-use';

import { LoadingState } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { PanelChrome, PanelChromeProps } from './PanelChrome';
import { PanelChromePresentationContext } from './PanelChromePresentation';

const setup = (propOverrides?: Partial<PanelChromeProps>) => {
  const props: PanelChromeProps = {
    width: 100,
    height: 100,
    children: (innerWidth, innerHeight) => {
      return <div style={{ width: innerWidth, height: innerHeight, color: 'pink' }}>Panel&apos;s Content</div>;
    },
  };

  Object.assign(props, propOverrides);
  return render(<PanelChrome {...props} />);
};

const setupWithToggleCollapsed = (propOverrides?: Partial<PanelChromeProps>) => {
  const props: PanelChromeProps = {
    width: 100,
    height: 100,
    children: (innerWidth, innerHeight) => {
      return <div style={{ width: innerWidth, height: innerHeight, color: 'pink' }}>Panel&apos;s Content</div>;
    },
    collapsible: true,
  };

  Object.assign(props, propOverrides);

  const ControlledCollapseComponent = () => {
    const [collapsed, toggleCollapsed] = useToggle(false);

    return <PanelChrome {...props} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />;
  };

  return render(<ControlledCollapseComponent />);
};

it('renders an empty panel with required props only', () => {
  setup();

  expect(screen.getByText("Panel's Content")).toBeInTheDocument();
});

it('uses optional presentation padding for both the DOM inset and native renderer dimensions', () => {
  render(
    <PanelChromePresentationContext.Provider
      value={{
        headerHeight: 32,
        contentPadding: { horizontal: 16, vertical: 8 },
        renderHeader: ({ title }) => <span>{title}</span>,
      }}
    >
      <PanelChrome width={300} height={100} padding="none" title="Wall KPI">
        {(width, height) => <div data-testid="wall-sized-content" style={{ width, height }} />}
      </PanelChrome>
    </PanelChromePresentationContext.Provider>
  );
  const content = screen.getByTestId('wall-sized-content');
  expect(content.parentElement).toHaveStyle({ padding: '8px 16px' });
  expect(content).toHaveStyle({ width: '266px', height: '50px' });
});

it('lets a fill presentation follow its host immediately without changing the native renderer size contract', () => {
  const view = (width: number, height: number, collapsed = false) => (
    <PanelChromePresentationContext.Provider
      value={{
        fitToContainer: true,
        headerHeight: 32,
        contentPadding: { horizontal: 16, vertical: 8 },
        renderHeader: ({ title, titleId }) => <span id={titleId}>{title}</span>,
      }}
    >
      <PanelChrome width={width} height={height} title="Responsive Wall" collapsed={collapsed}>
        {(w, h) => <div data-testid="responsive-content" style={{ width: w, height: h }} />}
      </PanelChrome>
    </PanelChromePresentationContext.Provider>
  );
  const { rerender } = render(view(573, 268));
  const frame = screen.getByRole('region', { name: 'Responsive Wall' });
  expect(frame).toHaveStyle({ width: '100%', height: '100%' });
  // ResizeObserver can still hold the previous 573px sample while the host is
  // already 484px wide. That sample only sizes content, never the painted frame.
  expect(screen.getByTestId('responsive-content')).toHaveStyle({ width: '539px', height: '218px' });
  rerender(view(484, 232));
  expect(screen.getByRole('region', { name: 'Responsive Wall' })).toBe(frame);
  expect(frame).toHaveStyle({ width: '100%', height: '100%' });
  expect(screen.getByTestId('responsive-content')).toHaveStyle({ width: '450px', height: '182px' });
  rerender(view(656, 296));
  expect(frame).toHaveStyle({ width: '100%', height: '100%' });
  expect(screen.getByTestId('responsive-content')).toHaveStyle({ width: '622px', height: '246px' });
  rerender(view(656, 296, true));
  expect(frame.style.height).toBe('');
});

it('renders an empty panel without padding', () => {
  setup({ padding: 'none' });

  expect(screen.getByText("Panel's Content").parentElement).toHaveStyle({ padding: '0px' });
});

it('renders an empty panel with padding', () => {
  setup({ padding: 'md' });

  expect(screen.getByText("Panel's Content").style.getPropertyValue('height')).not.toBe('100px');
  expect(screen.getByText("Panel's Content").parentElement).not.toHaveStyle({ padding: '0px' });
});

// Check for backwards compatibility
it('renders panel header if prop title', () => {
  setup({ title: 'Test Panel Header' });

  expect(screen.getByTestId('header-container')).toBeInTheDocument();
});

// Check for backwards compatibility
it('renders panel with title in place if prop title', () => {
  setup({ title: 'Test Panel Header' });

  expect(screen.getByText('Test Panel Header')).toBeInTheDocument();
});

// Check for backwards compatibility
it('renders panel with a header if prop leftItems', () => {
  setup({
    leftItems: [<div key="left-item-test"> This should be a self-contained node </div>],
  });

  expect(screen.getByTestId('header-container')).toBeInTheDocument();
});

it('renders panel with a hovering header if prop hoverHeader is true', () => {
  setup({ title: 'Test Panel Header', hoverHeader: true });

  expect(screen.queryByTestId('header-container')).not.toBeInTheDocument();
});

it('renders panel with a header if prop titleItems', () => {
  setup({
    titleItems: [<div key="title-item-test"> This should be a self-contained node </div>],
  });

  expect(screen.getByTestId('header-container')).toBeInTheDocument();
});

it('renders panel with a header with icons in place if prop titleItems', () => {
  setup({
    titleItems: [<div key="title-item-test"> This should be a self-contained node </div>],
  });

  expect(screen.getByTestId('title-items-container')).toBeInTheDocument();
});

it('renders panel with a show-on-hover menu icon if prop menu', () => {
  setup({ menu: <div> Menu </div> });

  expect(screen.getByTestId('panel-menu-button')).toBeInTheDocument();
  // Hover/focus visibility is CSS-driven; JSDOM does not reliably evaluate those selectors.
  expect(screen.getByTestId('panel-menu-button')).toHaveClass('show-on-hover');
});

it('renders error status in the panel header if any given', () => {
  setup({ statusMessage: 'Error test' });

  expect(screen.getByLabelText('Panel status')).toBeInTheDocument();
});

it('does not render error status in the panel header if loadingState is error, but no statusMessage', () => {
  setup({ loadingState: LoadingState.Error, statusMessage: '' });

  expect(screen.queryByTestId('panel-status')).not.toBeInTheDocument();
});

it('renders loading indicator in the panel header if loadingState is loading', () => {
  setup({ loadingState: LoadingState.Loading });

  expect(screen.getByLabelText('Panel loading bar')).toBeInTheDocument();
});

it('renders loading indicator in the panel header if loadingState is loading regardless of not having a header', () => {
  setup({ loadingState: LoadingState.Loading, hoverHeader: true });

  expect(screen.getByLabelText('Panel loading bar')).toBeInTheDocument();
});

it('renders loading indicator in the panel header if loadingState is loading regardless of having a header', () => {
  setup({ loadingState: LoadingState.Loading, hoverHeader: false });

  expect(screen.getByLabelText('Panel loading bar')).toBeInTheDocument();
});

it('renders streaming indicator in the panel header if loadingState is streaming', () => {
  setup({ loadingState: LoadingState.Streaming });

  expect(screen.getByTestId('panel-streaming')).toBeInTheDocument();
});

it('collapses the controlled panel when user clicks on the chevron or the title', () => {
  setupWithToggleCollapsed({ title: 'Default title' });

  expect(screen.getByText("Panel's Content")).toBeInTheDocument();

  const button = screen.getByRole('button', { name: 'Default title' });
  const content = screen.getByTestId(selectors.components.Panels.Panel.content);
  // collapse button should have same aria-controls as the panel's content
  expect(button.getAttribute('aria-controls')).toBe(content.id);

  fireEvent.click(button);

  expect(screen.queryByText("Panel's Content")).not.toBeInTheDocument();
  // aria-controls should be removed when panel is collapsed
  expect(button).not.toHaveAttribute('aria-controlls');
  expect(screen.queryByTestId(selectors.components.Panels.Panel.content)?.id).toBe(undefined);
});

it('collapses the uncontrolled panel when user clicks on the chevron or the title', () => {
  setup({ title: 'Default title', collapsible: true });

  expect(screen.getByText("Panel's Content")).toBeInTheDocument();

  const button = screen.getByRole('button', { name: 'Default title' });
  const content = screen.getByTestId(selectors.components.Panels.Panel.content);

  // collapse button should have same aria-controls as the panel's content
  expect(button.getAttribute('aria-controls')).toBe(content.id);

  fireEvent.click(button);
  expect(screen.queryByText("Panel's Content")).not.toBeInTheDocument();
  // aria-controls should be removed when panel is collapsed
  expect(button).not.toHaveAttribute('aria-controlls');
  expect(screen.queryByTestId(selectors.components.Panels.Panel.content)?.id).toBe(undefined);
});

it('uses the native drag class only on the app-owned Grip without changing the panel border box', () => {
  render(
    <PanelChromePresentationContext.Provider
      value={{
        name: 'common',
        headerHeight: 44,
        getHeaderHeight: ({ height }) => (height! < 96 ? 28 : 44),
        contentPadding: { horizontal: 0, vertical: 0 },
        renderHeader: ({ title, titleId, dragClass }) => (
          <>
            <button className={dragClass}>Grip</button>
            <span id={titleId}>{title}</span>
          </>
        ),
      }}
    >
      <PanelChrome width={240} height={60} title="Short KPI" dragClass="native-grip">
        {(width, height) => (
          <div data-testid="short-value" style={{ width, height }}>
            24
          </div>
        )}
      </PanelChrome>
    </PanelChromePresentationContext.Provider>
  );
  expect(screen.getByRole('button', { name: 'Grip' })).toHaveClass('native-grip');
  expect(screen.getByTestId('header-container')).not.toHaveClass('native-grip');
  expect(screen.getByTestId('header-container')).toHaveStyle({ height: '28px' });
  expect(screen.getByTestId('short-value')).toHaveStyle({ width: '238px', height: '30px' });
  expect(screen.getByRole('region', { name: 'Short KPI' })).toHaveStyle({ width: '240px', height: '60px' });
});

it('keeps untitled native content full height and mounted behind an app-owned state/header', () => {
  const mounted = jest.fn();
  const Content = () => {
    useEffect(() => {
      mounted();
    }, []);
    return <div data-testid="untitled-content">native chart</div>;
  };
  const presentation = {
    name: 'common',
    headerHeight: 44,
    contentPadding: { horizontal: 0, vertical: 0 },
    renderHeader: () => <span>unused</span>,
    renderHoverHeader: () => <button>Wall actions</button>,
    renderContent: (children: React.ReactNode) => (
      <div data-testid="state-projection">
        {children}
        <span>Loading</span>
      </div>
    ),
  };
  render(
    <PanelChromePresentationContext.Provider value={presentation}>
      <PanelChrome width={240} height={60} hoverHeader>
        {(width, height) => (
          <div data-testid="untitled-size" style={{ width, height }}>
            <Content />
          </div>
        )}
      </PanelChrome>
    </PanelChromePresentationContext.Provider>
  );
  expect(screen.queryByTestId('header-container')).not.toBeInTheDocument();
  expect(screen.getByTestId('untitled-size')).toHaveStyle({ width: '238px', height: '58px' });
  expect(screen.getByRole('button', { name: 'Wall actions' })).toBeInTheDocument();
  expect(screen.getByTestId('untitled-content')).toBeInTheDocument();
  expect(mounted).toHaveBeenCalledTimes(1);
});
