"use client";
// Popups on the invoice editor: item, discount, shipping. Prices are typed in rupees (paise allowed).
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { toPaise } from "@/lib/adminApi";
import { cn } from "@/lib/cn";

function MoneyInput({ value, onChange, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-muted">₹</span>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
        placeholder="0"
        className="pl-9 tabular-nums"
        {...props}
      />
    </div>
  );
}

function PercentInput({ value, onChange, ...props }) {
  return (
    <div className="relative">
      <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} placeholder="10" className="pr-10 tabular-nums" {...props} />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">%</span>
    </div>
  );
}

function Actions({ onClose, label = "Save" }) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit">{label}</Button>
    </div>
  );
}

export function ItemDialog({ state, item, suggestedRate, onClose, onSave }) {
  const open = !!state;
  const [v, setV] = useState({ name: "", price: "", quantity: "1", gst: "auto" });
  const [e, setE] = useState({});

  useEffect(() => {
    if (!open) return;
    setE({});
    setV(
      item
        ? { name: item.name, price: item.price, quantity: String(item.quantity), gst: item.gstRate ? String(item.gstRate) : "auto" }
        : { name: "", price: "", quantity: "1", gst: "auto" }
    );
  }, [open, item]);

  // Preview of the automatic rate (price per piece, before any invoice discount)
  const p = toPaise(v.price);
  const autoGuess = suggestedRate || (p !== null ? (p <= 250000 ? 5 : 18) : null);

  function submit(ev) {
    ev.preventDefault();
    const err = {};
    if (!v.name.trim()) err.name = "Item name is required";
    if (p === null || p <= 0) err.price = "Enter a price, e.g. 2499 or 2499.50";
    const q = Number(v.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 999) err.quantity = "1 to 999";
    setE(err);
    if (Object.keys(err).length) return;
    onSave({ name: v.name.trim(), price: v.price, quantity: q, gstRate: v.gst === "auto" ? null : Number(v.gst) });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item ? "Edit item" : "Add item"}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field label="Item name" error={e.name}>
            <Input value={v.name} maxLength={200} onChange={(x) => setV({ ...v, name: x.target.value })} placeholder="e.g. Custom lehenga" autoFocus />
          </Field>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Price per piece" error={e.price}>
              <MoneyInput value={v.price} onChange={(price) => setV({ ...v, price })} />
            </Field>
            <Field label="Quantity" error={e.quantity}>
              <Input inputMode="numeric" value={v.quantity} onChange={(x) => setV({ ...v, quantity: x.target.value.replace(/\D/g, "").slice(0, 3) })} />
            </Field>
          </div>
          <Field label="GST rate" hint="Auto: 5% if the price per piece after discount is ₹2,500 or less, otherwise 18%.">
            <Select
              value={v.gst}
              onValueChange={(gst) => setV({ ...v, gst })}
              options={[
                { value: "auto", label: autoGuess ? `Auto (${autoGuess}%)` : "Auto" },
                { value: "5", label: "5%" },
                { value: "18", label: "18%" },
              ]}
            />
          </Field>
          <Actions onClose={onClose} label={item ? "Save item" : "Add item"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DiscountDialog({ open, value, onClose, onSave }) {
  const [v, setV] = useState({ type: "percent", value: "", reason: "" });
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) {
      setErr("");
      setV(value || { type: "percent", value: "", reason: "" });
    }
  }, [open, value]);

  function submit(ev) {
    ev.preventDefault();
    if (v.type === "percent") {
      const n = Number(v.value);
      if (!v.value || Number.isNaN(n) || n <= 0 || n > 100) return setErr("Enter a percentage between 0 and 100");
    } else if (!toPaise(v.value)) return setErr("Enter an amount, e.g. 500");
    onSave({ ...v, reason: v.reason.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={value ? "Edit discount" : "Add discount"} description="The customer sees the reason on the invoice.">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Discount type">
            {[
              ["percent", "Percent (%)"],
              ["amount", "Amount (₹)"],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={v.type === k}
                onClick={() => setV({ ...v, type: k, value: "" })}
                className={cn(
                  "h-11 rounded-full text-[14.5px] font-semibold transition",
                  v.type === k ? "bg-ink text-white" : "bg-surface ring-1 ring-inset ring-line-strong hover:ring-ink"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <Field label={v.type === "percent" ? "Percent" : "Amount"} error={err}>
            {v.type === "percent" ? (
              <PercentInput value={v.value} onChange={(value) => setV({ ...v, value })} autoFocus />
            ) : (
              <MoneyInput value={v.value} onChange={(value) => setV({ ...v, value })} autoFocus />
            )}
          </Field>
          <Field label="Reason" optional>
            <Input value={v.reason} maxLength={200} onChange={(x) => setV({ ...v, reason: x.target.value })} placeholder="e.g. Festive offer" />
          </Field>
          <Actions onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ShippingDialog({ open, value, onClose, onSave }) {
  const [v, setV] = useState({ name: "Standard delivery", price: "0" });
  const [e, setE] = useState({});
  useEffect(() => {
    if (open) {
      setE({});
      setV(value || { name: "Standard delivery", price: "0" });
    }
  }, [open, value]);

  function submit(ev) {
    ev.preventDefault();
    const err = {};
    if (!v.name.trim()) err.name = "Shipping name is required";
    if (toPaise(v.price || "0") === null) err.price = "Enter a price (0 = free)";
    setE(err);
    if (Object.keys(err).length) return;
    onSave({ name: v.name.trim(), price: v.price || "0" });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={value ? "Edit shipping" : "Add shipping"} description="Shipping is added to the total without GST.">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field label="Name" error={e.name}>
            <Input value={v.name} maxLength={100} onChange={(x) => setV({ ...v, name: x.target.value })} autoFocus />
          </Field>
          <Field label="Price" hint="0 means free shipping" error={e.price}>
            <MoneyInput value={v.price} onChange={(price) => setV({ ...v, price })} />
          </Field>
          <Actions onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
