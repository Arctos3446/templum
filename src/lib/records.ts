// Récords personales y métricas por sesión de cada ejercicio (Parte 5).
import type { Entrenamiento, SerieHecha, TipoEjercicio } from '../db/tipos'
import { numero, numeroEntero, textoDuracion } from './series'

/** 1RM estimado con la fórmula de Epley: kg × (1 + reps / 30). Con 1 rep es el mismo peso. */
export function unoRM(s: SerieHecha): number {
  const kg = s.kg ?? 0
  const reps = s.reps ?? 0
  if (!kg || !reps) return 0
  return reps === 1 ? kg : kg * (1 + reps / 30)
}

/** Una vez que se hizo el ejercicio: fecha, entrenamiento y sus series (si se repitió en la sesión, se juntan). */
export interface Sesion {
  t: number
  id: string
  series: SerieHecha[]
}

/** Todas las veces que se hizo un ejercicio, de la más antigua a la más nueva. */
export function sesionesDe(ejercicioId: string, historial: Entrenamiento[]): Sesion[] {
  const r: Sesion[] = []
  for (const h of historial) {
    const series = h.ejercicios.filter((x) => x.ejercicioId === ejercicioId).flatMap((x) => x.series)
    if (series.length) r.push({ t: h.inicio, id: h.id, series })
  }
  return r.sort((a, b) => a.t - b.t)
}

/** Una métrica que se puede graficar: un valor por sesión. */
export interface Metrica {
  clave: string
  nombre: string
  /** null si esa sesión no sirve para esta métrica. */
  valor: (series: SerieHecha[]) => number | null
  texto: (v: number) => string
  /** Para los números del eje (más cortos). */
  eje: (v: number) => string
  /** En el ritmo, menos es mejor. */
  menorEsMejor?: boolean
  /** Los valores son segundos. */
  esTiempo?: boolean
}

const max = (l: number[]) => (l.length ? Math.max(...l) : null)
const kg = (v: number) => `${numero(Math.round(v * 10) / 10)} kg`
const ejeNum = (v: number) => numeroEntero(v)

const totalKm = (ss: SerieHecha[]) => ss.reduce((n, s) => n + (s.km ?? 0), 0)
const totalSeg = (ss: SerieHecha[]) => ss.reduce((n, s) => n + (s.seg ?? 0), 0)

export const METRICAS: Record<TipoEjercicio, Metrica[]> = {
  pesas: [
    { clave: '1rm', nombre: '1RM estimado', valor: (ss) => max(ss.map(unoRM).filter((v) => v > 0)), texto: kg, eje: ejeNum },
    { clave: 'peso', nombre: 'Peso máximo', valor: (ss) => max(ss.map((s) => s.kg ?? 0)), texto: kg, eje: ejeNum },
    {
      clave: 'volumen',
      nombre: 'Volumen',
      valor: (ss) => ss.reduce((n, s) => n + (s.kg ?? 0) * (s.reps ?? 0), 0),
      texto: (v) => `${numeroEntero(v)} kg`,
      eje: ejeNum,
    },
  ],
  peso_corporal: [
    { clave: 'reps', nombre: 'Más reps', valor: (ss) => max(ss.map((s) => s.reps ?? 0)), texto: (v) => `${v} reps`, eje: ejeNum },
    { clave: 'total', nombre: 'Reps totales', valor: (ss) => ss.reduce((n, s) => n + (s.reps ?? 0), 0), texto: (v) => `${v} reps`, eje: ejeNum },
  ],
  tiempo: [{ clave: 'tiempo', nombre: 'Mejor tiempo', valor: (ss) => max(ss.map((s) => s.seg ?? 0)), texto: textoDuracion, eje: textoDuracion, esTiempo: true }],
  cardio: [
    { clave: 'km', nombre: 'Distancia', valor: (ss) => totalKm(ss) || null, texto: (v) => `${numero(Math.round(v * 100) / 100)} km`, eje: (v) => numero(v) },
    {
      clave: 'ritmo',
      nombre: 'Ritmo',
      valor: (ss) => (totalKm(ss) > 0 && totalSeg(ss) > 0 ? totalSeg(ss) / totalKm(ss) : null),
      texto: (v) => `${textoDuracion(v)} min/km`,
      eje: textoDuracion,
      menorEsMejor: true,
      esTiempo: true,
    },
  ],
}

export interface Record_ {
  nombre: string
  texto: string
  /** Cuándo se logró (para marcar en dorado si fue en la última sesión). */
  t?: number
}

