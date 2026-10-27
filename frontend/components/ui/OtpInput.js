"use client";
// Six boxes for the 6-digit email code. Supports paste and phone autofill.
import { useRef } from "react";
import { cn } from "@/lib/cn";

export default function OtpInput({ value, onChange, invalid, disabled, autoFocus }) {
  const refs = useRef([]);
  const digits = (value || "").padEnd(6, " ").slice(0, 6).split("");

  function setAt(i, ch) {
    const arr = (value || "").padEnd(6, " ").slice(0, 6).split("");
    arr[i] = ch;
    onChange(arr.join("").replace(/\s+$/g, "").replace(/\s/g, ""));
  }

  function onInput(i, e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 1) {
      // pasted or autofilled several digits
      const next = raw.slice(0, 6);
      onChange(next);
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    setAt(i, raw || " ");
    if (raw && i < 5) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
      e.preventDefault();
      setAt(i - 1, " ");
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d.trim()}
          onChange={(e) => onInput(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={6}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "h-14 w-full min-w-0 rounded-2xl bg-surface text-center font-display text-3xl text-ink ring-1 ring-inset outline-none transition focus:ring-2 focus:ring-teal-deep sm:h-16",
            invalid ? "ring-danger" : d.trim() ? "ring-ink" : "ring-line-strong"
          )}
        />
      ))}
    </div>
  );
}
