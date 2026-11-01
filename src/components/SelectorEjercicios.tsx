import { useEffect, useState } from 'react'
import { useEjercicios } from '../db/ejercicios'
import { ListaEjercicios } from './ListaEjercicios'

/**
 * Ventana para elegir ejercicios de la biblioteca (pantalla completa en el celular).
 * Con `unico`, al tocar uno se elige de inmediato (para reemplazar).
 */
export function SelectorEjercicios({
  titulo = 'Agregar ejercicios',
  unico = false,
  onCerrar,
  onElegir,
}: {
  titulo?: string
  unico?: boolean
  onCerrar: () => void
  onElegir: (ids: string[]) => void
}) {
  const ejercicios = useEjercicios()
  const [seleccion, setSeleccion] = useState<string[]>([])

  // Mientras está abierta, la página de atrás no se mueve.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', esc)
    }
  }, [onCerrar])

  return (
    <div className="selector" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="selector-caja">
        <header className="selector-cab">
          <button type="button" className="btn-texto" onClick={onCerrar}>
            Cancelar
          </button>
          <span className="barra-editor-titulo">{titulo}</span>
          <span style={{ width: 70 }} />
        </header>
        <div className="selector-cuerpo">
          {ejercicios && (
            <ListaEjercicios
              ejercicios={ejercicios}
              clave="selector"
              modo="elegir"
              seleccion={seleccion}
              onAlternar={(eid) => {
                if (unico) return onElegir([eid])
                setSeleccion(seleccion.includes(eid) ? seleccion.filter((x) => x !== eid) : [...seleccion, eid])
              }}
            />
          )}
        </div>
        {!unico && (
          <div className="selector-pie">
            <button type="button" className="btn btn-primary btn-block" disabled={!seleccion.length} onClick={() => onElegir(seleccion)}>
              {seleccion.length === 0
                ? 'Elige uno o más ejercicios'
                : `Agregar ${seleccion.length} ${seleccion.length === 1 ? 'ejercicio' : 'ejercicios'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
