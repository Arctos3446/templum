// El Chi-Rho (☧), logo de Templum.

export function ChiRho({ size = 26, strokeWidth = 5.5 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square">
        <path d="M50 20 V82" />
        <path d="M50 20 H58 a13 13 0 0 1 0 26 H50" />
        <path d="M31 46 L69 82" />
        <path d="M69 46 L31 82" />
      </g>
    </svg>
  )
}

export function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)' }}>
      <ChiRho size={28} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          letterSpacing: '.3em',
          textTransform: 'uppercase',
          fontSize: 17,
          color: 'var(--fg)',
        }}
      >
        Templum
      </span>
    </div>
  )
}
