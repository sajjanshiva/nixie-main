import { Suspense } from "react";
import ResetForm from "@/components/site/auth/ResetForm";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
