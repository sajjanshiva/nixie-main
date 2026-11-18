"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Star,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video as VideoIcon,
  MessageSquare,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, Card, FilterChips, SearchBox, ConfirmDialog, LoadMore } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 18;
const EMPTY_STATS = { total: 0, active: 0, photos: 0, videos: 0 };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const reqId = useRef(0);

  // Load one page (18) from the server. Page 1 replaces the list, later pages are added to it.
  const loadPage = useCallback(
    async (p) => {
      const id = ++reqId.current;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const qs = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
        if (filter !== "all") qs.set("status", filter);
        if (search) qs.set("q", search);
        const res = await api(`/admin/reviews?${qs}`);
        if (id !== reqId.current) return;
        const list = Array.isArray(res?.reviews) ? res.reviews : [];
        setReviews((prev) => {
          if (p === 1) return list;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...list.filter((r) => !seen.has(r.id))];
        });
        setHasMore(Boolean(res?.hasMore));
        setStats(res?.stats || EMPTY_STATS);
        setPage(p);
      } catch (err) {
        if (id === reqId.current) console.error("Failed to load reviews:", err);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, search]
  );

  const loadReviews = useCallback(() => loadPage(1), [loadPage]);

  // Reload from page 1 whenever the filter or search changes
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Quick toggle active / hidden
  async function toggleActive(review) {
    const updatedStatus = !review.isActive;
    try {
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isActive: updatedStatus } : r))
      );
      setStats((s) => ({ ...s, active: s.active + (updatedStatus ? 1 : -1) }));
      await api(`/admin/reviews/${review.id}`, {
        method: "PATCH",
        body: { isActive: updatedStatus },
      });
    } catch (err) {
      alert("Failed to toggle review status: " + (err.message || "Unknown error"));
      loadReviews();
    }
  }

  // Delete review
  async function confirmDelete() {
    if (!deletingReview) return;
    const removed = deletingReview;
    setBusyDelete(true);
    try {
      await api(`/admin/reviews/${removed.id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== removed.id));
      setStats((s) => ({
        total: s.total - 1,
        active: s.active - (removed.isActive ? 1 : 0),
        photos: s.photos - (removed.type === "image" ? 1 : 0),
        videos: s.videos - (removed.type === "video" ? 1 : 0),
      }));
      setDeletingReview(null);
    } catch (err) {
      alert("Failed to delete review: " + (err.message || "Unknown error"));
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Client Reviews"
        subtitle="Manage text, photo, and video reviews shown in the customer mosaic on the website."
        actions={
          <Button
            size="md"
            onClick={() => {
              setEditingReview(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add review
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">Total Reviews</p>
          <p className="mt-1 font-display text-[32px] sm:text-[36px] font-bold text-ink">{stats.total}</p>
        </Card>
        <Card className="p-4 sm:p-5 bg-cyan-soft/40 border-teal/20">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-teal-deep">Active on Site</p>
          <p className="mt-1 font-display text-[32px] sm:text-[36px] font-bold text-teal-deeper">{stats.active}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">Photo Reviews</p>
          <p className="mt-1 font-display text-[32px] sm:text-[36px] font-bold text-ink">{stats.photos}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">Video Reviews</p>
          <p className="mt-1 font-display text-[32px] sm:text-[36px] font-bold text-ink">{stats.videos}</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          label="Review status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All (${stats.total})` },
            { value: "active", label: `Active (${stats.active})` },
            { value: "hidden", label: `Hidden (${stats.total - stats.active})` },
          ]}
        />
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search by client, location, outfit..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-cyan-soft text-teal-deep mb-4">
            <Star className="size-7" />
          </div>
          <h2 className="text-[20px] font-bold text-ink">No reviews found</h2>
          <p className="mt-1 text-[14.5px] text-muted max-w-sm">
            {search || filter !== "all"
              ? "Try clearing your search or filter to see more reviews."
              : "No reviews have been added to the database yet. Click below to add your first one!"}
          </p>
          <Button
            size="md"
            className="mt-5"
            onClick={() => {
              setEditingReview(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add review
          </Button>
        </Card>
      ) : (
        <>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <AdminReviewCard
              key={review.id}
              review={review}
              onToggleActive={() => toggleActive(review)}
              onEdit={() => {
                setEditingReview(review);
                setModalOpen(true);
              }}
              onDelete={() => setDeletingReview(review)}
            />
          ))}
        </div>
        <LoadMore hasMore={hasMore} loading={loadingMore} onClick={() => loadPage(page + 1)} />
        </>
      )}

      {/* Create / Edit Dialog */}
      <ReviewFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        review={editingReview}
        onSaved={() => {
          setModalOpen(false);
          loadReviews();
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingReview)}
        onOpenChange={(open) => !open && setDeletingReview(null)}
        title="Delete Review?"
        text={`Are you sure you want to permanently delete the review from "${deletingReview?.clientName}"? This action cannot be undone.`}
        confirmLabel="Delete review"
        busy={busyDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// Single Review Card in Admin Grid
function AdminReviewCard({ review, onToggleActive, onEdit, onDelete }) {
  const { type, clientName, clientLocation, outfitName, rating = 5, quote, mediaUrl, isActive } = review;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-sm">
      {/* Media or Header Banner */}
      {mediaUrl && (type === "image" || type === "video") ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-mint border-b border-line/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt={clientName} className="size-full object-cover" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
            {type === "video" ? <VideoIcon className="size-3" /> : <ImageIcon className="size-3" />}
            <span className="capitalize">{type}</span>
          </div>
          <button
            type="button"
            onClick={onToggleActive}
            className={cn(
              "absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-xs transition-colors",
              isActive ? "bg-success text-white shadow-xs" : "bg-black/60 text-white/80 hover:bg-black/80"
            )}
          >
            {isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {isActive ? "Active" : "Hidden"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-line/60 bg-mint/50 px-5 py-3">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-muted">
            <MessageSquare className="size-3.5 text-teal-deep" />
            <span>Text Review</span>
          </div>
          <button
            type="button"
            onClick={onToggleActive}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors",
              isActive ? "bg-success text-white" : "bg-black/10 text-muted hover:bg-black/20"
            )}
          >
            {isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {isActive ? "Active" : "Hidden"}
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-ink text-[16px] leading-tight">{clientName}</h3>
            {clientLocation && <p className="text-[12.5px] text-muted">{clientLocation}</p>}
          </div>
          {/* Star Rating */}
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("size-3.5", i < rating ? "fill-[#ffc43a] text-[#ffc43a]" : "text-line-strong")}
              />
            ))}
          </div>
        </div>

        {outfitName && (
          <div className="mt-2.5">
            <span className="inline-block rounded-md bg-cyan-soft px-2 py-0.5 text-[11.5px] font-semibold text-teal-deeper">
              {outfitName}
            </span>
          </div>
        )}

        <p className="mt-3 text-[13.5px] leading-relaxed text-muted line-clamp-3 italic">
          “{quote}”
        </p>

        {/* Card Footer Actions */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-line/60 text-[12.5px]">
          <span className="text-muted font-medium capitalize">{type} review</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-mint hover:text-ink transition-colors"
              title="Edit review"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger transition-colors"
              title="Delete review"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Create or Edit Modal Dialog
function ReviewFormDialog({ open, onOpenChange, review, onSaved }) {
  const fileInputRef = useRef(null);
  const [type, setType] = useState("image");
  const [clientName, setClientName] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [outfitName, setOutfitName] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState("tall");
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when editing review changes
  useEffect(() => {
    if (review) {
      setType(review.type || "image");
      setClientName(review.clientName || "");
      setClientLocation(review.clientLocation || "");
      setOutfitName(review.outfitName || "");
      setRating(review.rating || 5);
      setQuote(review.quote || "");
      setMediaUrl(review.mediaUrl || "");
      setAspectRatio(review.aspectRatio || "tall");
      setIsActive(review.isActive !== false);
    } else {
      setType("image");
      setClientName("");
      setClientLocation("");
      setOutfitName("");
      setRating(5);
      setQuote("");
      setMediaUrl("");
      setAspectRatio("tall");
      setIsActive(true);
    }
    setError(null);
  }, [review, open]);

  // Handle direct photo upload
  async function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("photo", file);

    try {
      const res = await api("/admin/reviews/upload", {
        method: "POST",
        body: fd,
      });
      if (res?.url) {
        setMediaUrl(res.url);
      }
    } catch (err) {
      setError("Image upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  }

  // Submit form
  async function handleSubmit(e) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!quote.trim()) {
      setError("Review quote / story text is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      type,
      clientName: clientName.trim(),
      clientLocation: clientLocation.trim() || null,
      outfitName: outfitName.trim() || null,
      rating: Number(rating) || 5,
      quote: quote.trim(),
      mediaUrl: mediaUrl.trim() || null,
      aspectRatio,
      isActive,
    };

    try {
      if (review?.id) {
        await api(`/admin/reviews/${review.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await api("/admin/reviews", {
          method: "POST",
          body: payload,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to save review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={review ? "Edit Review" : "Add Client Review"}
        description="Fill in client feedback details to show in the mosaic gallery."
        className="w-[calc(100%-2rem)] max-w-3xl sm:max-w-3xl rounded-[16px] sm:rounded-[18px] p-6 sm:p-8 max-h-[88vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-3">
          {error && (
            <div className="rounded-[10px] bg-danger-soft p-3.5 text-[13.5px] font-medium text-danger">
              {error}
            </div>
          )}

          {/* Review Type Selection */}
          <div>
            <label className="text-[12.5px] font-bold text-ink uppercase tracking-wider block mb-2">
              Review Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "image", label: "Photo Review", icon: ImageIcon },
                { id: "video", label: "Video Review", icon: VideoIcon },
                { id: "text", label: "Text Quote", icon: MessageSquare },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[12px] p-3 text-[13.5px] font-semibold ring-1 transition-all duration-150 cursor-pointer",
                    type === opt.id
                      ? "bg-cyan-soft text-teal-deeper ring-teal shadow-xs font-bold"
                      : "bg-surface text-muted ring-line hover:bg-mint hover:text-ink hover:ring-line-strong"
                  )}
                >
                  <opt.icon className="size-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client Name & Location */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[13px] font-semibold text-ink block mb-1">
                Client Name <span className="text-danger">*</span>
              </label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Rhea Sharma"
                required
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-ink block mb-1">
                Location (City)
              </label>
              <Input
                value={clientLocation}
                onChange={(e) => setClientLocation(e.target.value)}
                placeholder="e.g. Bangalore, Mumbai"
              />
            </div>
          </div>

          {/* Outfit Name & Star Rating */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[13px] font-semibold text-ink block mb-1">
                Outfit Name / Reference
              </label>
              <Input
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="e.g. Organza Saree & Corset"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-ink block mb-1">
                Star Rating (1–5)
              </label>
              <div className="flex items-center gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-6",
                        s <= rating ? "fill-[#ffc43a] text-[#ffc43a]" : "text-line-strong"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-[14px] font-bold text-ink">{rating} stars</span>
              </div>
            </div>
          </div>

          {/* Media input (If photo or video) */}
          {type !== "text" && (
            <div className="rounded-xl border border-line bg-mint/40 p-4">
              <label className="text-[13px] font-bold text-ink block mb-2">
                {type === "video" ? "Video Media" : "Photo Media"}
              </label>

              {type === "image" && (
                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFile}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="size-4" aria-hidden="true" />
                      {uploading ? "Uploading..." : "Upload photo file"}
                    </Button>
                    <span className="text-[12.5px] text-muted">or paste direct image URL below</span>
                  </div>
                </div>
              )}

              <div className="mt-2.5">
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={type === "video" ? "https://example.com/video.mp4" : "https://images.unsplash.com/..."}
                />
              </div>

              {mediaUrl && (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl} alt="Preview" className="size-16 rounded-lg object-cover border border-line" />
                  <span className="text-[12.5px] text-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-4" /> Media preview loaded
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Review Quote / Text */}
          <div>
            <label className="text-[13px] font-semibold text-ink block mb-1">
              Client Feedback Quote <span className="text-danger">*</span>
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={4}
              required
              placeholder="What did the client say about their outfit, fit, craftsmanship, or delivery experience?"
              className="w-full rounded-[12px] bg-surface p-3.5 text-[14.5px] leading-relaxed ring-1 ring-inset ring-line-strong focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Aspect Ratio & Active */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
            <div>
              <label className="text-[13px] font-semibold text-ink block mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full h-10 rounded-[12px] bg-surface px-3 text-[14px] ring-1 ring-line-strong focus:outline-none"
              >
                <option value="tall">Tall (3:4)</option>
                <option value="square">Square (1:1)</option>
                <option value="wide">Wide (16:9)</option>
              </select>
            </div>
            <div className="pt-2 sm:pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4.5 rounded accent-teal"
                />
                <span className="text-[14px] font-semibold text-ink">Show on Website (Active)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3 border-t border-line pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {review ? "Save Changes" : "Publish Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}