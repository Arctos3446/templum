import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Logo'
import { Icon } from '../components/Icon'
import { Empty } from '../components/Empty'
import { fechaLarga, mismoDia, semanaActual } from '../lib/fechas'

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function Inicio() {
  const hoy = new Date()
  const semana = semanaActual(hoy)

  return (
    <main className="screen">
      <Wordmark />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>{fechaLarga(hoy)}</span>
        {/* El tiempo litúrgico y el santo del día llegan en la parte 6. */}
      </div>

      {/* Por ahora un versículo fijo; en la parte 6 cambiará cada día. */}
      <div className="verse-card">
        <span className="k">Versículo del día</span>
        <q>¿No saben que su cuerpo es templo del Espíritu Santo?</q>
        <span className="r">1 Corintios 6, 19</span>
      </div>

      <Link to="/rutinas" className="btn btn-primary btn-block">
        <Icon name="play" />
        Empezar entrenamiento
      </Link>

      <div className="sec">
        <span>Mis rutinas</span>
        <Link to="/rutinas" style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'none', textDecoration: 'none' }}>
          Ver todas
        </Link>
      </div>
      <Empty icon="list" title="Aún no tienes rutinas">
        Cuando crees tus rutinas, aparecerán aquí para empezar con un toque.
      </Empty>

      <div className="sec">
        <span>Esta semana</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        {semana.map((d, i) => {
          const esHoy = mismoDia(d, hoy)
          return (
            <span key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, color: esHoy ? 'var(--gold)' : 'var(--muted)' }}>
              <i style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${esHoy ? 'var(--gold)' : 'var(--line)'}`, display: 'block' }} />
              {INICIALES[i]}
            </span>
          )
        })}
      </div>
      <div className="num" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Stat v="0" l="entrenamientos" />
        <Stat v="0 kg" l="volumen" />
        <Stat v="0 min" l="tiempo" />
      </div>
    </main>
  )
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 18, fontWeight: 500 }}>{v}</span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{l}</span>
    </div>
  )
}
