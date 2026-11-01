// "Copiar resumen para Claude": un texto con tus últimas semanas para pegarlo en un chat y pedir un análisis.
import type { Ejercicio, Entrenamiento, Rutina } from '../db/tipos'
import { NOMBRE_TIPO } from '../db/tipos'
import { diaYMes, fechaLarga, haceCuanto } from './fechas'
import { recordsDe, sesionesDe, METRICAS } from './records'
import { avisos } from './insights'
import { numero, numeroEntero, textoSerie } from './series'
import { textoDias } from './rutinas'
import { textoTotal, volumenDe } from './historial'
import { mmss } from './tiempo'

const SEMANAS = 8
const DIA = 86400000

export function resumenParaClaude(historial: Entrenamiento[], rutinas: Rutina[], mapa: Map<string, Ejercicio>, hoy = new Date()): string {
  const desde = hoy.getTime() - SEMANAS * 7 * DIA
  const periodo = historial.filter((h) => h.inicio >= desde).sort((a, b) => a.inicio - b.inicio)
  const tipoDe = (id: string) => mapa.get(id)?.tipo
  const l: string[] = []

  l.push('Resumen de entrenamiento (app Templum)')
  l.push(`Generado el ${fechaLarga(hoy).toLowerCase()} de ${hoy.getFullYear()}. Periodo: últimas ${SEMANAS} semanas (desde el ${diaYMes(new Date(desde))}).`)
  l.push('Unidades: kg y km. "1RM est." es el máximo estimado para 1 repetición con la fórmula de Epley.')
  l.push('')

  l.push('## General')
  if (!periodo.length) {
    l.push(`- Sin entrenamientos en el periodo.${historial.length ? ` El último fue ${haceCuanto(Math.max(...historial.map((h) => h.inicio)))}.` : ''}`)
  } else {
    const tiempo = periodo.reduce((t, h) => t + (h.fin - h.inicio), 0)
    const vol = periodo.reduce((v, h) => v + volumenDe(h, tipoDe), 0)
    l.push(`- Entrenamientos: ${periodo.length} (${numero(Math.round((periodo.length / SEMANAS) * 10) / 10)} por semana en promedio).`)
    l.push(`- Último: ${haceCuanto(periodo[periodo.length - 1].inicio)} ("${periodo[periodo.length - 1].nombre}").`)
    l.push(`- Tiempo total: ${textoTotal(tiempo)}. Duración promedio: ${Math.round(tiempo / periodo.length / 60000)} min.`)
    if (vol > 0) l.push(`- Volumen total en pesas: ${numeroEntero(vol)} kg.`)
    // Entrenamientos por semana, de la más antigua a la más nueva.
    const porSemana = Array.from({ length: SEMANAS }, (_, i) => {
      const a = desde + i * 7 * DIA
      return periodo.filter((h) => h.inicio >= a && h.inicio < a + 7 * DIA).length
    })
    l.push(`- Entrenamientos por semana (de la más antigua a esta): ${porSemana.join(', ')}.`)
  }
  l.push('')

  if (rutinas.length) {
    l.push('## Rutinas actuales')
    for (const r of rutinas) {
      const dias = r.dias.length ? ` (${textoDias(r.dias)})` : ''
      const ejs = r.ejercicios
        .map((x) => {
          const ej = mapa.get(x.ejercicioId)
          return `${ej?.nombre ?? x.ejercicioId} ${x.series}×${x.objetivo}${x.descanso ? `, descanso ${mmss(x.descanso)}` : ''}${x.nota ? ` [${x.nota}]` : ''}`
        })
        .join('; ')
      l.push(`- ${r.nombre}${dias}: ${ejs || 'sin ejercicios'}.`)
    }
    l.push('')
  }

  // Ejercicios hechos en el periodo, del más frecuente al menos.
  const conteo = new Map<string, number>()
  for (const h of periodo) for (const x of h.ejercicios) conteo.set(x.ejercicioId, (conteo.get(x.ejercicioId) ?? 0) + 1)
  const ids = [...conteo.keys()].sort((a, b) => conteo.get(b)! - conteo.get(a)!)
  if (ids.length) {
    l.push('## Ejercicios del periodo')
    for (const id of ids) {
      const ej = mapa.get(id)
      if (!ej) continue
      const todas = sesionesDe(id, historial)
      const enPeriodo = todas.filter((s) => s.t >= desde)
      const met = METRICAS[ej.tipo][0]
      const vals = enPeriodo.map((s) => met.valor(s.series)).filter((v): v is number => v !== null && v > 0)
      l.push(`### ${ej.nombre} (${NOMBRE_TIPO[ej.tipo].toLowerCase()}, ${ej.musculoPrincipal.toLowerCase()})`)
      l.push(`- Sesiones en el periodo: ${enPeriodo.length}.`)
      if (vals.length >= 2) {
        const a = vals[0]
        const b = vals[vals.length - 1]
        const mejor = met.menorEsMejor ? Math.min(...vals) : Math.max(...vals)
        l.push(
          a === b
            ? `- ${met.nombre}: se mantuvo en ${met.texto(a)}${mejor !== a ? ` (mejor del periodo: ${met.texto(mejor)})` : ''}.`
            : `- ${met.nombre}: de ${met.texto(a)} a ${met.texto(b)} (mejor del periodo: ${met.texto(mejor)}).`,
        )
      }
      const recs = recordsDe(ej.tipo, todas).filter((r) => r.nombre !== 'Veces hecho')
      const minus = (t: string) => (t.startsWith('1RM') ? t : t[0].toLowerCase() + t.slice(1))
      if (recs.length) l.push(`- Récords de siempre: ${recs.map((r) => `${minus(r.nombre)} ${r.texto}`).join('; ')}.`)
      // Las últimas 3 sesiones con sus series.
      for (const s of enPeriodo.slice(-3).reverse()) l.push(`- ${diaYMes(new Date(s.t))}: ${s.series.map((x) => textoSerie(x, ej.tipo)).join(', ')}`)
    }
    l.push('')
  }

  const av = avisos(historial, mapa, hoy.getTime())
  if (av.length) {
    l.push('## Avisos que muestra la app')
    for (const a of av) l.push(`- ${a.titulo} ${a.texto}`)
    l.push('')
  }

  l.push('---')
  l.push('Con estos datos: ¿cómo voy? ¿Qué está funcionando, qué conviene ajustar en mis rutinas (ejercicios, series, repeticiones, descansos o frecuencia) y qué metas razonables me pondrías para las próximas 4 semanas?')
  return l.join('\n')
}
