import { cn } from "@/lib/utils/cn";
import { type ReactNode } from "react";

/**
 * PageHeader — consistent page-level heading used across all screens.
 * Matches handoff: 28px/600/-0.03em title, 13px/500 subtitle, right slot for actions.
 */
export function PageHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

/**
 * FloatingActionButton — mobile-only round CTA pinned to bottom-right.
 * Sits above the MobileBottomNav (5rem from bottom) and respects
 * iOS safe-area insets. Use for the primary "create" action on
 * long-list pages (Lancamentos, Recorrencias) where putting the
 * action in the header would force the user to scroll back up.
 */
export function FloatingActionButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="md:hidden fixed right-4 z-50 w-14 h-14 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,.4)] transition"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
    >
      {children}
    </button>
  );
}

/**
 * PrimaryButton — standard brand CTA button matching handoff.
 */
export function PrimaryButton({
  children,
  onClick,
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-[10px]",
        "bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-semibold",
        "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}
