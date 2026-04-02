'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    async function verify() {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.replace('/login')
          return
        }

        const res = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          router.replace('/login')
          return
        }

        if (mounted) setChecking(false)
      } catch (e) {
        console.error('verify error', e)
        router.replace('/login')
      }
    }

    void verify()

    return () => {
      mounted = false
    }
  }, [router])

  if (checking) {
    return (
      <main className="center-screen">
        <Loader />
      </main>
    )
  }

  return (
    <main className="center-screen">
      <h1>{`Welcome to the => Home Page`}</h1>
    </main>
  )
}
