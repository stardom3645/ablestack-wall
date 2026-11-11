/** Keep the same input target while the snapped corner moves away from the mouse.
 * Native Resizable still owns mouse deltas and document listeners. */
export function captureResizePointer(handle: HTMLElement, pointerId: number, abort: () => void) {
  const doc = handle.ownerDocument;
  let disposed = false;
  const release = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    doc.removeEventListener('pointerup', ended, true);
    doc.removeEventListener('pointercancel', cancelled, true);
    handle.removeEventListener('lostpointercapture', cancelled);
    delete handle.dataset.wallResizeCaptured;
    if (handle.hasPointerCapture?.(pointerId)) {
      handle.releasePointerCapture(pointerId);
    }
  };
  const ended = (event: PointerEvent) => {
    if (event.pointerId === pointerId) {
      // pointerup precedes native mouseup: release capture without cancelling
      // the preview that the existing native stop callback is about to commit.
      release();
    }
  };
  const cancelled = (event: PointerEvent) => {
    if (event.pointerId === pointerId) {
      release();
      abort();
    }
  };
  if (handle.setPointerCapture) {
    handle.setPointerCapture(pointerId);
    handle.dataset.wallResizeCaptured = 'true';
    doc.addEventListener('pointerup', ended, true);
    doc.addEventListener('pointercancel', cancelled, true);
    handle.addEventListener('lostpointercapture', cancelled);
  }
  return release;
}

/** Capture keeps input stable; cursor locking also covers browsers that still
 * hit-test the cursor against content under a captured, grid-snapped pointer. */
export function holdResizeCursor(handle: HTMLElement) {
  const doc = handle.ownerDocument;
  const style = doc.createElement('style');
  const cursor = doc.defaultView!.getComputedStyle(handle).cursor;
  style.textContent = `* { cursor: ${cursor} !important; }`;
  style.dataset.wallResizeCursor = '';
  doc.head.appendChild(style);
  return () => style.remove();
}
