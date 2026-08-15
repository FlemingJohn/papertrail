"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
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
      <div className="border border-verdict-retracted/40 bg-card/40 p-6">
        <div className="mb-3 flex items-center gap-2 text-verdict-retracted">
          <ProblemIcon className="size-5" />
          <h2 className="text-sm">This section could not be displayed</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {this.state.message}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ message: null })}
          className="border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          Try again
        </button>
      </div>
    );
  }
}
