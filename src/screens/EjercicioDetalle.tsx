import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { borrarEjercicioPropio, useEjercicio } from '../db/ejercicios'
import { db } from '../db/db'
import { NOMBRE_TIPO, type TipoEjercicio } from '../db/tipos'
import { DibujoAnimado } from '../components/ImagenEjercicio'
import { MapaMusculos } from '../components/MapaMusculos'
import { Volver } from '../components/Volver'
import { Dialogo } from '../components/Dialogo'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'

// Qué récords se muestran según el tipo de ejercicio (se llenan en la parte 5).
const ESTADISTICAS: Record<TipoEjercicio, string[]> = {
  pesas: ['Récord de peso', '1RM estimado', 'Mejor volumen'],
  peso_corporal: ['Más reps en una serie', 'Más reps en un día', 'Veces hecho'],
  tiempo: ['Mejor tiempo', 'Veces hecho'],
  cardio: ['Mayor distancia', 'Mejor ritmo', 'Veces hecho'],
}

export function EjercicioDetalle() {
  const { id } = useParams()
  const ej = useEjercicio(id)
  const navigate = useNavigate()
  const [pestana, setPestana] = useState<'resumen' | 'historial'>('resumen')
  const [borrar, setBorrar] = useState<{ rutinas: number } | null>(null)

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
          </div>

          {pestana === 'resumen' ? (
            <>
              <div className="stats num">
                {ESTADISTICAS[ej.tipo].map((t) => (
                  <div className="stat" key={t}>
                    <span className="l">{t}</span>
                    <span className="v">—</span>
                  </div>
                ))}
              </div>
              <Empty icon="trend" title="Aún no lo has hecho">
                Cuando lo hagas en un entrenamiento, aquí verás tus récords y lo que hiciste la última vez.
              </Empty>
            </>
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
