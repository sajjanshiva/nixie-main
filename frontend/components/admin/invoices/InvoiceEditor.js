"use client";
// Create a new invoice, or edit a draft. Totals are calculated live by the backend.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input, { Textarea } from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, ConfirmDialog, PageHeader } from "../ui";
import { ItemDialog, DiscountDialog, ShippingDialog } from "./EditorDialogs";
import SendDialog from "./SendDialog";
import { adminApi, paiseToInput, toPaise } from "@/lib/adminApi";
import { paise } from "@/lib/format";
import { cleanPhone, validEmail } from "@/lib/validate";
import { cn } from "@/lib/cn";

let keySeq = 0;
const newKey = () => `i${++keySeq}`;

function fromInvoice(inv) {
  return {
    customer: { name: inv.customer.name || "", email: inv.customer.email || "", phone: inv.customer.phone || "" },
    items: inv.items.map((it) => ({
      key: newKey(),
      name: it.name,
      price: paiseToInput(it.unitPricePaise),
      quantity: it.quantity,
      gstRate: it.gstAuto ? null : it.gstRate,
    })),
    discount: inv.discount
      ? {
          type: inv.discount.type,
          value: inv.discount.type === "amount" ? paiseToInput(inv.discount.amountPaise) : String(inv.discount.percent ?? ""),
          reason: inv.discount.reason || "",
        }
      : null,
    shipping: inv.shipping ? { name: inv.shipping.name, price: paiseToInput(inv.shipping.pricePaise) } : null,
    internalNote: inv.internalNote || "",
  };
}

/** Editor state → backend body */
function toBody(s) {
  const discount = s.discount
    ? s.discount.type === "amount"
      ? { type: "amount", amountPaise: toPaise(s.discount.value) ?? 0, reason: s.discount.reason.trim() || undefined }
      : { type: "percent", percent: Number(s.discount.value) || 0, reason: s.discount.reason.trim() || undefined }
    : null;
  return {
    customer: { name: s.customer.name.trim(), email: s.customer.email.trim(), phone: s.customer.phone.trim() ? cleanPhone(s.customer.phone) : null },
    items: s.items.map((it) => ({ name: it.name.trim(), unitPricePaise: toPaise(it.price) ?? 0, quantity: Number(it.quantity) || 1, gstRate: it.gstRate })),
    discount,
    shipping: s.shipping ? { name: s.shipping.name.trim(), pricePaise: toPaise(s.shipping.price) ?? 0 } : null,
    internalNote: s.internalNote.trim() || undefined,
  };
}

