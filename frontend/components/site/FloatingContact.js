"use client";
// Floating "Contact us" pill on every page (hidden where it would cover the main button).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const HIDE_ON = ["/contact", "/pay", "/login", "/signup", "/forgot-password", "/reset-password"];

export default function FloatingContact() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <Link
      href="/contact"
      className="group fixed bottom-5 right-5 z-40 flex h-12 items-center gap-3 rounded-[16px] bg-[#155f64] pl-3 pr-5 text-[14.5px] font-semibold text-white shadow-[0_10px_28px_rgba(21,95,100,0.35)] ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1d7a80] hover:shadow-[0_14px_36px_rgba(21,95,100,0.45)] sm:bottom-7 sm:right-7"
    >
      {/* Cyan Icon Box */}
      <span className="flex size-7.5 items-center justify-center rounded-[10px] bg-cyan text-ink shadow-xs transition-transform duration-300 group-hover:scale-105">
        <MessageCircle className="size-4" aria-hidden="true" />
      </span>

      <span className="tracking-tight text-white">Contact us</span>

      {/* Atelier running stitch thread detail — matching rectangular rounded button */}
      <svg
        className="pointer-events-none absolute inset-[4px] h-[calc(100%-8px)] w-[calc(100%-8px)] overflow-visible opacity-85 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      >
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="12"
          ry="12"
          fill="none"
          stroke="#fffcf0"
          strokeWidth="1.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
