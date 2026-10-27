"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import Field from "@/components/ui/Field";
import Input, { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import AddressFields from "@/components/site/AddressFields";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { checkImageFile, compressImage } from "@/lib/compress";
import { clearPending } from "@/lib/guestFlow";
import { cleanPhone, validateContact } from "@/lib/validate";

export default function ContactForm({ customer, kind, analysisId, galleryImageId, disabled, onSent }) {
  const { refresh } = useAuth();
  const [v, setV] = useState(() => ({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    addressLine: customer.addressLine || "",
    city: customer.city || "",
    state: customer.state || "",
    pincode: customer.pincode || "",
    message: "",
  }));
  const [photo, setPhoto] = useState(null); // { file, url }
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  const set = (k, val) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setErrors((x) => ({ ...x, photo: problem }));
      return;
    }
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ file, url: URL.createObjectURL(file) });
    setErrors((x) => ({ ...x, photo: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validateContact(v);
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) {
      setFormError("Please check the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", v.name.trim());
      fd.append("phone", cleanPhone(v.phone));
      fd.append("email", v.email.trim());
      fd.append("addressLine", v.addressLine.trim());
      fd.append("city", v.city.trim());
      fd.append("state", v.state);
      fd.append("pincode", v.pincode.trim());
      if (v.message.trim()) fd.append("message", v.message.trim());
      if (analysisId) fd.append("analysisId", analysisId);
      if (galleryImageId) fd.append("galleryImageId", galleryImageId);
      if (kind === "general" && photo) fd.append("photo", await compressImage(photo.file));

      const { lead } = await api("/leads", { method: "POST", body: fd });
      clearPending();
      refresh(); // the server saved name/phone/address to the profile
      onSent(lead);
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.fields ? "Please check the highlighted fields." : err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-[32px] bg-surface p-6 ring-1 ring-line sm:p-9">
      <FormError message={formError} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name} className="sm:col-span-2">
          <Input autoComplete="name" value={v.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Phone" hint="10-digit mobile number" error={errors.phone}>
          <Input type="tel" inputMode="tel" autoComplete="tel-national" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>

      <AddressFields values={v} errors={errors} onChange={set} />

      <Field label="Message" optional error={errors.message}>
        <Textarea
          value={v.message}
          maxLength={2000}
          onChange={(e) => set("message", e.target.value)}
          placeholder={kind === "analysis" ? "Any changes or details? (colour, occasion, date needed…)" : "Tell us what you’re looking for…"}
        />
      </Field>

      {kind === "general" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            Photo <span className="font-normal text-muted">(optional)</span>
          </span>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickPhoto} tabIndex={-1} />
          {photo ? (
            <div className="flex items-center gap-4 rounded-2xl bg-mint p-3 ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Selected photo" className="size-16 rounded-xl object-cover" />
              <p className="min-w-0 flex-1 truncate text-[14px]">{photo.file.name}</p>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"
                aria-label="Remove photo"
              >
                <X className="size-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-strong px-4 py-6 text-[15px] font-semibold text-muted transition hover:border-teal-deep hover:bg-cyan-soft/40 hover:text-teal-deeper"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              Add a photo of a look you like
            </button>
          )}
          {errors.photo && <p className="text-[13px] font-medium text-danger">{errors.photo}</p>}
        </div>
      )}

      <Button type="submit" size="lg" full loading={busy} disabled={disabled}>
        Send enquiry
      </Button>
      <p className="-mt-2 text-center text-[13px] text-muted">Your name, phone and address are saved to your profile for next time.</p>
    </form>
  );
}
