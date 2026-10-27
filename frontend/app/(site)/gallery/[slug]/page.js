import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GalleryCard from "@/components/site/GalleryCard";
import GalleryActions from "@/components/site/gallery/GalleryActions";
import IkImage from "@/components/ui/IkImage";
import { serverGet } from "@/lib/serverApi";

async function load(slug) {
  const data = await serverGet(`/gallery/${encodeURIComponent(slug)}`, { revalidate: 60 });
  if (data?.__status === 404) return { missing: true };
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data?.image) return { title: "Inspiration" };
  const { image } = data;
  const description = image.description || `${image.title}: an outfit Nixie can make for you, from scratch.`;
  return {
    title: image.title,
    description,
    alternates: { canonical: `/gallery/${image.slug}` },
    openGraph: {
      title: `${image.title} | Nixie`,
      description,
      images: [{ url: `${image.imageUrl}?tr=w-1200,q-80`, width: 1200, alt: image.title }],
    },
    twitter: { card: "summary_large_image", title: image.title, description },
  };
}

export default async function GalleryImagePage({ params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (data?.missing) notFound();
  if (!data?.image) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-5xl">We couldn’t load this look</h1>
        <p className="mt-3 text-muted">Please refresh the page in a moment.</p>
      </div>
    );
  }
  const { image, moreLikeThis = [] } = data;
  const w = image.width || 900;
  const h = image.height || 1200;

  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-6 sm:px-8 lg:pt-10">
      <Link href="/gallery" className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All inspiration
      </Link>

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[32px] bg-cyan-soft" style={{ aspectRatio: `${w} / ${h}` }}>
          <IkImage
            src={image.imageUrl}
            alt={image.title}
            fill
            priority
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <h1 className="font-display text-[48px] leading-[0.98] sm:text-[64px]">{image.title}</h1>
          {image.description && <p className="max-w-prose whitespace-pre-line text-[17px] leading-relaxed text-muted">{image.description}</p>}
          {image.tags?.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {image.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/gallery?tag=${encodeURIComponent(t)}`}
                    className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-[14px] font-semibold capitalize ring-1 ring-inset ring-line transition hover:bg-cyan-soft hover:ring-teal"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <GalleryActions slug={image.slug} title={image.title} />
          <p className="rounded-2xl bg-yellow-soft px-4 py-3 text-[14px] leading-relaxed">
            Every Nixie outfit is made from scratch, so you can change the colour, neckline, sleeves or length.
          </p>
        </div>
      </div>

      {moreLikeThis.length > 0 && (
        <section className="mt-20 lg:mt-28" aria-labelledby="more-like-this">
          <h2 id="more-like-this" className="font-display mb-8 text-[40px] leading-none sm:text-[52px]">
            More like this
          </h2>
          <div className="masonry">
            {moreLikeThis.map((img) => (
              <GalleryCard key={img.id} image={img} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
