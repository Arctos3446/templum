import { Link } from 'react-router-dom'
import { useEjercicios } from '../db/ejercicios'
import { ListaEjercicios } from '../components/ListaEjercicios'
import { Icon } from '../components/Icon'
import { Volver } from '../components/Volver'

export function Biblioteca() {
  const ejercicios = useEjercicios()

  return (
    <main className="screen">
      <Volver a="/rutinas" texto="Rutinas" />
      <div className="screen-head">
        <h1>Ejercicios</h1>
        <Link to="/ejercicios/nuevo" className="btn btn-ghost">
          <Icon name="plus" />
          Crear
        </Link>
      </div>
      {ejercicios && <ListaEjercicios ejercicios={ejercicios} clave="biblioteca" modo="ver" />}
    </main>
  )
}
