"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { Dialog, DialogClose, SheetContent } from "@/components/ui/Dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#estimate", label: "Get estimate" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/gallery", label: "Get Inspired" },
  { href: "/#faqs", label: "FAQs" },
  { href: "/collaborate", label: "Work with us" },
  { href: "/contact", label: "Contact us" },
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
        scrolled ? "bg-mint/90 shadow-[0_1px_0_var(--line)] backdrop-blur-xl" : "bg-mint"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="-m-2 rounded-xl p-2 transition hover:opacity-90" aria-label="Nixie home">
          <Logo className="h-[22px] w-auto sm:h-6" priority />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main" className="hidden items-center gap-1.5 lg:flex">
          {NAV.map((n) => {
            const active =
              (n.href === "/gallery" && pathname.startsWith("/gallery")) ||
              (n.href === "/collaborate" && pathname.startsWith("/collaborate")) ||
              (n.href === "/contact" && pathname.startsWith("/contact"));

            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[14.5px] font-medium tracking-[0.01em] transition-all duration-150",
                  active
                    ? "bg-ink text-white font-semibold shadow-xs"
                    : "text-ink hover:bg-ink/5 hover:text-teal-deep"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AccountLink />

          {/* Mobile hamburger */}
          <Dialog open={open} onOpenChange={setOpen}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <SheetContent title="Menu">
              <div className="flex h-[72px] items-center justify-between px-5">
                <Logo className="h-[22px] w-auto" />
                <DialogClose className="flex size-10 items-center justify-center rounded-full hover:bg-ink/5" aria-label="Close menu">
                  <X className="size-5" />
                </DialogClose>
              </div>
              <nav aria-label="Mobile" className="flex flex-1 flex-col px-4 pt-4">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="group rounded-2xl px-3 py-3 transition hover:bg-white"
                  >
                    <span className="text-[20px] font-semibold text-ink transition-colors group-hover:text-teal-deep">
                      {n.label}
                    </span>
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-3 border-t border-line p-5">
                <Button href="/#estimate" size="lg" full onClick={() => setOpen(false)}>
                  Instant price check
                </Button>
              </div>
            </SheetContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

function AccountLink() {
  const { customer, loading } = useAuth();

  if (loading) {
    return <div className="size-10 rounded-full bg-line/50" aria-hidden="true" />;
  }

  const href = customer ? "/profile" : "/login";
  const title = customer ? (customer.name || customer.email || "Your profile") : "Log in";

  return (
    <Link
      href={href}
      className="flex size-10 items-center justify-center rounded-full bg-white text-black border border-black/15 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-black/35 hover:shadow-xs"
      aria-label={title}
      title={title}
    >
      <User className="size-5 stroke-[1.5]" />
    </Link>
  );
}
