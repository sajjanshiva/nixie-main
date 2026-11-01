"use client";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, ImageUp, Images, Pencil, Trash2 } from "lucide-react";
import IkImage from "@/components/ui/IkImage";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import FormError from "@/components/ui/FormError";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmDialog, LoadMore, PageHeader, SearchBox } from "../ui";
import usePagedList from "../usePagedList";
import EditImageDialog from "./EditImageDialog";
import { adminApi } from "@/lib/adminApi";
import { date } from "@/lib/format";

export default function GalleryAdmin() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const list = usePagedList("/gallery", "images", { q, limit: 30 });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await adminApi(`/gallery/${deleting.id}`, { method: "DELETE" });
      list.setItems((items) => items.filter((x) => x.id !== deleting.id));
      toast.success("Image deleted.");
      setDeleting(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Inspiration images shown on the website, newest first."
        actions={
          <Button href="/admin/gallery/upload">
            <ImageUp className="size-[18px]" aria-hidden="true" />
            Upload images
          </Button>
        }
      />
      <SearchBox value={q} onChange={setQ} placeholder="Search title or tags" className="mb-5 w-full sm:w-80" />
      <FormError message={list.error} />

      {list.loading && list.items.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-[20px]" />
          ))}
        </div>
      ) : list.items.length === 0 && !list.error ? (
        <EmptyState
          icon={Images}
          title={q ? "No images match" : "The gallery is empty"}
          text={q ? "Try another word." : "Upload up to 10 images at a time. AI suggests a title and tags for each."}
          action={!q && <Button href="/admin/gallery/upload">Upload images</Button>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.items.map((img) => (
            <li key={img.id} className="group overflow-hidden rounded-[20px] bg-surface ring-1 ring-line">
              <div className="relative aspect-[3/4] bg-cyan-soft">
                <IkImage src={img.imageUrl} alt={img.title} fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw" className="object-cover" />
              </div>
              <div className="p-3.5">
                <p className="truncate text-[15px] font-semibold" title={img.title}>
                  {img.title}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted">{img.tags?.length ? img.tags.join(", ") : "No tags"}</p>
                <p className="mt-0.5 text-[12px] text-muted">{date(img.createdAt)}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(img)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Link
                    href={`/gallery/${img.slug}`}
                    target="_blank"
                    className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-mint hover:text-ink"
                    aria-label="Open public page"
                    title="Open public page"
                  >
                    <ExternalLink className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleting(img)}
                    className="ml-auto flex size-9 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                    aria-label={`Delete ${img.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loading} onClick={list.loadMore} />

      <EditImageDialog
        image={editing}
        onClose={() => setEditing(null)}
        onSaved={(img) => {
          list.setItems((items) => items.map((x) => (x.id === img.id ? img : x)));
          setEditing(null);
          toast.success("Saved.");
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this image?"
        text={deleting ? `“${deleting.title}” and its public page will be removed. This can’t be undone.` : ""}
        confirmLabel="Delete image"
        busy={busy}
        onConfirm={remove}
      />
    </>
  );
}
