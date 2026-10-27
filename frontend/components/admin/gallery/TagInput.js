"use client";
// Type a tag and press Enter or comma. Backspace on an empty box removes the last tag.
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export default function TagInput({ value = [], onChange, id, invalid, placeholder = "Add a tag" }) {
  const [text, setText] = useState("");

  function add(raw) {
    const parts = raw
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter((t) => t && t.length <= 40);
    if (!parts.length) return;
    const next = [...value];
    for (const t of parts) if (!next.includes(t) && next.length < 20) next.push(t);
    onChange(next);
    setText("");
  }

  return (
    <div
      className={cn(
        "flex min-h-12 flex-wrap items-center gap-1.5 rounded-[14px] bg-surface px-2.5 py-2 ring-1 ring-inset focus-within:ring-2 focus-within:ring-teal-deep",
        invalid ? "ring-danger" : "ring-line-strong"
      )}
    >
      {value.map((t) => (
        <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-cyan-soft pl-3 pr-1 text-[13.5px] font-semibold text-teal-deeper">
          {t}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== t))}
            className="flex size-6 items-center justify-center rounded-full hover:bg-white"
            aria-label={`Remove tag ${t}`}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) add(v);
          else setText(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => text && add(text)}
        placeholder={value.length ? "" : placeholder}
        className="h-8 min-w-[120px] flex-1 bg-transparent px-1.5 text-[15px] outline-none placeholder:text-[#8aa0a1]"
      />
    </div>
  );
}
