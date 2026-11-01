import { createHashRouter, Outlet, RouterProvider, useMatches } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { Inicio } from './screens/Inicio'
import { Rutinas } from './screens/Rutinas'
import { RutinaEditor } from './screens/RutinaEditor'
import { Biblioteca } from './screens/Biblioteca'
import { EjercicioDetalle } from './screens/EjercicioDetalle'
import { EjercicioForm } from './screens/EjercicioForm'
import { Progreso } from './screens/Progreso'
import { Historial } from './screens/Historial'
import { Ajustes } from './screens/Ajustes'

// Las pantallas "de enfoque" (editores) esconden el menú de abajo en el celular.
const enfoque = { enfoque: true }

function Marco() {
  const enfocado = useMatches().some((m) => (m.handle as { enfoque?: boolean } | undefined)?.enfoque)
  return (
    <div className={enfocado ? 'app enfocado' : 'app'}>
      <TabBar />
      <Outlet />
    </div>
  )
}

const router = createHashRouter([
  {
    element: <Marco />,
    children: [
      { path: '/', element: <Inicio /> },
      { path: '/rutinas', element: <Rutinas /> },
      { path: '/rutinas/nueva', element: <RutinaEditor />, handle: enfoque },
      { path: '/rutinas/:id', element: <RutinaEditor />, handle: enfoque },
      { path: '/ejercicios', element: <Biblioteca /> },
      { path: '/ejercicios/nuevo', element: <EjercicioForm />, handle: enfoque },
      { path: '/ejercicios/:id', element: <EjercicioDetalle /> },
      { path: '/ejercicios/:id/editar', element: <EjercicioForm />, handle: enfoque },
      { path: '/progreso', element: <Progreso /> },
      { path: '/historial', element: <Historial /> },
      { path: '/ajustes', element: <Ajustes /> },
      { path: '*', element: <Inicio /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
