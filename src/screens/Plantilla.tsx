import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { nuevoId } from '../db/db'
import { useMapaEjercicios } from '../db/ejercicios'
import { agregarRutinas, useRutinas } from '../db/rutinas'
import type { EjercicioEnRutina } from '../db/tipos'
import { textoDias } from '../lib/rutinas'
import { mmss } from '../lib/tiempo'
import { Empty } from '../components/Empty'
import { Volver } from '../components/Volver'

interface PlantillaJson {
  id: string
  nombre: string
  descripcion: string
  consejos: string[]
  rutinas: { nombre: string; dias: number[]; ejercicios: Omit<EjercicioEnRutina, 'uid'>[] }[]
}

/** Rutinas preparadas (public/plantillas/*.json) que se agregan a "Mis rutinas" con un toque. */
export function Plantilla() {
  const { id } = useParams()
  const mapa = useMapaEjercicios()
  const rutinas = useRutinas()
  const navigate = useNavigate()
  const [p, setP] = useState<PlantillaJson | null | undefined>(undefined)
  const [agregando, setAgregando] = useState(false)

  useEffect(() => {
    if (!id || !/^[a-z0-9-]+$/.test(id)) return setP(null)
    fetch(new URL(`plantillas/${id}.json`, document.baseURI))
      .then((r) => (r.ok ? r.json() : null))
      .then(setP)
      .catch(() => setP(null))
  }, [id])

  if (p === null)
    return (
      <main className="screen">
        <Volver a="/rutinas" texto="Rutinas" />
        <Empty icon="list" title="No encontré esa plantilla">
          Revisa el enlace o <Link to="/rutinas">vuelve a tus rutinas</Link>.
        </Empty>
      </main>
    )
  if (!p || !mapa || !rutinas) return <main className="screen" />

  const repetidas = p.rutinas.filter((r) => rutinas.some((x) => x.nombre === r.nombre)).length

  async function agregar() {
    setAgregando(true)
    await agregarRutinas(
      p!.rutinas.map((r) => ({
        nombre: r.nombre,
        dias: r.dias,
        // Solo los ejercicios que existen en la biblioteca.
        ejercicios: r.ejercicios.filter((x) => mapa!.has(x.ejercicioId)).map((x) => ({ ...x, uid: nuevoId() })),
      })),
    )
    navigate('/rutinas', { replace: true })
  }

  return (
    <main className="screen plantilla">
      <Volver a="/rutinas" texto="Rutinas" />
      <div className="screen-head">
        <h1>{p.nombre}</h1>
      </div>
      <p className="pl-desc">{p.descripcion}</p>

      <div className="pl-rutinas">
        {p.rutinas.map((r) => (
          <section key={r.nombre} className="pl-rutina">
            <div className="pl-cab">
              <span className="tr-nombre">{r.nombre}</span>
              {r.dias.length > 0 && <span className="tr-dias">{textoDias(r.dias)}</span>}
            </div>
            <ol className="pl-ejercicios">
              {r.ejercicios.map((x, i) => (
                <li key={i}>
                  <span className="pl-ej">{mapa.get(x.ejercicioId)?.nombre ?? x.ejercicioId}</span>
                  <span className="pl-meta num">
                    {x.series} × {x.objetivo}
                    {x.descanso > 0 && ` · ${mmss(x.descanso)}`}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {p.consejos.length > 0 && (
        <div className="pl-consejos">
          <span className="sec">Para tener en cuenta</span>
          <ul>
            {p.consejos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pl-accion">
        {repetidas > 0 && (
          <p className="row-s">
            Ya tienes {repetidas === 1 ? 'una rutina' : `${repetidas} rutinas`} con estos nombres. Si las agregas de nuevo, quedarán repetidas.
          </p>
        )}
        <button type="button" className="btn btn-primary btn-block" disabled={agregando} onClick={agregar}>
          Agregar {p.rutinas.length === 1 ? 'esta rutina' : `estas ${p.rutinas.length} rutinas`}
        </button>
        <span className="row-s">Después puedes cambiar lo que quieras desde Rutinas.</span>
      </div>
    </main>
  )
}
