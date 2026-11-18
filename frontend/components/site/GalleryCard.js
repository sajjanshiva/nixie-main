// One outfit item in the gallery: clean PNG look with title & category below
import Link from "next/link";
import IkImage from "@/components/ui/IkImage";

export default function GalleryCard({ image, priority = false }) {
  const w = image.width || 900;
  const h = image.height || 1200;

  // Determine category or first tag for display on right
  const categoryLabel =
    (image.tags || []).find((t) =>
      ["bollywood", "party/concert", "wedding guest", "sarees", "festive", "gothic"].includes(t.toLowerCase())
    ) || (image.tags && image.tags[0]) || "";

  // Badge logic (handwritten Atelier accent)
  const isPopular = (image.tags || []).some((t) => ["popular", "trending", "bridal", "bollywood"].includes(t.toLowerCase()));
  const isNew = (image.tags || []).some((t) => ["new", "latest"].includes(t.toLowerCase()));

  return (
    <Link href={`/gallery/${image.slug}`} className="group block mb-6 break-inside-avoid">
      <div
        className="relative overflow-hidden rounded-[16px] bg-white/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(13,74,78,0.12)]"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <IkImage
          src={image.imageUrl}
          alt={image.title}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />

        {/* Handwritten Tag Pill */}
        {(isPopular || isNew) && (
          <div className="absolute top-3 right-3 z-10">
            <span className="font-hand inline-flex items-center gap-1 rounded-full bg-[#ffc43a] px-2.5 py-0.5 text-[14px] font-bold text-black shadow-xs">
              <span className="size-1 rounded-full bg-black/40" />
              {isPopular ? "popular" : "new"}
            </span>
          </div>
        )}
      </div>

      {/* Label underneath */}
      <div className="mt-2.5 flex items-baseline justify-between px-1 gap-2">
        <p className="font-bold text-[15px] sm:text-[16px] text-ink leading-snug line-clamp-1 group-hover:text-teal-deep transition-colors">
          {image.title}
        </p>
        {categoryLabel && (
          <span className="text-[12.5px] font-medium text-muted capitalize shrink-0">
            {categoryLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
