"use client";
// One enquiry form, opened from 3 places:
//   /contact?analysis=<id>   after an AI analysis (analysis card attached, no photo upload)
//   /contact?gallery=<slug>  from a gallery image (image attached, no photo upload)
//   /contact                 general enquiry (optional photo upload)
// Login is required in every version.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { getAnalysis, putAnalysis } from "@/lib/analysisCache";
import { setPendingContact } from "@/lib/guestFlow";
import { AnalysisSummary, GallerySummary } from "./Summaries";
import ContactForm from "./ContactForm";
import ThankYou from "./ThankYou";

export default function ContactPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const analysisId = params.get("analysis");
  const gallerySlug = params.get("gallery");
  const { customer, loading } = useAuth();

  const [analysis, setAnalysis] = useState(() => (analysisId ? getAnalysis(analysisId) : null));
  const [gallery, setGallery] = useState(null);
  const [attachError, setAttachError] = useState("");
  const [sent, setSent] = useState(null);
  const redirected = useRef(false);

  // Login required
  useEffect(() => {
    if (loading || customer || redirected.current) return;
    redirected.current = true;
    if (analysisId) setPendingContact(analysisId);
    const here = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [loading, customer, analysisId, pathname, params, router]);

  // Load what's attached
  useEffect(() => {
    if (!customer) return;
    let alive = true;
    setAttachError("");
    if (analysisId) {
      api(`/analyses/${analysisId}`)
        .then(({ analysis: a }) => {
          if (!alive) return;
          putAnalysis(a);
          setAnalysis(a);
        })
        .catch(() => alive && setAttachError("This analysis is no longer available. You can still send us a general enquiry."));
    } else if (gallerySlug) {
      api(`/gallery/${encodeURIComponent(gallerySlug)}`)
        .then(({ image }) => alive && setGallery(image))
        .catch(() => alive && setAttachError("This gallery image is no longer available. You can still send us a general enquiry."));
    }
    return () => {
      alive = false;
    };
  }, [customer, analysisId, gallerySlug]);

  if (loading || !customer) {
    return (
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.2fr]">
        <Skeleton className="h-72 rounded-[32px]" />
        <Skeleton className="h-[640px] rounded-[32px]" />
      </div>
    );
  }

  const kind = attachError ? "general" : analysisId ? "analysis" : gallerySlug ? "gallery" : "general";
  const attachLoading = (kind === "analysis" && !analysis) || (kind === "gallery" && !gallery);

  const heading = {
    analysis: { title: "Let’s make this for you", text: "Share your details and anything you’d like to change. We’ll call you to talk it through." },
    gallery: { title: "Ask us about this look", text: "Tell us what you love about it and what you’d change. We’ll get back to you soon." },
    general: { title: "Tell us what you have in mind", text: "A look you love, a date to dress for, a question about fabric. We read every message." },
  }[kind];

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-8 sm:px-8 lg:pt-14">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <ThankYou key="thanks" lead={sent} />
        ) : (
          <motion.div
            key="form"
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:gap-16"
          >
            <div className="flex flex-col gap-7 lg:sticky lg:top-28">
              <div>
                <h1 className="font-display text-[48px] leading-[0.98] sm:text-[60px]">{heading.title}</h1>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">{heading.text}</p>
              </div>
              {attachError && <p className="rounded-2xl bg-yellow-soft px-4 py-3 text-[14.5px] text-ink">{attachError}</p>}
              {kind === "analysis" && (analysis ? <AnalysisSummary analysis={analysis} /> : <Skeleton className="h-40 rounded-[28px]" />)}
              {kind === "gallery" && (gallery ? <GallerySummary image={gallery} /> : <Skeleton className="h-40 rounded-[28px]" />)}
            </div>

            <ContactForm
              customer={customer}
              kind={kind}
              analysisId={kind === "analysis" ? analysis?.id : null}
              galleryImageId={kind === "gallery" ? gallery?.id : null}
              disabled={attachLoading}
              onSent={(lead) => {
                setSent(lead);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
