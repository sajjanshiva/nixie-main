import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export const metadata = {
  title: "Careers — Join the NIXIE Studio",
  description:
    "Explore open roles at Nixie. We are an all-women bespoke fashion studio in Bangalore reimagining personal and custom fashion.",
};

const OPEN_ROLES = [
  {
    title: "Fashion Designer",
    description:
      "Brings approved designs to life through precise construction, fit and detailing, ensuring every outfit matches the intended vision.",
  },
  {
    title: "Operations Intern",
    description:
      "Supports day-to-day brand and production operations. From coordinating orders to managing timelines, ensures everything behind the scenes runs seamlessly.",
  },
  {
    title: "Video Editor",
    description:
      "Captures and crafts compelling visual stories around our studio process, fittings, and outfit transformations for digital and social media.",
  },
  {
    title: "Social Media Manager",
    description:
      "Shapes our voice online. Responsible for content planning, storytelling, and community engagement that reflect the brand’s aesthetic and individuality.",
  },
  {
    title: "HR Executive",
    description:
      "Handles recruitment, onboarding, and team well-being with care and precision, ensuring NIXIE grows with the right people and a strong, positive culture.",
  },
  {
    title: "Accountant",
    description:
      "Oversees finances, bookkeeping, tax filings, and compliance with accuracy and insight.",
  },
];

const TEAM_IMAGES = [
  { src: "/images/careers/fashion-designer.png", alt: "Design Team" },
  { src: "/images/careers/operations-intern.png", alt: "Operations Team" },
  { src: "/images/careers/video-editor.png", alt: "Media Team" },
  { src: "/images/careers/social-media.png", alt: "Social & Community Team" },
  { src: "/images/careers/hr-executive.png", alt: "People & Culture Team" },
  { src: "/images/careers/accountant.png", alt: "Finance Team" },
];

export default function CareersPage() {
  return (
    <div className="bg-mint py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        {/* Navigation */}
        <div className="mb-8 flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-[6px] px-2.5 py-1 text-[13.5px] font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>

        {/* Hero Visual Banner */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
          <img
            src="/images/careers/banner.png"
            alt="Be a part of Nixie"
            className="w-full h-auto object-cover max-h-[380px]"
          />
        </div>

        <div className="space-y-10">
          {/* Culture & Studio Overview */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-teal-deep">
              Careers at Nixie
            </span>
            <h1 className="font-display mt-2 text-[38px] leading-[1.08] text-ink sm:text-[48px] lg:text-[56px] font-bold">
              Be a part of NIXIE
            </h1>
            <p className="mt-3 text-[17px] font-medium text-teal-deep sm:text-[18px]">
              Together, we&apos;re reimagining what fashion can be - personal, intentional and timeless.
            </p>

            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                At Nixie, we&apos;re building a space where creativity feels natural, ideas flow easily and everyone brings their own flavour to the table. Every outfit, every moodboard and every tiny detail is imagined and brought to life in our Bangalore studio, where collaboration, coffee breaks and fabric debates are all part of the process.
              </p>
              <p>
                All roles are full-time and in-office at our studio because custom fashion needs hands, eyes and energy in one place. It&apos;s where you learn, create, experiment and grow. We are an all women team that hypes each other up while getting things done with precision.
              </p>
              <p>
                We value skill, curiosity and commitment more than formal titles. If you&apos;re passionate about fashion, details and the joy of creating something meaningful from scratch, you&apos;ll fit right in at Nixie.
              </p>
            </div>
          </section>

          {/* Open Roles: Clean text-only cards */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[30px] font-bold text-ink sm:text-[36px]">Open Roles</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPEN_ROLES.map((role) => (
                <div
                  key={role.title}
                  className="flex flex-col justify-between rounded-2xl border border-line bg-white/70 p-6 transition-all duration-200 hover:border-line-strong hover:bg-white hover:shadow-xs"
                >
                  <div>
                    <h3 className="font-display text-[22px] font-bold text-ink">
                      {role.title}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Meet The Team: The 6 illustrations */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[30px] font-bold text-ink sm:text-[36px]">
              Meet The Team
            </h2>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
              {TEAM_IMAGES.map((item, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-line bg-white/60 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* A Day at Nixie & Application Callout */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] font-bold text-ink sm:text-[34px]">A Day at Nixie</h2>
            <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                From morning mood boards to late-afternoon fittings, no two days are ever the same. It&apos;s fast-paced, fulfilling, and full of energy, the kind that comes from doing what you love with people who inspire you.
              </p>
              <p>
                We&apos;re growing, experimenting, and constantly creating. If this excites you, there&apos;s a place for you here at NIXIE!
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-line bg-mint/50 p-6 sm:p-7">
              <h3 className="text-[17px] font-semibold text-ink">Built for a generation that believes in individuality</h3>
              <p className="mt-2 text-[14.5px] text-muted">
                Our studio is in Bangalore and we deliver custom outfits across India.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <a
                  href="mailto:aishwarya@thenixie.in?subject=Application%20at%20Nixie"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-deep px-5 py-3 text-[14.5px] font-semibold text-white shadow-xs transition hover:bg-teal-deeper"
                >
                  <Mail className="size-4" />
                  Email your Portfolio / Resume
                </a>
                <span className="text-[13.5px] text-muted">
                  Send to: <strong className="text-ink">aishwarya@thenixie.in</strong>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
