import { captureResizePointer, holdResizeCursor } from './resizePointer';

function setup() {
  const handle = document.createElement('span');
  handle.style.cursor = 'se-resize';
  document.body.appendChild(handle);
  handle.setPointerCapture = jest.fn();
  handle.hasPointerCapture = jest.fn(() => true);
  handle.releasePointerCapture = jest.fn();
  const abort = jest.fn();
  return { handle, abort, release: captureResizePointer(handle, 7, abort) };
}
function pointer(target: EventTarget, type: string, id = 7) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'pointerId', { value: id });
  target.dispatchEvent(event);
}
afterEach(() => {
  document.body.innerHTML = '';
});

it('retains the original handle until pointerup and does not abort the native mouseup commit', () => {
  const { handle, abort, release } = setup();
  expect(handle.setPointerCapture).toHaveBeenCalledWith(7);
  pointer(document, 'pointerup', 8);
  expect(handle.releasePointerCapture).not.toHaveBeenCalled();
  pointer(document, 'pointerup');
  pointer(handle, 'lostpointercapture');
  release();
  expect(handle.releasePointerCapture).toHaveBeenCalledTimes(1);
  expect(abort).not.toHaveBeenCalled();
});
it.each(['pointercancel', 'lostpointercapture'])(
  'cancels %s without committing and releases listeners once',
  (type) => {
    const { handle, abort, release } = setup();
    pointer(handle, type);
    pointer(handle, type);
    release();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(handle.releasePointerCapture).toHaveBeenCalledTimes(1);
  }
);
it('locks the active Resize cursor independently of hit testing and removes only its own style', () => {
  const { handle, release } = setup();
  const before = document.head.innerHTML;
  const restore = holdResizeCursor(handle);
  expect(document.querySelector('[data-wall-resize-cursor]')).toHaveTextContent('cursor: se-resize !important');
  restore();
  restore();
  release();
  expect(document.head.innerHTML).toBe(before);
});
