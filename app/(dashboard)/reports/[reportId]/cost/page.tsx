import { notFound } from "next/navigation";
import { loadReport } from "@/lib/client/load-report";
import { CostSection } from "@/components/dashboard/report-sections";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default async function CostPage({ params }: PageProps) {
  const { reportId } = await params;
  const report = await loadReport(reportId);

  if (report === null) {
    notFound();
  }

  return <CostSection report={report} />;
}
