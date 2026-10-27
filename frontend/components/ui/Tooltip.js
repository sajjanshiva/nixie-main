"use client";
// shadcn-style Tooltip (Radix).
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({ content, children, side = "top" }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="z-[95] max-w-xs rounded-lg bg-ink px-2.5 py-1.5 text-[13px] text-white data-[state=delayed-open]:animate-[nx-fade-in_.15s_ease-out]"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-ink" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
