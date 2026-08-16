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

interface AccountState {
  modelName: string;
  totalDollars: number | null;
  runCount: number | null;
  isStoring: boolean;
}

const pageNames: Record<string, string> = {
  "/check": "Check a paper",
  "/reports": "Reports",
  "/watchlist": "Watchlist",
  "/usage": "Usage",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { run } = useDashboard();
  const [account, setAccount] = useState<AccountState | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          setAccount((await response.json()) as AccountState);
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

      <div className="flex items-center gap-4">
        {run.status === "running" ? (
          <span className="hidden items-center gap-2 md:flex">
            <SpinnerIcon className="size-3.5 animate-spin text-accent" />
            <span className={microLabel}>{run.progress.stageLabel}</span>
          </span>
        ) : null}

        {account === null ? null : (
          <Reading label="Model" value={account.modelName} />
        )}

        {run.status === "idle" ? null : (
          <Reading
            label="This run"
            value={formatDollars(run.spendDollars)}
            isLive={run.status === "running"}
          />
        )}

        {account === null || account.totalDollars === null ? null : (
          <Reading
            label={account.runCount === 1 ? "1 run" : `${account.runCount} runs`}
            value={formatDollars(account.totalDollars)}
          />
        )}

        <Link href="/check" className={`${buttonQuiet} hidden sm:inline-block`}>
          New check
        </Link>
      </div>
    </header>
  );
}

function Reading({
  label,
  value,
  isLive = false,
}: {
  label: string;
  value: string;
  isLive?: boolean;
}) {
  return (
    <span className="hidden items-baseline gap-2 border-l border-white/10 pl-4 lg:flex">
      <span className={microLabel}>{label}</span>
      <motion.span
        key={value}
        initial={isLive ? { opacity: 0.55 } : false}
        animate={{ opacity: 1 }}
        className="font-mono text-xs text-foreground tabular-nums"
      >
        {value}
      </motion.span>
    </span>
  );
}
