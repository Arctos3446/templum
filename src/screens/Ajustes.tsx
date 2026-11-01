import { useRef, useState } from 'react'
import { ChiRho } from '../components/Logo'
import { Dialogo } from '../components/Dialogo'
import { CopiarResumen } from '../components/CopiarResumen'
import { useToast } from '../components/Toast'
import { borrarTodo, exportarCSV, exportarRespaldo, importarRespaldo, leerRespaldo, ultimoRespaldo, type Respaldo } from '../lib/exportImport'
import { haceCuanto } from '../lib/fechas'
import { useEntrenamientos } from '../db/entrenamientos'
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
  const toast = useToast()
  const historial = useEntrenamientos()
  const archivo = useRef<HTMLInputElement>(null)
  const [respaldo, setRespaldo] = useState(ultimoRespaldo())
  const [importar, setImportar] = useState<Respaldo | null>(null)
  const [borrar, setBorrar] = useState(false)
  const [error, setError] = useState('')

  // Aviso de respaldo: si hay datos y pasó más de una semana (o nunca se respaldó).
  const hayDatos = !!historial?.length
  const atrasado = hayDatos && (!respaldo || Date.now() - respaldo > 7 * 86400000)

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

      <span className="sec" style={{ marginTop: 14 }}>Tus datos</span>
      <div className="grp">
        <div className="row" data-atrasado={atrasado}>
          <span className="respaldo-icono">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </g>
            </svg>
          </span>
          <span className="row-t">
            <span>{respaldo ? `Último respaldo: ${haceCuanto(respaldo)}` : 'Aún no has hecho un respaldo'}</span>
            <span className="row-s">Tus datos viven solo en este dispositivo. Respalda cada semana y guarda el archivo en Drive o envíatelo.</span>
          </span>
        </div>
        <div className="row">
          <button
            type="button"
            className="act"
            onClick={async () => {
              await exportarRespaldo()
              setRespaldo(ultimoRespaldo())
              toast.mostrar('Respaldo descargado.')
            }}
          >
            Exportar respaldo completo
          </button>
        </div>
        <div className="row">
          <button
            type="button"
            className="act"
            onClick={async () => {
              await exportarCSV()
              toast.mostrar('Planilla descargada.')
            }}
          >
            Exportar a planilla (CSV)
          </button>
        </div>
        <div className="row">
          <button type="button" className="act" onClick={() => archivo.current?.click()}>
            Importar respaldo
          </button>
          <input
            ref={archivo}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                setImportar(await leerRespaldo(f))
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          />
        </div>
        <div className="row">
          <CopiarResumen className="act act-icono" onListo={toast.mostrar} />
        </div>
      </div>
      {error && (
        <p className="error-caja" role="alert">
          {error}
        </p>
      )}

      <div className="grp" style={{ marginTop: 6 }}>
        <div className="row">
          <button type="button" className="act peligro" onClick={() => setBorrar(true)}>
            Borrar todos los datos
          </button>
        </div>
      </div>

      <Dialogo
        abierto={!!importar}
        titulo="¿Importar este respaldo?"
        confirmar="Importar"
        peligro
        onConfirmar={async () => {
          await importarRespaldo(importar!)
          // Se recarga para tomar también los ajustes del respaldo.
          window.location.reload()
        }}
        onCerrar={() => setImportar(null)}
      >
        {importar &&
          `Es del ${new Date(importar.exportado).toLocaleDateString('es-CL')} y trae ${plural(importar.entrenamientos.length, 'entrenamiento', 'entrenamientos')}, ${plural(importar.rutinas.length, 'rutina', 'rutinas')} y ${plural(importar.ejerciciosPropios.length, 'ejercicio creado', 'ejercicios creados')}. Reemplaza todo lo que tienes ahora en este dispositivo.`}
      </Dialogo>
      <Dialogo
        abierto={borrar}
        titulo="¿Borrar todos tus datos?"
        confirmar="Borrar todo"
        peligro
        onConfirmar={async () => {
          await borrarTodo()
          setBorrar(false)
          setRespaldo(null)
          toast.mostrar('Datos borrados.')
        }}
        onCerrar={() => setBorrar(false)}
      >
        Se borran tus rutinas, entrenamientos y ejercicios creados de este dispositivo. No se puede deshacer: si quieres conservarlos, exporta un respaldo antes.
      </Dialogo>
      {toast.elemento}

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

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
