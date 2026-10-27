"use client";
// "Send invoice" popup: From (fixed), To, Subject, Message, Preview of the real email, Send.
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import Field from "@/components/ui/Field";
import Input, { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { useToast } from "@/components/providers/ToastProvider";
import { adminApi } from "@/lib/adminApi";
import { validEmail } from "@/lib/validate";

let fromCache = null;

export default function SendDialog({ invoice, onClose, onSent }) {
  const toast = useToast();
  const open = !!invoice;
  const [from, setFrom] = useState(fromCache || "");
  const [v, setV] = useState({ to: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!open) return;
    setV({ to: invoice.email?.to || invoice.customer.email, subject: invoice.email?.subject || "", message: invoice.email?.message || "" });
    setErrors({});
    setFormError("");
    setPreview(null);
    if (!fromCache)
      adminApi("/invoices/from-email")
        .then((d) => {
          fromCache = d.from;
          setFrom(d.from);
        })
        .catch(() => {});
  }, [open, invoice]);

  function body() {
    return { to: v.to.trim(), ...(v.subject.trim() ? { subject: v.subject.trim() } : {}), ...(v.message.trim() ? { message: v.message.trim() } : {}) };
  }

  function check() {
    if (!validEmail(v.to)) {
      setErrors({ to: "Enter a valid email" });
      return false;
    }
    setErrors({});
    return true;
  }

  async function showPreview() {
    if (!check()) return;
    setBusy("preview");
    setFormError("");
    try {
      setPreview(await adminApi(`/invoices/${invoice.id}/email-preview`, { method: "POST", body: body() }));
    } catch (e) {
      setErrors(e.fields || {});
      setFormError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    if (!check()) return;
    setBusy("send");
    setFormError("");
    try {
      const d = await adminApi(`/invoices/${invoice.id}/send`, { method: "POST", body: body() });
      if (d.warning) toast.error(d.warning, 9000);
      else toast.success(`Invoice ${d.invoice.label} sent to ${v.to.trim()}.`);
      onSent(d.invoice);
    } catch (e) {
      setErrors(e.fields || {});
      setFormError(e.message);
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent title={preview ? "Email preview" : "Send invoice"} className={preview ? "max-w-2xl" : "max-w-lg"}>
        {preview ? (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[70px_1fr] gap-x-3 gap-y-1.5 rounded-2xl bg-mint p-4 text-[14px]">
              <dt className="text-muted">From</dt>
              <dd className="break-all">{preview.from}</dd>
              <dt className="text-muted">To</dt>
              <dd className="break-all">{preview.to}</dd>
              <dt className="text-muted">Subject</dt>
              <dd className="font-semibold">{preview.subject}</dd>
            </dl>
            {/* The exact email, isolated from the admin page */}
            <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="h-[52vh] w-full rounded-2xl bg-white ring-1 ring-line" />
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setPreview(null)} disabled={!!busy}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to edit
              </Button>
              <Button onClick={send} loading={busy === "send"}>
                <Send className="size-4" aria-hidden="true" />
                Send now
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <FormError message={formError} />
            <Field label="From" hint="Set in the server settings">
              <Input value={from || "Loading…"} disabled readOnly />
            </Field>
            <Field label="To" error={errors.to}>
              <Input type="email" value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} />
            </Field>
            <Field label="Subject" optional hint="Leave empty for “Invoice NX-… from Nixie”" error={errors.subject}>
              <Input value={v.subject} maxLength={200} onChange={(e) => setV({ ...v, subject: e.target.value })} />
            </Field>
            <Field label="Message" optional error={errors.message}>
              <Textarea rows={4} maxLength={2000} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} placeholder="A short note for the customer" />
            </Field>
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={showPreview} loading={busy === "preview"} disabled={!!busy}>
                <Eye className="size-4" aria-hidden="true" />
                Preview
              </Button>
              <Button onClick={send} loading={busy === "send"} disabled={!!busy}>
                <Send className="size-4" aria-hidden="true" />
                Send
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
