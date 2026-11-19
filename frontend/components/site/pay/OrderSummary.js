"use client";
// Right side of the checkout: items, discount, GST, shipping, total (locked; customer can't change it).
import { useState, useEffect } from "react";
import { Check, X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { paise } from "@/lib/format";

export default function OrderSummary({ invoice }) {
  const [activeImage, setActiveImage] = useState(null);
  const t = invoice.totals;
  const partly = t.paidPaise > 0 && t.balancePaise > 0;

  // Close lightbox on Escape key
  useEffect(() => {
    if (!activeImage) return;
    const onKey = (e) => {
      if (e.key === "Escape") setActiveImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeImage]);

  return (
    <>
      <div className="relative overflow-hidden rounded-[32px] bg-surface ring-1 ring-line">
        <div className="bg-teal px-6 py-5 sm:px-8">
          <h2 className="font-display text-[30px] leading-none text-white">Order summary</h2>
        </div>
        <div className="px-5 py-6 sm:px-8">
          <ul className="flex flex-col gap-4">
            {invoice.items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                  {it.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveImage({ url: it.imageUrl, name: it.name })}
                      className="group relative shrink-0 overflow-hidden rounded-[16px] border border-line bg-mint/30 shadow-xs transition-all duration-200 hover:scale-[1.03] hover:shadow-md hover:ring-2 hover:ring-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-deep cursor-pointer"
                      aria-label={`View larger photo of ${it.name}`}
                    >
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="size-20 sm:size-24 object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <ZoomIn className="size-5 text-white drop-shadow-sm" />
                      </div>
                    </button>
                  )}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[16px] font-semibold leading-snug break-words">{it.name}</p>
                    {it.note && (
                      <p className="mt-1 text-[13px] text-muted italic leading-relaxed break-words">
                        {it.note}
                      </p>
                    )}
                    <p className="mt-1 text-[13.5px] text-muted tabular-nums">
                      {it.quantity} × {paise(it.unitPricePaise)}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-[16px] font-semibold pt-0.5 tabular-nums">{paise(it.linePaise)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-2.5 border-t border-dashed border-line-strong pt-5 text-[15px]">
            <Line label="Subtotal" value={paise(t.subtotalPaise)} />
            {invoice.discount && t.discountPaise > 0 && (
              <Line label={`Discount${invoice.discount.reason ? ` (${invoice.discount.reason})` : ""}`} value={`−${paise(t.discountPaise)}`} accent />
            )}
            <Line label="GST" value={paise(t.gstPaise)} />
            {invoice.shipping && <Line label={invoice.shipping.name || "Shipping"} value={invoice.shipping.pricePaise ? paise(invoice.shipping.pricePaise) : "Free"} />}
          </dl>

          <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
            <div>
              <p className="text-[15px] font-semibold">Total</p>
              <p className="text-[13px] text-muted">Including taxes</p>
            </div>
            <p className="font-display text-[44px] leading-none tabular-nums">{paise(t.totalPaise)}</p>
          </div>

          {partly && (
            <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-mint p-4 text-[15px]">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-success">
                  <Check className="size-4" aria-hidden="true" />
                  Paid
                </span>
                <span className="tabular-nums">{paise(t.paidPaise)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Balance</span>
                <span className="tabular-nums">{paise(t.balancePaise)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen DP-style Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-5 pt-20 pb-8 backdrop-blur-md sm:p-10 sm:pt-24"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute right-5 top-5 z-20 flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 hover:scale-105 active:scale-95 sm:right-7 sm:top-7 cursor-pointer"
              aria-label="Close photo preview"
            >
              <X className="size-6" />
            </button>

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[82vh] max-w-[92vw] flex-col items-center my-auto"
            >
              <img
                src={activeImage.url}
                alt={activeImage.name || "Outfit photo"}
                className="max-h-[68vh] sm:max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/15"
              />
              {activeImage.name && (
                <p className="mt-4 text-center font-display text-[22px] font-semibold text-white drop-shadow-md">
                  {activeImage.name}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Line({ label, value, accent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-semibold text-teal-deep tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
