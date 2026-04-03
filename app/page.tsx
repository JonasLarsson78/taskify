'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from './components/loader/loader'
import useStore from '../lib/store'

export default function Home() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)

  useEffect(() => {
    if (!rehydrated) return
    try {
      if (!token) {
        router.replace('/login')
      } else {
        router.replace('/home')
      }
    } catch {
      router.replace('/login')
    }
  }, [router, token, rehydrated])

  return (
    <main className="center-screen">
      <Loader />
    </main>
  )
}
