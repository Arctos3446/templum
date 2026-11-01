import { ChiRho } from '../components/Logo'
import { Empty } from '../components/Empty'
import { useTema, type Tema } from '../lib/tema'

const OPCIONES: { valor: Tema; texto: string }[] = [
  { valor: 'auto', texto: 'Automático' },
  { valor: 'oscuro', texto: 'Oscuro' },
  { valor: 'claro', texto: 'Claro' },
]

export function Ajustes() {
  const [tema, setTema] = useTema()

  return (
    <main className="screen" style={{ gap: 10 }}>
      <div className="screen-head" style={{ marginBottom: 6 }}>
        <h1>Ajustes</h1>
      </div>

      <span className="sec">Apariencia</span>
      <div className="grp" style={{ padding: '12px 14px', gap: 10 }}>
        <span>Tema</span>
        <div className="seg-group" role="group" aria-label="Tema">
          {OPCIONES.map((o) => (
            <button key={o.valor} type="button" className="seg" aria-pressed={tema === o.valor} onClick={() => setTema(o.valor)}>
              {o.texto}
            </button>
          ))}
        </div>
        <span className="row-s">Automático sigue el modo de tu celular o computador.</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <Empty icon="gear" title="Más ajustes" soon="Llegan en las partes 6 y 7">
          Entrenamiento, elementos de fe con sus interruptores, y respaldo de tus datos.
        </Empty>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 20, color: 'var(--muted)', fontSize: 12 }}>
        <span style={{ color: 'var(--gold)' }}>
          <ChiRho size={26} />
        </span>
        <span className="display" style={{ fontStyle: 'italic', fontSize: 17, color: 'var(--fg)' }}>
          Ad maiorem Dei gloriam
        </span>
        <span>Templum · versión {__APP_VERSION__}</span>
      </div>
    </main>
  )
}
