/**
 * Ilustración decorativa de paisaje (montañas, pinos y una casita) que corona la
 * cabecera de la agenda. Es un SVG propio: no depende de ninguna imagen externa.
 */
export function AgendaArt() {
  return (
    <svg
      viewBox="0 0 320 120"
      preserveAspectRatio="xMidYMid slice"
      className="block w-full h-[104px] rounded-[18px] mt-2"
      aria-hidden="true"
    >
      <rect width="320" height="120" fill="#e9f2fb" />
      <rect y="46" width="320" height="74" fill="#e1eef8" />

      {/* Nubes */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="60" cy="26" rx="20" ry="7" />
        <ellipse cx="76" cy="21" rx="13" ry="6" />
        <ellipse cx="248" cy="34" rx="17" ry="6" />
        <ellipse cx="262" cy="30" rx="11" ry="5" />
      </g>

      {/* Montañas nevadas */}
      <path d="M18 104 L96 30 L170 104 Z" fill="#c6d7e4" />
      <path d="M96 30 L120 56 L106 51 L96 60 L86 52 L76 57 Z" fill="#ffffff" />
      <path d="M140 104 L214 42 L288 104 Z" fill="#b8cbdb" />
      <path d="M214 42 L236 66 L222 61 L212 70 L202 62 L194 67 Z" fill="#ffffff" />

      {/* Colinas y vegetación */}
      <path d="M0 96 Q70 80 150 94 Q230 108 320 88 V120 H0 Z" fill="#9fbfa0" />
      <path d="M0 108 Q90 96 180 108 Q250 118 320 104 V120 H0 Z" fill="#7ea889" />

      {/* Pinos */}
      <g fill="#4f7f6d">
        <path d="M40 104 L50 78 L60 104 Z" />
        <path d="M62 104 L70 86 L78 104 Z" />
        <path d="M268 104 L278 80 L288 104 Z" />
      </g>

      {/* Casita */}
      <g>
        <rect x="160" y="82" width="28" height="20" fill="#efe6d8" />
        <path d="M155 83 L174 68 L193 83 Z" fill="#a8715a" />
        <rect x="170" y="90" width="8" height="12" fill="#c2926f" />
        <rect x="161" y="88" width="6" height="6" fill="#cfe0ea" />
      </g>
    </svg>
  );
}
