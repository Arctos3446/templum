import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { Wordmark } from './Logo'

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/rutinas', label: 'Rutinas', icon: 'list' },
  { to: '/progreso', label: 'Progreso', icon: 'chart' },
  { to: '/historial', label: 'Historial', icon: 'cal' },
  { to: '/ajustes', label: 'Ajustes', icon: 'gear' },
]

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navegación principal">
      <Wordmark className="only-pc" />
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <Icon name={t.icon} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
