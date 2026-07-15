"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

/* ---------- design tokens (from the EduClip Pipeline Animation design) ---------- */

const BG = "oklch(16% 0.012 55)";
const PANEL = "oklch(19% 0.013 55)";
const LINE = "oklch(27% 0.014 55)";
const TXT = "oklch(92% 0.01 55)";
const DIM = "oklch(58% 0.012 55)";
const ACCENT = "oklch(72% 0.16 40)";
const ACCENT_DIM = "oklch(40% 0.06 40)";
const DISPLAY = "var(--font-display), 'Bricolage Grotesque', sans-serif";
const BODY = "var(--font-body), 'Public Sans', sans-serif";

const STAGE_W = 1280;
const STAGE_H = 720;

const SCENES = [
  { name: "Opening", dur: 2.5, component: Opening },
  { name: "Ingest", dur: 3, component: Ingest },
  { name: "Extract", dur: 3.5, component: Extract },
  { name: "Generate", dur: 3, component: Generate },
  { name: "Distribute", dur: 4, component: Distribute },
] as const;

const TOTAL = SCENES.reduce((sum, s) => sum + s.dur, 0);

/* ---------- animation helpers ---------- */

type EasingFn = (t: number) => number;

const Easing = {
  linear: (t: number) => t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
} satisfies Record<string, EasingFn>;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolate(
  value: number,
  input: [number, number],
  output: [number, number],
  ease: EasingFn = Easing.linear,
) {
  const t = clamp((value - input[0]) / (input[1] - input[0] || 1), 0, 1);
  return output[0] + (output[1] - output[0]) * ease(t);
}

function fadeInOut(p: number, inEnd: number, outStart: number) {
  if (p < inEnd) return interpolate(p, [0, inEnd], [0, 1], Easing.easeOutCubic);
  if (p > outStart) return interpolate(p, [outStart, 1], [1, 0], Easing.easeInCubic);
  return 1;
}

/* ---------- shared scene chrome ---------- */

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: BODY,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Grid() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        opacity: 0.5,
      }}
    />
  );
}

function SceneTitle({ text, opacity, top = "20%" }: { text: string; opacity: number; top?: string }) {
  return (
    <div style={{ position: "absolute", top, textAlign: "center", opacity }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, color: TXT }}>{text}</div>
    </div>
  );
}

/* ---------- Scene 1: Opening ---------- */

