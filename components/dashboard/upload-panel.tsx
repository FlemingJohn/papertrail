"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { RunDepth } from "@/lib/schemas/run";
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
  { value: "quick", label: "Quick", detail: "The paper on its own" },
  { value: "standard", label: "Standard", detail: "Plus 5 related papers" },
  { value: "deep", label: "Deep", detail: "Plus 10 related papers" },
];

const maximumFileBytes = 20 * 1024 * 1024;

export function UploadPanel({
  isRunning,
  onStart,
  onCancel,
}: UploadPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
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
    <section className="border border-border/60 bg-card/40 p-6">
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
        className={`flex flex-col items-center justify-center border border-dashed px-6 py-10 transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        {file === null ? (
          <UploadIcon className="mb-3 size-7 text-muted-foreground" />
        ) : (
          <DocumentIcon className="mb-3 size-7 text-accent" />
        )}

        <p className="mb-1 text-sm text-foreground">
          {file === null ? "Drop a PDF here" : file.name}
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          {file === null
            ? "or choose a file to check"
            : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
        </p>

        <label
          htmlFor={inputId}
          className="cursor-pointer border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {file === null ? "Choose file" : "Choose a different file"}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
      </div>

      {problem === null ? null : (
        <p
          role="alert"
          className="mt-3 border border-verdict-retracted/40 px-3 py-2 text-xs text-verdict-retracted"
        >
          {problem}
        </p>
      )}

      <fieldset className="mt-5">
        <legend className="mb-2 text-xs tracking-wide uppercase text-muted-foreground">
          How deep
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {depthOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDepth(option.value)}
              aria-pressed={depth === option.value}
              className={`border px-3 py-2.5 text-left transition-colors ${
                depth === option.value
                  ? "border-accent text-foreground"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <span className="block text-sm">{option.label}</span>
              <span className="block text-xs text-muted-foreground">
                {option.detail}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={file === null || isRunning}
          onClick={() => {
            if (file !== null) {
              onStart(file, depth);
            }
          }}
          className="flex-1 bg-foreground px-4 py-2.5 text-sm text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isRunning ? "Checking…" : "Check this paper"}
        </button>

        {isRunning ? (
          <button
            type="button"
            onClick={onCancel}
            className="border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-verdict-retracted hover:text-verdict-retracted"
          >
            Stop
          </button>
        ) : null}
      </div>
    </section>
  );
}
