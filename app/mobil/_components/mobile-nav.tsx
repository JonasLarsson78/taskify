'use client'

import { useRouter } from 'next/navigation'
import { Archive, CircleDot, House, LogOut, Target } from 'lucide-react'
import styles from '../page.module.css'

type ActiveItem = 'home' | 'goals' | 'archive' | 'log'

type MobileNavProps = {
  active: ActiveItem
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: House, href: '/mobil' },
  { id: 'goals', label: 'Goals', Icon: Target, href: '/mobil/goals' },
  { id: 'archive', label: 'Archive', Icon: Archive, href: '/mobil/archive' },
  { id: 'log', label: 'Log', Icon: CircleDot, href: '/mobil/log' },
  { id: 'logout', label: 'Logout', Icon: LogOut, href: '/logout' },
] as const

export default function MobileNav({ active }: MobileNavProps) {
  const router = useRouter()

  return (
    <nav className={styles.bottomNav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ id, label, Icon, href }) => (
        <button
          key={id}
          type="button"
          className={`${styles.navItem} ${
            active === id ? styles.navItemActive : ''
          }`}
          onClick={() => router.push(href)}
          aria-label={label}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon
            className={styles.navIcon}
            strokeWidth={active === id ? 2.5 : 1.8}
          />
          <span className={styles.navLabel}>{label}</span>
        </button>
      ))}
    </nav>
  )
}
