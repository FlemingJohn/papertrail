"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const gates = [
  {
    number: "01",
    title: "Which openings are real",
    body: "It gathers the papers, drops the retracted ones before anything is read, and maps what the set has already settled. Every opening it finds is marked by how well the papers actually back it. You keep the ones that hold.",
  },
  {
    number: "02",
    title: "Which proposal is worth the year",
    body: "One agent writes proposals. Another is told to assume each one already exists and goes looking for it. You see the papers that overlap, and the number of works actually searched, before you commit to anything.",
  },
  {
    number: "03",
    title: "Whether this would really test it",
    body: "The plan comes back with its steps, what gets measured, and the single result that would prove the idea wrong. A plan that cannot fail is not a test. Nothing is written until you approve it.",
  },
]

const outputs = [
  { label: "PDF", detail: "through your browser" },
  { label: ".tex", detail: "opens in Overleaf" },
  { label: "verified.bib", detail: "checked sources only" },
]

export function Research() {
  return (
    <section id="from-a-question" className="relative py-32 px-8 md:px-12 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-20"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">05 — FROM A QUESTION TO A DRAFT</p>
        <h2 className="font-display text-3xl md:text-5xl font-light italic max-w-3xl text-balance">
          It stops three times, and hands the decision back to you.
        </h2>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Checking a paper is one half. The other half starts from a question you have not answered yet. Give it one and
          it reads the field, finds what nobody has settled, and tries hard to prove your idea has already been done.
        </p>
      </motion.div>

      <div className="grid gap-12 md:grid-cols-3 mb-24">
        {gates.map((gate, index) => (
          <motion.div
            key={gate.number}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.12 }}
            className="border-t border-white/10 pt-6"
          >
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">{gate.number}</p>
            <h3 className="font-display text-xl md:text-2xl mb-4 text-balance">{gate.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{gate.body}</p>
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
          <span className="font-mono text-xs text-muted-foreground">p2</span>
          <span className="text-sm">
            Comparative study of retrieval augmentation across different long context language models
          </span>
        </div>

        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">What it rests on</p>

          <ul className="space-y-3">
            <li className="flex flex-wrap items-start gap-3">
              <span className="font-mono text-[10px] tracking-wider px-3 py-1 border border-verdict-supported/50 text-verdict-supported rounded-full whitespace-nowrap">
                The papers say this
              </span>
              <span className="min-w-0 flex-1 text-sm leading-relaxed">
                Different long context models can be compared on the same reasoning benchmarks.
              </span>
            </li>

            <li className="flex flex-wrap items-start gap-3">
              <span className="font-mono text-[10px] tracking-wider px-3 py-1 border border-verdict-wrong-source/50 text-verdict-wrong-source rounded-full whitespace-nowrap">
                Read across the papers
              </span>
              <span className="min-w-0 flex-1 text-sm leading-relaxed">
                Retrieval augmentation may have varying effects on different models.
              </span>
            </li>

            <li className="flex flex-wrap items-start gap-3">
              <span className="font-mono text-[10px] tracking-wider px-3 py-1 border border-verdict-retracted/50 text-verdict-retracted rounded-full whitespace-nowrap">
                Not backed by the papers
              </span>
              <span className="min-w-0 flex-1 text-sm leading-relaxed">
                The effect differs by architecture and training data.
              </span>
            </li>
          </ul>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Prior art</span>
            <span className="font-mono text-xs border border-verdict-wrong-source/50 text-verdict-wrong-source px-2 py-0.5">
              Close work exists
            </span>
            <span className="font-mono text-xs text-muted-foreground">40 works searched</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Three papers already benchmark retrieval augmentation across models. None of them isolates multi step
            reasoning. Nothing found would have meant these searches, on this database, today — never that the idea is
            new.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="mt-12 flex flex-wrap items-end justify-between gap-8"
      >
        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
            The draft comes out as
          </p>

          <div className="flex flex-wrap gap-3">
            {outputs.map((output) => (
              <span key={output.label} className="border border-white/10 px-4 py-2">
                <span className="font-mono text-xs block">{output.label}</span>
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{output.detail}</span>
              </span>
            ))}
          </div>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            It can only cite sources that survived checking. A citation the writer invents anyway is stripped and marked
            in the text, and everything left out is listed with the reason.
          </p>
        </div>

        <div className="md:text-right">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
            Measured, question to draft
          </p>
          <p className="font-display text-4xl md:text-5xl font-light tracking-tight">$0.11</p>

          <Link
            href="/projects/new"
            data-cursor-hover
            className="mt-6 inline-block font-mono text-xs tracking-widest uppercase border border-white/20 rounded-full px-5 py-2 hover:bg-white hover:text-black transition-colors duration-300"
          >
            Start a project
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
