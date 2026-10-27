import { Suspense } from "react";
import InvoicesPage from "@/components/admin/invoices/InvoicesPage";

export const metadata = { title: "Invoices" };

export default function Page() {
  return (
    <Suspense>
      <InvoicesPage />
    </Suspense>
  );
}
