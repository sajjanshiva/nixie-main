import { Suspense } from "react";
import ContactPage from "@/components/site/contact/ContactPage";

export const metadata = { title: "Contact us", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ContactPage />
    </Suspense>
  );
}
