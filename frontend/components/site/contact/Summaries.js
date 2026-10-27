import Link from "next/link";
import IkImage from "@/components/ui/IkImage";
import { rupees } from "@/lib/format";
import { ESTIMATE_NOTE } from "@/lib/content";

export function AnalysisSummary({ analysis }) {
  const fabrics = [analysis.primaryFabric, ...(analysis.secondaryFabrics || [])].filter(Boolean).join(", ");
  return (
    <div className="rounded-[28px] bg-surface p-4 ring-1 ring-line sm:p-5">
      <div className="flex gap-4 sm:gap-5">
        <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-cyan-soft sm:w-28">
          <IkImage src={analysis.imageUrl} alt={analysis.outfitType} fill sizes="112px" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <p className="text-[13px] font-semibold text-teal-deep">Your estimate</p>
          <p className="font-display text-[40px] leading-none">{rupees(analysis.estimatedPrice)}</p>
          <p className="mt-1 text-[15px] font-semibold">{analysis.outfitType}</p>
          <p className="text-[14px] text-muted">{fabrics}</p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-yellow-soft px-3.5 py-2.5 text-[13px] leading-relaxed">{ESTIMATE_NOTE}</p>
    </div>
  );
}

export function GallerySummary({ image }) {
  return (
    <Link href={`/gallery/${image.slug}`} className="group flex gap-4 rounded-[28px] bg-surface p-4 ring-1 ring-line transition hover:ring-line-strong sm:gap-5 sm:p-5">
      <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-cyan-soft sm:w-28">
        <IkImage src={image.imageUrl} alt={image.title} fill sizes="112px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        <p className="text-[13px] font-semibold text-teal-deep">From our inspiration gallery</p>
        <p className="font-display text-[28px] leading-tight group-hover:text-teal-deep">{image.title}</p>
        {image.tags?.length > 0 && <p className="line-clamp-1 text-[14px] text-muted">{image.tags.slice(0, 4).join(", ")}</p>}
      </div>
    </Link>
  );
}
