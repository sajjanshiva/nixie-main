"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, FileText, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import FormError from "@/components/ui/FormError";
import EmptyState from "@/components/ui/EmptyState";
import { Card, FilterChips, InvoiceBadge, LoadMore, PageHeader, SearchBox } from "../ui";
import usePagedList from "../usePagedList";
import ExportDialog from "./ExportDialog";
import { date, paise } from "@/lib/format";

const STATUSES = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const initial = STATUSES.some((s) => s.value === params.get("status")) ? params.get("status") : "";
  const [status, setStatus] = useState(initial);
  const [q, setQ] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const list = usePagedList("/invoices", "invoices", { status, q, limit: 25 });

  useEffect(() => {
    window.history.replaceState(null, "", status ? `${pathname}?status=${status}` : pathname);
  }, [status, pathname]);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Create, send and track payments."
        actions={
          <>
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <Download className="size-[18px]" aria-hidden="true" />
              Export
            </Button>
            <Button href="/admin/invoices/new">
              <Plus className="size-[18px]" aria-hidden="true" />
              Create invoice
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips value={status} onChange={setStatus} options={STATUSES} label="Invoice status" />
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email or NX number" className="w-full lg:w-80" />
      </div>

      <FormError message={list.error} />

      {list.loading && list.items.length === 0 ? (
        <Card className="flex flex-col gap-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </Card>
      ) : list.items.length === 0 && !list.error ? (
        <EmptyState
          icon={FileText}
          title={status || q ? "No invoices match" : "No invoices yet"}
          text={status || q ? "Try another status or search." : "Create your first invoice and send it to a customer."}
          action={!status && !q && <Button href="/admin/invoices/new">Create invoice</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-[14.5px]">
              <thead>
                <tr className="border-b border-line text-left text-[12.5px] text-muted">
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((inv) => (
                  <tr key={inv.id} onClick={() => router.push(`/admin/invoices/${inv.id}`)} className="group cursor-pointer border-b border-line last:border-0 hover:bg-mint">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/invoices/${inv.id}`} className="font-semibold tabular-nums group-hover:text-teal-deep">
                        {inv.label || "Draft"}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{date(inv.sentAt || inv.createdAt)}</td>
                    <td className="max-w-[260px] px-5 py-3.5">
                      <span className="block truncate font-semibold">{inv.customerName}</span>
                      <span className="block truncate text-[13px] text-muted">{inv.customerEmail}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <InvoiceBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      <span className="font-semibold">{paise(inv.totalPaise)}</span>
                      {inv.status === "partially_paid" && <span className="block text-[12.5px] text-muted">Paid {paise(inv.paidPaise)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Phone list */}
          <ul className="md:hidden">
            {list.items.map((inv) => (
              <li key={inv.id} className="border-t border-line first:border-0">
                <Link href={`/admin/invoices/${inv.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-mint">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold tabular-nums">{inv.label || "Draft"}</span>
                      <InvoiceBadge status={inv.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">
                      {inv.customerName}, {date(inv.sentAt || inv.createdAt)}
                    </span>
                  </span>
                  <span className="text-right text-[15px] font-semibold tabular-nums">
                    {paise(inv.totalPaise)}
                    {inv.status === "partially_paid" && <span className="block text-[12px] font-normal text-muted">Paid {paise(inv.paidPaise)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loading} onClick={list.loadMore} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </>
  );
}
