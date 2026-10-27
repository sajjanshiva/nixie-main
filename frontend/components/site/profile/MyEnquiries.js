"use client";
import Link from "next/link";
import { Inbox } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import IkImage from "@/components/ui/IkImage";
import { dateTime, rupees } from "@/lib/format";
import usePaged from "./usePaged";

export default function MyEnquiries() {
  const { items, loading, error, hasMore, loadMore } = usePaged("/me/leads", "leads");

  if (!loading && !error && items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No enquiries yet"
        text="Messages you send us from the contact form will appear here."
        action={<Button href="/contact">Contact us</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />
      {items.map((l) => {
        const img = l.analysis?.imageUrl || l.galleryImage?.imageUrl || l.photoUrl;
        return (
          <article key={l.id} className="flex gap-4 rounded-[24px] bg-surface p-4 ring-1 ring-line sm:gap-6 sm:p-5">
            {img ? (
              <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-cyan-soft sm:w-24">
                <IkImage src={img} alt="" fill sizes="96px" className="object-cover" />
              </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={l.type === "ai_analysis" ? "yellow" : "teal"}>{l.type === "ai_analysis" ? "AI analysis" : "General enquiry"}</Badge>
                <span className="text-[13px] text-muted">{dateTime(l.createdAt)}</span>
              </div>
              {l.analysis && (
                <p className="text-[16px] font-semibold">
                  {l.analysis.outfitType}<span className="block text-[14px] font-normal text-muted">Estimate {rupees(l.analysis.estimatedPrice)}</span>
                </p>
              )}
              {l.galleryImage && (
                <p className="text-[16px] font-semibold">
                  About{" "}
                  {l.galleryImage.slug ? (
                    <Link href={`/gallery/${l.galleryImage.slug}`} className="underline decoration-cyan decoration-2 underline-offset-4 hover:text-teal-deep">
                      {l.galleryImage.title}
                    </Link>
                  ) : (
                    l.galleryImage.title
                  )}
                </p>
              )}
              {l.message ? <p className="line-clamp-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{l.message}</p> : !l.analysis && !l.galleryImage && <p className="text-[15px] text-muted">No message</p>}
            </div>
          </article>
        );
      })}
      {loading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)}
      {hasMore && !loading && (
        <Button variant="outline" onClick={loadMore} className="self-center">
          Load more
        </Button>
      )}
    </div>
  );
}
