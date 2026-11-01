import { NavLink, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { Wordmark } from './Logo'

const tabs: { to: string; label: string; icon: IconName; tambien?: string[] }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  // La biblioteca de ejercicios vive dentro de Rutinas.
  { to: '/rutinas', label: 'Rutinas', icon: 'list', tambien: ['/ejercicios'] },
  { to: '/progreso', label: 'Progreso', icon: 'chart' },
  { to: '/historial', label: 'Historial', icon: 'cal' },
  { to: '/ajustes', label: 'Ajustes', icon: 'gear' },
]

export function TabBar() {
  const { pathname } = useLocation()
  const activa = (t: (typeof tabs)[number]) =>
    t.to === '/' ? pathname === '/' : [t.to, ...(t.tambien ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <nav className="tabbar" aria-label="Navegación principal">
      <Wordmark className="only-pc" />
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={activa(t) ? 'tab active' : 'tab'} aria-current={activa(t) ? 'page' : undefined}>
          <Icon name={t.icon} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
