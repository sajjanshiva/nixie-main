"use client";
// Small building blocks shared by the admin pages.
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-[40px] leading-none sm:text-[46px]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-[20px] bg-surface ring-1 ring-line", className)} {...props}>
      {children}
    </div>
  );
}

export function FilterChips({ value, onChange, options, label }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors",
            value === o.value ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-inset ring-line hover:ring-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Search box that reports the value after the user stops typing. */
export function SearchBox({ value, onChange, placeholder, className }) {
  const [text, setText] = useState(value || "");
  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== value) onChange(text);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
        className="h-10 w-full rounded-full bg-surface pl-10 pr-9 text-[14.5px] ring-1 ring-inset ring-line-strong outline-none placeholder:text-[#8aa0a1] focus:ring-2 focus:ring-teal-deep [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            onChange("");
          }}
          className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-ink"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

const INVOICE_STATUS = {
  draft: ["gray", "Draft"],
  sent: ["teal", "Sent"],
  partially_paid: ["yellow", "Partially paid"],
  paid: ["green", "Paid"],
  cancelled: ["red", "Cancelled"],
};
export function InvoiceBadge({ status }) {
  const [tone, label] = INVOICE_STATUS[status] || ["gray", status];
  return (
    <Badge tone={tone} className="font-sans tracking-normal">
      {label}
    </Badge>
  );
}

export function LeadTypeBadge({ type }) {
  return type === "ai_analysis" ? <Badge tone="yellow">AI analysis</Badge> : <Badge tone="teal">General</Badge>;
}

/** "Are you sure?" popup. */
export function ConfirmDialog({ open, onOpenChange, title, text, confirmLabel = "Confirm", danger = true, busy, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={text} className="max-w-md">
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant={danger ? "dark" : "primary"} onClick={onConfirm} loading={busy} className={danger ? "bg-danger hover:bg-[#8f1c13]" : ""}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LoadMore({ hasMore, loading, onClick }) {
  if (!hasMore) return null;
  return (
    <div className="mt-5 flex justify-center">
      <Button variant="outline" onClick={onClick} loading={loading}>
        Load more
      </Button>
    </div>
  );
}
