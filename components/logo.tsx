"use client";

import { motion } from "framer-motion";

interface LogoMarkProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

const easing = [0.25, 0.46, 0.45, 0.94] as const;

export function LogoMark({
  size = 28,
  className = "",
  isAnimated = true,
}: LogoMarkProps) {
  function drawProps(delay: number) {
    if (!isAnimated) {
      return {};
    }

    return {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1 },
      transition: { duration: 0.9, delay, ease: easing },
    };
  }

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
        initial={isAnimated ? { opacity: 0 } : undefined}
        animate={isAnimated ? { opacity: 1 } : undefined}
        transition={{ duration: 0.5 }}
      />

      <motion.path
        d="M9 3.5h9l5.5 5.5v16a2.5 2.5 0 0 1-2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5v-19A2.5 2.5 0 0 1 9 3.5Z"
        {...drawProps(0)}
      />

      <motion.path d="M18 3.5V9h5.5" {...drawProps(0.35)} />

      <motion.path
        d="M10.5 13.5h9M10.5 17h6"
        strokeOpacity={0.55}
        {...drawProps(0.6)}
      />

      <motion.path
        d="M10.5 20.5h4c3.4 0 5.2 2.4 5.2 5"
        stroke="var(--accent)"
        {...drawProps(0.85)}
      />

      <motion.circle
        cx="19.7"
        cy="25.5"
        r="1.9"
        fill="var(--accent)"
        stroke="none"
        style={{ transformOrigin: "19.7px 25.5px" }}
        initial={isAnimated ? { scale: 0, opacity: 0 } : undefined}
        animate={isAnimated ? { scale: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.45, delay: 1.6, ease: easing }}
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
          initial={isAnimated ? { opacity: 0, x: -6 } : undefined}
          animate={isAnimated ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.3em]"
        >
          PaperTrail
        </motion.span>
      )}
    </span>
  );
}
