"use client";
import { useState } from "react";
import Link from "next/link";
import { FAQS } from "@/lib/content";
import { cn } from "@/lib/cn";

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faqs" className="bg-mint py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[960px] px-5 sm:px-8">

        {/* Centered heading */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="font-display text-[40px] leading-[1.05] tracking-tight text-ink sm:text-[52px] lg:text-[58px] font-bold">
            Good to know
          </h2>
          <p className="mt-3 text-[16px] sm:text-[17px] text-muted">
            Can&apos;t find your answer?{" "}
            <Link
              href="/contact"
              className="font-semibold text-teal-deep underline underline-offset-4 hover:text-teal-deeper transition-colors"
            >
              Message us
            </Link>
          </p>
        </div>

        {/* Accordion — hover to reveal, no button, dashed stitch dividers */}
        <ul>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li
                key={f.q}
                className={cn(
                  "border-b border-dashed transition-colors duration-200",
                  isOpen ? "border-teal/40" : "border-black/10"
                )}
                onMouseEnter={() => setOpen(i)}
              >
                <div className="py-5 sm:py-6">
                  <p
                    className={cn(
                      "text-[17px] sm:text-[19px] font-semibold leading-snug transition-colors duration-200 cursor-default select-none",
                      isOpen ? "text-teal-deep" : "text-ink"
                    )}
                  >
                    {f.q}
                  </p>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pt-2 pb-1 text-[15.5px] sm:text-[16px] leading-relaxed text-muted max-w-[75ch]">
                        {f.a}
                      </p>
                    </div>
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
