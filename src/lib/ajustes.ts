import { useSyncExternalStore } from 'react'

// Ajustes de cada persona, guardados en este dispositivo (cada uno decide los suyos).
export interface Ajustes {
  /** Suena una campanita al terminar el descanso. */
  sonido: boolean
  /** Vibra al terminar el descanso (Android; el iPhone no lo permite desde una página web). */
  vibrar: boolean
  /** La pantalla no se apaga mientras entrenas. */
  pantallaEncendida: boolean
}

const DEFECTO: Ajustes = { sonido: true, vibrar: true, pantallaEncendida: true }
const CLAVE = 'templum.ajustes'
const avisar = new Set<() => void>()

let actual: Ajustes = leer()

function leer(): Ajustes {
  try {
    return { ...DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') }
  } catch {
    return DEFECTO
  }
}

export function leerAjustes(): Ajustes {
  return actual
}

export function cambiarAjuste<K extends keyof Ajustes>(k: K, v: Ajustes[K]) {
  actual = { ...actual, [k]: v }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actual))
  } catch {
    /* sin almacenamiento: vale solo por esta vez */
  }
  avisar.forEach((f) => f())
}

export function useAjustes(): Ajustes {
  return useSyncExternalStore(
    (f) => {
      avisar.add(f)
      return () => avisar.delete(f)
    },
    () => actual,
  )
}

/** ¿Este celular puede vibrar desde la app? (En iPhone, no.) */
export const puedeVibrar = typeof navigator !== 'undefined' && 'vibrate' in navigator
