import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const fieldBase =
  "w-full rounded-[6px] bg-surface px-4 text-[15px] text-ink placeholder:text-[#8aa0a1] ring-1 ring-inset transition-shadow duration-150 outline-none focus:ring-2 focus:ring-teal-deep disabled:bg-mint disabled:text-muted";

const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(fieldBase, "h-12", invalid ? "ring-danger" : "ring-line-strong hover:ring-[#7fb5b6]", className)}
      {...props}
    />
  );
});
export default Input;

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldBase, "resize-y py-3 leading-relaxed", invalid ? "ring-danger" : "ring-line-strong hover:ring-[#7fb5b6]", className)}
      {...props}
    />
  );
});
