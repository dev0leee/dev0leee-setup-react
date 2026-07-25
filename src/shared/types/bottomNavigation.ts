import type { LucideIcon } from 'lucide-react'

export interface BottomNavigationItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface BottomNavigationProps {
  items: BottomNavigationItem[]
  className?: string
}
