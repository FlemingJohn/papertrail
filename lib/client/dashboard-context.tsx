"use client";

import {
  createContext,
  useContext,
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
}

const DashboardContext = createContext<DashboardValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { state, start, cancel } = useRunStream();
  const [activeView, setActiveView] = useState<DashboardView>("check");

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
    }),
    [state, start, cancel, activeView]
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
