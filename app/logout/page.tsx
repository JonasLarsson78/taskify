'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '../../lib/store'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      useStore.getState().logout()
    } catch {}
    router.replace('/login')
  }, [router])

  return null
}
