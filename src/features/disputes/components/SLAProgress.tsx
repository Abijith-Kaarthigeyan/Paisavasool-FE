import React from "react"

interface SLAProgressProps {
  percentage: number; // e.g. 85 for 85%
  isPaused?: boolean;
}

export const SLAProgress: React.FC<SLAProgressProps> = ({ percentage, isPaused = false }) => {
  const normPercent = Math.min(Math.max(percentage, 0), 100);
  
  let colorClass = "bg-emerald-500";
  let textClass = "text-emerald-600 dark:text-emerald-400";
  let label = "Healthy";

  if (percentage >= 100) {
    colorClass = "bg-rose-500";
    textClass = "text-rose-600 dark:text-rose-400";
    label = "Breached";
  } else if (percentage >= 80) {
    colorClass = "bg-amber-500";
    textClass = "text-amber-600 dark:text-amber-400";
    label = "At Risk";
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className={`${textClass} uppercase tracking-wider`}>
          {label} {isPaused && "(Paused)"}
        </span>
        <span className="text-muted-foreground font-mono">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${normPercent}%` }}
        />
      </div>
    </div>
  );
};

export default SLAProgress;
