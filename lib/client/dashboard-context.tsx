"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRunStream, type RunStreamState } from "./use-run-stream";
import type { RunDepth } from "@/lib/schemas/run";

export type DashboardView =
  | "check"
  | "summary"
  | "citations"
  | "numbers"
  | "methods"
  | "conflicts"
  | "review"
  | "cost";

interface DashboardValue {
  run: RunStreamState;
  startRun: (file: File, depth: RunDepth) => Promise<void>;
  cancelRun: () => void;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  hasReport: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const DashboardContext = createContext<DashboardValue | null>(null);

const sidebarStorageKey = "papertrail.sidebar.open";

const autoCollapseBelowPixels = 1024;

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { state, start, cancel } = useRunStream();
  const [activeView, setActiveView] = useState<DashboardView>("check");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [wasCollapsedByViewport, setWasCollapsedByViewport] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(sidebarStorageKey);

    if (stored !== null) {
      setIsSidebarOpen(stored === "true");
    }
  }, []);

  useEffect(() => {
    function applyViewport(): void {
      const isNarrow = window.innerWidth < autoCollapseBelowPixels;

      if (isNarrow) {
        setIsSidebarOpen(false);
        setWasCollapsedByViewport(true);
        return;
      }

      setWasCollapsedByViewport((wasCollapsed) => {
        if (wasCollapsed) {
          const stored = window.localStorage.getItem(sidebarStorageKey);
          setIsSidebarOpen(stored === null ? true : stored === "true");
        }
        return false;
      });
    }

    applyViewport();
    window.addEventListener("resize", applyViewport);
    return () => window.removeEventListener("resize", applyViewport);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((current) => {
      const next = !current;
      window.localStorage.setItem(sidebarStorageKey, String(next));
      return next;
    });
  }, []);

  const value = useMemo<DashboardValue>(
    () => ({
      run: state,
      startRun: async (file, depth) => {
        setActiveView("check");
        await start(file, depth);
      },
      cancelRun: cancel,
      activeView,
      setActiveView,
      hasReport: state.report !== null,
      isSidebarOpen,
      toggleSidebar,
    }),
    [state, start, cancel, activeView, isSidebarOpen, toggleSidebar]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardValue {
  const value = useContext(DashboardContext);

  if (value === null) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }

  return value;
}
