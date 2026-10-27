"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { Dialog, DialogClose, SheetContent } from "@/components/ui/Dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#estimate", label: "Get estimate" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/gallery", label: "Inspiration" },
  { href: "/#faqs", label: "FAQs" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-mint/85 shadow-[0_1px_0_var(--line)] backdrop-blur-xl" : "bg-mint"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="-m-2 rounded-lg p-2" aria-label="Nixie home">
          <Logo className="h-[22px] w-auto sm:h-6" priority />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = n.href === "/gallery" && pathname.startsWith("/gallery");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-[6px] px-3.5 py-1.5 text-[14.5px] font-medium tracking-[0.01em] transition-all duration-150",
                  active
                    ? "bg-ink text-white font-semibold"
                    : "text-ink hover:bg-ink/5 hover:text-teal-deep"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <AccountLink />
          <Button href="/contact" size="md" className="hidden lg:inline-flex">
            Contact us
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex size-10 items-center justify-center rounded-[6px] text-ink transition hover:bg-ink/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <SheetContent title="Menu">
              <div className="flex h-[72px] items-center justify-between px-5">
                <Logo className="h-[22px] w-auto" />
                <DialogClose className="flex size-10 items-center justify-center rounded-[6px] hover:bg-ink/5" aria-label="Close menu">
                  <X className="size-5" />
                </DialogClose>
              </div>
              <nav aria-label="Mobile" className="flex flex-1 flex-col px-3 pt-4">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="group rounded-[8px] px-3 py-3 transition hover:bg-white"
                  >
                    <span className="font-display text-[34px] leading-none group-hover:text-teal-deep">{n.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-3 border-t border-line p-5">
                <Button href="/contact" size="lg" full onClick={() => setOpen(false)}>
                  Contact us
                </Button>
                <MobileAccount onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

// Minimal line-art person silhouette icon
function PersonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19.5c0-3.8 3.1-7 7-7s7 3.2 7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AccountLink() {
  const { customer, loading } = useAuth();
  if (loading) return <span className="size-10 rounded-full nx-skeleton" aria-hidden="true" />;
  if (customer) {
    return (
      <Link
        href="/profile"
        className="group flex size-10 items-center justify-center rounded-full bg-white text-ink ring-1 ring-line-strong transition-all duration-200 hover:ring-ink hover:text-teal-deep hover:shadow-sm"
        aria-label="My profile"
        title={customer.name || customer.email || "My profile"}
      >
        <PersonIcon className="size-[19px] transition-transform duration-200 group-hover:scale-105" />
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="rounded-[6px] px-3.5 py-2 text-[14.5px] font-semibold text-ink transition hover:bg-ink/5 hover:text-teal-deep"
    >
      Log in
    </Link>
  );
}

function MobileAccount({ onNavigate }) {
  const { customer } = useAuth();
  return customer ? (
    <Button href="/profile" variant="outline" size="lg" full onClick={onNavigate}>
      My profile
    </Button>
  ) : (
    <Button href="/login" variant="outline" size="lg" full onClick={onNavigate}>
      Log in
    </Button>
  );
}
