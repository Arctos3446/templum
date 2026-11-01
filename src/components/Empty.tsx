import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

// Recuadro para cuando todavía no hay nada que mostrar.
export function Empty({ icon, title, children, soon }: { icon: IconName; title: string; children?: ReactNode; soon?: string }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <b>{title}</b>
      {children && <p>{children}</p>}
      {soon && <span className="soon">{soon}</span>}
    </div>
  )
}
