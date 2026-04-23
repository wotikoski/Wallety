"use client";
import { useRef, useState } from "react";

export function SwipeableRow({
  children,
  actions,
  actionWidth = 128,
}: {
  children: React.ReactNode;
  actions: React.ReactNode;
  actionWidth?: number;
}) {
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startOffset.current = offset;
    setSnapping(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    // Allow moving left (negative) from current position and right back to 0.
    // Clamp so the content never slides past the action panel or past 0.
    const next = Math.min(0, Math.max(-actionWidth, startOffset.current + dx));
    setOffset(next);
  };

  const onTouchEnd = () => {
    setSnapping(true);
    // Snap open when past half the action width, otherwise snap closed.
    setOffset(offset < -(actionWidth / 2) ? -actionWidth : 0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hidden action buttons, revealed from the right */}
      <div
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: actionWidth }}
      >
        {actions}
      </div>

      {/* Sliding content */}
      <div
        className={`relative bg-white${snapping ? " transition-transform duration-200 ease-out" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
