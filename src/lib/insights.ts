// Avisos automáticos con reglas simples (Parte 5): días sin entrenar, estancamiento y buen progreso.
import type { Ejercicio, Entrenamiento } from '../db/tipos'
import { diaYMes } from './fechas'
import { METRICAS, sesionesDe, unoRM } from './records'
import { numero, textoDuracion } from './series'

export interface Aviso {
  tipo: 'bien' | 'ojo'
  titulo: string
  texto: string
  ejercicioId?: string
}

const DIA = 86400000
/** Desde cuántos días sin entrenar se avisa. */
const DIAS_SIN_ENTRENAR = 5
/** Semanas sin superar la marca para decir que está estancado. */
const SEMANAS_ESTANCADO = 3

export function avisos(historial: Entrenamiento[], mapa: Map<string, Ejercicio>, hoy = Date.now()): Aviso[] {
  if (!historial.length) return []
  const r: Aviso[] = []

  // 1. Días sin entrenar
  const ultimo = historial.reduce((a, b) => (b.inicio > a.inicio ? b : a))
  const dias = Math.floor((hoy - ultimo.inicio) / DIA)
  if (dias >= DIAS_SIN_ENTRENAR)
    r.push({
      tipo: 'ojo',
      titulo: `Llevas ${dias} días sin entrenar.`,
      texto: `Tu última sesión fue “${ultimo.nombre}”, el ${diaYMes(new Date(ultimo.inicio))}. Un entrenamiento corto también cuenta.`,
    })

  // Ejercicios hechos en las últimas 2 semanas (los que importan ahora).
  const recientes = new Set<string>()
  for (const h of historial) if (hoy - h.inicio <= 14 * DIA) for (const x of h.ejercicios) recientes.add(x.ejercicioId)

  const estancados: Aviso[] = []
  const bien: (Aviso & { mejora: number })[] = []

  for (const id of recientes) {
    const ej = mapa.get(id)
    if (!ej) continue
    const met = METRICAS[ej.tipo][0]
    if (ej.tipo === 'cardio') continue // en cardio la distancia varía a propósito; no se juzga
    const ses = sesionesDe(id, historial)
      .map((s) => ({ ...s, v: met.valor(s.series) }))
      .filter((s): s is typeof s & { v: number } => s.v !== null && s.v > 0)
    if (ses.length < 3) continue
    const nombre = ej.nombre

    // 2. Estancado: la mejor marca se logró hace 3 semanas o más y desde entonces hubo 3 sesiones o más sin superarla.
    let iMejor = 0
    ses.forEach((s, i) => {
      if (s.v > ses[iMejor].v) iMejor = i
    })
    const mejor = ses[iMejor]
    const despues = ses.length - 1 - iMejor
    const semanas = Math.floor((ses[ses.length - 1].t - mejor.t) / (7 * DIA))
    if (semanas >= SEMANAS_ESTANCADO && despues >= 3) {
      estancados.push({ tipo: 'ojo', ejercicioId: id, titulo: `Sin avance en ${nombre.toLowerCase()}.`, texto: textoEstancado(ej, mejor.series, semanas) })
      continue
    }

    // 3. Buen progreso: en las últimas 12 semanas, al menos 4 sesiones y una mejora de 5 % o más.
    const ventana = ses.filter((s) => hoy - s.t <= 84 * DIA)
    if (ventana.length >= 4) {
      const a = ventana[0]
      const b = ventana[ventana.length - 1]
      const mejora = (b.v - a.v) / a.v
      if (mejora >= 0.05) {
        const semanasVentana = Math.max(1, Math.round((b.t - a.t) / (7 * DIA)))
        bien.push({
          tipo: 'bien',
          ejercicioId: id,
          mejora,
          titulo: `Vas muy bien en ${nombre.toLowerCase()}.`,
          texto: `${fraseSubida(ej.tipo, met.texto(a.v), met.texto(b.v), a.v, b.v)} en ${semanasVentana} ${semanasVentana === 1 ? 'semana' : 'semanas'}.`,
        })
      }
    }
  }

  bien.sort((a, b) => b.mejora - a.mejora)
  r.push(...estancados.slice(0, 2), ...bien.slice(0, 2).map(({ mejora: _, ...x }) => x))
  return r
}

/** "Tu 1RM estimado subió de 70 kg a 78,3 kg" · "Pasaste de 5 a 8 repeticiones en tu mejor serie" */
function fraseSubida(tipo: Ejercicio['tipo'], ta: string, tb: string, a: number, b: number): string {
  if (tipo === 'peso_corporal') return `Pasaste de ${a} a ${b} repeticiones en tu mejor serie`
  if (tipo === 'tiempo') return `Tu mejor tiempo subió de ${ta} a ${tb}`
  return `Tu 1RM estimado subió de ${ta} a ${tb}`
}

/** Qué hacer cuando un ejercicio se estanca, según su tipo. */
function textoEstancado(ej: Ejercicio, series: { kg?: number; reps?: number; seg?: number }[], semanas: number): string {
  const lleva = `Llevas ${semanas} semanas sin superar`
  switch (ej.tipo) {
    case 'pesas': {
      const s = series.reduce((m, x) => (unoRM(x) > unoRM(m) ? x : m))
      const kg = s.kg ?? 0
      const reps = s.reps ?? 0
      const sube = kg + (kg >= 40 ? 2.5 : 1)
      return `${lleva} ${numero(kg)} kg × ${reps}. Prueba ${numero(sube)} kg × ${Math.max(1, reps - 1)}, o agrega una serie.`
    }
    case 'peso_corporal': {
      const reps = Math.max(...series.map((s) => s.reps ?? 0))
      return `${lleva} ${reps} repeticiones. Prueba agregar una serie o una versión un poco más difícil.`
    }
    case 'tiempo': {
      const seg = Math.max(...series.map((s) => s.seg ?? 0))
      return `${lleva} ${textoDuracion(seg)}. Prueba sumar 5 a 10 segundos en la última serie.`
    }
    default:
      return `${lleva} tu marca.`
  }
}
