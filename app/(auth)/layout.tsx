import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-8 py-6 md:px-12">
        <Link href="/" className="inline-block text-foreground">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center px-8 pb-20 md:px-12">
        {children}
      </main>
    </div>
  );
}
