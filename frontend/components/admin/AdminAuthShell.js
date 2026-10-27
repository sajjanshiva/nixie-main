import Logo from "@/components/ui/Logo";

export default function AdminAuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-admin-side p-12 lg:flex">
        <Logo tone="white" className="h-6 w-auto self-start" />
        <svg aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 size-[520px] text-white/10" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="96" stroke="currentColor" strokeDasharray="4 5" />
          <circle cx="100" cy="100" r="70" stroke="currentColor" />
        </svg>
        <div className="relative">
          <p className="font-display text-[64px] leading-[0.95] text-white">Nixie admin</p>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-admin-side-text">Leads, invoices and the inspiration gallery, in one place.</p>
        </div>
      </aside>
      <div className="flex items-center justify-center bg-mint px-5 py-12">
        <div className="w-full max-w-[420px]">
          <Logo className="mb-10 h-6 w-auto lg:hidden" />
          <h1 className="font-display text-[46px] leading-none">{title}</h1>
          {subtitle && <p className="mt-3 text-[16px] text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
