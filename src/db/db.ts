import Dexie, { type EntityTable } from 'dexie'
import type { Ejercicio, Entrenamiento, EntrenamientoEnCurso, Rutina } from './tipos'

// Base de datos local (IndexedDB). Todo vive solo en este dispositivo.
// Los 112 ejercicios de la biblioteca vienen con la app (contenido/ejercicios.json);
// aquí solo se guardan los que crea el usuario.
export const db = new Dexie('templum') as Dexie & {
  ejerciciosPropios: EntityTable<Ejercicio, 'id'>
  rutinas: EntityTable<Rutina, 'id'>
  entrenamientos: EntityTable<Entrenamiento, 'id'>
  /** Como máximo una fila: el entrenamiento que se está haciendo. */
  enCurso: EntityTable<EntrenamientoEnCurso, 'id'>
}

db.version(1).stores({
  ejerciciosPropios: 'id, grupo, nombre',
  rutinas: 'id, actualizada',
})

// Parte 3: historial de entrenamientos y el entrenamiento en curso.
db.version(2).stores({
  entrenamientos: 'id, inicio, rutinaId',
  enCurso: 'id',
})

/** Identificador único (funciona también sin https). */
export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && window.isSecureContext) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** Pide al navegador que no borre los datos si falta espacio. */
export function pedirAlmacenamientoPersistente() {
  navigator.storage?.persist?.().catch(() => {})
}
