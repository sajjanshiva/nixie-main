"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, MailCheck } from "lucide-react";
import AuthShell, { OrDivider } from "@/components/site/AuthShell";
import GoogleButton from "@/components/site/GoogleButton";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMeta } from "@/components/providers/MetaProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api } from "@/lib/api";
import { finishLogin } from "@/lib/afterLogin";
import { validEmail } from "@/lib/validate";

export default function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { customer, loading, setCustomer } = useAuth();
  const { meta } = useMeta();
  const toast = useToast();
  const minPw = meta.limits?.customerPasswordMin || 8;
  const resendSeconds = meta.limits?.otpResendSeconds || 60;

  const [step, setStep] = useState("details"); // details | code
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [accountExists, setAccountExists] = useState(false);

  // Logged in (already, or just now) → continue to the next page. Runs once.
  const redirected = useRef(false);
  useEffect(() => {
    if (!loading && customer && !redirected.current) {
      redirected.current = true;
      finishLogin(router, next);
    }
  }, [loading, customer, router, next]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function sendDetails(e) {
    e.preventDefault();
    const errs = {};
    if (!validEmail(form.email)) errs.email = "Enter a valid email";
    if (form.password.length < minPw) errs.password = `Password must be at least ${minPw} characters`;
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await api("/auth/signup", {
        method: "POST",
        body: { email: form.email.trim(), password: form.password, ...(form.name.trim() ? { name: form.name.trim() } : {}) },
      });
      setStep("code");
      setCode("");
      setWait(resendSeconds);
    } catch (err) {
      if (err.code === "OTP_TOO_SOON") {
        // a code was sent a moment ago: go to the code screen
        setStep("code");
        setWait(err.extra?.retryAfterSeconds || resendSeconds);
      } else {
        setErrors(err.fields || {});
        setFormError(err.fields ? "" : err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setFormError("");
    try {
      await api("/auth/signup/resend", { method: "POST", body: { email: form.email.trim() } });
      toast.success("A new code is on its way.");
      setWait(resendSeconds);
      setCode("");
    } catch (err) {
      if (err.code === "OTP_TOO_SOON") setWait(err.extra?.retryAfterSeconds || resendSeconds);
      setFormError(err.message);
    }
  }

  async function verify(e) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setFormError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const { customer: c } = await api("/auth/signup/verify", { method: "POST", body: { email: form.email.trim(), code } });
      setCustomer(c);
      toast.success("Your account is ready.");
      } catch (err) {
      if (err.code === "ACCOUNT_EXISTS") setAccountExists(true);
      setFormError(err.message);
      setBusy(false);
    }
  }

  async function onGoogle(credential) {
    setBusy(true);
    setFormError("");
    try {
      const { customer: c } = await api("/auth/google", { method: "POST", body: { credential } });
      setCustomer(c);
      } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  // Auto-submit when all 6 digits are typed
  useEffect(() => {
    if (step === "code" && /^\d{6}$/.test(code) && !busy) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const q = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <AuthShell
      title={step === "details" ? "Create your account" : "Check your email"}
      subtitle={
        step === "details" ? "Save your estimates, send enquiries and pay invoices in one place." : `We’ve sent a 6-digit code to ${form.email.trim()}.`
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "details" ? (
          <motion.div key="details" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
            <GoogleButton onCredential={onGoogle} text="signup_with" />
            <OrDivider />
            <form onSubmit={sendDetails} noValidate className="flex flex-col gap-5">
              <FormError message={formError} />
              <Field label="Name" optional error={errors.name}>
                <Input autoComplete="name" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email" error={errors.email}>
                <Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Password" hint={`At least ${minPw} characters`} error={errors.password}>
                <PasswordInput autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Button type="submit" size="lg" full loading={busy}>
                Send me a code
              </Button>
            </form>
            <p className="mt-8 text-center text-[15px] text-muted">
              Already have an account?{" "}
              <Link href={`/login${q}`} className="font-semibold text-ink underline decoration-cyan decoration-2 underline-offset-4 hover:text-teal-deep">
                Log in
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="code"
            onSubmit={verify}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-cyan-soft px-4 py-3 text-[14px] text-teal-deeper">
              <MailCheck className="size-5 shrink-0" aria-hidden="true" />
              The code works for 10 minutes. Check your spam folder if you can’t see it.
            </div>
            <FormError message={formError}>
              {accountExists && (
                <Link href={`/login${q}`} className="ml-1 font-semibold underline">
                  Log in instead
                </Link>
              )}
            </FormError>
            <OtpInput value={code} onChange={setCode} invalid={!!formError} disabled={busy} autoFocus />
            <Button type="submit" size="lg" full loading={busy}>
              Verify and continue
            </Button>
            <div className="flex items-center justify-between text-[14px]">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setFormError("");
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-muted hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Change email
              </button>
              <button type="button" onClick={resend} disabled={wait > 0} className="font-semibold text-teal-deep hover:text-teal-deeper disabled:text-muted">
                {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
