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

/** Versículo del día: el mismo durante todo el día y distinto cada día. */
export function versiculoDelDia(d = new Date()): Versiculo {
  const lista = VERSICULOS.filter((v) => v.momentos.includes('inicio'))
  // Recorre la lista en un orden fijo pero salteado, para que días seguidos no repitan tema.
  const dia = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
  return lista[(dia * 37) % lista.length]
}
export const versiculoDeRecord = (clave: string) => elegir(VERSICULOS.filter((v) => v.momentos.includes('record')), clave)
export const versiculoDeDescanso = (clave: string) => elegir(VERSICULOS.filter((v) => v.momentos.includes('descanso')), clave)
export const oracionDeInicio = (clave: string) => elegir(ORACIONES.filter((o) => o.momento === 'inicio'), clave)
