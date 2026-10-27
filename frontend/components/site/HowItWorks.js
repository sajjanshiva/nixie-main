// "How Nixie works" — High-Fashion Couture Atelier Redesign
import { HOW_IT_WORKS } from "@/lib/content";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const ATELIER_STEPS = [
  {
    step: "01",
    tag: "ARCHIVE // INSPIRATION",
    title: "Show Us The Look",
    text: "A red carpet moment, a runway snapshot, or a Pinterest moodboard. Upload your reference and our AI instantly decodes the silhouette, cut, and fabrication.",
    meta: "AI Pattern & Fabric Analysis",
    theme: "bg-surface text-ink ring-1 ring-line-strong hover:ring-teal-deep",
    tagStyle: "text-teal-deep bg-teal/8",
    numStyle: "text-teal/10",
  },
  {
    step: "02",
    tag: "ATELIER // BESPOKE CUT",
    title: "Make It Yours",
    text: "Customize the neckline, drape, sleeve volume, or silk weight. Our atelier design team consults with you one-on-one before any fabric is touched or scissors are drawn.",
    meta: "Bespoke Measurement Tailoring",
    theme: "bg-ink text-white ring-1 ring-black/40 shadow-[0_16px_40px_rgba(0,0,0,0.2)]",
    tagStyle: "text-cyan bg-white/10",
    numStyle: "text-white/10",
  },
  {
    step: "03",
    tag: "CRAFT // DOORSTEP DELIVERY",
    title: "Handcrafted From Scratch",
    text: "Pattern drafting, fabric selection, hand-tailoring, and couture finishing — all created in-house in our private atelier and delivered made-to-measure across India.",
    meta: "In-House Master Tailoring",
    theme: "bg-surface text-ink ring-1 ring-line-strong hover:ring-teal-deep",
    tagStyle: "text-teal-deep bg-teal/8",
    numStyle: "text-teal/10",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-mint border-t border-line/60">
      <div className="mx-auto max-w-[1320px] px-5 pt-16 pb-8 sm:px-8 lg:pt-20 lg:pb-10">
        
        {/* Editorial Section Header */}
        <div className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-[4px] bg-ink/5 px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-teal-deep">
              <span className="size-1.5 rounded-[1px] bg-teal" aria-hidden="true" />
              The Bespoke Atelier
            </div>
            <h2 className="font-display text-[46px] leading-[0.94] tracking-[-0.02em] text-ink sm:text-[62px] lg:text-[76px]">
              From a saved photo <br />
              <span className="italic text-teal-deep">to your custom wardrobe.</span>
            </h2>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end lg:text-right">
            <p className="max-w-sm text-[16.5px] leading-relaxed text-muted lg:max-w-[320px]">
              No standard sizing. No generic reproductions. You stay in command of every detail from inspiration to fitting.
            </p>
            <Button href="/#estimate" variant="primary" size="lg">
              Get my estimate
            </Button>
          </div>
        </div>

        {/* 3 High-Fashion Atelier Cards */}
        <div className="grid gap-6 sm:grid-cols-3 lg:gap-7">
          {ATELIER_STEPS.map((s) => (
            <div
              key={s.step}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-[8px] p-7 transition-all duration-300 ease-out sm:p-8",
                "hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)]",
                s.theme
              )}
            >
              {/* Giant Ghosted Numeral in Background */}
              <span
                className={cn(
                  "font-display pointer-events-none absolute right-4 top-2 select-none text-[100px] leading-none transition-transform duration-500 group-hover:scale-105",
                  s.numStyle
                )}
                aria-hidden="true"
              >
                {s.step}
              </span>

              {/* Card Header & Content */}
              <div className="relative z-10">
                <span
                  className={cn(
                    "mb-6 inline-block rounded-[4px] px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em]",
                    s.tagStyle
                  )}
                >
                  {s.tag}
                </span>

                <h3 className="font-display text-[30px] leading-tight sm:text-[34px]">{s.title}</h3>
                <p className="mt-3.5 text-[15px] leading-relaxed opacity-85">{s.text}</p>
              </div>

              {/* Card Footer Meta */}
              <div className="relative z-10 mt-8 border-t border-current/15 pt-4">
                <p className="text-[12.5px] font-medium tracking-[0.03em] uppercase opacity-75">
                  {s.meta}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Atelier Guarantee Bar */}
        <div className="mt-12 border-t border-line pt-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { num: "01", title: "100% In-House Atelier", desc: "Crafted by master tailors in our private workshop" },
              { num: "02", title: "Couture Measurements", desc: "Patterned specifically to your unique proportions" },
              { num: "03", title: "Pan-India Delivery", desc: "Delivered straight to your doorstep ready to wear" },
            ].map((item) => (
              <div key={item.title} className="flex items-baseline gap-3.5">
                <span className="font-mono text-[12px] font-bold text-teal-deep">{item.num}</span>
                <div>
                  <h4 className="text-[14px] font-semibold tracking-[0.01em] text-ink">{item.title}</h4>
                  <p className="mt-0.5 text-[13px] text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
