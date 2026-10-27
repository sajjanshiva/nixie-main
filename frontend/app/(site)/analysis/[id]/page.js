import AnalysisResult from "@/components/site/AnalysisResult";

export const metadata = { title: "Your estimate", robots: { index: false } };

export default async function AnalysisPage({ params }) {
  const { id } = await params;
  return <AnalysisResult id={id} />;
}
