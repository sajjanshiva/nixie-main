import GalleryBrowser from "@/components/site/gallery/GalleryBrowser";
import { serverGet } from "@/lib/serverApi";

export const metadata = {
  title: "Inspiration gallery",
  description: "Browse outfits we love: bridal, party wear, lehengas, sarees and more. Find a look and ask Nixie to make it for you.",
};

export default async function GalleryPage({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp?.q === "string" ? sp.q.slice(0, 100) : "";
  const tag = typeof sp?.tag === "string" ? sp.tag.slice(0, 40) : "";
  const qs = new URLSearchParams({ page: "1", limit: "24", ...(q ? { q } : {}), ...(tag ? { tag } : {}) });
  const [list, tags] = await Promise.all([serverGet(`/gallery?${qs}`, { revalidate: 60 }), serverGet("/gallery/tags", { revalidate: 300 })]);

  return (
    <GalleryBrowser
      initialQuery={q}
      initialTag={tag}
      initialImages={Array.isArray(list?.images) ? list.images : []}
      initialHasMore={!!list?.hasMore}
      initialFailed={!list || !!list.__status}
      tags={Array.isArray(tags?.tags) ? tags.tags : []}
    />
  );
}
