import { Link } from 'react-router-dom'
import type { Ejercicio, Rutina } from '../db/tipos'
import { musculosDeRutina, textoDias } from '../lib/rutinas'
import { Icon } from './Icon'

export function TarjetaRutina({
  r,
  mapa,
  hoy,
  onEmpezar,
}: {
  r: Rutina
  mapa: Map<string, Ejercicio>
  hoy?: boolean
  /** Si viene, la tarjeta lleva un botón ▶ para empezar el entrenamiento. */
  onEmpezar?: () => void
}) {
  const n = r.ejercicios.length
  const musculos = musculosDeRutina(r, mapa)
  const tarjeta = (
    <Link to={`/rutinas/${r.id}`} className={onEmpezar ? 'tarjeta-rutina con-empezar' : 'tarjeta-rutina'}>
      <span className="tr-texto">
        <span className="tr-nombre">
          {r.nombre}
          {hoy && <span className="tag-hoy">Hoy</span>}
        </span>
        <span className="tr-meta">
          {[musculos, `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`].filter(Boolean).join(' · ')}
        </span>
        {r.dias.length > 0 && <span className="tr-dias">{textoDias(r.dias)}</span>}
      </span>
      {!onEmpezar && <Icon name="chev" size={16} />}
    </Link>
  )
  if (!onEmpezar) return tarjeta
  return (
    <div className="tarjeta-envoltura">
      {tarjeta}
      <button type="button" className="tr-empezar" aria-label={`Empezar ${r.nombre}`} onClick={onEmpezar}>
        <Icon name="play" size={20} />
      </button>
    </div>
  )
}
