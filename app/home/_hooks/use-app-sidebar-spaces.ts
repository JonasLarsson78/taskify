import { useEffect, useState } from 'react'
import { buildAuthHeaders } from '../../../lib/request-headers'
import type { Space } from '../model'

const SIDEBAR_SPACES_TTL_MS = 20_000
const sidebarSpacesCache = new Map<
  number,
  { data: Space[]; fetchedAt: number }
>()

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

      const cached = sidebarSpacesCache.get(organizationId)
      if (cached && Date.now() - cached.fetchedAt < SIDEBAR_SPACES_TTL_MS) {
        if (mounted) {
          setSpaces(cached.data)
        }
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
        const normalized = Array.isArray(data) ? data : []
        sidebarSpacesCache.set(organizationId, {
          data: normalized,
          fetchedAt: Date.now(),
        })

        if (mounted) {
          setSpaces(normalized)
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
