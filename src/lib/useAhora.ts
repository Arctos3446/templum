import { useEffect, useState } from 'react'

/** La hora actual, que se actualiza cada `cada` milisegundos (para relojes). */
export function useAhora(cada = 1000, activo = true): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    if (!activo) return
    setAhora(Date.now())
    const t = window.setInterval(() => setAhora(Date.now()), cada)
    return () => window.clearInterval(t)
  }, [cada, activo])
  return ahora
}
