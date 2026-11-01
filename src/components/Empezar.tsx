import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { empezarEntrenamiento, leerEnCurso, descartarEnCurso } from '../db/entrenamientos'
import { useMapaEjercicios } from '../db/ejercicios'
import type { EntrenamientoEnCurso, Rutina } from '../db/tipos'
import { Dialogo } from './Dialogo'

/** Empieza un entrenamiento (desde una rutina o en blanco). Si ya hay uno en curso, pregunta antes. */
export function useEmpezar() {
  const mapa = useMapaEjercicios()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Desde la pantalla "Empezar", el entrenamiento la reemplaza (al minimizar no se vuelve a ella).
  const ir = () => navigate('/entrenamiento', { replace: pathname === '/empezar' })
  const [choque, setChoque] = useState<{ nueva: Rutina | null; actual: EntrenamientoEnCurso } | null>(null)

  async function empezar(r: Rutina | null) {
    if (!mapa) return
    const actual = await leerEnCurso()
    if (actual) return setChoque({ nueva: r, actual })
    await empezarEntrenamiento(r, mapa)
    ir()
  }

  async function reemplazar() {
    if (!choque || !mapa) return
    await descartarEnCurso()
    await empezarEntrenamiento(choque.nueva, mapa)
    setChoque(null)
    ir()
  }

  const minutos = choque ? Math.max(1, Math.round((Date.now() - choque.actual.inicio) / 60000)) : 0

  const dialogo = (
    <Dialogo
      abierto={!!choque}
      titulo="Ya tienes un entrenamiento en curso"
      confirmar="Descartarlo y empezar"
      peligro
      onConfirmar={reemplazar}
      onCerrar={() => setChoque(null)}
    >
      “{choque?.actual.nombre}”, empezado hace {minutos} min. Si empiezas otro, se borra lo que anotaste ahí.{' '}
      <Link to="/entrenamiento" onClick={() => setChoque(null)}>
        Ir al que tengo en curso
      </Link>
    </Dialogo>
  )

  return { empezar, dialogo, listo: !!mapa }
}
