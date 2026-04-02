'use client'
import { useEffect, useState } from 'react'
import styles from './menu.module.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type MenuItem = { href: string; label: string }

const items: MenuItem[] = [
  { href: '/home', label: 'Home' },
  { href: '/test', label: 'Test' },
]

export default function Menu() {
  const [clientPath, setClientPath] = useState<string | null>(null)

  const pathname = usePathname()

  useEffect(() => {
    let raf = 0
    raf = requestAnimationFrame(() =>
      setClientPath(pathname ?? window.location.pathname)
    )
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  function normalize(p: string | null | undefined) {
    if (!p) return ''
    const noQuery = p.split('?')[0].split('#')[0]
    return noQuery.endsWith('/') && noQuery !== '/'
      ? noQuery.slice(0, -1)
      : noQuery
  }

  function isActive(href: string) {
    return normalize(clientPath) === normalize(href)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <span>MyApp</span>
          </div>

          <div className={styles.links}>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`${styles.link} ${
                  isActive(it.href) ? styles.active : ''
                }`}
              >
                {it.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          user
          <Link href="/logout" className={styles.link}>
            Logout
          </Link>
        </div>
      </div>
    </nav>
  )
}
