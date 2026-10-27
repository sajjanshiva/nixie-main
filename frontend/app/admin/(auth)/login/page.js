import { Suspense } from "react";
import AdminLogin from "@/components/admin/auth/AdminLogin";

export const metadata = { title: "Log in" };

export default function Page() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}
