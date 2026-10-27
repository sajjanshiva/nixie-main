import { Suspense } from "react";
import ProfilePage from "@/components/site/profile/ProfilePage";

export const metadata = { title: "My profile", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}
