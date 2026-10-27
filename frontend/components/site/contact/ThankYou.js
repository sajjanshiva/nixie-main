"use client";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { WHAT_HAPPENS_NEXT } from "@/lib/content";
import { firstName } from "@/lib/format";

export default function ThankYou({ lead }) {
  const name = firstName(lead?.name);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-3xl flex-col items-center text-center"
      role="status"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="flex size-20 items-center justify-center rounded-full bg-cyan"
      >
        <Check className="size-9" strokeWidth={2.5} aria-hidden="true" />
      </motion.span>
      <h1 className="font-display mt-8 text-[48px] leading-[0.98] sm:text-[64px]">
        Thank you{name ? `, ${name}` : ""}. We’ve got your enquiry.
      </h1>
      <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">You can see it any time under My enquiries in your profile.</p>

      <div className="mt-12 w-full rounded-[32px] bg-teal p-6 text-left sm:p-10">
        <h2 className="font-display text-[34px] text-white sm:text-[40px]">What happens next</h2>
        <ol className="relative mt-8 flex flex-col gap-8">
          {WHAT_HAPPENS_NEXT.map((s, i) => (
            <li key={s.title} className="relative grid grid-cols-[44px_1fr] gap-5">
              {i < WHAT_HAPPENS_NEXT.length - 1 && (
                <span className="stitch-y absolute -bottom-8 left-[21px] top-11 text-white/60" aria-hidden="true" />
              )}
              <span className="relative z-10 flex size-11 items-center justify-center rounded-full bg-cyan font-display text-[22px] ring-[5px] ring-teal">
                {i + 1}
              </span>
              <div className="pt-1">
                <h3 className="text-[18px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-[15.5px] leading-relaxed text-ink/85">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button href="/profile?tab=enquiries" size="lg">
          See my enquiries
        </Button>
        <Button href="/" size="lg" variant="outline">
          Back to home
        </Button>
      </div>
    </motion.div>
  );
}
