import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { actualizarEntrenamiento, useEntrenamiento } from '../db/entrenamientos'
import { useMapaEjercicios } from '../db/ejercicios'
import { nuevoId } from '../db/db'
import type { Ejercicio, EjercicioHecho, Entrenamiento, SerieHecha } from '../db/tipos'
import { aInputFecha, aInputHora } from '../lib/fechas'
import { CAMPOS, TITULO_CAMPO, aTexto, convertir, type Campo } from '../lib/series'
import { BarraEditor } from '../components/BarraEditor'
import { useAvisoSalida } from '../components/AvisoSalida'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'
import { Miniatura } from '../components/ImagenEjercicio'
import { SelectorEjercicios } from '../components/SelectorEjercicios'
import { useVolver } from '../components/Volver'

type SerieTxt = { uid: string } & Record<Campo, string>
type EjTxt = { uid: string; ejercicioId: string; nota: string; series: SerieTxt[] }
type Borrador = { nombre: string; fecha: string; hora: string; minutos: string; ejercicios: EjTxt[] }

const serieTxt = (s?: SerieHecha): SerieTxt => ({ uid: nuevoId(), ...(s ? aTexto(s) : { kg: '', reps: '', tiempo: '', km: '' }) })

function desde(h: Entrenamiento): Borrador {
  const d = new Date(h.inicio)
  return {
    nombre: h.nombre,
    fecha: aInputFecha(d),
    hora: aInputHora(d),
    minutos: String(Math.max(1, Math.round((h.fin - h.inicio) / 60000))),
    ejercicios: h.ejercicios.map((x) => ({ uid: x.uid, ejercicioId: x.ejercicioId, nota: x.nota, series: x.series.map(serieTxt) })),
  }
}

