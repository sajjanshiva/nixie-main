import { cn } from "@/lib/cn";

export default function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cn("flex flex-col items-center rounded-[28px] border border-dashed border-line-strong px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-cyan-soft text-teal-deeper">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="font-display text-2xl">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
