import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { render } from 'test/test-utils';

import { ThresholdsMode, type ThresholdsConfig } from '@grafana/data';

import { WallThresholdEditor } from './WallThresholdEditor';

const initial: ThresholdsConfig = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { value: -Infinity, color: 'green' },
    { value: 80, color: 'red' },
    { value: 90, color: 'orange' },
  ],
};

function setup(config = initial) {
  const changed = jest.fn();
  function Editor() {
    const [value, setValue] = useState(config);
    return (
      <WallThresholdEditor
        thresholds={value}
        onChange={(next) => {
          changed(next);
          setValue(next);
        }}
      />
    );
  }
  return { ...render(<Editor />), changed };
}

it('explains inclusive boundaries, retains the base and never writes when opening', () => {
  const source = JSON.parse(JSON.stringify(initial));
  const { changed } = setup(source);
  expect(screen.getByText('80 이상 ~ 90 미만')).toBeInTheDocument();
  expect(screen.getByText('80 미만')).toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: '구간 1 시작 값' })).toHaveValue(80);
  expect(screen.getByText(/알림을 보내는 경보 규칙/)).toBeInTheDocument();
  expect(changed).not.toHaveBeenCalled();
  expect(source.steps[0].value).toBeNull();
});

it('commits finite decimal and negative values in ascending order without reassigning their colors', () => {
  const { changed } = setup();
  const field = screen.getByRole('spinbutton', { name: '구간 2 시작 값' });
  fireEvent.change(field, { target: { value: '-2.5' } });
  fireEvent.blur(field);
  expect(changed).toHaveBeenLastCalledWith({
    mode: ThresholdsMode.Absolute,
    steps: [initial.steps[0], { value: -2.5, color: 'orange' }, initial.steps[1]],
  });
  expect(initial.steps[2].value).toBe(90);
});

it('keeps incomplete and duplicate input local instead of emitting zero, NaN or duplicate boundaries', () => {
  const { changed } = setup();
  const field = screen.getByRole('spinbutton', { name: '구간 1 시작 값' });
  fireEvent.change(field, { target: { value: '' } });
  fireEvent.blur(field);
  expect(screen.getByRole('alert')).toHaveTextContent('유효한 숫자');
  expect(screen.getByRole('button', { name: '구간 추가' })).toBeDisabled();
  expect(changed).not.toHaveBeenCalled();
  fireEvent.change(field, { target: { value: '90' } });
  fireEvent.blur(field);
  expect(screen.getByRole('alert')).toHaveTextContent('서로 달라야');
  expect(changed).not.toHaveBeenCalled();
  fireEvent.change(field, { target: { value: '70' } });
  fireEvent.blur(field);
  expect(changed).toHaveBeenLastCalledWith(
    expect.objectContaining({ steps: [initial.steps[0], { value: 70, color: 'red' }, initial.steps[2]] })
  );
});

it('adds, focuses and removes a boundary, and changes calculation mode without scaling existing values', () => {
  const { changed } = setup();
  fireEvent.click(screen.getByRole('button', { name: '구간 추가' }));
  expect(screen.getByRole('spinbutton', { name: '구간 3 시작 값' })).toHaveFocus();
  expect(changed.mock.lastCall[0].steps[3].value).toBe(100);
  fireEvent.click(screen.getByRole('button', { name: '구간 3 삭제' }));
  expect(changed.mock.lastCall[0].steps).toEqual(initial.steps);
  fireEvent.click(screen.getByRole('radio', { name: '범위 대비 비율' }));
  expect(changed).toHaveBeenLastCalledWith({ ...initial, mode: ThresholdsMode.Percentage });
  expect(screen.getByText('80% 이상 ~ 90% 미만')).toBeInTheDocument();
});

it('responds to external config changes and handles an empty threshold set without mutating it', () => {
  const changed = jest.fn();
  const empty = { mode: ThresholdsMode.Absolute, steps: [] };
  const { rerender } = render(<WallThresholdEditor thresholds={empty} onChange={changed} />);
  expect(screen.getByText('모든 값에 적용')).toBeInTheDocument();
  expect(empty.steps).toEqual([]);
  rerender(<WallThresholdEditor thresholds={initial} onChange={changed} />);
  expect(screen.getByRole('spinbutton', { name: '구간 2 시작 값' })).toHaveValue(90);
  expect(changed).not.toHaveBeenCalled();
});
