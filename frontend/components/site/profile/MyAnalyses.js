"use client";
import Link from "next/link";
import { Images } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import IkImage from "@/components/ui/IkImage";
import { date, rupees } from "@/lib/format";
import usePaged from "./usePaged";

export default function MyAnalyses() {
  const { items, loading, error, hasMore, loadMore } = usePaged("/me/analyses", "analyses");

  if (!loading && !error && items.length === 0) {
    return (
      <EmptyState
        icon={Images}
        title="No estimates yet"
        text="Upload a photo of an outfit you love and your estimates will be saved here."
        action={<Button href="/#estimate">Get an estimate</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <FormError message={error} />
      <ul className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {items.map((a) => (
          <li key={a.id}>
            <Link href={`/analysis/${a.id}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-cyan-soft">
                <IkImage src={a.imageUrl} alt={a.outfitType} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1.5 text-[14px] font-semibold">{rupees(a.estimatedPrice)}</span>
              </div>
              <p className="mt-2.5 line-clamp-1 text-[15px] font-semibold group-hover:text-teal-deep">{a.outfitType}</p>
              <p className="text-[13px] text-muted">{date(a.createdAt)}</p>
            </Link>
          </li>
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={`s${i}`}>
              <Skeleton className="aspect-[3/4] rounded-[22px]" />
              <Skeleton className="mt-2.5 h-4 w-3/4 rounded-full" />
            </li>
          ))}
      </ul>
      {hasMore && !loading && (
        <Button variant="outline" onClick={loadMore} className="self-center">
          Load more
        </Button>
      )}
    </div>
  );
}
