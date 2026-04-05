'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '../../lib/store'
import Loader from '../components/loader/loader'
import styles from './page.module.css'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/login')
    }, 120)

    void (async () => {
      try {
        // Inform the server to clear the HttpOnly cookie
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'same-origin',
        })
      } catch {}

      try {
        useStore.getState().logout()
      } catch {}
    })()

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <Loader message="Logging out..." />
      </div>
    </main>
  )
}
