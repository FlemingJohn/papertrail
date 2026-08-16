"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ProjectProposal } from "@/lib/client/project-types";
import { noveltyLabels } from "@/lib/client/project-types";
import {
  buttonPrimary,
  microLabel,
  pill,
  sectionLabel,
} from "@/lib/design/tokens";
import { SupportBadge } from "./support-badge";

interface ProposalGateProps {
  proposals: ProjectProposal[];
  isBusy: boolean;
  onChoose: (proposalId: string) => void;
}

const noveltyTone: Record<string, string> = {
  "nothing-found": "border-verdict-supported/50 text-verdict-supported",
  "similar-work-exists": "border-verdict-wrong-source/50 text-verdict-wrong-source",
  "already-done": "border-verdict-retracted/50 text-verdict-retracted",
  "not-checked": "border-white/20 text-muted-foreground",
};

export function ProposalGate({
  proposals,
  isBusy,
  onChoose,
}: ProposalGateProps) {
  const [chosen, setChosen] = useState<string | null>(
    proposals.find(
      (proposal) => proposal.noveltyVerdict !== "already-done"
    )?.proposalId ?? null
  );

  const allTaken = proposals.every(
    (proposal) => proposal.noveltyVerdict === "already-done"
  );

  return (
    <div>
      <header className="mb-8">
        <p className={`${sectionLabel} mb-3`}>Your turn</p>
        <h2 className="max-w-2xl font-display text-2xl font-light leading-snug md:text-3xl">
          {allTaken
            ? "Every one of these has already been done."
            : "Which proposal should be taken forward?"}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {allTaken
            ? "That is worth knowing before you spend a month on it. Go back to the openings and pick a different one."
            : "Each proposal was searched for in the literature before you saw it. Read what the search covered, not just what it concluded."}
        </p>
      </header>

      <ul className="space-y-3">
        {proposals.map((proposal, index) => {
          const isTaken = proposal.noveltyVerdict === "already-done";
          const isChosen = chosen === proposal.proposalId;

          return (
            <motion.li
              key={proposal.proposalId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`border px-6 py-6 ${
                isTaken
                  ? "border-verdict-retracted/25 opacity-60"
                  : isChosen
                    ? "border-white/40 bg-white/[0.03]"
                    : "border-white/10"
              }`}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <p className="max-w-2xl font-display text-xl font-light leading-snug">
                  {proposal.title}
                </p>
                <span
                  className={`${pill} ${noveltyTone[proposal.noveltyVerdict] ?? noveltyTone["not-checked"]}`}
                >
                  {noveltyLabels[proposal.noveltyVerdict] ??
                    proposal.noveltyVerdict}
                </span>
              </div>

              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {proposal.summary}
              </p>

              <div className="mb-6">
                <p className={`${microLabel} mb-3`}>What it rests on</p>
                <ul className="space-y-2.5">
                  {proposal.components.map((component, componentIndex) => (
                    <li
                      key={`${proposal.proposalId}-${componentIndex}`}
                      className="flex flex-wrap items-start gap-3"
                    >
                      <SupportBadge support={component.support} />
                      <span className="min-w-0 flex-1 text-sm leading-relaxed">
                        {component.statement}
                        <span className="block text-xs text-muted-foreground">
                          Traces to {component.tracesTo}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className={`${microLabel} mb-2`}>
                  What the search covered · {proposal.worksSearched}{" "}
                  {proposal.worksSearched === 1 ? "work" : "works"} searched
                </p>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {proposal.priorArtNote ??
                    "The search did not record what it covered."}
                </p>

                {proposal.priorArt.length === 0 ? null : (
                  <ul className="mt-4 space-y-2">
                    {proposal.priorArt.map((entry, entryIndex) => (
                      <li
                        key={`${proposal.proposalId}-prior-${entryIndex}`}
                        className="border-l border-white/15 pl-4 text-sm leading-relaxed"
                      >
                        <span className="block">
                          {entry.title}{" "}
                          <span className="text-muted-foreground">
                            ({entry.publicationYear ?? "year unknown"})
                          </span>
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {entry.overlap}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isTaken ? null : (
                <button
                  type="button"
                  onClick={() => setChosen(proposal.proposalId)}
                  aria-pressed={isChosen}
                  className={`mt-6 rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    isChosen
                      ? "border-white/50 text-foreground"
                      : "border-white/15 text-muted-foreground hover:border-white/35"
                  }`}
                >
                  {isChosen ? "Chosen" : "Choose this one"}
                </button>
              )}
            </motion.li>
          );
        })}
      </ul>

      {allTaken ? null : (
        <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8">
          <motion.button
            type="button"
            whileHover={chosen === null ? undefined : { scale: 1.03 }}
            whileTap={chosen === null ? undefined : { scale: 0.97 }}
            disabled={chosen === null || isBusy}
            onClick={() => {
              if (chosen !== null) {
                onChoose(chosen);
              }
            }}
            className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground`}
          >
            {isBusy ? "Working" : "Design the test"}
          </motion.button>

          <p className={microLabel}>
            The next step works out how this would actually be tested
          </p>
        </div>
      )}
    </div>
  );
}
