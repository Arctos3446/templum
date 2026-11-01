import { Link } from 'react-router-dom'
import { useRutinas } from '../db/rutinas'
import { useMapaEjercicios } from '../db/ejercicios'
import { useEnCurso } from '../db/entrenamientos'
import { diaDeSemana } from '../lib/rutinas'
import { useEmpezar } from '../components/Empezar'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'
import { TarjetaRutina } from '../components/TarjetaRutina'
import { Volver } from '../components/Volver'

export function Empezar() {
  const rutinas = useRutinas()
  const mapa = useMapaEjercicios()
  const enCurso = useEnCurso()
  const { empezar, dialogo } = useEmpezar()
  const hoy = diaDeSemana()
  const lista = rutinas ? [...rutinas].sort((a, b) => Number(b.dias.includes(hoy)) - Number(a.dias.includes(hoy))) : []

  return (
    <main className="screen empezar">
      <Volver a="/" texto="Inicio" />
      <div className="screen-head">
        <h1>Empezar entrenamiento</h1>
      </div>

      {enCurso && (
        <Link to="/entrenamiento" className="btn btn-primary btn-block">
          <Icon name="play" />
          Continuar “{enCurso.nombre}”
        </Link>
      )}

      <span className="sec">Elige una rutina</span>
      {rutinas && mapa && lista.length > 0 ? (
        <div className="lista-rutinas">
          {lista.map((r) => (
            <TarjetaRutina key={r.id} r={r} mapa={mapa} hoy={r.dias.includes(hoy)} onEmpezar={() => empezar(r)} />
          ))}
        </div>
      ) : rutinas ? (
        <Empty icon="list" title="Aún no tienes rutinas">
          <Link to="/rutinas/nueva">Crea una rutina</Link> o empieza en blanco.
        </Empty>
      ) : null}

      <span className="sec">O sin rutina</span>
      <button type="button" className="agregar-ej" onClick={() => empezar(null)}>
        <Icon name="plus" size={18} />
        Entrenamiento en blanco
      </button>

      {dialogo}
    </main>
  )
}
