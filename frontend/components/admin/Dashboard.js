"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageUp, Inbox, Plus, Receipt } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import FormError from "@/components/ui/FormError";
import { useAdmin } from "./AdminProvider";
import { Card, InvoiceBadge, LeadTypeBadge, PageHeader } from "./ui";
import { adminApi } from "@/lib/adminApi";
import { paise, timeAgo } from "@/lib/format";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { admin } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi("/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const s = data?.stats;

  return (
    <>
      <PageHeader
        title={greeting()}
        subtitle="Here’s what’s happening at Nixie."
        actions={
          <>
            <Button href="/admin/gallery/upload" variant="outline">
              <ImageUp className="size-[18px]" aria-hidden="true" />
              Upload to gallery
            </Button>
            <Button href="/admin/invoices/new">
              <Plus className="size-[18px]" aria-hidden="true" />
              Create invoice
            </Button>
          </>
        }
      />
      <FormError message={error} />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Overview">
        {!s ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-[20px]" />)
        ) : (
          <>
            <Stat hero label="Received this month" value={paise(s.receivedThisMonthPaise)} sub="Online and recorded payments" />
            <Stat label="New leads this week" value={s.newLeadsThisWeek} sub="Last 7 days" href="/admin/leads" />
            <Stat
              label="Unpaid invoices"
              value={s.unpaidInvoices.count}
              sub={s.unpaidInvoices.count ? `${paise(s.unpaidInvoices.amountPaise)} waiting` : "All caught up"}
              href="/admin/invoices?status=sent"
            />
            <Stat
              label="Balance due"
              value={paise(s.balanceDue.amountPaise)}
              sub={s.balanceDue.count ? `On ${s.balanceDue.count} part-paid invoice${s.balanceDue.count === 1 ? "" : "s"}` : "Nothing pending"}
              href="/admin/invoices?status=partially_paid"
            />
          </>
        )}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="p-5 sm:p-6">
          <ListHead title="Recent leads" href="/admin/leads" />
          {!data ? (
            <RowsSkeleton />
          ) : data.recentLeads.length === 0 ? (
            <Empty icon={Inbox} text="No leads yet. They’ll appear here when customers contact you." />
          ) : (
            <ul>
              {data.recentLeads.map((l) => (
                <li key={l.id} className="border-t border-line first:border-0">
                  <Link href={`/admin/leads?open=${l.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-mint">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-soft text-[14px] font-bold text-teal-deeper">
                      {(l.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{l.name}</span>
                      <span className="block text-[13px] text-muted">{timeAgo(l.createdAt)}</span>
                    </span>
                    <LeadTypeBadge type={l.type} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <ListHead title="Recent payments" href="/admin/invoices" />
          {!data ? (
            <RowsSkeleton />
          ) : data.recentPayments.length === 0 ? (
            <Empty icon={Receipt} text="No payments yet. They’ll appear here once customers pay an invoice." />
          ) : (
            <ul>
              {data.recentPayments.map((p) => (
                <li key={p.id} className="border-t border-line first:border-0">
                  <Link href={`/admin/invoices/${p.invoiceId}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-mint">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold tabular-nums">{p.invoiceLabel}</span>
                      <span className="block truncate text-[13px] text-muted">
                        {p.customerName} · {p.method === "manual" ? "Recorded" : p.kind === "half" ? "Half online" : "Online"} · {timeAgo(p.paidAt)}
                      </span>
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">{paise(p.amountPaise)}</span>
                    <InvoiceBadge status={p.invoiceStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}

function Stat({ label, value, sub, hero, href }) {
  const body = (
    <>
      <p className={hero ? "text-[13px] font-semibold text-white/70" : "text-[13px] font-semibold text-muted"}>{label}</p>
      <p className={`font-display mt-3 text-[34px] leading-none tabular-nums sm:text-[40px] ${hero ? "text-admin-hero-num" : ""}`}>{value}</p>
      <p className={hero ? "mt-2 text-[13px] text-white/70" : "mt-2 text-[13px] text-muted"}>{sub}</p>
    </>
  );
  const cls = hero
    ? "rounded-[20px] bg-admin-hero p-4 text-white sm:p-5"
    : "rounded-[20px] bg-surface p-4 ring-1 ring-line transition sm:p-5" + (href ? " hover:ring-line-strong" : "");
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function ListHead({ title, href }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="font-display text-[28px] leading-none">{title}</h2>
      <Link href={href} className="text-[14px] font-semibold text-teal-deep hover:text-teal-deeper">
        View all
      </Link>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-cyan-soft text-teal-deeper">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="max-w-xs text-[14.5px] text-muted">{text}</p>
    </div>
  );
}
