import { Link, useLocation } from 'react-router-dom'
import type { EntrenamientoEnCurso } from '../db/tipos'
import { textoDuracion } from '../lib/series'
import { useAhora } from '../lib/useAhora'

/** Aviso de "entrenamiento en curso" para volver a él desde cualquier pantalla. */
export function BarraEnCurso({ e }: { e: EntrenamientoEnCurso }) {
  const ahora = useAhora(1000)
  const { pathname } = useLocation()
  if (pathname.startsWith('/entrenamiento')) return null
  return (
    <Link to="/entrenamiento" className="barra-en-curso">
      <span className="bec-punto" aria-hidden="true" />
      <span className="bec-texto">
        <span className="bec-k">En curso</span>
        <span className="bec-nombre">{e.nombre}</span>
      </span>
      {e.descanso && e.descanso.hasta > ahora ? (
        <span className="bec-reloj num" data-descanso="true">
          Descanso {textoDuracion((e.descanso.hasta - ahora) / 1000)}
        </span>
      ) : (
        <span className="bec-reloj num">{textoDuracion((ahora - e.inicio) / 1000)}</span>
      )}
      <span className="bec-volver">Volver</span>
    </Link>
  )
}
