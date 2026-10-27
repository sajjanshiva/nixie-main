"use client";
// Left side of the checkout: details + address + "pay full / pay half" → Cashfree.
import { useState } from "react";
import { Lock } from "lucide-react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import AddressFields from "@/components/site/AddressFields";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { paise } from "@/lib/format";
import { cleanPhone, validateContact } from "@/lib/validate";
import { cn } from "@/lib/cn";

export default function CheckoutForm({ token, invoice }) {
  const { customer } = useAuth();
  const b = invoice.billing || {};
  // Same account as the invoice email → also use saved profile details
  const me = customer && customer.email === invoice.customer?.email ? customer : null;
  const [v, setV] = useState(() => ({
    name: b.name || invoice.customer?.name || me?.name || "",
    phone: b.phone || invoice.customer?.phone || me?.phone || "",
    addressLine: b.addressLine || me?.addressLine || "",
    city: b.city || me?.city || "",
    state: b.state || me?.state || "",
    pincode: b.pincode || me?.pincode || "",
  }));
  const balanceOnly = !!invoice.payOptions?.balancePaise;
  const [option, setOption] = useState(balanceOnly ? "balance" : "full");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, val) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const amount =
    option === "balance" ? invoice.payOptions.balancePaise : option === "half" ? invoice.payOptions.halfPaise : invoice.payOptions.fullPaise;

  async function pay(e) {
    e.preventDefault();
    const errs = validateContact(v, { requireEmail: false });
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) {
      setFormError("Please check the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      const order = await api(`/pay/${token}/orders`, {
        method: "POST",
        body: {
          option,
          name: v.name.trim(),
          phone: cleanPhone(v.phone),
          addressLine: v.addressLine.trim(),
          city: v.city.trim(),
          state: v.state,
          pincode: v.pincode.trim(),
        },
      });
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({ mode: order.cashfreeMode === "production" ? "production" : "sandbox" });
      if (!cashfree) throw new Error("Couldn’t open the payment page. Please try again.");
      // Leaves this page; Cashfree sends the customer back to /pay/<token>?order_id=…
      await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(
        err.code === "INVOICE_CANCELLED" || err.code === "INVOICE_PAID"
          ? `${err.message} Refresh the page to see the latest status.`
          : err.fields
            ? "Please check the highlighted fields."
            : err.message
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={pay} noValidate className="flex flex-col gap-7 rounded-[32px] bg-surface p-6 ring-1 ring-line sm:p-9">
      <FormError message={formError} />

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-[30px] leading-none">Your details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <Input autoComplete="name" value={v.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Phone" hint="Needed by the payment provider" error={errors.phone}>
            <Input type="tel" inputMode="tel" autoComplete="tel-national" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <Input value={invoice.customer?.email || ""} disabled readOnly />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-[30px] leading-none">Delivery address</h2>
        <AddressFields values={v} errors={errors} onChange={set} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-[30px] leading-none">How would you like to pay?</h2>
        {balanceOnly ? (
          <div className="rounded-2xl bg-mint p-5 ring-1 ring-line">
            <p className="text-[16px] font-semibold">Remaining balance</p>
            <p className="font-display mt-1 text-[36px] leading-none">{paise(invoice.payOptions.balancePaise)}</p>
            <p className="mt-2 text-[14px] text-muted">You’ve already paid {paise(invoice.totals.paidPaise)}. Pay the rest any time.</p>
          </div>
        ) : (
          <div role="radiogroup" aria-label="Payment option" className="grid gap-3 sm:grid-cols-2">
            <Option
              checked={option === "full"}
              onSelect={() => setOption("full")}
              title="Pay in full"
              amount={paise(invoice.payOptions.fullPaise)}
              note="Nothing more to pay later"
            />
            <Option
              checked={option === "half"}
              onSelect={() => setOption("half")}
              title="Pay half now"
              amount={paise(invoice.payOptions.halfPaise)}
              note="Pay the other half after delivery"
            />
          </div>
        )}
      </section>

      <Button type="submit" size="lg" full loading={busy}>
        <Lock className="size-[18px]" aria-hidden="true" />
        Pay {paise(amount)}
      </Button>
    </form>
  );
}

function Option({ checked, onSelect, title, amount, note }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-start rounded-2xl p-5 text-left ring-inset transition",
        checked ? "bg-cyan-soft ring-2 ring-teal-deep" : "bg-surface ring-1 ring-line-strong hover:ring-ink"
      )}
    >
      <span
        className={cn(
          "absolute right-4 top-4 flex size-5 items-center justify-center rounded-full ring-2",
          checked ? "bg-teal-deep ring-teal-deep" : "ring-line-strong"
        )}
        aria-hidden="true"
      >
        {checked && <span className="size-2 rounded-full bg-white" />}
      </span>
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="font-display mt-1 text-[34px] leading-none">{amount}</span>
      <span className="mt-2 text-[13.5px] text-muted">{note}</span>
    </button>
  );
}
