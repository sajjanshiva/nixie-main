"use client";
// Floating "Contact us" button on every page (hidden where it would cover the main button).
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
      className="group fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2.5 rounded-[8px] bg-ink pl-3.5 pr-4 text-[14.5px] font-semibold text-white ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 sm:bottom-7 sm:right-7"
    >
      <span className="flex size-7 items-center justify-center rounded-[4px] bg-cyan text-ink transition-transform duration-300 group-hover:rotate-[-8deg]">
        <MessageCircle className="size-4" aria-hidden="true" />
      </span>
      Contact us
    </Link>
  );
}
