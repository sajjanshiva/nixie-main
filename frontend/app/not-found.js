import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-mint px-6 text-center">
      <Link href="/" aria-label="Nixie home">
        <Logo className="h-6 w-auto" />
      </Link>
      <p className="font-display mt-14 text-[120px] leading-none text-teal sm:text-[180px]">404</p>
      <h1 className="font-display mt-2 text-[40px] leading-tight sm:text-[52px]">This page has gone out of style</h1>
      <p className="mt-3 max-w-md text-[17px] text-muted">The link may be old, or the page was moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClass({ size: "lg" })}>
          Back to home
        </Link>
        <Link href="/gallery" className={buttonClass({ size: "lg", variant: "outline" })}>
          Browse inspiration
        </Link>
      </div>
    </div>
  );
}
