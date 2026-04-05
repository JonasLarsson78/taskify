'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from './components/loader/loader'
import useStore from '../lib/store'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)

  function isMobileOrStandaloneApp() {
    if (typeof window === 'undefined') return false

    const mobileUserAgent =
      /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(
        navigator.userAgent
      )
    const standaloneByMedia = window.matchMedia(
      '(display-mode: standalone)'
    ).matches
    const standaloneBySafari =
      'standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)

    return mobileUserAgent || standaloneByMedia || standaloneBySafari
  }

  useEffect(() => {
    if (!rehydrated) return
    try {
      if (!token) {
        router.replace('/login')
      } else {
        router.replace(isMobileOrStandaloneApp() ? '/mobil' : '/home')
      }
    } catch {
      router.replace('/login')
    }
  }, [router, token, rehydrated])

  return (
    <main className={styles.root}>
      <div className={styles.glowLeft} aria-hidden />
      <div className={styles.glowRight} aria-hidden />

      <section className={styles.card} aria-live="polite">
        <div className={styles.brandRow}>
          <span className={styles.brandMark} aria-hidden />
          <div>
            <p className={styles.kicker}>Taskify</p>
            <h1 className={styles.title}>Preparing your workspace</h1>
          </div>
        </div>

        <p className={styles.subtitle}>
          We are checking your session and taking you to the right page.
        </p>

        <div className={styles.loaderWrap}>
          <Loader size="lg" message="Starting up" />
        </div>

        <div className={styles.progressRow} aria-hidden>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </section>
    </main>
  )
}
