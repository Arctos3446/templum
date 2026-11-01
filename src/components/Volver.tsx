import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

/** Vuelve a la pantalla anterior o, si se entró directo (sin historial), a `a`. */
export function useVolver(a: string) {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(a, { replace: true })
  }
}

/** Enlace "‹ Atrás". */
export function Volver({ a, texto }: { a: string; texto: string }) {
  const volver = useVolver(a)
  return (
    <button type="button" className="volver" onClick={volver}>
      <Icon name="back" size={18} />
      {texto}
    </button>
  )
}
