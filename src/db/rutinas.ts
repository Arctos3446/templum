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
