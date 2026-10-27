"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";
import InstagramIcon from "@/components/ui/InstagramIcon";
import { useMeta } from "@/components/providers/MetaProvider";
import { QUICK_LINKS, TAGLINE } from "@/lib/content";

export default function Footer() {
  const { meta } = useMeta();
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pb-10 pt-16 sm:px-8 lg:grid-cols-[1.1fr_1.4fr] lg:pt-20">
        <div className="flex flex-col gap-6">
          <Link href="/" aria-label="Nixie home" className="self-start">
            <Logo tone="white" className="h-8 w-auto" />
          </Link>
          <p className="font-display max-w-sm text-[34px] leading-[1.05] text-white sm:text-[40px]">{TAGLINE}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={meta.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[6px] bg-white/10 px-4 py-2.5 text-[14.5px] font-medium text-white ring-1 ring-white/15 transition-all duration-200 hover:bg-cyan hover:text-ink hover:ring-cyan"
            >
              <InstagramIcon className="size-[18px]" />
              @thenixie.in
            </a>
            {meta.contactEmail && (
              <a
                href={`mailto:${meta.contactEmail}`}
                className="inline-flex items-center gap-2 rounded-[6px] bg-white/10 px-4 py-2.5 text-[14.5px] font-medium text-white ring-1 ring-white/15 transition-all duration-200 hover:bg-cyan hover:text-ink hover:ring-cyan"
              >
                <Mail className="size-[18px]" aria-hidden="true" />
                {meta.contactEmail}
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-cyan">Quick links</h2>
          {/* Pages for these come later (before going live), so they are not links yet. */}
          <ul className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3.5 sm:grid-cols-3">
            {QUICK_LINKS.map((l) => (
              <li key={l} className="text-[14.5px] text-white/80">
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="border-t border-white/10" aria-hidden="true" />
        <div className="flex flex-col gap-2 py-6 text-[13px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nixie. Made in Nagpur, delivered across India.</p>
          <p>Every outfit made from scratch, in-house.</p>
        </div>
      </div>
    </footer>
  );
}
