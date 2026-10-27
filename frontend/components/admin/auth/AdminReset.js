"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import Field from "@/components/ui/Field";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { api } from "@/lib/api";

const MIN = 12;

export default function AdminReset() {
  const token = useSearchParams().get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [invalid, setInvalid] = useState(!token);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (pw.length < MIN) errs.pw = `At least ${MIN} characters`;
    if (pw2 !== pw) errs.pw2 = "Passwords don’t match";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await api("/admin/auth/reset", { method: "POST", body: { token, password: pw } });
      setDone(true);
    } catch (err) {
      if (err.code === "RESET_INVALID" || err.fields?.token) setInvalid(true);
      else setFormError(err.fields?.password || err.message);
    } finally {
      setBusy(false);
    }
  }

  if (invalid)
    return (
      <AdminAuthShell title="Link expired" subtitle="Reset links work once, for 30 minutes.">
        <Button href="/admin/forgot-password" size="lg" full>
          Send a new link
        </Button>
      </AdminAuthShell>
    );

  if (done)
    return (
      <AdminAuthShell title="Password updated" subtitle="Log in with your new password.">
        <Button href="/admin/login" size="lg" full>
          Log in
        </Button>
      </AdminAuthShell>
    );

  return (
    <AdminAuthShell title="New password">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <Field label="New password" hint={`At least ${MIN} characters`} error={errors.pw}>
          <PasswordInput autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Confirm new password" error={errors.pw2}>
          <PasswordInput autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" full loading={busy}>
          Save password
        </Button>
      </form>
    </AdminAuthShell>
  );
}
