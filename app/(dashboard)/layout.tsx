import type { ReactNode } from "react";
import { DashboardProvider } from "@/lib/client/dashboard-context";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1 px-8 py-10 md:px-12 md:py-14">
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
