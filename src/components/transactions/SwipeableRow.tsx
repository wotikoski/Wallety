"use client";
import { useRef, useState } from "react";

export function SwipeableRow({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const THRESHOLD = 60;
  const ACTION_WIDTH = 120;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -ACTION_WIDTH));
  };
  const onTouchEnd = () => {
    setOffset(offset < -THRESHOLD ? -ACTION_WIDTH : 0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons revealed on swipe */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{ width: ACTION_WIDTH }}
      >
        {actions}
      </div>
      {/* Content that slides */}
      <div
        className="relative bg-white transition-transform duration-200"
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
