"use client";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { date, paise } from "@/lib/format";

export default function MyInvoices() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/me/invoices")
      .then((d) => setItems(d.invoices || []))
      .catch((e) => {
        setError(e.message);
        setItems([]);
      });
  }, []);

  if (items === null) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[24px]" />
        ))}
      </div>
    );
  }

  if (!error && items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        text="When we send you an invoice, it shows up here. You can pay it from this page too."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <p className="text-[14px] text-muted">Invoices sent to your account email.</p>
      {items.map((inv) => {
        const t = inv.totals || {};
        const canPay = inv.status === "sent" || inv.status === "partially_paid";
        return (
          <div key={inv.token} className="flex flex-col gap-4 rounded-[24px] bg-surface p-5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[17px] font-semibold">{inv.label}</span>
                <InvoiceStatusBadge status={inv.status} />
              </div>
              <p className="text-[14px] text-muted">
                {inv.paidAt ? `Paid on ${date(inv.paidAt)}` : inv.sentAt ? `Sent on ${date(inv.sentAt)}` : ""}
              </p>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <div className="text-right">
                <p className="font-display text-[30px] leading-none">{paise(t.totalPaise)}</p>
                {inv.status === "partially_paid" && <p className="mt-1 text-[13px] font-semibold text-teal-deep">Balance {paise(t.balancePaise)}</p>}
              </div>
              {canPay ? (
                <Button href={`/pay/${inv.token}`}>{inv.status === "partially_paid" ? "Pay balance" : "Pay now"}</Button>
              ) : (
                <Button href={`/pay/${inv.token}`} variant="outline">
                  View
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
