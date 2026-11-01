/** Barra superior de los editores: Cancelar · título · Guardar. */
export function BarraEditor({ titulo, onCancelar, onGuardar }: { titulo: string; onCancelar: () => void; onGuardar: () => void }) {
  return (
    <header className="barra-editor">
      <button type="button" className="btn-texto" onClick={onCancelar}>
        Cancelar
      </button>
      <span className="barra-editor-titulo">{titulo}</span>
      <button type="button" className="btn btn-primary" onClick={onGuardar}>
        Guardar
      </button>
    </header>
  )
}
