import { cn } from "@/lib/cn";

const TONES = {
  yellow: "bg-yellow text-ink",
  teal: "bg-cyan-soft text-teal-deeper",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  gray: "bg-[#e3eeee] text-[#2f4243]",
  dark: "bg-ink text-white",
};

export default function Badge({ tone = "gray", className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold leading-none", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Invoice status → badge */
export function InvoiceStatusBadge({ status }) {
  const map = {
    draft: ["gray", "Draft"],
    sent: ["teal", "Unpaid"],
    partially_paid: ["yellow", "Partially paid"],
    paid: ["green", "Paid"],
    cancelled: ["red", "Cancelled"],
  };
  const [tone, label] = map[status] || ["gray", status];
  return <Badge tone={tone}>{label}</Badge>;
}
