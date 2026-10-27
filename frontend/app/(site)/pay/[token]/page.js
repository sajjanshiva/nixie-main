import { Suspense } from "react";
import PayPage from "@/components/site/pay/PayPage";

export const metadata = { title: "Pay your invoice", robots: { index: false, follow: false } };

export default async function Page({ params }) {
  const { token } = await params;
  return (
    <Suspense>
      <PayPage token={token} />
    </Suspense>
  );
}
