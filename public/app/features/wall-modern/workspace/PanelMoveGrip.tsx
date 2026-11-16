import { wallSurfaceTokens } from '../surfaceTokens';

/** Shared panel drag affordance; the enclosing button owns all interaction. */
export function PanelMoveGrip() {
  return (
    <svg
      width={wallSurfaceTokens.moveGripSize}
      height={wallSurfaceTokens.moveGripSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {[6, 10, 14, 18].flatMap((cy) =>
        [6, 10, 14, 18].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.15} />)
      )}
    </svg>
  );
}
