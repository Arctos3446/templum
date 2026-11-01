// Fechas en español de Chile.

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "Domingo 1 de noviembre" */
export function fechaLarga(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

/** Los 7 días de la semana actual, de lunes a domingo. */
export function semanaActual(hoy = new Date()): Date[] {
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i))
}

export function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** "Octubre 2026" */
export function mesYAnio(d: Date): string {
  const m = MESES[d.getMonth()]
  return `${m[0].toUpperCase()}${m.slice(1)} ${d.getFullYear()}`
}

/** "Vie" */
export function diaCorto(d: Date): string {
  return DIAS_CORTOS[d.getDay()]
}

/** "18:05" */
export function hora(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "12 de octubre" */
export function diaYMes(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

/** Para los campos de fecha y hora: "2026-11-01" y "18:05". */
export function aInputFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function aInputHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "hoy", "ayer", "hace 3 días" o "12 de octubre". */
export function haceCuanto(t: number, hoy = new Date()): string {
  const a = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
  const d = new Date(t)
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((a - b) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return diaYMes(d)
}
