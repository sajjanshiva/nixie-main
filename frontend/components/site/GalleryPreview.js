"use client";
// Home page inspiration gallery: Find your next look
import { useState, useMemo } from "react";
import Link from "next/link";
import { Images } from "lucide-react";
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
  const [selectedCat, setSelectedCat] = useState("all");

  const filteredImages = useMemo(() => {
    if (selectedCat === "all" || selectedCat === "latest") return images;
    return images.filter((img) =>
      (img.tags || []).some((t) => t.toLowerCase().includes(selectedCat.toLowerCase()))
    );
  }, [images, selectedCat]);

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

        {/* Categories Bar: Clean pills, no button borders */}
        <div className="mb-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
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

        {/* Masonry / Grid */}
        {filteredImages.length > 0 ? (
          <div className="masonry">
            {filteredImages.slice(0, 8).map((img, i) => (
              <GalleryCard key={img.id} image={img} priority={i < 2} />
            ))}
          </div>
        ) : images.length > 0 ? (
          /* If no images match this specific category yet, show recent ones */
          <div className="masonry">
            {images.slice(0, 8).map((img, i) => (
              <GalleryCard key={img.id} image={img} priority={i < 2} />
            ))}
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
            See more
          </Button>
        </div>

      </div>
    </section>
  );
}
