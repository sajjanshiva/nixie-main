import { Suspense } from "react";
import AdminReset from "@/components/admin/auth/AdminReset";

export const metadata = { title: "New password" };

export default function Page() {
  return (
    <Suspense>
      <AdminReset />
    </Suspense>
  );
}
