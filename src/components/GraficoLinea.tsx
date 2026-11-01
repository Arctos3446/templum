import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { diaYMes } from '../lib/fechas'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export interface Punto {
  t: number
  v: number
}

/** Ancho real del contenedor (para dibujar el gráfico nítido a cualquier tamaño). */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [ancho, setAncho] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAncho(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, ancho] as const
}

/** Pasos "redondos" para el eje: 1, 2, 2,5, 5 × 10ⁿ. */
function pasoRedondo(rango: number, esTiempo: boolean): number {
  // En tiempos (segundos), pasos que se leen bien: 0:15, 0:30, 1:00, 2:00, 5:00…
  if (esTiempo) return [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200].find((p) => p >= rango) ?? 7200
  const exp = Math.pow(10, Math.floor(Math.log10(rango)))
  const f = rango / exp
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp
}

/**
 * Gráfico de una sola línea en el tiempo (como en la maqueta de Progreso):
 * línea púrpura con un área tenue, último punto en dorado con su valor,
 * y al pasar el dedo o el mouse, una línea vertical con el valor de esa sesión.
 */
export function GraficoLinea({
  puntos,
  desde,
  hasta,
  texto,
  eje,
  descripcion,
  esTiempo = false,
}: {
  puntos: Punto[]
  desde: number
  hasta: number
  texto: (v: number) => string
  eje: (v: number) => string
  descripcion: string
  /** Si los valores son segundos (para que el eje use pasos de reloj). */
  esTiempo?: boolean
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>()
  const [activo, setActivo] = useState<number | null>(null)

  useEffect(() => setActivo(null), [puntos])

  const alto = 190
  const m = { arriba: 22, derecha: 16, abajo: 26, izquierda: 44 }
  const w = Math.max(0, ancho - m.izquierda - m.derecha)
  const h = alto - m.arriba - m.abajo

  // Eje Y: 3 líneas con números redondos que cubren los datos.
  const vs = puntos.map((p) => p.v)
  let min = Math.min(...vs)
  let max = Math.max(...vs)
  if (min === max) {
    min = min * 0.9
    max = max * 1.1 || 1
  }
  const paso = pasoRedondo((max - min) / 2, esTiempo)
  const y0 = Math.floor(min / paso) * paso
  const y1 = Math.max(Math.ceil(max / paso) * paso, y0 + paso * 2)
  const marcas: number[] = []
  for (let v = y0; v <= y1 + paso / 2; v += paso) marcas.push(v)
  const marcasY = marcas.length > 4 ? marcas.filter((_, i) => i % 2 === 0) : marcas

  const x = (t: number) => m.izquierda + (hasta === desde ? w : ((t - desde) / (hasta - desde)) * w)
  const y = (v: number) => m.arriba + h - ((v - y0) / (y1 - y0)) * h

  // Eje X: el primer día de cada mes, y "hoy" a la derecha.
  const meses: { t: number; etiqueta: string }[] = []
  const d = new Date(desde)
  const cursor = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  while (cursor.getTime() < hasta) {
    meses.push({ t: cursor.getTime(), etiqueta: MESES[cursor.getMonth()] })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  const saltoMes = Math.max(1, Math.ceil(meses.length / Math.max(1, Math.floor(w / 56))))
  const mesesVisibles = meses.filter((_, i) => i % saltoMes === 0).filter((mm) => x(mm.t) < m.izquierda + w - 34 && x(mm.t) > m.izquierda + 14)

  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
  const base = m.arriba + h
  const area = puntos.length > 1 ? `${linea} L${x(puntos[puntos.length - 1].t).toFixed(1)} ${base} L${x(puntos[0].t).toFixed(1)} ${base} Z` : ''
  const ultimo = puntos[puntos.length - 1]

  function cercano(ev: PointerEvent<SVGRectElement>) {
    const r = (ev.currentTarget.ownerSVGElement ?? ev.currentTarget).getBoundingClientRect()
    const px = ev.clientX - r.left
    let mejor = 0
    puntos.forEach((p, i) => {
      if (Math.abs(x(p.t) - px) < Math.abs(x(puntos[mejor].t) - px)) mejor = i
    })
    setActivo(mejor)
  }

  function teclas(ev: KeyboardEvent<SVGSVGElement>) {
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault()
      const d = ev.key === 'ArrowLeft' ? -1 : 1
      setActivo((a) => Math.min(puntos.length - 1, Math.max(0, (a ?? puntos.length - 1) + (a === null ? 0 : d))))
    } else if (ev.key === 'Escape') setActivo(null)
  }

  const pa = activo !== null ? puntos[activo] : null
  const izqTooltip = pa ? Math.min(Math.max(x(pa.t), 70), ancho - 70) : 0
  // El recuadro va arriba del gráfico, o abajo si el punto está arriba (para no taparlo).
  const tooltipAbajo = pa ? y(pa.v) < m.arriba + h / 2 : false

  return (
    <div className="grafico" ref={ref}>
      {ancho > 0 && (
        <svg
          width={ancho}
          height={alto}
          viewBox={`0 0 ${ancho} ${alto}`}
          role="img"
          aria-label={descripcion}
          tabIndex={0}
          onKeyDown={teclas}
          onBlur={() => setActivo(null)}
        >
          {marcasY.map((v) => (
            <g key={v}>
              <line className="g-grilla" x1={m.izquierda} x2={m.izquierda + w} y1={y(v)} y2={y(v)} />
              <text className="g-eje" x={m.izquierda - 8} y={y(v) + 4} textAnchor="end">
                {eje(v)}
              </text>
            </g>
          ))}
          <line className="g-base" x1={m.izquierda} x2={m.izquierda + w} y1={base} y2={base} />
          {mesesVisibles.map((mm) => (
            <text key={mm.t} className="g-eje" x={x(mm.t)} y={alto - 6} textAnchor="middle">
              {mm.etiqueta}
            </text>
          ))}
          <text className="g-eje" x={m.izquierda + w} y={alto - 6} textAnchor="end">
            hoy
          </text>

          {area && <path className="g-area" d={area} />}
          {puntos.length > 1 && <path className="g-linea" d={linea} />}
          {puntos.length <= 12 &&
            puntos.slice(0, -1).map((p) => <circle key={p.t} className="g-punto" cx={x(p.t)} cy={y(p.v)} r={3.5} />)}

          {pa && <line className="g-cruz" x1={x(pa.t)} x2={x(pa.t)} y1={m.arriba - 6} y2={base} />}
          {ultimo && (
            <>
              <circle className="g-fin" cx={x(ultimo.t)} cy={y(ultimo.v)} r={6} />
              {activo === null && (
                <text className="g-fin-texto" x={x(ultimo.t) - 12} y={y(ultimo.v) - 10} textAnchor="end">
                  {eje(ultimo.v)}
                </text>
              )}
            </>
          )}
          {pa && activo !== puntos.length - 1 && <circle className="g-activo" cx={x(pa.t)} cy={y(pa.v)} r={5.5} />}

          {/* Zona para tocar: todo el gráfico, así basta acercarse a una fecha. */}
          <rect
            className="g-toque"
            x={m.izquierda - 10}
            y={0}
            width={w + 20}
            height={base}
            onPointerDown={cercano}
            onPointerMove={cercano}
            onPointerLeave={(ev) => ev.pointerType === 'mouse' && setActivo(null)}
          />
        </svg>
      )}

      {pa && (
        <div className="g-tooltip" style={{ left: izqTooltip, top: tooltipAbajo ? base - 54 : 4 }} aria-live="polite">
          <b className="num">{texto(pa.v)}</b>
          <span>{diaYMes(new Date(pa.t))}</span>
        </div>
      )}

      {/* La misma información en tabla, para lectores de pantalla. */}
      <table className="solo-lector">
        <caption>{descripcion}</caption>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.t}>
              <td>{diaYMes(new Date(p.t))}</td>
              <td>{texto(p.v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
