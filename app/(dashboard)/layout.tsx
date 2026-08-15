import type { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-display text-lg text-foreground">
            PaperTrail
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href="/check"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Check a paper
            </Link>
            <Link
              href="/watchlist"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Watchlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
