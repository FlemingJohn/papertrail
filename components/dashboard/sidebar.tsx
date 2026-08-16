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

interface NavigationGroup {
  label: string;
  items: Array<{
    href: string;
    label: string;
    icon: typeof UploadIcon;
  }>;
}

const groups: NavigationGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/check", label: "Check a paper", icon: UploadIcon },
      { href: "/reports", label: "Reports", icon: DocumentIcon },
      { href: "/watchlist", label: "Watchlist", icon: ScaleIcon },
    ],
  },
  {
    label: "Spend",
    items: [{ href: "/usage", label: "Usage", icon: ChartIcon }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { run, setActiveView, isSidebarOpen, toggleSidebar } = useDashboard();

  const progressPercentage = Math.round(
    (run.progress.completedStages / Math.max(run.progress.totalStages, 1)) * 100
  );

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? openWidth : collapsedWidth }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-16 flex h-[calc(100vh-4rem)] shrink-0 flex-col overflow-hidden border-r border-white/10 py-5"
    >
      <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3">
        {groups.map((group) => (
          <div key={group.label}>
            {isSidebarOpen ? (
              <p className={`${microLabel} mb-2 px-3`}>{group.label}</p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    href={item.href}
                    isActive={
                      item.href === "/check"
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                    }
                    isSidebarOpen={isSidebarOpen}
                    onSelect={
                      item.href === "/check"
                        ? () => setActiveView("check")
                        : undefined
                    }
                    icon={<item.icon className="size-[18px]" />}
                    label={item.label}
                    trailing={
                      item.href === "/check" && run.status === "running" ? (
                        <SpinnerIcon className="size-3.5 animate-spin text-accent" />
                      ) : null
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 px-3 pt-4">
        {run.status === "idle" ? (
          isSidebarOpen ? (
            <p className={microLabel}>Nothing running</p>
          ) : (
            <span className="mx-auto block size-1.5 rounded-full bg-white/20" />
          )
        ) : (
          <div className="space-y-2.5">
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

      <div className="mt-4 border-t border-white/10 px-3 pt-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isSidebarOpen}
          title={isSidebarOpen ? "Collapse" : "Expand"}
          className={`flex h-9 w-full items-center rounded-full text-muted-foreground transition-colors hover:text-foreground ${
            isSidebarOpen ? "gap-3 px-3" : "justify-center"
          }`}
        >
          <CollapseIcon isOpen={isSidebarOpen} />

          <AnimatePresence initial={false}>
            {isSidebarOpen ? (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-widest"
              >
                Collapse
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

function CollapseIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <motion.line
        x1="9.5"
        y1="4.5"
        x2="9.5"
        y2="19.5"
        animate={{ x1: isOpen ? 9.5 : 6.5, x2: isOpen ? 9.5 : 6.5 }}
        transition={{ duration: 0.25 }}
      />
      <motion.path
        d="M14 9.5 16.5 12 14 14.5"
        animate={{ rotate: isOpen ? 0 : 180 }}
        style={{ transformOrigin: "15.5px 12px" }}
        transition={{ duration: 0.25 }}
      />
    </svg>
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
      className={`flex h-10 items-center rounded-full text-sm transition-colors duration-200 ${
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
