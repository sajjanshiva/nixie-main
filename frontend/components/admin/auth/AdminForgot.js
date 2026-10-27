"use client";
import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { api } from "@/lib/api";
import { validEmail } from "@/lib/validate";

export default function AdminForgot() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!validEmail(email)) return setFieldError("Enter a valid email");
    setFieldError("");
    setError("");
    setBusy(true);
    try {
      const d = await api("/admin/auth/forgot", { method: "POST", body: { email: email.trim() } });
      setSent(d?.message || "If this is the admin email, a reset link has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminAuthShell title="Reset password" subtitle="We’ll email a link to choose a new password. It works once, for 30 minutes.">
      {sent ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-2xl bg-cyan-soft px-4 py-4 text-[15px] text-teal-deeper">
            <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>{sent}</p>
          </div>
          <Button href="/admin/login" variant="outline" size="lg" full>
            Back to log in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <FormError message={error} />
          <Field label="Admin email" error={fieldError}>
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" full loading={busy}>
            Send reset link
          </Button>
          <Link href="/admin/login" className="text-center text-[14px] font-semibold text-muted hover:text-ink">
            Back to log in
          </Link>
        </form>
      )}
    </AdminAuthShell>
  );
}
