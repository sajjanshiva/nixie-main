"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import AuthShell from "@/components/site/AuthShell";
import Field from "@/components/ui/Field";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { useMeta } from "@/components/providers/MetaProvider";
import { api } from "@/lib/api";

export default function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const { meta } = useMeta();
  const minPw = meta.limits?.customerPasswordMin || 8;
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [invalidLink, setInvalidLink] = useState(!token);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (pw.length < minPw) errs.password = `Password must be at least ${minPw} characters`;
    if (pw2 !== pw) errs.confirm = "Passwords don’t match";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await api("/auth/reset", { method: "POST", body: { token, password: pw } });
      setDone(true);
    } catch (err) {
      if (err.code === "RESET_INVALID" || err.fields?.token) setInvalidLink(true);
      else {
        setErrors(err.fields || {});
        setFormError(err.fields ? "" : err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (invalidLink) {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links work once, for 30 minutes. Ask for a new one below.">
        <Button href="/forgot-password" size="lg" full>
          Send a new link
        </Button>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You’ve been logged out everywhere. Log in with your new password.">
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-[15px] text-success">
          <CircleCheck className="size-5" aria-hidden="true" />
          All set.
        </div>
        <Button href="/login" size="lg" full>
          Log in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <Field label="New password" hint={`At least ${minPw} characters`} error={errors.password}>
          <PasswordInput autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Confirm new password" error={errors.confirm}>
          <PasswordInput autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" full loading={busy}>
          Save new password
        </Button>
      </form>
    </AuthShell>
  );
}
