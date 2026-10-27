// One image in the Pinterest-style grid.
import Link from "next/link";
import IkImage from "@/components/ui/IkImage";

export default function GalleryCard({ image, priority = false }) {
  const w = image.width || 900;
  const h = image.height || 1200;
  return (
    <Link href={`/gallery/${image.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[8px] bg-cyan-soft ring-1 ring-black/5" style={{ aspectRatio: `${w} / ${h}` }}>
        <IkImage
          src={image.imageUrl}
          alt={image.title}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 hidden items-end bg-gradient-to-t from-ink/70 via-ink/0 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
          <p className="text-[15px] font-semibold leading-snug text-white">{image.title}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 px-1 text-[14px] text-ink md:hidden">{image.title}</p>
    </Link>
  );
}
