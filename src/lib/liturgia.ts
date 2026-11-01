/*
 * Calendario litúrgico de Templum (traído de contenido/liturgia.js, misma lógica).
 *
 * Calcula, para cualquier fecha, la celebración del día, su color y el tiempo litúrgico.
 * Usa calendario.json y sigue las Normas universales sobre el año litúrgico (tabla de
 * precedencia), con las fiestas que en Chile se trasladan al domingo: Epifanía (domingo
 * entre el 2 y el 8 de enero), Ascensión y Corpus Christi.
 */
import calendarioJson from '../../contenido/calendario.json'

const DIA = 86400000
const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV',
  'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII',
  'XXVIII', 'XXIX', 'XXX', 'XXXI', 'XXXII', 'XXXIII', 'XXXIV']
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Precedencia: número más bajo, más importante (Normas universales, n. 59).
const PREC = {
  triduo: 1, mayor: 2, solemnidad: 3, solemnidadPropia: 4, fiestaDelSenor: 5, domingo: 6,
  fiesta: 7, fiestaPropia: 8, feriaPrivilegiada: 9, memoria: 10, memoriaPropia: 11, libre: 12, feria: 13,
}

export type ColorLiturgico = 'blanco' | 'rojo' | 'morado' | 'verde' | 'rosa'
export type Tiempo = 'adviento' | 'navidad' | 'ordinario' | 'cuaresma' | 'triduo' | 'pascua'

interface Celebracion {
  nombre: string
  rango: string
  color: ColorLiturgico
  delSenor?: boolean
  region?: string
  precedencia?: number
}
interface Fija extends Celebracion { fecha: string }
interface Movil extends Celebracion { id: string; regla: string }
type ConPrec = Celebracion & { prec: number; trasladada?: boolean }
interface Feria { tiempo: Tiempo; nombre: string; prec: number; color: ColorLiturgico }
interface Hitos {
  pascua: number; ceniza: number; cuaresma1: number; ramos: number; juevesSanto: number; pentecostes: number
  epifania: number; bautismo: number; adviento: number; cristoRey: number; navidad: number; sagradaFamilia: number
}
interface DiaInterno { t: number; feria: Feria; celebraciones: ConPrec[]; conmemoraciones: string[] }

export interface DiaLiturgico {
  fecha: string
  tiempo: Tiempo
  nombre: string
  /** solemnidad · fiesta · memoria · libre · feria */
  rango: string
  color: ColorLiturgico
  feria: string
  otras: string[]
  conmemoraciones: string[]
  trasladada: boolean
  ciclo: 'A' | 'B' | 'C'
  anioPar: boolean
}

const fecha = (anio: number, mes: number, dia: number) => Date.UTC(anio, mes - 1, dia)
const diaSemana = (t: number) => new Date(t).getUTCDay()
const domingoAntes = (t: number) => t - diaSemana(t) * DIA
function clave(t: number) {
  const d = new Date(t)
  return String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0')
}
const semanas = (desde: number, hasta: number) => Math.round((hasta - desde) / (7 * DIA))

/** Domingo de Pascua (algoritmo anónimo gregoriano, de Meeus). */
export function pascua(anio: number): number {
  const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1
  return fecha(anio, mes, dia)
}

// Las fechas que ordenan el año civil.
function hitos(anio: number): Hitos {
  const p = pascua(anio)
  const epifania = domingoAntes(fecha(anio, 1, 8))
  const dia = new Date(epifania).getUTCDate()
  const navidad = fecha(anio, 12, 25)
  const adviento = domingoAntes(fecha(anio, 12, 3))
  const sagradaFamilia = diaSemana(navidad) === 0 ? fecha(anio, 12, 30) : navidad + (7 - diaSemana(navidad)) * DIA
  return {
    pascua: p,
    ceniza: p - 46 * DIA,
    cuaresma1: p - 42 * DIA,
    ramos: p - 7 * DIA,
    juevesSanto: p - 3 * DIA,
    pentecostes: p + 49 * DIA,
    epifania,
    // Si la Epifanía cae el 7 u 8 de enero, el Bautismo pasa al lunes siguiente.
    bautismo: dia >= 7 ? epifania + DIA : epifania + 7 * DIA,
    adviento,
    cristoRey: adviento - 7 * DIA,
    navidad,
    sagradaFamilia,
  }
}

