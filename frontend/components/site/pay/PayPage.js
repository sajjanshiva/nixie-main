"use client";
// Invoice checkout (no login needed). Opened from the invoice email or Profile → My invoices.
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Ban, CircleCheck, Clock, Lock, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useMeta } from "@/components/providers/MetaProvider";
import { api } from "@/lib/api";
import { paise, date } from "@/lib/format";
import OrderSummary from "./OrderSummary";
import CheckoutForm from "./CheckoutForm";

export default function PayPage({ token }) {
  const params = useSearchParams();
  const returningOrder = params.get("order_id");
  const { meta } = useMeta();
  const [invoice, setInvoice] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [check, setCheck] = useState(returningOrder ? "checking" : null); // checking | paid | pending | failed
  const pollTimer = useRef(null);

  const clearOrderParam = () => window.history.replaceState(null, "", `/pay/${token}`);

  const loadInvoice = useCallback(async () => {
    try {
      const { invoice: inv } = await api(`/pay/${token}`);
      setInvoice(inv);
    } catch (e) {
      setLoadError(e);
    }
  }, [token]);

  // Coming back from Cashfree → confirm the payment with the server (poll a little if pending)
  useEffect(() => {
    if (!returningOrder) {
      loadInvoice();
      return;
    }
    let tries = 0;
    let stopped = false;
    async function poll() {
      tries += 1;
      try {
        const { result, invoice: inv } = await api(`/pay/${token}/orders/${encodeURIComponent(returningOrder)}`);
        if (stopped) return;
        setInvoice(inv);
        if (result === "pending" && tries < 8) {
          pollTimer.current = setTimeout(poll, 2500);
          return;
        }
        setCheck(result);
        clearOrderParam();
      } catch (e) {
        if (stopped) return;
        setCheck(null);
        clearOrderParam();
        loadInvoice();
      }
    }
    poll();
    return () => {
      stopped = true;
      clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, returningOrder]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <EmptyState
          icon={Ban}
          title={loadError.status === 404 ? "This invoice link isn’t valid" : "We couldn’t open this invoice"}
          text={loadError.status === 404 ? "Please check the link in your email, or contact us." : loadError.message}
          action={<Button href="/contact">Contact us</Button>}
        />
      </div>
    );
  }

  if (check === "checking" || (check === null && !invoice)) {
    return (
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        {check === "checking" ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-20 text-center" role="status">
            <Spinner className="size-10 text-teal-deep" />
            <h1 className="font-display text-[40px] leading-tight">Confirming your payment…</h1>
            <p className="text-muted">Please don’t close this page.</p>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <Skeleton className="h-[560px] rounded-[32px]" />
            <Skeleton className="h-[420px] rounded-[32px]" />
          </div>
        )}
      </div>
    );
  }

  if (invoice?.status === "cancelled") {
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <EmptyState
          icon={Ban}
          title="This invoice is no longer valid"
          text={`Invoice ${invoice.label || ""} was cancelled. If you think this is a mistake, please contact us.`}
          action={<Button href="/contact">Contact us</Button>}
        />
      </div>
    );
  }

  const t = invoice.totals;
  const canPay = invoice.status === "sent" || invoice.status === "partially_paid";

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-8 sm:px-8 lg:pt-14">
      {check === "paid" && <PaymentSuccess invoice={invoice} />}
      {check === "pending" && (
        <Banner tone="info" icon={Clock}>
          We’re still confirming your payment with the bank. You’ll get an email as soon as it’s done. You don’t need to pay again.
        </Banner>
      )}

      {check !== "paid" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[44px] leading-none sm:text-[60px]">Invoice {invoice.label}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-3 text-[16px] text-muted">
            {invoice.customer?.name ? `For ${invoice.customer.name}. ` : ""}
            {invoice.sentAt ? `Sent on ${date(invoice.sentAt)}.` : ""}
          </p>
          {check === "failed" && (
            <div className="mt-6">
              <FormError message="Payment failed or was cancelled. No money was taken. Please try again." />
            </div>
          )}

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div className="order-2 lg:order-1">
              {canPay ? (
                <CheckoutForm token={token} invoice={invoice} cashfreeMode={meta.cashfreeMode} />
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-[32px] bg-success-soft p-7 sm:p-9">
                  <CircleCheck className="size-9 text-success" aria-hidden="true" />
                  <h2 className="font-display text-[36px] leading-tight">This invoice is already paid</h2>
                  <p className="text-[16px] text-ink">
                    {invoice.paidAt ? `Paid in full on ${date(invoice.paidAt)}. ` : ""}Thank you! We’ll keep you updated on your outfit.
                  </p>
                </div>
              )}
            </div>
            <div className="order-1 lg:sticky lg:top-28 lg:order-2">
              <OrderSummary invoice={invoice} />
              <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Secure payment by Cashfree. UPI, cards, wallets and net banking.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentSuccess({ invoice }) {
  const t = invoice.totals;
  const partly = invoice.status === "partially_paid";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center"
      role="status"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="flex size-20 items-center justify-center rounded-full bg-cyan"
      >
        <CircleCheck className="size-10" aria-hidden="true" />
      </motion.span>
      <h1 className="font-display mt-8 text-[48px] leading-[0.98] sm:text-[64px]">Payment successful</h1>
      <p className="mt-4 text-[17px] text-muted">We’ve emailed you a confirmation for invoice {invoice.label}.</p>
      <div className="mt-8 w-full max-w-md rounded-[28px] bg-surface p-6 text-left ring-1 ring-line">
        <Row label="Invoice total" value={paise(t.totalPaise)} />
        <Row label="Paid so far" value={paise(t.paidPaise)} strong />
        {partly && <Row label="Balance (pay any time)" value={paise(t.balancePaise)} />}
      </div>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button href="/profile?tab=invoices" size="lg">
          My invoices
        </Button>
        <Button href="/" size="lg" variant="outline">
          Back to home
        </Button>
      </div>
      {partly && (
        <p className="mt-6 flex items-center gap-2 text-[14px] text-muted">
          <Lock className="size-4" aria-hidden="true" />
          Use the same link to pay the balance whenever you’re ready.
        </p>
      )}
    </motion.div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-line py-3 last:border-0">
      <span className="text-[15px] text-muted">{label}</span>
      <span className={strong ? "text-[17px] font-semibold" : "text-[15px]"}>{value}</span>
    </div>
  );
}

function Banner({ icon: Icon, children }) {
  return (
    <div className="mb-8 flex items-start gap-3 rounded-2xl bg-cyan-soft px-5 py-4 text-[15px] leading-relaxed text-teal-deeper" role="status">
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
