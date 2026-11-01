import { useEffect, useState } from 'react'

/** Un mensaje breve abajo de la pantalla ("Copiado"). */
export function useToast() {
  const [texto, setTexto] = useState<string | null>(null)
  useEffect(() => {
    if (!texto) return
    const t = window.setTimeout(() => setTexto(null), 3500)
    return () => window.clearTimeout(t)
  }, [texto])
  const elemento = (
    <div className="toast" role="status" aria-live="polite" data-visible={!!texto}>
      {texto}
    </div>
  )
  return { mostrar: setTexto, elemento }
}
