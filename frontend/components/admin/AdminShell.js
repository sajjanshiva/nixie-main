"use client";
// Admin frame: deep-teal sidebar on desktop, top bar + slide-out menu on phones.
// Also guards every admin page: not logged in → /admin/login.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, FileText, Images, Inbox, LayoutGrid, LogOut, Menu, Star, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Skeleton from "@/components/ui/Skeleton";
import { Dialog, DialogClose, SheetContent } from "@/components/ui/Dialog";
import { useAdmin } from "./AdminProvider";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading } = useAdmin();
  const [open, setOpen] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && !admin && !redirected.current) {
      redirected.current = true;
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, admin, pathname, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !admin) {
    return (
      <div className="flex min-h-dvh bg-mint">
        <div className="hidden w-[248px] bg-admin-side lg:block" />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64" />
          <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[20px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-mint lg:grid lg:grid-cols-[256px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-admin-side px-4 py-6 lg:flex border-r border-black/10">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-admin-side px-4 lg:hidden border-b border-black/10">
        <Link href="/admin" aria-label="Admin dashboard">
          <Logo tone="white" className="h-5 w-auto" />
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-11 items-center justify-center rounded-full text-white hover:bg-admin-side-hover"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
          <SheetContent title="Admin menu" side="left" className="bg-admin-side px-4 py-5">
            <DialogClose
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-white hover:bg-admin-side-hover"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </DialogClose>
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Dialog>
      </header>

      <main id="main" className="min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({ pathname }) {
  const router = useRouter();
  const { admin, logout } = useAdmin();
  const [leaving, setLeaving] = useState(false);

  async function onLogout() {
    setLeaving(true);
    await logout();
    router.replace("/admin/login");
  }

  return (
    <>
      <Link href="/admin" className="mb-8 ml-2.5 mt-1 self-start" aria-label="Admin dashboard">
        <Logo tone="white" className="h-5 w-auto" />
      </Link>
      <nav aria-label="Admin" className="flex flex-col gap-1.5">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14.5px] transition-all duration-150",
                active
                  ? "bg-cyan text-ink font-bold shadow-xs"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <n.icon className={cn("size-[18px]", active ? "text-ink" : "text-white/70")} aria-hidden="true" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/15 px-2.5 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-2 text-[13.5px] font-medium text-white/75 hover:text-white transition-colors"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          View live website
        </a>
        <p className="truncate text-[12.5px] text-white/60">{admin?.email}</p>
        <button
          type="button"
          onClick={onLogout}
          disabled={leaving}
          className="mt-2.5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-white/80 hover:text-white disabled:opacity-60 transition-colors"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </div>
    </>
  );
}
