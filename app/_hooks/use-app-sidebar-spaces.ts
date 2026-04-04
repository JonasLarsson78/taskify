import { useEffect, useState } from 'react'
import { buildAuthHeaders } from '../../lib/request-headers'
import type { Space } from '../home/model'

type UseAppSidebarSpacesParams = {
  token: string | null
  organizationId: number | null | undefined
}

export default function useAppSidebarSpaces({
  token,
  organizationId,
}: UseAppSidebarSpacesParams) {
  const [spaces, setSpaces] = useState<Space[]>([])

  useEffect(() => {
    let mounted = true

    async function loadSpaces() {
      if (!token || !organizationId) {
        if (mounted) setSpaces([])
        return
      }

      try {
        const res = await fetch(`/api/space?organizationId=${organizationId}`, {
          headers: buildAuthHeaders(token),
        })

        if (!res.ok) {
          if (mounted) setSpaces([])
          return
        }

        const data = (await res.json()) as Space[]

        if (mounted) {
          setSpaces(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('load app sidebar spaces error', error)
        if (mounted) setSpaces([])
      }
    }

    void loadSpaces()

    return () => {
      mounted = false
    }
  }, [token, organizationId])

  return spaces
}
