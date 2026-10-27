"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import FormError from "@/components/ui/FormError";
import EmptyState from "@/components/ui/EmptyState";
import { Card, FilterChips, LeadTypeBadge, LoadMore, PageHeader, SearchBox } from "../ui";
import usePagedList from "../usePagedList";
import LeadPanel from "./LeadPanel";
import { dateTime, timeAgo } from "@/lib/format";

const TYPES = [
  { value: "", label: "All" },
  { value: "ai_analysis", label: "AI analysis" },
  { value: "general", label: "General enquiry" },
];

export default function LeadsPage() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(params.get("open"));
  const list = usePagedList("/leads", "leads", { type, q, limit: 25 });

  // keep ?open=<id> in the address bar so a lead can be bookmarked/shared
  useEffect(() => {
    const qs = openId ? `?open=${openId}` : "";
    window.history.replaceState(null, "", `${pathname}${qs}`);
  }, [openId, pathname]);

  const searching = type || q;

  return (
    <>
      <PageHeader title="Leads" subtitle="Every enquiry from the website, newest first." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips value={type} onChange={setType} options={TYPES} label="Lead type" />
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email or phone" className="w-full lg:w-80" />
      </div>

      <FormError message={list.error} />

      {list.loading && list.items.length === 0 ? (
        <Card className="flex flex-col gap-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </Card>
      ) : list.items.length === 0 && !list.error ? (
        <EmptyState
          icon={Inbox}
          title={searching ? "No leads match" : "No leads yet"}
          text={searching ? "Try a different name, email or phone number." : "They’ll appear here when customers contact you."}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {list.items.map((l) => (
              <li key={l.id} className="border-t border-line first:border-0">
                <button
                  type="button"
                  onClick={() => setOpenId(l.id)}
                  className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-mint sm:grid-cols-[36px_1.4fr_1fr_auto_140px] sm:gap-4 sm:px-5"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-cyan-soft text-[14px] font-bold text-teal-deeper">
                    {(l.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{l.name}</span>
                    <span className="block truncate text-[13px] text-muted">{l.email}</span>
                  </span>
                  <span className="hidden truncate text-[14px] tabular-nums sm:block">{l.phone}</span>
                  <LeadTypeBadge type={l.type} />
                  <span className="hidden text-right text-[13px] text-muted sm:block" title={dateTime(l.createdAt)}>
                    {timeAgo(l.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loading} onClick={list.loadMore} />

      <LeadPanel
        id={openId}
        initial={list.items.find((l) => l.id === openId)}
        onClose={() => setOpenId(null)}
        onDeleted={(id) => {
          list.setItems((items) => items.filter((l) => l.id !== id));
          setOpenId(null);
        }}
      />
    </>
  );
}
