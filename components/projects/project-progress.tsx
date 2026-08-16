"use client";

import { motion } from "framer-motion";
import type { ProjectStreamState } from "@/lib/client/use-project-stream";
import { formatDollars } from "@/lib/config/pricing";
import { microLabel, sectionLabel } from "@/lib/design/tokens";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LiveReasoning } from "@/components/dashboard/live-reasoning";
import { ProblemIcon, SpinnerIcon } from "@/components/dashboard/icons";

interface ProjectProgressProps {
  stream: ProjectStreamState;
}

export function ProjectProgress({ stream }: ProjectProgressProps) {
  const percentage = Math.round(
    (stream.completedStages / Math.max(stream.totalStages, 1)) * 100
  );

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <div className="space-y-8">
        <section>
          <p className={`${sectionLabel} mb-4`}>Working</p>

          <div className="flex items-center gap-3">
            {stream.status === "running" ? (
              <SpinnerIcon className="size-4 shrink-0 animate-spin text-accent" />
            ) : null}
            <p className="font-display text-xl font-light leading-snug">
              {stream.stageLabel}
            </p>
          </div>

          <div className="mt-5 h-px w-full bg-white/10">
            <motion.div
              className="h-px bg-accent"
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <dt className={microLabel}>Step</dt>
              <dd className="mt-1 font-display text-xl font-light">
                {stream.completedStages} of {stream.totalStages}
              </dd>
            </div>
            <div>
              <dt className={microLabel}>This step</dt>
              <dd className="mt-1 font-display text-xl font-light">
                {formatDollars(stream.spendDollars)}
              </dd>
            </div>
          </dl>
        </section>

        {stream.errorMessage === null ? null : (
          <section
            role="alert"
            className="flex gap-3 border border-verdict-retracted/40 px-5 py-4"
          >
            <ProblemIcon className="size-4 shrink-0 translate-y-0.5 text-verdict-retracted" />
            <div>
              <p className="font-display text-base font-light">
                This step could not finish
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stream.errorMessage}
              </p>
            </div>
          </section>
        )}

        {stream.activity.length === 0 ? null : (
          <section className="border-t border-white/10 pt-7">
            <p className={`${sectionLabel} mb-4`}>What happened</p>
            <div className="max-h-[22rem] overflow-y-auto pr-1">
              <ActivityFeed lines={stream.activity} />
            </div>
          </section>
        )}
      </div>

      <div className="h-[34rem]">
        <LiveReasoning agents={stream.agents} />
      </div>
    </div>
  );
}
