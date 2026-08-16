"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ReportTabsProps {
  reportId: string;
  counts: {
    citations: number;
    numbers: number;
    methods: number;
    conflicts: number;
    review: number;
  };
  problemCount: number;
}

const tabs: Array<{ segment: string; label: string; countKey?: keyof ReportTabsProps["counts"] }> = [
  { segment: "", label: "Summary" },
  { segment: "citations", label: "Citations", countKey: "citations" },
  { segment: "numbers", label: "Numbers", countKey: "numbers" },
  { segment: "methods", label: "Methods", countKey: "methods" },
  { segment: "conflicts", label: "Conflicts", countKey: "conflicts" },
  { segment: "review", label: "Review", countKey: "review" },
  { segment: "cost", label: "Cost" },
];

export function ReportTabs({
  reportId,
  counts,
  problemCount,
}: ReportTabsProps) {
  const pathname = usePathname();
  const base = `/reports/${reportId}`;

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = tab.segment === "" ? base : `${base}/${tab.segment}`;
        const isActive = pathname === href;
        const count = tab.countKey === undefined ? 0 : counts[tab.countKey];
        const isFlagged = tab.segment === "citations" && problemCount > 0;

        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 ${
              isActive
                ? "border-white/60 text-foreground"
                : "border-white/20 text-muted-foreground hover:border-white/40"
            }`}
          >
            {tab.label}
            {count === 0 ? null : (
              <span
                className={`ml-2 ${
                  isFlagged ? "text-verdict-wrong-source" : "opacity-50"
                }`}
              >
                {isFlagged ? `${problemCount}!` : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
