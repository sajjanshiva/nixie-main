"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * HowItWorks — Atelier 2-Column Layout matching Mam's annotated sketch:
 * - Centered Heading + Subtitle at top
 * - Left: "Behind the Scenes" Craft Video Player (fixed spelling, rich atelier frame)
 * - Right: 3 Fabric Swatch Step Cards with left/right tilt hover animation,
 *          pins, Caveat notes, woven textures, pinked edges & Bangalore studio text.
 */

const STEPS = [
  {
    num: "1",
    label: "Step 1",
    title: "Share the look",
    desc: "A screenshot, a Pinterest pin, or something you saw at a wedding. Upload it and see what it would cost.",
    note: "any photo works",
    noteAngle: "rotate(-3deg)",
    hoverTilt: "hover:-rotate-1.5 hover:scale-[1.015]",
    swatchBg: "#279da4",
    swatchColor: "#000",
    icon: (
      // Phone with upload arrow
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <rect x="18" y="8" width="28" height="48" rx="5" />
        <line x1="32" y1="50" x2="32" y2="50.1" strokeWidth="4" strokeLinecap="round" />
        <line x1="32" y1="24" x2="32" y2="38" />
        <polyline points="26,30 32,24 38,30" />
      </svg>
    ),
  },
  {
    num: "2",
    label: "Step 2",
    title: "Make it yours",
    desc: "Change the colour, neckline, sleeves or length. We show you fabric videos and agree every detail before anything is cut.",
    note: "your colour, your fit",
    noteAngle: "rotate(3deg)",
    hoverTilt: "hover:rotate-1.5 hover:scale-[1.015]",
    swatchBg: "#54ebeb",
    swatchColor: "#000",
    icon: (
      // Scissors with dashed cutting line
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <circle cx="22" cy="44" r="6" />
        <circle cx="42" cy="44" r="6" />
        <line x1="27" y1="40" x2="48" y2="16" />
        <line x1="37" y1="40" x2="16" y2="16" />
        <line x1="12" y1="30" x2="52" y2="30" strokeDasharray="3 3" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: "3",
    label: "Step 3",
    title: "We stitch and deliver",
    desc: "Made from scratch in our Bangalore studio to your measurements, then delivered to your door anywhere in India.",
    note: "made just for you",
    noteAngle: "rotate(-2deg)",
    hoverTilt: "hover:-rotate-1.5 hover:scale-[1.015]",
    swatchBg: "#155f64",
    swatchColor: "#54ebeb",
    icon: (
      // Clothes hanger with sparkle
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-8">
        <path d="M32 14 C32 10 36 8 36 12 C36 15 32 16 32 16" />
        <path d="M32 16 L12 42 C10 44 12 48 15 48 L49 48 C52 48 54 44 52 42 Z" />
        <path d="M40 36 L42 32 M42 32 L44 36 M42 32 L42 28" strokeWidth="1.8" />
      </svg>
    ),
  },
];

// Zigzag pinked edge pattern for mini swatches
const PINK_CLIP_SQUARE =
  "polygon(0% 0%, 100% 0%, 100% 92%, 92% 98%, 84% 92%, 76% 98%, 68% 92%, 60% 98%, 52% 92%, 44% 98%, 36% 92%, 28% 98%, 20% 92%, 12% 98%, 4% 92%, 0% 98%)";

export default function HowItWorks() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-10 sm:py-14 lg:py-16"
      style={{ background: "var(--mint)" }}
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Centered Heading & Subtitle (as drawn by Mam) */}
        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <h2 className="font-display text-[40px] leading-[1.05] tracking-tight text-ink sm:text-[50px] lg:text-[58px] font-bold">
            How your outfit comes to life
          </h2>
          <p className="mt-4 text-[17px] sm:text-[18px] text-muted leading-relaxed max-w-lg mx-auto">
            Three simple steps, and you&apos;re part of every decision.
          </p>
        </div>

        {/* 2-Column Grid: Video on Left, 3 Steps on Right */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch lg:gap-12">
          
          {/* Left Column: Video player container */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="relative size-full min-h-[340px] sm:min-h-[420px] lg:min-h-[500px] overflow-hidden rounded-[26px] bg-[#155f64] shadow-[0_16px_44px_rgba(21,95,100,0.25)] border-2 border-dashed border-[#54ebeb]/40">
              {isPlaying ? (
                <video
                  src="/brand/craft-story.mp4"
                  controls
                  autoPlay
                  playsInline
                  className="size-full object-cover"
                  onError={() => setIsPlaying(false)}
                />
              ) : (
                <div
                  onClick={() => setIsPlaying(true)}
                  className="relative size-full flex flex-col items-center justify-center p-8 text-center cursor-pointer group bg-gradient-to-br from-[#1d7a80] to-[#155f64] select-none"
                >
                  {/* Subtle woven backdrop inside video cover */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg,rgba(255,255,255,0.15) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(0,0,0,0.1) 0 1px,transparent 1px 4px)",
                    }}
                  />

                  {/* Play Button with Cyan Glow */}
                  <div className="relative z-10 flex size-20 sm:size-24 items-center justify-center rounded-full bg-cyan text-ink shadow-[0_0_36px_rgba(84,235,235,0.7)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_48px_rgba(84,235,235,0.9)]">
                    <Play className="size-8 sm:size-10 fill-ink translate-x-1" />
                  </div>

                  <p className="relative z-10 mt-6 font-display text-[24px] sm:text-[28px] font-bold text-white drop-shadow-md">
                    Behind the Scenes at Nixie
                  </p>
                  <p className="relative z-10 mt-1 text-[14.5px] text-white/85 font-medium max-w-sm">
                    Watch master pattern drafting & bespoke handcrafting
                  </p>

                  <span className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[12.5px] font-semibold text-white/95 backdrop-blur-xs ring-1 ring-white/25">
                    <span className="size-2 rounded-full bg-[#54ebeb] animate-pulse" />
                    1 min craft story
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 3 Fabric Swatch Step Cards */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5 sm:gap-6">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`relative group flex gap-4 sm:gap-6 rounded-[22px] bg-white/85 p-5 sm:p-6 shadow-[0_4px_20px_rgba(13,74,78,0.06)] ring-1 ring-line/80 backdrop-blur-xs transition-all duration-300 ease-out origin-center cursor-default ${step.hoverTilt} hover:bg-white hover:shadow-[0_16px_36px_rgba(13,74,78,0.12)]`}
              >
                {/* Yellow Pin Dot on top edge */}
                <div
                  aria-hidden="true"
                  className="absolute -top-2.5 left-8 z-10 size-4 rounded-full border border-black/20 shadow-sm"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, #fff 0 20%, #ffc43a 21% 100%)",
                  }}
                />

                {/* Left side: Pinked-edge fabric swatch thumbnail */}
                <div
                  className="relative shrink-0 flex items-center justify-center size-20 sm:size-24 rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: step.swatchBg,
                    color: step.swatchColor,
                    clipPath: PINK_CLIP_SQUARE,
                  }}
                >
                  {/* Subtle woven fabric texture */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg,rgba(255,255,255,0.2) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,0.15) 0 1px,transparent 1px 3px)",
                    }}
                  />
                  <div className="relative z-[1]">{step.icon}</div>
                </div>

                {/* Right side: Step Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="font-hand text-[22px] font-bold text-teal-deep leading-none"
                      style={{ fontFamily: '"Caveat", cursive', fontStyle: "italic" }}
                    >
                      {step.label}
                    </span>

                    {/* Caveat handwritten tag */}
                    <span
                      aria-hidden="true"
                      className="shrink-0 rounded-md bg-[#fffcf0] px-2.5 py-0.5 text-[14px] sm:text-[15px] font-semibold text-teal-deep ring-1 ring-line shadow-xs"
                      style={{
                        fontFamily: '"Caveat", cursive',
                        transform: step.noteAngle,
                      }}
                    >
                      {step.note}
                    </span>
                  </div>

                  <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-ink leading-snug">
                    {step.title}
                  </h3>

                  <p className="mt-1 text-[14px] sm:text-[14.5px] leading-relaxed text-muted">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
