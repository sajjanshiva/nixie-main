"use client";
// Pinterest-style gallery: search + popular tags + masonry grid + infinite scroll.
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, X, ImageOff } from "lucide-react";
import GalleryCard from "@/components/site/GalleryCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 24;

export default function GalleryBrowser({ initialQuery, initialTag, initialImages, initialHasMore, initialFailed, tags }) {
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [images, setImages] = useState(initialImages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialFailed ? "We couldn’t load the gallery. Please try again." : "");
  const sentinel = useRef(null);
  const reqId = useRef(0);
  const firstRun = useRef(true);

  const fetchPage = useCallback(async (p, q, t) => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (q.trim()) qs.set("q", q.trim());
      if (t) qs.set("tag", t);
      const data = await api(`/gallery?${qs}`);
      if (id !== reqId.current) return; // a newer search started
      setImages((list) => (p === 1 ? data.images : [...list, ...data.images]));
      setHasMore(!!data.hasMore);
      setPage(p);
    } catch (e) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // New search / tag → reload from page 1 (debounced for typing) and keep the URL in sync
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (!initialFailed) return;
    }
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (tag) qs.set("tag", tag);
      // Update the address bar without reloading the page from the server
      window.history.replaceState(null, "", `${pathname}${qs.toString() ? `?${qs}` : ""}`);
      fetchPage(1, query, tag);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tag]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore && !error) fetchPage(page + 1, query, tag);
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, page, query, tag, error, fetchPage]);

  const searching = query.trim() || tag;

  return (
    <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-8 sm:px-8 lg:pt-14">
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-display text-[52px] leading-[0.95] sm:text-[72px] lg:text-[88px]">Inspiration</h1>
        <p className="max-w-lg text-[17px] leading-relaxed text-muted">
          Outfits we love. Open one for the details, or ask us to make it for you.
        </p>
      </div>

      <div className="sticky top-[72px] z-30 -mx-5 mt-8 bg-mint/90 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <label htmlFor="gallery-search" className="sr-only">
            Search the gallery
          </label>
          <input
            id="gallery-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lehenga, saree, bridal, red…"
            maxLength={100}
            className="h-12 w-full rounded-[8px] bg-surface pl-12 pr-12 text-[15px] ring-1 ring-line-strong outline-none transition placeholder:text-[#8aa0a1] focus:ring-2 focus:ring-teal-deep [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-[6px] text-muted hover:bg-mint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        {tags.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Popular tags">
            <TagChip active={!tag} onClick={() => setTag("")}>
              All
            </TagChip>
            {tags.map((t) => (
              <TagChip key={t.tag} active={tag === t.tag} onClick={() => setTag(tag === t.tag ? "" : t.tag)}>
                {t.tag}
              </TagChip>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6" aria-live="polite" aria-busy={loading}>
        {images.length > 0 ? (
          <div className="masonry">
            {images.map((img, i) => (
              <GalleryCard key={img.id} image={img} priority={i < 4} />
            ))}
          </div>
        ) : loading ? (
          <div className="masonry">
            {[320, 240, 380, 280, 260, 340, 300, 220].map((h, i) => (
              <Skeleton key={i} className="rounded-[20px]" style={{ height: h }} />
            ))}
          </div>
        ) : error ? null : (
          <EmptyState
            icon={ImageOff}
            title={searching ? "No looks match that" : "New looks are on their way"}
            text={searching ? "Try a different word, like the outfit type, colour or occasion." : "Check back soon, or upload your own inspiration for an estimate."}
            action={
              searching ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setTag("");
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Button href="/#estimate">Get an estimate</Button>
              )
            }
          />
        )}

        {error && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-[15px] text-danger">{error}</p>
            <Button variant="outline" onClick={() => fetchPage(images.length ? page + 1 : 1, query, tag)}>
              Try again
            </Button>
          </div>
        )}

        <div ref={sentinel} className="flex h-20 items-center justify-center">
          {loading && images.length > 0 && <Spinner className="size-6 text-teal-deep" />}
        </div>
      </div>
    </div>
  );
}

function TagChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-[6px] px-3.5 text-[14px] font-medium capitalize tracking-[0.01em] transition-all duration-150",
        active
          ? "bg-ink text-white font-semibold shadow-sm"
          : "bg-surface text-ink ring-1 ring-inset ring-line hover:ring-ink hover:text-teal-deep"
      )}
    >
      {children}
    </button>
  );
}
