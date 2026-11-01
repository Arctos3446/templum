import { Link } from 'react-router-dom'
import type { Ejercicio } from '../db/tipos'
import { GRUPOS } from '../db/tipos'
import { normalizar } from '../db/ejercicios'
import { useSesion } from '../lib/useSesion'
import { Icon } from './Icon'
import { Miniatura } from './ImagenEjercicio'

/** "Barra · Pecho, hombros, tríceps" */
export function describir(e: Ejercicio): string {
  const musculos = [e.musculoPrincipal, ...e.musculosSecundarios.map((m) => m.toLowerCase())]
  return `${e.equipo} · ${musculos.join(', ')}`
}

type Props = {
  ejercicios: Ejercicio[]
  /** Clave para recordar la búsqueda y el filtro. */
  clave: string
} & (
  | { modo: 'ver' }
  | { modo: 'elegir'; seleccion: string[]; onAlternar: (id: string) => void }
)

export function ListaEjercicios(props: Props) {
  const { ejercicios, clave } = props
  const [busqueda, setBusqueda] = useSesion(clave + '.busqueda', '')
  const [filtro, setFiltro] = useSesion(clave + '.filtro', 'Todos')

  const hayPropios = ejercicios.some((e) => e.personalizado)
  const chips = ['Todos', ...GRUPOS, ...(hayPropios ? ['Míos'] : [])]

  const q = normalizar(busqueda.trim())
  const visibles = ejercicios.filter((e) => {
    if (filtro === 'Míos' && !e.personalizado) return false
    if (filtro !== 'Todos' && filtro !== 'Míos' && e.grupo !== filtro) return false
    if (!q) return true
    return normalizar(`${e.nombre} ${e.equipo} ${e.musculoPrincipal} ${e.musculosSecundarios.join(' ')} ${e.grupo}`).includes(q)
  })

  const grupos = [...GRUPOS, ...new Set(visibles.map((e) => e.grupo).filter((g) => !(GRUPOS as readonly string[]).includes(g)))]
    .map((g) => ({ nombre: g, items: visibles.filter((e) => e.grupo === g) }))
    .filter((g) => g.items.length)

  return (
    <div className="lista-ej">
      <label className="buscador">
        <Icon name="search" size={18} />
        <span className="sr-only">Buscar ejercicio</span>
        <input type="search" placeholder="Buscar ejercicio o músculo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {busqueda && (
          <button type="button" className="icon-btn" aria-label="Borrar búsqueda" onClick={() => setBusqueda('')}>
            <Icon name="close" size={16} />
          </button>
        )}
      </label>

      <div className="chips" role="group" aria-label="Filtrar por grupo">
        {chips.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={filtro === c} onClick={() => setFiltro(c)}>
            {c}
          </button>
        ))}
      </div>

      {grupos.length === 0 && <p className="nada">No encontré ejercicios con “{busqueda}”.</p>}

      {grupos.map((g) => (
        <section key={g.nombre} className="grupo-ej">
          <h2 className="grupo-titulo">{g.nombre}</h2>
          <div className="grupo-items">
            {g.items.map((e) => {
              const contenido = (
                <>
                  <Miniatura ej={e} />
                  <span className="fila-ej-texto">
                    <span className="fila-ej-nombre">
                      {e.nombre}
                      {e.personalizado && <span className="tag-propio">Mío</span>}
                    </span>
                    <span className="fila-ej-meta">{describir(e)}</span>
                  </span>
                </>
              )
              if (props.modo === 'ver') {
                return (
                  <Link key={e.id} to={`/ejercicios/${e.id}`} className="fila-ej">
                    {contenido}
                    <Icon name="chev" size={16} />
                  </Link>
                )
              }
              const n = props.seleccion.indexOf(e.id)
              return (
                <button key={e.id} type="button" className="fila-ej" aria-pressed={n !== -1} onClick={() => props.onAlternar(e.id)}>
                  {contenido}
                  <span className="marca">{n !== -1 ? n + 1 : ''}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
