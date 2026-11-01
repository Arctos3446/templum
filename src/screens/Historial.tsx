import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEntrenamientos } from '../db/entrenamientos'
import { useMapaEjercicios } from '../db/ejercicios'
import type { Entrenamiento } from '../db/tipos'
import { diaCorto, diaYMes, mesYAnio, mismoDia, semanaActual } from '../lib/fechas'
import { recordsPorEntrenamiento, semanasDeConstancia, textoMinutos, textoTotal, volumenDe } from '../lib/historial'
import { numeroEntero } from '../lib/series'
import { useSesion } from '../lib/useSesion'
import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'

const INICIALES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const ESTRELLA = 'M24 9l3.6 7.4 8.2 1.2-5.9 5.7 1.4 8.1L24 27.6l-7.3 3.8 1.4-8.1-5.9-5.7 8.2-1.2z'

export function Historial() {
  const historial = useEntrenamientos()
  const mapa = useMapaEjercicios()
  const hoy = new Date()
  // Cuántos meses hacia atrás se está mirando (0 = este mes). Se recuerda al volver de un detalle.
  const [atras, setAtras] = useSesion('historial.mes', 0)
  const [dia, setDia] = useState<number | null>(null)

  const tipoDe = useCallback((id: string) => mapa?.get(id)?.tipo, [mapa])
  const records = useMemo(() => (historial && mapa ? recordsPorEntrenamiento(historial, tipoDe) : null), [historial, mapa, tipoDe])

  if (!historial || !mapa || !records) return <main className="screen" />

  const mes = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1)
  const delMes = historial.filter((h) => {
    const d = new Date(h.inicio)
    return d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth()
  })
  const diasConEntreno = new Set(delMes.map((h) => new Date(h.inicio).getDate()))
  const tiempo = delMes.reduce((t, h) => t + (h.fin - h.inicio), 0)
  const constancia = semanasDeConstancia(historial, hoy)

  // Celdas del calendario: huecos hasta el primer día (la semana parte el lunes) y luego los días.
  const huecos = (mes.getDay() + 6) % 7
  const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const lista = dia === null ? delMes : delMes.filter((h) => new Date(h.inicio).getDate() === dia)

  const cambiarMes = (d: number) => {
    setAtras(Math.max(0, atras + d))
    setDia(null)
  }

  return (
    <main className="screen historial">
      <div className="screen-head">
        <h1>Historial</h1>
      </div>

      {historial.length === 0 ? (
        <Empty icon="cal" title="Aún no has entrenado">
          Cuando termines tu primer entrenamiento aparecerá aquí, en el calendario y con todo su detalle.{' '}
          <Link to="/empezar">Empezar ahora</Link>
        </Empty>
      ) : (
        <div className="historial-cols">
          <div className="historial-col">
            <div className="calendario">
              <div className="cal-cab">
                <button type="button" className="icon-btn" aria-label="Mes anterior" onClick={() => cambiarMes(1)}>
                  <Icon name="back" size={18} />
                </button>
                <span className="cal-mes">{mesYAnio(mes)}</span>
                <button type="button" className="icon-btn" aria-label="Mes siguiente" disabled={atras === 0} onClick={() => cambiarMes(-1)}>
                  <Icon name="chev" size={18} />
                </button>
              </div>
              <div className="cal-grilla cal-dias" aria-hidden="true">
                {INICIALES.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="cal-grilla">
                {Array.from({ length: huecos }, (_, i) => (
                  <span key={`h${i}`} />
                ))}
                {Array.from({ length: diasDelMes }, (_, i) => {
                  const n = i + 1
                  const fecha = new Date(mes.getFullYear(), mes.getMonth(), n)
                  const on = diasConEntreno.has(n)
                  const esHoy = mismoDia(fecha, hoy)
                  const futuro = fecha > hoy && !esHoy
                  const clase = ['cal-d', on && 'on', esHoy && 'hoy', futuro && 'futuro', dia === n && 'elegido'].filter(Boolean).join(' ')
                  return on ? (
                    <button
                      key={n}
                      type="button"
                      className={clase}
                      aria-pressed={dia === n}
                      aria-label={`${diaYMes(fecha)}: entrenaste`}
                      onClick={() => setDia(dia === n ? null : n)}
                    >
                      <span className="num">{n}</span>
                    </button>
                  ) : (
                    <span key={n} className={clase}>
                      <span className="num">{n}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="stats num">
              <div className="stat">
                <span className="v">{delMes.length}</span>
                <span className="l">{delMes.length === 1 ? 'entrenamiento' : 'entrenamientos'}</span>
              </div>
              <div className="stat">
                <span className="v">{textoTotal(tiempo)}</span>
                <span className="l">tiempo total</span>
              </div>
              <div className="stat">
                <span className="v">
                  {constancia} {constancia === 1 ? 'semana' : 'semanas'}
                </span>
                <span className="l">de constancia</span>
              </div>
            </div>
          </div>

          <div className="historial-col">
            {dia !== null && (
              <div className="sec">
                <span>{diaYMes(new Date(mes.getFullYear(), mes.getMonth(), dia))}</span>
                <button type="button" className="btn-texto" onClick={() => setDia(null)}>
                  Ver todo el mes
                </button>
              </div>
            )}
            {lista.length === 0 ? (
              <p className="historial-vacio">No entrenaste en {mesYAnio(mes).split(' ')[0].toLowerCase()}.</p>
            ) : dia !== null ? (
              <div className="lista-sesiones">
                {lista.map((h) => (
                  <Sesion key={h.id} h={h} vol={volumenDe(h, tipoDe)} pr={records.get(h.id)?.ejercicios ?? 0} />
                ))}
              </div>
            ) : (
              porSemana(lista, hoy).map((g) => (
                <div key={g.titulo} className="grupo-semana">
                  <span className="sec">{g.titulo}</span>
                  <div className="lista-sesiones">
                    {g.items.map((h) => (
                      <Sesion key={h.id} h={h} vol={volumenDe(h, tipoDe)} pr={records.get(h.id)?.ejercicios ?? 0} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  )
}

/** Agrupa por semana: "Esta semana", "Semana pasada", "Semana del 12 de octubre". */
function porSemana(lista: Entrenamiento[], hoy: Date) {
  const esta = semanaActual(hoy)[0].getTime()
  const grupos: { titulo: string; items: Entrenamiento[] }[] = []
  for (const h of lista) {
    const lunes = semanaActual(new Date(h.inicio))[0]
    const dias = Math.round((esta - lunes.getTime()) / 86400000)
    const titulo = dias === 0 ? 'Esta semana' : dias === 7 ? 'Semana pasada' : `Semana del ${diaYMes(lunes)}`
    const g = grupos.find((x) => x.titulo === titulo)
    if (g) g.items.push(h)
    else grupos.push({ titulo, items: [h] })
  }
  return grupos
}

function Sesion({ h, vol, pr }: { h: Entrenamiento; vol: number; pr: number }) {
  const d = new Date(h.inicio)
  const n = h.ejercicios.length
  const meta = [textoMinutos(h.fin - h.inicio), vol > 0 ? `${numeroEntero(vol)} kg` : '', `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`]
  return (
    <Link to={`/historial/${h.id}`} className="sesion">
      <span className="ses-fecha">
        <span className="ses-dow">{diaCorto(d)}</span>
        <span className="ses-dia num">{d.getDate()}</span>
      </span>
      <span className="ses-texto">
        <span className="ses-nombre">{h.nombre}</span>
        <span className="ses-meta num">{meta.filter(Boolean).join(' · ')}</span>
      </span>
      {pr > 0 && (
        <span className="ses-pr">
          <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
            <path d={ESTRELLA} fill="currentColor" />
          </svg>
          {pr} {pr === 1 ? 'récord' : 'récords'}
        </span>
      )}
    </Link>
  )
}
