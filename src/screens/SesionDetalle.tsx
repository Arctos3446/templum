import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { eliminarEntrenamiento, useEntrenamiento, useEntrenamientos } from '../db/entrenamientos'
import { useMapaEjercicios } from '../db/ejercicios'
import { fechaLarga, hora } from '../lib/fechas'
import { recordsPorEntrenamiento, seriesDe, textoMinutos, volumenDe } from '../lib/historial'
import { numeroEntero, textoSerieLargo } from '../lib/series'
import { Dialogo } from '../components/Dialogo'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'
import { Miniatura } from '../components/ImagenEjercicio'
import { Volver } from '../components/Volver'

const ESTRELLA = 'M24 9l3.6 7.4 8.2 1.2-5.9 5.7 1.4 8.1L24 27.6l-7.3 3.8 1.4-8.1-5.9-5.7 8.2-1.2z'

/** Un entrenamiento del historial, con todas sus series. */
export function SesionDetalle() {
  const { id } = useParams()
  const h = useEntrenamiento(id)
  const historial = useEntrenamientos()
  const mapa = useMapaEjercicios()
  const navigate = useNavigate()
  const [borrar, setBorrar] = useState(false)

  const tipoDe = useCallback((x: string) => mapa?.get(x)?.tipo, [mapa])
  const records = useMemo(() => (historial && mapa ? recordsPorEntrenamiento(historial, tipoDe) : null), [historial, mapa, tipoDe])

  if (h === null)
    return (
      <main className="screen">
        <Volver a="/historial" texto="Historial" />
        <Empty icon="cal" title="Este entrenamiento no existe">
          Puede que lo hayas eliminado.
        </Empty>
      </main>
    )
  if (!h || !mapa || !records) return <main className="screen" />

  const rec = records.get(h.id)
  const vol = volumenDe(h, tipoDe)
  const n = seriesDe(h)

  async function confirmarBorrar() {
    await eliminarEntrenamiento(h!.id)
    navigate('/historial', { replace: true })
  }

  return (
    <main className="screen sesion-detalle">
      <Volver a="/historial" texto="Historial" />
      <div className="screen-head">
        <div className="sd-titulo">
          <h1>{h.nombre}</h1>
          <span className="sd-sub num">
            {fechaLarga(new Date(h.inicio))} · {hora(new Date(h.inicio))} a {hora(new Date(h.fin))}
          </span>
        </div>
        <Link to={`/historial/${h.id}/editar`} className="btn btn-ghost">
          <Icon name="edit" />
          Editar
        </Link>
      </div>

      <div className="fin-stats num">
        <div className="fin-stat">
          <span className="v">{textoMinutos(h.fin - h.inicio)}</span>
          <span className="l">duración</span>
        </div>
        <div className="fin-stat">
          <span className="v">{numeroEntero(vol)} kg</span>
          <span className="l">volumen</span>
        </div>
        <div className="fin-stat">
          <span className="v">{n}</span>
          <span className="l">{n === 1 ? 'serie' : 'series'}</span>
        </div>
        <div className="fin-stat">
          <span className="v oro">{rec?.ejercicios ?? 0}</span>
          <span className="l">{rec?.ejercicios === 1 ? 'récord' : 'récords'}</span>
        </div>
      </div>

      <div className="sd-ejercicios">
        {h.ejercicios.map((x) => {
          const ej = mapa.get(x.ejercicioId)
          const tipo = ej?.tipo ?? 'pesas'
          return (
            <section key={x.uid} className="sd-ej">
              <div className="bloque-cab">
                {ej ? <Miniatura ej={ej} size={44} /> : <span className="mini" style={{ width: 44, height: 44 }} />}
                <span className="bloque-texto">
                  {ej ? (
                    <Link to={`/ejercicios/${ej.id}`} className="bloque-nombre sd-enlace">
                      {ej.nombre}
                    </Link>
                  ) : (
                    <span className="bloque-nombre">Ejercicio eliminado</span>
                  )}
                  {ej && <span className="bloque-meta">{[ej.musculoPrincipal, ...ej.musculosSecundarios].join(' · ')}</span>}
                </span>
              </div>
              {x.nota && <p className="bloque-nota">{x.nota}</p>}
              <ol className="sd-series">
                {x.series.map((s, i) => {
                  const esRecord = rec?.series.has(`${x.uid}:${i}`)
                  return (
                    <li key={i} data-record={esRecord}>
                      <span className="sd-n num">{i + 1}</span>
                      <span className="num">{textoSerieLargo(s, tipo)}</span>
                      {esRecord && (
                        <span className="sd-pr">
                          <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
                            <path d={ESTRELLA} fill="currentColor" />
                          </svg>
                          Récord
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>

      <button type="button" className="btn-texto peligro centro" onClick={() => setBorrar(true)}>
        Eliminar entrenamiento
      </button>

      <Dialogo
        abierto={borrar}
        titulo="¿Eliminar este entrenamiento?"
        confirmar="Eliminar"
        peligro
        onConfirmar={confirmarBorrar}
        onCerrar={() => setBorrar(false)}
      >
        Se borra del historial y deja de contar en tu progreso y tus récords. No se puede deshacer.
      </Dialogo>
    </main>
  )
}
