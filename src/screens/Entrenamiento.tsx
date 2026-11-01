import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMapaEjercicios } from '../db/ejercicios'
import {
  calcularPrevios,
  descartarEnCurso,
  ejercicioEnCurso,
  guardarEnCurso,
  serieVacia,
  useEnCurso,
  useEntrenamientos,
  type Previo,
} from '../db/entrenamientos'
import { NOMBRE_TIPO, OBJETIVO_INICIAL, type Ejercicio, type EjercicioEnCurso, type EntrenamientoEnCurso, type SerieEnCurso } from '../db/tipos'
import {
  CAMPOS,
  TITULO_CAMPO,
  aTexto,
  convertir,
  numeroEntero,
  seriesRecord,
  sugerenciaDeObjetivo,
  textoDuracion,
  textoRecord,
  textoSerie,
  type Campo,
} from '../lib/series'
import { prepararSonido, usePantallaEncendida } from '../lib/aviso'
import { useAjustes, leerAjustes } from '../lib/ajustes'
import { oracionDeInicio, versiculoDeDescanso, versiculoDeRecord } from '../lib/contenido'
import { Cruz } from './FinEntrenamiento'
import { useAhora } from '../lib/useAhora'
import { mmss } from '../lib/tiempo'
import { Dialogo } from '../components/Dialogo'
import { Empty } from '../components/Empty'
import { Hoja } from '../components/Hoja'
import { Icon } from '../components/Icon'
import { Miniatura } from '../components/ImagenEjercicio'
import { SelectorEjercicios } from '../components/SelectorEjercicios'

type Cambio = (e: EntrenamientoEnCurso) => EntrenamientoEnCurso

const ESTRELLA = 'M24 9l3.6 7.4 8.2 1.2-5.9 5.7 1.4 8.1L24 27.6l-7.3 3.8 1.4-8.1-5.9-5.7 8.2-1.2z'

