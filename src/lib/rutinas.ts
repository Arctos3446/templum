import type { Ejercicio, EjercicioEnRutina, Rutina } from '../db/tipos'
import { mmss } from './tiempo'

export const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
export const DIAS_INICIAL = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
export const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** 0 = lunes … 6 = domingo */
export function diaDeSemana(d = new Date()): number {
  return (d.getDay() + 6) % 7
}

/** "4 series · 8–10 reps · 2:00" */
export function resumenFila(f: EjercicioEnRutina, ej: Ejercicio | undefined): string {
  const partes = [`${f.series} ${f.series === 1 ? 'serie' : 'series'}`]
  if (f.objetivo.trim()) {
    const o = f.objetivo.trim()
    const conReps = (ej?.tipo === 'pesas' || ej?.tipo === 'peso_corporal') && /^[\d\s–-]+$/.test(o)
    partes.push(conReps ? `${o} reps` : o)
  }
  partes.push(f.descanso > 0 ? mmss(f.descanso) : 'sin descanso')
  return partes.join(' · ')
}

/** Los músculos principales de una rutina, sin repetir: "Pecho · Hombros · Tríceps" */
export function musculosDeRutina(r: Rutina, mapa: Map<string, Ejercicio>, max = 3): string {
  const vistos: string[] = []
  for (const f of r.ejercicios) {
    const m = mapa.get(f.ejercicioId)?.musculoPrincipal
    if (m && !vistos.includes(m)) vistos.push(m)
  }
  return vistos.slice(0, max).join(' · ')
}

export function textoDias(dias: number[]): string {
  if (dias.length === 7) return 'Todos los días'
  return [...dias].sort().map((d) => DIAS_CORTOS[d]).join(' · ')
}
