import { screen, render } from '@testing-library/react';

import { selectors } from '@grafana/e2e-selectors';

import { ButtonRow, Props } from './ButtonRow';

const setup = (propOverrides?: object) => {
  const props: Props = {
    canSave: false,
    canDelete: true,
    onDelete: jest.fn(),
    onSubmit: jest.fn(),
    onTest: jest.fn(),
  };

  Object.assign(props, propOverrides);

  return render(<ButtonRow {...props} />);
};

describe('<ButtonRow>', () => {
  it('should render component', () => {
    setup();

    expect(screen.getByTestId(selectors.pages.DataSource.delete)).toBeInTheDocument();
    expect(screen.getByText('연결 테스트')).toBeInTheDocument();
  });

  it('disables repeat actions while testing', () => {
    setup({ canSave: true, pending: '연결 테스트 중…' });
    expect(screen.getByTestId(selectors.pages.DataSource.saveAndTest)).toBeDisabled();
    expect(screen.getByTestId(selectors.pages.DataSource.delete)).toBeDisabled();
  });

  it('should render save & test', () => {
    setup({ canSave: true });

    expect(screen.getByTestId(selectors.pages.DataSource.saveAndTest)).toBeInTheDocument();
  });
});
