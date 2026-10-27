"use client";
// shadcn-style Dialog (Radix) with a soft Motion entrance.
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ title, description, children, className, hideClose = false }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-[nx-fade-in_.2s_ease-out] data-[state=closed]:animate-[nx-fade-out_.15s_ease-in]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-surface p-6 shadow-float outline-none sm:p-8",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          "data-[state=open]:animate-[nx-pop-in_.24s_cubic-bezier(.2,.9,.3,1.2)] data-[state=closed]:animate-[nx-fade-out_.15s_ease-in]",
          className
        )}
      >
        {title && <DialogPrimitive.Title className="font-display pr-8 text-3xl leading-tight">{title}</DialogPrimitive.Title>}
        {description ? (
          <DialogPrimitive.Description className="mt-2 text-[15px] text-muted">{description}</DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        <div className={title ? "mt-6" : ""}>{children}</div>
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-mint hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Slide-in panel from the side (mobile menu, admin sidebar on phones). */
export function SheetContent({ title, children, side = "right", className }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/45 data-[state=open]:animate-[nx-fade-in_.2s_ease-out] data-[state=closed]:animate-[nx-fade-out_.15s_ease-in]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-[81] flex w-[88%] max-w-sm flex-col bg-mint shadow-float outline-none",
          side === "right"
            ? "right-0 data-[state=open]:animate-[nx-slide-in-right_.3s_cubic-bezier(.2,.8,.2,1)] data-[state=closed]:animate-[nx-slide-out-right_.2s_ease-in]"
            : "left-0 data-[state=open]:animate-[nx-slide-in-left_.3s_cubic-bezier(.2,.8,.2,1)] data-[state=closed]:animate-[nx-slide-out-left_.2s_ease-in]",
          className
        )}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
