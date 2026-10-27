"use client";
// Our own small toast messages: toast.success("Saved"), toast.error("..."), toast.info("...")
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CircleCheck, ring: "text-success" },
  error: { icon: CircleAlert, ring: "text-danger" },
  info: { icon: Info, ring: "text-teal-deep" },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, ms = 4200) => {
      const id = ++idRef.current;
      setItems((list) => [...list.slice(-2), { id, type, message }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m, ms) => push("success", m, ms),
      error: (m, ms) => push("error", m, ms ?? 6000),
      info: (m, ms) => push("info", m, ms),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const S = STYLES[t.type] || STYLES.info;
            const Icon = S.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role={t.type === "error" ? "alert" : "status"}
                className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-ink px-4 py-3.5 text-[15px] text-white shadow-float"
              >
                <Icon className={`mt-0.5 size-5 shrink-0 ${t.type === "success" ? "text-cyan" : t.type === "error" ? "text-[#ff9b8f]" : "text-cyan"}`} aria-hidden="true" />
                <p className="flex-1 leading-snug">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="-m-1 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
