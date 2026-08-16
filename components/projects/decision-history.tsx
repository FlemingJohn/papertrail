"use client";

import { motion } from "framer-motion";
import type { ProjectGap, ProjectProposal } from "@/lib/client/project-types";
import { noveltyLabels } from "@/lib/client/project-types";
import { microLabel, pill, sectionLabel } from "@/lib/design/tokens";
import { SupportBadge } from "./support-badge";

interface DecisionHistoryProps {
  gaps: ProjectGap[];
  proposals: ProjectProposal[];
}

const noveltyTone: Record<string, string> = {
  "nothing-found": "border-verdict-supported/50 text-verdict-supported",
  "similar-work-exists":
    "border-verdict-wrong-source/50 text-verdict-wrong-source",
  "already-done": "border-verdict-retracted/50 text-verdict-retracted",
  "not-checked": "border-white/20 text-muted-foreground",
};

const decisionTone: Record<string, string> = {
  accepted: "border-verdict-supported/50 text-verdict-supported",
  rejected: "border-white/15 text-muted-foreground",
  pending: "border-white/20 text-muted-foreground",
};

const decisionLabels: Record<string, string> = {
  accepted: "You kept this",
  rejected: "You set this aside",
  pending: "Not decided",
};

export function DecisionHistory({ gaps, proposals }: DecisionHistoryProps) {
  if (gaps.length === 0 && proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-14">
      {gaps.length === 0 ? null : (
        <section className="border-t border-white/10 pt-10">
          <p className={`${sectionLabel} mb-2`}>The openings it found</p>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each one is marked by how well the papers in this project actually
            back it. These are openings in this set of papers, not in the whole
            field.
          </p>

          <ul className="space-y-2">
            {gaps.map((gap, index) => (
              <motion.li
                key={gap.gapId}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border border-white/10 px-6 py-5"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                  <p className="max-w-2xl font-display text-lg font-light leading-snug">
                    {gap.headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SupportBadge support={gap.support} />
                    <span
                      className={`${pill} ${decisionTone[gap.decision] ?? decisionTone.pending}`}
                    >
                      {decisionLabels[gap.decision] ?? gap.decision}
                    </span>
                  </div>
                </div>

                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {gap.evidence}
                </p>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {proposals.length === 0 ? null : (
        <section className="border-t border-white/10 pt-10">
          <p className={`${sectionLabel} mb-2`}>
            What it proposed, and whether it already exists
          </p>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            One agent wrote these. A second was told to assume each one already
            existed and go and find it. The count is how many works that search
            actually returned.
          </p>

          <ul className="space-y-3">
            {proposals.map((proposal, index) => (
              <motion.li
                key={proposal.proposalId}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`border px-6 py-6 ${
                  proposal.decision === "accepted"
                    ? "border-verdict-supported/35 bg-white/[0.02]"
                    : "border-white/10"
                }`}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <p className="max-w-2xl font-display text-xl font-light leading-snug">
                    {proposal.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`${pill} ${noveltyTone[proposal.noveltyVerdict] ?? noveltyTone["not-checked"]}`}
                    >
                      {noveltyLabels[proposal.noveltyVerdict] ??
                        proposal.noveltyVerdict}
                    </span>
                    <span className={`${pill} border-white/15 text-muted-foreground`}>
                      {proposal.worksSearched} searched
                    </span>
                  </div>
                </div>

                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {proposal.summary}
                </p>

                {proposal.components.length === 0 ? null : (
                  <div className="mb-6">
                    <p className={`${microLabel} mb-3`}>What it stands on</p>
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
                )}

                <div className="border-t border-white/10 pt-4">
                  <p className={`${microLabel} mb-2`}>What the search covered</p>
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
              </motion.li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