export default function InvoiceEditor({ invoice }) {
  const router = useRouter();
  const toast = useToast();
  const [id, setId] = useState(invoice?.id || null);
  const [s, setS] = useState(() =>
    invoice ? fromInvoice(invoice) : { customer: { name: "", email: "", phone: "" }, items: [], discount: null, shipping: null, internalNote: "" }
  );
  const [calc, setCalc] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(null); // "draft" | "send" | null
  const [dirty, setDirty] = useState(false);
  const [itemDialog, setItemDialog] = useState(null); // { index } | { index: -1 }
  const [discountOpen, setDiscountOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [sendFor, setSendFor] = useState(null); // saved invoice to send
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const update = (fn) => {
    setS((prev) => fn(structuredClone(prev)));
    setDirty(true);
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const onBefore = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  // Live totals
  const calcBody = useMemo(() => {
    const b = toBody(s);
    return JSON.stringify({ items: b.items, discount: b.discount, shipping: b.shipping });
  }, [s]);
  const calcReq = useRef(0);
  useEffect(() => {
    const body = JSON.parse(calcBody);
    if (!body.items.length && !body.shipping) {
      setCalc(null);
      return;
    }
    const n = ++calcReq.current;
    const t = setTimeout(async () => {
      try {
        const d = await adminApi("/invoices/calculate", { method: "POST", body });
        if (n === calcReq.current) setCalc(d);
      } catch {
        /* keep the last good totals; errors show on save */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [calcBody]);

  function localErrors() {
    const e = {};
    if (!s.customer.name.trim()) e["customer.name"] = "Customer name is required";
    if (!validEmail(s.customer.email)) e["customer.email"] = "Enter a valid email";
    if (s.customer.phone.trim() && !/^[6-9]\d{9}$/.test(cleanPhone(s.customer.phone))) e["customer.phone"] = "Enter a valid 10-digit mobile number";
    return e;
  }

  async function save(mode) {
    const e = localErrors();
    if (mode === "send" && s.items.length === 0) e.items = "Add at least one item before sending.";
    setErrors(e);
    setFormError("");
    if (Object.keys(e).length) {
      setFormError(e.items || "Please check the highlighted fields.");
      return;
    }
    setSaving(mode);
    try {
      const body = toBody(s);
      const d = id
        ? await adminApi(`/invoices/${id}`, { method: "PUT", body })
        : await adminApi("/invoices", { method: "POST", body });
      setDirty(false);
      if (!id) {
        setId(d.invoice.id);
        // stay on this screen but give it its real address
        window.history.replaceState(null, "", `/admin/invoices/${d.invoice.id}`);
      }
      if (mode === "send") setSendFor(d.invoice);
      else toast.success("Draft saved.");
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function removeDraft() {
    setDeleting(true);
    try {
      await adminApi(`/invoices/${id}`, { method: "DELETE" });
      setDirty(false);
      toast.success("Draft deleted.");
      router.replace("/admin/invoices");
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  const lineCalc = (i) => calc?.lines?.[i];

  // Typing in a field clears its error
  const setCustomer = (k, value) => {
    update((x) => ((x.customer[k] = value), x));
    setErrors((e) => {
      if (!e[`customer.${k}`]) return e;
      const n = { ...e };
      delete n[`customer.${k}`];
      return n;
    });
  };

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/invoices" className="mb-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Invoices
          </Link>
        }
        title={id ? "Draft invoice" : "New invoice"}
        subtitle="The invoice number (NX-…) is given when you send it."
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <FormError message={formError} />

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-[26px] leading-none">Customer</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors["customer.name"]} className="sm:col-span-2">
                <Input value={s.customer.name} maxLength={100} onChange={(e) => setCustomer("name", e.target.value)} />
              </Field>
              <Field label="Email" hint="The invoice is sent here" error={errors["customer.email"]}>
                <Input type="email" value={s.customer.email} onChange={(e) => setCustomer("email", e.target.value)} />
              </Field>
              <Field label="Phone" optional error={errors["customer.phone"]}>
                <Input type="tel" inputMode="tel" value={s.customer.phone} onChange={(e) => setCustomer("phone", e.target.value)} />
              </Field>
            </div>
            <p className="mt-3 text-[13px] text-muted">No address needed. The customer enters it at checkout.</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[26px] leading-none">Items</h2>
              <Button size="sm" variant="outline" onClick={() => setItemDialog({ index: -1 })}>
                <Plus className="size-4" aria-hidden="true" />
                Add item
              </Button>
            </div>
            {errors.items && <p className="mt-3 text-[13px] font-medium text-danger">{errors.items}</p>}
            {s.items.length === 0 ? (
              <button
                type="button"
                onClick={() => setItemDialog({ index: -1 })}
                className="mt-5 flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line-strong px-4 py-8 text-center transition hover:border-teal-deep hover:bg-cyan-soft/40"
              >
                <span className="text-[15px] font-semibold">Add the first item</span>
                <span className="text-[13px] text-muted">Name, price, quantity and GST</span>
              </button>
            ) : (
              <ul className="mt-4">
                {s.items.map((it, i) => {
                  const lc = lineCalc(i);
                  const rate = lc?.gstRate;
                  const bad = Object.keys(errors).some((k) => k.startsWith(`items.${i}.`));
                  return (
                    <li key={it.key} className={cn("flex items-center gap-3 border-t border-line py-3.5 first:border-0", bad && "rounded-xl bg-danger-soft px-2")}>
                      <button type="button" onClick={() => setItemDialog({ index: i })} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[15.5px] font-semibold">{it.name || "Untitled item"}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13.5px] text-muted">
                          <span className="tabular-nums">
                            {it.quantity} × {paise(toPaise(it.price) ?? 0)}
                          </span>
                          {rate && (
                            <span className="rounded-full bg-mint px-2 py-0.5 text-[12px] font-semibold text-teal-deeper ring-1 ring-line">
                              GST {rate}%{it.gstRate === null ? " auto" : ""}
                            </span>
                          )}
                        </span>
                      </button>
                      <span className="text-[15px] font-semibold tabular-nums">{paise((toPaise(it.price) ?? 0) * (Number(it.quantity) || 0))}</span>
                      <button
                        type="button"
                        onClick={() => setItemDialog({ index: i })}
                        className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-ink"
                        aria-label={`Edit ${it.name}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => update((x) => (x.items.splice(i, 1), x))}
                        className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                        aria-label={`Remove ${it.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap gap-2 border-t border-dashed border-line-strong pt-5">
              {s.discount ? (
                <ExtraChip
                  label={`Discount: ${s.discount.type === "amount" ? paise(toPaise(s.discount.value) ?? 0) : `${s.discount.value || 0}%`}${s.discount.reason ? ` (${s.discount.reason})` : ""}`}
                  onEdit={() => setDiscountOpen(true)}
                  onRemove={() => update((x) => ((x.discount = null), x))}
                />
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setDiscountOpen(true)} className="ring-1 ring-inset ring-line">
                  <Plus className="size-4" aria-hidden="true" />
                  Add discount
                </Button>
              )}
              {s.shipping ? (
                <ExtraChip
                  label={`${s.shipping.name}: ${(toPaise(s.shipping.price) ?? 0) === 0 ? "Free" : paise(toPaise(s.shipping.price))}`}
                  onEdit={() => setShippingOpen(true)}
                  onRemove={() => update((x) => ((x.shipping = null), x))}
                />
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setShippingOpen(true)} className="ring-1 ring-inset ring-line">
                  <Plus className="size-4" aria-hidden="true" />
                  Add shipping
                </Button>
              )}
            </div>
            {(errors["discount.value"] || errors["shipping.name"]) && (
              <p className="mt-2 text-[13px] font-medium text-danger">{errors["discount.value"] || errors["shipping.name"]}</p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <Field label="Internal note" optional hint="Only you see this. It’s never shown to the customer.">
              <Textarea rows={3} maxLength={2000} value={s.internalNote} onChange={(e) => update((x) => ((x.internalNote = e.target.value), x))} />
            </Field>
          </Card>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-8">
          <Card className="overflow-hidden">
            <div className="bg-admin-side px-5 py-4">
              <h2 className="font-display text-[26px] leading-none text-white">Summary</h2>
            </div>
            <dl className="flex flex-col gap-2.5 px-5 py-5 text-[15px]">
              <SumRow label="Subtotal" value={paise(calc?.subtotalPaise ?? 0)} />
              {s.discount && <SumRow label="Discount" value={`−${paise(calc?.discountPaise ?? 0)}`} accent />}
              <SumRow label="GST" value={paise(calc?.gstPaise ?? 0)} />
              {s.shipping && <SumRow label="Shipping" value={paise(calc?.shippingPaise ?? 0)} />}
              <div className="mt-2 flex items-end justify-between border-t border-line pt-4">
                <dt>
                  <span className="block font-semibold">Total</span>
                  <span className="text-[12.5px] text-muted">Including taxes</span>
                </dt>
                <dd className="font-display text-[38px] leading-none tabular-nums">{paise(calc?.totalPaise ?? 0)}</dd>
              </div>
            </dl>
          </Card>
          <Button size="lg" full onClick={() => save("send")} loading={saving === "send"} disabled={!!saving}>
            <Send className="size-[18px]" aria-hidden="true" />
            Send invoice
          </Button>
          <Button size="lg" full variant="outline" onClick={() => save("draft")} loading={saving === "draft"} disabled={!!saving}>
            Save draft
          </Button>
          {id && (
            <Button variant="ghost" full onClick={() => setConfirmDelete(true)} className="text-danger hover:bg-danger-soft">
              <Trash2 className="size-4" aria-hidden="true" />
              Delete draft
            </Button>
          )}
        </div>
      </div>

      <ItemDialog
        state={itemDialog}
        item={itemDialog && itemDialog.index >= 0 ? s.items[itemDialog.index] : null}
        suggestedRate={itemDialog && itemDialog.index >= 0 ? lineCalc(itemDialog.index)?.suggestedRate : null}
        onClose={() => setItemDialog(null)}
        onSave={(it) => {
          update((x) => {
            if (itemDialog.index >= 0) x.items[itemDialog.index] = { ...x.items[itemDialog.index], ...it };
            else x.items.push({ key: newKey(), ...it });
            return x;
          });
          setErrors((e) => ({ ...e, items: undefined }));
          setFormError((f) => (f.startsWith("Add at least one item") ? "" : f));
          setItemDialog(null);
        }}
      />
      <DiscountDialog
        open={discountOpen}
        value={s.discount}
        onClose={() => setDiscountOpen(false)}
        onSave={(d) => {
          update((x) => ((x.discount = d), x));
          setDiscountOpen(false);
        }}
      />
      <ShippingDialog
        open={shippingOpen}
        value={s.shipping}
        onClose={() => setShippingOpen(false)}
        onSave={(v) => {
          update((x) => ((x.shipping = v), x));
          setShippingOpen(false);
        }}
      />
      <SendDialog invoice={sendFor} onClose={() => setSendFor(null)} onSent={(inv) => router.replace(`/admin/invoices/${inv.id}?sent=1`)} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this draft?"
        text="Drafts have no invoice number yet, so nothing is lost from your numbering."
        confirmLabel="Delete draft"
        busy={deleting}
        onConfirm={removeDraft}
      />
    </>
  );
}

function SumRow({ label, value, accent }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("tabular-nums", accent && "font-semibold text-teal-deep")}>{value}</dd>
    </div>
  );
}

function ExtraChip({ label, onEdit, onRemove }) {
  return (
    <span className="inline-flex h-9 items-center gap-1 rounded-full bg-cyan-soft pl-3.5 pr-1 text-[13.5px] font-semibold text-teal-deeper">
      <button type="button" onClick={onEdit} className="max-w-[260px] truncate hover:underline">
        {label}
      </button>
      <button type="button" onClick={onRemove} className="flex size-7 items-center justify-center rounded-full hover:bg-white" aria-label="Remove">
        <X className="size-3.5" />
      </button>
    </span>
  );
}
