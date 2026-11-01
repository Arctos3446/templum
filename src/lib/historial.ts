// Cálculos sobre los entrenamientos guardados: totales, récords de cada sesión y constancia.
import type { Entrenamiento, TipoEjercicio } from '../db/tipos'
import { semanaActual } from './fechas'
import { valorRecord } from './series'

type TipoDe = (id: string) => TipoEjercicio | undefined

/** Kilos levantados (kg × reps) en un entrenamiento guardado. */
export function volumenDe(h: Entrenamiento, tipoDe: TipoDe): number {
  let v = 0
  for (const x of h.ejercicios) if (tipoDe(x.ejercicioId) === 'pesas') for (const s of x.series) v += (s.kg ?? 0) * (s.reps ?? 0)
  return v
}

export function seriesDe(h: Entrenamiento): number {
  return h.ejercicios.reduce((n, x) => n + x.series.length, 0)
}

/** "58 min" · "1 h 05 min" */
export function textoMinutos(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
}

/** Tiempo total corto para los totales: "45 min" · "8 h 40". */
export function textoTotal(ms: number): string {
  const min = Math.round(ms / 60000)
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

/**
 * Qué series fueron récord en cada entrenamiento (en su momento).
 * Devuelve, por id de entrenamiento, las series récord como "uidEjercicio:índice" y cuántos ejercicios lograron récord.
 */
export function recordsPorEntrenamiento(historial: Entrenamiento[], tipoDe: TipoDe) {
  const orden = [...historial].sort((a, b) => a.inicio - b.inicio)
  const mejor = new Map<string, number>()
  const r = new Map<string, { series: Set<string>; ejercicios: number }>()
  for (const h of orden) {
    const series = new Set<string>()
    const conRecord = new Set<string>()
    for (const x of h.ejercicios) {
      const tipo = tipoDe(x.ejercicioId)
      if (!tipo) continue
      const antes = mejor.get(x.ejercicioId)
      let m = antes ?? 0
      x.series.forEach((s, i) => {
        const v = valorRecord(s, tipo)
        // La primera vez que se hace un ejercicio no cuenta como récord.
        if (antes !== undefined && antes > 0 && v > m) {
          series.add(`${x.uid}:${i}`)
          conRecord.add(x.ejercicioId)
        }
        m = Math.max(m, v)
      })
      mejor.set(x.ejercicioId, m)
    }
    r.set(h.id, { series, ejercicios: conRecord.size })
  }
  return r
}

/** Lunes (a las 0:00) de la semana de una fecha. */
function lunesDe(t: number): number {
  return semanaActual(new Date(t))[0].getTime()
}

/**
 * Semanas seguidas con al menos un entrenamiento, contando hacia atrás desde esta semana.
 * Si esta semana todavía no entrenas, se cuenta desde la anterior (la racha no se corta un lunes).
 */
export function semanasDeConstancia(historial: Entrenamiento[], hoy = new Date()): number {
  const semanas = new Set(historial.map((h) => lunesDe(h.inicio)))
  const unaSemana = (lunes: number) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() - 7)
    return d.getTime()
  }
  let s = lunesDe(hoy.getTime())
  if (!semanas.has(s)) s = unaSemana(s)
  let n = 0
  while (semanas.has(s)) {
    n++
    s = unaSemana(s)
  }
  return n
}
