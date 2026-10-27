"use client";
// Upload up to 5 images → AI suggests a title + tags for each (one by one) → admin edits → Publish all.
// Each image is published in its own request so uploads stay small.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, ImagePlus, RotateCcw, Sparkles, UploadCloud, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input, { Textarea } from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader } from "../ui";
import TagInput from "./TagInput";
import { adminApi } from "@/lib/adminApi";
import { checkImageFile, compressImage } from "@/lib/compress";
import { cn } from "@/lib/cn";

const MAX = 5;
const BIG = 4 * 1024 * 1024; // files above 4 MB are shrunk (2400px, 92% quality)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = 0;

export default function GalleryUpload() {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef(null);
  const [cards, setCards] = useState([]); // { key, file, url, title, tags, description, status, error, aiFailed }
  const [phase, setPhase] = useState("idle"); // idle | suggesting | publishing
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [pickError, setPickError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => cards.forEach((c) => URL.revokeObjectURL(c.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (key, p) => setCards((list) => list.map((c) => (c.key === key ? { ...c, ...p } : c)));

  async function addFiles(fileList) {
    setPickError("");
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = MAX - cards.length;
    if (room <= 0) return setPickError("Max 5 images at a time. Publish these first.");
    const problems = [];
    const ok = [];
    for (const f of files) {
      const p = checkImageFile(f);
      if (p) problems.push(`${f.name}: ${p}`);
      else ok.push(f);
    }
    if (ok.length > room) problems.push(`Only ${room} more image${room === 1 ? "" : "s"} can be added (max 5 at a time).`);
    if (problems.length) setPickError(problems.join(" "));
    const chosen = ok.slice(0, room);
    if (!chosen.length) return;

    const fresh = [];
    for (const f of chosen) {
      const file = f.size > BIG ? await compressImage(f, { maxDimension: 2400, quality: 0.92, minBytes: BIG }) : f;
      fresh.push({ key: `g${++seq}`, file, url: URL.createObjectURL(file), title: "", tags: [], description: "", status: "waiting", error: "", aiFailed: false });
    }
    setCards((list) => [...list, ...fresh]);
    suggest(fresh);
  }

  // One image per request, one after another, with a small gap (protects the shared AI limit)
  async function suggest(list) {
    setPhase("suggesting");
    setProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      patch(c.key, { status: "suggesting" });
      try {
        const fd = new FormData();
        fd.append("photo", c.file);
        const d = await adminApi("/gallery/suggest", { method: "POST", body: fd });
        patch(c.key, {
          status: "ready",
          title: d.aiFailed ? "" : d.title || "",
          tags: d.aiFailed ? [] : d.tags || [],
          description: d.aiFailed ? "" : d.description || "",
          aiFailed: !!d.aiFailed,
        });
      } catch {
        patch(c.key, { status: "ready", aiFailed: true });
      }
      setProgress({ done: i + 1, total: list.length });
      if (i < list.length - 1) await wait(800);
    }
    setPhase("idle");
  }

  // Retry AI suggestion for a single card (does not affect other cards)
  async function retrySingle(cardKey) {
    const card = cards.find((c) => c.key === cardKey);
    if (!card) return;
    patch(cardKey, { status: "suggesting", aiFailed: false });
    try {
      const fd = new FormData();
      fd.append("photo", card.file);
      const d = await adminApi("/gallery/suggest", { method: "POST", body: fd });
      patch(cardKey, {
        status: "ready",
        title: d.aiFailed ? card.title : d.title || card.title,
        tags: d.aiFailed ? card.tags : d.tags || card.tags,
        description: d.aiFailed ? card.description : d.description || card.description,
        aiFailed: !!d.aiFailed,
      });
    } catch {
      patch(cardKey, { status: "ready", aiFailed: true });
    }
  }

  async function publishAll() {
    let firstBad = null;
    for (const c of cards) {
      if (!c.title.trim()) {
        patch(c.key, { error: "Title is required" });
        firstBad = firstBad || c.key;
      }
    }
    if (firstBad) {
      document.getElementById(`card-${firstBad}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setPhase("publishing");
    const queue = [...cards];
    setProgress({ done: 0, total: queue.length });
    let published = 0;
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      patch(c.key, { status: "publishing", error: "" });
      try {
        const fd = new FormData();
        fd.append("photos", c.file);
        fd.append("items", JSON.stringify([{ title: c.title.trim(), description: c.description.trim() || undefined, tags: c.tags }]));
        await adminApi("/gallery", { method: "POST", body: fd });
        published += 1;
        URL.revokeObjectURL(c.url);
        setCards((list) => list.filter((x) => x.key !== c.key));
      } catch (e) {
        patch(c.key, { status: "ready", error: e.fields ? Object.values(e.fields)[0] : e.message });
      }
      setProgress({ done: i + 1, total: queue.length });
    }
    setPhase("idle");
    if (published === queue.length) {
      toast.success(`${published} image${published === 1 ? "" : "s"} published.`);
      router.push("/admin/gallery");
    } else if (published) {
      toast.error(`${published} published. ${queue.length - published} need another try.`);
    } else {
      toast.error("Nothing was published. Check the messages on each image.");
    }
  }

  const busy = phase !== "idle";
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/gallery" className="mb-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Gallery
          </Link>
        }
        title="Upload images"
        subtitle="Max 5 images at a time. AI suggests a title and tags; you can edit everything before publishing."
      />

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {cards.length < MAX && !busy && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-3 rounded-[24px] border-2 border-dashed px-6 py-12 text-center transition",
            dragging ? "border-teal-deep bg-cyan-soft" : "border-line-strong bg-surface hover:border-teal-deep hover:bg-cyan-soft/40"
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-cyan-soft text-teal-deeper">
            <UploadCloud className="size-6" aria-hidden="true" />
          </span>
          <span className="font-display text-[28px] leading-none">{cards.length ? "Add more images" : "Choose images"}</span>
          <span className="text-[14px] text-muted">
            Or drop them here. JPG, PNG or WEBP, up to 10 MB each. {cards.length ? `${MAX - cards.length} more allowed.` : "Max 5 images at a time."}
          </span>
        </button>
      )}
      <div className="mt-4">
        <FormError message={pickError} />
      </div>

      {busy && (
        <Card className="mt-4 p-5" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-[15px] font-semibold">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-deep" aria-hidden="true" />
              {phase === "suggesting" ? "Suggesting tags…" : "Publishing…"} {Math.min(progress.done + 1, progress.total)} / {progress.total}
            </span>
            <span className="tabular-nums text-muted">{pct}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-mint">
            <div className="h-full rounded-full bg-teal-deep transition-[width] duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
          </div>
        </Card>
      )}

      {cards.length > 0 && (
        <>
          <ul className="mt-5 flex flex-col gap-4">
            {cards.map((c, i) => (
              <li key={c.key} id={`card-${c.key}`}>
                <Card className={cn("grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5", c.error && "ring-2 ring-danger")}>
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-2xl bg-cyan-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.url} alt={`Image ${i + 1}`} className="size-full object-cover" />
                    {(c.status === "suggesting" || c.status === "publishing" || c.status === "waiting") && (
                      <div className="absolute inset-0 flex items-end bg-ink/35 p-3">
                        <span className="rounded-full bg-white px-3 py-1 text-[12.5px] font-semibold">
                          {c.status === "waiting" ? "Waiting…" : c.status === "suggesting" ? "Suggesting…" : "Publishing…"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-semibold text-muted">Image {i + 1}</p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          URL.revokeObjectURL(c.url);
                          setCards((list) => list.filter((x) => x.key !== c.key));
                        }}
                        className="-m-1 flex size-9 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    {c.aiFailed && (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-yellow-soft px-3 py-2">
                        <p className="flex items-center gap-2 text-[13.5px]">
                          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                          AI couldn&apos;t suggest details for this one.
                        </p>
                        <button
                          type="button"
                          disabled={c.status === "suggesting" || busy}
                          onClick={() => retrySingle(c.key)}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-semibold text-teal-deeper shadow-sm hover:bg-cyan-soft disabled:opacity-50"
                          aria-label={`Retry AI suggestion for image ${i + 1}`}
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          Retry AI
                        </button>
                      </div>
                    )}
                    {c.error && <p className="text-[13.5px] font-medium text-danger">{c.error}</p>}
                    <Field label="Title">
                      <Input value={c.title} maxLength={120} disabled={c.status !== "ready" && c.status !== "waiting"} onChange={(e) => patch(c.key, { title: e.target.value, error: "" })} />
                    </Field>
                    <Field label="Tags" hint="Press Enter or comma after each tag">
                      <TagInput value={c.tags} onChange={(tags) => patch(c.key, { tags })} />
                    </Field>
                    <Field label="Description" optional>
                      <Textarea rows={2} maxLength={1000} value={c.description} onChange={(e) => patch(c.key, { description: e.target.value })} />
                    </Field>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-4 z-10 mt-6 flex justify-end">
            <Button size="lg" onClick={publishAll} disabled={busy} loading={phase === "publishing"} className="shadow-float">
              <ImagePlus className="size-5" aria-hidden="true" />
              Publish {cards.length === 1 ? "image" : `all ${cards.length}`}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
