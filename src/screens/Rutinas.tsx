import { Link } from 'react-router-dom'
import { useRutinas } from '../db/rutinas'
import { CATALOGO, useMapaEjercicios } from '../db/ejercicios'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'
import { TarjetaRutina } from '../components/TarjetaRutina'
import { diaDeSemana } from '../lib/rutinas'

export function Rutinas() {
  const rutinas = useRutinas()
  const mapa = useMapaEjercicios()
  const hoy = diaDeSemana()
  const propios = mapa ? mapa.size - CATALOGO.length : 0

  return (
    <main className="screen">
      <div className="screen-head">
        <h1>Rutinas</h1>
        <Link to="/rutinas/nueva" className="btn btn-primary">
          <Icon name="plus" />
          Nueva rutina
        </Link>
      </div>

      {rutinas && mapa && (
        <>
          {rutinas.length === 0 ? (
            <Empty icon="list" title="Aún no tienes rutinas">
              Crea tu primera rutina con el botón <b style={{ fontSize: 'inherit' }}>Nueva rutina</b>. Puedes elegir los ejercicios, sus series, las repeticiones y el descanso.
            </Empty>
          ) : (
            <div className="lista-rutinas">
              {rutinas.map((r) => (
                <TarjetaRutina key={r.id} r={r} mapa={mapa} hoy={r.dias.includes(hoy)} />
              ))}
            </div>
          )}

          <div className="sec" style={{ marginTop: 8 }}>
            <span>Ejercicios</span>
          </div>
          <Link to="/ejercicios" className="tarjeta-rutina tarjeta-biblioteca">
            <span className="mini-icono">
              <Icon name="dumbbell" size={24} />
            </span>
            <span className="tr-texto">
              <span className="tr-nombre">Biblioteca de ejercicios</span>
              <span className="tr-meta">
                {CATALOGO.length} ejercicios{propios > 0 ? ` · ${propios} ${propios === 1 ? 'creado' : 'creados'} por ti` : ''}
              </span>
            </span>
            <Icon name="chev" size={16} />
          </Link>
        </>
      )}
    </main>
  )
}
