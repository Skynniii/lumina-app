import type { ReactElement } from 'react';

/**
 * Ilustraciones de paisaje propias (SVG, sin imágenes externas) para coronar
 * cada mes en la agenda. Una escena por mes del año.
 */
const SCENES: ReactElement[] = [
  // Enero: montañas nevadas
  <>
    <rect width="320" height="120" fill="#d9e7f5" />
    <circle cx="260" cy="28" r="14" fill="#f4f9ff" opacity="0.9" />
    <path d="M-10 118 L70 44 L152 118 Z" fill="#e9f2fb" />
    <path d="M108 118 L198 36 L290 118 Z" fill="#dae7f6" />
    <path d="M198 36 L219 61 L206 56 L198 65 L188 56 L177 61 Z" fill="#ffffff" />
    <path d="M70 44 L86 62 L76 59 L70 66 L62 59 L54 62 Z" fill="#ffffff" />
    <path d="M0 100 Q80 88 160 100 Q240 112 320 98 V120 H0 Z" fill="#f1f7fc" />
    <g fill="#ffffff" opacity="0.9">
      <circle cx="40" cy="24" r="2" /><circle cx="92" cy="42" r="1.6" /><circle cx="150" cy="20" r="2.2" />
      <circle cx="222" cy="60" r="1.6" /><circle cx="284" cy="80" r="2" /><circle cx="120" cy="74" r="1.4" />
    </g>
    <path d="M24 106 L32 88 L40 106 Z" fill="#5c7f86" />
    <path d="M40 106 L50 82 L60 106 Z" fill="#4e6f76" />
  </>,
  // Febrero: atardecer rosado con corazones
  <>
    <rect width="320" height="120" fill="#ffe4ec" />
    <rect y="52" width="320" height="68" fill="#ffd3e0" />
    <circle cx="78" cy="34" r="17" fill="#ffc0d2" />
    <path d="M0 96 Q80 78 160 94 Q240 110 320 90 V120 H0 Z" fill="#f7bccf" />
    <path d="M236 44 c0 -7 10 -10 13 -2 c3 -8 13 -5 13 2 c0 9 -13 16 -13 16 s-13 -7 -13 -16 Z" fill="#ef7c9b" />
    <path d="M180 26 c0 -4 6 -6 8 -1 c2 -5 8 -3 8 1 c0 6 -8 10 -8 10 s-8 -4 -8 -10 Z" fill="#f6a3ba" />
    <g fill="#ffffff" opacity="0.85">
      <ellipse cx="120" cy="24" rx="18" ry="6" /><ellipse cx="136" cy="20" rx="11" ry="5" />
    </g>
  </>,
  // Marzo: primavera
  <>
    <rect width="320" height="120" fill="#e6f5fb" />
    <circle cx="46" cy="30" r="14" fill="#ffd76a" />
    <g fill="#ffffff" opacity="0.9"><ellipse cx="228" cy="26" rx="18" ry="6" /><ellipse cx="246" cy="22" rx="11" ry="5" /></g>
    <path d="M0 92 Q70 74 150 90 Q230 106 320 88 V120 H0 Z" fill="#a8d5a2" />
    <path d="M0 106 Q90 92 180 106 Q250 116 320 102 V120 H0 Z" fill="#87c090" />
    <circle cx="62" cy="106" r="4.2" fill="#f38fb0" /><circle cx="62" cy="106" r="1.6" fill="#fff3c4" />
    <circle cx="98" cy="113" r="3.4" fill="#ffd76a" /><circle cx="98" cy="113" r="1.3" fill="#ffffff" />
    <circle cx="242" cy="109" r="4.2" fill="#c99bf0" /><circle cx="242" cy="109" r="1.6" fill="#fff3c4" />
    <circle cx="282" cy="100" r="3.2" fill="#f38fb0" />
    <path d="M172 58 q4 -6 8 0 q4 -6 8 0" stroke="#7aa7c7" strokeWidth="2" fill="none" strokeLinecap="round" />
  </>,
  // Abril: lluvia
  <>
    <rect width="320" height="120" fill="#d7e2ec" />
    <g fill="#eff4f9">
      <ellipse cx="92" cy="30" rx="40" ry="16" /><ellipse cx="132" cy="26" rx="30" ry="13" />
      <ellipse cx="238" cy="34" rx="34" ry="14" />
    </g>
    <g stroke="#9fb6c9" strokeWidth="2" strokeLinecap="round">
      <line x1="70" y1="48" x2="64" y2="62" /><line x1="98" y1="52" x2="92" y2="66" />
      <line x1="130" y1="46" x2="124" y2="60" /><line x1="220" y1="54" x2="214" y2="68" />
      <line x1="250" y1="50" x2="244" y2="64" /><line x1="280" y1="58" x2="274" y2="72" />
    </g>
    <path d="M0 100 Q80 88 160 98 Q240 108 320 94 V120 H0 Z" fill="#b9cbdb" />
    <path d="M0 112 Q90 102 180 112 Q250 118 320 108 V120 H0 Z" fill="#a6bacb" />
  </>,
  // Mayo: flores
  <>
    <rect width="320" height="120" fill="#eaf7e6" />
    <circle cx="272" cy="26" r="12" fill="#ffd76a" />
    <path d="M0 94 Q80 80 160 92 Q240 104 320 88 V120 H0 Z" fill="#bfe0a8" />
    <g stroke="#79a95c" strokeWidth="2" strokeLinecap="round">
      <line x1="60" y1="120" x2="60" y2="80" /><line x1="96" y1="120" x2="96" y2="88" />
      <line x1="220" y1="120" x2="220" y2="82" /><line x1="256" y1="120" x2="256" y2="90" />
    </g>
    <path d="M52 78 q8 -14 16 0 q-8 8 -16 0 Z" fill="#f38fb0" />
    <path d="M88 86 q8 -14 16 0 q-8 8 -16 0 Z" fill="#c99bf0" />
    <path d="M212 80 q8 -14 16 0 q-8 8 -16 0 Z" fill="#ffd76a" />
    <path d="M248 88 q8 -14 16 0 q-8 8 -16 0 Z" fill="#f38fb0" />
    <circle cx="150" cy="104" r="3" fill="#ffd76a" /><circle cx="178" cy="110" r="2.4" fill="#f38fb0" />
  </>,
  // Junio: playa
  <>
    <rect width="320" height="120" fill="#dff1fb" />
    <circle cx="252" cy="28" r="15" fill="#ffd08a" />
    <g fill="#ffffff" opacity="0.85"><ellipse cx="60" cy="26" rx="18" ry="6" /><ellipse cx="76" cy="22" rx="10" ry="5" /></g>
    <rect y="66" width="320" height="26" fill="#8fd0ea" />
    <path d="M0 88 Q80 96 160 88 Q240 80 320 92 V120 H0 Z" fill="#f0e2c6" />
    <path d="M188 74 a20 18 0 0 1 40 0 Z" fill="#f2705f" />
    <line x1="208" y1="74" x2="208" y2="96" stroke="#b98a5e" strokeWidth="2" />
    <path d="M30 108 q8 -6 16 0" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" />
  </>,
  // Julio: sol y palmera
  <>
    <rect width="320" height="120" fill="#ffeecb" />
    <circle cx="62" cy="32" r="20" fill="#ffc257" />
    <rect y="72" width="320" height="48" fill="#6ec1e4" />
    <path d="M0 86 Q60 94 120 86" stroke="#a8dcf0" strokeWidth="2" fill="none" opacity="0.8" />
    <path d="M244 86 q-6 -30 -2 -46" stroke="#9a6b43" strokeWidth="3" fill="none" strokeLinecap="round" />
    <g fill="#4e9b6a">
      <path d="M242 38 q-26 -8 -36 6 q20 -3 36 4 Z" />
      <path d="M242 38 q26 -10 38 2 q-24 -2 -38 8 Z" />
      <path d="M240 36 q-8 -20 -26 -24 q10 10 26 30 Z" />
      <path d="M242 40 q12 12 32 12 q-18 4 -32 0 Z" />
    </g>
  </>,
  // Agosto: girasoles
  <>
    <rect width="320" height="120" fill="#fdf3d7" />
    <circle cx="274" cy="24" r="11" fill="#ffd76a" />
    <path d="M0 96 Q80 84 160 94 Q240 104 320 90 V120 H0 Z" fill="#c9d98f" />
    <g stroke="#7a9a4e" strokeWidth="2" strokeLinecap="round">
      <line x1="66" y1="120" x2="66" y2="70" /><line x1="150" y1="120" x2="150" y2="80" />
      <line x1="240" y1="120" x2="240" y2="74" />
    </g>
    <g fill="#f4b731">
      <circle cx="66" cy="62" r="14" /><circle cx="150" cy="72" r="11" /><circle cx="240" cy="66" r="12.5" />
    </g>
    <g fill="#8a5a2b">
      <circle cx="66" cy="62" r="5.4" /><circle cx="150" cy="72" r="4.4" /><circle cx="240" cy="66" r="5" />
    </g>
  </>,
  // Septiembre: hojas de otoño
  <>
    <rect width="320" height="120" fill="#f7efe2" />
    <path d="M0 92 Q80 78 160 90 Q240 102 320 86 V120 H0 Z" fill="#e7cfa8" />
    <path d="M60 96 V64" stroke="#9a7350" strokeWidth="3" strokeLinecap="round" />
    <circle cx="60" cy="54" r="17" fill="#d98b4a" />
    <path d="M238 96 V70" stroke="#9a7350" strokeWidth="3" strokeLinecap="round" />
    <circle cx="238" cy="60" r="13" fill="#b46a3a" />
    <g fill="#e0a24a">
      <path d="M118 40 q9 -6 15 5 q-9 6 -15 -5 Z" />
      <path d="M170 64 q9 -6 15 5 q-9 6 -15 -5 Z" />
      <path d="M288 46 q9 -6 15 5 q-9 6 -15 -5 Z" />
    </g>
  </>,
  // Octubre: calabaza y murciélagos
  <>
    <rect width="320" height="120" fill="#e2dcf0" />
    <circle cx="262" cy="30" r="15" fill="#fbf5da" />
    <g fill="#7a6a9c">
      <path d="M70 34 q7 -6 11 0 q7 -6 11 0 q-5 8 -11 8 q-6 0 -11 -8 Z" />
      <path d="M180 22 q5 -5 8 0 q5 -5 8 0 q-4 6 -8 6 q-4 0 -8 -6 Z" />
    </g>
    <path d="M0 96 Q80 84 160 94 Q240 104 320 90 V120 H0 Z" fill="#c3b8d8" />
    <ellipse cx="120" cy="98" rx="19" ry="14" fill="#e08c3a" />
    <path d="M108 86 q12 -8 24 0 q-12 5 -24 0 Z" fill="#6a8a4a" />
    <circle cx="113" cy="96" r="2.2" fill="#4a3a2a" /><circle cx="128" cy="96" r="2.2" fill="#4a3a2a" />
    <path d="M113 104 q7 5 14 0" stroke="#4a3a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
  </>,
  // Noviembre: niebla otoñal
  <>
    <rect width="320" height="120" fill="#e6e9ec" />
    <circle cx="80" cy="28" r="12" fill="#f4f0e6" />
    <path d="M0 92 Q80 82 160 92 Q240 102 320 88 V120 H0 Z" fill="#cfd4cf" />
    <g stroke="#8a7a72" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M60 96 V70" /><path d="M60 80 l-12 -12" /><path d="M60 76 l12 -12" />
      <path d="M250 96 V66" /><path d="M250 80 l-13 -12" /><path d="M250 76 l13 -12" />
    </g>
    <path d="M150 120 Q162 98 174 90" stroke="#b6a89c" strokeWidth="6" fill="none" opacity="0.7" />
    <path d="M104 108 q8 -5 13 3 q-8 5 -13 -3 Z" fill="#c98b5a" />
    <path d="M206 112 q8 -5 13 3 q-8 5 -13 -3 Z" fill="#c98b5a" />
  </>,
  // Diciembre: árbol de navidad
  <>
    <rect width="320" height="120" fill="#dbe7f3" />
    <path d="M0 98 Q80 86 160 96 Q240 106 320 92 V120 H0 Z" fill="#f3f8fc" />
    <g fill="#3f7d5a">
      <path d="M150 96 L160 52 L170 96 Z" />
      <path d="M143 82 L160 40 L177 82 Z" />
    </g>
    <rect x="157" y="94" width="6" height="8" fill="#8a6242" />
    <g fill="#f0c14b">
      <circle cx="155" cy="60" r="2" /><circle cx="166" cy="70" r="2" />
      <circle cx="150" cy="76" r="2" /><circle cx="170" cy="86" r="2" />
    </g>
    <rect x="60" y="94" width="24" height="18" rx="3" fill="#d9534f" />
    <rect x="60" y="100" width="24" height="4" fill="#f0c14b" />
    <rect x="90" y="100" width="17" height="12" rx="3" fill="#4d7cfe" />
    <g fill="#ffffff" opacity="0.9">
      <circle cx="40" cy="30" r="2" /><circle cx="110" cy="22" r="1.6" /><circle cx="222" cy="34" r="2" />
      <circle cx="282" cy="60" r="1.6" /><circle cx="70" cy="58" r="1.4" />
    </g>
  </>,
];

/** Ilustración del mes (0 = enero) para coronar cada bloque de la agenda. */
export function MonthArt({ month }: { month: number }) {
  return (
    <svg
      viewBox="0 0 320 120"
      preserveAspectRatio="xMidYMid slice"
      className="block w-full h-[104px] rounded-[18px]"
      aria-hidden="true"
    >
      {SCENES[month] ?? SCENES[0]}
    </svg>
  );
}
