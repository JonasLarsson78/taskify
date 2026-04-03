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
    <main className="center-screen">
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Logga in</h2>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          <div className={styles.labelTitle}>E-post</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          <div className={styles.labelTitle}>Lösenord</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
        </label>

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? 'Loggar in…' : 'Logga in'}
        </button>
      </form>
    </main>
  )
}