function ordinario(n: number, ds: number): Feria {
  if (ds === 0) return { tiempo: 'ordinario', nombre: ROMANOS[n] + ' Domingo del Tiempo Ordinario', prec: PREC.domingo, color: 'verde' }
  return { tiempo: 'ordinario', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana del Tiempo Ordinario', prec: PREC.feria, color: 'verde' }
}

// El día según el tiempo litúrgico, sin santos.
function feria(t: number, h: Hitos): Feria {
  const ds = diaSemana(t), dom = ds === 0
  let n: number
  if (t >= h.adviento && t < h.navidad) {
    n = semanas(h.adviento, domingoAntes(t)) + 1
    if (dom) return { tiempo: 'adviento', nombre: ROMANOS[n] + ' Domingo de Adviento', prec: PREC.mayor, color: n === 3 ? 'rosa' : 'morado' }
    const mes = new Date(t).getUTCDate()
    return { tiempo: 'adviento', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana de Adviento', prec: mes >= 17 ? PREC.feriaPrivilegiada : PREC.feria, color: 'morado' }
  }
  if (t >= h.navidad) return { tiempo: 'navidad', nombre: 'Octava de Navidad', prec: PREC.feriaPrivilegiada, color: 'blanco' }
  if (t < h.bautismo) {
    if (dom) return { tiempo: 'navidad', nombre: 'Domingo del tiempo de Navidad', prec: PREC.domingo, color: 'blanco' }
    return { tiempo: 'navidad', nombre: DIAS[ds] + ' del tiempo de Navidad', prec: PREC.feria, color: 'blanco' }
  }
  if (t < h.ceniza) {
    // La semana I empieza después del Bautismo; si este cae en lunes, se cuenta desde la Epifanía.
    const ref = diaSemana(h.bautismo) === 0 ? h.bautismo : h.epifania
    return ordinario(semanas(ref, domingoAntes(t)) + 1, ds)
  }
  if (t < h.juevesSanto) {
    if (t === h.ceniza) return { tiempo: 'cuaresma', nombre: 'Miércoles de Ceniza', prec: PREC.mayor, color: 'morado' }
    if (t < h.cuaresma1) return { tiempo: 'cuaresma', nombre: DIAS[ds] + ' después de Ceniza', prec: PREC.feriaPrivilegiada, color: 'morado' }
    if (t === h.ramos) return { tiempo: 'cuaresma', nombre: 'Domingo de Ramos en la Pasión del Señor', prec: PREC.mayor, color: 'rojo' }
    if (t > h.ramos) return { tiempo: 'cuaresma', nombre: DIAS[ds] + ' Santo', prec: PREC.mayor, color: 'morado' }
    n = semanas(h.cuaresma1, domingoAntes(t)) + 1
    if (dom) return { tiempo: 'cuaresma', nombre: ROMANOS[n] + ' Domingo de Cuaresma', prec: PREC.mayor, color: n === 4 ? 'rosa' : 'morado' }
    return { tiempo: 'cuaresma', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana de Cuaresma', prec: PREC.feriaPrivilegiada, color: 'morado' }
  }
  if (t < h.pascua) {
    if (t === h.juevesSanto) return { tiempo: 'triduo', nombre: 'Jueves Santo de la Cena del Señor', prec: PREC.triduo, color: 'blanco' }
    if (t === h.juevesSanto + DIA) return { tiempo: 'triduo', nombre: 'Viernes Santo de la Pasión del Señor', prec: PREC.triduo, color: 'rojo' }
    return { tiempo: 'triduo', nombre: 'Sábado Santo', prec: PREC.triduo, color: 'morado' }
  }
  if (t <= h.pentecostes) {
    if (t === h.pascua) return { tiempo: 'pascua', nombre: 'Domingo de Pascua de la Resurrección del Señor', prec: PREC.triduo, color: 'blanco' }
    if (t < h.pascua + 7 * DIA) return { tiempo: 'pascua', nombre: DIAS[ds] + ' de la Octava de Pascua', prec: PREC.mayor, color: 'blanco' }
    n = semanas(h.pascua, domingoAntes(t)) + 1
    if (n === 2 && dom) return { tiempo: 'pascua', nombre: 'II Domingo de Pascua o de la Divina Misericordia', prec: PREC.mayor, color: 'blanco' }
    if (dom) return { tiempo: 'pascua', nombre: ROMANOS[n] + ' Domingo de Pascua', prec: PREC.mayor, color: 'blanco' }
    return { tiempo: 'pascua', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana de Pascua', prec: PREC.feria, color: 'blanco' }
  }
  // Después de Pentecostés las semanas se cuentan hacia atrás desde Cristo Rey (semana XXXIV).
  return ordinario(34 - semanas(domingoAntes(t), h.cristoRey), ds)
}

function precedencia(c: Celebracion): number {
  if (c.precedencia) return c.precedencia
  const propia = !!c.region
  if (c.rango === 'solemnidad') return propia ? PREC.solemnidadPropia : PREC.solemnidad
  if (c.rango === 'fiesta') return c.delSenor ? PREC.fiestaDelSenor : propia ? PREC.fiestaPropia : PREC.fiesta
  if (c.rango === 'memoria') return propia ? PREC.memoriaPropia : PREC.memoria
  return PREC.libre
}

function fechaMovil(regla: string, h: Hitos): number {
  if (regla === 'epifania') return h.epifania
  if (regla === 'bautismo') return h.bautismo
  if (regla === 'sagrada-familia') return h.sagradaFamilia
  const m = /^(pascua|adviento)([+-]\d+)$/.exec(regla)
  if (!m) throw new Error('Regla desconocida: ' + regla)
  return h[m[1] as 'pascua' | 'adviento'] + Number(m[2]) * DIA
}

function crear(datos: { fijas: Fija[]; moviles: Movil[] }) {
  // Las celebraciones propias (Chile, América) reemplazan a las generales del mismo día.
  const propias: Record<string, boolean> = {}
  datos.fijas.forEach((c) => {
    if (c.region) propias[c.fecha] = true
  })
  const fijas = datos.fijas.filter((c) => c.region || !propias[c.fecha])
  const cache: Record<number, { hitos: Hitos; dias: Record<string, DiaInterno> }> = {}

  function anio(a: number) {
    if (cache[a]) return cache[a]
    const h = hitos(a)
    const dias: Record<string, DiaInterno> = {}
    for (let t = fecha(a, 1, 1); t <= fecha(a, 12, 31); t += DIA) dias[clave(t)] = { t, feria: feria(t, h), celebraciones: [], conmemoraciones: [] }
    const cima = (d: DiaInterno) => d.celebraciones.reduce((min, c) => Math.min(min, c.prec), d.feria.prec)
    const poner = (t: number, c: ConPrec) => dias[clave(t)].celebraciones.push(c)

    datos.moviles.forEach((m) => {
      const t = fechaMovil(m.regla, h)
      if (new Date(t).getUTCFullYear() === a) poner(t, { prec: precedencia(m), ...m })
    })

    fijas.forEach((f) => {
      const p = f.fecha.split('-')
      const t = fecha(a, Number(p[0]), Number(p[1]))
      const c: ConPrec = { prec: precedencia(f), ...f }
      const d = dias[f.fecha]
      if (!d) return // 29 de febrero en años no bisiestos
      const solemnidad = c.prec <= PREC.solemnidadPropia
      // Dos memorias del mismo rango conviven (por ejemplo, San Fabián y San Sebastián); dos solemnidades no.
      if (c.prec < cima(d) || (!solemnidad && c.prec === cima(d) && c.prec < d.feria.prec)) {
        poner(t, c)
        return
      }
      if (solemnidad) {
        // Solemnidad impedida: se traslada.
        let nueva: number
        if (f.fecha === '03-19' && t >= h.ramos) nueva = h.ramos - DIA
        else if (f.fecha === '03-25' && t >= h.ramos && t <= h.pascua + 7 * DIA) nueva = h.pascua + 8 * DIA
        else {
          nueva = t + DIA
          while (dias[clave(nueva)] && cima(dias[clave(nueva)]) <= PREC.fiestaPropia) nueva += DIA
          if (!dias[clave(nueva)] || new Date(nueva).getUTCFullYear() !== a) return
        }
        poner(nueva, { trasladada: true, ...c })
        return
      }
      // Memorias en Cuaresma, del 17 al 24 de diciembre y en la Octava de Navidad: solo se recuerdan.
      if (c.prec >= PREC.memoria && d.feria.prec === PREC.feriaPrivilegiada && !d.celebraciones.length) d.conmemoraciones.push(c.nombre)
    })

    cache[a] = { hitos: h, dias }
    return cache[a]
  }

  function dia(entrada: Date): DiaLiturgico {
    const t = fecha(entrada.getFullYear(), entrada.getMonth() + 1, entrada.getDate())
    const a = new Date(t).getUTCFullYear()
    const info = anio(a)
    const d = info.dias[clave(t)]
    const lista = d.celebraciones.slice().sort((x, y) => x.prec - y.prec)
    // Con igual precedencia gana la celebración (Epifanía, Ascensión y Pentecostés sobre su domingo).
    const gana = lista.length && lista[0].prec <= d.feria.prec ? lista[0] : null
    const anioLiturgico = t >= info.hitos.adviento ? a + 1 : a
    return {
      fecha: clave(t),
      tiempo: d.feria.tiempo,
      nombre: gana ? gana.nombre : d.feria.nombre,
      rango: gana ? gana.rango : 'feria',
      // En las memorias libres se mantiene el color del tiempo.
      color: gana && gana.rango !== 'libre' ? gana.color : d.feria.color,
      feria: d.feria.nombre,
      otras: gana ? lista.slice(1).filter((c) => c.prec === gana.prec).map((c) => c.nombre) : [],
      conmemoraciones: gana ? [] : d.conmemoraciones,
      trasladada: !!(gana && gana.trasladada),
      ciclo: (['C', 'A', 'B'] as const)[anioLiturgico % 3],
      anioPar: anioLiturgico % 2 === 0,
    }
  }

  return { dia }
}

export const calendario = crear(calendarioJson as unknown as { fijas: Fija[]; moviles: Movil[] })

const NOMBRE_TIEMPO: Record<Tiempo, string> = {
  adviento: 'Adviento',
  navidad: 'Tiempo de Navidad',
  ordinario: 'Tiempo Ordinario',
  cuaresma: 'Cuaresma',
  triduo: 'Triduo Pascual',
  pascua: 'Tiempo de Pascua',
}

/**
 * La línea discreta de Inicio: el santo o la fiesta del día y, si es un día común, el tiempo litúrgico.
 * "San Martín de Tours, obispo · memoria" · "Tiempo Ordinario"
 */
export function lineaDelDia(d = new Date()): { texto: string; color: ColorLiturgico } {
  const l = calendario.dia(d)
  // Los días de semana comunes muestran solo el tiempo; los domingos y días mayores, su nombre.
  const comun = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado) (de la|del tiempo)/.test(l.nombre)
  if (l.rango === 'feria' && !comun) return { texto: l.nombre, color: l.color }
  if (l.rango === 'feria') {
    const conm = l.conmemoraciones[0]
    return { texto: conm ? `${NOMBRE_TIEMPO[l.tiempo]} · ${conm}` : NOMBRE_TIEMPO[l.tiempo], color: l.color }
  }
  const RANGOS: Record<string, string> = { solemnidad: 'solemnidad', fiesta: 'fiesta', memoria: 'memoria', libre: 'memoria libre' }
  const nombre = [l.nombre, ...l.otras].join(' y ')
  const rango = RANGOS[l.rango]
  return { texto: rango ? `${nombre} · ${rango}` : nombre, color: l.color }
}
