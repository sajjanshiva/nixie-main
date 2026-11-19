"use client";
// Home page inspiration gallery: Find your next look
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Images, Search, X } from "lucide-react";
import GalleryCard from "./GalleryCard";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "bollywood", label: "Bollywood" },
  { id: "party/concert", label: "Party/Concert" },
  { id: "wedding guest", label: "Wedding Guest" },
  { id: "sarees", label: "Sarees" },
  { id: "festive", label: "Festive" },
  { id: "gothic", label: "Gothic" },
  { id: "latest", label: "Latest" },
];

export default function GalleryPreview({ images = [] }) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredImages = useMemo(() => {
    let result = images;
    if (selectedCat !== "all" && selectedCat !== "latest") {
      result = result.filter((img) =>
        (img.tags || []).some((t) => t.toLowerCase().includes(selectedCat.toLowerCase()))
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((img) =>
        (img.title && img.title.toLowerCase().includes(q)) ||
        (img.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [images, selectedCat, searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section id="inspiration" className="bg-mint py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="font-display text-[40px] leading-[1.02] tracking-tight text-ink sm:text-[54px] lg:text-[64px] font-bold">
              Find your next look
            </h2>
            <p className="mt-2 text-[16px] sm:text-[17px] text-muted">
              Get inspired by our recent outfit recreations.
            </p>
          </div>
          <Button href="/gallery" variant="outline" size="md" className="self-start sm:self-auto">
            Browse full gallery
          </Button>
        </div>

        {/* Categories Bar & Search Bar: Pills on left, Search on right */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {CATEGORIES.map((cat) => {
              const active = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={cn(
                    "shrink-0 rounded-full px-5 py-2 text-[14px] font-semibold transition-all duration-150 cursor-pointer",
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

          {/* Search bar directly beside the filter categories on the right side */}
          <form
            role="search"
            onSubmit={handleSubmit}
            className="relative shrink-0 w-full lg:w-[280px]"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="home-gallery-search" className="sr-only">
              Search looks or styles
            </label>
            <input
              id="home-gallery-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search looks or styles..."
              maxLength={100}
              className="h-10 w-full rounded-full bg-white/90 pl-10 pr-9 text-[14px] text-ink ring-1 ring-line outline-none transition placeholder:text-[#8aa0a1] focus:bg-white focus:ring-2 focus:ring-teal-deep [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-ink"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Masonry / Grid */}
        {filteredImages.length > 0 ? (
          <div className="masonry">
            {filteredImages.slice(0, 8).map((img, i) => (
              <GalleryCard key={img.id} image={img} priority={i < 2} />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="flex flex-col items-center rounded-[20px] border border-line bg-white/50 px-6 py-14 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-soft text-teal-deeper">
              <Search className="size-6" aria-hidden="true" />
            </span>
            <p className="font-display text-2xl font-bold">No looks found for &ldquo;{searchQuery}&rdquo;</p>
            <p className="mt-2 max-w-sm text-[15px] text-muted">
              Try searching for something else or explore all styles in our gallery.
            </p>
            <div className="mt-5">
              <Button onClick={() => { setSearchQuery(""); setSelectedCat("all"); }} variant="outline" size="sm">
                Clear search
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-[20px] border border-line bg-white/50 px-6 py-16 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-soft text-teal-deeper">
              <Images className="size-6" aria-hidden="true" />
            </span>
            <p className="font-display text-2xl font-bold">New looks arriving daily</p>
            <p className="mt-2 max-w-sm text-[15px] text-muted">
              Have a look in mind already? Upload it above for an instant estimate.
            </p>
          </div>
        )}

        {/* See More Button Below Gallery */}
        <div className="mt-12 text-center">
          <Button href="/gallery" variant="outline" size="lg">
            See all gallery looks
          </Button>
        </div>
      </div>
    </section>
  );
}
