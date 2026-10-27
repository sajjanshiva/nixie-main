"use client";
// Lead details in a side panel (full screen on phones).
import { useEffect, useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLink, Trash2, X } from "lucide-react";
import IkImage from "@/components/ui/IkImage";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import FormError from "@/components/ui/FormError";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmDialog, LeadTypeBadge } from "../ui";
import { adminApi } from "@/lib/adminApi";
import { dateTime, rupees } from "@/lib/format";

export default function LeadPanel({ id, initial, onClose, onDeleted }) {
  const toast = useToast();
  const [lead, setLead] = useState(initial || null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setError("");
    if (initial) {
      setLead(initial);
      return;
    }
    setLead(null);
    adminApi(`/leads/${id}`)
      .then((d) => setLead(d.lead))
      .catch((e) => setError(e.status === 404 ? "This lead was deleted." : e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function remove() {
    setDeleting(true);
    try {
      await adminApi(`/leads/${id}`, { method: "DELETE" });
      toast.success("Lead deleted.");
      setConfirm(false);
      onDeleted(id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const img = lead?.analysis?.imageUrl || lead?.galleryImage?.imageUrl || lead?.photoUrl;
  const address = lead ? [lead.addressLine, lead.city, lead.state && `${lead.state} ${lead.pincode || ""}`.trim()].filter(Boolean).join(", ") : "";

  return (
    <DialogPrimitive.Root open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/40 data-[state=open]:animate-[nx-fade-in_.2s_ease-out]" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-[81] flex w-full flex-col bg-mint shadow-float outline-none data-[state=open]:animate-[nx-slide-in-right_.28s_cubic-bezier(.2,.8,.2,1)] sm:max-w-xl">
          <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-4">
            <DialogPrimitive.Title className="font-display text-[28px] leading-none">Lead details</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Full details of this enquiry</DialogPrimitive.Description>
            <DialogPrimitive.Close className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <FormError message={error} />
            {!lead && !error && (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-72 rounded-[20px]" />
                <Skeleton className="h-40 rounded-[20px]" />
              </div>
            )}
            {lead && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[22px] font-semibold">{lead.name}</h2>
                    <LeadTypeBadge type={lead.type} />
                  </div>
                  <p className="mt-1 text-[14px] text-muted">{dateTime(lead.createdAt)}</p>
                </div>

                {img && (
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-[20px] bg-cyan-soft ring-1 ring-line">
                    <IkImage src={img} alt="Attached outfit" fill sizes="320px" className="object-cover" />
                  </div>
                )}

                {lead.analysis && (
                  <Section title="AI analysis">
                    <Row label="Outfit" value={lead.analysis.outfitType} />
                    <Row label="Fabrics" value={[lead.analysis.primaryFabric, ...(lead.analysis.secondaryFabrics || [])].filter(Boolean).join(", ")} />
                    <Row label="Estimate" value={<span className="font-display text-[26px] leading-none">{rupees(lead.analysis.estimatedPrice)}</span>} />
                  </Section>
                )}

                {lead.galleryImage && (
                  <Section title="Gallery image">
                    <Row
                      label="Look"
                      value={
                        lead.galleryImage.slug ? (
                          <Link href={`/gallery/${lead.galleryImage.slug}`} target="_blank" className="inline-flex items-center gap-1.5 font-semibold text-teal-deep hover:text-teal-deeper">
                            {lead.galleryImage.title}
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                          </Link>
                        ) : (
                          `${lead.galleryImage.title} (removed from gallery)`
                        )
                      }
                    />
                  </Section>
                )}

                <Section title="Message">
                  <p className="whitespace-pre-line text-[15px] leading-relaxed">{lead.message || <span className="text-muted">No message</span>}</p>
                </Section>

                <Section title="Contact">
                  <Row label="Name" value={lead.name} />
                  <Row label="Phone" value={<span className="tabular-nums select-all">{lead.phone}</span>} />
                  <Row label="Email" value={<span className="break-all select-all">{lead.email}</span>} />
                  <Row label="Address" value={address || "—"} />
                </Section>
              </div>
            )}
          </div>

          {lead && (
            <div className="border-t border-line bg-surface px-5 py-4">
              <Button variant="danger" onClick={() => setConfirm(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete lead
              </Button>
            </div>
          )}
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Delete this lead?"
            text="Use this for spam or test entries. It can’t be undone."
            confirmLabel="Delete"
            busy={deleting}
            onConfirm={remove}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-[20px] bg-surface p-5 ring-1 ring-line">
      <h3 className="mb-3 text-[13px] font-semibold text-muted">{title}</h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-baseline gap-3 text-[15px]">
      <span className="text-[13.5px] text-muted">{label}</span>
      <span className="min-w-0">{value}</span>
    </div>
  );
}
