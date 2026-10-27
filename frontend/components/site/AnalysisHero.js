"use client";
// First section: upload an outfit photo → AI estimate.
// Desktop: 50/50 split (text left, wide photo filling the right half).
// Mobile: portrait photo full width on top, text and button below.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, Lock, RotateCcw } from "lucide-react";
import heroDesktop from "@/public/brand/hero-desktop.jpg";
import heroMobile from "@/public/brand/hero-mobile.jpg";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { checkImageFile, compressImage } from "@/lib/compress";
import { guestRuns, recordGuestRun } from "@/lib/guestFlow";
import { putAnalysis } from "@/lib/analysisCache";
import { HERO } from "@/lib/content";
import { cn } from "@/lib/cn";

const STATUS = ["Looking at the silhouette", "Matching the fabrics", "Working out your price"];
const ease = [0.22, 1, 0.36, 1];

export default function AnalysisHero() {
  const router = useRouter();
  const { customer, loading: authLoading } = useAuth();
  const inputRef = useRef(null);
  const [stage, setStage] = useState("idle"); // idle | analysing | limit
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null); // { message, priceUnavailable }
  const [limit, setLimit] = useState(null);
  const [dragging, setDragging] = useState(false);

  // How many estimates are left (server is the real limit; browser count is a soft limit)
  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    api("/analyses/limit")
      .then((l) => alive && setLimit(l))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [authLoading, customer]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const guestBlocked = useCallback(() => {
    if (customer) return false;
    const soft = guestRuns().length >= 3;
    return soft || (limit && !limit.loggedIn && limit.remaining <= 0);
  }, [customer, limit]);

  function openPicker() {
    setError(null);
    if (guestBlocked()) {
      setStage("limit");
      return;
    }
    inputRef.current?.click();
  }

  async function run(file) {
    setError(null);
    const problem = checkImageFile(file);
    if (problem) {
      setError({ message: problem });
      return;
    }
    if (guestBlocked()) {
      setStage("limit");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setStage("analysing");

    try {
      const photo = await compressImage(file);
      const fd = new FormData();
      fd.append("photo", photo);
      const { analysis } = await api("/analyses", { method: "POST", body: fd });
      putAnalysis(analysis);
      if (!customer) recordGuestRun();
      router.push(`/analysis/${analysis.id}`);
    } catch (err) {
      if (err.code === "GUEST_LIMIT") {
        setStage("limit");
        return;
      }
      setStage("idle");
      setError({
        message:
          err.code === "PRICE_UNAVAILABLE"
            ? "We couldn’t price this outfit automatically. Send it to us and our team will give you a price."
            : err.message,
        priceUnavailable: err.code === "PRICE_UNAVAILABLE",
      });
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (file) run(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (stage !== "idle") return;
    const file = e.dataTransfer.files?.[0];
    if (file) run(file);
  }

  const remainingText = (() => {
    if (!limit) return "3 free estimates a day. No account needed.";
    if (limit.loggedIn) return limit.remaining < 5 ? `${limit.remaining} estimates left this hour.` : null;
    if (limit.remaining >= 3) return "3 free estimates a day. No account needed.";
    if (limit.remaining <= 0) return "You’ve used today’s free estimates.";
    return `${limit.remaining} free estimate${limit.remaining === 1 ? "" : "s"} left today.`;
  })();

  const panel = (
    <AnimatePresence mode="wait" initial={false}>
      {stage === "analysing" ? (
        <Analysing key="analysing" preview={preview} />
      ) : stage === "limit" ? (
        <LimitReached key="limit" onBack={() => setStage("idle")} />
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease }}
          className="flex flex-col items-center gap-6 text-center md:items-start md:text-left"
        >
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.05 }}
            className="font-display text-[44px] leading-[0.98] text-ink sm:text-[56px] lg:text-[72px] xl:text-[80px]"
          >
            {HERO.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.18 }}
            className="max-w-[440px] text-[17px] leading-relaxed text-muted lg:text-lg"
          >
            {HERO.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            className="flex w-full flex-col items-center gap-3 md:items-start"
          >
            <Button size="lg" onClick={openPicker} className="w-full max-w-sm md:w-auto">
              <ImagePlus className="size-5" aria-hidden="true" />
              Upload your outfit
            </Button>
            {remainingText && (
              <p className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                <span className="size-2 rounded-[2px] bg-yellow" aria-hidden="true" />
                {remainingText}
              </p>
            )}
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-md overflow-hidden"
                role="alert"
              >
                <div className="rounded-2xl bg-danger-soft px-4 py-3 text-left text-[14.5px] leading-snug text-danger">
                  {error.message}
                  {error.priceUnavailable && (
                    <div className="mt-3">
                      <Button href="/contact" size="sm" variant="dark">
                        Contact us
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="estimate" aria-label="Get a price estimate" className="relative bg-mint">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={onFile} />

      {/* Mobile */}
      <div className="md:hidden">
        <div className="border-y-[3px] border-teal">
          <Image src={heroMobile} alt="Model wearing a white Nixie outfit" priority quality={95} sizes="100vw" className="block h-auto w-full" />
        </div>
        <div className="px-6 pb-14 pt-9">{panel}</div>
      </div>

      {/* Desktop */}
      <div
        className="relative hidden h-[calc(100svh-72px)] max-h-[768px] min-h-[560px] md:flex"
        onDragOver={(e) => {
          e.preventDefault();
          if (stage === "idle") setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={onDrop}
      >
        <div className="relative flex w-1/2 items-center px-10 lg:px-16 xl:px-24">
          <div className="w-full max-w-[560px]">{panel}</div>
          <AnimatePresence>
            {dragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-5 flex items-center justify-center rounded-[32px] border-2 border-dashed border-teal-deep bg-cyan-soft/80"
              >
                <p className="font-display text-4xl text-teal-deeper">Drop your photo</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="relative w-1/2 overflow-hidden"
        >
          <Image
            src={heroDesktop}
            alt="Model wearing a white Nixie outfit"
            priority
            quality={95}
            fill
            sizes="50vw"
            className="object-cover object-right-top"
          />
        </motion.div>
      </div>
    </section>
  );
}

/** Uploaded photo with a cyan scan line + status text that changes while the AI works. */
function Analysing({ preview }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, STATUS.length - 1)), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-col items-center gap-7 md:flex-row md:items-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative aspect-[3/4] w-48 shrink-0 overflow-hidden rounded-[26px] bg-cyan-soft ring-1 ring-line sm:w-56">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your uploaded outfit" className="size-full object-cover" />
        )}
        <div className="absolute inset-0 bg-teal/10" />
        <div
          className="absolute inset-x-0 top-0 h-[10%] animate-[nx-scan_2.6s_ease-in-out_infinite]"
          aria-hidden="true"
        >
          <div className="h-full bg-gradient-to-b from-transparent to-cyan/50" />
          <div className="h-[2px] bg-cyan shadow-[0_0_18px_4px_rgba(84,235,235,0.75)]" />
        </div>
        {["left-3 top-3 border-l-2 border-t-2", "right-3 top-3 border-r-2 border-t-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"].map((c) => (
          <span key={c} className={cn("absolute size-5 rounded-[3px] border-white", c)} aria-hidden="true" />
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
        <p className="font-display text-[34px] leading-tight lg:text-[40px]">Reading your outfit…</p>
        <ul className="flex flex-col gap-2.5">
          {STATUS.map((s, n) => (
            <li key={s} className={cn("flex items-center gap-3 text-[15px] transition-colors duration-500", n <= i ? "text-ink" : "text-muted/50")}>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full transition-colors duration-500",
                  n < i ? "bg-teal-deep" : n === i ? "bg-cyan" : "bg-line"
                )}
                aria-hidden="true"
              >
                {n === i && <span className="size-1.5 animate-ping rounded-full bg-ink" />}
                {n < i && (
                  <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 6.2 5 8.5l4.5-5" />
                  </svg>
                )}
              </span>
              {s}
            </li>
          ))}
        </ul>
        <p className="text-[13.5px] text-muted">This usually takes a few seconds.</p>
      </div>
    </motion.div>
  );
}

function LimitReached({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-col items-center gap-5 text-center md:items-start md:text-left"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-yellow">
        <Lock className="size-6" aria-hidden="true" />
      </span>
      <h2 className="font-display text-[40px] leading-[1.02] lg:text-[52px]">You’ve used your 3 free estimates</h2>
      <p className="max-w-md text-[17px] leading-relaxed text-muted">
        Log in to keep going. Your estimates are saved to your profile, and you can contact us about any of them.
      </p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button href="/login?next=%2F%23estimate" size="lg">
          Log in to continue
        </Button>
        <Button href="/signup?next=%2F%23estimate" size="lg" variant="outline">
          Create an account
        </Button>
      </div>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink">
        <RotateCcw className="size-4" aria-hidden="true" />
        Back
      </button>
    </motion.div>
  );
}
