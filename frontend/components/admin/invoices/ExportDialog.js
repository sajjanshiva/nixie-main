"use client";
// Download invoices with money received as CSV (opens in Excel) for the accountant.
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { buttonClass } from "@/components/ui/Button";
import { isoDay } from "@/lib/adminApi";
import { cn } from "@/lib/cn";

function ranges() {
  const now = new Date();
  const [y, m] = isoDay(now).split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const lastDay = (yy, mm) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const fyStart = m >= 4 ? y : y - 1;
  return {
    month: { label: "This month", from: `${y}-${pad(m)}-01`, to: isoDay(now) },
    last: { label: "Last month", from: `${prevY}-${pad(prevM)}-01`, to: `${prevY}-${pad(prevM)}-${pad(lastDay(prevY, prevM))}` },
    fy: { label: `FY ${fyStart}–${String(fyStart + 1).slice(2)}`, from: `${fyStart}-04-01`, to: isoDay(now) },
  };
}

export default function ExportDialog({ open, onOpenChange }) {
  const r = useMemo(ranges, [open]);
  const [pick, setPick] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const range = pick === "custom" ? { from, to } : r[pick];
  const valid = pick !== "custom" || (from && to && from <= to);
  const href = `/api/admin/invoices/export.csv?${new URLSearchParams(Object.entries(range).filter(([k, v]) => v && k !== "label"))}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Export for the accountant" description="A CSV file (opens in Excel) of invoices with money received, including state and GST split by rate.">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Date range">
            {[...Object.entries(r), ["custom", { label: "Custom dates" }]].map(([k, v]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={pick === k}
                onClick={() => setPick(k)}
                className={cn(
                  "rounded-2xl px-4 py-3 text-left text-[14.5px] font-semibold ring-inset transition",
                  pick === k ? "bg-cyan-soft ring-2 ring-teal-deep" : "bg-surface ring-1 ring-line-strong hover:ring-ink"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          {pick === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="To">
                <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
          )}
          <p className="text-[13px] text-muted">Dates are matched against the day each invoice was sent.</p>
          <a
            href={valid ? href : undefined}
            aria-disabled={!valid}
            onClick={() => valid && setTimeout(() => onOpenChange(false), 300)}
            className={cn(buttonClass({ size: "lg", full: true }), !valid && "pointer-events-none opacity-50")}
          >
            <Download className="size-[18px]" aria-hidden="true" />
            Download CSV
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
