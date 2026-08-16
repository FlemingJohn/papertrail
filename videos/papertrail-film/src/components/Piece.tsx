import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const rise = (frame: number, at: number, span = 20) =>
  interpolate(frame, [at, at + span], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const Card: React.FC<{
  at: number;
  title: string;
  detail?: string;
  agents?: string;
  tone?: string;
  glow?: boolean;
  width?: number;
  children?: React.ReactNode;
}> = ({ at, title, detail, agents, tone = theme.rule, glow = false, width, children }) => {
  const frame = useCurrentFrame();
  const appear = rise(frame, at);

  return (
    <div
      style={{
        width,
        opacity: appear,
        translate: `0px ${interpolate(appear, [0, 1], [26, 0])}px`,
        backgroundColor: theme.raised,
        border: `1px solid ${tone}`,
        boxShadow: glow ? `0 0 34px 2px rgba(37,99,235,0.28)` : "none",
        padding: "22px 26px",
        borderRadius: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: theme.mono,
            fontSize: 24,
            letterSpacing: 2,
            color: theme.ink,
          }}
        >
          {title}
        </span>
        {agents === undefined ? null : (
          <span style={{ fontFamily: theme.mono, fontSize: 19, color: theme.faint }}>
            {agents}
          </span>
        )}
      </div>

      {detail === undefined ? null : (
        <div style={{ fontSize: 21, color: theme.muted, marginTop: 8 }}>{detail}</div>
      )}

      {children}
    </div>
  );
};

export const Connector: React.FC<{ at: number; width?: number; vertical?: boolean }> = ({
  at,
  width = 60,
  vertical = false,
}) => {
  const frame = useCurrentFrame();

  const drawn = interpolate(frame, [at, at + 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (vertical) {
    return (
      <div style={{ width: 2, height: width, position: "relative", margin: "0 auto" }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: theme.rule }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 2,
            height: `${drawn}%`,
            backgroundColor: theme.accent,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ height: 2, width, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: theme.rule }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 2,
          width: `${drawn}%`,
          backgroundColor: theme.accent,
        }}
      />
    </div>
  );
};

export const SceneTitle: React.FC<{ at: number; children: React.ReactNode }> = ({
  at,
  children,
}) => {
  const frame = useCurrentFrame();
  const appear = rise(frame, at, 24);

  return (
    <div
      style={{
        fontFamily: theme.serif,
        fontStyle: "italic",
        fontSize: 58,
        color: theme.ink,
        marginBottom: 52,
        opacity: appear,
        translate: `0px ${interpolate(appear, [0, 1], [20, 0])}px`,
        textWrap: "balance",
      }}
    >
      {children}
    </div>
  );
};
