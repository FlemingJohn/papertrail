import type { ReactNode } from "react";
import Link from "next/link";
import { buttonSecondary } from "@/lib/design/tokens";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 px-8 py-6 backdrop-blur md:px-12">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.3em]"
          >
            PaperTrail
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/check"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Check
            </Link>
            <Link
              href="/watchlist"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Watchlist
            </Link>
            <Link href="/" className={buttonSecondary}>
              Home
            </Link>
          </div>
        </nav>
      </header>

      <main className="px-8 py-12 md:px-12 md:py-16">{children}</main>
    </div>
  );
}
