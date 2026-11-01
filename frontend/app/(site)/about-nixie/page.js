import Link from "next/link";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "About Nixie — Custom outfits, made from your inspiration",
  description:
    "How Nixie started, what we believe, and how our all-women studio in Nagpur crafts custom outfits tailored to your comfort and body.",
};

export default function AboutPage() {
  return (
    <div className="bg-mint py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[920px] px-5 sm:px-8">
        {/* Navigation & Header */}
        <div className="mb-10 flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-[6px] px-2.5 py-1 text-[13.5px] font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-teal-deep">
              Our Story & Philosophy
            </span>
            <h1 className="font-display mt-2 text-[42px] leading-[1.05] text-ink sm:text-[54px] lg:text-[62px]">
              About Nixie
            </h1>
            <p className="font-display mt-3 text-[22px] italic text-teal-deep sm:text-[26px]">
              &ldquo;&apos;Cause your dream outfit should not be stuck on your Pinterest board!&rdquo;
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="space-y-10">
          {/* Section 1: How it all started */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">How it all started</h2>
            <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                Nixie began with a very real problem. We kept seeing outfits on celebrities, Pinterest, and Instagram
                that made us go <strong className="text-ink">&ldquo;I want this&rdquo;</strong>.
              </p>
              <p>
                The truth is, most celebrity outfits are custom made, not sold anywhere, and usually far from a normal budget.
                And honestly, something that looks perfect on a celebrity may not feel as great on your body, your height, or your comfort!
              </p>
              <p>
                So we created <strong className="text-ink">Nixie</strong> — a studio where you can bring any inspiration and actually wear it, in a version that suits you!
              </p>
            </div>
          </section>

          {/* Section 2: What we actually do here */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">What we actually do here</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              You show us the outfit you fell in love with.
            </p>
            <p className="mt-3 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              We study the vibe, choose the right fabrics, fix the tiny details that never show in photos, and figure out what will actually work for your body. Then we make the entire outfit from scratch! Your structure, your comfort, your proportions.
            </p>

            <div className="mt-6 rounded-xl border border-line bg-mint/50 p-6 sm:p-8">
              <p className="text-[17px] font-semibold text-teal-deep sm:text-[19px]">
                The final look gives you about an 80 percent match to the inspiration and a 100 percent match to you.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[14.5px] font-medium text-ink">
                <span className="rounded-full bg-surface px-3.5 py-1.5 shadow-sm">Not a copy</span>
                <span className="text-muted/40">•</span>
                <span className="rounded-full bg-surface px-3.5 py-1.5 shadow-sm">Not a costume</span>
                <span className="text-muted/40">•</span>
                <span className="rounded-full bg-teal-deep text-white px-3.5 py-1.5">Just your version of the look</span>
              </div>
            </div>
          </section>

          {/* Section 3: The team */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">The girls who make it happen</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              What started as a small idea grew into a custom fashion space run by an <strong className="text-ink">all-women team</strong> that loves clothes, loves details, and loves making people feel good in what they wear! That is the heart of Nixie.
            </p>
            <p className="mt-3 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              Every outfit, moodboard, and stitch happens right inside our studio in Nagpur, Maharashtra, and we deliver custom creations to doorsteps across India.
            </p>
            <div className="mt-6">
              <Button href="/careers" variant="outline" size="md">
                We&apos;re Hiring — Explore Careers
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>

          {/* Section 4: How your outfit comes to life */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">How your outfit comes to life</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-mint/20 p-5">
                <span className="font-display text-[28px] text-teal-deep">01</span>
                <h3 className="mt-2 text-[16px] font-semibold text-ink">You share your inspiration</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  A screenshot, a Pinterest pin, a celebrity moment. We get the vibe instantly!
                </p>
              </div>

              <div className="rounded-xl border border-line bg-mint/20 p-5">
                <span className="font-display text-[28px] text-teal-deep">02</span>
                <h3 className="mt-2 text-[16px] font-semibold text-ink">You make it yours</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  Pick your colour, change the neckline, add sleeves, or adjust the length. You get to play designer!
                </p>
              </div>

              <div className="rounded-xl border border-line bg-mint/20 p-5">
                <span className="font-display text-[28px] text-teal-deep">03</span>
                <h3 className="mt-2 text-[16px] font-semibold text-ink">We create it</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  Patterns, fabrics, stitching, finishing. All done from scratch, all in-house, all with care. Then we deliver a clean precision fit.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
              <p className="text-[15px] font-medium text-muted">
                We keep it simple, guided, and actually enjoyable.
              </p>
              <Button href="/#estimate" variant="primary" size="md">
                <Sparkles className="size-4" />
                Start Customising
              </Button>
            </div>
          </section>

          {/* Section 5: What we believe */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">What we believe</h2>
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <div className="border-l-2 border-teal-deep pl-4">
                <p className="font-semibold text-ink">Fashion should feel personal.</p>
                <p className="mt-1">Custom should feel exciting.</p>
              </div>
              <p>
                Every Nixie outfit is created with intention, clean finishing, and a balance of good fabric, good fit, and thoughtful detailing.
              </p>
              <p>
                We want you to feel confident wearing a look you once admired from afar.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
