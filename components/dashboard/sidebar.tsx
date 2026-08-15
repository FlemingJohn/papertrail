"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useDashboard,
  type DashboardView,
} from "@/lib/client/dashboard-context";
import { formatDollars } from "@/lib/config/pricing";
import { isProblemVerdict } from "@/lib/schemas/verdict";
import { microLabel } from "@/lib/design/tokens";
import {
  ChartIcon,
  CoinIcon,
  DocumentIcon,
  FlaskIcon,
  LinkIcon,
  ScaleIcon,
  SearchIcon,
  SpinnerIcon,
  UploadIcon,
} from "./icons";

interface ReportItem {
  view: DashboardView;
  label: string;
  icon: typeof LinkIcon;
}

const reportItems: ReportItem[] = [
  { view: "summary", label: "Summary", icon: DocumentIcon },
  { view: "citations", label: "Citations", icon: LinkIcon },
  { view: "numbers", label: "Numbers", icon: ChartIcon },
  { view: "methods", label: "Methods", icon: FlaskIcon },
  { view: "conflicts", label: "Conflicts", icon: ScaleIcon },
  { view: "review", label: "Review", icon: SearchIcon },
  { view: "cost", label: "Cost", icon: CoinIcon },
];

const openWidth = "16rem";

const collapsedWidth = "4.5rem";

export function Sidebar() {
  const pathname = usePathname();
  const { run, activeView, setActiveView, hasReport, isSidebarOpen } =
    useDashboard();

  const isOnCheck = pathname === "/check";
  const report = run.report;

  const problemCount =
    report === null
      ? 0
      : report.citationChecks.filter((check) =>
          isProblemVerdict(check.judgement.verdict)
        ).length;

  const counts: Partial<Record<DashboardView, number>> = {
    citations: report?.citationChecks.length ?? 0,
    numbers: report?.measurements.length ?? 0,
    methods: report?.missingDetails.length ?? 0,
    conflicts: report?.conflicts.length ?? 0,
    review: report?.review?.points.length ?? 0,
  };

  const progressPercentage = Math.round(
    (run.progress.completedStages / Math.max(run.progress.totalStages, 1)) * 100
  );

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? openWidth : collapsedWidth }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-16 flex h-[calc(100vh-4rem)] shrink-0 flex-col overflow-hidden border-r border-white/10 py-6"
    >
      <nav className="flex-1 space-y-7 overflow-y-auto overflow-x-hidden px-3">
        <SidebarGroup label="Analyse" isSidebarOpen={isSidebarOpen}>
          <SidebarLink
            href="/check"
            isActive={isOnCheck && activeView === "check"}
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
        </SidebarGroup>

        <SidebarGroup label="Report" isSidebarOpen={isSidebarOpen}>
          {hasReport ? (
            <ul className="space-y-0.5">
              {reportItems.map((item) => {
                const count = counts[item.view];
                const isFlagged = item.view === "citations" && problemCount > 0;

                return (
                  <li key={item.view}>
                    <SidebarLink
                      href="/check"
                      isActive={isOnCheck && activeView === item.view}
                      isSidebarOpen={isSidebarOpen}
                      onSelect={() => setActiveView(item.view)}
                      icon={<item.icon className="size-[18px]" />}
                      label={item.label}
                      isFlagged={isFlagged}
                      trailing={
                        count === undefined || count === 0 ? null : (
                          <span
                            className={`font-mono text-[10px] ${
                              isFlagged
                                ? "text-verdict-wrong-source"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isFlagged ? `${problemCount}!` : count}
                          </span>
                        )
                      }
                    />
                  </li>
                );
              })}
            </ul>
          ) : isSidebarOpen ? (
            <p className="px-3 text-xs leading-relaxed text-muted-foreground/50">
              Check a paper and its findings appear here.
            </p>
          ) : null}
        </SidebarGroup>

        <SidebarGroup label="Monitor" isSidebarOpen={isSidebarOpen}>
          <SidebarLink
            href="/watchlist"
            isActive={pathname === "/watchlist"}
            isSidebarOpen={isSidebarOpen}
            icon={<ScaleIcon className="size-[18px]" />}
            label="Watchlist"
          />
        </SidebarGroup>
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

function SidebarGroup({
  label,
  isSidebarOpen,
  children,
}: {
  label: string;
  isSidebarOpen: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <AnimatePresence initial={false}>
        {isSidebarOpen ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`${microLabel} mb-3 overflow-hidden px-3`}
          >
            {label}
          </motion.p>
        ) : (
          <div className="mx-auto mb-3 h-px w-6 bg-white/10" />
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  isActive: boolean;
  isSidebarOpen: boolean;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  isFlagged?: boolean;
  onSelect?: () => void;
}

function SidebarLink({
  href,
  isActive,
  isSidebarOpen,
  label,
  icon,
  trailing,
  isFlagged = false,
  onSelect,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      title={isSidebarOpen ? undefined : label}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex h-10 items-center rounded-full text-sm transition-colors duration-200 ${
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

      {!isSidebarOpen && isFlagged ? (
        <span className="absolute right-3 top-2 size-1.5 rounded-full bg-verdict-wrong-source" />
      ) : null}
    </Link>
  );
}
