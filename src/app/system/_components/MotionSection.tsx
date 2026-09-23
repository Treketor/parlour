"use client";

import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { duration, easing } from "@/lib/motion";
import styles from "../system.module.css";
import { Section } from "./Section";

const curves = [
  {
    name: "Ease out",
    token: "ease-out",
    points: easing.out,
    use: "Responses and entrances. Starts fast, so a reaction reads as immediate, then settles.",
  },
  {
    name: "Ease in-out",
    token: "ease-in-out",
    points: easing.inOut,
    use: "Moving between two resting places, like a row sliding to its new position.",
  },
  {
    name: "Ease in",
    token: "ease-in",
    points: easing.in,
    use: "Exits. Accelerates away so the next thing is not kept waiting.",
  },
] as const;

const durations = [
  { token: "press", use: "Release of a pressed control" },
  { token: "fast", use: "Hover, colour, exits" },
  { token: "base", use: "Menus, messages, small reveals" },
  { token: "slow", use: "Indicators sliding between options" },
  { token: "spatial", use: "Rows travelling to new positions" },
] as const;

function CurvePlot({ points }: { points: readonly [number, number, number, number] }) {
  const [x1, y1, x2, y2] = points;
  // SVG y runs downward; flip so the curve reads like a graph of progress over time.
  const path = `M0 100 C ${x1 * 100} ${100 - y1 * 100}, ${x2 * 100} ${100 - y2 * 100}, 100 0`;
  return (
    <svg className={styles.curve} viewBox="-4 -14 108 128" aria-hidden="true">
      <path className={styles.curveAxis} d="M0 0V100H100" />
      <path className={styles.curveHandle} d={`M0 100L${x1 * 100} ${100 - y1 * 100}`} />
      <path className={styles.curveHandle} d={`M100 0L${x2 * 100} ${100 - y2 * 100}`} />
      <path className={styles.curveLine} d={path} />
    </svg>
  );
}

export function MotionSection() {
  // Each replay remounts the markers (via key) so the run always starts from the left.
  const [curveRun, setCurveRun] = useState(0);
  const [durationRun, setDurationRun] = useState(0);

  return (
    <Section
      id="motion"
      title="Motion"
      intro="Three curves and five durations cover every transition in the app. Only transform and opacity animate. With reduced motion, nothing travels or scales, but changes still fade so you can see what happened."
    >
      <div className={styles.group}>
        <div className={styles.motionToolbar}>
          <Button size="sm" onClick={() => setCurveRun((run) => run + 1)}>
            Replay curves
          </Button>
          <span className={styles.caption}>All three run at the spatial duration, 320ms.</span>
        </div>
        <div className={styles.curves}>
          {curves.map((curve) => (
            <figure key={curve.token} className={styles.curveCard}>
              <CurvePlot points={curve.points} />
              <div
                className={styles.track}
                style={
                  {
                    "--ease": `var(--${curve.token})`,
                    "--duration": `var(--duration-spatial)`,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <span
                  key={curveRun}
                  className={styles.marker}
                  data-running={curveRun > 0 || undefined}
                />
              </div>
              <figcaption>
                <span className={styles.curveName}>{curve.name}</span>
                <span className={styles.curveValue}>cubic-bezier({curve.points.join(", ")})</span>
                <span className={styles.curveUse}>{curve.use}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.motionToolbar}>
          <Button size="sm" onClick={() => setDurationRun((run) => run + 1)}>
            Replay durations
          </Button>
          <span className={styles.caption}>All five use ease out.</span>
        </div>
        <div className={styles.durations}>
          {durations.map((item) => (
            <div key={item.token} className={styles.durationRow}>
              <span className={styles.typeToken}>{item.token}</span>
              <span className={styles.typePx}>{duration[item.token]}ms</span>
              <div
                className={styles.track}
                style={
                  {
                    "--ease": "var(--ease-out)",
                    "--duration": `var(--duration-${item.token})`,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <span
                  key={durationRun}
                  className={styles.marker}
                  data-running={durationRun > 0 || undefined}
                />
              </div>
              <span className={styles.durationUse}>{item.use}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
