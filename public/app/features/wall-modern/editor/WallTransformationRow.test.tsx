import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { fireEvent, render, screen } from '@testing-library/react';

import { WallTransformationRow } from './WallTransformationRow';

it('discloses only selected settings while keeping native actions and draft fields intact', () => {
  const disable = jest.fn();
  render(
    <DragDropContext onDragEnd={jest.fn()}>
      <Droppable droppableId="transforms">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <WallTransformationRow
              id="1-organize"
              index={0}
              title="Organize fields"
              disabled={false}
              actions={<button onClick={disable}>Native disable</button>}
            >
              <input aria-label="Native field setting" defaultValue="original" />
            </WallTransformationRow>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /1 Organize fields/ }));
  const field = screen.getByRole('textbox');
  fireEvent.change(field, { target: { value: 'unfinished draft' } });
  fireEvent.click(screen.getByRole('button', { name: /1 Organize fields/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Native disable' }));
  expect(disable).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: /1 Organize fields/ }));
  expect(screen.getByRole('textbox')).toBe(field);
  expect(field).toHaveValue('unfinished draft');
});
