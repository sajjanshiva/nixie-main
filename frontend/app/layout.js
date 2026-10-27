import { Cormorant_Garamond } from "next/font/google";
import Providers from "@/components/providers/Providers";
import "./globals.css";

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Nixie — Custom outfits, made from your inspiration", template: "%s | Nixie" },
  description:
    "Upload a photo of any outfit you love and get an instant price estimate. Nixie makes it from scratch, made to your measurements.",
  openGraph: {
    type: "website",
    siteName: "Nixie",
    images: [{ url: "/brand/og-default.jpg", width: 1200, height: 630, alt: "Nixie" }],
  },
};

export const viewport = {
  themeColor: "#f0fffe",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={headingFont.variable}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
