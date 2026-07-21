import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const COLORS = {
  bg: "#f5f0eb",
  card: "#ffffff",
  title: "#1a1a2e",
  text: "#333344",
  textDone: "#aaaabb",
  accent: "#6c63ff",
  checkBg: "#e8e6ff",
  checkDone: "#6c63ff",
  shadow: "rgba(0,0,0,0.08)",
};

const TODOS = [
  { text: "Design landing page", done: false },
  { text: "Set up CI pipeline", done: false },
  { text: "Write unit tests", done: false },
  { text: "Ship v1.0 🚀", done: false },
];

function Checkbox({ checked, progress }) {
  const scale = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        border: `2px solid ${checked ? COLORS.checkDone : "#ccc"}`,
        backgroundColor: checked ? COLORS.checkDone : COLORS.checkBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background-color 0.2s",
      }}
    >
      {checked && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          style={{ transform: `scale(${scale})` }}
        >
          <polyline
            points="2,7 6,11 12,3"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function TodoItem({ text, done, enterProgress, checkProgress }) {
  const opacity = interpolate(enterProgress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(enterProgress, [0, 1], [30, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 12,
        backgroundColor: COLORS.card,
        boxShadow: `0 2px 8px ${COLORS.shadow}`,
        opacity,
        transform: `translateY(${translateY}px)`,
        marginBottom: 12,
      }}
    >
      <Checkbox checked={done && checkProgress > 0.5} progress={checkProgress} />
      <span
        style={{
          fontSize: 20,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 500,
          color: done && checkProgress > 0.5 ? COLORS.textDone : COLORS.text,
          textDecoration:
            done && checkProgress > 0.5 ? "line-through" : "none",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Cursor({ x, y, visible, clicking }) {
  if (!visible) return null;
  const scale = clicking ? 0.85 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 100,
        transform: `scale(${scale})`,
        transition: "transform 0.1s",
        pointerEvents: "none",
      }}
    >
      <svg width="24" height="28" viewBox="0 0 24 28">
        <path
          d="M4 2 L4 22 L10 17 L15 26 L18 24.5 L13.5 16 L20 15 Z"
          fill="#1a1a2e"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

export const TodoDemo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  const itemEnterDelays = [15, 30, 45, 60];
  const itemEnterProgress = itemEnterDelays.map((delay) =>
    spring({ frame: Math.max(0, frame - delay), fps, from: 0, to: 1, durationInFrames: 12 })
  );

  // Check off items at specific frames
  const checkFrames = [75, 100];
  const checkProgress = TODOS.map((_, i) => {
    const checkFrame = checkFrames[i];
    if (checkFrame === undefined) return 0;
    return spring({
      frame: Math.max(0, frame - checkFrame),
      fps,
      from: 0,
      to: 1,
      durationInFrames: 10,
    });
  });

  const todoStates = TODOS.map((todo, i) => ({
    ...todo,
    done: checkFrames[i] !== undefined && frame > checkFrames[i],
  }));

  // Cursor animation keyframes
  const cursorVisible = frame > 65;
  const cursorX = interpolate(
    frame,
    [65, 72, 90, 150],
    [400, 90, 90, 90],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const cursorY = interpolate(
    frame,
    [65, 72, 90, 95, 105, 150],
    [350, 232, 232, 296, 296, 296],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const clicking = (frame >= 73 && frame <= 77) || (frame >= 98 && frame <= 102);

  // Counter animation
  const completedCount = todoStates.filter((t) => t.done).length;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 420,
          padding: "32px 28px",
          borderRadius: 20,
          backgroundColor: COLORS.card,
          boxShadow: `0 8px 32px ${COLORS.shadow}, 0 2px 8px ${COLORS.shadow}`,
          transform: `scale(${titleSpring})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.title,
              margin: 0,
            }}
          >
            ✅ My Tasks
          </h1>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.accent,
              backgroundColor: COLORS.checkBg,
              padding: "4px 12px",
              borderRadius: 20,
            }}
          >
            {completedCount}/{TODOS.length}
          </div>
        </div>

        {/* Todo items */}
        {todoStates.map((todo, i) => (
          <TodoItem
            key={i}
            text={todo.text}
            done={todo.done}
            enterProgress={itemEnterProgress[i]}
            checkProgress={checkProgress[i]}
          />
        ))}
      </div>

      <Cursor x={cursorX} y={cursorY} visible={cursorVisible} clicking={clicking} />
    </AbsoluteFill>
  );
};
