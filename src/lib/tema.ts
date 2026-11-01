import { useEffect, useState } from 'react'

// Tema de la app: automático (sigue al celular), oscuro o claro. Se guarda en este dispositivo.
export type Tema = 'auto' | 'oscuro' | 'claro'

const CLAVE = 'templum.tema'

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE)
    if (t === 'oscuro' || t === 'claro') return t
  } catch {
    /* sin acceso al almacenamiento: queda en automático */
  }
  return 'auto'
}

function aplicar(tema: Tema) {
  const root = document.documentElement
  if (tema === 'oscuro') root.dataset.theme = 'dark'
  else if (tema === 'claro') root.dataset.theme = 'light'
  else delete root.dataset.theme
  // La barra del navegador (en el celular) toma el color de fondo.
  const fondo = getComputedStyle(root).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fondo)
}

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(leer)

  useEffect(() => {
    aplicar(tema)
    try {
      if (tema === 'auto') localStorage.removeItem(CLAVE)
      else localStorage.setItem(CLAVE, tema)
    } catch {
      /* ignorar */
    }
    if (tema !== 'auto') return
    // En automático, seguir los cambios del celular o computador.
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => aplicar('auto')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [tema])

  return [tema, setTema]
}
