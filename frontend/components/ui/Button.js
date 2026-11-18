// Couture Editorial Button. Variants:
//   primary   deep-teal, white text, luxury light-rim
//   accent    cyan, ink text, radiant glow
//   dark      obsidian ink, white text
//   outline   hairline architectural border, hover invert
//   ghost     clean text, subtle hover tint
//   danger    fine red hairline border
//   light     chalk white, ink text
import Link from "next/link";
import { cn } from "@/lib/cn";
import Spinner from "./Spinner";

function ButtonStitch({ variant, size }) {
  if (variant === "ghost" || variant === "danger") return null;

  // Stitch thread colour:
  // - primary & dark: #fffcf0 (ivory studio thread) as requested by mam
  // - accent: #155f64 (deep atelier teal on cyan background)
  // - outline: dark teal on white bg, turning to brilliant #fffcf0 on hover (when button inverts to black)
  // - light: refined atelier dark teal running stitch
  const strokeClass =
    variant === "outline"
      ? "stroke-[#155f64]/50 group-hover:stroke-[#fffcf0]"
      : variant === "light"
      ? "stroke-[#155f64]/40 group-hover:stroke-[#155f64]/70"
      : variant === "accent"
      ? "stroke-[#155f64]"
      : "stroke-[#fffcf0]";

  // Exact rounded inner corner radius (inset 4px from button edge)
  // sm (h-9 = 36px, inner 28px) -> rx 14 for true pill cap (never elliptical)
  // icon (size-10 = 40px, inner 32px) -> rx 16 for circle
  // lg (rounded-[16px]) -> rx 12
  // md (rounded-[14px]) -> rx 10
  const rx =
    size === "sm" ? 14 : size === "icon" ? 16 : size === "lg" ? 12 : 10;

  return (
    <svg
      className="btn-stitch pointer-events-none absolute inset-[4px] h-[calc(100%-8px)] w-[calc(100%-8px)] overflow-visible opacity-85 transition-opacity duration-200 group-hover:opacity-100"
      aria-hidden="true"
    >
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={rx}
        ry={rx}
        fill="none"
        className={cn(strokeClass, "transition-colors duration-200")}
        strokeWidth="1.5"
        strokeDasharray="7 5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const VARIANTS = {
  primary:
    "bg-teal-deep text-white hover:bg-teal-deeper stitched-btn " +
    "shadow-[0_2px_8px_rgba(21,95,100,0.25)] " +
    "hover:shadow-[0_6px_20px_rgba(21,95,100,0.35)] " +
    "hover:-translate-y-0.5",
  accent:
    "bg-cyan text-ink hover:bg-[#78f5f5] stitched-btn " +
    "shadow-[0_2px_8px_rgba(84,235,235,0.35)] " +
    "hover:shadow-[0_6px_20px_rgba(84,235,235,0.5)] " +
    "hover:-translate-y-0.5",
  dark:
    "bg-ink text-white hover:bg-[#1a2324] stitched-btn " +
    "shadow-[0_2px_8px_rgba(0,0,0,0.25)] " +
    "hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] " +
    "hover:-translate-y-0.5",
  outline:
    "bg-surface text-ink ring-1 ring-inset ring-line-strong stitched-btn stitched-btn-dark " +
    "hover:bg-ink hover:text-white hover:ring-ink " +
    "hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] " +
    "hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 hover:text-teal-deep rounded-full",
  danger:
    "bg-surface text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger-soft hover:shadow-[0_4px_12px_rgba(180,35,24,0.15)] hover:-translate-y-0.5",
  light:
    "bg-white text-ink ring-1 ring-inset ring-black/5 stitched-btn stitched-btn-dark " +
    "shadow-[0_1px_3px_rgba(0,0,0,0.06)] " +
    "hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] " +
    "hover:-translate-y-0.5",
};

const SIZES = {
  sm: "h-9 px-4 text-[13.5px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-[14.5px] gap-2 rounded-[14px]",
  lg: "h-[50px] px-7 text-[15.5px] gap-2.5 rounded-[16px]",
  icon: "size-10 rounded-full",
};

export function buttonClass({ variant = "primary", size = "md", full = false, className } = {}) {
  return cn(
    "group relative inline-flex shrink-0 select-none items-center justify-center font-semibold tracking-[0.02em] whitespace-nowrap overflow-hidden",
    "transition-all duration-200 ease-out active:translate-y-0 active:scale-[0.98] active:shadow-none",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    full && "w-full",
    className
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  full = false,
  loading = false,
  href,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  const cls = buttonClass({ variant, size, full, className });
  const content = (
    <>
      <ButtonStitch variant={variant} size={size} />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className="size-5" />
        </span>
      )}
      <span className={cn("relative z-10 inline-flex items-center gap-[inherit]", loading && "invisible")}>
        {children}
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} suppressHydrationWarning className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