function Opening({ progress }: { progress: number }) {
  const ringP = clamp(progress / 0.7, 0, 1);
  const titleOp = fadeInOut(progress, 0.25, 0.82);
  const titleY = interpolate(progress, [0, 0.25], [16, 0], Easing.easeOutCubic);
  const subOp = fadeInOut(progress, 0.45, 0.82);

  return (
    <Wrap>
      <Grid />
      {[0, 1, 2].map((i) => {
        const t = clamp((ringP - i * 0.18) / 0.6, 0, 1);
        const scale = lerp(0.3, 2.6, Easing.easeOutCubic(t));
        const op = (1 - t) * 0.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: `1.5px solid ${ACCENT}`,
              opacity: t <= 0 ? 0 : op,
              transform: `scale(${scale})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleOp,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 64,
            color: TXT,
            letterSpacing: "-0.02em",
          }}
        >
          EduClip
        </div>
        <div
          style={{
            fontFamily: BODY,
            fontSize: 17,
            color: DIM,
            marginTop: 10,
            opacity: subOp,
            letterSpacing: "0.01em",
          }}
        >
          One upload. An entire content system.
        </div>
      </div>
    </Wrap>
  );
}

/* ---------- Scene 2: Ingest ---------- */

function Ingest({ progress }: { progress: number }) {
  const label = fadeInOut(progress, 0.15, 0.88);
  const items = [
    { type: "Video", delay: 0.0 },
    { type: "Webinar", delay: 0.08 },
    { type: "Ebook", delay: 0.16 },
  ];
  const convergeP = clamp((progress - 0.1) / 0.55, 0, 1);

  const coreP = clamp((progress - 0.55) / 0.3, 0, 1);
  const coreScale = lerp(0.2, 1, Easing.easeOutBack(coreP));
  const coreOp =
    clamp((progress - 0.5) / 0.15, 0, 1) * (1 - clamp((progress - 0.92) / 0.08, 0, 1));

  return (
    <Wrap>
      <Grid />
      {items.map((it, i) => {
        const laneX = -260;
        const laneY = [-70, 0, 70][i];
        const t = clamp((convergeP - it.delay) / 0.7, 0, 1);
        const x = lerp(laneX, 0, Easing.easeInOutCubic(t));
        const y = lerp(laneY, 0, Easing.easeInOutCubic(t));
        const op =
          clamp((progress - 0.05) / 0.15, 0, 1) * (1 - clamp((progress - 0.75) / 0.15, 0, 1));
        const scale = lerp(1, 0.4, t);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: `translate(${x}px, ${y}px) scale(${scale})`,
              opacity: op,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${LINE}`,
              background: PANEL,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
            <div style={{ fontSize: 14, color: TXT, fontWeight: 600 }}>{it.type}</div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: ACCENT,
          opacity: coreOp,
          transform: `scale(${coreScale})`,
          boxShadow: `0 0 40px 4px ${ACCENT_DIM}`,
        }}
      />
      <SceneTitle text="Ingest anything long-form" opacity={label} />
    </Wrap>
  );
}

/* ---------- Scene 3: Extract (concept graph) ---------- */

const EXTRACT_POSITIONS: [number, number][] = [
  [-180, -60], [-90, 60], [0, -90], [90, 40], [180, -50],
  [-140, 80], [140, 90], [40, 0], [-40, -20], [0, 100],
];
const EXTRACT_EDGES: [number, number][] = [
  [0, 2], [2, 4], [1, 3], [3, 4], [5, 1], [6, 3], [7, 2], [8, 0], [9, 5], [2, 7],
];
const CONCEPT_LABELS = [
  { i: 2, text: "Hook" },
  { i: 3, text: "Framework" },
  { i: 4, text: "Takeaway" },
];

function Extract({ progress }: { progress: number }) {
  const label = fadeInOut(progress, 0.12, 0.9);
  const litUntil = clamp((progress - 0.1) / 0.55, 0, 1) * EXTRACT_POSITIONS.length;
  const labelP = clamp((progress - 0.72) / 0.22, 0, 1);

  return (
    <Wrap>
      <Grid />
      <svg width={600} height={440} style={{ position: "absolute" }}>
        {EXTRACT_EDGES.map(([a, b], i) => {
          const [x1, y1] = EXTRACT_POSITIONS[a];
          const [x2, y2] = EXTRACT_POSITIONS[b];
          const on = litUntil > Math.max(a, b) - 1;
          return (
            <line
              key={i}
              x1={x1 + 300}
              y1={y1 + 220}
              x2={x2 + 300}
              y2={y2 + 220}
              stroke={on ? ACCENT_DIM : LINE}
              strokeWidth={1}
            />
          );
        })}
        {EXTRACT_POSITIONS.map(([x, y], i) => {
          const on = litUntil > i;
          const isConcept = [2, 3, 4].includes(i);
          const highlightP = clamp((progress - 0.65 - i * 0.01) / 0.25, 0, 1);
          const size = isConcept ? lerp(8, 16, highlightP) : 8;
          const color = isConcept && highlightP > 0.3 ? ACCENT : on ? ACCENT_DIM : LINE;
          return <circle key={i} cx={x + 300} cy={y + 220} r={size / 2} fill={color} />;
        })}
      </svg>
      {CONCEPT_LABELS.map((c) => {
        const [x, y] = EXTRACT_POSITIONS[c.i];
        return (
          <div
            key={c.i}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y - 34}px)`,
              transform: "translateX(-50%)",
              fontSize: 12,
              fontWeight: 700,
              color: ACCENT,
              opacity: labelP,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {c.text}
          </div>
        );
      })}
      <SceneTitle text="AI finds the teachable moments" opacity={label} top="18%" />
    </Wrap>
  );
}

/* ---------- Scene 4: Generate ---------- */

function Generate({ progress }: { progress: number }) {
  const label = fadeInOut(progress, 0.1, 0.9);
  const cards = [
    { title: "Carousel", sub: "7 slides", x: -220 },
    { title: "Script", sub: "Hook · Body · CTA", x: 0 },
    { title: "Newsletter", sub: "Markdown lesson", x: 220 },
  ];

  return (
    <Wrap>
      <Grid />
      {cards.map((c, i) => {
        const t = clamp((progress - 0.15 - i * 0.12) / 0.45, 0, 1);
        const scale = lerp(0.3, 1, Easing.easeOutCubic(t));
        const op =
          t <= 0 ? 0 : Math.min(1, t * 3) * (1 - clamp((progress - 0.88) / 0.12, 0, 1));
        const y = lerp(30, 0, Easing.easeOutCubic(t));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${c.x}px)`,
              transform: `translate(-50%, ${y}px) scale(${scale})`,
              opacity: op,
              width: 160,
              borderRadius: 14,
              border: `1px solid ${LINE}`,
              background: PANEL,
              padding: 16,
            }}
          >
            <div
              style={{
                height: 64,
                borderRadius: 8,
                marginBottom: 12,
                background:
                  "repeating-linear-gradient(135deg, oklch(24% 0.014 55), oklch(24% 0.014 55) 8px, oklch(22% 0.014 55) 8px, oklch(22% 0.014 55) 16px)",
              }}
            />
            <div style={{ fontSize: 14, fontWeight: 700, color: TXT }}>{c.title}</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 3 }}>{c.sub}</div>
          </div>
        );
      })}
      <SceneTitle text="Every concept, three formats" opacity={label} top="16%" />
    </Wrap>
  );
}

