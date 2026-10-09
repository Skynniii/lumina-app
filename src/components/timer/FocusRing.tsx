import { type ReactNode } from 'react';

interface Props {
  progress: number; // 0–1
  color: string;
  size?: number;
  stroke?: number;
  trackColor?: string;
  isStatic?: boolean;
  /** Muestra un brillo que recorre la circunferencia girando indefinidamente. */
  shimmer?: boolean;
  children: ReactNode;
}

export function FocusRing({ progress, color, size = 220, stroke = 8, trackColor = '#eceaf3', isStatic = false, shimmer = false, children }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);
  const shimmerLen = circumference * 0.18;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="focus-ring-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {!isStatic && (
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear', filter: `drop-shadow(0 0 4px ${color}33)` }}
          />
        )}
        {shimmer && !isStatic && (
          <g className="anim-ring-shimmer">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="url(#focus-ring-shimmer)" strokeWidth={stroke}
              strokeDasharray={`${shimmerLen} ${circumference - shimmerLen}`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.95))' }}
            />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
