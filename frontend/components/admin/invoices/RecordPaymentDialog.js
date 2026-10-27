"use client";
// For money received outside the website (cash / UPI). Records the remaining balance as paid.
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { useMeta } from "@/components/providers/MetaProvider";
import { adminApi } from "@/lib/adminApi";
import { paise } from "@/lib/format";

export default function RecordPaymentDialog({ open, onOpenChange, invoice, onDone }) {
  const { meta } = useMeta();
  const [note, setNote] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setNote("");
      setState(invoice.billing?.state || "");
      setError("");
    }
  }, [open, invoice]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await adminApi(`/invoices/${invoice.id}/record-payment`, {
        method: "POST",
        body: { ...(note.trim() ? { note: note.trim() } : {}), ...(state ? { state } : {}) },
      });
      onDone(d.invoice);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent title="Record payment" description="For money received outside the website, like cash or UPI.">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FormError message={error} />
          <div className="rounded-2xl bg-mint p-4">
            <p className="text-[13px] font-semibold text-muted">Amount being recorded (the remaining balance)</p>
            <p className="font-display mt-1 text-[36px] leading-none tabular-nums">{paise(invoice.totals.balancePaise)}</p>
            <p className="mt-1.5 text-[13px] text-muted">The invoice will be marked as Paid.</p>
          </div>
          <Field label="Note" optional hint="e.g. Paid by UPI on 18 Oct">
            <Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Field label="Customer’s state" optional hint="Needed for the accountant’s GST export when the customer didn’t pay through the website.">
            <Select value={state} onValueChange={setState} options={meta.states} placeholder="Select state" />
          </Field>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Record {paise(invoice.totals.balancePaise)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
