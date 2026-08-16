import { notFound } from "next/navigation";
import { loadReport, loadReportPaperId } from "@/lib/client/load-report";
import { CitationsSection } from "@/components/dashboard/report-sections";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default async function CitationsPage({ params }: PageProps) {
  const { reportId } = await params;
  const report = await loadReport(reportId);
  const documentId = await loadReportPaperId(reportId);

  if (report === null) {
    notFound();
  }

  return <CitationsSection report={report} documentId={documentId} />;
}
