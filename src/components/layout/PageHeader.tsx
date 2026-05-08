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
        <h1
          className="m-0 font-semibold text-[var(--color-text)] leading-tight"
          style={{ fontSize: 28, letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] font-medium text-[var(--text-mute)] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
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
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-[9px]",
        "bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-semibold",
        "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}
