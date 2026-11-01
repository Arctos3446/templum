// Íconos de línea de la guía de estilo. Toman el color del texto (currentColor).

const paths = {
  home: <path d="M4 11l8-6.5 8 6.5V20h-5v-5.5h-6V20H4z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  list: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.5" cy="6.5" r=".6" /><circle cx="4.5" cy="12" r=".6" /><circle cx="4.5" cy="17.5" r=".6" />
    </g>
  ),
  chart: <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 20V12M10 20V6M15 20v-9M20 20V9" /></g>,
  cal: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" strokeLinecap="round" />
    </g>
  ),
  gear: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6" strokeLinecap="round" />
    </g>
  ),
  play: <path d="M8 5.5v13l10-6.5z" fill="currentColor" />,
  plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  chev: <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  dumbbell: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 7v10M4 9v6M17.5 7v10M20 9v6M6.5 12h11" /></g>,
  trend: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17h16" /><path d="M4 13l5-3 4 3 7-6" /></g>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
}

export type IconName = keyof typeof paths

export function Icon({ name, size }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
