import { useSyncExternalStore } from 'react'

// Ajustes de cada persona, guardados en este dispositivo (cada uno decide los suyos).
export interface Ajustes {
  /** Suena una campanita al terminar el descanso. */
  sonido: boolean
  /** Vibra al terminar el descanso (Android; el iPhone no lo permite desde una página web). */
  vibrar: boolean
  /** La pantalla no se apaga mientras entrenas. */
  pantallaEncendida: boolean
  /** Descanso (segundos) con que parte cada ejercicio nuevo en una rutina o entrenamiento. */
  descanso: number

  // Elementos de fe (cada uno con su interruptor; los valores por defecto los eligió el usuario en el diseño).
  feVersiculoInicio: boolean
  feSanto: boolean
  feVersiculoFin: boolean
  feRecord: boolean
  feDescanso: boolean
  feOracionInicio: boolean
  feOracionFin: boolean
}

const DEFECTO: Ajustes = {
  sonido: true,
  vibrar: true,
  pantallaEncendida: true,
  descanso: 90,
  feVersiculoInicio: true,
  feSanto: true,
  feVersiculoFin: true,
  feRecord: true,
  feDescanso: false,
  feOracionInicio: false,
  feOracionFin: true,
}
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
