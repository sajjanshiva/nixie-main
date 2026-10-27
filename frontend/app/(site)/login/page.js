import { Suspense } from "react";
import LoginForm from "@/components/site/auth/LoginForm";

export const metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
