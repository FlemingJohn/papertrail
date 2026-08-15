import type { ReactNode } from "react";
import { DashboardProvider } from "@/lib/client/dashboard-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <div className="flex">
          <Sidebar />
          <main className="min-w-0 flex-1 px-6 py-10 md:px-10 md:py-12">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
