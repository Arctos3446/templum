// Cómo se leen, se muestran y se comparan las series según el tipo de ejercicio.
import type { EjercicioEnCurso, SerieEnCurso, SerieHecha, TipoEjercicio } from '../db/tipos'

const fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 })
const fmt0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

/** "62,5" o "62.5" → 62.5 · vacío o raro → null */
export function leerNumero(t: string): number | null {
  const s = t.trim().replace(',', '.')
  if (!s || !/^\d*\.?\d+$|^\d+\.$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function leerEntero(t: string): number | null {
  const s = t.trim()
  return /^\d+$/.test(s) ? Number(s) : null
}

/** "1:30" → 90 · "1:05:00" → 3900. Un número solo se entiende como segundos (plancha) o minutos (cardio). */
export function leerDuracion(t: string, numeroEn: 'seg' | 'min'): number | null {
  const s = t.trim().replace(/[.,]/g, ':')
  if (!s) return null
  if (/^\d+$/.test(s)) return Number(s) * (numeroEn === 'min' ? 60 : 1)
  const p = s.split(':')
  if (p.length > 3 || !p.every((x) => /^\d+$/.test(x))) return null
  if (p.slice(1).some((x) => Number(x) > 59)) return null
  return p.reduce((acc, x) => acc * 60 + Number(x), 0)
}

/** 90 → "1:30" · 3900 → "1:05:00" */
export function textoDuracion(seg: number): string {
  const s = Math.max(0, Math.round(seg))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export const numero = (n: number) => fmt.format(n)
export const numeroEntero = (n: number) => fmt0.format(n)

/** Columnas que se llenan en cada tipo. */
export type Campo = 'kg' | 'reps' | 'tiempo' | 'km'
export const CAMPOS: Record<TipoEjercicio, Campo[]> = {
  pesas: ['kg', 'reps'],
  peso_corporal: ['reps'],
  tiempo: ['tiempo'],
  cardio: ['km', 'tiempo'],
}
export const TITULO_CAMPO: Record<Campo, string> = { kg: 'kg', reps: 'Reps', tiempo: 'Tiempo', km: 'km' }

/** Pasa de lo escrito a números. null si falta algo o no se entiende. */
export function convertir(s: Pick<SerieEnCurso, Campo>, tipo: TipoEjercicio): SerieHecha | null {
  const r: SerieHecha = {}
  for (const c of CAMPOS[tipo]) {
    if (c === 'kg') {
      const v = leerNumero(s.kg)
      if (v === null || v > 1000) return null
      r.kg = v
    } else if (c === 'reps') {
      const v = leerEntero(s.reps)
      if (v === null || v < 1 || v > 1000) return null
      r.reps = v
    } else if (c === 'km') {
      const v = leerNumero(s.km)
      if (v === null || v > 1000) return null
      r.km = v
    } else {
      const v = leerDuracion(s.tiempo, tipo === 'cardio' ? 'min' : 'seg')
      if (v === null || v < 1) return null
      r.seg = v
    }
  }
  return r
}

/** Lo contrario: de una serie hecha a texto para las casillas. */
export function aTexto(s: SerieHecha): Pick<SerieEnCurso, Campo> {
  return {
    kg: s.kg !== undefined ? numero(s.kg) : '',
    reps: s.reps !== undefined ? String(s.reps) : '',
    tiempo: s.seg !== undefined ? textoDuracion(s.seg) : '',
    km: s.km !== undefined ? numero(s.km) : '',
  }
}

/** Cómo se muestra una serie hecha: "60 × 10", "12", "0:45", "5 km · 25:00". */
export function textoSerie(s: SerieHecha, tipo: TipoEjercicio): string {
  switch (tipo) {
    case 'pesas':
      return `${numero(s.kg ?? 0)} × ${s.reps ?? 0}`
    case 'peso_corporal':
      return String(s.reps ?? 0)
    case 'tiempo':
      return textoDuracion(s.seg ?? 0)
    case 'cardio':
      return [s.km ? `${numero(s.km)} km` : '', s.seg ? textoDuracion(s.seg) : ''].filter(Boolean).join(' · ')
  }
}

/** Lo que propone el objetivo de la rutina cuando no hay "vez anterior": "10" → 10 reps, "30 s", "20 min", "5 km". */
export function sugerenciaDeObjetivo(objetivo: string, tipo: TipoEjercicio): Partial<Pick<SerieEnCurso, Campo>> {
  const o = objetivo.trim().toLowerCase()
  const r: Partial<Pick<SerieEnCurso, Campo>> = {}
  if (tipo === 'pesas' || tipo === 'peso_corporal') {
    if (/^\d+$/.test(o)) r.reps = o
  }
  if (tipo === 'tiempo' || tipo === 'cardio') {
    const min = o.match(/(\d+)\s*min/)
    const seg = o.match(/(\d+)\s*s(eg)?\b/)
    const mmss = o.match(/^(\d+:\d{2})$/)
    if (min) r.tiempo = textoDuracion(Number(min[1]) * 60)
    else if (seg) r.tiempo = textoDuracion(Number(seg[1]))
    else if (mmss) r.tiempo = mmss[1]
  }
  if (tipo === 'cardio') {
    const km = o.match(/(\d+(?:[.,]\d+)?)\s*km/)
    if (km) r.km = km[1].replace('.', ',')
  }
  return r
}

/** El valor con que se compara un récord según el tipo (más es mejor). */
export function valorRecord(s: SerieHecha, tipo: TipoEjercicio): number {
  switch (tipo) {
    case 'pesas':
      return s.kg ?? 0
    case 'peso_corporal':
      return s.reps ?? 0
    case 'tiempo':
      return s.seg ?? 0
    case 'cardio':
      return s.km ?? 0
  }
}

/** Texto del récord: "62,5 kg × 8", "15 reps", "1:30", "8 km". */
export function textoRecord(s: SerieHecha, tipo: TipoEjercicio): string {
  switch (tipo) {
    case 'pesas':
      return `${numero(s.kg ?? 0)} kg × ${s.reps ?? 0}`
    case 'peso_corporal':
      return `${s.reps ?? 0} reps`
    case 'tiempo':
      return textoDuracion(s.seg ?? 0)
    case 'cardio':
      return `${numero(s.km ?? 0)} km`
  }
}

/** Kilos levantados en series hechas (kg × reps). */
export function volumen(ejercicios: { series: SerieHecha[] }[], tipos: (i: number) => TipoEjercicio | undefined): number {
  let v = 0
  ejercicios.forEach((e, i) => {
    if (tipos(i) !== 'pesas') return
    for (const s of e.series) v += (s.kg ?? 0) * (s.reps ?? 0)
  })
  return v
}

/**
 * Qué series de este ejercicio son récord: superan lo mejor del historial
 * y lo mejor de las series anteriores de hoy. Si nunca se ha hecho, no hay récord.
 */
export function seriesRecord(ej: EjercicioEnCurso, tipo: TipoEjercicio, mejorPrevio: number | undefined): number[] {
  if (mejorPrevio === undefined || mejorPrevio <= 0) return []
  let mejor = mejorPrevio
  const r: number[] = []
  ej.series.forEach((s, i) => {
    if (!s.hecha) return
    const h = convertir(s, tipo)
    if (!h) return
    const v = valorRecord(h, tipo)
    if (v > mejor) {
      r.push(i)
      mejor = v
    }
  })
  return r
}

/** Para el detalle de un entrenamiento: "60 kg × 10", "12 reps", "0:45", "5 km · 25:00". */
export function textoSerieLargo(s: SerieHecha, tipo: TipoEjercicio): string {
  switch (tipo) {
    case 'pesas':
      return `${numero(s.kg ?? 0)} kg × ${s.reps ?? 0}`
    case 'peso_corporal':
      return `${s.reps ?? 0} reps`
    default:
      return textoSerie(s, tipo)
  }
}
