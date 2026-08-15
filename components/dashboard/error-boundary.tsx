"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { buttonQuiet, sectionLabel } from "@/lib/design/tokens";
import { ProblemIcon } from "./icons";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { message: null };

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while displaying this page.",
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Dashboard render failed", error, info.componentStack);
  }

  public render(): ReactNode {
    if (this.state.message === null) {
      return this.props.children;
    }

    return (
      <div className="border-t border-verdict-retracted/40 pt-8">
        <div className="mb-4 flex items-center gap-3">
          <ProblemIcon className="size-5 text-verdict-retracted" />
          <p className={`${sectionLabel} text-verdict-retracted`}>
            This section could not be displayed
          </p>
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {this.state.message}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ message: null })}
          className={buttonQuiet}
        >
          Try again
        </button>
      </div>
    );
  }
}
