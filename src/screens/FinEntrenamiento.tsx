import { useCallback, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMapaEjercicios } from '../db/ejercicios'
import { aHistorial, calcularPrevios, cambioLaRutina, guardarEnCurso, guardarEntrenamiento, useEnCurso, useEntrenamientos } from '../db/entrenamientos'
import { useRutina } from '../db/rutinas'
import { convertir, numeroEntero, seriesRecord, textoRecord } from '../lib/series'
import { fechaLarga } from '../lib/fechas'
import { oracionDeCierre, versiculoDeCierre } from '../lib/contenido'
import { ChiRho } from '../components/Logo'
import { Hoja } from '../components/Hoja'

const ESTRELLA = 'M24 9l3.6 7.4 8.2 1.2-5.9 5.7 1.4 8.1L24 27.6l-7.3 3.8 1.4-8.1-5.9-5.7 8.2-1.2z'

/** "58 min" · "1 h 05 min" */
function duracion(ms: number) {
  const min = Math.max(1, Math.round(ms / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
}

export function FinEntrenamiento() {
  const e = useEnCurso()
  const mapa = useMapaEjercicios()
  const historial = useEntrenamientos()
  const rutina = useRutina(e?.rutinaId)
  const navigate = useNavigate()
  const [actualizar, setActualizar] = useState(true)
  const [oracion, setOracion] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const tipoDe = useCallback((id: string) => mapa?.get(id)?.tipo, [mapa])
  const previos = useMemo(() => (historial && mapa ? calcularPrevios(historial, tipoDe) : null), [historial, mapa, tipoDe])

  if (e === null && !guardando) return <Navigate to="/" replace />
  if (!e || !mapa || !previos || rutina === undefined) return <main className="screen" />

  const h = aHistorial(e, tipoDe)
  const series = h.ejercicios.reduce((n, x) => n + x.series.length, 0)
  let vol = 0
  for (const x of h.ejercicios) if (tipoDe(x.ejercicioId) === 'pesas') for (const s of x.series) vol += (s.kg ?? 0) * (s.reps ?? 0)

  // Récords: la mejor serie nueva de cada ejercicio.
  const records: { nombre: string; texto: string }[] = []
  for (const j of e.ejercicios) {
    const ej = mapa.get(j.ejercicioId)
    if (!ej) continue
    const r = seriesRecord(j, ej.tipo, previos.get(j.ejercicioId)?.mejor)
    if (!r.length) continue
    const mejor = convertir(j.series[r[r.length - 1]], ej.tipo)
    if (mejor) records.push({ nombre: ej.nombre, texto: textoRecord(mejor, ej.tipo) })
  }

  const verso = versiculoDeCierre(e.id)
  const rezo = oracionDeCierre(e.id)
  const puedeActualizar = !!rutina && cambioLaRutina(e, rutina)

  async function guardar() {
    setGuardando(true)
    await guardarEntrenamiento(e!, h, puedeActualizar && actualizar)
    navigate('/', { replace: true })
  }

  async function volver() {
    const x = { ...e!, fin: undefined }
    await guardarEnCurso(x)
    navigate('/entrenamiento', { replace: true })
  }

  return (
    <main className="screen fin">
      <div className="fin-cab">
        <span className="fin-logo">
          <ChiRho size={44} />
        </span>
        <h1>Entrenamiento terminado</h1>
        <span className="fin-sub">
          {e.nombre} · {fechaLarga(new Date(e.inicio))}
        </span>
      </div>

      <div className="fin-stats num">
        <div className="fin-stat">
          <span className="v">{duracion((e.fin ?? Date.now()) - e.inicio)}</span>
          <span className="l">duración</span>
        </div>
        <div className="fin-stat">
          <span className="v">{numeroEntero(vol)} kg</span>
          <span className="l">volumen total</span>
        </div>
        <div className="fin-stat">
          <span className="v">{series}</span>
          <span className="l">{series === 1 ? 'serie' : 'series'}</span>
        </div>
        <div className="fin-stat">
          <span className="v oro">{records.length}</span>
          <span className="l">{records.length === 1 ? 'récord nuevo' : 'récords nuevos'}</span>
        </div>
      </div>

      {records.length > 0 && (
        <div className="fin-records">
          <span className="sec">Récords de hoy</span>
          <div className="fin-records-caja">
            {records.map((r) => (
              <div key={r.nombre} className="fin-record">
                <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                  <path d={ESTRELLA} fill="currentColor" />
                </svg>
                <span className="fr-n">{r.nombre}</span>
                <span className="num">{r.texto}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="verse-card fin-verso">
        <q>{verso.texto}</q>
        <span className="r">{verso.ref}</span>
      </div>

      <button type="button" className="btn btn-ghost fin-oracion" onClick={() => setOracion(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v18M7 8h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
        {rezo.titulo}
      </button>

      <div className="fin-acciones">
        <button type="button" className="btn btn-primary btn-block" disabled={guardando} onClick={guardar}>
          Guardar entrenamiento
        </button>
        {puedeActualizar && (
          <label className="fin-check">
            <input type="checkbox" checked={actualizar} onChange={(ev) => setActualizar(ev.target.checked)} />
            Actualizar la rutina “{rutina!.nombre}” con los cambios de hoy
          </label>
        )}
        <button type="button" className="btn-texto centro" onClick={volver}>
          Volver al entrenamiento
        </button>
      </div>

      <Hoja abierto={oracion} titulo={rezo.titulo} onCerrar={() => setOracion(false)}>
        <p className="oracion-texto">{rezo.texto}</p>
      </Hoja>
    </main>
  )
}
