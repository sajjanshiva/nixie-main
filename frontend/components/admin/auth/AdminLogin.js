"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import { useAdmin } from "@/components/admin/AdminProvider";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { api } from "@/lib/api";
import { validEmail } from "@/lib/validate";

function safeAdminNext(n) {
  return typeof n === "string" && n.startsWith("/admin") && !n.startsWith("//") && !n.startsWith("/admin/login") ? n : "/admin";
}

export default function AdminLogin() {
  const router = useRouter();
  const next = safeAdminNext(useSearchParams().get("next"));
  const { admin, loading, setAdmin } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (!loading && admin && !done.current) {
      done.current = true;
      router.replace(next);
    }
  }, [loading, admin, next, router]);

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!validEmail(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Enter your password";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const d = await api("/admin/auth/login", { method: "POST", body: { email: email.trim(), password } });
      setAdmin(d.admin);
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <AdminAuthShell title="Welcome back" subtitle="Log in to the Nixie admin.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="-mt-2 flex justify-end">
          <Link href="/admin/forgot-password" className="text-[14px] font-semibold text-teal-deep hover:text-teal-deeper">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" full loading={busy}>
          Log in
        </Button>
      </form>
    </AdminAuthShell>
  );
}
