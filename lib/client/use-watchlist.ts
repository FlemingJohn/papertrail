"use client";

import { useCallback, useEffect, useState } from "react";
import type { WatchSummary } from "@/lib/tools/database/list-watches";
import type { DetectedChange, Importance } from "@/lib/schemas/watch";

export interface WatchCheckRecord {
  watchCheckId: string;
  createdAt: string;
  importance: Importance;
  shouldNotify: boolean;
  explanation: string;
  changes: DetectedChange[];
}

export interface WatchlistState {
  status: "loading" | "ready" | "failed";
  watches: WatchSummary[];
  errorMessage: string | null;
  errorDetail: string | null;
}

export function useWatchlist() {
  const [state, setState] = useState<WatchlistState>({
    status: "loading",
    watches: [],
    errorMessage: null,
    errorDetail: null,
  });

  const [histories, setHistories] = useState<
    Record<string, WatchCheckRecord[]>
  >({});

  const [busyWatchId, setBusyWatchId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/watch");

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;

        setState({
          status: "failed",
          watches: [],
          errorMessage: body?.error ?? "The watch list could not be loaded.",
          errorDetail: body?.detail ?? null,
        });
        return;
      }

      const body = (await response.json()) as { watches: WatchSummary[] };

      setState({
        status: "ready",
        watches: body.watches,
        errorMessage: null,
        errorDetail: null,
      });
    } catch (error) {
      setState({
        status: "failed",
        watches: [],
        errorMessage: "The watch list could not be loaded.",
        errorDetail:
          error instanceof Error ? error.message : "Unknown network error.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadHistory = useCallback(async (watchId: string) => {
    try {
      const response = await fetch(`/api/watch/${watchId}`);

      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as { checks: WatchCheckRecord[] };
      setHistories((current) => ({ ...current, [watchId]: body.checks }));
    } catch {
      return;
    }
  }, []);

  const checkNow = useCallback(
    async (watch: WatchSummary) => {
      setBusyWatchId(watch.watchId);

      try {
        await fetch(`/api/watch/${watch.watchId}/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: watch.documentId,
            frequency: watch.frequency,
            notifyFrom: watch.notifyFrom,
          }),
        });

        await loadHistory(watch.watchId);
        await load();
      } finally {
        setBusyWatchId(null);
      }
    },
    [load, loadHistory]
  );

  const stopWatching = useCallback(
    async (watchId: string) => {
      setBusyWatchId(watchId);

      try {
        await fetch(`/api/watch/${watchId}`, { method: "DELETE" });
        await load();
      } finally {
        setBusyWatchId(null);
      }
    },
    [load]
  );

  return {
    state,
    histories,
    busyWatchId,
    loadHistory,
    checkNow,
    stopWatching,
    reload: load,
  };
}
