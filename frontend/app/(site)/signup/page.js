import { Suspense } from "react";
import SignupForm from "@/components/site/auth/SignupForm";

export const metadata = { title: "Create an account", robots: { index: false } };

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
