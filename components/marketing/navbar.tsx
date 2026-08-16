"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/logo"

const sections = [
  { label: "How it works", target: "#how-it-works" },
  { label: "What it checks", target: "#what-it-checks" },
  { label: "From a question", target: "#from-a-question" },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 px-8 md:px-12 py-6"
    >
      <nav className="flex items-center justify-between">
        <Link href="/" data-cursor-hover className="text-foreground">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {sections.map((section) => (
            <a
              key={section.target}
              href={section.target}
              data-cursor-hover
              className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {section.label}
            </a>
          ))}

          <Link
            href="/check"
            data-cursor-hover
            className="font-mono text-xs tracking-widest uppercase border border-white/20 rounded-full px-5 py-2 hover:bg-white hover:text-black transition-colors duration-300"
          >
            Check a paper
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`block h-px w-6 bg-foreground transition-transform ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`block h-px w-6 bg-foreground transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-px w-6 bg-foreground transition-transform ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </nav>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-8">
              {sections.map((section) => (
                <a
                  key={section.target}
                  href={section.target}
                  onClick={() => setIsMenuOpen(false)}
                  className="font-mono text-xs tracking-widest uppercase text-muted-foreground"
                >
                  {section.label}
                </a>
              ))}
              <Link
                href="/check"
                className="font-mono text-xs tracking-widest uppercase border border-white/20 rounded-full px-5 py-2 text-center"
              >
                Check a paper
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}
