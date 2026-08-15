"use client"

import { motion } from "framer-motion"

const principles = [
  {
    number: "01",
    title: "Three agents judge a citation, not one",
    body: "One argues the citation fails. One argues it holds. Neither sees the other's argument. A third reads both and decides. A single reader asked whether a citation is sound tends to agree with whatever it just read.",
  },
  {
    number: "02",
    title: "Numbers are read twice, independently",
    body: "Two agents extract every value without seeing each other's work, exactly as a systematic review uses two humans. Where they disagree, a judge resolves it from the source. The disagreement rate is reported, not hidden.",
  },
  {
    number: "03",
    title: "What could not be checked is said out loud",
    body: "Half of cited sources sit behind a paywall. Those come back marked unverified, never wrong. Every report ends with what it did not cover, because a check that hides its own gaps invites more trust than it has earned.",
  },
]

export function About() {
  return (
    <section id="how-it-works" className="relative py-32 px-8 md:px-12 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-20"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">03 — HOW IT WORKS</p>
        <h2 className="font-display text-3xl md:text-5xl font-light italic max-w-3xl text-balance">
          Reading a paper is not the hard part. Checking it is.
        </h2>
      </motion.div>

      <div className="grid gap-12 md:grid-cols-3 mb-24">
        {principles.map((principle, index) => (
          <motion.div
            key={principle.number}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.12 }}
            className="border-t border-white/10 pt-6"
          >
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">{principle.number}</p>
            <h3 className="font-display text-xl md:text-2xl mb-4 text-balance">{principle.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="border border-white/10"
      >
        <div className="border-b border-white/10 px-5 py-3 flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-xs text-muted-foreground">c17</span>
          <span className="text-sm">Compound X reduced tumor volume by 43% versus control [12].</span>
        </div>

        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="p-5">
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Challenger</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Reference [12] is a review. It attributes the figure to Okonkwo 2019, which used a xenograft model. The
              statement drops that qualifier.
            </p>
          </div>

          <div className="p-5">
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Supporter</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The numeric value is reproduced faithfully, and a review is a legitimate secondary source for a figure of
              this kind.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Judge</span>
            <span className="font-mono text-xs border border-[#2563eb]/50 text-[#2563eb] px-2 py-0.5">Wrong source</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The value survives; the model system does not. Cite Okonkwo directly and state the model.
          </p>
        </div>
      </motion.div>
    </section>
  )
}
