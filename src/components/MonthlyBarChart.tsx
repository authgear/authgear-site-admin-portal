import React, { useMemo } from "react";
import { Tooltip } from "@radix-ui/themes";
import tooltipStyles from "./v2/Tooltip/Tooltip.module.css";
import styles from "./MonthlyBarChart.module.css";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a count with 3 significant figures and a suffix (k/M/B/T) for ≥1000. */
function formatCompactNumber(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs < 1000) return n.toLocaleString();
  const units: Array<{ value: number; suffix: string }> = [
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "k" },
  ];
  for (const { value, suffix } of units) {
    if (abs >= value) {
      const scaled = n / value;
      const str = scaled.toPrecision(3).replace(/\.?0+$/, "");
      return `${str}${suffix}`;
    }
  }
  return n.toString();
}

/** Round max up to a visually clean axis ceiling (1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10 × 10ⁿ). */
function niceAxisCeiling(max: number): number {
  if (max <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const frac = max / pow;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const niceFrac = steps.find((s) => frac <= s) ?? 10;
  return niceFrac * pow;
}

/** True if monthKey (YYYY-MM) is after the current UTC calendar month. */
function isMonthKeyInFuture(monthKey: string): boolean {
  const now = new Date();
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return false;
  return (
    y > now.getUTCFullYear() ||
    (y === now.getUTCFullYear() && m > now.getUTCMonth() + 1)
  );
}

export interface MonthlyBarDatum {
  /** YYYY-MM */
  monthKey: string;
  value: number;
}

interface MonthlyBarChartProps {
  /** Year being visualized — used for labels and the aria-label */
  year: number;
  /** 12 entries in calendar order (Jan first). Months in the future should have value=0. */
  data: MonthlyBarDatum[];
  /** Unit name shown in the tooltip, e.g. "MAUs" or "messages" */
  unit: string;
  ariaLabel: string;
}

const MonthlyBarChart: React.VFC<MonthlyBarChartProps> = ({
  year,
  data,
  unit,
  ariaLabel,
}) => {
  const max = useMemo(
    // At least 4 so the five quarter ticks are distinct whole numbers;
    // with a max of 1 they would round to 1, 1, 1, 0, 0.
    () => niceAxisCeiling(Math.max(4, ...data.map((d) => d.value))),
    [data]
  );

  /** 5 tick values from max down to 0 for the Y-axis (top-to-bottom). */
  const ticks = useMemo(() => {
    return [1, 0.75, 0.5, 0.25, 0].map((p) => Math.round(p * max));
  }, [max]);

  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel}>
      <div className={styles.yAxis} aria-hidden>
        {ticks.map((tick, i) => (
          <span key={i} className={styles.yTick}>
            {formatCompactNumber(tick)}
          </span>
        ))}
      </div>
      <div className={styles.chartArea}>
        <div className={styles.bars}>
          {data.map(({ monthKey, value }, i) => {
            const monthLabel = `${MONTH_NAMES[i]} ${year}`;
            const pct = max > 0 ? (value / max) * 100 : 0;
            const hasData = value > 0;
            const tooltipContent = isMonthKeyInFuture(monthKey)
              ? `${monthLabel}: No data`
              : `${monthLabel}: ${value.toLocaleString()} ${unit}`;
            const fillClass = !hasData ? styles.barFillEmpty : styles.barFill;
            const barHeightPx = 140;
            const fillHeightPx = hasData ? (pct / 100) * barHeightPx : 0;
            return (
              <div key={monthKey} className={styles.barWrap}>
                <span className={styles.barValue}>
                  {hasData ? formatCompactNumber(value) : " "}
                </span>
                <Tooltip
                  content={tooltipContent}
                  side="top"
                  delayDuration={0}
                  className={tooltipStyles.tooltip}
                >
                  <div
                    className={styles.barTrack}
                    role="img"
                    aria-label={tooltipContent}
                  >
                    <div
                      className={fillClass}
                      style={{ height: `${fillHeightPx}px` }}
                    />
                  </div>
                </Tooltip>
                <span className={styles.barLabel}>
                  <span className={styles.barLabelFull}>{MONTH_NAMES[i]}</span>
                  <span className={styles.barLabelShort} aria-hidden>
                    {MONTH_NAMES[i].charAt(0)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyBarChart;
