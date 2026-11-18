import { Caveat } from "next/font/google";
import Providers from "@/components/providers/Providers";
import "./globals.css";

const caveatFont = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["400", "600", "700"],
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
  themeColor: "#fffcf0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={caveatFont.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-mint text-ink font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
