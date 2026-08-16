"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ProjectSummary } from "@/lib/client/project-types";
import { stageLabels } from "@/lib/client/project-types";
import { formatDollars } from "@/lib/config/pricing";
import {
  buttonSecondary,
  displayMedium,
  microLabel,
  pill,
  sectionLabel,
} from "@/lib/design/tokens";
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { ProblemIcon, SpinnerIcon } from "@/components/dashboard/icons";

export default function ProjectsPage() {
  return (
    <ErrorBoundary>
      <ProjectList />
    </ErrorBoundary>
  );
}

function ProjectList() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const body = (await response.json()) as {
        projects?: ProjectSummary[];
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(body.error ?? "Your projects could not be loaded.");
        return;
      }

      setProjects(body.projects ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Your projects could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex flex-wrap items-end justify-between gap-6"
      >
        <div>
          <p className={`${sectionLabel} mb-4`}>Research projects</p>
          <h1 className={displayMedium}>An idea, taken to a draft.</h1>
        </div>

        <Link href="/projects/new" className={buttonSecondary}>
          Start a project
        </Link>
      </motion.header>

      {errorMessage === null ? null : (
        <div
          role="alert"
          className="mb-10 flex gap-4 border border-verdict-retracted/40 px-6 py-5"
        >
          <ProblemIcon className="size-5 shrink-0 translate-y-0.5 text-verdict-retracted" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {errorMessage}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <SpinnerIcon className="size-4 animate-spin" />
          Loading your projects
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-white/10 px-6 py-10">
          <p className="mb-3 font-display text-xl font-light">
            No projects yet.
          </p>
          <p className="mb-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Give it a research question. It gathers the papers, maps what they
            have already settled, and shows you where the openings are. You
            decide which of those are real before anything is proposed.
          </p>
          <Link href="/projects/new" className={buttonSecondary}>
            Start a project
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {projects.map((project, index) => (
            <motion.li
              key={project.projectId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
            >
              <Link
                href={`/projects/${project.projectId}`}
                className="block border border-white/10 px-6 py-5 transition-colors hover:border-white/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <p className="max-w-xl font-display text-lg font-light leading-snug">
                    {project.question}
                  </p>

                  <span
                    className={`${pill} ${
                      project.status === "waiting"
                        ? "border-accent/50 text-accent"
                        : project.status === "failed"
                          ? "border-verdict-retracted/50 text-verdict-retracted"
                          : project.status === "finished"
                            ? "border-verdict-supported/50 text-verdict-supported"
                            : "border-white/20 text-muted-foreground"
                    }`}
                  >
                    {stageLabels[project.stage] ?? project.stage}
                  </span>
                </div>

                <p className={`${microLabel} mt-3`}>
                  {project.paperTarget} papers wanted ·{" "}
                  {formatDollars(project.costDollars)} so far ·{" "}
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
