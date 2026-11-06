import { useId } from 'react';

interface Props {
  color: string;
  size?: number;
}

/**
 * Anillo "cargando" de una tarea-actividad que se está cronometrando.
 * Usa la misma animación que el reloj de la pantalla Focus: un haz blanco
 * que recorre la circunferencia girando.
 */
export function ActivityCheckRing({ color, size = 20 }: Props) {
  const gid = `act-ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const beam = circumference * 0.3;
  const c = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={radius} fill="none" stroke={color} strokeWidth={stroke} />
      <g className="anim-ring-shimmer">
        <circle
          cx={c} cy={c} r={radius}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeDasharray={`${beam} ${circumference - beam}`}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9))' }}
        />
      </g>
    </svg>
  );
}
