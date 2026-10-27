"use client";
// /admin/invoices/<id>: a draft opens in the editor, anything else shows the details page.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { FileX } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import InvoiceEditor from "./InvoiceEditor";
import InvoiceDetail from "./InvoiceDetail";

export default function InvoiceView({ id }) {
  const sent = useSearchParams().get("sent");
  const [inv, setInv] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await adminApi(`/invoices/${id}`);
      setInv(d.invoice);
    } catch (e) {
      setError(e);
    }
  }, [id]);

  useEffect(() => {
    setInv(null);
    load();
  }, [load, sent]);

  if (error) {
    return (
      <EmptyState
        icon={FileX}
        title={error.status === 404 || error.status === 400 ? "Invoice not found" : "Couldn’t load this invoice"}
        text={error.status === 404 || error.status === 400 ? "It may have been a draft that was deleted." : error.message}
        action={<Button href="/admin/invoices">Back to invoices</Button>}
      />
    );
  }
  if (!inv) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[480px] rounded-[20px]" />
          <Skeleton className="h-[320px] rounded-[20px]" />
        </div>
      </div>
    );
  }
  return inv.status === "draft" ? <InvoiceEditor key={inv.id} invoice={inv} /> : <InvoiceDetail invoice={inv} onChange={setInv} />;
}
