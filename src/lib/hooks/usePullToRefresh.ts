import { useRef, useEffect } from "react";

export function usePullToRefresh(
  onRefresh: () => void,
  containerRef: React.RefObject<HTMLElement>,
) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const THRESHOLD = 80;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!pulling.current) return;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy > THRESHOLD) onRefresh();
      pulling.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, containerRef]);
}
