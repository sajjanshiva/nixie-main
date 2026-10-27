"use client";
// shadcn-style Select (built on Radix): keyboard, screen readers and mobile all handled.
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldBase } from "./Input";

export default function Select({ value, onValueChange, options, placeholder = "Select", invalid, id, className, disabled, ...aria }) {
  return (
    <SelectPrimitive.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        {...aria}
        className={cn(
          fieldBase,
          "flex h-12 items-center justify-between gap-2 text-left data-[placeholder]:text-[#8aa0a1]",
          invalid ? "ring-danger" : "ring-line-strong hover:ring-[#7fb5b6]",
          className
        )}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[90] max-h-[min(360px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-surface shadow-float ring-1 ring-line"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((opt) => {
              const o = typeof opt === "string" ? { value: opt, label: opt } : opt;
              return (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="relative flex cursor-pointer select-none items-center rounded-xl py-2.5 pl-3 pr-9 text-[15px] text-ink outline-none data-[highlighted]:bg-cyan-soft data-[state=checked]:font-semibold"
                >
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3">
                    <Check className="size-4 text-teal-deep" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
