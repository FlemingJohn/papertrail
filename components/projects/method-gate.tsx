"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ProjectProposal } from "@/lib/client/project-types";
import {
  buttonPrimary,
  buttonQuiet,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { WarningIcon } from "@/components/dashboard/icons";

interface MethodGateProps {
  proposal: ProjectProposal;
  isBusy: boolean;
  onApprove: (authorName: string) => void;
  onSendBack: () => void;
}

export function MethodGate({
  proposal,
  isBusy,
  onApprove,
  onSendBack,
}: MethodGateProps) {
  const [authorName, setAuthorName] = useState("Fleming John");
  const method = proposal.method;

  if (method === null) {
    return null;
  }

  const isNameValid = authorName.trim().length >= 2;

  return (
    <div>
      <header className="mb-8">
        <p className={`${sectionLabel} mb-3`}>Your turn</p>
        <h2 className="max-w-2xl font-display text-2xl font-light leading-snug md:text-3xl">
          Would this actually test the idea?
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Nothing is written until you approve this plan. Read the falsifying
          result first, because a plan that cannot fail is not a test.
        </p>
      </header>

      <section className="mb-10 border border-white/10 px-6 py-6">
        <p className={`${microLabel} mb-4`}>The steps</p>
        <ol className="space-y-3">
          {method.steps.map((step, index) => (
            <li key={`step-${index}`} className="flex gap-4">
              <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <section className="border border-white/10 px-6 py-6">
          <p className={`${microLabel} mb-4`}>What gets measured</p>
          <ul className="space-y-2">
            {method.whatIsMeasured.map((measure, index) => (
              <li key={`measure-${index}`} className="text-sm leading-relaxed">
                {measure}
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-verdict-supported/30 px-6 py-6">
          <p className={`${microLabel} mb-4`}>What would show it is wrong</p>
          <p className="text-sm leading-relaxed">
            {method.whatWouldFalsifyIt}
          </p>
        </section>
      </div>

      <section
        className={`mb-10 flex gap-4 border px-6 py-5 ${
          method.isCostVerified
            ? "border-white/10"
            : "border-verdict-wrong-source/40"
        }`}
      >
        {method.isCostVerified ? null : (
          <WarningIcon className="size-4 shrink-0 translate-y-0.5 text-verdict-wrong-source" />
        )}
        <div>
          <p className={`${microLabel} mb-2`}>
            {method.isCostVerified
              ? "Cost, carried from a paper that reported it"
              : "Cost, unverified estimate"}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {method.estimatedCost}
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 pt-8">
        <label htmlFor="author-name" className={`${microLabel} mb-3 block`}>
          Name to put on the draft
        </label>
        <input
          id="author-name"
          type="text"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          className="mb-8 w-full max-w-sm border-b border-white/20 bg-transparent pb-2 font-display text-lg font-light outline-none transition-colors focus:border-white/50"
        />

        <div className="flex flex-wrap items-center gap-5">
          <motion.button
            type="button"
            whileHover={isNameValid ? { scale: 1.03 } : undefined}
            whileTap={isNameValid ? { scale: 0.97 } : undefined}
            disabled={!isNameValid || isBusy}
            onClick={() => onApprove(authorName.trim())}
            className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground`}
          >
            {isBusy ? "Writing" : "Write the draft"}
          </motion.button>

          <button type="button" onClick={onSendBack} className={buttonQuiet}>
            Send back
          </button>

          <p className={microLabel}>
            The draft cites only sources that survived checking
          </p>
        </div>
      </section>
    </div>
  );
}
