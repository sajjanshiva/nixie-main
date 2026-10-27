// Home page: newest 8 gallery images.
import { Images } from "lucide-react";
import GalleryCard from "./GalleryCard";
import Button from "@/components/ui/Button";

export default function GalleryPreview({ images }) {
  return (
    <section id="inspiration" className="bg-mint">
      <div className="mx-auto max-w-[1320px] px-5 pt-8 pb-20 sm:px-8 lg:pt-12 lg:pb-28">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mb-14">
          <div className="max-w-xl">
            <h2 className="font-display text-[48px] leading-[0.98] sm:text-[60px] lg:text-[72px]">Looks to start from</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              Outfits we love. Open one to see the details, or ask us to make it for you.
            </p>
          </div>
          <Button href="/gallery" variant="outline" size="lg" className="self-start sm:self-auto">
            See all inspiration
          </Button>
        </div>

        {images && images.length > 0 ? (
          <div className="masonry">
            {images.map((img, i) => (
              <GalleryCard key={img.id} image={img} priority={i < 2} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-[8px] border border-line-strong px-6 py-16 text-center">
            <span className="mb-5 flex size-12 items-center justify-center rounded-[6px] bg-cyan-soft text-teal-deeper">
              <Images className="size-6" aria-hidden="true" />
            </span>
            <p className="font-display text-3xl">New looks are on their way</p>
            <p className="mt-2 max-w-sm text-[15px] text-muted">Have something in mind already? Upload it above for an estimate.</p>
          </div>
        )}
      </div>
    </section>
  );
}
