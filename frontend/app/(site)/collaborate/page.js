import Link from "next/link";
import { ArrowLeft, Mail, Sparkles, Camera, HeartHandshake } from "lucide-react";
import Button from "@/components/ui/Button";
import InstagramIcon from "@/components/ui/InstagramIcon";

export const metadata = {
  title: "Collaborate with Nixie — Brand & Creator Partnerships",
  description:
    "Partner with Nixie. We collaborate with fashion creators, stylists, photographers, and creatives across India for bespoke fashion.",
};

const COLLAB_TYPES = [
  {
    icon: Sparkles,
    title: "Content Creators & Influencers",
    description:
      "Showcase custom outfit transformations, styling reels, and honest reviews. We craft bespoke pieces made to your personal measurements and aesthetic.",
  },
  {
    icon: HeartHandshake,
    title: "Stylists & Fashion Directors",
    description:
      "Need a bespoke red carpet look, shoot outfit, or wedding piece? We turn your moodboards into reality with precision studio tailoring.",
  },
  {
    icon: Camera,
    title: "Photographers & Creative Directors",
    description:
      "Partner on conceptual fashion shoots, editorial campaigns, and aesthetic showcases celebrating slow, intentional fashion.",
  },
];

export default function CollaboratePage() {
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
              Partnerships & Creative Projects
            </span>
            <h1 className="font-display mt-2 text-[42px] leading-[1.05] text-ink sm:text-[54px] lg:text-[62px]">
              Collaborate with Nixie
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-muted sm:text-[18px]">
              We love partnering with stylists, content creators, photographers, and fellow fashion lovers who believe in intentional, personal fashion.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Partnership Categories */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">Ways We Work Together</h2>
            <p className="mt-2 text-[15px] text-muted">
              We look for genuine creative synergy, thoughtful aesthetics, and passion for craft.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {COLLAB_TYPES.map((collab) => {
                const Icon = collab.icon;
                return (
                  <div key={collab.title} className="rounded-xl border border-line bg-mint/20 p-5">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-mint text-teal-deep">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-[16.5px] font-semibold text-ink">
                      {collab.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                      {collab.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Why Partner with Nixie */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">Why Collaborate with Us</h2>
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                <strong className="text-ink">Truly Bespoke:</strong> We don&apos;t just send off-the-rack inventory. Every piece is drafted from scratch, tailored to your exact measurements, chosen neckline, preferred color, and silhouette.
              </p>
              <p>
                <strong className="text-ink">In-House Quality Control:</strong> Everything happens under one roof in our Nagpur studio — from pattern cutting to hand finishing and thread checks.
              </p>
              <p>
                <strong className="text-ink">Conscious Fashion:</strong> We believe in thoughtful design that lasts beyond fleeting trends, supporting zero-waste craftsmanship.
              </p>
            </div>
          </section>

          {/* Pitch Call to Action */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">How to Pitch a Collaboration</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              Have a concept in mind? Tell us about your idea, proposed timeline, audience, and links to your previous work.
            </p>

            <div className="mt-8 rounded-xl border border-line bg-mint/50 p-6 sm:p-8">
              <h3 className="text-[18px] font-semibold text-ink">Send Us a Proposal</h3>
              <p className="mt-1 text-[14.5px] text-muted">
                Email our founding team directly:
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Button
                  href="mailto:aishwarya@thenixie.in?subject=Collaboration%20Proposal%20-%20NIXIE"
                  variant="primary"
                  size="md"
                >
                  <Mail className="size-4" />
                  Email Collaboration Proposal
                </Button>
                <a
                  href="https://instagram.com/thenixie.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[8px] border border-line bg-surface px-4 py-2.5 text-[14.5px] font-medium text-ink transition hover:bg-mint hover:border-line-strong"
                >
                  <InstagramIcon className="size-4 text-teal-deep" />
                  DM on Instagram @thenixie.in
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
