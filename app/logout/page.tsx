'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      localStorage.removeItem('token')
    } catch {}
    router.replace('/login')
  }, [router])

  return null
}
