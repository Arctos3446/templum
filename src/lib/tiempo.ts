/** 90 → "1:30" */
export function mmss(seg: number): string {
  const s = Math.max(0, Math.round(seg))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "1:30" → 90 · "90" → 90 · "2" → 120 (un número solo hasta 9 se toma como minutos). Devuelve null si no se entiende. */
export function leerMmss(texto: string): number | null {
  const t = texto.trim().replace(/[.,]/g, ':')
  const m = t.match(/^(\d{1,2}):(\d{1,2})$/)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  if (/^\d+$/.test(t)) {
    const n = Number(t)
    return n < 10 ? n * 60 : n
  }
  return null
}

export const DESCANSO_POR_DEFECTO = 90
