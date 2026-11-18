"use client";
// Gallery Browser: Curated Categories + Shuffling Search + Masonry Grid
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

const CORE_CATEGORIES = [
  { id: "", label: "All" },
  { id: "bollywood", label: "Bollywood" },
  { id: "party/concert", label: "Party/Concert" },
  { id: "wedding guest", label: "Wedding Guest" },
  { id: "sarees", label: "Sarees" },
  { id: "festive", label: "Festive" },
  { id: "gothic", label: "Gothic" },
  { id: "latest", label: "Latest" },
];

const SEARCH_PLACEHOLDERS = [
  "Bollywood inspired",
  "Sangeet look",
  "Insta favourites",
];

export default function GalleryBrowser({ initialQuery, initialTag, initialImages, initialHasMore, initialFailed, tags = [] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery || "");
  const [tag, setTag] = useState(initialTag || "");
  const [images, setImages] = useState(initialImages || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialFailed ? "We couldn’t load the gallery. Please try again." : "");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const sentinel = useRef(null);
  const reqId = useRef(0);
  const firstRun = useRef(true);

  // Cycling search placeholder (Bollywood inspired -> Sangeet look -> Insta favourites)
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const fetchPage = useCallback(async (p, q, t) => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (q.trim()) qs.set("q", q.trim());
      if (t) qs.set("tag", t);
      const data = await api(`/gallery?${qs}`);
      if (id !== reqId.current) return;
      setImages((list) => (p === 1 ? data.images : [...list, ...data.images]));
      setHasMore(!!data.hasMore);
      setPage(p);
    } catch (e) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Sync address bar and refetch
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (!initialFailed) return;
    }
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (tag) qs.set("tag", tag);
      window.history.replaceState(null, "", `${pathname}${qs.toString() ? `?${qs}` : ""}`);
      fetchPage(1, query, tag);
    }, 350);
    return () => clearTimeout(t);
  }, [query, tag, fetchPage, initialFailed, pathname]);

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
      {/* Header */}
      <div className="flex flex-col items-start gap-3">
        <h1 className="font-display text-[44px] leading-[1.02] tracking-tight font-bold sm:text-[64px] lg:text-[76px] text-ink">
          Find your next look
        </h1>
        <p className="max-w-lg text-[17px] leading-relaxed text-muted">
          Get inspired by our recent outfit recreations. Open any look to request custom tailoring or check pricing.
        </p>
      </div>

      {/* Sticky Search & Filter Bar */}
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
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            maxLength={100}
            className="h-12 w-full rounded-[14px] bg-surface pl-12 pr-12 text-[15px] ring-1 ring-line-strong outline-none transition placeholder:text-[#8aa0a1] focus:ring-2 focus:ring-teal-deep [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        {/* Categories: Clean pill buttons without borders */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Curated categories">
          {CORE_CATEGORIES.map((cat) => {
            const active = tag.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id || "all"}
                type="button"
                onClick={() => setTag(active && cat.id ? "" : cat.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-5 text-[14px] font-semibold transition-all duration-150 cursor-pointer",
                  active
                    ? "bg-teal-deep text-white shadow-xs"
                    : "bg-white/80 text-ink/80 hover:bg-white hover:text-ink"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8" aria-live="polite" aria-busy={loading}>
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
        ) : error ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-[15px] text-danger">{error}</p>
            <Button variant="outline" onClick={() => fetchPage(images.length ? page + 1 : 1, query, tag)}>
              Try again
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={ImageOff}
            title={searching ? "No looks match that" : "New looks are on their way"}
            text={searching ? "Try a different search word, like the outfit type, colour or occasion." : "Check back soon, or upload your own inspiration for an estimate."}
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
              ) : null
            }
          />
        )}

        <div ref={sentinel} className="flex h-20 items-center justify-center">
          {loading && images.length > 0 && <Spinner className="size-6 text-teal-deep" />}
        </div>
      </div>
    </div>
  );
}
