"use client";
// Result of an AI analysis: the photo + a Nixie "price tag".
// Also opened from Profile → My analyses (same screen).
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ImagePlus, MessageCircle, SearchX } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { getAnalysis, putAnalysis } from "@/lib/analysisCache";
import { setPendingContact } from "@/lib/guestFlow";
import { date, rupees } from "@/lib/format";
import IkImage from "@/components/ui/IkImage";
import { ESTIMATE_NOTE } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1];

export default function AnalysisResult({ id }) {
  const router = useRouter();
  const { customer, loading: authLoading } = useAuth();
  const [analysis, setAnalysis] = useState(() => getAnalysis(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return; // owner check on the server needs the login cookie state settled
    let alive = true;
    api(`/analyses/${id}`)
      .then(({ analysis: a }) => {
        if (!alive) return;
        putAnalysis(a);
        setAnalysis(a);
      })
      .catch((e) => alive && !getAnalysis(id) && setError(e));
    return () => {
      alive = false;
    };
  }, [id, authLoading]);

  function contact() {
    if (customer) {
      router.push(`/contact?analysis=${id}`);
    } else {
      setPendingContact(id);
      router.push(`/login?next=${encodeURIComponent(`/contact?analysis=${id}`)}`);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <EmptyState
          icon={SearchX}
          title="This estimate isn’t available"
          text={error.status === 404 ? "It may have expired, or it belongs to another account." : error.message}
          action={
            <Button href="/#estimate" size="lg">
              Get a new estimate
            </Button>
          }
        />
      </div>
    );
  }

  if (!analysis) return <ResultSkeleton />;

  const fabrics = [analysis.primaryFabric, ...(analysis.secondaryFabrics || [])].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-8 sm:px-8 lg:pt-12">
      {customer && (
        <Link href="/profile?tab=analyses" className="mb-6 inline-flex items-center gap-2 text-[14px] font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My analyses
        </Link>
      )}

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }}
          className="relative mx-auto w-full max-w-[460px] lg:sticky lg:top-24"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] bg-cyan-soft ring-1 ring-line">
            <IkImage
              src={analysis.imageUrl}
              alt={`Your uploaded outfit: ${analysis.outfitType}`}
              fill
              priority
              sizes="(min-width: 1024px) 460px, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mt-3 text-center text-[13px] text-muted">Analysed on {date(analysis.createdAt)}</p>
        </motion.div>

        {/* Price tag */}
        <div className="relative pt-10">
          {/* string */}
          <svg aria-hidden="true" className="absolute left-1/2 top-0 h-12 w-20 -translate-x-1/2 text-ink/60 lg:left-[30px] lg:translate-x-0" viewBox="0 0 80 48" fill="none">
            <path d="M40 0 C 30 18, 52 26, 40 46" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <motion.article
            initial={{ opacity: 0, rotate: -5, y: -20 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, mass: 0.9, delay: 0.15 }}
            style={{ transformOrigin: "50% 0%" }}
            className="relative rounded-[36px] bg-surface p-7 pt-12 shadow-float ring-1 ring-line sm:p-10 sm:pt-14"
          >
            {/* punched hole */}
            <span className="absolute left-1/2 top-5 size-5 -translate-x-1/2 rounded-full bg-mint ring-2 ring-line-strong lg:left-[60px] lg:translate-x-0" aria-hidden="true" />
            {/* stitched inner border */}
            <span className="pointer-events-none absolute inset-3 rounded-[28px] border border-dashed border-line-strong" aria-hidden="true" />

            <div className="relative">
              <p className="text-[15px] font-semibold text-teal-deep">Your Nixie estimate</p>
              <p className="font-display mt-1 text-[68px] leading-none tracking-tight sm:text-[88px]">{rupees(analysis.estimatedPrice)}</p>

              {analysis.aiComment && (
                <p className="font-display mt-6 max-w-[30ch] text-[24px] leading-snug text-teal-deeper sm:text-[27px]">
                  “{analysis.aiComment}”
                </p>
              )}

              <dl className="mt-8 grid gap-5 border-t border-dashed border-line-strong pt-6 sm:grid-cols-2">
                <div>
                  <dt className="text-[13px] font-semibold text-muted">Outfit</dt>
                  <dd className="mt-1 text-[17px] font-semibold">{analysis.outfitType}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold text-muted">Fabrics</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {fabrics.map((f, i) => (
                      <span
                        key={`${f}-${i}`}
                        className={i === 0 ? "rounded-full bg-ink px-3 py-1.5 text-[13.5px] font-semibold text-white" : "rounded-full bg-cyan-soft px-3 py-1.5 text-[13.5px] font-semibold text-teal-deeper"}
                      >
                        {f}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              <p className="mt-7 rounded-2xl bg-yellow-soft px-4 py-3 text-[14px] leading-relaxed text-ink">{ESTIMATE_NOTE}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={contact} className="sm:flex-1">
                  <MessageCircle className="size-5" aria-hidden="true" />
                  Contact us about this
                </Button>
                <Button href="/#estimate" size="lg" variant="outline" className="sm:flex-1">
                  <ImagePlus className="size-5" aria-hidden="true" />
                  Analyse another
                </Button>
              </div>
              {!customer && !authLoading && (
                <p className="mt-4 text-center text-[13px] text-muted sm:text-left">You’ll be asked to log in so we can save this and reach you.</p>
              )}
            </div>
          </motion.article>
        </div>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1180px] gap-10 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16" aria-busy="true">
      <Skeleton className="mx-auto aspect-[3/4] w-full max-w-[460px] rounded-[32px]" />
      <div className="pt-10">
        <Skeleton className="h-[460px] rounded-[36px]" />
      </div>
    </div>
  );
}
