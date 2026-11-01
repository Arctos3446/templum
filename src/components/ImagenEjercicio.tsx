import { useEffect, useState } from 'react'
import type { Ejercicio } from '../db/tipos'
import { MapaMusculos } from './MapaMusculos'

// Dirección completa del dibujo. Tiene que ser completa: dentro de una variable de CSS, algunos navegadores
// (como Firefox) resuelven las direcciones relativas desde el archivo de estilos (/templum/assets/) y no las encuentran.
const url = (ruta: string) => new URL(ruta, document.baseURI).href

/** Miniatura para listas: el dibujo dorado (fase de esfuerzo) o, si no tiene, el mapa de músculos. */
export function Miniatura({ ej, size = 52 }: { ej: Ejercicio; size?: number }) {
  return (
    <span className="mini" style={{ width: size, height: size }} aria-hidden="true">
      {ej.dibujos.length ? (
        <span className="dibujo" style={{ ['--src' as string]: `url("${url(ej.dibujos[ej.dibujos.length - 1])}")` }} />
      ) : (
        <MapaMusculos principal={ej.musculoPrincipal} secundarios={ej.musculosSecundarios} />
      )}
    </span>
  )
}

/** Dibujo grande que alterna entre las dos fases del movimiento, como una animación lenta. */
export function DibujoAnimado({ ej }: { ej: Ejercicio }) {
  const [fase, setFase] = useState(0)
  const n = ej.dibujos.length

  useEffect(() => {
    if (n < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setFase((f) => (f + 1) % n), 1400)
    return () => window.clearInterval(t)
  }, [n])

  if (!n) return null
  return (
    <div className="dibujo-grande" role="img" aria-label={`Dibujo de ${ej.nombre}`}>
      {ej.dibujos.map((d, i) => (
        <span key={d} className="dibujo" data-on={i === fase} style={{ ['--src' as string]: `url("${url(d)}")` }} />
      ))}
    </div>
  )
}
