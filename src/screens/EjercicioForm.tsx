import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { guardarEjercicioPropio, useEjercicio } from '../db/ejercicios'
import { EQUIPOS, GRUPOS, MUSCULOS, TIPOS, type TipoEjercicio } from '../db/tipos'
import { MapaMusculos } from '../components/MapaMusculos'
import { BarraEditor } from '../components/BarraEditor'
import { useVolver } from '../components/Volver'
import { useAvisoSalida } from '../components/AvisoSalida'
import { Empty } from '../components/Empty'

type Borrador = {
  nombre: string
  grupo: string
  tipo: TipoEjercicio
  equipo: string
  musculoPrincipal: string
  musculosSecundarios: string[]
}

const VACIO: Borrador = { nombre: '', grupo: 'Pecho', tipo: 'pesas', equipo: 'Barra', musculoPrincipal: 'Pecho', musculosSecundarios: [] }

// Al elegir un grupo, se propone su músculo principal.
const PRINCIPAL_DE_GRUPO: Record<string, string> = {
  Pecho: 'Pecho', Espalda: 'Dorsales', Pierna: 'Cuádriceps', Hombro: 'Hombros', Brazos: 'Bíceps', Core: 'Abdominales', Cardio: 'Cuádriceps',
}

export function EjercicioForm() {
  const { id } = useParams()
  const editando = useEjercicio(id)
  const navigate = useNavigate()
  const [b, setB] = useState<Borrador | null>(id ? null : VACIO)
  const [original, setOriginal] = useState<Borrador>(VACIO)
  const [error, setError] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)
  const volver = useVolver('/ejercicios')

  useEffect(() => {
    if (!id || !editando || b) return
    const inicial: Borrador = {
      nombre: editando.nombre, grupo: editando.grupo, tipo: editando.tipo, equipo: editando.equipo,
      musculoPrincipal: editando.musculoPrincipal, musculosSecundarios: editando.musculosSecundarios,
    }
    setB(inicial)
    setOriginal(inicial)
  }, [id, editando, b])

  const hayCambios = !!b && JSON.stringify(b) !== JSON.stringify(original)
  const aviso = useAvisoSalida(hayCambios, volver)

  if (id && editando === null)
    return (
      <main className="screen">
        <Empty icon="dumbbell" title="Este ejercicio no existe" />
      </main>
    )
  if (id && editando && !editando.personalizado)
    return (
      <main className="screen">
        <Empty icon="dumbbell" title="Los ejercicios de la biblioteca no se editan">
          Puedes crear uno propio con el nombre que quieras.
        </Empty>
      </main>
    )
  if (!b) return <main className="screen" />

  const set = (p: Partial<Borrador>) => setB({ ...b, ...p })

  async function guardar() {
    if (!b!.nombre.trim()) {
      setError(true)
      nombreRef.current?.focus()
      return
    }
    const nuevoId = await guardarEjercicioPropio({ ...b!, nombre: b!.nombre.trim(), id: editando?.id, creado: editando?.creado })
    aviso.sinAviso(() => navigate(`/ejercicios/${nuevoId}`, { replace: true }))
  }

  return (
    <main className="screen editor">
      <BarraEditor titulo={id ? 'Editar ejercicio' : 'Nuevo ejercicio'} onCancelar={aviso.cancelar} onGuardar={guardar} />

      <label className="campo">
        <span className="sec">Nombre</span>
        <input
          ref={nombreRef}
          className="input-grande"
          value={b.nombre}
          placeholder="Ej.: Press banca con pausa"
          autoFocus={!id}
          aria-invalid={error && !b.nombre.trim()}
          onChange={(e) => {
            set({ nombre: e.target.value })
            setError(false)
          }}
        />
        {error && !b.nombre.trim() && <span className="error">Ponle un nombre al ejercicio.</span>}
      </label>

      <div className="campo">
        <span className="sec">Grupo</span>
        <div className="chips">
          {GRUPOS.map((g) => (
            <button
              key={g}
              type="button"
              className="chip"
              aria-pressed={b.grupo === g}
              onClick={() => {
                const p = PRINCIPAL_DE_GRUPO[g]
                set({ grupo: g, musculoPrincipal: p, musculosSecundarios: b.musculosSecundarios.filter((m) => m !== p), ...(g === 'Cardio' ? { tipo: 'cardio' } : {}) })
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <span className="sec">Qué se registra</span>
        <div className="opciones-tipo">
          {TIPOS.map((t) => (
            <button key={t.valor} type="button" className="opcion" aria-pressed={b.tipo === t.valor} onClick={() => set({ tipo: t.valor })}>
              <b>{t.nombre}</b>
              <span>{t.detalle}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <span className="sec">Equipo</span>
        <div className="chips">
          {EQUIPOS.map((q) => (
            <button key={q} type="button" className="chip" aria-pressed={b.equipo === q} onClick={() => set({ equipo: q })}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="form-musculos">
        <div className="form-musculos-campos">
          <div className="campo">
            <span className="sec">Músculo principal</span>
            <div className="chips">
              {MUSCULOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="chip chip-principal"
                  aria-pressed={b.musculoPrincipal === m}
                  onClick={() => set({ musculoPrincipal: m, musculosSecundarios: b.musculosSecundarios.filter((x) => x !== m) })}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="campo">
            <span className="sec">Músculos secundarios (opcional)</span>
            <div className="chips">
              {MUSCULOS.filter((m) => m !== b.musculoPrincipal).map((m) => {
                const on = b.musculosSecundarios.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    className="chip chip-secundario"
                    aria-pressed={on}
                    onClick={() => set({ musculosSecundarios: on ? b.musculosSecundarios.filter((x) => x !== m) : [...b.musculosSecundarios, m] })}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="card form-musculos-mapa">
          <MapaMusculos principal={b.musculoPrincipal} secundarios={b.musculosSecundarios} />
        </div>
      </div>

      {aviso.dialogo}
    </main>
  )
}
