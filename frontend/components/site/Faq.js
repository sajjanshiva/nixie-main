"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { FAQS } from "@/lib/content";
import { cn } from "@/lib/cn";

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faqs" className="bg-mint">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20 lg:py-28">
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-[48px] leading-[0.98] sm:text-[60px] lg:text-[72px]">Questions, answered</h2>
          <p className="max-w-sm text-[17px] leading-relaxed text-muted">
            Can’t find what you’re looking for? Write to us and we’ll get back to you.
          </p>
          <Button href="/contact" variant="dark" size="lg">
            Ask us anything
          </Button>
        </div>

        <ul className="border-t border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    className="group flex w-full items-start justify-between gap-6 py-6 text-left"
                  >
                    <span className={cn("text-[18px] font-semibold leading-snug transition-colors sm:text-[19px]", isOpen ? "text-teal-deep" : "group-hover:text-teal-deep")}>
                      {f.q}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[4px] transition-all duration-300",
                        isOpen ? "rotate-45 bg-cyan text-ink" : "bg-white text-ink group-hover:bg-cyan-soft"
                      )}
                      aria-hidden="true"
                    >
                      <Plus className="size-4" />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-${i}`}
                  role="region"
                  className={cn("grid transition-[grid-template-rows] duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[62ch] pb-7 pr-12 text-[16px] leading-relaxed text-muted">{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
