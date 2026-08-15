"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const evidenceSources = [
  { label: "OpenAlex", href: "https://openalex.org" },
  { label: "Crossref", href: "https://www.crossref.org" },
  { label: "Europe PMC", href: "https://europepmc.org" },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-8 md:px-12 py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-6">06 — START</p>

        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-8 text-balance">
          Check a paper you
          <br />
          <span className="italic">are about to cite.</span>
        </h2>

        <Link
          href="/check"
          data-cursor-hover
          className="inline-block font-mono text-sm tracking-widest uppercase border border-white/20 rounded-full px-8 py-4 hover:bg-white hover:text-black transition-colors duration-500"
        >
          Check a paper
        </Link>
      </motion.div>

      <div className="grid gap-10 md:grid-cols-3 border-t border-white/10 pt-10">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Evidence from</p>
          <ul className="space-y-2">
            {evidenceSources.map((source) => (
              <li key={source.label}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-hover
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">The tool</p>
          <ul className="space-y-2">
            <li>
              <Link
                href="/check"
                data-cursor-hover
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Check a paper
              </Link>
            </li>
            <li>
              <Link
                href="/watchlist"
                data-cursor-hover
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Watchlist
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/FlemingJohn/papertrail"
                target="_blank"
                rel="noreferrer"
                data-cursor-hover
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Source and documentation
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Honest limits</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Roughly half of cited sources sit behind a paywall. Those come back marked unverified rather than wrong.
            Every report says what it could not cover.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 mt-10 pt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          PaperTrail — every claim, traced
        </p>
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Built for the Research Agents Hack, IIT Madras
        </p>
      </div>
    </footer>
  )
}
