import { AdminProvider } from "@/components/admin/AdminProvider";

export const metadata = {
  title: { default: "Admin", template: "%s | Nixie Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }) {
  return <AdminProvider>{children}</AdminProvider>;
}
