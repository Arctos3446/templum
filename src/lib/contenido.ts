// Versículos y oraciones aprobados (contenido/). En la parte 6 se suman los interruptores de Ajustes.
import versiculosJson from '../../contenido/versiculos.json'
import oracionesJson from '../../contenido/oraciones.json'

export interface Versiculo {
  id: string
  tema: string
  ref: string
  texto: string
  momentos: string[]
}
export interface Oracion {
  id: string
  momento: 'inicio' | 'cierre'
  tipo: string
  titulo: string
  texto: string
}

export const VERSICULOS = (versiculosJson as { versiculos: Versiculo[] }).versiculos
export const ORACIONES = (oracionesJson as { oraciones: Oracion[] }).oraciones

/** Elige siempre el mismo elemento para una misma clave (así no cambia al volver a la pantalla). */
export function elegir<T>(lista: T[], clave: string): T {
  let h = 0
  for (const c of clave) h = (h * 31 + c.charCodeAt(0)) | 0
  return lista[Math.abs(h) % lista.length]
}

export const versiculoDeCierre = (clave: string) => elegir(VERSICULOS.filter((v) => v.momentos.includes('cierre')), clave)
export const oracionDeCierre = (clave: string) => elegir(ORACIONES.filter((o) => o.momento === 'cierre'), clave)
