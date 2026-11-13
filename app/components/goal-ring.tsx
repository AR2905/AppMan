"use client";

type Props = {
  value: number;
  goal: number;
  label: string;
  caption?: string;
  size?: number;
};

export function GoalRing({
  value,
  goal,
  label,
  caption,
  size = 128,
}: Props) {
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
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
            stroke="#10b981"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none">{value}</span>
          <span className="mt-1 text-[11px] font-medium text-zinc-500">
            / {goal}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      {caption ? (
        <p className="mt-0.5 text-center text-xs text-zinc-500">{caption}</p>
      ) : null}
    </div>
  );
}
