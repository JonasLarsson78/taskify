'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import useStore from '../../lib/store'
import { buildAuthHeaders } from '../../lib/request-headers'
import { getContent } from '../../lib/content'
import LoginShowcase from './_components/login-showcase'
import LoginForm from './_components/login-form'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const user = useStore((state) => state.user)
  const ui = getContent(user?.preferredLanguage)

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

      router.push('/home')
    } catch {
      setError(ui.login.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.shell}>
      <LoginShowcase content={ui.login} />
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
  )
}
