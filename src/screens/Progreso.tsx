import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEntrenamientos } from '../db/entrenamientos'
import { useMapaEjercicios } from '../db/ejercicios'
import { haceCuanto, diaYMes } from '../lib/fechas'
import { METRICAS, recordsDe, sesionesDe } from '../lib/records'
import { avisos } from '../lib/insights'
import { useSesion } from '../lib/useSesion'
import { Empty } from '../components/Empty'
import { GraficoLinea } from '../components/GraficoLinea'
import { Icon } from '../components/Icon'
import { SelectorEjercicios } from '../components/SelectorEjercicios'
import { CopiarResumen } from '../components/CopiarResumen'
import { useToast } from '../components/Toast'

const RANGOS = [
  { clave: '3m', nombre: '3 meses', meses: 3 },
  { clave: '6m', nombre: '6 meses', meses: 6 },
  { clave: '1a', nombre: '1 año', meses: 12 },
  { clave: 'todo', nombre: 'Todo', meses: 0 },
] as const

export function Progreso() {
  const historial = useEntrenamientos()
  const mapa = useMapaEjercicios()
  const [elegido, setElegido] = useSesion<string | null>('progreso.ejercicio', null)
  const [iMetrica, setIMetrica] = useSesion('progreso.metrica', 0)
  const [rango, setRango] = useSesion<string>('progreso.rango', '3m')
  const [eligiendo, setEligiendo] = useState(false)
  const cerrar = useCallback(() => setEligiendo(false), [])
  const toast = useToast()

  // Ejercicios que has hecho, del más reciente al más antiguo.
  const hechos = useMemo(() => {
    const l: string[] = []
    for (const h of historial ?? []) for (const x of h.ejercicios) if (!l.includes(x.ejercicioId) && mapa?.has(x.ejercicioId)) l.push(x.ejercicioId)
    return l
  }, [historial, mapa])
  const lista = useMemo(() => (historial && mapa ? avisos(historial, mapa) : []), [historial, mapa])

  if (!historial || !mapa) return <main className="screen" />

  if (!hechos.length)
    return (
      <main className="screen">
        <div className="screen-head">
          <h1>Progreso</h1>
        </div>
        <Empty icon="trend" title="Todavía no hay datos">
          Cuando termines tus primeros entrenamientos, aquí verás tus gráficos, tus récords personales y avisos sobre cómo vas.{' '}
          <Link to="/empezar">Empezar ahora</Link>
        </Empty>
      </main>
    )

  const id = elegido && hechos.includes(elegido) ? elegido : hechos[0]
  const ej = mapa.get(id)!
  const metricas = METRICAS[ej.tipo]
  const met = metricas[Math.min(iMetrica, metricas.length - 1)]
  const sesiones = sesionesDe(id, historial)
  const todos = sesiones.map((s) => ({ t: s.t, v: met.valor(s.series) })).filter((p): p is { t: number; v: number } => p.v !== null && p.v > 0)

  const r = RANGOS.find((x) => x.clave === rango) ?? RANGOS[0]
  const hasta = Date.now()
  const desdeRango = r.meses ? new Date(new Date().setMonth(new Date().getMonth() - r.meses)).getTime() : (todos[0]?.t ?? hasta)
  const puntos = todos.filter((p) => p.t >= desdeRango)
  const desde = Math.min(desdeRango, puntos[0]?.t ?? desdeRango)
  const ultimo = todos[todos.length - 1]

  // Cambio en el periodo: del primer al último punto.
  let cambio: { texto: string; mejora: boolean | null } | null = null
  if (puntos.length >= 2) {
    const dif = puntos[puntos.length - 1].v - puntos[0].v
    const periodo = r.meses ? `en ${r.nombre}` : `desde el ${diaYMes(new Date(puntos[0].t))}`
    if (Math.abs(dif) < 1e-9) cambio = { texto: `Sin cambios ${periodo}`, mejora: null }
    else {
      const mejora = met.menorEsMejor ? dif < 0 : dif > 0
      cambio = { texto: `${dif > 0 ? '+' : '−'}${met.texto(Math.abs(dif))} ${periodo}`, mejora }
    }
  }

  const records = recordsDe(ej.tipo, sesiones)
  const tUltima = sesiones[sesiones.length - 1]?.t

  return (
    <main className="screen progreso">
      <div className="screen-head">
        <h1>Progreso</h1>
      </div>

      <div className="progreso-cols">
        <div className="progreso-col">
          <button type="button" className="elegir-ej" onClick={() => setEligiendo(true)} aria-label={`Ejercicio: ${ej.nombre}. Cambiar`}>
            <span>{ej.nombre}</span>
            <Icon name="down" size={18} />
          </button>

          {metricas.length > 1 && (
            <div className="seg-group" role="group" aria-label="Qué mostrar">
              {metricas.map((m, i) => (
                <button key={m.clave} type="button" className="seg" aria-pressed={m === met} onClick={() => setIMetrica(i)}>
                  {m.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="grafico-caja">
            <div className="grafico-cab">
              {ultimo ? (
                <div className="grafico-valor">
                  <span className="l">
                    {met.nombre} · {haceCuanto(ultimo.t)}
                  </span>
                  <span className="v num">{met.texto(ultimo.v)}</span>
                </div>
              ) : (
                <span className="l">{met.nombre}</span>
              )}
              {cambio && (
                <span className="cambio num" data-mejora={cambio.mejora === null ? 'igual' : cambio.mejora}>
                  {cambio.mejora !== null && (
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d={(met.menorEsMejor ? !cambio.mejora : cambio.mejora) ? 'M12 19V5M6 11l6-6 6 6' : 'M12 5v14M6 13l6 6 6-6'}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {cambio.texto}
                </span>
              )}
            </div>

            {puntos.length > 0 ? (
              <GraficoLinea
                puntos={puntos}
                desde={desde}
                hasta={hasta}
                texto={met.texto}
                eje={met.eje}
                esTiempo={met.esTiempo}
                descripcion={`${met.nombre} en ${ej.nombre.toLowerCase()}, ${r.meses ? `últimos ${r.nombre}` : 'todo el historial'}: ${puntos.length} ${puntos.length === 1 ? 'sesión' : 'sesiones'}, la última ${met.texto(puntos[puntos.length - 1].v)}.`}
              />
            ) : (
              <p className="grafico-vacio">Sin datos en este periodo. Prueba con un periodo más largo.</p>
            )}
            {puntos.length === 1 && <p className="grafico-nota">Haz este ejercicio un par de veces más para ver la curva.</p>}

            <div className="chips grafico-rangos" role="group" aria-label="Periodo">
              {RANGOS.map((x) => (
                <button key={x.clave} type="button" className="chip" aria-pressed={x.clave === r.clave} onClick={() => setRango(x.clave)}>
                  {x.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="records">
            <span className="sec">Récords personales</span>
            {records.map((x) => {
              const reciente = x.t !== undefined && x.t === tUltima
              return (
                <div key={x.nombre} className="record-fila num">
                  <span>{x.nombre}</span>
                  <span className={reciente ? 'oro' : undefined}>
                    {x.texto}
                    {reciente && ` · ${haceCuanto(x.t!)}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="progreso-col">
          <span className="sec">Avisos</span>
          {lista.length ? (
            <div className="avisos">
              {lista.map((a) => {
                const contenido = (
                  <>
                    <IconoAviso tipo={a.tipo} />
                    <span className="aviso-texto">
                      <b>{a.titulo}</b> {a.texto}
                    </span>
                  </>
                )
                return a.ejercicioId ? (
                  <button
                    key={a.titulo}
                    type="button"
                    className="aviso"
                    data-tipo={a.tipo}
                    onClick={() => {
                      setElegido(a.ejercicioId!)
                      setIMetrica(0)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    {contenido}
                  </button>
                ) : (
                  <div key={a.titulo} className="aviso" data-tipo={a.tipo}>
                    {contenido}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="sin-avisos">Sin avisos por ahora. Cuando lleves algunas semanas entrenando, aquí te diré qué va bien y qué conviene ajustar.</p>
          )}
          <CopiarResumen className="btn btn-ghost copiar-resumen" onListo={toast.mostrar} />
          <span className="row-s copiar-nota">Copia un resumen de tus últimas 8 semanas para pegarlo en un chat con Claude y pedirle un análisis más a fondo.</span>
        </div>
      </div>

      {toast.elemento}
      {eligiendo && (
        <SelectorEjercicios
          titulo="Elegir ejercicio"
          unico
          soloIds={hechos}
          onCerrar={cerrar}
          onElegir={(ids) => {
            if (ids[0]) {
              setElegido(ids[0])
              setIMetrica(0)
            }
            setEligiendo(false)
          }}
        />
      )}
    </main>
  )
}

function IconoAviso({ tipo }: { tipo: 'bien' | 'ojo' }) {
  return (
    <svg className="aviso-icono" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {tipo === 'bien' ? (
          <>
            <path d="M4 17l5-5 4 3 7-8" />
            <path d="M15 7h5v5" />
          </>
        ) : (
          <>
            <path d="M12 4l9 16H3z" />
            <path d="M12 10v4M12 17h.01" />
          </>
        )}
      </g>
    </svg>
  )
}
