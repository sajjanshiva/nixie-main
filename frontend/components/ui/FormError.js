import { CircleAlert } from "lucide-react";

export default function FormError({ message, children }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-danger-soft px-4 py-3 text-[14.5px] leading-snug text-danger">
      <CircleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
      <p>
        {message}
        {children}
      </p>
    </div>
  );
}
