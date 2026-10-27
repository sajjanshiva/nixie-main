// Right side of the checkout: items, discount, GST, shipping, total (locked; customer can't change it).
import { Check } from "lucide-react";
import { paise } from "@/lib/format";

export default function OrderSummary({ invoice }) {
  const t = invoice.totals;
  const partly = t.paidPaise > 0 && t.balancePaise > 0;
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-surface ring-1 ring-line">
      <div className="bg-teal px-6 py-5 sm:px-8">
        <h2 className="font-display text-[30px] leading-none text-white">Order summary</h2>
      </div>
      <div className="px-6 py-6 sm:px-8">
        <ul className="flex flex-col gap-4">
          {invoice.items.map((it, i) => (
            <li key={i} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold leading-snug">{it.name}</p>
                <p className="text-[14px] text-muted">
                  {it.quantity} × {paise(it.unitPricePaise)}
                </p>
              </div>
              <p className="shrink-0 text-[16px]">{paise(it.linePaise)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 flex flex-col gap-2.5 border-t border-dashed border-line-strong pt-5 text-[15px]">
          <Line label="Subtotal" value={paise(t.subtotalPaise)} />
          {invoice.discount && t.discountPaise > 0 && (
            <Line label={`Discount${invoice.discount.reason ? ` (${invoice.discount.reason})` : ""}`} value={`−${paise(t.discountPaise)}`} accent />
          )}
          <Line label="GST" value={paise(t.gstPaise)} />
          {invoice.shipping && <Line label={invoice.shipping.name || "Shipping"} value={invoice.shipping.pricePaise ? paise(invoice.shipping.pricePaise) : "Free"} />}
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
          <div>
            <p className="text-[15px] font-semibold">Total</p>
            <p className="text-[13px] text-muted">Including taxes</p>
          </div>
          <p className="font-display text-[44px] leading-none">{paise(t.totalPaise)}</p>
        </div>

        {partly && (
          <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-mint p-4 text-[15px]">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-success">
                <Check className="size-4" aria-hidden="true" />
                Paid
              </span>
              <span>{paise(t.paidPaise)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Balance</span>
              <span>{paise(t.balancePaise)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, accent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-semibold text-teal-deep" : ""}>{value}</dd>
    </div>
  );
}
