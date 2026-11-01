import { Empty } from '../components/Empty'

export function Historial() {
  return (
    <main className="screen">
      <div className="screen-head">
        <h1>Historial</h1>
      </div>
      <Empty icon="cal" title="Aún no has entrenado" soon="Llega en la parte 4">
        Aquí verás el calendario con los días que entrenaste y el detalle de cada sesión.
      </Empty>
    </main>
  )
}
