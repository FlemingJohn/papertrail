"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "@/lib/auth/actions";
import { microLabel } from "@/lib/design/tokens";

interface AccountMenuProps {
  email: string;
}

export function AccountMenu({ email }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (
        containerRef.current !== null &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Your account"
        className="flex size-8 items-center justify-center rounded-full border border-white/20 font-mono text-xs uppercase text-muted-foreground transition-colors hover:border-white/40 hover:text-foreground"
      >
        {email.slice(0, 1).toUpperCase()}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-11 w-64 border border-white/15 bg-background/95 backdrop-blur"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className={microLabel}>Signed in as</p>
              <p className="mt-1 truncate text-sm">{email}</p>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="w-full px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
