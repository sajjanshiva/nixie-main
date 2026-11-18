// Sleek single-line CTA band: text on left, button directly next to it
import Button from "@/components/ui/Button";

export default function CtaBand() {
  return (
    <section className="bg-mint px-5 py-8 sm:px-8 sm:py-10">
      <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[24px] bg-[#155f64] px-6 py-6 sm:px-10 sm:py-7 shadow-[0_12px_36px_rgba(21,95,100,0.3)]">
        {/* Atelier dashed border trim */}
        <div className="pointer-events-none absolute inset-2 rounded-[18px] border-1.5 border-dashed border-[#fffcf0]/30" />

        <div className="relative flex flex-col items-center justify-between gap-5 sm:flex-row text-center sm:text-left">
          <p className="font-display text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[#fffcf0] tracking-tight leading-tight">
            Your dream outfit is one photo away.
          </p>

          <Button
            href="/#estimate"
            variant="accent"
            size="lg"
            className="shrink-0"
          >
            Get my estimate
          </Button>
        </div>
      </div>
    </section>
  );
}
