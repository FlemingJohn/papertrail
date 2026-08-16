"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useDashboard } from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import { buttonQuiet, microLabel } from "@/lib/design/tokens";
import { Logo } from "@/components/logo";
import { SpinnerIcon } from "./icons";

interface HealthState {
  model: boolean;
  documentReader: boolean;
  database: boolean;
  note: string | null;
}

const pageNames: Record<string, string> = {
  "/check": "Check a paper",
  "/history": "History",
  "/watchlist": "Watchlist",
  "/usage": "Usage",
  "/agents": "Agents",
  "/integrations": "Integrations",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { run } = useDashboard();
  const [health, setHealth] = useState<HealthState | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          setHealth((await response.json()) as HealthState);
        }
      } catch {
        return;
      }
    }

    void load();
  }, [run.status]);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-background/90 px-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" className="shrink-0 text-foreground">
          <Logo />
        </Link>

        <span className="hidden h-4 w-px bg-white/15 sm:block" />

        <span className={`${microLabel} hidden truncate sm:block`}>
          {pageNames[pathname] ?? "Dashboard"}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {run.status === "running" ? (
          <span className="hidden items-center gap-2 md:flex">
            <SpinnerIcon className="size-3.5 animate-spin text-accent" />
            <span className={microLabel}>{run.progress.stageLabel}</span>
          </span>
        ) : null}

        {run.status === "idle" ? null : (
          <motion.span
            key={run.spendDollars}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="font-display text-lg font-light"
            title="Spend on the current run"
          >
            {formatDollars(run.spendDollars)}
          </motion.span>
        )}

        <ServiceLights health={health} />

        <Link href="/check" className={`${buttonQuiet} hidden sm:inline-block`}>
          New check
        </Link>
      </div>
    </header>
  );
}

function ServiceLights({ health }: { health: HealthState | null }) {
  if (health === null) {
    return null;
  }

  const services: Array<{ label: string; isUp: boolean }> = [
    { label: "Model", isUp: health.model },
    { label: "Reader", isUp: health.documentReader },
    { label: "Storage", isUp: health.database },
  ];

  const downCount = services.filter((service) => !service.isUp).length;

  return (
    <span
      className="flex items-center gap-2.5"
      title={
        health.note ?? "Model, document reader and storage are all reachable."
      }
    >
      {services.map((service) => (
        <span key={service.label} className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${
              service.isUp ? "bg-verdict-supported" : "bg-verdict-wrong-source"
            }`}
          />
          <span
            className={`hidden font-mono text-[10px] uppercase tracking-widest lg:inline ${
              service.isUp
                ? "text-muted-foreground"
                : "text-verdict-wrong-source"
            }`}
          >
            {service.label}
          </span>
        </span>
      ))}

      {downCount > 0 ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-verdict-wrong-source lg:hidden">
          {downCount} down
        </span>
      ) : null}
    </span>
  );
}
