"use client";
import { useEffect, useState } from "react";
import { Star, Play, Quote } from "lucide-react";
import { api } from "@/lib/api";

export default function ReviewsMosaic() {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    api("/reviews")
      .then((data) => {
        if (alive) {
          if (Array.isArray(data?.reviews)) {
            setReviews(data.reviews);
          }
          setLoaded(true);
        }
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Do not render section if there are no published reviews yet
  if (!loaded || reviews.length === 0) {
    return null;
  }

  return (
    <section className="bg-mint py-10 sm:py-14 lg:py-16 overflow-hidden">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-[40px] leading-[1.05] tracking-tight text-ink sm:text-[52px] lg:text-[60px] font-bold">
            a love story with our clients
          </h2>
          <p className="mt-3 text-[17px] text-muted max-w-xl mx-auto">
            From red carpet references to wedding day heirlooms, see what our clients wear and say.
          </p>
        </div>

        {/* Mosaic Masonry Grid */}
        <div className="masonry">
          {reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>

      </div>
    </section>
  );
}

function ReviewCard({ review }) {
  const { type, clientName, clientLocation, outfitName, rating = 5, quote, mediaUrl } = review;

  // Rating Stars
  const stars = Array.from({ length: Math.min(Math.max(rating, 1), 5) }, (_, i) => (
    <Star key={i} className="size-3.5 fill-[#ffc43a] text-[#ffc43a]" />
  ));

  if (type === "image" && mediaUrl) {
    return (
      <div className="group break-inside-avoid mb-5 overflow-hidden rounded-[20px] bg-white ring-1 ring-line/80 shadow-[0_4px_20px_rgba(13,74,78,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(13,74,78,0.12)]">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-mint">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={outfitName || clientName || "Client review"}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-103"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
            <div className="flex gap-1 mb-2">{stars}</div>
            <p className="text-[14px] leading-snug font-medium text-white/95 line-clamp-3">
              “{quote}”
            </p>
            <div className="mt-2 flex items-baseline justify-between text-[12.5px] text-white/80">
              <span className="font-bold text-white">{clientName}</span>
              {clientLocation && <span>{clientLocation}</span>}
            </div>
          </div>
        </div>
        {outfitName && (
          <div className="px-4 py-2.5 bg-white/90 border-t border-line/40 text-[12.5px] font-medium text-teal-deeper">
            Outfit: {outfitName}
          </div>
        )}
      </div>
    );
  }

  if (type === "video" && mediaUrl) {
    return (
      <div className="group break-inside-avoid mb-5 overflow-hidden rounded-[20px] bg-white ring-1 ring-line/80 shadow-[0_4px_20px_rgba(13,74,78,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(13,74,78,0.12)]">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={outfitName || clientName || "Client video"}
            className="size-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-103"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-cyan/90 text-ink shadow-[0_0_24px_rgba(84,235,235,0.7)] transition-transform duration-300 group-hover:scale-110">
              <Play className="size-6 fill-ink translate-x-0.5" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white">
            <div className="flex gap-1 mb-1.5">{stars}</div>
            <p className="text-[13.5px] leading-snug line-clamp-2 text-white/90">
              “{quote}”
            </p>
            <div className="mt-2 text-[12.5px] font-semibold text-white">
              {clientName} {clientLocation ? `• ${clientLocation}` : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pure Text Review Card
  return (
    <div className="break-inside-avoid mb-5 rounded-[20px] bg-white p-6 sm:p-7 ring-1 ring-line/80 shadow-[0_4px_20px_rgba(13,74,78,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(13,74,78,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">{stars}</div>
        <Quote className="size-5 text-teal/30" />
      </div>
      <p className="text-[15px] sm:text-[16px] leading-relaxed text-ink/90 font-medium italic">
        “{quote}”
      </p>
      <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-between text-[13px]">
        <div>
          <p className="font-bold text-ink">{clientName}</p>
          {clientLocation && <p className="text-muted text-[12px]">{clientLocation}</p>}
        </div>
        {outfitName && (
          <span className="text-[12px] font-semibold text-teal-deep bg-cyan-soft px-2.5 py-1 rounded-full">
            {outfitName}
          </span>
        )}
      </div>
    </div>
  );
}
