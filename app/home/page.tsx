"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.replace('/login')
        return
      }
      setChecking(false)
    } catch {
      router.replace('/login')
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
      <h1>Welcome to the Home Page</h1>
    </main>
  )
}

