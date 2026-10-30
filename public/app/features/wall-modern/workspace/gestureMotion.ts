/** Let the existing native mouse engine consume only the latest sample per paint.
 * Mouseup flushes the last sample synchronously, before native commit/history. */
export function frameMouseInput(doc: Document, beforeRelease: () => void) {
  const view = doc.defaultView!;
  let frame: number | undefined;
  let pending: MouseEvent | undefined;
  let delivering = false;
  const flush = () => {
    if (frame !== undefined) {
      view.cancelAnimationFrame(frame);
      frame = undefined;
    }
    const sample = pending;
    pending = undefined;
    if (!sample) {
      return;
    }
    delivering = true;
    try {
      doc.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          buttons: sample.buttons,
          clientX: sample.clientX,
          clientY: sample.clientY,
          ctrlKey: sample.ctrlKey,
          metaKey: sample.metaKey,
          shiftKey: sample.shiftKey,
          altKey: sample.altKey,
        })
      );
    } finally {
      delivering = false;
    }
  };
  const move = (event: MouseEvent) => {
    if (delivering || !event.buttons) {
      return;
    }
    event.stopImmediatePropagation();
    pending = event;
    frame ??= view.requestAnimationFrame(flush);
  };
  const release = () => {
    flush();
    beforeRelease();
  };
  doc.addEventListener('mousemove', move, true);
  doc.addEventListener('mouseup', release, true);
  return () => {
    if (frame !== undefined) {
      view.cancelAnimationFrame(frame);
    }
    pending = undefined;
    doc.removeEventListener('mousemove', move, true);
    doc.removeEventListener('mouseup', release, true);
  };
}

export type GestureRects = Array<{ node: HTMLElement; rect: DOMRect }>;
const settling = new WeakMap<HTMLElement, Animation>();
export function cancelPanelSettle(node: HTMLElement) {
  settling.get(node)?.cancel();
  settling.delete(node);
  delete node.dataset.wallSettling;
}

/** Animate only the released visual gap; the native final layout is already committed. */
export function settlePanels(rects: GestureRects, host: HTMLElement) {
  const view = host.ownerDocument.defaultView!;
  if (view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const style = view.getComputedStyle(host);
  const duration = parseFloat(style.getPropertyValue('--wall-motion-settle-duration')) || 140;
  const easing = style.getPropertyValue('--wall-motion-grid-easing').trim() || 'ease-out';
  rects.forEach(({ node }) => {
    node.dataset.wallSettling = 'true';
  });
  view.requestAnimationFrame(() => {
    for (const { node, rect } of rects) {
      if (!node.isConnected || !node.animate || node.dataset.wallMagnet) {
        delete node.dataset.wallSettling;
        continue;
      }
      const next = node.getBoundingClientRect();
      const dx = rect.left - next.left,
        dy = rect.top - next.top;
      if (
        Math.max(Math.abs(dx), Math.abs(dy), Math.abs(rect.width - next.width), Math.abs(rect.height - next.height)) <
        0.5
      ) {
        delete node.dataset.wallSettling;
        continue;
      }
      settling.get(node)?.cancel();
      const animation = node.animate(
        [
          { translate: `${dx}px ${dy}px`, width: `${rect.width}px`, height: `${rect.height}px` },
          { translate: '0px 0px', width: `${next.width}px`, height: `${next.height}px` },
        ],
        { duration, easing }
      );
      settling.set(node, animation);
      animation.onfinish = () => {
        if (settling.get(node) === animation) {
          settling.delete(node);
          delete node.dataset.wallSettling;
        }
      };
    }
  });
}