export function Entrenamiento() {
  const guardado = useEnCurso()
  const mapa = useMapaEjercicios()
  const historial = useEntrenamientos()
  const ajustes = useAjustes()
  const navigate = useNavigate()
  const minimizar = () => navigate('/')

  // Se trabaja sobre una copia local y se guarda en la base de datos un momento después.
  const [e, setE] = useState<EntrenamientoEnCurso | null>(null)
  const ultimo = useRef<EntrenamientoEnCurso | null>(null)
  const [cerrados, setCerrados] = useState<string[]>([])
  const [menuEj, setMenuEj] = useState<string | null>(null)
  const [menuSerie, setMenuSerie] = useState<{ ej: string; serie: string } | null>(null)
  const [eligiendo, setEligiendo] = useState<null | 'agregar' | string>(null)
  const [faltan, setFaltan] = useState<string[]>([])
  const [preguntar, setPreguntar] = useState<null | 'terminar' | 'vacio' | 'descartar'>(null)
  const [rezando, setRezando] = useState(false)

  const desdeDb = useRef<EntrenamientoEnCurso | null>(null)
  useEffect(() => {
    if (guardado && (!e || e.id !== guardado.id)) {
      desdeDb.current = guardado
      setE(guardado)
    }
    if (guardado === null && e) setE(null)
  }, [guardado, e])

  // Guardar 0,4 s después del último cambio, y al salir o al esconder la app.
  useEffect(() => {
    if (!e || e === desdeDb.current) return
    ultimo.current = e
    const t = window.setTimeout(() => {
      void guardarEnCurso(e)
      ultimo.current = null
    }, 400)
    return () => window.clearTimeout(t)
  }, [e])
  useEffect(() => {
    const ya = () => {
      if (ultimo.current) void guardarEnCurso(ultimo.current)
      ultimo.current = null
    }
    const oculto = () => document.visibilityState === 'hidden' && ya()
    window.addEventListener('pagehide', ya)
    document.addEventListener('visibilitychange', oculto)
    return () => {
      ya()
      window.removeEventListener('pagehide', ya)
      document.removeEventListener('visibilitychange', oculto)
    }
  }, [])

  usePantallaEncendida(ajustes.pantallaEncendida && !!e)

  const tipoDe = useCallback((id: string) => mapa?.get(id)?.tipo, [mapa])
  const previos = useMemo(() => (historial && mapa ? calcularPrevios(historial, tipoDe) : new Map<string, Previo>()), [historial, mapa, tipoDe])

  const cambiar = useCallback((f: Cambio) => setE((x) => (x ? f(x) : x)), [])
  const cambiarEj = (uid: string, f: (x: EjercicioEnCurso) => EjercicioEnCurso) =>
    cambiar((x) => ({ ...x, ejercicios: x.ejercicios.map((j) => (j.uid === uid ? f(j) : j)) }))
  const cambiarSerie = (ej: string, s: string, p: Partial<SerieEnCurso>) =>
    cambiarEj(ej, (j) => ({ ...j, series: j.series.map((x) => (x.uid === s ? { ...x, ...p } : x)) }))

  if (guardado === undefined || !mapa) return <main className="screen" />
  if (!e)
    return (
      <main className="screen">
        <Empty icon="play" title="No hay un entrenamiento en curso">
          <Link to="/empezar">Empieza uno</Link> desde una rutina o en blanco.
        </Empty>
      </main>
    )

  /**
   * Lo que se propone en cada serie: lo de la vez anterior; si no hay, lo de la serie de arriba;
   * si tampoco, el objetivo de la rutina.
   */
  function sugerencias(j: EjercicioEnCurso, ej: Ejercicio): Partial<Record<Campo, string>>[] {
    const ult = previos.get(j.ejercicioId)?.ultima
    const obj = sugerenciaDeObjetivo(j.objetivo, ej.tipo)
    const out: Partial<Record<Campo, string>>[] = []
    j.series.forEach((_, i) => {
      const ant = ult?.[i] ? aTexto(ult[i]) : undefined
      const arriba = i > 0 ? j.series[i - 1] : undefined
      const r: Partial<Record<Campo, string>> = {}
      for (const c of CAMPOS[ej.tipo]) r[c] = ant?.[c] || arriba?.[c].trim() || out[i - 1]?.[c] || obj[c] || ''
      out.push(r)
    })
    return out
  }

  function marcar(j: EjercicioEnCurso, i: number, ej: Ejercicio) {
    const s = j.series[i]
    if (s.hecha) return cambiarSerie(j.uid, s.uid, { hecha: false })
    const sug = sugerencias(j, ej)[i]
    const lleno = { ...s }
    for (const c of CAMPOS[ej.tipo]) if (!lleno[c].trim() && sug[c]) lleno[c] = sug[c]!
    if (!convertir(lleno, ej.tipo)) {
      // Falta un dato: se marca la casilla y se lleva el cursor ahí.
      const c = CAMPOS[ej.tipo].find((c) => !lleno[c].trim() && !(c === 'km' && ej.tipo === 'cardio')) ?? CAMPOS[ej.tipo][0]
      setFaltan([s.uid])
      document.getElementById(`${s.uid}-${c}`)?.focus()
      return
    }
    prepararSonido()
    setFaltan([])
    cambiar((x) => ({
      ...x,
      ejercicios: x.ejercicios.map((y) =>
        y.uid === j.uid ? { ...y, series: y.series.map((z) => (z.uid === s.uid ? { ...lleno, hecha: true } : z)) } : y,
      ),
      descanso: j.descanso > 0 ? { hasta: Date.now() + j.descanso * 1000, total: j.descanso } : x.descanso,
    }))
  }

  function agregar(ids: string[]) {
    const nuevos = ids.map((id) => mapa!.get(id)).filter((x): x is Ejercicio => !!x).map((ej) => ejercicioEnCurso(ej))
    cambiar((x) => ({ ...x, ejercicios: [...x.ejercicios, ...nuevos] }))
    setEligiendo(null)
    if (nuevos.length) window.setTimeout(() => document.getElementById(`ej-${nuevos[0].uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function reemplazar(uid: string, id: string) {
    const ej = mapa!.get(id)
    if (!ej) return
    cambiarEj(uid, (j) => {
      const antes = mapa!.get(j.ejercicioId)
      const mismoTipo = antes?.tipo === ej.tipo
      return {
        ...j,
        ejercicioId: id,
        objetivo: mismoTipo ? j.objetivo : OBJETIVO_INICIAL[ej.tipo],
        series: j.series.map(() => serieVacia()),
      }
    })
    setEligiendo(null)
  }

  function mover(uid: string, d: -1 | 1) {
    cambiar((x) => {
      const i = x.ejercicios.findIndex((j) => j.uid === uid)
      const k = i + d
      if (i < 0 || k < 0 || k >= x.ejercicios.length) return x
      const l = [...x.ejercicios]
      ;[l[i], l[k]] = [l[k], l[i]]
      return { ...x, ejercicios: l }
    })
  }

  // Totales para la cabecera.
  let hechas = 0
  let total = 0
  let vol = 0
  for (const j of e.ejercicios) {
    const tipo = mapa.get(j.ejercicioId)?.tipo ?? 'pesas'
    for (const s of j.series) {
      total++
      if (!s.hecha) continue
      hechas++
      const h = convertir(s, tipo)
      if (h && tipo === 'pesas') vol += (h.kg ?? 0) * (h.reps ?? 0)
    }
  }

  async function terminar() {
    setPreguntar(null)
    const fin = { ...e!, fin: Date.now() }
    ultimo.current = null
    setE(fin)
    await guardarEnCurso(fin)
    navigate('/entrenamiento/fin')
  }

  function pedirTerminar() {
    if (hechas === 0) setPreguntar('vacio')
    else if (hechas < total) setPreguntar('terminar')
    else void terminar()
  }

  async function descartar() {
    ultimo.current = null
    await descartarEnCurso()
    navigate('/', { replace: true })
  }

  const ejMenu = menuEj ? e.ejercicios.find((j) => j.uid === menuEj) : undefined
  const ejMenuInfo = ejMenu ? mapa.get(ejMenu.ejercicioId) : undefined
  const idxMenu = ejMenu ? e.ejercicios.indexOf(ejMenu) : -1

  return (
    <main className="screen entreno">
      <header className="entreno-cab">
        <div className="entreno-fila">
          <button type="button" className="icon-btn" aria-label="Minimizar (sigue corriendo)" onClick={minimizar}>
            <Icon name="down" size={22} />
          </button>
          <div className="entreno-titulo">
            <span className="entreno-k">Entrenando</span>
            <h1>{e.nombre}</h1>
          </div>
          <button type="button" className="btn btn-danger" onClick={pedirTerminar}>
            Terminar
          </button>
        </div>
        <div className="entreno-stats num">
          <Reloj desde={e.inicio} />
          <div className="stat">
            <span className="v">{numeroEntero(vol)} kg</span>
            <span className="l">volumen</span>
          </div>
          <div className="stat">
            <span className="v">
              {hechas} / {total}
            </span>
            <span className="l">series</span>
          </div>
        </div>
      </header>

      {ajustes.feOracionInicio && hechas === 0 && (
        <button type="button" className="btn btn-ghost oracion-inicio" onClick={() => setRezando(true)}>
          <Cruz />
          {oracionDeInicio(e.id).titulo}
        </button>
      )}

      <div className="bloques">
        {e.ejercicios.length === 0 && (
          <Empty icon="dumbbell" title="Entrenamiento en blanco">
            Agrega los ejercicios a medida que los haces.
          </Empty>
        )}

        {e.ejercicios.map((j) => {
          const ej = mapa.get(j.ejercicioId)
          if (!ej) return null
          const cerrado = cerrados.includes(j.uid)
          const previo = previos.get(j.ejercicioId)
          const campos = CAMPOS[ej.tipo]
          const records = seriesRecord(j, ej.tipo, previo?.mejor)
          const ultimoRecord = records.length ? records[records.length - 1] : -1
          const listas = j.series.filter((s) => s.hecha).length
          const musculos = [ej.musculoPrincipal, ...ej.musculosSecundarios].join(' · ')
          const sugs = sugerencias(j, ej)
          const alternar = () => setCerrados(cerrado ? cerrados.filter((x) => x !== j.uid) : [...cerrados, j.uid])

          return (
            <section key={j.uid} id={`ej-${j.uid}`} className="bloque" data-cerrado={cerrado}>
              <div className="bloque-cab">
                <Miniatura ej={ej} size={44} />
                <button type="button" className="bloque-texto" onClick={alternar} aria-expanded={!cerrado}>
                  <span className="bloque-nombre">{ej.nombre}</span>
                  <span className="bloque-meta num">
                    {cerrado
                      ? [
                          `${listas} de ${j.series.length} ${j.series.length === 1 ? 'serie' : 'series'}`,
                          previo ? `anterior ${previo.ultima.map((s) => textoSerie(s, ej.tipo)).join(', ')}` : NOMBRE_TIPO[ej.tipo],
                        ].join(' · ')
                      : [musculos, j.descanso > 0 ? `descanso ${mmss(j.descanso)}` : ''].filter(Boolean).join(' · ')}
                  </span>
                </button>
                {cerrado ? (
                  <button type="button" className="icon-btn" aria-label={`Abrir ${ej.nombre}`} onClick={alternar}>
                    <Icon name="down" size={18} />
                  </button>
                ) : (
                  <button type="button" className="icon-btn" aria-label={`Opciones de ${ej.nombre}`} onClick={() => setMenuEj(j.uid)}>
                    <Puntos />
                  </button>
                )}
              </div>

              {!cerrado && (
                <>
                  {j.nota && <p className="bloque-nota">{j.nota}</p>}
                  <div className={`series series-${campos.length}`}>
                    <div className="serie serie-titulos" aria-hidden="true">
                      <span>Serie</span>
                      <span className="s-ant">Anterior</span>
                      {campos.map((c) => (
                        <span key={c} className="s-centro">
                          {TITULO_CAMPO[c]}
                        </span>
                      ))}
                      <span className="s-centro">✓</span>
                    </div>
                    {j.series.map((s, i) => {
                      const sug = sugs[i]
                      const ant = previo?.ultima[i]
                      return (
                        <div key={s.uid} className="serie" data-hecha={s.hecha}>
                          <button
                            type="button"
                            className="s-num num"
                            aria-label={`Opciones de la serie ${i + 1}`}
                            onClick={() => setMenuSerie({ ej: j.uid, serie: s.uid })}
                          >
                            {i + 1}
                          </button>
                          <button
                            type="button"
                            className="s-ant num"
                            disabled={!ant || s.hecha}
                            aria-label={ant ? `Copiar lo de la vez anterior: ${textoSerie(ant, ej.tipo)}` : 'Sin vez anterior'}
                            onClick={() => ant && cambiarSerie(j.uid, s.uid, aTexto(ant))}
                          >
                            {ant ? textoSerie(ant, ej.tipo) : '—'}
                          </button>
                          {campos.map((c) => (
                            <input
                              key={c}
                              id={`${s.uid}-${c}`}
                              className="s-input num"
                              inputMode={c === 'reps' ? 'numeric' : 'decimal'}
                              enterKeyHint="done"
                              autoComplete="off"
                              aria-label={`${TITULO_CAMPO[c]} serie ${i + 1}`}
                              aria-invalid={faltan.includes(s.uid) && !s[c].trim() && !sug[c] && !(c === 'km' && ej.tipo === 'cardio')}
                              value={s[c]}
                              placeholder={sug[c] || (c === 'reps' && j.objetivo.length <= 6 ? j.objetivo : c === 'tiempo' ? 'm:ss' : c === 'km' ? 'opc.' : '')}
                              readOnly={s.hecha}
                              onFocus={(ev) => ev.target.select()}
                              onChange={(ev) => {
                                setFaltan([])
                                cambiarSerie(j.uid, s.uid, { [c]: ev.target.value })
                              }}
                              onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()}
                            />
                          ))}
                          <button
                            type="button"
                            className="s-check"
                            aria-pressed={s.hecha}
                            aria-label={s.hecha ? `Serie ${i + 1} completada (tocar para desmarcar)` : `Completar serie ${i + 1}`}
                            onClick={() => marcar(j, i, ej)}
                          >
                            <span>{s.hecha && <Icon name="check" size={16} />}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {ultimoRecord >= 0 && (
                    <div className="record-linea">
                      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                        <path d={ESTRELLA} fill="currentColor" />
                      </svg>
                      <span>
                        Serie {ultimoRecord + 1}: nuevo récord de {textoRecord(convertir(j.series[ultimoRecord], ej.tipo)!, ej.tipo)}
                      </span>
                    </div>
                  )}
                  {ultimoRecord >= 0 && ajustes.feRecord && <FraseRecord clave={j.series[ultimoRecord].uid} />}

                  <button type="button" className="agregar-serie" onClick={() => cambiarEj(j.uid, (x) => ({ ...x, series: [...x.series, serieVacia()] }))}>
                    + Agregar serie
                  </button>
                </>
              )}
            </section>
          )
        })}

        <button type="button" className="agregar-ej" onClick={() => setEligiendo('agregar')}>
          <Icon name="plus" size={18} />
          Agregar ejercicio
        </button>

        <button type="button" className="btn-texto peligro centro" onClick={() => setPreguntar('descartar')}>
          Descartar entrenamiento
        </button>
      </div>

      {e.descanso && <Descanso d={e.descanso} cambiar={cambiar} />}

      {/* Opciones de un ejercicio */}
      <Hoja abierto={!!ejMenu && !!ejMenuInfo} titulo={ejMenuInfo?.nombre ?? ''} onCerrar={() => setMenuEj(null)}>
        {ejMenu && ejMenuInfo && (
          <div className="hoja-opciones">
            <div className="hoja-fila">
              <span>Descanso</span>
              <div className="stepper">
                <button
                  type="button"
                  aria-label="15 segundos menos"
                  disabled={ejMenu.descanso <= 0}
                  onClick={() => cambiarEj(ejMenu.uid, (x) => ({ ...x, descanso: Math.max(0, x.descanso - 15) }))}
                >
                  −
                </button>
                <span className="num">{ejMenu.descanso > 0 ? mmss(ejMenu.descanso) : 'Sin'}</span>
                <button
                  type="button"
                  aria-label="15 segundos más"
                  onClick={() => cambiarEj(ejMenu.uid, (x) => ({ ...x, descanso: Math.min(3600, x.descanso + 15) }))}
                >
                  +
                </button>
              </div>
            </div>
            <label className="campo-mini">
              <span>Nota</span>
              <input
                className="input-celda izq"
                value={ejMenu.nota}
                placeholder="Ej.: agarre medio, asiento en 4"
                onChange={(ev) => cambiarEj(ejMenu.uid, (x) => ({ ...x, nota: ev.target.value }))}
              />
            </label>
            <div className="hoja-botones">
              <button type="button" className="hoja-op" disabled={idxMenu <= 0} onClick={() => mover(ejMenu.uid, -1)}>
                <Icon name="up" size={18} /> Mover arriba
              </button>
              <button type="button" className="hoja-op" disabled={idxMenu >= e.ejercicios.length - 1} onClick={() => mover(ejMenu.uid, 1)}>
                <Icon name="down" size={18} /> Mover abajo
              </button>
              <button
                type="button"
                className="hoja-op"
                onClick={() => {
                  setMenuEj(null)
                  setEligiendo(ejMenu.uid)
                }}
              >
                <Icon name="copy" size={18} /> Reemplazar ejercicio
              </button>
              <Link to={`/ejercicios/${ejMenuInfo.id}`} className="hoja-op">
                <Icon name="body" size={18} /> Ver cómo se hace
              </Link>
              <button
                type="button"
                className="hoja-op peligro"
                onClick={() => {
                  setMenuEj(null)
                  cambiar((x) => ({ ...x, ejercicios: x.ejercicios.filter((j) => j.uid !== ejMenu.uid) }))
                }}
              >
                <Icon name="trash" size={18} /> Quitar ejercicio
              </button>
            </div>
          </div>
        )}
      </Hoja>

      {/* Opciones de una serie */}
      <Hoja abierto={!!menuSerie} titulo="Serie" onCerrar={() => setMenuSerie(null)}>
        {menuSerie && (
          <div className="hoja-botones">
            <button
              type="button"
              className="hoja-op peligro"
              onClick={() => {
                cambiarEj(menuSerie.ej, (x) => ({ ...x, series: x.series.filter((s) => s.uid !== menuSerie.serie) }))
                setMenuSerie(null)
              }}
            >
              <Icon name="trash" size={18} /> Eliminar serie
            </button>
          </div>
        )}
      </Hoja>

      {eligiendo && (
        <SelectorEjercicios
          titulo={eligiendo === 'agregar' ? 'Agregar ejercicios' : 'Reemplazar ejercicio'}
          unico={eligiendo !== 'agregar'}
          onCerrar={() => setEligiendo(null)}
          onElegir={(ids) => (eligiendo === 'agregar' ? agregar(ids) : ids[0] && reemplazar(eligiendo, ids[0]))}
        />
      )}

      <Hoja abierto={rezando} titulo={oracionDeInicio(e.id).titulo} onCerrar={() => setRezando(false)}>
        <p className="oracion-texto">{oracionDeInicio(e.id).texto}</p>
      </Hoja>

      <Dialogo
        abierto={preguntar === 'terminar'}
        titulo="¿Terminar el entrenamiento?"
        confirmar="Terminar"
        cancelar="Seguir entrenando"
        onConfirmar={terminar}
        onCerrar={() => setPreguntar(null)}
      >
        {total - hechas === 1 ? 'Te queda 1 serie sin marcar' : `Te quedan ${total - hechas} series sin marcar`}. Las series sin marcar no se guardan.
      </Dialogo>
      <Dialogo
        abierto={preguntar === 'vacio'}
        titulo="Aún no marcas ninguna serie"
        confirmar="Descartar entrenamiento"
        cancelar="Seguir entrenando"
        peligro
        onConfirmar={descartar}
        onCerrar={() => setPreguntar(null)}
      >
        Marca con ✓ cada serie que hagas. Si terminas sin marcar ninguna, el entrenamiento no se guarda.
      </Dialogo>
      <Dialogo
        abierto={preguntar === 'descartar'}
        titulo="¿Descartar el entrenamiento?"
        confirmar="Descartar"
        peligro
        onConfirmar={descartar}
        onCerrar={() => setPreguntar(null)}
      >
        Se borra todo lo que anotaste hoy. No se puede deshacer.
      </Dialogo>
    </main>
  )
}

function Reloj({ desde }: { desde: number }) {
  const ahora = useAhora(1000)
  return (
    <div className="stat">
      <span className="v">{textoDuracion((ahora - desde) / 1000)}</span>
      <span className="l">duración</span>
    </div>
  )
}

function Puntos() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="5" cy="12" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="19" cy="12" r="1.7" />
      </g>
    </svg>
  )
}

/** Barra del descanso, abajo. Cuenta hacia atrás y avisa al llegar a cero. */
function Descanso({ d, cambiar }: { d: { hasta: number; total: number }; cambiar: (f: Cambio) => void }) {
  const ahora = useAhora(250)
  const quedan = Math.max(0, Math.ceil((d.hasta - ahora) / 1000))
  const avisado = useRef<number | null>(null)

  // El aviso (sonido y vibración) lo da VigiaDescanso, que funciona en cualquier pantalla.
  useEffect(() => {
    if (quedan > 0) return
    if (avisado.current === d.hasta) return
    avisado.current = d.hasta
    const t = window.setTimeout(() => cambiar((x) => (x.descanso?.hasta === d.hasta ? { ...x, descanso: null } : x)), 2500)
    return () => window.clearTimeout(t)
  }, [quedan, d.hasta, cambiar])

  const sumar = (s: number) =>
    cambiar((x) => {
      if (!x.descanso) return x
      const hasta = Math.max(Date.now(), x.descanso.hasta + s * 1000)
      return { ...x, descanso: { hasta, total: Math.max(x.descanso.total + s, 1) } }
    })

  const listo = quedan === 0
  return (
    <div className="descanso" role="timer" aria-live={listo ? 'assertive' : 'off'} data-listo={listo}>
      <div className="descanso-fila">
        <div className="descanso-texto">
          <span className="descanso-k">{listo ? 'Descanso terminado' : 'Descanso'}</span>
          <span className="descanso-t num">{listo ? '¡A la siguiente!' : mmss(quedan)}</span>
        </div>
        {!listo && (
          <>
            <button type="button" className="pildora" onClick={() => sumar(-15)}>
              −15 s
            </button>
            <button type="button" className="pildora" onClick={() => sumar(15)}>
              +15 s
            </button>
          </>
        )}
        <button type="button" className="pildora pildora-primaria" onClick={() => cambiar((x) => ({ ...x, descanso: null }))}>
          {listo ? 'Cerrar' : 'Saltar'}
        </button>
      </div>
      {leerAjustes().feDescanso && !listo && <VersoDescanso clave={String(d.hasta - d.total * 1000)} />}
      <div className="descanso-barra">
        <div style={{ width: `${Math.min(100, (quedan / d.total) * 100)}%` }} />
      </div>
    </div>
  )
}

function FraseRecord({ clave }: { clave: string }) {
  const v = versiculoDeRecord(clave)
  return (
    <p className="frase-record">
      “{v.texto}” <span>{v.ref}</span>
    </p>
  )
}

/** Un versículo breve durante el descanso (apagado por defecto). Se elige al empezar el descanso. */
function VersoDescanso({ clave }: { clave: string }) {
  const v = versiculoDeDescanso(clave)
  return (
    <p className="verso-descanso">
      “{v.texto}” <span>{v.ref}</span>
    </p>
  )
}
