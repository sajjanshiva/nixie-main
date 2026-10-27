// Closing call to action in Primary 2 (cyan).
import Button from "@/components/ui/Button";

export default function CtaBand() {
  return (
    <section className="bg-mint px-5 py-20 sm:px-8 lg:py-28">
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[10px] bg-cyan px-7 py-14 sm:px-14 lg:py-20">
        <svg aria-hidden="true" viewBox="0 0 400 400" className="pointer-events-none absolute -bottom-32 -right-24 size-[420px] text-teal/30" fill="none">
          <path d="M40 360 C 120 120, 280 120, 360 40" stroke="currentColor" strokeWidth="2" />
          <circle cx="360" cy="40" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display max-w-[16ch] text-[44px] leading-[0.98] text-ink sm:text-[60px] lg:text-[72px]">
            Saved a look you keep going back to?
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/#estimate" variant="dark" size="lg">
              Get my estimate
            </Button>
            <Button href="/contact" variant="light" size="lg">
              Talk to us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
