"use client";

import { useState } from "react";
import Link from "next/link";
import type { WatchFrequency } from "@/lib/schemas/watch";
import { CheckIcon, WarningIcon } from "./icons";

interface WatchButtonProps {
  documentId: string;
}

const frequencyOptions: Array<{ value: WatchFrequency; label: string }> = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

export function WatchButton({ documentId }: WatchButtonProps) {
  const [frequency, setFrequency] = useState<WatchFrequency>("monthly");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle"
  );
  const [problem, setProblem] = useState<string | null>(null);

  async function startWatching(): Promise<void> {
    setStatus("saving");
    setProblem(null);

    try {
      const response = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, frequency, notifyFrom: "medium" }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus("failed");
        setProblem(body?.error ?? "The watch could not be saved.");
        return;
      }

      setStatus("saved");
    } catch (error) {
      setStatus("failed");
      setProblem(
        error instanceof Error ? error.message : "The request could not be sent."
      );
    }
  }

  if (status === "saved") {
    return (
      <div className="flex items-center gap-3 border border-verdict-supported/40 bg-card/40 px-4 py-3">
        <CheckIcon className="size-5 shrink-0 text-verdict-supported" />
        <div>
          <p className="text-sm text-foreground">
            This paper is now checked {frequency}.
          </p>
          <Link
            href="/watchlist"
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            See everything being watched
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/60 bg-card/40 px-4 py-4">
      <p className="mb-1 text-sm text-foreground">
        Tell me when this changes
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        Sources get retracted, new studies appear, and conclusions stop holding.
        A repeat check compares against this report and reports only what moved.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFrequency(option.value)}
              aria-pressed={frequency === option.value}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                frequency === option.value
                  ? "border-accent text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void startWatching()}
          disabled={status === "saving"}
          className="bg-foreground px-4 py-1.5 text-xs text-background transition-opacity disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : "Watch this paper"}
        </button>
      </div>

      {problem === null ? null : (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-xs text-verdict-wrong-source"
        >
          <WarningIcon className="size-4 shrink-0" />
          {problem}
        </p>
      )}
    </div>
  );
}
