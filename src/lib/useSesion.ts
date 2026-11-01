import { useEffect, useState } from 'react'

/** Como useState, pero recuerda el valor mientras la pestaña siga abierta (al ir y volver de una pantalla). */
export function useSesion<T>(clave: string, inicial: T): [T, (v: T) => void] {
  const [valor, setValor] = useState<T>(() => {
    try {
      const g = sessionStorage.getItem('templum.' + clave)
      return g === null ? inicial : (JSON.parse(g) as T)
    } catch {
      return inicial
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem('templum.' + clave, JSON.stringify(valor))
    } catch {
      /* ignorar */
    }
  }, [clave, valor])
  return [valor, setValor]
}
