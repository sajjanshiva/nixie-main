"use client";
// Admin frame: deep-teal sidebar on desktop, top bar + slide-out menu on phones.
// Also guards every admin page: not logged in → /admin/login.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, FileText, Images, Inbox, LayoutGrid, LogOut, Menu, X } from "lucide-react";
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
    <div className="min-h-dvh bg-mint lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-admin-side px-4 py-6 lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-admin-side px-4 lg:hidden">
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
        <div className="mx-auto max-w-[1240px]">{children}</div>
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
      <nav aria-label="Admin" className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                active ? "bg-admin-side-active font-semibold text-admin-side-active-text" : "text-admin-side-text hover:bg-admin-side-hover"
              )}
            >
              <n.icon className="size-[18px]" aria-hidden="true" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-admin-side-line px-2.5 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-2 text-[14px] text-admin-side-text hover:text-white"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          View website
        </a>
        <p className="truncate text-[13px] text-admin-side-muted">{admin?.email}</p>
        <button
          type="button"
          onClick={onLogout}
          disabled={leaving}
          className="mt-2 inline-flex items-center gap-2 text-[14px] font-semibold text-admin-side-text hover:text-white disabled:opacity-60"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </div>
    </>
  );
}
