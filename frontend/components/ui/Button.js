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

const VARIANTS = {
  primary:
    "bg-teal-deep text-white hover:bg-teal-deeper " +
    "ring-1 ring-inset ring-white/20 " +
    "shadow-[0_1px_3px_rgba(13,74,78,0.25),inset_0_1px_0_rgba(255,255,255,0.22)] " +
    "hover:shadow-[0_8px_24px_rgba(13,74,78,0.38),inset_0_1px_0_rgba(255,255,255,0.3)] " +
    "hover:-translate-y-0.5",
  accent:
    "bg-cyan text-ink hover:bg-[#78f5f5] " +
    "ring-1 ring-inset ring-black/10 " +
    "shadow-[0_1px_3px_rgba(84,235,235,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] " +
    "hover:shadow-[0_8px_24px_rgba(84,235,235,0.5),inset_0_1px_0_rgba(255,255,255,0.7)] " +
    "hover:-translate-y-0.5",
  dark:
    "bg-ink text-white hover:bg-[#1a2324] " +
    "ring-1 ring-inset ring-white/10 " +
    "shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.14)] " +
    "hover:shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] " +
    "hover:-translate-y-0.5",
  outline:
    "bg-surface text-ink ring-1 ring-inset ring-line-strong " +
    "hover:bg-ink hover:text-white hover:ring-ink " +
    "hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] " +
    "hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 hover:text-teal-deep",
  danger:
    "bg-surface text-danger ring-1 ring-inset ring-danger/40 hover:bg-danger-soft hover:shadow-[0_4px_12px_rgba(180,35,24,0.15)] hover:-translate-y-0.5",
  light:
    "bg-white text-ink ring-1 ring-inset ring-black/5 " +
    "shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] " +
    "hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] " +
    "hover:-translate-y-0.5",
};

const SIZES = {
  sm: "h-9 px-4 text-[13.5px] gap-1.5 rounded-[6px]",
  md: "h-11 px-5 text-[14.5px] gap-2 rounded-[8px]",
  lg: "h-[50px] px-7 text-[15px] gap-2.5 rounded-[8px]",
  icon: "size-10 rounded-[6px]",
};

export function buttonClass({ variant = "primary", size = "md", full = false, className } = {}) {
  return cn(
    "relative inline-flex shrink-0 select-none items-center justify-center font-semibold tracking-[0.02em] whitespace-nowrap",
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
