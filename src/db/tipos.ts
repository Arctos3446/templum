// Tipos de datos de Templum.

export type TipoEjercicio = 'pesas' | 'peso_corporal' | 'cardio' | 'tiempo'

export interface Ejercicio {
  id: string
  nombre: string
  grupo: string
  equipo: string
  tipo: TipoEjercicio
  musculoPrincipal: string
  musculosSecundarios: string[]
  /** Dibujos de línea: [relajación, tensión]. Vacío si no tiene. */
  dibujos: string[]
  /** true si lo creó el usuario (se puede editar y borrar). */
  personalizado: boolean
  creado?: number
}

/** Un ejercicio dentro de una rutina. */
export interface EjercicioEnRutina {
  /** Identificador propio de esta fila (un mismo ejercicio puede repetirse). */
  uid: string
  ejercicioId: string
  series: number
  /** Texto libre: "8–10", "al fallo", "30 s", "5 km"… */
  objetivo: string
  /** Descanso en segundos. */
  descanso: number
  nota: string
}

export interface Rutina {
  id: string
  nombre: string
  /** Días en que se hace: 0 = lunes … 6 = domingo. */
  dias: number[]
  ejercicios: EjercicioEnRutina[]
  creada: number
  actualizada: number
}

export const GRUPOS = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazos', 'Core', 'Cardio'] as const

export const MUSCULOS = [
  'Pecho', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos', 'Abdominales',
  'Dorsales', 'Espalda media', 'Espalda baja', 'Trapecio', 'Cuello',
  'Glúteos', 'Cuádriceps', 'Isquiotibiales', 'Aductores', 'Abductores', 'Pantorrillas',
] as const

export const EQUIPOS = [
  'Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Máquina Smith', 'Barra Z',
  'Kettlebell', 'Banda elástica', 'Lastre', 'Trotadora', 'Bicicleta', 'Cuerda', 'Otro',
] as const

export const TIPOS: { valor: TipoEjercicio; nombre: string; detalle: string }[] = [
  { valor: 'pesas', nombre: 'Pesas', detalle: 'Kilos y repeticiones' },
  { valor: 'peso_corporal', nombre: 'Peso corporal', detalle: 'Solo repeticiones' },
  { valor: 'tiempo', nombre: 'Tiempo', detalle: 'Solo tiempo, como la plancha' },
  { valor: 'cardio', nombre: 'Cardio', detalle: 'Distancia y tiempo' },
]

export const NOMBRE_TIPO: Record<TipoEjercicio, string> = {
  pesas: 'Pesas',
  peso_corporal: 'Peso corporal',
  tiempo: 'Tiempo',
  cardio: 'Cardio',
}

/** Cómo se llama el "objetivo" según el tipo de ejercicio. */
export const ETIQUETA_OBJETIVO: Record<TipoEjercicio, string> = {
  pesas: 'Reps objetivo',
  peso_corporal: 'Reps objetivo',
  tiempo: 'Tiempo objetivo',
  cardio: 'Objetivo',
}

export const OBJETIVO_INICIAL: Record<TipoEjercicio, string> = {
  pesas: '8–10',
  peso_corporal: '10',
  tiempo: '30 s',
  cardio: '20 min',
}
