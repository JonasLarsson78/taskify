import { useCallback, useEffect, useState } from 'react'
import {
  buildAuthHeaders,
  buildJsonAuthHeaders,
} from '../../../lib/request-headers'
import { subscribeToWorkspaceEvents } from '../../../lib/realtime/client'
import { canWriteTasks } from '../../../lib/user-role'
import useStore from '../../../lib/store'
import type { Organization, Space, StoreUser } from '../../home/model'

type SettingsUser = StoreUser & {
  organization?: Organization | null
}

type UseSettingsPageParams = {
  token: string | null
  rehydrated: boolean
  organization: Organization | null
  setUser: (user: StoreUser) => void
  setOrganization: (organization: Organization | null) => void
  redirectToLogin: () => void
  redirectToHome: () => void
}

export default function useSettingsPage({
  token,
  rehydrated,
  organization,
  setUser,
  setOrganization,
  redirectToLogin,
  redirectToHome,
}: UseSettingsPageParams) {
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [currentUser, setCurrentUser] = useState<SettingsUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState<'sv' | 'en'>('sv')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<StoreUser[]>([])
  const [adminSpaces, setAdminSpaces] = useState<Space[]>([])
  const [adminBusy, setAdminBusy] = useState(false)
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<
    number | null
  >(null)
  const [memberSpaceDraftIds, setMemberSpaceDraftIds] = useState<number[]>([])
  const [adminOrgName, setAdminOrgName] = useState('')
  const [newAdminUserName, setNewAdminUserName] = useState('')
  const [newAdminUserEmail, setNewAdminUserEmail] = useState('')
  const [newAdminUserPassword, setNewAdminUserPassword] = useState('')
  const [newAdminUserRole, setNewAdminUserRole] = useState<
    'admin' | 'user' | 'guest'
  >('user')

  const reloadAdminData = useCallback(
    async (organizationId: number) => {
      if (!currentUser || currentUser.role !== 'admin') return

      const [usersResponse, spacesResponse, organizationResponse] =
        await Promise.all([
          fetch('/api/user', { headers: buildAuthHeaders(token) }),
          fetch(`/api/space?organizationId=${organizationId}`, {
            headers: buildAuthHeaders(token),
          }),
          fetch(`/api/organization/${organizationId}`, {
            headers: buildAuthHeaders(token),
          }),
        ])

      if (usersResponse.ok) {
        const users = (await usersResponse.json()) as StoreUser[]
        const safeUsers = Array.isArray(users) ? users : []
        setAdminUsers(safeUsers)

        if (selectedMemberUserId === null && safeUsers[0]?.id) {
          setSelectedMemberUserId(safeUsers[0].id)
        }
      }

      if (spacesResponse.ok) {
        const spaces = (await spacesResponse.json()) as Space[]
        const safeSpaces = Array.isArray(spaces) ? spaces : []
        setAdminSpaces(safeSpaces)

        if (selectedMemberUserId !== null) {
          const selectedUserSpaceIds = safeSpaces
            .filter((space) =>
              (space.memberIds || []).includes(selectedMemberUserId)
            )
            .map((space) => space.id)
          setMemberSpaceDraftIds(selectedUserSpaceIds)
        }
      }

      if (organizationResponse.ok) {
        const orgData = (await organizationResponse.json()) as Organization
        setOrganization(orgData)
        setAdminOrgName(orgData.name || '')
      }
    },
    [token, currentUser, selectedMemberUserId, setOrganization]
  )

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      try {
        if (!rehydrated) return
        if (!token) {
          redirectToLogin()
          return
        }

        const verifyResponse = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!verifyResponse.ok) {
          redirectToLogin()
          return
        }

        const verifyData = await verifyResponse.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as SettingsUser)
            : null

        if (!verifiedUser?.id) {
          redirectToHome()
          return
        }

        const userResponse = await fetch(`/api/user/${verifiedUser.id}`, {
          headers: buildAuthHeaders(token),
        })
        if (!userResponse.ok) {
          const data = await userResponse.json().catch(() => null)
          throw new Error(data?.error || 'Failed to load user settings')
        }

        const userData = (await userResponse.json()) as SettingsUser

        if (!mounted) return

        setCurrentUser(userData)
        setName(userData.name || '')
        setEmail(userData.email || '')
        setPreferredLanguage(userData.preferredLanguage === 'en' ? 'en' : 'sv')

        if (userData.role === 'admin' && userData.organizationId) {
          const [usersResponse, spacesResponse] = await Promise.all([
            fetch('/api/user', { headers: buildAuthHeaders(token) }),
            fetch(`/api/space?organizationId=${userData.organizationId}`, {
              headers: buildAuthHeaders(token),
            }),
          ])

          const users = usersResponse.ok
            ? ((await usersResponse.json()) as StoreUser[])
            : []
          const spaces = spacesResponse.ok
            ? ((await spacesResponse.json()) as Space[])
            : []

          const safeUsers = Array.isArray(users) ? users : []
          const safeSpaces = Array.isArray(spaces) ? spaces : []
          const initialUserId = safeUsers[0]?.id ?? null
          const initialUserSpaceIds =
            initialUserId === null
              ? []
              : safeSpaces
                  .filter((space) =>
                    (space.memberIds || []).includes(initialUserId)
                  )
                  .map((space) => space.id)

          if (mounted) {
            setAdminUsers(safeUsers)
            setAdminSpaces(safeSpaces)
            setSelectedMemberUserId(initialUserId)
            setMemberSpaceDraftIds(initialUserSpaceIds)
          }
        }
      } catch (loadError) {
        console.error('settings load error', loadError)
        if (mounted) {
          setError('Could not load user settings.')
        }
      } finally {
        if (mounted) setChecking(false)
      }
    }

    void loadSettings()

    return () => {
      mounted = false
    }
  }, [rehydrated, token, redirectToLogin, redirectToHome])

  useEffect(() => {
    const organizationId = currentUser?.organizationId
    if (!token || !organizationId) return

    return subscribeToWorkspaceEvents({
      token,
      organizationId,
      onEvent: (event) => {
        if (event.type === 'connected') return

        if (
          event.type === 'space.changed' ||
          event.type === 'user.changed' ||
          event.type === 'organization.changed'
        ) {
          void reloadAdminData(organizationId)
        }
      },
      onError: () => {
        // Ignore transient stream reconnect errors in the UI.
      },
    })
  }, [
    token,
    currentUser?.organizationId,
    currentUser?.role,
    selectedMemberUserId,
    reloadAdminData,
  ])

  useEffect(() => {
    if (!organization?.name) return
    setAdminOrgName((prev) => (prev ? prev : organization.name || ''))
  }, [organization?.name])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!currentUser?.id) return
    if (!canWriteTasks(currentUser.role || 'guest')) {
      setError('Guests can only read settings.')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/user/${currentUser.id}`, {
        method: 'PUT',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          password: password.trim() || null,
          preferredLanguage,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error || 'Failed to save settings.')
        return
      }

      const updatedUser = data as SettingsUser
      setCurrentUser(updatedUser)
      setUser({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        organizationId: updatedUser.organizationId,
        preferredLanguage: updatedUser.preferredLanguage === 'en' ? 'en' : 'sv',
      })
      setPreferredLanguage(updatedUser.preferredLanguage === 'en' ? 'en' : 'sv')
      setPassword('')
      setMessage('Settings saved.')
    } catch (saveError) {
      console.error('settings save error', saveError)
      setError('Failed to save settings.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAdminRoleUpdate(
    targetUserId: number,
    role: 'admin' | 'user' | 'guest'
  ) {
    setAdminBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/user/${targetUserId}`, {
        method: 'PUT',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify({ role }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error || 'Failed to update role.')
        return
      }

      setAdminUsers((prev) =>
        prev.map((user) =>
          user.id === targetUserId ? { ...user, role } : user
        )
      )

      if (currentUser?.id === targetUserId) {
        setCurrentUser((prev) => (prev ? { ...prev, role } : prev))
        const storeUser = useStore.getState().user
        if (storeUser) {
          setUser({ ...storeUser, role })
        }
      }

      setMessage('Role updated.')
    } catch (updateError) {
      console.error('role update error', updateError)
      setError('Failed to update role.')
    } finally {
      setAdminBusy(false)
    }
  }

  function handleSelectMemberUser(nextUserId: number) {
    setSelectedMemberUserId(nextUserId)
    const nextSpaceIds = adminSpaces
      .filter((space) => (space.memberIds || []).includes(nextUserId))
      .map((space) => space.id)
    setMemberSpaceDraftIds(nextSpaceIds)
  }

  async function persistSpaceMembers(spaceId: number, memberIds: number[]) {
    const response = await fetch(`/api/space/${spaceId}`, {
      method: 'PUT',
      headers: buildJsonAuthHeaders(token),
      body: JSON.stringify({ memberIds }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to update space members.')
    }

    const normalized = Array.isArray(data?.memberIds)
      ? data.memberIds.filter(
          (value: unknown): value is number => typeof value === 'number'
        )
      : memberIds

    return normalized
  }

  async function handleSaveUserSpaceMemberships() {
    if (!selectedMemberUserId) return

    setAdminBusy(true)
    setError(null)
    setMessage(null)

    try {
      const draftSet = new Set(memberSpaceDraftIds)

      const nextSpaces = await Promise.all(
        adminSpaces.map(async (space) => {
          const currentMemberIds = (space.memberIds || []).filter((id) =>
            Number.isInteger(id)
          )
          const hasMember = currentMemberIds.includes(selectedMemberUserId)
          const shouldHaveMember = draftSet.has(space.id)

          if (hasMember === shouldHaveMember) {
            return space
          }

          const nextMemberIds = shouldHaveMember
            ? [...currentMemberIds, selectedMemberUserId]
            : currentMemberIds.filter((id) => id !== selectedMemberUserId)

          const savedMemberIds = await persistSpaceMembers(
            space.id,
            nextMemberIds
          )
          return { ...space, memberIds: savedMemberIds }
        })
      )

      setAdminSpaces(nextSpaces)

      const selectedUserSpaces = nextSpaces
        .filter((space) =>
          (space.memberIds || []).includes(selectedMemberUserId)
        )
        .map((space) => space.id)
      setMemberSpaceDraftIds(selectedUserSpaces)

      setMessage('User space memberships updated.')
    } catch (updateError) {
      console.error('user space membership update error', updateError)
      setError('Failed to update user space memberships.')
    } finally {
      setAdminBusy(false)
    }
  }

  async function handleRemoveUserFromSpace(userId: number, spaceId: number) {
    setAdminBusy(true)
    setError(null)
    setMessage(null)

    try {
      const targetSpace = adminSpaces.find((space) => space.id === spaceId)
      if (!targetSpace) return

      const nextMemberIds = (targetSpace.memberIds || []).filter(
        (id) => id !== userId
      )
      const savedMemberIds = await persistSpaceMembers(spaceId, nextMemberIds)

      const nextSpaces = adminSpaces.map((space) =>
        space.id === spaceId ? { ...space, memberIds: savedMemberIds } : space
      )
      setAdminSpaces(nextSpaces)

      if (selectedMemberUserId === userId) {
        const selectedUserSpaces = nextSpaces
          .filter((space) => (space.memberIds || []).includes(userId))
          .map((space) => space.id)
        setMemberSpaceDraftIds(selectedUserSpaces)
      }

      setMessage('User removed from space.')
    } catch (updateError) {
      console.error('remove user from space error', updateError)
      setError('Failed to remove user from space.')
    } finally {
      setAdminBusy(false)
    }
  }

  async function handleSaveOrganization() {
    if (!currentUser?.organizationId) {
      setAdminBusy(true)
      return
    }

    const trimmedName = adminOrgName.trim()
    if (!trimmedName) {
      setError('Organization name cannot be empty.')
      return
    }

    setAdminBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/organization/${currentUser.organizationId}`,
        {
          method: 'PUT',
          headers: buildJsonAuthHeaders(token),
          body: JSON.stringify({ name: trimmedName }),
        }
      )

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error || 'Failed to save organization.')
        return
      }

      if (data && typeof data === 'object' && 'id' in data) {
        setOrganization(data as Organization)
      }
      setMessage('Organization saved.')
    } catch (saveError) {
      console.error('organization save error', saveError)
      setError('Failed to save organization.')
    } finally {
      setAdminBusy(false)
    }
  }

  async function handleCreateAdminUser() {
    if (!currentUser?.organizationId) {
      setError('Organization is required to create users.')
      return
    }

    const trimmedEmail = newAdminUserEmail.trim()
    const trimmedPassword = newAdminUserPassword.trim()

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setAdminBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify({
          name: newAdminUserName.trim() || null,
          email: trimmedEmail,
          password: trimmedPassword,
          role: newAdminUserRole,
          organizationId: currentUser.organizationId,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.error || 'Failed to create user.')
        return
      }

      const created = data as StoreUser
      setAdminUsers((prev) => {
        const next = [...prev, created]
        return next.sort((a, b) => (a.id > b.id ? -1 : 1))
      })

      setSelectedMemberUserId((prev) => prev ?? created.id)

      setNewAdminUserName('')
      setNewAdminUserEmail('')
      setNewAdminUserPassword('')
      setNewAdminUserRole('user')
      setMessage('User created.')
    } catch (createError) {
      console.error('create user error', createError)
      setError('Failed to create user.')
    } finally {
      setAdminBusy(false)
    }
  }

  return {
    checking,
    busy,
    currentUser,
    name,
    email,
    password,
    preferredLanguage,
    message,
    error,
    adminUsers,
    adminSpaces,
    adminBusy,
    selectedMemberUserId,
    memberSpaceDraftIds,
    adminOrgName,
    newAdminUserName,
    newAdminUserEmail,
    newAdminUserPassword,
    newAdminUserRole,
    setName,
    setEmail,
    setPassword,
    setPreferredLanguage,
    setMemberSpaceDraftIds,
    setAdminOrgName,
    setNewAdminUserName,
    setNewAdminUserEmail,
    setNewAdminUserPassword,
    setNewAdminUserRole,
    handleSubmit,
    handleCreateAdminUser,
    handleAdminRoleUpdate,
    handleSelectMemberUser,
    handleSaveUserSpaceMemberships,
    handleRemoveUserFromSpace,
    handleSaveOrganization,
  }
}
