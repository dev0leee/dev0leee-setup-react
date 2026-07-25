import { NavLink } from 'react-router-dom'

import type { BottomNavigationProps } from '@/shared/types/bottomNavigation'
import { cn } from '@/shared/utils/cn'

export const BottomNavigation = ({ items, className }: BottomNavigationProps) => {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 flex h-16 border-t border-border bg-background',
        className,
      )}
    >
      {items.map(({ to, label, icon: Icon }) => {
        return (
          <NavLink
            key={to}
            // NavLink가 활성 여부를 넘겨주므로 현재 경로를 직접 비교하지 않는다.
            className={({ isActive }) => {
              return cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )
            }}
            to={to}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
