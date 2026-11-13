"use client";

import { useId } from "react";
import type { ActivityDay } from "@/app/lib/use-dashboard";

type Props = {
  data: ActivityDay[];
  goal: number;
  mobile?: boolean;
};

export function ActivityChart({ data, goal, mobile = false }: Props) {
  const rawId = useId();
  const gradientId = `activity-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const width =
    (mobile ? 26 : 30) +
    16 +
    Math.max(data.length - 1, 1) * (mobile ? 30 : 26);
  const height = mobile ? 172 : 224;
  const padding = {
    top: 16,
    right: 16,
    bottom: 26,
    left: mobile ? 26 : 30,
  };
  const step = mobile ? 30 : 26;
  const plotH = height - padding.top - padding.bottom;
  const plotBottom = padding.top + plotH;

  const maxValue = Math.max(goal, ...data.map((day) => day.count), 1);
  const x = (index: number) => padding.left + index * step;
  const y = (value: number) =>
    padding.top + plotH - (Math.min(value, maxValue) / maxValue) * plotH;

  const points = data.map(
    (day, index) => [x(index), y(day.count)] as const,
  );

  const linePath = points
    .map(([px, py], index) => `${index === 0 ? "M" : "L"} ${px} ${py}`)
    .join(" ");

  const areaPath =
    data.length > 0
      ? `${linePath} L ${x(data.length - 1)} ${plotBottom} L ${x(0)} ${plotBottom} Z`
      : "";

  const ticks = Array.from(new Set([0, Math.round(maxValue / 2), maxValue]));
  const labelStep = Math.max(1, Math.ceil(data.length / (mobile ? 4 : 8)));
  const today = data[data.length - 1];
  const yesterday = data[data.length - 2];
  const todayUp = today && yesterday ? today.count >= yesterday.count : true;

  const todayColor =
    !today || today.count === 0
      ? "#f59e0b"
      : todayUp
        ? "#10b981"
        : "#ef4444";

  return (
    <div className={mobile ? "overflow-x-auto" : ""}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Applications per day for the last ${data.length} days. Today: ${
          today?.count ?? 0
        }. Daily goal: ${goal}.`}
        className={
          mobile
            ? "h-[172px] w-full min-w-[320px] shrink-0"
            : "h-auto w-full"
        }
      >
        <title>Application activity</title>
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
              x={padding.left - 6}
              y={y(tick) + 3}
              textAnchor="end"
              fontSize={9}
              className="fill-zinc-400"
            >
              {tick}
            </text>
          </g>
        ))}

        {goal <= maxValue ? (
          <g>
            <line
              x1={padding.left}
              y1={y(goal)}
              x2={width - padding.right}
              y2={y(goal)}
              stroke="#10b981"
              strokeOpacity="0.55"
              strokeDasharray="5 4"
            />
            <text
              x={width - padding.right}
              y={y(goal) - 4}
              textAnchor="end"
              fontSize={8}
              className="fill-emerald-600 dark:fill-emerald-400"
            >
              goal {goal}
            </text>
          </g>
        ) : null}

        {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map(([px, py], index) => {
          const day = data[index];
          if (day.count === 0) return null;
          return (
            <circle
              key={day.date}
              cx={px}
              cy={py}
              r={2.6}
              fill="#10b981"
              className="opacity-80"
            >
              <title>
                {day.label}: {day.count}{" "}
                {day.count === 1 ? "application" : "applications"}
              </title>
            </circle>
          );
        })}

        {today ? (
          <g>
            <line
              x1={x(data.length - 1)}
              y1={padding.top}
              x2={x(data.length - 1)}
              y2={plotBottom}
              stroke={todayColor}
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(data.length - 1)}
              cy={y(today.count)}
              r={9}
              fill={todayColor}
              opacity="0.18"
              className="animate-pulse"
            />
            <circle
              cx={x(data.length - 1)}
              cy={y(today.count)}
              r={4.5}
              fill={todayColor}
              stroke="white"
              strokeWidth={1.5}
            >
              <title>
                Today: {today.count}{" "}
                {today.count === 1 ? "application" : "applications"}
              </title>
            </circle>
          </g>
        ) : null}

        {data.map((day, index) => {
          const isLast = index === data.length - 1;
          const show = isLast || index % labelStep === 0;
          if (!show) return null;

          return (
            <text
              key={day.date}
              x={x(index)}
              y={height - 8}
              textAnchor={isLast ? "end" : index === 0 ? "start" : "middle"}
              fontSize={9}
              className={
                isLast
                  ? "fill-zinc-700 font-semibold dark:fill-zinc-200"
                  : "fill-zinc-400"
              }
            >
              {isLast ? "Today" : day.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
