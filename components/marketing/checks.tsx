"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

const checks = [
  {
    stage: "01",
    title: "Citations",
    tags: ["Supported", "Not supported", "Could not check"],
    description:
      "Reads the cited paper and decides whether it says what the sentence claims it says. Three agents argue it out before a verdict is recorded.",
  },
  {
    stage: "02",
    title: "Source tracing",
    tags: ["Original", "Indirect source"],
    description:
      "Follows a finding back through the papers that repeated it. A number can survive three hops while its conditions quietly fall away.",
  },
  {
    stage: "03",
    title: "Retractions",
    tags: ["Retracted"],
    description:
      "Checks every source against the retraction record before anything is built on it, and marks every claim that leaned on one.",
  },
  {
    stage: "04",
    title: "Numbers",
    tags: ["Both agreed", "Resolved", "Still disputed"],
    description:
      "Two agents extract every value independently. A third resolves disagreements from the source text, and the agreement rate is reported.",
  },
  {
    stage: "05",
    title: "Methods",
    tags: ["Critical", "Major", "Minor"],
    description:
      "Lists what is missing that would stop someone repeating the work, and writes the question to put to the authors.",
  },
  {
    stage: "06",
    title: "Conflicts",
    tags: ["Explained", "Unexplained"],
    description:
      "Finds related papers that disagree and works out why. Dose, population and measurement are tested before an explanation is accepted.",
  },
]

export function Checks() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  const handleMouseMove = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(event.clientX - rect.left)
      mouseY.set(event.clientY - rect.top)
    }
  }

  return (
    <section id="what-it-checks" className="relative py-32 px-8 md:px-12 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-24"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">04 — WHAT IT CHECKS</p>
        <h2 className="font-display text-3xl md:text-5xl font-light italic">Six things, and what it cannot.</h2>
      </motion.div>

      <div ref={containerRef} onMouseMove={handleMouseMove} className="relative">
        {checks.map((check, index) => (
          <motion.div
            key={check.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.08 }}
            className="relative border-t border-white/10 py-8 md:py-10"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div data-cursor-hover className="group flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="font-mono text-xs text-muted-foreground tracking-widest order-1 md:order-none">
                {check.stage}
              </span>

              <motion.h3
                className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight flex-1 transition-colors duration-300 group-hover:text-white/70"
                animate={{ x: hoveredIndex === index ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {check.title}
              </motion.h3>

              <div className="flex gap-2 flex-wrap order-2 md:order-none">
                {check.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] tracking-wider px-3 py-1 border border-white/20 rounded-full text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          className="absolute pointer-events-none z-50 w-72 md:w-80 border border-white/20 bg-[#0a0a0a]/95 backdrop-blur-sm p-4"
          style={{ x: springX, y: springY, translateX: "-50%", translateY: "-160%" }}
          animate={{
            opacity: hoveredIndex !== null ? 1 : 0,
            scale: hoveredIndex !== null ? 1 : 0.9,
          }}
          transition={{ duration: 0.2 }}
        >
          {hoveredIndex !== null ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{checks[hoveredIndex].description}</p>
          ) : null}
        </motion.div>
      </div>

      <div className="border-t border-white/10" />
    </section>
  )
}
