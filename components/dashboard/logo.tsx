"use client";

import { motion } from "framer-motion";

interface LogoMarkProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

export function LogoMark({
  size = 28,
  className = "",
  isAnimated = true,
}: LogoMarkProps) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] },
        opacity: { duration: 0.2, delay },
      },
    }),
  } as const;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <motion.path
        d="M9 3.5h9l5.5 5.5v16a2.5 2.5 0 0 1-2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5v-19A2.5 2.5 0 0 1 9 3.5Z"
        fill="currentColor"
        fillOpacity={0.1}
        stroke="none"
        initial={isAnimated ? { opacity: 0 } : false}
        animate={isAnimated ? { opacity: 1 } : undefined}
        transition={{ duration: 0.5 }}
      />

      <motion.path
        d="M9 3.5h9l5.5 5.5v16a2.5 2.5 0 0 1-2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5v-19A2.5 2.5 0 0 1 9 3.5Z"
        variants={draw}
        initial={isAnimated ? "hidden" : false}
        animate={isAnimated ? "visible" : undefined}
        custom={0}
      />

      <motion.path
        d="M18 3.5V9h5.5"
        variants={draw}
        initial={isAnimated ? "hidden" : false}
        animate={isAnimated ? "visible" : undefined}
        custom={0.35}
      />

      <motion.path
        d="M10.5 13.5h9M10.5 17h6"
        variants={draw}
        initial={isAnimated ? "hidden" : false}
        animate={isAnimated ? "visible" : undefined}
        custom={0.6}
        strokeOpacity={0.55}
      />

      <motion.path
        d="M10.5 20.5h4c3.4 0 5.2 2.4 5.2 5"
        stroke="var(--accent)"
        variants={draw}
        initial={isAnimated ? "hidden" : false}
        animate={isAnimated ? "visible" : undefined}
        custom={0.85}
      />

      <motion.circle
        cx="19.7"
        cy="25.5"
        r="1.9"
        fill="var(--accent)"
        stroke="none"
        initial={isAnimated ? { scale: 0, opacity: 0 } : false}
        animate={
          isAnimated ? { scale: [0, 1.35, 1], opacity: 1 } : undefined
        }
        transition={{ duration: 0.5, delay: 1.6, times: [0, 0.6, 1] }}
        style={{ transformOrigin: "19.7px 25.5px" }}
      />
    </svg>
  );
}

interface LogoProps {
  isCompact?: boolean;
  isAnimated?: boolean;
}

export function Logo({ isCompact = false, isAnimated = true }: LogoProps) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark isAnimated={isAnimated} />

      {isCompact ? null : (
        <motion.span
          initial={isAnimated ? { opacity: 0, x: -6 } : false}
          animate={isAnimated ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="font-mono text-xs uppercase tracking-[0.3em] whitespace-nowrap"
        >
          PaperTrail
        </motion.span>
      )}
    </span>
  );
}
