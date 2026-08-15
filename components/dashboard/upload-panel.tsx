"use client";

import { useCallback, useId, useState } from "react";
import { motion } from "framer-motion";
import type { RunDepth } from "@/lib/schemas/run";
import { buttonPrimary, buttonQuiet, sectionLabel } from "@/lib/design/tokens";
import { DocumentIcon, UploadIcon } from "./icons";

interface UploadPanelProps {
  isRunning: boolean;
  onStart: (file: File, depth: RunDepth) => void;
  onCancel: () => void;
}

const depthOptions: Array<{
  value: RunDepth;
  label: string;
  detail: string;
}> = [
  { value: "quick", label: "Quick", detail: "the paper alone" },
  { value: "standard", label: "Standard", detail: "plus 5 papers" },
  { value: "deep", label: "Deep", detail: "plus 10 papers" },
];

const maximumFileBytes = 20 * 1024 * 1024;

export function UploadPanel({
  isRunning,
  onStart,
  onCancel,
}: UploadPanelProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [depth, setDepth] = useState<RunDepth>("standard");
  const [isDragging, setIsDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const acceptFile = useCallback((candidate: File | undefined) => {
    if (candidate === undefined) {
      return;
    }

    if (candidate.type !== "application/pdf") {
      setProblem("That file is not a PDF. Convert it and try again.");
      return;
    }

    if (candidate.size > maximumFileBytes) {
      setProblem("That PDF is larger than 20 MB.");
      return;
    }

    setProblem(null);
    setFile(candidate);
  }, []);

  return (
    <section className="border-t border-white/10 pt-8">
      <p className={`${sectionLabel} mb-6`}>01 — The paper</p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          acceptFile(event.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center justify-center border border-dashed py-14 transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-white/15"
        }`}
      >
        {file === null ? (
          <UploadIcon className="mb-4 size-7 text-muted-foreground" />
        ) : (
          <DocumentIcon className="mb-4 size-7 text-accent" />
        )}

        <p className="mb-1 font-display text-xl font-light">
          {file === null ? "Drop a PDF here" : file.name}
        </p>
        <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {file === null
            ? "or choose a file to check"
            : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
        </p>

        <label htmlFor={inputId} className={`${buttonQuiet} cursor-pointer`}>
          {file === null ? "Choose file" : "Choose another"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
      </div>

      {problem === null ? null : (
        <p
          role="alert"
          className="mt-4 border border-verdict-retracted/40 px-4 py-3 text-sm text-verdict-retracted"
        >
          {problem}
        </p>
      )}

      <fieldset className="mt-8">
        <legend className={`${sectionLabel} mb-4`}>02 — How deep</legend>
        <div className="flex flex-wrap gap-2">
          {depthOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDepth(option.value)}
              aria-pressed={depth === option.value}
              className={`rounded-full border px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-300 ${
                depth === option.value
                  ? "border-white/60 text-foreground"
                  : "border-white/20 text-muted-foreground hover:border-white/40"
              }`}
            >
              {option.label}
              <span className="ml-2 normal-case tracking-normal opacity-60">
                {option.detail}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          whileHover={file === null || isRunning ? undefined : { scale: 1.03 }}
          whileTap={file === null || isRunning ? undefined : { scale: 0.97 }}
          disabled={file === null || isRunning}
          onClick={() => {
            if (file !== null) {
              onStart(file, depth);
            }
          }}
          className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground`}
        >
          {isRunning ? "Checking" : "Check this paper"}
        </motion.button>

        {isRunning ? (
          <button type="button" onClick={onCancel} className={buttonQuiet}>
            Stop
          </button>
        ) : null}
      </div>
    </section>
  );
}
