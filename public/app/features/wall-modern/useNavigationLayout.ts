import { useEffect, useState } from 'react';

// Keep in sync with the chrome media query; a rail leaves the workspace usable on laptops.
export const compactNavigationQuery = '(max-width: 1199px)';

/** Responsive disclosure is temporary. Only an explicit desktop toggle changes the saved preference. */
export function useNavigationLayout(manualCollapsed: boolean, setManualCollapsed: (value: boolean) => void) {
  const [compact, setCompact] = useState(() => window.matchMedia(compactNavigationQuery).matches);
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(compactNavigationQuery);
    const update = () => {
      setCompact(media.matches);
      setOverlayOpen(false);
    };
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  const collapsed = compact ? !overlayOpen : manualCollapsed;
  const setCollapsed = (value: boolean) => {
    if (compact) {
      setOverlayOpen(!value);
    } else {
      setManualCollapsed(value);
    }
  };
  return { compact, collapsed, setCollapsed };
}