/** Corregir un entrenamiento ya guardado: nombre, fecha, duración, series y ejercicios. */
export function SesionEditor() {
  const { id } = useParams()
  const h = useEntrenamiento(id)
  const mapa = useMapaEjercicios()
  const volver = useVolver(`/historial/${id}`)

  const [b, setB] = useState<Borrador | null>(null)
  const [original, setOriginal] = useState<Borrador | null>(null)
  const [malas, setMalas] = useState<string[]>([])
  const [error, setError] = useState('')
  const [eligiendo, setEligiendo] = useState(false)
  const cerrarSelector = useCallback(() => setEligiendo(false), [])

  useEffect(() => {
    if (!h || b) return
    const x = desde(h)
    setB(x)
    setOriginal(x)
  }, [h, b])

  const hayCambios = !!b && JSON.stringify(b) !== JSON.stringify(original)
  const aviso = useAvisoSalida(hayCambios, volver)

  if (h === null)
    return (
      <main className="screen">
        <Empty icon="cal" title="Este entrenamiento no existe">
          Puede que lo hayas eliminado.
        </Empty>
      </main>
    )
  if (!h || !b || !mapa) return <main className="screen" />

  const set = (p: Partial<Borrador>) => {
    setB({ ...b, ...p })
    setError('')
  }
  const cambiarEj = (uid: string, f: (x: EjTxt) => EjTxt) => set({ ejercicios: b.ejercicios.map((x) => (x.uid === uid ? f(x) : x)) })

  function agregar(ids: string[]) {
    const nuevos = ids
      .map((i) => mapa!.get(i))
      .filter((x): x is Ejercicio => !!x)
      .map((ej) => ({ uid: nuevoId(), ejercicioId: ej.id, nota: '', series: [serieTxt()] }))
    set({ ejercicios: [...b!.ejercicios, ...nuevos] })
    setEligiendo(false)
  }

  async function guardar() {
    const nombre = b!.nombre.trim() || 'Entrenamiento'
    const inicio = new Date(`${b!.fecha}T${b!.hora || '00:00'}`).getTime()
    const minutos = Number(b!.minutos)
    if (!Number.isFinite(inicio)) return setError('Revisa la fecha y la hora.')
    if (inicio > Date.now()) return setError('La fecha no puede ser en el futuro.')
    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 24 * 60) return setError('La duración va en minutos, entre 1 y 1440.')

    const malasAhora: string[] = []
    const ejercicios: EjercicioHecho[] = []
    for (const x of b!.ejercicios) {
      const tipo = mapa!.get(x.ejercicioId)?.tipo ?? 'pesas'
      const series: SerieHecha[] = []
      for (const s of x.series) {
        const c = convertir(s, tipo)
        if (c) series.push(c)
        else malasAhora.push(s.uid)
      }
      if (series.length) ejercicios.push({ uid: x.uid, ejercicioId: x.ejercicioId, nota: x.nota.trim(), series })
    }
    setMalas(malasAhora)
    if (malasAhora.length) return setError('Hay series con datos incompletos (marcadas en rojo). Complétalas o quítalas.')
    if (!ejercicios.length) return setError('Debe quedar al menos una serie. Si quieres borrarlo entero, usa “Eliminar entrenamiento”.')

    await actualizarEntrenamiento({ ...h!, nombre, inicio, fin: inicio + minutos * 60000, ejercicios })
    aviso.sinAviso(volver)
  }

  return (
    <main className="screen editor sesion-editor">
      <BarraEditor titulo="Editar entrenamiento" onCancelar={aviso.cancelar} onGuardar={guardar} />

      {error && (
        <p className="error-caja" role="alert">
          {error}
        </p>
      )}

      <label className="campo">
        <span className="sec">Nombre</span>
        <input className="input-grande" value={b.nombre} placeholder="Entrenamiento" onChange={(e) => set({ nombre: e.target.value })} />
      </label>

      <div className="se-cuando">
        <label className="campo-mini">
          <span>Fecha</span>
          <input type="date" className="input-celda" value={b.fecha} max={aInputFecha(new Date())} onChange={(e) => set({ fecha: e.target.value })} />
        </label>
        <label className="campo-mini">
          <span>Hora de inicio</span>
          <input type="time" className="input-celda" value={b.hora} onChange={(e) => set({ hora: e.target.value })} />
        </label>
        <label className="campo-mini">
          <span>Duración (min)</span>
          <input
            className="input-celda num"
            inputMode="numeric"
            value={b.minutos}
            onFocus={(e) => e.target.select()}
            onChange={(e) => set({ minutos: e.target.value.replace(/\D/g, '') })}
          />
        </label>
      </div>

      <div className="campo">
        <span className="sec">Ejercicios · {b.ejercicios.length}</span>
        <div className="bloques">
          {b.ejercicios.map((x) => {
            const ej = mapa.get(x.ejercicioId)
            const tipo = ej?.tipo ?? 'pesas'
            const campos = CAMPOS[tipo]
            return (
              <section key={x.uid} className="bloque">
                <div className="bloque-cab">
                  {ej ? <Miniatura ej={ej} size={44} /> : <span className="mini" style={{ width: 44, height: 44 }} />}
                  <span className="bloque-texto">
                    <span className="bloque-nombre">{ej?.nombre ?? 'Ejercicio eliminado'}</span>
                  </span>
                  <button
                    type="button"
                    className="icon-btn peligro"
                    aria-label={`Quitar ${ej?.nombre ?? 'ejercicio'}`}
                    onClick={() => set({ ejercicios: b.ejercicios.filter((y) => y.uid !== x.uid) })}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <div className={`series series-${campos.length}`}>
                  <div className="serie serie-titulos se-serie" aria-hidden="true">
                    <span>Serie</span>
                    {campos.map((c) => (
                      <span key={c} className="s-centro">
                        {TITULO_CAMPO[c]}
                      </span>
                    ))}
                    <span />
                  </div>
                  {x.series.map((s, i) => (
                    <div key={s.uid} className="serie se-serie">
                      <span className="s-num num">{i + 1}</span>
                      {campos.map((c) => (
                        <input
                          key={c}
                          className="s-input num"
                          inputMode={c === 'reps' ? 'numeric' : 'decimal'}
                          aria-label={`${TITULO_CAMPO[c]} serie ${i + 1}`}
                          aria-invalid={malas.includes(s.uid)}
                          value={s[c]}
                          placeholder={c === 'tiempo' ? 'm:ss' : ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            setMalas(malas.filter((m) => m !== s.uid))
                            cambiarEj(x.uid, (y) => ({ ...y, series: y.series.map((z) => (z.uid === s.uid ? { ...z, [c]: e.target.value } : z)) }))
                          }}
                        />
                      ))}
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Quitar serie ${i + 1}`}
                        onClick={() => cambiarEj(x.uid, (y) => ({ ...y, series: y.series.filter((z) => z.uid !== s.uid) }))}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="agregar-serie"
                  onClick={() =>
                    cambiarEj(x.uid, (y) => {
                      const ultima = y.series[y.series.length - 1]
                      return { ...y, series: [...y.series, ultima ? { ...ultima, uid: nuevoId() } : serieTxt()] }
                    })
                  }
                >
                  + Agregar serie
                </button>
              </section>
            )
          })}
        </div>
        <button type="button" className="agregar-ej" onClick={() => setEligiendo(true)}>
          <Icon name="plus" size={18} />
          Agregar ejercicio
        </button>
      </div>

      {eligiendo && <SelectorEjercicios onCerrar={cerrarSelector} onElegir={agregar} />}
      {aviso.dialogo}
    </main>
  )
}
