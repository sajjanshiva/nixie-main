import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PolicyShell({ title, subtitle, lastUpdated, children }) {
  return (
    <div className="bg-mint py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[860px] px-5 sm:px-8">
        <div className="mb-8 flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-[6px] px-2.5 py-1 text-[13.5px] font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-teal-deep">
              Nixie Studio Policy
            </span>
            <h1 className="font-display mt-2 text-[38px] leading-[1.08] text-ink sm:text-[48px] lg:text-[54px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-[16px] leading-relaxed text-muted sm:text-[17px]">
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <p className="mt-2 text-[13px] text-muted/80">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>

        <article className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10 lg:p-12">
          <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed text-ink sm:text-[15.5px]">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
