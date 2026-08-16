import { notFound } from "next/navigation";
import { loadReport } from "@/lib/client/load-report";
import { ReviewSection } from "@/components/dashboard/report-sections";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { reportId } = await params;
  const report = await loadReport(reportId);

  if (report === null) {
    notFound();
  }

  return <ReviewSection report={report} />;
}
