"use client";

import { useId } from "react";
import type { PreparationHistoryPoint } from "@/app/lib/use-preparation";

export function ProgressBar({
  value,
  total,
  color = "#10b981",
}: {
  value: number;
  total: number;
  color?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function PreparationRing({
  value,
  total,
  label,
  caption,
  size = 128,
  color = "#10b981",
}: {
  value: number;
  total: number;
  label?: string;
  caption?: string;
  size?: number;
  color?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (percent / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-zinc-200 dark:text-zinc-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none">{percent}%</span>
          <span className="mt-1 text-[11px] font-medium text-zinc-500">
            {value}/{total}
          </span>
        </div>
      </div>
      {label ? <p className="mt-2 text-sm font-semibold">{label}</p> : null}
      {caption ? (
        <p className="mt-0.5 text-center text-xs text-zinc-500">{caption}</p>
      ) : null}
    </div>
  );
}

export function PreparationTimeline({
  history,
}: {
  history: PreparationHistoryPoint[];
}) {
  const rawId = useId();
  const gradientId = `prep-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const points = history.slice(-40);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
        Check a few items to start the graph.
      </div>
    );
  }

  const width = 640;
  const height = 210;
  const padding = { top: 18, right: 20, bottom: 30, left: 38 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (index: number) => padding.left + index * step;
  const y = (percent: number) =>
    padding.top + plotHeight - (percent / 100) * plotHeight;

  const line = points.length > 1
    ? points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.percent)}`)
        .join(" ")
    : `M ${x(0)} ${y(points[0].percent)} L ${width - padding.right} ${y(points[0].percent)}`;

  const area = `${line} L ${x(points.length - 1)} ${padding.top + plotHeight} L ${x(0)} ${padding.top + plotHeight} Z`;
  const ticks = [0, 25, 50, 75, 100];
  const firstLabel = points[0].percent;
  const lastLabel = points[points.length - 1].percent;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Preparation progress timeline. Started at ${firstLabel} percent and is now ${lastLabel} percent.`}
        className="h-auto w-full min-w-[320px]"
      >
        <title>Preparation progress over time</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y(tick)}
              x2={width - padding.right}
              y2={y(tick)}
              stroke="currentColor"
              strokeOpacity={tick === 0 ? 0.18 : 0.08}
              strokeDasharray={tick === 0 ? undefined : "3 4"}
              className="text-zinc-500"
            />
            <text
              x={padding.left - 7}
              y={y(tick) + 3}
              textAnchor="end"
              fontSize={10}
              className="fill-zinc-400"
            >
              {tick}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) =>
          index === points.length - 1 || index === 0 ? (
            <circle
              key={`${point.at}-${index}`}
              cx={x(index)}
              cy={y(point.percent)}
              r={4}
              fill="#10b981"
              stroke="white"
              strokeWidth={1.5}
            >
              <title>
                {index === 0 ? "Started" : "Latest"}: {point.done}/{point.total} checked
              </title>
            </circle>
          ) : null,
        )}

        <text
          x={padding.left}
          y={height - 8}
          fontSize={10}
          className="fill-zinc-500"
        >
          {firstLabel}% at start
        </text>
        <text
          x={width - padding.right}
          y={height - 8}
          textAnchor="end"
          fontSize={10}
          className="fill-emerald-600 font-semibold dark:fill-emerald-400"
        >
          {lastLabel}% now
        </text>
      </svg>
    </div>
  );
}
