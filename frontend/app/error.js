"use client";
import { buttonClass } from "@/components/ui/Button";

export default function Error({ reset }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-[44px] leading-tight sm:text-[56px]">Something went wrong</h1>
      <p className="mt-3 max-w-md text-[17px] text-muted">Please try again. If it keeps happening, refresh the page.</p>
      <button type="button" onClick={reset} className={`${buttonClass({ size: "lg" })} mt-8`}>
        Try again
      </button>
    </div>
  );
}
