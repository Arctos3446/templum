import { ChiRho } from '../components/Logo'
import { Empty } from '../components/Empty'
import { useTema, type Tema } from '../lib/tema'
import { cambiarAjuste, puedeVibrar, useAjustes, type Ajustes as TAjustes } from '../lib/ajustes'
import { mmss } from '../lib/tiempo'
import { ORACIONES, VERSICULOS } from '../lib/contenido'

type ClaveInterruptor = { [K in keyof TAjustes]: TAjustes[K] extends boolean ? K : never }[keyof TAjustes]

const OPCIONES: { valor: Tema; texto: string }[] = [
  { valor: 'auto', texto: 'Automático' },
  { valor: 'oscuro', texto: 'Oscuro' },
  { valor: 'claro', texto: 'Claro' },
]

export function Ajustes() {
  const [tema, setTema] = useTema()
  const a = useAjustes()

  return (
    <main className="screen">
      <div className="ajustes">
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

      <span className="sec" style={{ marginTop: 14 }}>Entrenamiento</span>
      <div className="grp">
        <div className="row">
          <span className="row-t">
            <span>Descanso por defecto</span>
            <span className="row-s">Para los ejercicios nuevos que agregues.</span>
          </span>
          <div className="stepper stepper-ajuste">
            <button type="button" aria-label="15 segundos menos" disabled={a.descanso <= 15} onClick={() => cambiarAjuste('descanso', a.descanso - 15)}>
              −
            </button>
            <span className="num">{mmss(a.descanso)}</span>
            <button type="button" aria-label="15 segundos más" disabled={a.descanso >= 600} onClick={() => cambiarAjuste('descanso', a.descanso + 15)}>
              +
            </button>
          </div>
        </div>
        <Interruptor a={a} k="sonido" texto="Sonido al terminar el descanso" detalle="En iPhone no suena si el celular está en silencio." />
        <Interruptor
          a={a}
          k="vibrar"
          texto="Vibración"
          detalle={puedeVibrar ? 'Al terminar el descanso.' : 'Este celular no permite vibrar desde la app (pasa en iPhone).'}
          deshabilitado={!puedeVibrar}
        />
        <Interruptor a={a} k="pantallaEncendida" texto="Mantener pantalla encendida" detalle="Mientras entrenas, para que el descanso pueda avisarte." />
      </div>

      <span className="sec sec-gold" style={{ marginTop: 14 }}>
        <span className="sec-icono">
          <ChiRho size={14} strokeWidth={9} />
          Fe
        </span>
      </span>
      <div className="grp">
        <Interruptor a={a} k="feVersiculoInicio" texto="Versículo del día en Inicio" />
        <Interruptor a={a} k="feSanto" texto="Santo del día" detalle="Una línea bajo la fecha, según el calendario litúrgico de Chile." />
        <Interruptor a={a} k="feVersiculoFin" texto="Versículo al terminar" />
        <Interruptor a={a} k="feRecord" texto="Frase al lograr un récord" />
        <Interruptor a={a} k="feDescanso" texto="Versículos durante el descanso" detalle="Una frase breve en el temporizador." />
        <Interruptor a={a} k="feOracionInicio" texto="Oración al empezar" />
        <Interruptor a={a} k="feOracionFin" texto="Oración al terminar" />
      </div>
      <span className="row-s ajustes-nota">{VERSICULOS.length} versículos y {ORACIONES.length} oraciones, revisados por ti.</span>

      <div style={{ marginTop: 14 }}>
        <Empty icon="gear" title="Tus datos" soon="Llega en la parte 7">
          Respaldo de tus datos, planilla y resumen para Claude.
        </Empty>
      </div>

      <div className="pie">
        <span style={{ color: 'var(--gold)' }}>
          <ChiRho size={26} />
        </span>
        <span className="display">Ad maiorem Dei gloriam</span>
        <span>Templum · versión {__APP_VERSION__}</span>
        <span className="creditos">
          Dibujos de ejercicios:{' '}
          <a href="https://github.com/everkinetic/data" target="_blank" rel="noreferrer">
            Everkinetic
          </a>
          , licencia{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noreferrer">
            CC BY-SA 4.0
          </a>
          , recoloreados en dorado. Músculos de cada ejercicio:{' '}
          <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
            free-exercise-db
          </a>
          .
        </span>
      </div>
      </div>
    </main>
  )
}

function Interruptor({
  a,
  k,
  texto,
  detalle,
  deshabilitado = false,
}: {
  a: TAjustes
  k: ClaveInterruptor
  texto: string
  detalle?: string
  deshabilitado?: boolean
}) {
  return (
    <label className="row" data-deshabilitado={deshabilitado}>
      <span className="row-t">
        <span>{texto}</span>
        {detalle && <span className="row-s">{detalle}</span>}
      </span>
      <input
        type="checkbox"
        className="sw"
        role="switch"
        checked={a[k] && !deshabilitado}
        disabled={deshabilitado}
        onChange={(e) => cambiarAjuste(k, e.target.checked)}
      />
    </label>
  )
}
