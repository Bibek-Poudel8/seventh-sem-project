import React from "react";

type Props = {
  data: number[];
  stroke?: string;
  fill?: string;
  className?: string;
  width?: number;
  height?: number;
};

export default function Sparkline({
  data,
  stroke = "#3b82f6",
  fill = "rgba(59,130,246,0.12)",
  className,
  width = 120,
  height = 40,
}: Props) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;

  const areaPoints = `0,${height} ${points} ${lastX},${height}`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline points={areaPoints} fill={fill} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} />
    </svg>
  );
}
