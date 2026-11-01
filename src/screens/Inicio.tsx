import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Logo'
import { Icon } from '../components/Icon'
import { Empty } from '../components/Empty'
import { fechaLarga, mismoDia, semanaActual } from '../lib/fechas'
import { useRutinas } from '../db/rutinas'
import { useMapaEjercicios } from '../db/ejercicios'
import { TarjetaRutina } from '../components/TarjetaRutina'
import { diaDeSemana } from '../lib/rutinas'
import { useEnCurso, useEntrenamientos } from '../db/entrenamientos'
import { useEmpezar } from '../components/Empezar'
import { numeroEntero } from '../lib/series'
import { useAjustes } from '../lib/ajustes'
import { versiculoDelDia } from '../lib/contenido'
import { lineaDelDia } from '../lib/liturgia'

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function Inicio() {
  const hoy = new Date()
  const semana = semanaActual(hoy)
  const rutinas = useRutinas()
  const mapa = useMapaEjercicios()
  const dia = diaDeSemana(hoy)
  // Primero las que tocan hoy; se muestran hasta 4.
  const enCurso = useEnCurso()
  const ajustes = useAjustes()
  const verso = versiculoDelDia(hoy)
  const santo = lineaDelDia(hoy)
  const historial = useEntrenamientos()
  const { empezar, dialogo } = useEmpezar()

  // Lo de esta semana (de lunes a hoy).
  const lunes = semana[0].getTime()
  const deLaSemana = (historial ?? []).filter((h) => h.inicio >= lunes)
  const diasHechos = semana.map((d) => deLaSemana.some((h) => mismoDia(new Date(h.inicio), d)))
  let vol = 0
  let minutos = 0
  for (const h of deLaSemana) {
    minutos += Math.round((h.fin - h.inicio) / 60000)
    for (const x of h.ejercicios) if (mapa?.get(x.ejercicioId)?.tipo === 'pesas') for (const s of x.series) vol += (s.kg ?? 0) * (s.reps ?? 0)
  }

  const lista = rutinas ? [...rutinas].sort((a, b) => Number(b.dias.includes(dia)) - Number(a.dias.includes(dia))).slice(0, 4) : []

  return (
    <main className="screen">
      {/* En el computador el logo va en el menú lateral */}
      <Wordmark className="only-phone" />

      <div className="inicio">
        <div className="inicio-col">
          <div className="fecha-bloque">
            <span className="fecha">{fechaLarga(hoy)}</span>
            {ajustes.feSanto && (
              <span className="santo">
                <i className={`lit lit-${santo.color}`} aria-hidden="true" />
                {santo.texto}
              </span>
            )}
          </div>

          {ajustes.feVersiculoInicio && (
            <div className="verse-card">
              <span className="k">Versículo del día</span>
              <q>{verso.texto}</q>
              <span className="r">{verso.ref}</span>
            </div>
          )}

          {enCurso ? (
            <Link to="/entrenamiento" className="btn btn-primary btn-block">
              <Icon name="play" />
              Continuar entrenamiento
            </Link>
          ) : (
            <Link to="/empezar" className="btn btn-primary btn-block">
              <Icon name="play" />
              Empezar entrenamiento
            </Link>
          )}
        </div>

        <div className="inicio-col">
          <div className="sec">
            <span>Mis rutinas</span>
            <Link to="/rutinas">Ver todas</Link>
          </div>
          {rutinas && mapa && lista.length > 0 ? (
            <div className="lista-rutinas una-col">
              {lista.map((r) => (
                <TarjetaRutina key={r.id} r={r} mapa={mapa} hoy={r.dias.includes(dia)} onEmpezar={() => empezar(r)} />
              ))}
            </div>
          ) : rutinas ? (
            <Empty icon="list" title="Aún no tienes rutinas">
              <Link to="/rutinas/nueva">Crea tu primera rutina</Link> y aparecerá aquí para empezar con un toque.
            </Empty>
          ) : null}

          <div className="sec">
            <span>Esta semana</span>
          </div>
          <div className="semana">
            {semana.map((d, i) => (
              <span key={i} className={[mismoDia(d, hoy) && 'hoy', diasHechos[i] && 'hecho'].filter(Boolean).join(' ') || undefined}>
                <i>{diasHechos[i] && <Icon name="check" size={16} />}</i>
                {INICIALES[i]}
              </span>
            ))}
          </div>
          <div className="stats num">
            <Stat v={String(deLaSemana.length)} l={deLaSemana.length === 1 ? 'entrenamiento' : 'entrenamientos'} />
            <Stat v={`${numeroEntero(vol)} kg`} l="volumen" />
            <Stat v={minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${minutos % 60} min`} l="tiempo" />
          </div>
        </div>
      </div>
      {dialogo}
    </main>
  )
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="stat">
      <span className="v">{v}</span>
      <span className="l">{l}</span>
    </div>
  )
}
