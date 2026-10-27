"use client";
// A sent / partly paid / paid / cancelled invoice: read-only, with actions.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Copy, Files, HandCoins, Mail, RotateCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, ConfirmDialog, InvoiceBadge, PageHeader } from "../ui";
import RecordPaymentDialog from "./RecordPaymentDialog";
import { adminApi } from "@/lib/adminApi";
import { dateTime, paise } from "@/lib/format";

const KIND = { full: "Paid in full online", half: "Half paid online", balance: "Balance paid online", manual: "Recorded by admin" };

export default function InvoiceDetail({ invoice: inv, onChange }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const open = inv.status === "sent" || inv.status === "partially_paid";
  const t = inv.totals;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inv.payUrl);
      toast.success("Payment link copied.");
    } catch {
      toast.error("Couldn’t copy. Select the link below and copy it.");
    }
  }

  async function act(name, fn) {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  const resend = () =>
    act("resend", async () => {
      await adminApi(`/invoices/${inv.id}/resend`, { method: "POST" });
      toast.success(`Sent again to ${inv.email?.to || inv.customer.email}.`);
    });

  const duplicate = () =>
    act("duplicate", async () => {
      const d = await adminApi(`/invoices/${inv.id}/duplicate`, { method: "POST" });
      toast.success("Copied into a new draft.");
      router.push(`/admin/invoices/${d.invoice.id}`);
    });

  const cancel = () =>
    act("cancel", async () => {
      const d = await adminApi(`/invoices/${inv.id}/cancel`, { method: "POST" });
      onChange(d.invoice);
      setConfirmCancel(false);
      toast.success("Invoice cancelled. The payment link no longer works.");
    });

  const b = inv.billing || {};
  const hasBilling = b.addressLine || b.city;

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/invoices" className="mb-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Invoices
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums">{inv.label}</span>
            <InvoiceBadge status={inv.status} />
          </span>
        }
        subtitle={`${inv.customer.name}${inv.sentAt ? `, sent ${dateTime(inv.sentAt)}` : ""}`}
        actions={
          <>
            {open && (
              <Button variant="outline" onClick={copyLink}>
                <Copy className="size-4" aria-hidden="true" />
                Copy payment link
              </Button>
            )}
            {open && (
              <Button onClick={() => setRecordOpen(true)}>
                <HandCoins className="size-4" aria-hidden="true" />
                Record payment
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          {/* Items + totals */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[14.5px]">
                <thead>
                  <tr className="border-b border-line text-left text-[12.5px] text-muted">
                    <th className="px-5 py-3 font-semibold">Item</th>
                    <th className="px-3 py-3 text-right font-semibold">Qty</th>
                    <th className="px-3 py-3 text-right font-semibold">Price</th>
                    <th className="px-3 py-3 text-right font-semibold">GST</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((it) => (
                    <tr key={it.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3.5 font-semibold">{it.name}</td>
                      <td className="px-3 py-3.5 text-right tabular-nums">{it.quantity}</td>
                      <td className="px-3 py-3.5 text-right tabular-nums">{paise(it.unitPricePaise)}</td>
                      <td className="px-3 py-3.5 text-right tabular-nums">
                        {it.gstRate}%{it.gstAuto && <span className="ml-1 text-[12px] text-muted">auto</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">{paise(it.basePaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto flex max-w-sm flex-col gap-2 border-t border-dashed border-line-strong px-5 py-5 text-[15px]">
              <Line label="Subtotal" value={paise(t.subtotalPaise)} />
              {inv.discount && (
                <Line label={`Discount${inv.discount.reason ? ` (${inv.discount.reason})` : ""}`} value={`−${paise(t.discountPaise)}`} />
              )}
              <Line label="GST" value={paise(t.gstPaise)} />
              {inv.shipping && <Line label={inv.shipping.name} value={t.shippingPaise ? paise(t.shippingPaise) : "Free"} />}
              <div className="mt-1 flex items-end justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-[34px] leading-none tabular-nums">{paise(t.totalPaise)}</dd>
              </div>
              <Line label="Paid" value={paise(t.paidPaise)} />
              {t.balancePaise > 0 && inv.status !== "cancelled" && <Line label="Balance due" value={paise(t.balancePaise)} strong />}
            </dl>
          </Card>

          {/* Payments */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-[26px] leading-none">Payments</h2>
            {inv.payments.length === 0 ? (
              <p className="mt-3 text-[14.5px] text-muted">No payments yet.</p>
            ) : (
              <ul className="mt-3">
                {inv.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 border-t border-line py-3 first:border-0">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{KIND[p.kind] || p.kind}</span>
                      <span className="block text-[13px] text-muted">
                        {dateTime(p.paidAt || p.createdAt)}
                        {p.note ? `, ${p.note}` : ""}
                      </span>
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">{paise(p.amountPaise)}</span>
                    <Badge tone={p.status === "paid" ? "green" : p.status === "failed" ? "red" : "gray"}>
                      {p.status === "paid" ? "Paid" : p.status === "failed" ? "Failed" : "Pending"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-8">
          <Card className="p-5">
            <h2 className="text-[13px] font-semibold text-muted">Customer</h2>
            <p className="mt-2 text-[16px] font-semibold">{inv.customer.name}</p>
            <p className="break-all text-[14.5px]">{inv.customer.email}</p>
            {inv.customer.phone && <p className="text-[14.5px] tabular-nums">{inv.customer.phone}</p>}
            {hasBilling && (
              <>
                <h3 className="mt-4 text-[13px] font-semibold text-muted">Delivery address (from checkout)</h3>
                <p className="mt-1 text-[14.5px] leading-relaxed">
                  {b.name && <span className="block">{b.name}{b.phone ? `, ${b.phone}` : ""}</span>}
                  {[b.addressLine, b.city, `${b.state || ""} ${b.pincode || ""}`.trim()].filter(Boolean).join(", ")}
                </p>
              </>
            )}
          </Card>

          {inv.payUrl && open && (
            <Card className="p-5">
              <h2 className="text-[13px] font-semibold text-muted">Payment link</h2>
              <p className="mt-2 select-all break-all rounded-xl bg-mint px-3 py-2 text-[13px]">{inv.payUrl}</p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-muted">
              <Mail className="size-4" aria-hidden="true" />
              Email
            </h2>
            <p className="mt-2 break-all text-[14.5px]">{inv.email?.to || inv.customer.email}</p>
            {inv.email?.subject && <p className="text-[14px] text-muted">{inv.email.subject}</p>}
            {inv.email?.message && <p className="mt-2 whitespace-pre-line text-[14px]">{inv.email.message}</p>}
          </Card>

          {inv.internalNote && (
            <Card className="bg-yellow-soft p-5 ring-0">
              <h2 className="text-[13px] font-semibold">Internal note</h2>
              <p className="mt-1.5 whitespace-pre-line text-[14.5px]">{inv.internalNote}</p>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            {open && (
              <Button variant="outline" full onClick={resend} loading={busy === "resend"}>
                <RotateCw className="size-4" aria-hidden="true" />
                Resend email
              </Button>
            )}
            <Button variant="outline" full onClick={duplicate} loading={busy === "duplicate"}>
              <Files className="size-4" aria-hidden="true" />
              Duplicate as new draft
            </Button>
            {open && (
              <Button variant="ghost" full onClick={() => setConfirmCancel(true)} className="text-danger hover:bg-danger-soft">
                <Ban className="size-4" aria-hidden="true" />
                Cancel invoice
              </Button>
            )}
          </div>
          {inv.status === "cancelled" && (
            <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">
              Cancelled {dateTime(inv.cancelledAt)}. To fix a mistake, use Duplicate and send the new draft.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel ${inv.label}?`}
        text={
          t.paidPaise > 0
            ? `The customer has already paid ${paise(t.paidPaise)}. Cancelling stops further payments but does not refund anything.`
            : "The payment link will stop working. The invoice stays in the list for history."
        }
        confirmLabel="Cancel invoice"
        busy={busy === "cancel"}
        onConfirm={cancel}
      />
      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        invoice={inv}
        onDone={(updated) => {
          onChange(updated);
          setRecordOpen(false);
          toast.success(`Payment recorded. ${updated.label} is now paid.`);
        }}
      />
    </>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={strong ? "font-semibold" : "text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-teal-deep" : ""}`}>{value}</dd>
    </div>
  );
}