/* ---------- Scene 5: Distribute + close ---------- */

function Distribute({ progress }: { progress: number }) {
  const label = fadeInOut(progress, 0.1, 0.55);
  const platforms = [
    { name: "LinkedIn", x: -240, y: -60 },
    { name: "Instagram", x: 0, y: -110 },
    { name: "TikTok", x: 240, y: -60 },
    { name: "Newsletter", x: 0, y: 90 },
  ];
  const flyP = clamp((progress - 0.05) / 0.45, 0, 1);

  const closeOp =
    clamp((progress - 0.62) / 0.2, 0, 1) * (1 - clamp((progress - 0.94) / 0.06, 0, 1));
  const closeY = interpolate(progress, [0.62, 0.82], [16, 0], Easing.easeOutCubic);

  return (
    <Wrap>
      <Grid />
      {platforms.map((p, i) => {
        const t = clamp(flyP - i * 0.05, 0, 1);
        const op = t > 0 ? 0.6 : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: Math.hypot(p.x, p.y) * t,
              height: 1.5,
              background: ACCENT_DIM,
              opacity: op,
              transform: `rotate(${Math.atan2(p.y, p.x)}rad)`,
              transformOrigin: "0 0",
            }}
          />
        );
      })}
      {platforms.map((p, i) => {
        const t = clamp((flyP - i * 0.05) / 0.6, 0, 1);
        const x = lerp(0, p.x, Easing.easeOutCubic(t));
        const y = lerp(0, p.y, Easing.easeOutCubic(t));
        const op = t <= 0 ? 0 : Math.min(1, t * 4);
        const fade = 1 - clamp((progress - 0.6) / 0.3, 0, 1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: `translate(${x}px, ${y}px)`,
              opacity: op * fade,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 20,
              border: `1px solid ${ACCENT_DIM}`,
              background: PANEL,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{p.name}</div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: ACCENT,
          opacity: 1 - clamp((progress - 0.5) / 0.2, 0, 1),
          boxShadow: `0 0 30px 6px ${ACCENT_DIM}`,
        }}
      />
      <SceneTitle text="Published everywhere, automatically" opacity={label} />
      <div
        style={{
          position: "absolute",
          textAlign: "center",
          opacity: closeOp,
          transform: `translateY(${closeY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 40,
            color: TXT,
            letterSpacing: "-0.01em",
          }}
        >
          EduClip
        </div>
        <div style={{ fontSize: 15, color: DIM, marginTop: 8 }}>
          Turn long-form content into viral micro-learning assets.
        </div>
      </div>
    </Wrap>
  );
}

/* ---------- timeline + stage ---------- */

function sceneAt(time: number) {
  let start = 0;
  for (const scene of SCENES) {
    if (time < start + scene.dur) {
      return { scene, progress: (time - start) / scene.dur, start };
    }
    start += scene.dur;
  }
  const last = SCENES[SCENES.length - 1];
  return { scene: last, progress: 1, start: TOTAL - last.dur };
}

function formatTime(secs: number) {
  return `${secs.toFixed(1)}s`;
}

export default function PipelineAnimation() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [scale, setScale] = useState(1);
  const timeRef = useRef(0);
  const playingRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      playingRef.current = false;
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) {
        timeRef.current = (timeRef.current + dt) % TOTAL;
        setTime(timeRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const inner =
        el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setScale(Math.min(1, inner / STAGE_W));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const togglePlay = useCallback(() => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }, []);

  const seekFromPointer = useCallback((clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const frac = clamp((clientX - rect.left) / rect.width, 0, 1);
    timeRef.current = frac * TOTAL;
    setTime(timeRef.current);
  }, []);

  const onBarPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      seekFromPointer(e.clientX);
    },
    [seekFromPointer],
  );

  const onBarPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons & 1) seekFromPointer(e.clientX);
    },
    [seekFromPointer],
  );

  const { scene, progress } = sceneAt(time);
  const Active = scene.component;

  let elapsed = 0;
  const markers = SCENES.map((s) => {
    const m = { ...s, start: elapsed };
    elapsed += s.dur;
    return m;
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: 24,
        borderRadius: 16,
        background: BG,
      }}
    >
      <div style={{ width: STAGE_W * scale, height: STAGE_H * scale, position: "relative" }}>
        <div
          style={{
            width: STAGE_W,
            height: STAGE_H,
            position: "absolute",
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            background: BG,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${LINE}`,
          }}
        >
          <Active progress={clamp(progress, 0, 1)} />
        </div>
      </div>

      {/* playback bar */}
      <div
        style={{
          width: STAGE_W * scale,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: BODY,
        }}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause animation" : "Play animation"}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: `1px solid ${LINE}`,
            background: PANEL,
            color: TXT,
            cursor: "pointer",
          }}
        >
          {playing ? (
            <PauseIcon style={{ width: 14, height: 14 }} />
          ) : (
            <PlayIcon style={{ width: 14, height: 14, marginLeft: 2 }} />
          )}
        </button>

        <div
          ref={barRef}
          onPointerDown={onBarPointerDown}
          onPointerMove={onBarPointerMove}
          role="slider"
          aria-label="Timeline"
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={Math.round(time * 10) / 10}
          aria-valuetext={`${formatTime(time)} — ${scene.name}`}
          style={{
            position: "relative",
            flex: 1,
            height: 26,
            cursor: "pointer",
            touchAction: "none",
          }}
        >
          {markers.map((m) => {
            const left = (m.start / TOTAL) * 100;
            const width = (m.dur / TOTAL) * 100;
            const active = m.name === scene.name;
            return (
              <div
                key={m.name}
                style={{
                  position: "absolute",
                  left: `calc(${left}% + 1px)`,
                  width: `calc(${width}% - 2px)`,
                  top: 9,
                  height: 8,
                  borderRadius: 4,
                  background: active ? ACCENT_DIM : PANEL,
                  border: `1px solid ${active ? ACCENT_DIM : LINE}`,
                  boxSizing: "border-box",
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: `${(time / TOTAL) * 100}%`,
              top: 4,
              width: 2,
              height: 18,
              marginLeft: -1,
              borderRadius: 1,
              background: ACCENT,
            }}
          />
        </div>

        <div
          style={{
            flexShrink: 0,
            minWidth: 118,
            textAlign: "right",
            fontSize: 12,
            color: DIM,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ color: TXT, fontWeight: 600 }}>{scene.name}</span>
          {" · "}
          {formatTime(time)} / {formatTime(TOTAL)}
        </div>
      </div>
    </div>
  );
}
