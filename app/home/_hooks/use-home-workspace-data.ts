import { useCallback, useEffect, useRef, useState } from 'react'
import { verifySessionCached } from '../../../lib/auth/session-client'
import { buildAuthHeaders } from '../../../lib/request-headers'
import { subscribeToWorkspaceEvents } from '../../../lib/realtime/client'
import {
  DEFAULT_TASK_SECTIONS,
  normalizeSectionColorMap,
  normalizeSectionList,
  type ApiTask,
  type Organization,
  type Space,
  type StoreUser,
} from '../model'

type UseHomeWorkspaceDataParams = {
  token: string | null
  rehydrated: boolean
  setUser: (user: StoreUser | null) => void
  setOrganization: (organization: Organization | null) => void
  setTasks: React.Dispatch<React.SetStateAction<ApiTask[]>>
  setIntegrationError: React.Dispatch<React.SetStateAction<string | null>>
  redirectToLogin: () => void
}

const TASK_CACHE_TTL_MS = 20_000

export default function useHomeWorkspaceData({
  token,
  rehydrated,
  setUser,
  setOrganization,
  setTasks,
  setIntegrationError,
  redirectToLogin,
}: UseHomeWorkspaceDataParams) {
  const [checking, setChecking] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [users, setUsers] = useState<StoreUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | null
  >(null)
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null)
  const [sectionOptions, setSectionOptions] = useState<string[]>([
    ...DEFAULT_TASK_SECTIONS,
  ])
  const [sectionColors, setSectionColors] = useState<Record<string, string>>(
    () => normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS)
  )
  const realtimeSubscribedAtRef = useRef(0)
  const taskRequestIdRef = useRef(0)
  const taskCacheRef = useRef<Map<string, ApiTask[]>>(new Map())
  const taskCacheFetchedAtRef = useRef<Map<string, number>>(new Map())
  const taskInFlightRef = useRef<Map<string, Promise<ApiTask[] | null>>>(
    new Map()
  )
  const spacesInFlightRef = useRef<Map<number, Promise<Space[] | null>>>(
    new Map()
  )
  const taskRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const loadTasksForSpace = useCallback(
    async (
      organizationId: number | null,
      spaceId: number | null,
      options?: { forceRefresh?: boolean }
    ) => {
      const cacheKey = `${organizationId ?? 'none'}:${spaceId ?? 'none'}`
      const cached = taskCacheRef.current.get(cacheKey)
      const cachedAt = taskCacheFetchedAtRef.current.get(cacheKey) ?? 0
      const now = Date.now()
      const isFresh = cachedAt > 0 && now - cachedAt < TASK_CACHE_TTL_MS

      if (cached && isFresh && !options?.forceRefresh) {
        setTasks(cached)
        setTasksLoading(false)
        return
      }

      const requestId = ++taskRequestIdRef.current

      if (cached) {
        setTasks(cached)
      }

      const inFlight = taskInFlightRef.current.get(cacheKey)
      if (inFlight && !options?.forceRefresh) {
        await inFlight
        return
      }

      setTasksLoading(true)

      try {
        const url = organizationId
          ? `/api/task?organizationId=${organizationId}${
              spaceId ? `&spaceId=${spaceId}` : ''
            }`
          : '/api/task'
        const request = fetch(url, { headers: buildAuthHeaders(token) })
          .then(async (res) => {
            if (!res.ok) return null
            const taskData = (await res.json()) as ApiTask[]
            return Array.isArray(taskData) ? taskData : []
          })
          .finally(() => {
            taskInFlightRef.current.delete(cacheKey)
          })
        taskInFlightRef.current.set(cacheKey, request)

        const normalizedTasks = await request

        if (requestId !== taskRequestIdRef.current) return

        if (!normalizedTasks) {
          setIntegrationError(
            'Kunde inte ladda tasks for space.'
          )
          return
        }

        taskCacheRef.current.set(cacheKey, normalizedTasks)
        taskCacheFetchedAtRef.current.set(cacheKey, Date.now())
        setTasks(normalizedTasks)
      } catch (error) {
        if (requestId !== taskRequestIdRef.current) return
        console.error('load tasks for space error', error)
        setIntegrationError('Kunde inte ladda tasks for space.')
      } finally {
        if (requestId === taskRequestIdRef.current) {
          setTasksLoading(false)
        }
      }
    },
    [token, setIntegrationError, setTasks]
  )

  const loadSpacesForOrganization = useCallback(
    async (organizationId: number | null) => {
      if (!organizationId) {
        taskCacheRef.current.clear()
        taskCacheFetchedAtRef.current.clear()
        setSpaces([])
        setSelectedSpaceId(null)
        setSectionOptions([...DEFAULT_TASK_SECTIONS])
        setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
        setTasksLoading(false)
        return
      }

      try {
        const inFlight = spacesInFlightRef.current.get(organizationId)
        const request =
          inFlight ||
          fetch(`/api/space?organizationId=${organizationId}`, {
            headers: buildAuthHeaders(token),
          })
            .then(async (res) => {
              if (!res.ok) return null
              const data = (await res.json()) as Space[]
              return Array.isArray(data) ? data : []
            })
            .finally(() => {
              spacesInFlightRef.current.delete(organizationId)
            })

        if (!inFlight) {
          spacesInFlightRef.current.set(organizationId, request)
        }

        const nextSpaces = await request

        if (!nextSpaces) {
          taskCacheRef.current.clear()
          taskCacheFetchedAtRef.current.clear()
          setSpaces([])
          setSelectedSpaceId(null)
          setSectionOptions([...DEFAULT_TASK_SECTIONS])
          setSectionColors(
            normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS)
          )
          setTasksLoading(false)
          return
        }

        setSpaces(nextSpaces)

        const nextSelectedSpaceId = nextSpaces[0]?.id ?? null
        setSelectedSpaceId(nextSelectedSpaceId)

        const activeSpace = nextSpaces.find(
          (space) => space.id === nextSelectedSpaceId
        )
        const nextSections = normalizeSectionList(activeSpace?.taskSections)
        const nextColors = normalizeSectionColorMap(
          activeSpace?.taskSectionColors,
          nextSections
        )

        setSectionOptions(nextSections)
        setSectionColors(nextColors)
        await loadTasksForSpace(organizationId, nextSelectedSpaceId)
      } catch (error) {
        console.error('load spaces for organization error', error)
        taskCacheRef.current.clear()
        taskCacheFetchedAtRef.current.clear()
        setSpaces([])
        setSelectedSpaceId(null)
        setSectionOptions([...DEFAULT_TASK_SECTIONS])
        setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
        setTasksLoading(false)
      }
    },
    [token, loadTasksForSpace]
  )

  const queueTaskRefresh = useCallback(
    (organizationId: number | null, spaceId: number | null) => {
      if (!organizationId) return

      if (taskRefreshTimeoutRef.current) {
        clearTimeout(taskRefreshTimeoutRef.current)
      }

      // Coalesce rapid realtime task events into a single fetch.
      taskRefreshTimeoutRef.current = setTimeout(() => {
        taskRefreshTimeoutRef.current = null
        void loadTasksForSpace(organizationId, spaceId, {
          forceRefresh: true,
        })
      }, 350)
    },
    [loadTasksForSpace]
  )

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let mounted = true

    async function verify() {
      try {
        if (!rehydrated) return
        if (!token) {
          redirectToLogin()
          return
        }

        const verifyResult = await verifySessionCached<StoreUser>(token)
        if (!verifyResult.ok) {
          redirectToLogin()
          return
        }

        const verifiedUser = verifyResult.user

        if (verifiedUser?.id) {
          setUser(verifiedUser)

          if (verifiedUser.organizationId) {
            setSelectedOrganizationId(verifiedUser.organizationId)
            const orgRes = await fetch(
              `/api/organization/${verifiedUser.organizationId}`,
              { headers: buildAuthHeaders(token) }
            )
            if (orgRes.ok) {
              const orgData = (await orgRes.json()) as Organization
              setOrganization(orgData)
            } else {
              setOrganization(null)
            }
          } else {
            setOrganization(null)
          }
        }

        const [usersRes, organizationsRes] = await Promise.all([
          fetch('/api/user', { headers: buildAuthHeaders(token) }),
          fetch('/api/organization', { headers: buildAuthHeaders(token) }),
        ])

        if (usersRes.ok) {
          const usersData = (await usersRes.json()) as StoreUser[]
          setUsers(Array.isArray(usersData) ? usersData : [])
        }

        if (organizationsRes.ok) {
          const organizationsData =
            (await organizationsRes.json()) as Organization[]
          setOrganizations(
            Array.isArray(organizationsData) ? organizationsData : []
          )
        }

        if (verifiedUser?.organizationId) {
          await loadSpacesForOrganization(verifiedUser.organizationId)
        } else {
          taskCacheRef.current.clear()
          taskCacheFetchedAtRef.current.clear()
          setSpaces([])
          setSelectedSpaceId(null)
          setSectionOptions([...DEFAULT_TASK_SECTIONS])
          setSectionColors(
            normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS)
          )
        }

        if (!usersRes.ok || !organizationsRes.ok) {
          setIntegrationError('Viss dashboard-data kunde inte laddas.')
        }

        if (mounted) setChecking(false)
      } catch (error) {
        console.error('verify error', error)
        setIntegrationError('Kunde inte ladda dashboard-data.')
        redirectToLogin()
      }
    }

    void verify()

    return () => {
      mounted = false
    }
  }, [token, rehydrated, setUser, setOrganization])
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!token || !selectedOrganizationId) return

    realtimeSubscribedAtRef.current = Date.now()

    const unsubscribe = subscribeToWorkspaceEvents({
      token,
      organizationId: selectedOrganizationId,
      onEvent: (event) => {
        if (event.type === 'connected') return

        // Ignore replayed history from before this subscription.
        if (event.at < realtimeSubscribedAtRef.current - 1000) return

        void (async () => {
          if (
            event.type === 'space.changed' ||
            event.type === 'organization.changed'
          ) {
            await loadSpacesForOrganization(selectedOrganizationId)
            return
          }

          if (event.type === 'user.changed') {
            const usersRes = await fetch('/api/user', {
              headers: buildAuthHeaders(token),
            })
            if (usersRes.ok) {
              const usersData = (await usersRes.json()) as StoreUser[]
              setUsers(Array.isArray(usersData) ? usersData : [])
            }

            return
          }

          if (event.type === 'task.changed') {
            queueTaskRefresh(selectedOrganizationId, selectedSpaceId)
          }
        })()
      },
      onError: () => {
        // Ignore transient stream reconnect errors in the UI.
      },
    })

    return () => {
      unsubscribe()
      if (taskRefreshTimeoutRef.current) {
        clearTimeout(taskRefreshTimeoutRef.current)
        taskRefreshTimeoutRef.current = null
      }
    }
  }, [
    token,
    selectedOrganizationId,
    selectedSpaceId,
    queueTaskRefresh,
    loadSpacesForOrganization,
  ])

  return {
    checking,
    tasksLoading,
    users,
    organizations,
    spaces,
    selectedOrganizationId,
    selectedSpaceId,
    sectionOptions,
    sectionColors,
    setSpaces,
    setSelectedSpaceId,
    setSectionOptions,
    setSectionColors,
    loadTasksForSpace,
    loadSpacesForOrganization,
  }
}
