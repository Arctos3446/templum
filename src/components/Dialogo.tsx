import { useEffect, useRef, type ReactNode } from 'react'

/** Ventana de confirmación con el estilo de la app. */
export function Dialogo({
  abierto,
  titulo,
  children,
  confirmar,
  cancelar = 'Cancelar',
  peligro = false,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean
  titulo: string
  children?: ReactNode
  confirmar: string
  cancelar?: string
  peligro?: boolean
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog ref={ref} className="dialogo" onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      <div className="dialogo-caja">
        <h2>{titulo}</h2>
        {children && <div className="dialogo-texto">{children}</div>}
        <div className="dialogo-botones">
          <button type="button" className="btn btn-ghost" onClick={onCerrar}>
            {cancelar}
          </button>
          <button type="button" className={`btn ${peligro ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirmar}>
            {confirmar}
          </button>
        </div>
      </div>
    </dialog>
  )
}
