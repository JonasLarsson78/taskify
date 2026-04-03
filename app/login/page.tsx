'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import useStore from '../../lib/store'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError(data?.error || 'Login failed')
        setLoading(false)
        return
      }

      if (data.token) {
        try {
          useStore.getState().setToken(data.token)
          if (data.user) useStore.getState().setUser(data.user)
          if (data.user?.organizationId) {
            const resOrg = await fetch(
              `/api/organization/${data.user.organizationId}`
            )
            if (resOrg.ok) {
              const orgData = await resOrg.json()
              useStore.getState().setOrganization(orgData)
            } else {
              console.error('Failed to fetch organization data')
            }
          }
        } catch {}
      }

      router.push('/home')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.showcase}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark} />
          <div>
            <div className={styles.brandTitle}>Taskify</div>
            <div className={styles.brandSub}>
              Workspace for high velocity teams
            </div>
          </div>
        </div>

        <h1 className={styles.headline}>
          Planera smartare. Leverera snabbare.
        </h1>
        <p className={styles.lead}>
          Samla goals, tasks och execution i ett tydligt flode for hela teamet.
        </p>

        <div className={styles.kpiGrid}>
          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Active Projects</div>
            <div className={styles.kpiValue}>12</div>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Tasks Closed</div>
            <div className={styles.kpiValue}>184</div>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Cycle Time</div>
            <div className={styles.kpiValue}>-28%</div>
          </article>
        </div>
      </section>

      <section className={styles.authPanel}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>Logga in</h2>
          <p className={styles.subtitle}>
            Fortsatt till din workspace-oversikt
          </p>

          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>
            <div className={styles.labelTitle}>E-post</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="name@company.com"
            />
          </label>

          <label className={styles.label}>
            <div className={styles.labelTitle}>Losenord</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
      </section>
    </main>
  )
}
