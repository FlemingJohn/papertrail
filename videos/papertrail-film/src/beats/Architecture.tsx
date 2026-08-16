import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Card, Connector, SceneTitle, rise } from "../components/Piece";
import { beats, seconds, theme } from "../theme";

const at = (absoluteSeconds: number) =>
  seconds(absoluteSeconds - beats.architecture.from);

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: theme.ground,
      color: theme.ink,
      fontFamily: theme.sans,
      padding: "90px 120px 190px",
      justifyContent: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Pipeline: React.FC = () => (
  <Stage>
    <SceneTitle at={0}>
      Thirty-two agents. Each one in its own file, each doing a single job.
    </SceneTitle>

    <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 1500 }}>
      <Card at={18} title="THE PAPER" detail="read once, every block keeps its page and position" />
      <Connector at={34} width={34} vertical />
      <Card at={40} title="FIND THE CHECKABLE CLAIMS" agents="claim-finder · 1" />
      <Connector at={56} width={34} vertical />
      <Card
        at={62}
        title="FOUR LANES, ALL AT ONCE"
        detail="citations · numbers · methods · related work"
        agents="12"
      />
      <Connector at={78} width={34} vertical />
      <Card
        at={84}
        title="THE EVIDENCE LEDGER"
        detail="typed records, never prose · all four lanes write at once"
        tone="rgba(34,197,94,0.4)"
      />
    </div>
  </Stage>
);

const lanes = [
  {
    title: "CITATIONS",
    agents: "5",
    body: "resolve · challenge · support · judge · trace",
  },
  { title: "NUMBERS", agents: "3", body: "read twice, blind, then adjudicated" },
  { title: "METHODS", agents: "2", body: "rewritten as steps, gaps listed" },
  { title: "RELATED WORK", agents: "2", body: "2–10 comparable papers" },
];

