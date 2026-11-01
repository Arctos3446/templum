import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarEjercicioPropio, useEjercicio } from '../db/ejercicios'
import { db } from '../db/db'
import { NOMBRE_TIPO } from '../db/tipos'
import { resumenDetalle, sesionesDe } from '../lib/records'
import { DibujoAnimado } from '../components/ImagenEjercicio'
import { MapaMusculos } from '../components/MapaMusculos'
import { Volver } from '../components/Volver'
import { Dialogo } from '../components/Dialogo'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'
import { useEntrenamientos } from '../db/entrenamientos'
import { fechaLarga, haceCuanto } from '../lib/fechas'
import { textoSerie } from '../lib/series'
import instruccionesJson from '../../contenido/instrucciones.json'

// Pasos para hacer bien cada ejercicio de la biblioteca (los propios no tienen).
const INSTRUCCIONES = instruccionesJson as Record<string, { pasos: string[]; consejo?: string }>

export function EjercicioDetalle() {
  const { id } = useParams()
  const ej = useEjercicio(id)
  const navigate = useNavigate()
  const [pestana, setPestana] = useState<'resumen' | 'historial' | 'como'>('resumen')
  const [borrar, setBorrar] = useState<{ rutinas: number } | null>(null)
  const historial = useEntrenamientos()

  if (ej === undefined) return <main className="screen" />
  if (ej === null)
    return (
      <main className="screen">
        <Volver a="/ejercicios" texto="Ejercicios" />
        <Empty icon="dumbbell" title="Este ejercicio no existe">
          Puede que lo hayas borrado.
        </Empty>
      </main>
    )

  const como = ej.personalizado ? undefined : INSTRUCCIONES[ej.id]
  // Cada vez que se hizo, de la más nueva a la más antigua (el historial ya viene así).
  const veces = (historial ?? []).flatMap((h) =>
    h.ejercicios.filter((x) => x.ejercicioId === ej.id && x.series.length).map((x) => ({ h, series: x.series })),
  )
  const ultima = veces[0]

  async function pedirBorrar() {
    const rutinas = await db.rutinas.filter((r) => r.ejercicios.some((x) => x.ejercicioId === ej!.id)).count()
    setBorrar({ rutinas })
  }

  async function confirmarBorrar() {
    // Se quita también de las rutinas que lo usan.
    await db.transaction('rw', db.rutinas, db.ejerciciosPropios, async () => {
      await db.rutinas.toCollection().modify((r) => {
        r.ejercicios = r.ejercicios.filter((x) => x.ejercicioId !== ej!.id)
      })
      await borrarEjercicioPropio(ej!.id)
    })
    navigate('/ejercicios', { replace: true })
  }

  return (
    <main className="screen">
      <Volver a="/ejercicios" texto="Ejercicios" />

      <div className="detalle">
        <div className="detalle-col">
          <div className="detalle-titulo">
            <h1>{ej.nombre}</h1>
            <div className="etiquetas">
              <span>{NOMBRE_TIPO[ej.tipo]}</span>
              <span>{ej.equipo}</span>
              <span>{ej.grupo}</span>
              {ej.personalizado && <span className="etiqueta-oro">Creado por ti</span>}
            </div>
          </div>

          <DibujoAnimado ej={ej} />

          <div className="sec">
            <span>Músculos que trabaja</span>
          </div>
          <div className="card musculos">
            <MapaMusculos principal={ej.musculoPrincipal} secundarios={ej.musculosSecundarios} />
            <div className="leyenda">
              <div>
                <span className="ley-t">
                  <i className="ley-1" />
                  Principal
                </span>
                <span className="ley-v">{ej.musculoPrincipal}</span>
              </div>
              {ej.musculosSecundarios.length > 0 && (
                <div>
                  <span className="ley-t">
                    <i className="ley-2" />
                    Secundarios
                  </span>
                  <span className="ley-v">
                    {ej.musculosSecundarios.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detalle-col">
          <div className="pestanas" role="tablist" aria-label="Secciones del ejercicio">
            <button type="button" role="tab" aria-selected={pestana === 'resumen'} onClick={() => setPestana('resumen')}>
              Resumen
            </button>
            <button type="button" role="tab" aria-selected={pestana === 'historial'} onClick={() => setPestana('historial')}>
              Historial
            </button>
            {como && (
              <button type="button" role="tab" aria-selected={pestana === 'como'} onClick={() => setPestana('como')}>
                Cómo hacerlo
              </button>
            )}
          </div>

          {pestana === 'resumen' ? (
            <>
              <div className="stats num">
                {resumenDetalle(ej.tipo, sesionesDe(ej.id, historial ?? [])).map((x) => (
                  <div className="stat" key={x.nombre}>
                    <span className="l">{x.nombre}</span>
                    <span className="v">{x.texto}</span>
                  </div>
                ))}
              </div>
              {ultima ? (
                <Link to={`/historial/${ultima.h.id}`} className="ultima-vez">
                  <span className="uv-k">Última vez · {haceCuanto(ultima.h.inicio)}</span>
                  <span className="num">{ultima.series.map((x) => textoSerie(x, ej.tipo)).join(' · ')}</span>
                </Link>
              ) : (
                <Empty icon="trend" title="Aún no lo has hecho">
                  Cuando lo hagas en un entrenamiento, aquí verás tus récords y lo que hiciste la última vez.
                </Empty>
              )}
            </>
          ) : pestana === 'como' && como ? (
            <div className="como">
              <ol className="pasos">
                {como.pasos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
              {como.consejo && (
                <p className="consejo">
                  <span>Ojo</span>
                  {como.consejo}
                </p>
              )}
            </div>
          ) : veces.length ? (
            <div className="veces">
              {veces.map(({ h, series }, i) => (
                <Link key={`${h.id}-${i}`} to={`/historial/${h.id}`} className="vez">
                  <span className="vez-cab">
                    <span className="vez-fecha">{fechaLarga(new Date(h.inicio))}</span>
                    <span className="vez-nombre">{h.nombre}</span>
                  </span>
                  <span className="vez-series num">{series.map((x) => textoSerie(x, ej.tipo)).join(' · ')}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty icon="cal" title="Sin historial todavía">
              Aquí aparecerá cada vez que lo hayas entrenado, con sus series.
            </Empty>
          )}

          {ej.personalizado && (
            <div className="acciones-propio">
              <Link to={`/ejercicios/${ej.id}/editar`} className="btn btn-ghost">
                <Icon name="edit" />
                Editar ejercicio
              </Link>
              <button type="button" className="btn-texto peligro" onClick={pedirBorrar}>
                Eliminar ejercicio
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialogo
        abierto={borrar !== null}
        titulo={`¿Eliminar “${ej.nombre}”?`}
        confirmar="Eliminar"
        peligro
        onConfirmar={confirmarBorrar}
        onCerrar={() => setBorrar(null)}
      >
        {borrar && borrar.rutinas > 0
          ? `Está en ${borrar.rutinas === 1 ? '1 rutina' : `${borrar.rutinas} rutinas`}; también se quitará de ahí.`
          : 'No se puede deshacer.'}
      </Dialogo>
    </main>
  )
}
