interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  color?: string;
}

function getColor(pct: number) {
  if (pct >= 100) return "#EF4444";
  if (pct >= 90) return "#F97316";
  if (pct >= 75) return "#F59E0B";
  return "#22C55E";
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  centerLabel,
  centerSubLabel,
  color,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cappedPct = Math.min(percentage, 100);
  const offset = circumference - (cappedPct / 100) * circumference;
  const fillColor = color ?? getColor(percentage);

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {(centerLabel || centerSubLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && (
            <span className="text-sm font-bold leading-tight">{centerLabel}</span>
          )}
          {centerSubLabel && (
            <span className="text-[10px] text-muted-foreground">{centerSubLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
