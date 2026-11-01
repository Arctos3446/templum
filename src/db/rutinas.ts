import { useLiveQuery } from 'dexie-react-hooks'
import { db, nuevoId } from './db'
import type { Rutina } from './tipos'

export function useRutinas(): Rutina[] | undefined {
  return useLiveQuery(() => db.rutinas.orderBy('actualizada').reverse().toArray(), [])
}

/** undefined = cargando, null = no existe. */
export function useRutina(id: string | undefined): Rutina | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.rutinas.get(id)) ?? null) : null), [id])
}

export async function guardarRutina(r: Omit<Rutina, 'id' | 'creada' | 'actualizada'> & Partial<Pick<Rutina, 'id' | 'creada'>>) {
  const ahora = Date.now()
  const id = r.id ?? nuevoId()
  await db.rutinas.put({ ...r, id, creada: r.creada ?? ahora, actualizada: ahora })
  return id
}

export async function eliminarRutina(id: string) {
  await db.rutinas.delete(id)
}

/** Agrega varias rutinas de una vez (por ejemplo, desde una plantilla), en el orden dado. */
export async function agregarRutinas(lista: Omit<Rutina, 'id' | 'creada' | 'actualizada'>[]) {
  const ahora = Date.now()
  // La lista de rutinas se ordena por "actualizada" (más nueva primero): se restan milisegundos para respetar el orden.
  await db.rutinas.bulkPut(lista.map((r, i) => ({ ...r, id: nuevoId(), creada: ahora - i, actualizada: ahora - i })))
}
