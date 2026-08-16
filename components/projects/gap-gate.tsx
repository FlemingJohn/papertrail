"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ProjectGap } from "@/lib/client/project-types";
import type { Decision } from "@/lib/schemas/project";
import {
  buttonPrimary,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { SupportBadge } from "./support-badge";

interface GapGateProps {
  gaps: ProjectGap[];
  isBusy: boolean;
  onDecide: (
    decisions: Array<{ gapId: string; decision: Decision }>
  ) => void;
}

export function GapGate({ gaps, isBusy, onDecide }: GapGateProps) {
  const [choices, setChoices] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(
      gaps.map((gap) => [
        gap.gapId,
        gap.decision === "pending" ? "pending" : (gap.decision as Decision),
      ])
    )
  );

  const acceptedCount = Object.values(choices).filter(
    (choice) => choice === "accepted"
  ).length;

  const undecidedCount = Object.values(choices).filter(
    (choice) => choice === "pending"
  ).length;

  if (gaps.length === 0) {
    return (
      <div className="border border-white/10 px-6 py-8">
        <p className="mb-3 font-display text-xl font-light">
          No genuine opening came out of these papers.
        </p>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          That is a real answer, not a failure. Either the question is already
          well covered, or the papers that came back were about different
          things. Try wording the question the way a database search would be
          worded, or add your own papers to the project first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <p className={`${sectionLabel} mb-3`}>Your turn</p>
        <h2 className="max-w-2xl font-display text-2xl font-light leading-snug md:text-3xl">
          Which of these openings are real?
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          These come from {gaps.length === 1 ? "one reading" : "a reading"} of
          the papers in this project only. They are not gaps in the whole field,
          and nothing goes further until you say which ones hold.
        </p>
      </header>

      <ul className="space-y-3">
        {gaps.map((gap, index) => (
          <motion.li
            key={gap.gapId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`border px-6 py-5 transition-colors ${
              choices[gap.gapId] === "accepted"
                ? "border-verdict-supported/40 bg-white/[0.03]"
                : choices[gap.gapId] === "rejected"
                  ? "border-white/5 opacity-50"
                  : "border-white/10"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
              <p className="max-w-2xl font-display text-lg font-light leading-snug">
                {gap.headline}
              </p>
              <SupportBadge support={gap.support} />
            </div>

            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {gap.evidence}
            </p>

            <div className="flex gap-2">
              <ChoiceButton
                label="This is real"
                isChosen={choices[gap.gapId] === "accepted"}
                tone="accept"
                onClick={() =>
                  setChoices((current) => ({
                    ...current,
                    [gap.gapId]: "accepted",
                  }))
                }
              />
              <ChoiceButton
                label="Not this one"
                isChosen={choices[gap.gapId] === "rejected"}
                tone="reject"
                onClick={() =>
                  setChoices((current) => ({
                    ...current,
                    [gap.gapId]: "rejected",
                  }))
                }
              />
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8">
        <motion.button
          type="button"
          whileHover={acceptedCount === 0 ? undefined : { scale: 1.03 }}
          whileTap={acceptedCount === 0 ? undefined : { scale: 0.97 }}
          disabled={acceptedCount === 0 || isBusy}
          onClick={() =>
            onDecide(
              Object.entries(choices).map(([gapId, decision]) => ({
                gapId,
                decision: decision === "pending" ? "rejected" : decision,
              }))
            )
          }
          className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground`}
        >
          {isBusy ? "Working" : "Build on these"}
        </motion.button>

        <p className={microLabel}>
          {acceptedCount === 0
            ? "Accept at least one opening to go on"
            : `${acceptedCount} accepted${undecidedCount === 0 ? "" : ` · ${undecidedCount} left undecided will be dropped`}`}
        </p>
      </div>
    </div>
  );
}

interface ChoiceButtonProps {
  label: string;
  isChosen: boolean;
  tone: "accept" | "reject";
  onClick: () => void;
}

function ChoiceButton({ label, isChosen, tone, onClick }: ChoiceButtonProps) {
  const chosenStyle =
    tone === "accept"
      ? "border-verdict-supported/60 text-verdict-supported"
      : "border-white/40 text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isChosen}
      className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        isChosen
          ? chosenStyle
          : "border-white/15 text-muted-foreground hover:border-white/35"
      }`}
    >
      {label}
    </button>
  );
}
