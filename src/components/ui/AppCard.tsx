import { cn } from "@/lib/utils/cn";
import { type ReactNode } from "react";

/**
 * AppCard — base card following the Wallety redesign handoff.
 * No shadow; border + surface-card background; 14px radius.
 * Use `className` to override padding, sizing, etc.
 */
export function AppCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border p-[22px]",
        "bg-[var(--surface-card)] border-[var(--color-border)]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * AppCardHeader — title + optional right slot inside a card.
 */
export function AppCardHeader({
  title,
  right,
  className,
}: {
  title: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <p className="text-[14px] font-semibold text-[var(--color-text)] tracking-tight">
        {title}
      </p>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
