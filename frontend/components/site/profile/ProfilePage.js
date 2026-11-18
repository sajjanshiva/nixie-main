"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Images, Inbox, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { firstName } from "@/lib/format";
import MyDetails from "./MyDetails";
import MyAnalyses from "./MyAnalyses";
import MyInvoices from "./MyInvoices";
import MyEnquiries from "./MyEnquiries";

const TABS = [
  { id: "details", label: "My details", icon: UserRound },
  { id: "analyses", label: "My analyses", icon: Images },
  { id: "invoices", label: "My invoices", icon: FileText },
  { id: "enquiries", label: "My enquiries", icon: Inbox },
];

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { customer, loading, justLoggedOut } = useAuth();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "details";
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && !customer && !justLoggedOut && !redirected.current) {
      redirected.current = true;
      router.replace(`/login?next=${encodeURIComponent("/profile")}`);
    }
  }, [loading, customer, justLoggedOut, router]);

  if (loading || !customer) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="mt-8 h-14 w-full max-w-xl rounded-[8px]" />
        <Skeleton className="mt-8 h-96 w-full rounded-[10px]" />
      </div>
    );
  }

  const name = firstName(customer.name);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-8 sm:px-8 lg:pt-14">
      <h1 className="font-display text-[48px] leading-none sm:text-[64px]">{name ? `Hello, ${name}` : "Your profile"}</h1>
      <p className="mt-3 text-[16px] text-muted">{customer.email}</p>

      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })} className="mt-8">
        {/* Mobile: 2×2 individual cards. Desktop: original horizontal pill bar */}
        <TabsList
          aria-label="Profile sections"
          className="bg-transparent p-0 ring-0 grid grid-cols-2 gap-2 w-full sm:bg-surface sm:p-1.5 sm:ring-1 sm:ring-line sm:inline-flex sm:gap-1 sm:w-auto sm:overflow-x-auto sm:rounded-[8px]"
        >
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={[
                // Mobile card style
                "flex-col gap-1.5 h-auto min-h-[72px] w-full rounded-[10px] py-3.5 px-3",
                "bg-white border border-line/80 text-[13px] font-semibold text-muted",
                "hover:border-teal/50 hover:text-teal-deep hover:bg-teal/[0.03]",
                "data-[state=active]:bg-ink data-[state=active]:text-white data-[state=active]:border-ink data-[state=active]:shadow-sm",
                // Desktop — restore original look
                "sm:flex-row sm:h-10 sm:min-h-0 sm:w-auto sm:rounded-[6px] sm:py-0 sm:px-4 sm:gap-2",
                "sm:border-0 sm:bg-transparent sm:text-[14.5px]",
                "sm:hover:border-0 sm:hover:bg-transparent",
                "sm:data-[state=active]:bg-ink sm:data-[state=active]:border-0 sm:data-[state=active]:shadow-none",
              ].join(" ")}
            >
              <t.icon className="size-5 sm:size-4" aria-hidden="true" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-8">
          <TabsContent value="details">
            <MyDetails />
          </TabsContent>
          <TabsContent value="analyses">
            <MyAnalyses />
          </TabsContent>
          <TabsContent value="invoices">
            <MyInvoices />
          </TabsContent>
          <TabsContent value="enquiries">
            <MyEnquiries />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
