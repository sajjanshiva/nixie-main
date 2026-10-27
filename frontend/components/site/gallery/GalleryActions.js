"use client";
import { useRouter } from "next/navigation";
import { MessageCircle, Share2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

export default function GalleryActions({ slug, title }) {
  const router = useRouter();
  const { customer } = useAuth();
  const toast = useToast();
  const contactPath = `/contact?gallery=${encodeURIComponent(slug)}`;

  function contact() {
    router.push(customer ? contactPath : `/login?next=${encodeURIComponent(contactPath)}`);
  }

  async function share() {
    const url = `${window.location.origin}/gallery/${slug}`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: `${title} | Nixie`, url });
      } catch {
        /* closed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn’t copy the link. You can copy it from the address bar.");
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" onClick={contact} className="sm:flex-1">
        <MessageCircle className="size-5" aria-hidden="true" />
        Contact us about this
      </Button>
      <Button size="lg" variant="outline" onClick={share}>
        <Share2 className="size-5" aria-hidden="true" />
        Share
      </Button>
    </div>
  );
}
