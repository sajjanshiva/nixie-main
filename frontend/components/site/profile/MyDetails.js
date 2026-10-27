"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import AddressFields from "@/components/site/AddressFields";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api } from "@/lib/api";
import { cleanPhone, validateContact } from "@/lib/validate";

export default function MyDetails() {
  const router = useRouter();
  const { customer, setCustomer, logout } = useAuth();
  const toast = useToast();
  const [v, setV] = useState({
    name: customer.name || "",
    phone: customer.phone || "",
    addressLine: customer.addressLine || "",
    city: customer.city || "",
    state: customer.state || "",
    pincode: customer.pincode || "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const set = (k, val) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validateContact(v, { requireEmail: false });
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { customer: c } = await api("/me", {
        method: "PATCH",
        body: { ...v, name: v.name.trim(), phone: cleanPhone(v.phone), addressLine: v.addressLine.trim(), city: v.city.trim(), pincode: v.pincode.trim() },
      });
      setCustomer(c);
      toast.success("Your details are saved.");
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.fields ? "" : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setLeaving(true);
    await logout();
    router.replace("/");
    router.refresh();
  }

  const methods = [customer.hasGoogle && "Google", customer.hasPassword && "email and password"].filter(Boolean).join(" and ");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-[10px] bg-surface p-6 ring-1 ring-line sm:p-9">
        <FormError message={formError} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Name" error={errors.name} className="sm:col-span-2">
            <Input autoComplete="name" value={v.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Phone" hint="10-digit mobile number" error={errors.phone}>
            <Input type="tel" inputMode="tel" autoComplete="tel-national" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email" hint="Used to log in, so it can’t be changed">
            <Input value={customer.email} disabled readOnly />
          </Field>
        </div>
        <AddressFields values={v} errors={errors} onChange={set} />
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={busy}>
            Save changes
          </Button>
        </div>
      </form>

      <aside className="flex flex-col gap-4 self-start rounded-[10px] bg-teal p-7 sm:p-8">
        <h2 className="font-display text-[32px] leading-tight text-white">Your account</h2>
        {methods && <p className="text-[15px] leading-relaxed text-ink">You log in with {methods}.</p>}
        <p className="text-[15px] leading-relaxed text-ink">Saved details fill in the contact form and checkout for you.</p>
        <Button variant="dark" size="lg" onClick={onLogout} loading={leaving} className="mt-2 self-start">
          <LogOut className="size-[18px]" aria-hidden="true" />
          Log out
        </Button>
      </aside>
    </div>
  );
}
