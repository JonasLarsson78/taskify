import { useEffect, useState } from 'react'
import { buildAuthHeaders } from '../../../lib/request-headers'
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

  async function loadTasksForSpace(
    organizationId: number | null,
    spaceId: number | null
  ) {
    try {
      const url = organizationId
        ? `/api/task?organizationId=${organizationId}${
            spaceId ? `&spaceId=${spaceId}` : ''
          }`
        : '/api/task'
      const res = await fetch(url, { headers: buildAuthHeaders(token) })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte ladda tasks for space.')
        return
      }

      const taskData = (await res.json()) as ApiTask[]
      setTasks(Array.isArray(taskData) ? taskData : [])
    } catch (error) {
      console.error('load tasks for space error', error)
      setIntegrationError('Kunde inte ladda tasks for space.')
    }
  }

  async function loadSpacesForOrganization(organizationId: number | null) {
    if (!organizationId) {
      setSpaces([])
      setSelectedSpaceId(null)
      setSectionOptions([...DEFAULT_TASK_SECTIONS])
      setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
      return
    }

    try {
      const res = await fetch(`/api/space?organizationId=${organizationId}`, {
        headers: buildAuthHeaders(token),
      })
      if (!res.ok) {
        setSpaces([])
        setSelectedSpaceId(null)
        setSectionOptions([...DEFAULT_TASK_SECTIONS])
        setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
        return
      }

      const data = (await res.json()) as Space[]
      const nextSpaces = Array.isArray(data) ? data : []
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
      setSpaces([])
      setSelectedSpaceId(null)
      setSectionOptions([...DEFAULT_TASK_SECTIONS])
      setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
    }
  }

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

        const res = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          redirectToLogin()
          return
        }

        const verifyData = await res.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as StoreUser)
            : null

        let activeOrganizationId: number | null = null

        if (verifiedUser?.id) {
          setUser(verifiedUser)

          if (verifiedUser.organizationId) {
            setSelectedOrganizationId(verifiedUser.organizationId)
            activeOrganizationId = verifiedUser.organizationId
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

        const [usersRes, organizationsRes, tasksRes] = await Promise.all([
          fetch('/api/user', { headers: buildAuthHeaders(token) }),
          fetch('/api/organization', { headers: buildAuthHeaders(token) }),
          fetch(
            activeOrganizationId
              ? `/api/task?organizationId=${activeOrganizationId}`
              : '/api/task',
            { headers: buildAuthHeaders(token) }
          ),
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

        if (tasksRes.ok) {
          const taskData = (await tasksRes.json()) as ApiTask[]
          setTasks(Array.isArray(taskData) ? taskData : [])
        }

        if (verifiedUser?.organizationId) {
          await loadSpacesForOrganization(verifiedUser.organizationId)
        } else {
          setSpaces([])
          setSelectedSpaceId(null)
          setSectionOptions([...DEFAULT_TASK_SECTIONS])
          setSectionColors(
            normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS)
          )
        }

        if (!usersRes.ok || !organizationsRes.ok || !tasksRes.ok) {
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

  return {
    checking,
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
