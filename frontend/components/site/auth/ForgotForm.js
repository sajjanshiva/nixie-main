"use client";
import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import AuthShell from "@/components/site/AuthShell";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { api } from "@/lib/api";
import { validEmail } from "@/lib/validate";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!validEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api("/auth/forgot", { method: "POST", body: { email: email.trim() } });
      setSent(res?.message || "If an account exists for this email, we’ve sent a reset link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we’ll send you a link to choose a new one.">
      {sent ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-2xl bg-cyan-soft px-4 py-4 text-[15px] leading-relaxed text-teal-deeper">
            <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>{sent} The link works for 30 minutes.</p>
          </div>
          <Button href="/login" variant="outline" size="lg" full>
            Back to log in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <FormError message={error && !error.startsWith("Enter") ? error : ""} />
          <Field label="Email" error={error.startsWith("Enter") ? error : ""}>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" full loading={busy}>
            Send reset link
          </Button>
          <Link href="/login" className="text-center text-[14px] font-semibold text-muted hover:text-ink">
            Back to log in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
