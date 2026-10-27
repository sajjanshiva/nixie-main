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
        <TabsList aria-label="Profile sections" className="max-w-full sm:inline-flex">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              <t.icon className="size-4" aria-hidden="true" />
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
