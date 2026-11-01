import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Briefcase, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Careers — Join the NIXIE Studio",
  description:
    "Explore open roles at Nixie. We are an all-women bespoke fashion studio in Nagpur reimagining personal and custom fashion.",
};

const OPEN_ROLES = [
  {
    title: "Fashion Designer",
    department: "Design & Construction",
    type: "Full-time · In-office",
    description:
      "Brings approved designs to life through precise construction, fit, and detailing, ensuring every outfit matches the intended vision and customer proportions.",
  },
  {
    title: "Operations Intern",
    department: "Studio Operations",
    type: "Full-time / Internship · In-office",
    description:
      "Supports day-to-day brand and production operations. From coordinating orders to managing sourcing timelines, ensures everything behind the scenes runs seamlessly.",
  },
  {
    title: "Video Editor & Content Creator",
    department: "Media & Brand",
    type: "Full-time · In-office",
    description:
      "Captures and crafts compelling reels and visual stories around our studio process, fittings, fabric debates, and client transformations for Instagram and digital media.",
  },
  {
    title: "Social Media Manager",
    department: "Brand & Community",
    type: "Full-time · In-office",
    description:
      "Shapes our voice online. Responsible for content planning, aesthetic storytelling, and community engagement that reflect Nixie's individuality and warmth.",
  },
  {
    title: "HR Executive",
    department: "People & Culture",
    type: "Full-time · In-office",
    description:
      "Handles recruitment, onboarding, and team well-being with care and precision, ensuring NIXIE grows with the right talent and a supportive, high-energy culture.",
  },
  {
    title: "Accountant",
    department: "Finance & Compliance",
    type: "Full-time · In-office",
    description:
      "Oversees studio finances, bookkeeping, vendor payments, GST filings, and compliance with accuracy and insight.",
  },
];

export default function CareersPage() {
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
              Careers at Nixie
            </span>
            <h1 className="font-display mt-2 text-[42px] leading-[1.05] text-ink sm:text-[54px] lg:text-[62px]">
              Be a part of NIXIE
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-muted sm:text-[18px]">
              Together, we&apos;re reimagining what fashion can be — personal, intentional, and timeless.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Culture & Studio Overview */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">Our Studio & Culture</h2>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                At Nixie, we&apos;re building a space where creativity feels natural, ideas flow easily, and everyone brings their own flavour to the table. Every outfit, every moodboard, and every tiny detail is imagined and brought to life in our Nagpur studio, where collaboration, coffee breaks, and fabric debates are all part of the process.
              </p>
              <p>
                All roles are <strong className="text-ink">full-time and in-office</strong> at our studio because custom fashion needs hands, eyes, and energy in one place. It&apos;s where you learn, create, experiment, and grow. We are an all-women team that hypes each other up while getting things done with precision.
              </p>
              <p>
                We value skill, curiosity, and commitment more than formal titles. If you&apos;re passionate about fashion, details, and the joy of creating something meaningful from scratch, you&apos;ll fit right in at Nixie.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-6 text-[14.5px] text-muted">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <MapPin className="size-4 text-teal-deep" />
                Nagpur Studio, Maharashtra
              </span>
              <span className="text-muted/40">•</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <Briefcase className="size-4 text-teal-deep" />
                In-Office & Full-Time
              </span>
            </div>
          </section>

          {/* Open Roles */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-[28px] text-ink sm:text-[34px]">Open Roles</h2>
                <p className="mt-1 text-[15px] text-muted">
                  Explore available opportunities to join our team in Nagpur.
                </p>
              </div>
              <span className="self-start rounded-full bg-mint px-3.5 py-1 text-[13px] font-semibold text-teal-deep">
                {OPEN_ROLES.length} Openings
              </span>
            </div>

            <div className="mt-8 grid gap-5">
              {OPEN_ROLES.map((role) => (
                <div
                  key={role.title}
                  className="group rounded-xl border border-line bg-mint/20 p-6 transition-all duration-200 hover:border-line-strong hover:bg-mint/40"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[18px] font-semibold text-ink sm:text-[19px]">
                        {role.title}
                      </h3>
                      <p className="text-[13.5px] font-medium text-teal-deep">
                        {role.department} · {role.type}
                      </p>
                    </div>
                    <a
                      href={`mailto:aishwarya@thenixie.in?subject=${encodeURIComponent(`Application: ${role.title} - [Your Name]`)}`}
                      className="inline-flex items-center gap-1.5 self-start rounded-[6px] bg-teal-deep px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-teal-deeper"
                    >
                      <Mail className="size-3.5" />
                      Apply for role
                    </a>
                  </div>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* A Day in the Studio & Application Note */}
          <section className="rounded-2xl border border-line bg-surface p-7 sm:p-10 lg:p-12">
            <h2 className="font-display text-[28px] text-ink sm:text-[34px]">A Day at Nixie</h2>
            <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                From morning mood boards to late-afternoon fittings, no two days are ever the same. It&apos;s fast-paced, fulfilling, and full of energy — the kind that comes from doing what you love with people who inspire you.
              </p>
              <p>
                We&apos;re growing, experimenting, and constantly creating. If this excites you, there&apos;s a place for you here at NIXIE!
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-line bg-mint/50 p-6">
              <h3 className="text-[17px] font-semibold text-ink">Built for a generation that believes in individuality</h3>
              <p className="mt-2 text-[14.5px] text-muted">
                Our studio is in Nagpur and we deliver custom outfits across India. (&apos;Cause distance has never stopped a good outfit from happening!)
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  href="mailto:aishwarya@thenixie.in?subject=Application%20at%20Nixie"
                  variant="primary"
                  size="md"
                >
                  <Mail className="size-4" />
                  Email your Portfolio / Resume
                </Button>
                <span className="text-[13px] text-muted">
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
