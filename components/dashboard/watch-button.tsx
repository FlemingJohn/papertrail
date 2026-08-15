"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { WatchFrequency } from "@/lib/schemas/watch";
import { buttonPrimary, buttonQuiet, sectionLabel } from "@/lib/design/tokens";
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
      <section className="flex items-start gap-4 border-t border-verdict-supported/40 pt-8">
        <CheckIcon className="size-5 shrink-0 translate-y-1 text-verdict-supported" />
        <div>
          <p className="font-display text-xl font-light">
            Now checked {frequency}.
          </p>
          <Link
            href="/watchlist"
            className="mt-2 inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            See everything being watched
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/10 pt-8">
      <p className={`${sectionLabel} mb-4`}>Tell me when this changes</p>

      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Sources get retracted, new studies appear, and conclusions stop holding.
        A repeat check compares against this report and reports only what moved.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {frequencyOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFrequency(option.value)}
            aria-pressed={frequency === option.value}
            className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 ${
              frequency === option.value
                ? "border-white/60 text-foreground"
                : "border-white/20 text-muted-foreground hover:border-white/40"
            }`}
          >
            {option.label}
          </button>
        ))}

        <motion.button
          type="button"
          whileHover={status === "saving" ? undefined : { scale: 1.03 }}
          whileTap={status === "saving" ? undefined : { scale: 0.97 }}
          onClick={() => void startWatching()}
          disabled={status === "saving"}
          className={`${buttonQuiet} disabled:opacity-40`}
        >
          {status === "saving" ? "Saving" : "Watch this paper"}
        </motion.button>
      </div>

      {problem === null ? null : (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 text-sm text-verdict-wrong-source"
        >
          <WarningIcon className="size-4 shrink-0 translate-y-0.5" />
          {problem}
        </p>
      )}
    </section>
  );
}