/** Los récords personales de un ejercicio según su tipo. */
export function recordsDe(tipo: TipoEjercicio, sesiones: Sesion[]): Record_[] {
  if (!sesiones.length) return []
  const todas = sesiones.flatMap((x) => x.series.map((s) => ({ s, t: x.t })))
  /** El mejor elemento (el primero que lo logró, si hay empate). */
  const mejor = <T,>(l: T[], v: (x: T) => number, menor = false) =>
    l.reduce<T | null>((m, x) => (m === null || (menor ? v(x) < v(m) : v(x) > v(m)) ? x : m), null)

  switch (tipo) {
    case 'pesas': {
      const pesoMax = mejor(todas, (x) => (x.s.kg ?? 0) * 1000 + (x.s.reps ?? 0))!
      const serie = mejor(todas, (x) => unoRM(x.s))!
      const vol = mejor(sesiones, (x) => METRICAS.pesas[2].valor(x.series) ?? 0)!
      // "Más reps con X kg": el peso que usaste la última vez.
      const ultimoPeso = Math.max(...sesiones[sesiones.length - 1].series.map((s) => s.kg ?? 0))
      const conEse = mejor(
        todas.filter((x) => x.s.kg === ultimoPeso),
        (x) => x.s.reps ?? 0,
      )
      const r: Record_[] = [
        { nombre: 'Peso máximo', texto: `${numero(pesoMax.s.kg ?? 0)} kg × ${pesoMax.s.reps}`, t: pesoMax.t },
        { nombre: 'Mejor serie', texto: `${numero(serie.s.kg ?? 0)} kg × ${serie.s.reps}`, t: serie.t },
        { nombre: '1RM estimado', texto: kg(unoRM(serie.s)), t: serie.t },
      ]
      if (conEse && ultimoPeso > 0) r.push({ nombre: `Más reps con ${numero(ultimoPeso)} kg`, texto: String(conEse.s.reps), t: conEse.t })
      r.push({ nombre: 'Mayor volumen en una sesión', texto: `${numeroEntero(METRICAS.pesas[2].valor(vol.series) ?? 0)} kg`, t: vol.t })
      return r
    }
    case 'peso_corporal': {
      const serie = mejor(todas, (x) => x.s.reps ?? 0)!
      const dia = mejor(sesiones, (x) => METRICAS.peso_corporal[1].valor(x.series) ?? 0)!
      return [
        { nombre: 'Más reps en una serie', texto: String(serie.s.reps), t: serie.t },
        { nombre: 'Más reps en una sesión', texto: String(METRICAS.peso_corporal[1].valor(dia.series)), t: dia.t },
        { nombre: 'Veces hecho', texto: String(sesiones.length) },
      ]
    }
    case 'tiempo': {
      const serie = mejor(todas, (x) => x.s.seg ?? 0)!
      return [
        { nombre: 'Mejor tiempo', texto: textoDuracion(serie.s.seg ?? 0), t: serie.t },
        { nombre: 'Veces hecho', texto: String(sesiones.length) },
      ]
    }
    case 'cardio': {
      const dist = mejor(sesiones, (x) => totalKm(x.series))!
      const conRitmo = sesiones.filter((x) => METRICAS.cardio[1].valor(x.series) !== null)
      const ritmo = mejor(conRitmo, (x) => METRICAS.cardio[1].valor(x.series)!, true)
      const r: Record_[] = []
      if (totalKm(dist.series) > 0) r.push({ nombre: 'Mayor distancia', texto: METRICAS.cardio[0].texto(totalKm(dist.series)), t: dist.t })
      if (ritmo) r.push({ nombre: 'Mejor ritmo', texto: METRICAS.cardio[1].texto(METRICAS.cardio[1].valor(ritmo.series)!), t: ritmo.t })
      r.push({ nombre: 'Veces hecho', texto: String(sesiones.length) })
      return r
    }
  }
}

/** Los tres números del detalle del ejercicio (Resumen). */
export function resumenDetalle(tipo: TipoEjercicio, sesiones: Sesion[]): { nombre: string; texto: string }[] {
  const r = recordsDe(tipo, sesiones)
  const busca = (n: string) => r.find((x) => x.nombre === n)?.texto ?? '—'
  switch (tipo) {
    case 'pesas':
      return [
        { nombre: 'Récord de peso', texto: busca('Peso máximo') },
        { nombre: '1RM estimado', texto: busca('1RM estimado') },
        { nombre: 'Mejor volumen', texto: busca('Mayor volumen en una sesión') },
      ]
    case 'peso_corporal':
      return [
        { nombre: 'Más reps en una serie', texto: busca('Más reps en una serie') },
        { nombre: 'Más reps en una sesión', texto: busca('Más reps en una sesión') },
        { nombre: 'Veces hecho', texto: String(sesiones.length) },
      ]
    case 'tiempo':
      return [
        { nombre: 'Mejor tiempo', texto: busca('Mejor tiempo') },
        { nombre: 'Veces hecho', texto: String(sesiones.length) },
      ]
    case 'cardio':
      return [
        { nombre: 'Mayor distancia', texto: busca('Mayor distancia') },
        { nombre: 'Mejor ritmo', texto: busca('Mejor ritmo') },
        { nombre: 'Veces hecho', texto: String(sesiones.length) },
      ]
  }
}
