"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboard } from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import { microLabel } from "@/lib/design/tokens";
import { Logo } from "@/components/logo";
import { SpinnerIcon } from "./icons";

export function DashboardHeader() {
  const { run, isSidebarOpen, toggleSidebar } = useDashboard();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-background/90 px-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isSidebarOpen}
          className="flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
        >
          <PanelIcon isOpen={isSidebarOpen} />
        </button>

        <Link href="/" className="text-foreground">
          <Logo />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {run.status === "running" ? (
          <span className="flex items-center gap-2">
            <SpinnerIcon className="size-3.5 animate-spin text-accent" />
            <span className={microLabel}>{run.progress.stageLabel}</span>
          </span>
        ) : null}

        {run.status === "idle" ? null : (
          <motion.span
            key={run.spendDollars}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="font-display text-lg font-light"
          >
            {formatDollars(run.spendDollars)}
          </motion.span>
        )}

        <Link
          href="/"
          className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          Home
        </Link>
      </div>
    </header>
  );
}

function PanelIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <motion.line
        x1="9.5"
        y1="4"
        x2="9.5"
        y2="20"
        animate={{ x1: isOpen ? 9.5 : 6.5, x2: isOpen ? 9.5 : 6.5 }}
        transition={{ duration: 0.25 }}
      />
    </svg>
  );
}
