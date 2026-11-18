"use client";
import { useEffect, useState, useCallback } from "react";
import { Star, Play, Quote, Camera } from "lucide-react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

// Show 5 on mobile, 6 on desktop — detected after mount
const MOBILE_INITIAL = 5;
const DESKTOP_INITIAL = 6;
const BATCH_SIZE = 6;

// ─── Stars Row ─────────────────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: Math.min(Math.max(count, 1), 5) }, (_, i) => (
        <Star key={i} className="size-3.5 fill-[#ffc43a] text-[#ffc43a]" />
      ))}
    </div>
  );
}

// ─── Main Section ──────────────────────────────────────────────────
export default function ReviewsMosaic() {
  const [allReviews, setAllReviews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(DESKTOP_INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [expanding, setExpanding] = useState(false);

  // Set correct initial count based on screen width after mount
  useEffect(() => {
    if (window.innerWidth < 640) setVisibleCount(MOBILE_INITIAL);
  }, []);

  useEffect(() => {
    let alive = true;
    api("/reviews")
      .then((data) => {
        if (alive) {
          if (Array.isArray(data?.reviews)) setAllReviews(data.reviews);
          setLoaded(true);
        }
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const handleShowMore = useCallback(() => {
    setExpanding(true);
    setTimeout(() => {
      setVisibleCount((c) => Math.min(c + BATCH_SIZE, allReviews.length));
      setExpanding(false);
    }, 150);
  }, [allReviews.length]);

  if (!loaded || allReviews.length === 0) return null;

  const visible = allReviews.slice(0, visibleCount);
  const hasMore = visibleCount < allReviews.length;

  return (
    <section className="bg-mint py-14 sm:py-20">

      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">

        {/* ── Section Header ── */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-[40px] leading-[1.05] tracking-tight text-ink sm:text-[52px] lg:text-[60px] font-bold">
            a love story with our clients
          </h2>
          <p className="mt-3 text-[17px] text-muted max-w-xl mx-auto">
            From red carpet references to wedding day heirlooms, see what our clients wear and say.
          </p>
        </div>

        {/* ── Reviews Grid ── */}
        <div
          className={`reviews-grid transition-opacity duration-200 ${expanding ? "opacity-50" : "opacity-100"}`}
        >
          {visible.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>

        {/* ── Show More Button ── */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Button variant="outline" size="lg" onClick={handleShowMore}>
              Discover More Client Stories
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  REVIEW CARDS
// ═══════════════════════════════════════════════════════════

function ReviewCard({ review }) {
  const { type, mediaUrl } = review;
  if (type === "image" && mediaUrl) return <ImageReviewCard review={review} />;
  if (type === "video" && mediaUrl) return <VideoReviewCard review={review} />;
  return <TextReviewCard review={review} />;
}

// ─── Text Review Card ──────────────────────────────────────
function TextReviewCard({ review }) {
  const { clientName = "", clientLocation, outfitName, rating = 5, quote } = review;

  return (
    <div className="group break-inside-avoid mb-5 rounded-2xl bg-white border border-line/80 shadow-[0_2px_16px_rgba(13,74,78,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(13,74,78,0.1)] hover:border-teal/30 p-5 sm:p-6">

      {/* Stars + quote watermark */}
      <div className="flex items-start justify-between mb-4">
        <Stars count={rating} />
        <Quote className="size-6 text-teal/15 flex-shrink-0 mt-0.5" />
      </div>

      {/* Quote */}
      <p className="text-[15px] sm:text-[15.5px] leading-relaxed text-ink/85 font-normal italic">
        &ldquo;{quote}&rdquo;
      </p>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-line/60">
        <p className="font-semibold text-ink text-[13.5px]">{clientName}</p>
        {clientLocation && (
          <p className="text-muted text-[12px] mt-0.5">{clientLocation}</p>
        )}
        {outfitName && (
          <p className="text-teal-deep text-[12px] mt-1 font-medium">{outfitName}</p>
        )}
      </div>
    </div>
  );
}

// ─── Photo / Image Review Card ─────────────────────────────
function ImageReviewCard({ review }) {
  const { clientName = "", clientLocation, outfitName, rating = 5, quote, mediaUrl } = review;

  return (
    <div className="group break-inside-avoid mb-5 rounded-2xl overflow-hidden bg-white border border-line/80 shadow-[0_2px_16px_rgba(13,74,78,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(13,74,78,0.1)] hover:border-teal/30">

      {/* Photo */}
      <div className="relative w-full overflow-hidden bg-mint" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={outfitName || clientName || "Client photo"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Discreet badge */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
          <Camera className="size-3" />
          Client Photo
        </div>
      </div>

      {/* Text panel */}
      <div className="p-4 sm:p-5">
        <Stars count={rating} />
        {quote && (
          <p className="mt-3 text-[14px] sm:text-[14.5px] leading-relaxed text-ink/85 italic font-normal line-clamp-3">
            &ldquo;{quote}&rdquo;
          </p>
        )}
        <div className="mt-4 pt-3.5 border-t border-line/60">
          <p className="font-semibold text-ink text-[13px]">{clientName}</p>
          {clientLocation && (
            <p className="text-muted text-[11.5px] mt-0.5">{clientLocation}</p>
          )}
          {outfitName && (
            <p className="text-teal-deep text-[12px] mt-1 font-medium">{outfitName}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Video Review Card ─────────────────────────────────────
function VideoReviewCard({ review }) {
  const { clientName = "", clientLocation, outfitName, rating = 5, quote, mediaUrl } = review;

  return (
    <div className="group break-inside-avoid mb-5 rounded-2xl overflow-hidden bg-white border border-line/80 shadow-[0_2px_16px_rgba(13,74,78,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(13,74,78,0.1)] hover:border-teal/30">

      {/* Video thumbnail */}
      <div className="relative w-full overflow-hidden bg-ink/90" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={outfitName || clientName || "Client video"}
          className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-[52px] items-center justify-center rounded-full bg-teal-deep shadow-[0_0_0_8px_rgba(29,122,128,0.2)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_0_12px_rgba(29,122,128,0.15)]">
            <Play className="size-5 fill-white text-white translate-x-0.5" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Text panel */}
      <div className="p-4 sm:p-5">
        <Stars count={rating} />
        {quote && (
          <p className="mt-3 text-[14px] sm:text-[14.5px] leading-relaxed text-ink/85 italic font-normal line-clamp-3">
            &ldquo;{quote}&rdquo;
          </p>
        )}
        <div className="mt-4 pt-3.5 border-t border-line/60">
          <p className="font-semibold text-ink text-[13px]">{clientName}</p>
          {clientLocation && (
            <p className="text-muted text-[11.5px] mt-0.5">{clientLocation}</p>
          )}
          {outfitName && (
            <p className="text-teal-deep text-[12px] mt-1 font-medium">{outfitName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
