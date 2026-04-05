'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import useStore from '../../lib/store'
import { buildAuthHeaders } from '../../lib/request-headers'
import { getContent } from '../../lib/content'
import LoginShowcase from './_components/login-showcase'
import LoginForm from './_components/login-form'
import LoginMobile from './_components/login-mobile'

type LoginMetrics = {
  activeProjects: number
  tasksClosed: number
  leadTimeDays: number | null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<LoginMetrics | null>(null)
  const user = useStore((state) => state.user)
  const rehydrated = useStore((state) => state.rehydrated)
  const ui = getContent(rehydrated ? user?.preferredLanguage : 'sv')

  useEffect(() => {
    let cancelled = false

    async function loadMetrics() {
      try {
        const res = await fetch('/api/login-metrics', { cache: 'no-store' })
        if (!res.ok) return

        const data = (await res.json()) as Partial<LoginMetrics>
        if (cancelled) return

        setMetrics({
          activeProjects:
            typeof data.activeProjects === 'number' ? data.activeProjects : 0,
          tasksClosed:
            typeof data.tasksClosed === 'number' ? data.tasksClosed : 0,
          leadTimeDays:
            typeof data.leadTimeDays === 'number' ? data.leadTimeDays : null,
        })
      } catch {
        // ignore metrics fetch errors on login page
      }
    }

    void loadMetrics()
    const intervalId = window.setInterval(() => {
      void loadMetrics()
    }, 45000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || ui.login.loginFailed)
        setLoading(false)
        return
      }

      if (data.token) {
        try {
          useStore.getState().setToken(data.token)
          if (data.user) useStore.getState().setUser(data.user)
          if (data.user?.organizationId) {
            const resOrg = await fetch(
              `/api/organization/${data.user.organizationId}`,
              { headers: buildAuthHeaders(data.token) }
            )
            if (resOrg.ok) {
              const orgData = await resOrg.json()
              useStore.getState().setOrganization(orgData)
            } else {
              useStore.getState().setOrganization(null)
            }
          } else {
            useStore.getState().setOrganization(null)
          }
        } catch {}
      }

      // Redirect to /mobil on mobile, otherwise /home
      const isMobile = typeof window !== 'undefined' && /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent)
      router.push(isMobile ? '/mobil' : '/home')
    } catch {
      setError(ui.login.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className={`${styles.shell} ${styles.desktopOnly}`}>
        <LoginShowcase content={ui.login} metrics={metrics} />
        <LoginForm
          email={email}
          password={password}
          loading={loading}
          error={error}
          content={ui.login}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          onSubmit={handleSubmit}
        />
      </main>

      <section className={styles.mobileOnly}>
        <LoginMobile
          email={email}
          password={password}
          loading={loading}
          error={error}
          content={ui.login}
          metrics={metrics}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          onSubmit={handleSubmit}
        />
      </section>
    </>
  )
}
