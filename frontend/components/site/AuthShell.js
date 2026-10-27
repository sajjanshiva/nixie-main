// Layout for login / signup / password pages: brand panel + form.
import Image from "next/image";
import heroMobile from "@/public/brand/hero-mobile.jpg";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pt-12">
      <aside className="relative hidden overflow-hidden rounded-[36px] bg-teal lg:block">
        <Image src={heroMobile} alt="" fill sizes="50vw" className="object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-display max-w-[14ch] text-[56px] leading-[0.95] text-white">Every look you love, one place.</p>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-white/90">
            Keep your estimates, send enquiries and pay invoices from your Nixie account.
          </p>
        </div>
      </aside>
      <div className="flex items-center justify-center lg:py-10">
        <div className="w-full max-w-[440px]">
          <h1 className="font-display text-[48px] leading-none sm:text-[56px]">{title}</h1>
          {subtitle && <p className="mt-3 text-[16px] leading-relaxed text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-[13px] text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line-strong" />
      or
      <span className="h-px flex-1 bg-line-strong" />
    </div>
  );
}
