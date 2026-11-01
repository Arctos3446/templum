import { useLiveQuery } from 'dexie-react-hooks'
import catalogoJson from '../../contenido/ejercicios.json'
import { db, nuevoId } from './db'
import type { Ejercicio, TipoEjercicio } from './tipos'
import { GRUPOS } from './tipos'

type Crudo = Omit<Ejercicio, 'personalizado' | 'tipo'> & { tipo: string; idOriginal?: string }

/** Biblioteca que viene con la app. */
export const CATALOGO: Ejercicio[] = (catalogoJson as Crudo[]).map(({ idOriginal: _, ...e }) => ({
  ...e,
  tipo: e.tipo as TipoEjercicio,
  personalizado: false,
}))

const porId = new Map(CATALOGO.map((e) => [e.id, e]))

function ordenar(lista: Ejercicio[]): Ejercicio[] {
  const g = (x: string) => {
    const i = (GRUPOS as readonly string[]).indexOf(x)
    return i === -1 ? 99 : i
  }
  return [...lista].sort((a, b) => g(a.grupo) - g(b.grupo) || a.nombre.localeCompare(b.nombre, 'es'))
}

/** Todos los ejercicios: biblioteca + los creados por el usuario. undefined mientras carga. */
export function useEjercicios(): Ejercicio[] | undefined {
  const propios = useLiveQuery(() => db.ejerciciosPropios.toArray(), [])
  if (!propios) return undefined
  return ordenar([...CATALOGO, ...propios])
}

/** Un ejercicio por id. undefined = cargando, null = no existe. */
export function useEjercicio(id: string | undefined): Ejercicio | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null
    return porId.get(id) ?? (await db.ejerciciosPropios.get(id)) ?? null
  }, [id])
}

/** Mapa id → ejercicio, para mostrar rutinas. */
export function useMapaEjercicios(): Map<string, Ejercicio> | undefined {
  const todos = useEjercicios()
  if (!todos) return undefined
  return new Map(todos.map((e) => [e.id, e]))
}

export async function guardarEjercicioPropio(e: Omit<Ejercicio, 'id' | 'personalizado' | 'dibujos'> & { id?: string }) {
  const id = e.id ?? 'propio-' + nuevoId()
  await db.ejerciciosPropios.put({ ...e, id, personalizado: true, dibujos: [], creado: e.creado ?? Date.now() })
  return id
}

export async function borrarEjercicioPropio(id: string) {
  await db.ejerciciosPropios.delete(id)
}

/** Para buscar sin importar tildes ni mayúsculas. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
