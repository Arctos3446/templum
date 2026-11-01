import { HashRouter, Route, Routes } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { Inicio } from './screens/Inicio'
import { Rutinas } from './screens/Rutinas'
import { Progreso } from './screens/Progreso'
import { Historial } from './screens/Historial'
import { Ajustes } from './screens/Ajustes'

export function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<Inicio />} />
        </Routes>
        <TabBar />
      </div>
    </HashRouter>
  )
}
