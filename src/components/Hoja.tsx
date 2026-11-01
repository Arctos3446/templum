import { useEffect, useRef, type ReactNode } from 'react'

/** Menú que sube desde abajo en el celular (en el computador queda al centro). */
export function Hoja({ abierto, titulo, onCerrar, children }: { abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog ref={ref} className="hoja" aria-label={titulo} onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      {abierto && (
        <div className="hoja-caja">
          <div className="hoja-cab">
            <h2>{titulo}</h2>
            <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onCerrar}>
              <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
