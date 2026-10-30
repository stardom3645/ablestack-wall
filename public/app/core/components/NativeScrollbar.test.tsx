import { render, screen } from '@testing-library/react';

import NativeScrollbar, { ScrollRefElement } from './NativeScrollbar';

it('keeps document scrolling and the unwrapped DOM for existing callers', () => {
  let scroll: ScrollRefElement | undefined;
  render(
    <NativeScrollbar
      onSetScrollRef={(value) => {
        scroll = value;
      }}
    >
      <span>Native content</span>
    </NativeScrollbar>
  );
  expect(screen.getByText('Native content').parentElement?.parentElement).toBe(document.body);
  document.documentElement.scrollTop = 120;
  expect(scroll?.scrollTop).toBe(120);
  document.documentElement.scrollTop = 0;
});

it('uses the bounded scroll element for scene position capture and restoration when opted in', () => {
  let scroll: ScrollRefElement | undefined;
  render(
    <NativeScrollbar
      scrollContainer
      divId="bounded-scroll"
      onSetScrollRef={(value) => {
        scroll = value;
      }}
    >
      <span>Wall content</span>
    </NativeScrollbar>
  );
  const container = screen.getByText('Wall content').parentElement!;
  container.scrollTop = 240;
  expect(scroll?.scrollTop).toBe(240);
  expect(container).toHaveStyle({ overflow: 'auto', minHeight: 0 });
  Object.defineProperty(container, 'scrollHeight', { value: 1200 });
  Object.defineProperty(container, 'clientHeight', { value: 600 });
  container.scrollTo = jest.fn();
  scroll?.scrollTo(0, 320);
  expect(container.scrollTo).toHaveBeenCalledWith(0, 320);
});
