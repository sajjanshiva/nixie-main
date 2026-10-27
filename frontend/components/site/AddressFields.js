"use client";
// Address block used in the contact form, profile and checkout:
// Address (house, street, area) · City · State (dropdown) · Pincode (6 digits). India only.
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useMeta } from "@/components/providers/MetaProvider";

export default function AddressFields({ values, errors = {}, onChange, disabled }) {
  const { meta } = useMeta();
  const set = (k) => (e) => onChange(k, e?.target ? e.target.value : e);
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Address" hint="House / flat, street and area" error={errors.addressLine} className="sm:col-span-2">
        <Input value={values.addressLine || ""} onChange={set("addressLine")} autoComplete="street-address" maxLength={300} disabled={disabled} />
      </Field>
      <Field label="City" error={errors.city}>
        <Input value={values.city || ""} onChange={set("city")} autoComplete="address-level2" maxLength={80} disabled={disabled} />
      </Field>
      <Field label="Pincode" error={errors.pincode}>
        <Input
          value={values.pincode || ""}
          onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="6 digits"
          disabled={disabled}
        />
      </Field>
      <Field label="State" error={errors.state} className="sm:col-span-2">
        <Select value={values.state} onValueChange={set("state")} options={meta.states} placeholder="Select your state" disabled={disabled} />
      </Field>
    </div>
  );
}
