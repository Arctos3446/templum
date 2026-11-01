import { Empty } from '../components/Empty'
import { Icon } from '../components/Icon'

export function Rutinas() {
  return (
    <main className="screen">
      <div className="screen-head">
        <h1>Rutinas</h1>
        <button type="button" className="btn btn-ghost" disabled title="Disponible en la parte 2">
          <Icon name="plus" />
          Crear
        </button>
      </div>
      <Empty icon="list" title="Aún no tienes rutinas" soon="Llega en la parte 2">
        Aquí vas a crear y editar tus rutinas, y ver la biblioteca de 112 ejercicios.
      </Empty>
      <Empty icon="dumbbell" title="Biblioteca de ejercicios" soon="Llega en la parte 2">
        Con sus dibujos dorados y el mapa de músculos.
      </Empty>
    </main>
  )
}
