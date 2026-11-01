import { Empty } from '../components/Empty'

export function Progreso() {
  return (
    <main className="screen">
      <div className="screen-head">
        <h1>Progreso</h1>
      </div>
      <Empty icon="trend" title="Todavía no hay datos" soon="Llega en la parte 5">
        Aquí verás tus gráficos, tus récords personales y los avisos sobre cómo vas.
      </Empty>
    </main>
  )
}
