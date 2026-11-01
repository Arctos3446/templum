import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { Dialogo } from './Dialogo'

/**
 * Protege los cambios sin guardar de un editor.
 * - `cancelar()`: para el botón Cancelar; pregunta si hay cambios.
 * - `sinAviso(fn)`: para salir después de guardar o eliminar, sin preguntar.
 * - También pregunta al tocar el menú, al ir atrás o al cerrar la pestaña.
 */
export function useAvisoSalida(hayCambios: boolean, salir: () => void) {
  const [pedido, setPedido] = useState(false)
  const omitir = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => hayCambios && !omitir.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!hayCambios) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [hayCambios])

  const bloqueado = blocker.state === 'blocked'

  const dialogo = (
    <Dialogo
      abierto={bloqueado || pedido}
      titulo="¿Salir sin guardar?"
      confirmar="Salir sin guardar"
      cancelar="Seguir editando"
      peligro
      onConfirmar={() => {
        omitir.current = true
        setPedido(false)
        if (bloqueado) blocker.proceed?.()
        else salir()
      }}
      onCerrar={() => {
        setPedido(false)
        if (bloqueado) blocker.reset?.()
      }}
    >
      Los cambios que hiciste se van a perder.
    </Dialogo>
  )

  return {
    cancelar: () => (hayCambios ? setPedido(true) : salir()),
    sinAviso: (fn: () => void) => {
      omitir.current = true
      fn()
    },
    dialogo,
  }
}
