"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboard } from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import { microLabel } from "@/lib/design/tokens";
import {
  ChartIcon,
  DocumentIcon,
  ScaleIcon,
  SpinnerIcon,
  UploadIcon,
} from "./icons";

const openWidth = "15rem";

const collapsedWidth = "4.5rem";

export function Sidebar() {
  const pathname = usePathname();
  const { run, setActiveView, isSidebarOpen } = useDashboard();

  const progressPercentage = Math.round(
    (run.progress.completedStages / Math.max(run.progress.totalStages, 1)) * 100
  );

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? openWidth : collapsedWidth }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-16 flex h-[calc(100vh-4rem)] shrink-0 flex-col overflow-hidden border-r border-white/10 py-6"
    >
      <nav className="flex-1 space-y-1 overflow-hidden px-3">
        <SidebarLink
          href="/check"
          isActive={pathname === "/check"}
          isSidebarOpen={isSidebarOpen}
          onSelect={() => setActiveView("check")}
          icon={<UploadIcon className="size-[18px]" />}
          label="Check a paper"
          trailing={
            run.status === "running" ? (
              <SpinnerIcon className="size-3.5 animate-spin text-accent" />
            ) : null
          }
        />

        <SidebarLink
          href="/history"
          isActive={pathname === "/history"}
          isSidebarOpen={isSidebarOpen}
          icon={<DocumentIcon className="size-[18px]" />}
          label="History"
        />

        <SidebarLink
          href="/watchlist"
          isActive={pathname === "/watchlist"}
          isSidebarOpen={isSidebarOpen}
          icon={<ScaleIcon className="size-[18px]" />}
          label="Watchlist"
        />

        <SidebarLink
          href="/usage"
          isActive={pathname === "/usage"}
          isSidebarOpen={isSidebarOpen}
          icon={<ChartIcon className="size-[18px]" />}
          label="Usage"
        />
      </nav>

      <div className="mt-6 border-t border-white/10 px-3 pt-5">
        {run.status === "idle" ? (
          isSidebarOpen ? (
            <p className={microLabel}>Nothing running</p>
          ) : (
            <span className="mx-auto block size-1.5 rounded-full bg-white/20" />
          )
        ) : (
          <div className="space-y-3">
            {isSidebarOpen ? (
              <div className="flex items-baseline justify-between">
                <span className={microLabel}>
                  {run.status === "running" ? "Running" : run.status}
                </span>
                <span className="font-display text-lg font-light">
                  {formatDollars(run.spendDollars)}
                </span>
              </div>
            ) : (
              <p className="text-center font-mono text-[10px] text-muted-foreground">
                {progressPercentage}%
              </p>
            )}

            <div className="h-px w-full bg-white/10">
              <motion.div
                className="h-px bg-accent"
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {isSidebarOpen ? (
              <>
                <p className="text-xs leading-snug text-muted-foreground">
                  {run.progress.stageLabel}
                </p>
                {run.status === "running" ? (
                  <p className={microLabel}>
                    {run.activeAgentCount} working · {run.toolUses} lookups
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

interface SidebarLinkProps {
  href: string;
  isActive: boolean;
  isSidebarOpen: boolean;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  onSelect?: () => void;
}

function SidebarLink({
  href,
  isActive,
  isSidebarOpen,
  label,
  icon,
  trailing,
  onSelect,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      title={isSidebarOpen ? undefined : label}
      aria-current={isActive ? "page" : undefined}
      className={`flex h-11 items-center rounded-full text-sm transition-colors duration-200 ${
        isSidebarOpen ? "gap-3 px-3" : "justify-center"
      } ${
        isActive
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={`shrink-0 ${isActive ? "text-accent" : ""}`}>
        {icon}
      </span>

      <AnimatePresence initial={false}>
        {isSidebarOpen ? (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap"
          >
            <span className="truncate">{label}</span>
            {trailing}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Link>
  );
}
