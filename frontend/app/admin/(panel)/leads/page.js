import { Suspense } from "react";
import LeadsPage from "@/components/admin/leads/LeadsPage";

export const metadata = { title: "Leads" };

export default function Page() {
  return (
    <Suspense>
      <LeadsPage />
    </Suspense>
  );
}
