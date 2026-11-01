import { useLiveQuery } from 'dexie-react-hooks'
import { db, nuevoId } from './db'
import type {
  Ejercicio,
  EjercicioEnCurso,
  EjercicioEnRutina,
  Entrenamiento,
  EntrenamientoEnCurso,
  Rutina,
  SerieEnCurso,
  SerieHecha,
  TipoEjercicio,
} from './tipos'
import { OBJETIVO_INICIAL } from './tipos'
import { convertir, valorRecord } from '../lib/series'
import { DESCANSO_POR_DEFECTO } from '../lib/tiempo'

export function serieVacia(): SerieEnCurso {
  return { uid: nuevoId(), kg: '', reps: '', tiempo: '', km: '', hecha: false }
}

/** Un ejercicio nuevo dentro del entrenamiento (desde la rutina o agregado al momento). */
export function ejercicioEnCurso(ej: Ejercicio, deRutina?: EjercicioEnRutina): EjercicioEnCurso {
  const n = deRutina?.series ?? (ej.tipo === 'cardio' ? 1 : 3)
  return {
    uid: deRutina?.uid ?? nuevoId(),
    ejercicioId: ej.id,
    objetivo: deRutina?.objetivo ?? OBJETIVO_INICIAL[ej.tipo],
    descanso: deRutina?.descanso ?? (ej.tipo === 'cardio' ? 0 : DESCANSO_POR_DEFECTO),
    nota: deRutina?.nota ?? '',
    series: Array.from({ length: Math.max(1, n) }, serieVacia),
  }
}

/** undefined = cargando, null = no hay entrenamiento en curso. */
export function useEnCurso(): EntrenamientoEnCurso | null | undefined {
  return useLiveQuery(async () => (await db.enCurso.toCollection().first()) ?? null, [])
}

export async function leerEnCurso(): Promise<EntrenamientoEnCurso | null> {
  return (await db.enCurso.toCollection().first()) ?? null
}

export async function empezarEntrenamiento(rutina: Rutina | null, mapa: Map<string, Ejercicio>) {
  const e: EntrenamientoEnCurso = {
    id: nuevoId(),
    nombre: rutina?.nombre ?? 'Entrenamiento',
    rutinaId: rutina?.id,
    inicio: Date.now(),
    ejercicios: (rutina?.ejercicios ?? [])
      .map((f) => {
        const ej = mapa.get(f.ejercicioId)
        return ej ? ejercicioEnCurso(ej, f) : null
      })
      .filter((x): x is EjercicioEnCurso => !!x),
    descanso: null,
  }
  await db.transaction('rw', db.enCurso, async () => {
    await db.enCurso.clear()
    await db.enCurso.put(e)
  })
  return e
}

export async function guardarEnCurso(e: EntrenamientoEnCurso) {
  await db.transaction('rw', db.enCurso, async () => {
    // Si ya se terminó o descartó en otra pestaña, no lo revive.
    if (!(await db.enCurso.get(e.id))) return
    await db.enCurso.put(e)
  })
}

export async function descartarEnCurso() {
  await db.enCurso.clear()
}

/** Lo que se guarda en el historial: solo las series marcadas y los ejercicios con al menos una. */
export function aHistorial(e: EntrenamientoEnCurso, tipoDe: (id: string) => TipoEjercicio | undefined): Entrenamiento {
  return {
    id: e.id,
    nombre: e.nombre,
    rutinaId: e.rutinaId,
    inicio: e.inicio,
    fin: e.fin ?? Date.now(),
    ejercicios: e.ejercicios
      .map((x) => {
        const tipo = tipoDe(x.ejercicioId) ?? 'pesas'
        const series = x.series
          .filter((s) => s.hecha)
          .map((s) => convertir(s, tipo))
          .filter((s): s is SerieHecha => !!s)
        return { uid: x.uid, ejercicioId: x.ejercicioId, nota: x.nota, series }
      })
      .filter((x) => x.series.length > 0),
  }
}

/** Cómo quedaría la rutina con los cambios de hoy (ejercicios, cantidad de series, descanso y notas). */
export function rutinaDesde(e: EntrenamientoEnCurso): EjercicioEnRutina[] {
  return e.ejercicios.map((x) => ({
    uid: x.uid,
    ejercicioId: x.ejercicioId,
    series: x.series.length,
    objetivo: x.objetivo,
    descanso: x.descanso,
    nota: x.nota,
  }))
}

export function cambioLaRutina(e: EntrenamientoEnCurso, r: Rutina): boolean {
  const clave = (l: EjercicioEnRutina[]) => JSON.stringify(l.map((x) => [x.ejercicioId, x.series, x.descanso, x.nota]))
  return clave(rutinaDesde(e)) !== clave(r.ejercicios)
}

export async function guardarEntrenamiento(e: EntrenamientoEnCurso, h: Entrenamiento, actualizarRutina: boolean) {
  await db.transaction('rw', db.entrenamientos, db.enCurso, db.rutinas, async () => {
    await db.entrenamientos.put(h)
    await db.enCurso.clear()
    if (actualizarRutina && e.rutinaId) {
      const r = await db.rutinas.get(e.rutinaId)
      if (r) await db.rutinas.put({ ...r, ejercicios: rutinaDesde(e), actualizada: Date.now() })
    }
  })
}

export function useEntrenamientos(): Entrenamiento[] | undefined {
  return useLiveQuery(() => db.entrenamientos.orderBy('inicio').reverse().toArray(), [])
}

export interface Previo {
  /** Series de la última vez que se hizo el ejercicio. */
  ultima: SerieHecha[]
  /** El mejor valor de siempre (kg, reps, segundos o km según el tipo). */
  mejor: number
}

/** Para cada ejercicio: lo de la última vez y lo mejor de siempre. */
export function calcularPrevios(historial: Entrenamiento[], tipoDe: (id: string) => TipoEjercicio | undefined, excepto?: string) {
  const m = new Map<string, Previo>()
  // El historial viene del más nuevo al más antiguo.
  for (const h of historial) {
    if (h.id === excepto) continue
    for (const x of h.ejercicios) {
      const tipo = tipoDe(x.ejercicioId)
      if (!tipo || !x.series.length) continue
      const mejor = Math.max(...x.series.map((s) => valorRecord(s, tipo)))
      const p = m.get(x.ejercicioId)
      if (!p) m.set(x.ejercicioId, { ultima: x.series, mejor })
      else p.mejor = Math.max(p.mejor, mejor)
    }
  }
  return m
}

/** undefined = cargando, null = no existe. */
export function useEntrenamiento(id: string | undefined): Entrenamiento | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.entrenamientos.get(id)) ?? null) : null), [id])
}

export async function actualizarEntrenamiento(h: Entrenamiento) {
  await db.entrenamientos.put(h)
}

export async function eliminarEntrenamiento(id: string) {
  await db.entrenamientos.delete(id)
}
