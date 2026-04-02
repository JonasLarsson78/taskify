'use client'

import { usePathname } from 'next/navigation'
import Menu from '../menu/menu'

export default function Header() {
  const pathname = usePathname()

  // hide menu on login page
  if (pathname === '/login') return null

  return (
    <header className="w-full border-b border-transparent px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <Menu />
      </div>
    </header>
  )
}
