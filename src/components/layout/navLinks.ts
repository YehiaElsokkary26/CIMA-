import { Home, CircleCheck, Plus, LayoutGrid, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  isUpload?: boolean
}

/** Main destinations. Upload only appears for filmmakers. */
export function mainNav(isFilmmaker: boolean): NavItem[] {
  const items: NavItem[] = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/vote', label: 'Vote', icon: CircleCheck },
  ]
  if (isFilmmaker) items.push({ to: '/upload', label: 'Upload', icon: Plus, isUpload: true })
  items.push(
    { to: '/discover', label: 'Discover', icon: LayoutGrid },
    { to: '/crew', label: 'Crew', icon: Users },
  )
  return items
}
