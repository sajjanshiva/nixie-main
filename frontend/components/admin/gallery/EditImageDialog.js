"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import Field from "@/components/ui/Field";
import Input, { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import IkImage from "@/components/ui/IkImage";
import TagInput from "./TagInput";
import { adminApi } from "@/lib/adminApi";

export default function EditImageDialog({ image, onClose, onSaved }) {
  const [v, setV] = useState({ title: "", description: "", tags: [] });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (image) {
      setV({ title: image.title, description: image.description || "", tags: image.tags || [] });
      setErrors({});
      setError("");
    }
  }, [image]);

  async function submit(e) {
    e.preventDefault();
    if (!v.title.trim()) return setErrors({ title: "Title is required" });
    setBusy(true);
    setError("");
    try {
      const d = await adminApi(`/gallery/${image.id}`, {
        method: "PATCH",
        body: { title: v.title.trim(), description: v.description.trim() || undefined, tags: v.tags },
      });
      onSaved(d.image);
    } catch (err) {
      setErrors(err.fields || {});
      setError(err.fields ? "" : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!image} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent title="Edit image" description="The page link stays the same." className="max-w-xl">
        {image && (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <FormError message={error} />
            <div className="flex gap-4">
              <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-cyan-soft">
                <IkImage src={image.imageUrl} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <Field label="Title" error={errors.title} className="flex-1">
                <Input value={v.title} maxLength={120} onChange={(e) => setV({ ...v, title: e.target.value })} />
              </Field>
            </div>
            <Field label="Tags" hint="Include other names people search for, e.g. lehenga, ghagra" error={errors.tags}>
              <TagInput value={v.tags} onChange={(tags) => setV({ ...v, tags })} />
            </Field>
            <Field label="Description" optional error={errors.description}>
              <Textarea rows={3} maxLength={1000} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
            </Field>
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Save
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
