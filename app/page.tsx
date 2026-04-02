'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from './components/loader/loader'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.replace('/login')
      } else {
        router.replace('/home')
      }
    } catch {
      router.replace('/login')
    }
  }, [router])

  return (
    <main className="center-screen">
      <Loader />
    </main>
  )
}
