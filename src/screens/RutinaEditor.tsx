import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { eliminarRutina, guardarRutina, useRutina } from '../db/rutinas'
import { useMapaEjercicios } from '../db/ejercicios'
import { nuevoId } from '../db/db'
import { ETIQUETA_OBJETIVO, OBJETIVO_INICIAL, type Ejercicio, type EjercicioEnRutina } from '../db/tipos'
import { DIAS_INICIAL, DIAS_LARGOS, resumenFila } from '../lib/rutinas'
import { leerMmss, mmss } from '../lib/tiempo'
import { leerAjustes } from '../lib/ajustes'
import { BarraEditor } from '../components/BarraEditor'
import { useAvisoSalida } from '../components/AvisoSalida'
import { Dialogo } from '../components/Dialogo'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'
import { Miniatura } from '../components/ImagenEjercicio'
import { SelectorEjercicios } from '../components/SelectorEjercicios'
import { useVolver } from '../components/Volver'

type Borrador = { nombre: string; dias: number[]; ejercicios: EjercicioEnRutina[] }

const VACIA: Borrador = { nombre: '', dias: [], ejercicios: [] }

function filaNueva(ej: Ejercicio): EjercicioEnRutina {
  return {
    uid: nuevoId(),
    ejercicioId: ej.id,
    series: ej.tipo === 'cardio' ? 1 : 3,
    objetivo: OBJETIVO_INICIAL[ej.tipo],
    descanso: ej.tipo === 'cardio' ? 0 : leerAjustes().descanso,
    nota: '',
  }
}

