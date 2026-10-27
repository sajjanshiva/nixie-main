"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { OrDivider } from "@/components/site/AuthShell";
import GoogleButton from "@/components/site/GoogleButton";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api } from "@/lib/api";
import { finishLogin } from "@/lib/afterLogin";
import { validEmail } from "@/lib/validate";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { customer, loading, setCustomer } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already logged in → continue
  // Logged in (already, or just now) → continue to the next page. Runs once.
  const redirected = useRef(false);
  useEffect(() => {
    if (!loading && customer && !redirected.current) {
      redirected.current = true;
      finishLogin(router, next);
    }
  }, [loading, customer, router, next]);

  async function done(c) {
    setCustomer(c);
    toast.success(`Welcome${c?.name ? `, ${c.name.split(" ")[0]}` : ""}!`);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!validEmail(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Enter your password";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { customer: c } = await api("/auth/login", { method: "POST", body: { email: form.email.trim(), password: form.password } });
      await done(c);
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.fields ? "" : err.message);
      setBusy(false);
    }
  }

  async function onGoogle(credential) {
    setFormError("");
    setBusy(true);
    try {
      const { customer: c } = await api("/auth/google", { method: "POST", body: { credential } });
      await done(c);
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  const q = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <AuthShell title="Welcome back" subtitle="Log in to save your estimates and contact us about any look.">
      <GoogleButton onCredential={onGoogle} />
      <OrDivider />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="-mt-2 flex justify-end">
          <Link href="/forgot-password" className="text-[14px] font-semibold text-teal-deep hover:text-teal-deeper">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" full loading={busy}>
          Log in
        </Button>
      </form>
      <p className="mt-8 text-center text-[15px] text-muted">
        New to Nixie?{" "}
        <Link href={`/signup${q}`} className="font-semibold text-ink underline decoration-cyan decoration-2 underline-offset-4 hover:text-teal-deep">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
