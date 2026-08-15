"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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

export function Sidebar() {
  const pathname = usePathname();
  const { run, activeView, setActiveView, hasReport } = useDashboard();

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

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 px-6 py-8">
      <Link
        href="/"
        className="mb-10 block font-mono text-xs uppercase tracking-[0.3em]"
      >
        PaperTrail
      </Link>

      <nav className="flex-1 space-y-8 overflow-y-auto">
        <div>
          <p className={`${microLabel} mb-3`}>Analyse</p>
          <SidebarLink
            href="/check"
            isActive={isOnCheck && activeView === "check"}
            onSelect={() => setActiveView("check")}
            icon={<UploadIcon className="size-4" />}
            label="Check a paper"
            trailing={
              run.status === "running" ? (
                <SpinnerIcon className="size-3.5 animate-spin text-accent" />
              ) : null
            }
          />
        </div>

        <div>
          <p className={`${microLabel} mb-3`}>Report</p>
          {hasReport ? (
            <ul className="space-y-0.5">
              {reportItems.map((item) => (
                <li key={item.view}>
                  <SidebarLink
                    href="/check"
                    isActive={isOnCheck && activeView === item.view}
                    onSelect={() => setActiveView(item.view)}
                    icon={<item.icon className="size-4" />}
                    label={item.label}
                    trailing={
                      counts[item.view] === undefined ||
                      counts[item.view] === 0 ? null : (
                        <span
                          className={`font-mono text-[10px] ${
                            item.view === "citations" && problemCount > 0
                              ? "text-verdict-wrong-source"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.view === "citations" && problemCount > 0
                            ? `${problemCount}!`
                            : counts[item.view]}
                        </span>
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 text-xs leading-relaxed text-muted-foreground/60">
              Check a paper and its findings appear here.
            </p>
          )}
        </div>

        <div>
          <p className={`${microLabel} mb-3`}>Monitor</p>
          <SidebarLink
            href="/watchlist"
            isActive={pathname === "/watchlist"}
            icon={<ScaleIcon className="size-4" />}
            label="Watchlist"
          />
        </div>
      </nav>

      <div className="mt-8 border-t border-white/10 pt-6">
        {run.status === "idle" ? (
          <p className={microLabel}>Nothing running</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className={microLabel}>
                {run.status === "running" ? "Running" : run.status}
              </span>
              <span className="font-display text-lg font-light">
                {formatDollars(run.spendDollars)}
              </span>
            </div>

            <div className="h-px w-full bg-white/10">
              <motion.div
                className="h-px bg-accent"
                animate={{
                  width: `${Math.round(
                    (run.progress.completedStages /
                      Math.max(run.progress.totalStages, 1)) *
                      100
                  )}%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <p className="text-xs leading-snug text-muted-foreground">
              {run.progress.stageLabel}
            </p>

            {run.status === "running" ? (
              <p className={microLabel}>
                {run.activeAgentCount} working · {run.toolUses} lookups
              </p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  href: string;
  isActive: boolean;
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  onSelect?: () => void;
}

function SidebarLink({
  href,
  isActive,
  label,
  icon,
  trailing,
  onSelect,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors duration-200 ${
        isActive
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={isActive ? "text-accent" : ""}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </Link>
  );
}