const Lanes: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Stage>
      <SceneTitle at={0}>Four lanes run at the same time.</SceneTitle>

      <div style={{ display: "flex", gap: 28 }}>
        {lanes.map((lane, index) => {
          const start = 20 + index * 26;
          const appear = rise(frame, start, 22);
          const lit = interpolate(frame, [start + 10, start + 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={lane.title}
              style={{
                flex: 1,
                opacity: appear,
                translate: `0px ${interpolate(appear, [0, 1], [30, 0])}px`,
                backgroundColor: theme.raised,
                border: `1px solid rgba(37,99,235,${0.18 + lit * 0.5})`,
                boxShadow: `0 0 ${lit * 28}px rgba(37,99,235,${lit * 0.22})`,
                padding: "34px 28px",
                borderRadius: 4,
                minHeight: 250,
              }}
            >
              <div
                style={{
                  fontFamily: theme.mono,
                  fontSize: 24,
                  letterSpacing: 3,
                  marginBottom: 20,
                }}
              >
                {lane.title}
              </div>
              <div
                style={{
                  fontFamily: theme.serif,
                  fontSize: 62,
                  color: theme.accent,
                  marginBottom: 20,
                }}
              >
                {lane.agents}
              </div>
              <div style={{ fontSize: 22, color: theme.muted, lineHeight: 1.45 }}>
                {lane.body}
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

const Adversarial: React.FC = () => {
  const frame = useCurrentFrame();

  const verdict = rise(frame, 250, 26);

  return (
    <Stage>
      <SceneTitle at={0}>
        A citation is judged by three agents, not one.
      </SceneTitle>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Card
            at={40}
            width={430}
            title="CHALLENGER"
            detail="argues the citation fails"
            tone="rgba(239,68,68,0.45)"
          />

          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 22,
              color: theme.faint,
              opacity: rise(frame, 90, 20),
              textAlign: "center",
              width: 150,
            }}
          >
            neither sees
            <br />
            the other
          </div>

          <Card
            at={65}
            width={430}
            title="SUPPORTER"
            detail="argues the citation holds"
            tone="rgba(34,197,94,0.45)"
          />
        </div>

        <div style={{ margin: "26px 0" }}>
          <Connector at={140} width={46} vertical />
        </div>

        <Card
          at={160}
          width={640}
          title="JUDGE"
          detail="reads both arguments, then rules"
          glow
          tone="rgba(37,99,235,0.6)"
        />
      </div>

      <div
        style={{
          marginTop: 48,
          fontSize: 27,
          color: theme.muted,
          opacity: verdict,
          maxWidth: 1200,
          alignSelf: "center",
          textAlign: "center",
        }}
      >
        One agent asked to judge its own reading will usually agree with itself.
        Three agents arguing will not.
      </div>
    </Stage>
  );
};

const NoTools: React.FC = () => {
  const frame = useCurrentFrame();

  const dots = Array.from({ length: 32 }, (_, index) => index);
  const filled = interpolate(frame, [26, 130], [0, 32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <SceneTitle at={0}>
        Twenty-six of the thirty-two cannot reach the internet at all.
      </SceneTitle>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(16, 1fr)",
          gap: 16,
          maxWidth: 1180,
          marginBottom: 52,
        }}
      >
        {dots.map((index) => {
          const isToolUser = index >= 26;
          const shown = index < filled;

          return (
            <div
              key={index}
              style={{
                height: 46,
                borderRadius: 3,
                backgroundColor: isToolUser ? theme.accent : theme.raised,
                border: `1px solid ${isToolUser ? theme.accent : theme.rule}`,
                opacity: shown ? 1 : 0.08,
                scale: shown ? 1 : 0.8,
              }}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 60, opacity: rise(frame, 150, 24) }}>
        <div>
          <div style={{ fontFamily: theme.serif, fontSize: 64 }}>26</div>
          <div style={{ fontSize: 23, color: theme.muted, marginTop: 6 }}>
            only transform evidence handed to them
          </div>
        </div>
        <div>
          <div style={{ fontFamily: theme.serif, fontSize: 64, color: theme.accent }}>
            6
          </div>
          <div style={{ fontSize: 23, color: theme.muted, marginTop: 6 }}>
            may call a tool · shared over MCP
          </div>
        </div>
      </div>
    </Stage>
  );
};

const stack = [
  "LangGraph",
  "GPT-4o via Azure",
  "Azure Document Intelligence",
  "Next.js",
  "Supabase",
];

const counters = [
  { value: "32", label: "AGENTS" },
  { value: "24", label: "TOOLS" },
  { value: "1", label: "MCP SERVER" },
  { value: "3", label: "HUMAN STOPS" },
];

const Stack: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Stage>
      <SceneTitle at={0}>What it runs on.</SceneTitle>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 70 }}>
        {stack.map((item, index) => {
          const appear = rise(frame, 18 + index * 14, 20);

          return (
            <div
              key={item}
              style={{
                opacity: appear,
                translate: `0px ${interpolate(appear, [0, 1], [18, 0])}px`,
                border: `1px solid ${theme.rule}`,
                borderRadius: 999,
                padding: "16px 34px",
                fontFamily: theme.mono,
                fontSize: 26,
                color: theme.ink,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 90 }}>
        {counters.map((counter, index) => {
          const start = 110 + index * 16;

          return (
            <div key={counter.label}>
              <div
                style={{
                  fontFamily: theme.serif,
                  fontSize: 92,
                  scale: interpolate(frame, [start, start + 14], [0.72, 1], {
                    easing: Easing.out(Easing.back(1.6)),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    output: "perceptual-scale",
                  }),
                  opacity: rise(frame, start, 12),
                }}
              >
                {counter.value}
              </div>
              <div
                style={{
                  fontFamily: theme.mono,
                  fontSize: 19,
                  letterSpacing: 4,
                  color: theme.muted,
                  marginTop: 8,
                }}
              >
                {counter.label}
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

export const Architecture: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.ground }}>
      <Sequence from={0} durationInFrames={at(86.8)}>
        <Pipeline />
      </Sequence>

      <Sequence from={at(86.8)} durationInFrames={at(101.8) - at(86.8)}>
        <Lanes />
      </Sequence>

      <Sequence from={at(101.8)} durationInFrames={at(124.4) - at(101.8)}>
        <Adversarial />
      </Sequence>

      <Sequence from={at(124.4)} durationInFrames={at(157) - at(124.4)}>
        <NoTools />
      </Sequence>

      <Sequence from={at(157)} durationInFrames={at(168.4) - at(157)}>
        <Stack />
      </Sequence>
    </AbsoluteFill>
  );
};