export function RutinaEditor() {
  const { id } = useParams()
  const existente = useRutina(id)
  const mapa = useMapaEjercicios()
  const navigate = useNavigate()
  const volver = useVolver('/rutinas')

  const [b, setB] = useState<Borrador | null>(id ? null : VACIA)
  const [original, setOriginal] = useState<Borrador>(VACIA)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  const [borrar, setBorrar] = useState(false)
  const [error, setError] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Cargar la rutina al editar.
  useEffect(() => {
    if (!id || !existente || b) return
    const inicial = { nombre: existente.nombre, dias: existente.dias, ejercicios: existente.ejercicios }
    setB(inicial)
    setOriginal(inicial)
  }, [id, existente, b])

  const cerrarSelector = useCallback(() => setEligiendo(false), [])

  const hayCambios = !!b && JSON.stringify(b) !== JSON.stringify(original)
  const aviso = useAvisoSalida(hayCambios, volver)

  if (id && existente === null)
    return (
      <main className="screen">
        <Empty icon="list" title="Esta rutina no existe">
          Puede que la hayas eliminado.
        </Empty>
      </main>
    )
  if (!b || !mapa) return <main className="screen" />

  const set = (p: Partial<Borrador>) => setB({ ...b, ...p })
  const cambiarFila = (uid: string, p: Partial<EjercicioEnRutina>) =>
    set({ ejercicios: b.ejercicios.map((f) => (f.uid === uid ? { ...f, ...p } : f)) })

  function alArrastrar(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const de = b!.ejercicios.findIndex((f) => f.uid === e.active.id)
    const a = b!.ejercicios.findIndex((f) => f.uid === e.over!.id)
    set({ ejercicios: arrayMove(b!.ejercicios, de, a) })
  }

  function agregar(ids: string[]) {
    const nuevas = ids.map((eid) => mapa!.get(eid)).filter((x): x is Ejercicio => !!x).map(filaNueva)
    set({ ejercicios: [...b!.ejercicios, ...nuevas] })
    if (nuevas.length) setAbierto(nuevas[0].uid)
    setEligiendo(false)
  }

  async function guardar() {
    const nombre = b!.nombre.trim()
    if (!nombre) {
      setError(true)
      nombreRef.current?.focus()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    await guardarRutina({ ...b!, nombre, id: existente?.id, creada: existente?.creada })
    aviso.sinAviso(volver)
  }

  async function confirmarBorrar() {
    if (!existente) return
    await eliminarRutina(existente.id)
    aviso.sinAviso(() => navigate('/rutinas', { replace: true }))
  }

  const n = b.ejercicios.length

  return (
    <main className="screen editor">
      <BarraEditor titulo={id ? 'Editar rutina' : 'Nueva rutina'} onCancelar={aviso.cancelar} onGuardar={guardar} />

      <label className="campo">
        <span className="sec">Nombre</span>
        <input
          ref={nombreRef}
          className="input-grande"
          value={b.nombre}
          placeholder="Ej.: Empuje, Pierna, Torso…"
          autoFocus={!id}
          aria-invalid={error && !b.nombre.trim()}
          onChange={(e) => {
            set({ nombre: e.target.value })
            setError(false)
          }}
        />
        {error && !b.nombre.trim() && <span className="error">Ponle un nombre a la rutina.</span>}
      </label>

      <div className="campo">
        <span className="sec">Días que la haces (opcional)</span>
        <div className="dias">
          {DIAS_INICIAL.map((d, i) => {
            const on = b.dias.includes(i)
            return (
              <button
                key={i}
                type="button"
                className="dia"
                aria-pressed={on}
                aria-label={DIAS_LARGOS[i]}
                onClick={() => set({ dias: on ? b.dias.filter((x) => x !== i) : [...b.dias, i].sort() })}
              >
                {d}
              </button>
            )
          })}
        </div>
        <span className="row-s">La app te la propone en Inicio esos días.</span>
      </div>

      <div className="campo">
        <div className="sec">
          <span>Ejercicios · {n}</span>
          {n > 1 && <span className="pista">Arrastra ⋮⋮ para reordenar</span>}
        </div>

        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alArrastrar}>
          <SortableContext items={b.ejercicios.map((f) => f.uid)} strategy={verticalListSortingStrategy}>
            <div className="filas-rutina">
              {b.ejercicios.map((f) => (
                <FilaRutina
                  key={f.uid}
                  fila={f}
                  ej={mapa.get(f.ejercicioId)}
                  abierto={abierto === f.uid}
                  onAlternar={() => setAbierto(abierto === f.uid ? null : f.uid)}
                  onCambiar={(p) => cambiarFila(f.uid, p)}
                  onQuitar={() => set({ ejercicios: b.ejercicios.filter((x) => x.uid !== f.uid) })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button type="button" className="agregar-ej" onClick={() => setEligiendo(true)}>
          <Icon name="plus" size={18} />
          Agregar ejercicios
        </button>
      </div>

      {existente && (
        <button type="button" className="btn-texto peligro centro" onClick={() => setBorrar(true)}>
          Eliminar rutina
        </button>
      )}

      {eligiendo && <SelectorEjercicios onCerrar={cerrarSelector} onElegir={agregar} />}

      <Dialogo
        abierto={borrar}
        titulo={`¿Eliminar “${existente?.nombre ?? ''}”?`}
        confirmar="Eliminar rutina"
        peligro
        onConfirmar={confirmarBorrar}
        onCerrar={() => setBorrar(false)}
      >
        La rutina se borra, pero los entrenamientos que ya hiciste con ella se mantienen en tu historial.
      </Dialogo>

      {aviso.dialogo}
    </main>
  )
}

function FilaRutina({
  fila,
  ej,
  abierto,
  onAlternar,
  onCambiar,
  onQuitar,
}: {
  fila: EjercicioEnRutina
  ej: Ejercicio | undefined
  abierto: boolean
  onAlternar: () => void
  onCambiar: (p: Partial<EjercicioEnRutina>) => void
  onQuitar: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: fila.uid })
  const [descansoTxt, setDescansoTxt] = useState(mmss(fila.descanso))

  useEffect(() => setDescansoTxt(mmss(fila.descanso)), [fila.descanso])

  const nombre = ej?.nombre ?? 'Ejercicio eliminado'
  const tipo = ej?.tipo ?? 'pesas'

  return (
    <div
      ref={setNodeRef}
      className="fila-rutina"
      data-abierto={abierto}
      data-arrastrando={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className="fr-cab">
        <button type="button" ref={setActivatorNodeRef} className="agarre" aria-label={`Mover ${nombre}`} {...attributes} {...listeners}>
          <Icon name="grip" size={16} />
        </button>
        {ej ? <Miniatura ej={ej} size={42} /> : <span className="mini" style={{ width: 42, height: 42 }} />}
        <button type="button" className="fr-texto" onClick={onAlternar} aria-expanded={abierto}>
          <span className="fr-nombre">{nombre}</span>
          <span className="fr-meta num">{abierto ? [ej?.musculoPrincipal, ...(ej?.musculosSecundarios ?? [])].filter(Boolean).join(' · ') : resumenFila(fila, ej)}</span>
        </button>
        {abierto ? (
          <button type="button" className="icon-btn peligro" aria-label={`Quitar ${nombre}`} onClick={onQuitar}>
            <Icon name="trash" size={18} />
          </button>
        ) : (
          <button type="button" className="icon-btn" aria-label={`Editar ${nombre}`} onClick={onAlternar}>
            <Icon name="down" size={18} />
          </button>
        )}
      </div>

      {abierto && (
        <div className="fr-cuerpo">
          <div className="fr-campos">
            <div className="campo-mini">
              <span>Series</span>
              <div className="stepper">
                <button type="button" aria-label="Menos series" disabled={fila.series <= 1} onClick={() => onCambiar({ series: fila.series - 1 })}>
                  −
                </button>
                <span className="num">{fila.series}</span>
                <button type="button" aria-label="Más series" disabled={fila.series >= 20} onClick={() => onCambiar({ series: fila.series + 1 })}>
                  +
                </button>
              </div>
            </div>
            <label className="campo-mini">
              <span>{ETIQUETA_OBJETIVO[tipo]}</span>
              <input
                className="input-celda num"
                value={fila.objetivo}
                placeholder="—"
                onFocus={(e) => e.target.select()}
                onChange={(e) => onCambiar({ objetivo: e.target.value })}
              />
            </label>
            <label className="campo-mini">
              <span>Descanso</span>
              <input
                className="input-celda num"
                inputMode="decimal"
                value={descansoTxt}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDescansoTxt(e.target.value)}
                onBlur={() => {
                  const s = leerMmss(descansoTxt)
                  if (s === null || s > 3600) setDescansoTxt(mmss(fila.descanso))
                  else onCambiar({ descanso: s })
                }}
              />
            </label>
          </div>
          <label className="campo-mini">
            <span>Nota</span>
            <input
              className="input-celda izq"
              value={fila.nota}
              placeholder="Ej.: agarre medio, bajar controlado"
              onChange={(e) => onCambiar({ nota: e.target.value })}
            />
          </label>
          <button type="button" className="btn-texto fr-listo" onClick={onAlternar}>
            <Icon name="up" size={16} />
            Listo
          </button>
        </div>
      )}
    </div>
  )
}
