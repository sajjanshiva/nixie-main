import { cn } from "@/lib/cn";
export default function Skeleton({ className, style }) {
  return <div aria-hidden="true" className={cn("nx-skeleton rounded-2xl", className)} style={style} />;
}
