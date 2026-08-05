import { useMemo } from "react";
import { generateWaveform } from "@/lib/waveform";

interface Props {
  seed?: number;
  samples?: number[];
  height?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  animate?: boolean;
  fill?: boolean;
}

export function EEGWave({
  seed = 3,
  samples,
  height = 120,
  className,
  color = "var(--accent-cyan)",
  strokeWidth = 1.5,
  animate = true,
  fill = false,
}: Props) {
  const path = useMemo(() => {
    const pts = samples?.length ? resample(samples, 300) : generateWaveform(seed, 300);
    const w = 1200;
    const h = height;
    const max = Math.max(...pts.map(Math.abs)) || 1;
    const step = w / (pts.length - 1);
    let d = "";
    pts.forEach((v, i) => {
      const x = i * step;
      const y = h / 2 - (v / max) * (h / 2 - 4);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
    });
    return d;
  }, [seed, samples, height]);

  return (
    <div className={className} style={{ height, overflow: "hidden", position: "relative" }}>
      <svg
        viewBox={`0 0 2400 ${height}`}
        preserveAspectRatio="none"
        width="200%"
        height="100%"
        style={{
          display: "block",
          animation: animate ? "eeg-flow 18s linear infinite" : undefined,
        }}
      >
        <defs>
          <linearGradient id={`eeg-fill-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g>
          <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          {fill && (
            <path d={`${path} L1200,${height} L0,${height} Z`} fill={`url(#eeg-fill-${seed})`} />
          )}
        </g>
        <g transform="translate(1200,0)">
          <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          {fill && (
            <path d={`${path} L1200,${height} L0,${height} Z`} fill={`url(#eeg-fill-${seed})`} />
          )}
        </g>
      </svg>
    </div>
  );
}

function resample(values: number[], points: number) {
  if (values.length === points) return values;
  if (values.length < 2) return values;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const pos = (i / (points - 1)) * (values.length - 1);
    const left = Math.floor(pos);
    const right = Math.min(values.length - 1, left + 1);
    const mix = pos - left;
    out.push(values[left] * (1 - mix) + values[right] * mix);
  }
  return out;
}
