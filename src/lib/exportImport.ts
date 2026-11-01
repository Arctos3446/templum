// Respaldo de los datos (JSON), planilla (CSV) e importación. Los datos viven solo en el dispositivo.
import { db } from '../db/db'
import type { Ejercicio, Entrenamiento, Rutina } from '../db/tipos'
import { CATALOGO } from '../db/ejercicios'
import { aInputFecha, hora } from './fechas'
import { numero, textoDuracion } from './series'

const CLAVE_RESPALDO = 'templum.ultimoRespaldo'
const CLAVE_AJUSTES = 'templum.ajustes'
const CLAVE_TEMA = 'templum.tema'

export interface Respaldo {
  app: 'templum'
  version: 1
  exportado: number
  rutinas: Rutina[]
  ejerciciosPropios: Ejercicio[]
  entrenamientos: Entrenamiento[]
  ajustes?: unknown
  tema?: string | null
}

export function ultimoRespaldo(): number | null {
  const v = Number(localStorage.getItem(CLAVE_RESPALDO))
  return Number.isFinite(v) && v > 0 ? v : null
}

/** Descarga un archivo (en el celular queda en Descargas). */
function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportarRespaldo() {
  const r: Respaldo = {
    app: 'templum',
    version: 1,
    exportado: Date.now(),
    rutinas: await db.rutinas.toArray(),
    ejerciciosPropios: await db.ejerciciosPropios.toArray(),
    entrenamientos: await db.entrenamientos.orderBy('inicio').toArray(),
    ajustes: JSON.parse(localStorage.getItem(CLAVE_AJUSTES) ?? 'null'),
    tema: localStorage.getItem(CLAVE_TEMA),
  }
  descargar(`templum-respaldo-${aInputFecha(new Date())}.json`, JSON.stringify(r, null, 1), 'application/json')
  localStorage.setItem(CLAVE_RESPALDO, String(Date.now()))
}

/** Lee y revisa un archivo de respaldo. Lanza un error con un mensaje para el usuario si no sirve. */
export async function leerRespaldo(archivo: File): Promise<Respaldo> {
  let r: Partial<Respaldo>
  try {
    r = JSON.parse(await archivo.text())
  } catch {
    throw new Error('Ese archivo no es un respaldo de Templum (no se pudo leer).')
  }
  if (r?.app !== 'templum' || !Array.isArray(r.rutinas) || !Array.isArray(r.entrenamientos) || !Array.isArray(r.ejerciciosPropios))
    throw new Error('Ese archivo no es un respaldo de Templum.')
  if ((r.version ?? 0) > 1) throw new Error('Ese respaldo es de una versión más nueva de Templum. Actualiza la app e inténtalo de nuevo.')
  const bien = (x: unknown) => !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string'
  if (![...r.rutinas, ...r.entrenamientos, ...r.ejerciciosPropios].every(bien)) throw new Error('El respaldo está dañado: hay datos sin identificador.')
  return r as Respaldo
}

/** Reemplaza todos los datos del dispositivo por los del respaldo. */
export async function importarRespaldo(r: Respaldo) {
  await db.transaction('rw', [db.rutinas, db.ejerciciosPropios, db.entrenamientos, db.enCurso], async () => {
    await Promise.all([db.rutinas.clear(), db.ejerciciosPropios.clear(), db.entrenamientos.clear(), db.enCurso.clear()])
    await db.rutinas.bulkPut(r.rutinas)
    await db.ejerciciosPropios.bulkPut(r.ejerciciosPropios)
    await db.entrenamientos.bulkPut(r.entrenamientos)
  })
  if (r.ajustes && typeof r.ajustes === 'object') localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(r.ajustes))
  if (r.tema) localStorage.setItem(CLAVE_TEMA, r.tema)
}

export async function borrarTodo() {
  await db.transaction('rw', [db.rutinas, db.ejerciciosPropios, db.entrenamientos, db.enCurso], async () => {
    await Promise.all([db.rutinas.clear(), db.ejerciciosPropios.clear(), db.entrenamientos.clear(), db.enCurso.clear()])
  })
  localStorage.removeItem(CLAVE_RESPALDO)
}

/** Planilla con una fila por serie. Usa ";" y coma decimal, como espera Excel en Chile. */
export async function exportarCSV() {
  const propios = await db.ejerciciosPropios.toArray()
  const mapa = new Map([...CATALOGO, ...propios].map((e) => [e.id, e]))
  const historial = await db.entrenamientos.orderBy('inicio').toArray()
  const celda = (v: string | number | undefined) => {
    const s = v === undefined ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const filas = [['Fecha', 'Hora', 'Entrenamiento', 'Ejercicio', 'Grupo', 'Serie', 'Kg', 'Reps', 'Tiempo', 'Km', 'Nota']]
  for (const h of historial) {
    const d = new Date(h.inicio)
    for (const x of h.ejercicios) {
      const ej = mapa.get(x.ejercicioId)
      x.series.forEach((s, i) =>
        filas.push([
          aInputFecha(d),
          hora(d),
          h.nombre,
          ej?.nombre ?? x.ejercicioId,
          ej?.grupo ?? '',
          String(i + 1),
          s.kg !== undefined ? numero(s.kg) : '',
          s.reps !== undefined ? String(s.reps) : '',
          s.seg !== undefined ? textoDuracion(s.seg) : '',
          s.km !== undefined ? numero(s.km) : '',
          i === 0 ? x.nota : '',
        ]),
      )
    }
  }
  // El BOM al inicio hace que Excel reconozca las tildes.
  descargar(`templum-planilla-${aInputFecha(new Date())}.csv`, '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n'), 'text/csv;charset=utf-8')
}

/** Copia texto al portapapeles (con plan B para navegadores antiguos). */
export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const t = document.createElement('textarea')
    t.value = texto
    t.style.position = 'fixed'
    t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  }
}
