import AnalysisHero from "@/components/site/AnalysisHero";
import HowItWorks from "@/components/site/HowItWorks";
import GalleryPreview from "@/components/site/GalleryPreview";
import Faq from "@/components/site/Faq";
import CtaBand from "@/components/site/CtaBand";
import { serverGet } from "@/lib/serverApi";

export const revalidate = 60; // refresh the gallery preview every minute

export default async function HomePage() {
  const data = await serverGet("/gallery?limit=8", { revalidate: 60 });
  const images = Array.isArray(data?.images) ? data.images : [];
  return (
    <>
      <AnalysisHero />
      <HowItWorks />
      <GalleryPreview images={images} />
      <Faq />
      <CtaBand />
    </>
  );
}
