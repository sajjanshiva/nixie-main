// Joins class names and resolves Tailwind conflicts. Used mainly by the shadcn-style parts.
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
