import { useEntrenamientos } from '../db/entrenamientos'
import { useMapaEjercicios } from '../db/ejercicios'
import { useRutinas } from '../db/rutinas'
import { copiar } from '../lib/exportImport'
import { resumenParaClaude } from '../lib/summary'
import { Icon } from './Icon'

/** Botón "Copiar resumen para Claude". */
export function CopiarResumen({ className, onListo }: { className: string; onListo: (texto: string) => void }) {
  const historial = useEntrenamientos()
  const rutinas = useRutinas()
  const mapa = useMapaEjercicios()
  const listo = !!historial && !!rutinas && !!mapa
  return (
    <button
      type="button"
      className={className}
      disabled={!listo}
      onClick={async () => {
        const ok = await copiar(resumenParaClaude(historial!, rutinas!, mapa!))
        onListo(ok ? 'Resumen copiado. Pégalo en un chat con Claude.' : 'No se pudo copiar. Inténtalo de nuevo.')
      }}
    >
      <Icon name="copy" size={16} />
      Copiar resumen para Claude
    </button>
  )
}
