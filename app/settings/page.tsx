'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import {
  buildAuthHeaders,
  buildJsonAuthHeaders,
} from '../../lib/request-headers'
import useStore from '../../lib/store'
import type { Organization, Space, StoreUser } from '../home/model'
import styles from '../home/page.module.css'
import { canWriteTasks } from '../../lib/user-role'

type SettingsUser = StoreUser & {
  organization?: Organization | null
}

export default function SettingsPage() {
  const router = useRouter()
  const token = useStore((state) => state.token)
  const rehydrated = useStore((state) => state.rehydrated)
  const setUser = useStore((state) => state.setUser)
  const setOrganization = useStore((state) => state.setOrganization)
  const organization = useStore((state) => state.organization)

  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [currentUser, setCurrentUser] = useState<SettingsUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      try {
        if (!rehydrated) return
        if (!token) {
          router.replace('/login')
          return
        }

        const verifyResponse = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!verifyResponse.ok) {
          router.replace('/login')
          return
        }

        const verifyData = await verifyResponse.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as SettingsUser)
            : null

        if (!verifiedUser?.id) {
          router.replace('/home')
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
        if (organization?.name) {
          setAdminOrgName(organization.name)
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rehydrated, router, token])

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
      })
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

    const email = newAdminUserEmail.trim()
    const password = newAdminUserPassword.trim()

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
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
          email,
          password,
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

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message="Loading user settings..." />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <section className={`${styles.content} ${styles.settingsContent}`}>
        <div className={`${styles.topbar} ${styles.settingsTopbar}`}>
          <div className={styles.workspaceMeta}>
            <span className={styles.workspaceBadge}>⚙</span>
            <div>
              <div className={styles.workspaceTitle}>User Settings</div>
              <div className={styles.workspaceSub}>
                Update your profile and sign-in details.
              </div>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <button
              className={styles.modalCancel}
              type="button"
              onClick={() => router.push('/home')}
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className={styles.settingsStack}>
          <form
            className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
            onSubmit={handleSubmit}
          >
            <div className={styles.settingsPanelHeader}>
              <div className={styles.settingsPanelTitle}>Profile</div>
              <div className={styles.settingsHelp}>
                Personal and sign-in details
              </div>
            </div>

            <div
              className={`${styles.settingsGrid} ${styles.settingsGridWide}`}
            >
              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>Name</span>
                <input
                  className={styles.createInput}
                  type="text"
                  value={name}
                  disabled={!canWriteTasks(currentUser?.role || 'guest')}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>Email</span>
                <input
                  className={styles.createInput}
                  type="email"
                  value={email}
                  disabled={!canWriteTasks(currentUser?.role || 'guest')}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                />
              </label>

              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>Role</span>
                <input
                  className={styles.createInput}
                  type="text"
                  value={currentUser?.role || 'user'}
                  disabled
                />
              </label>

              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>New Password</span>
                <input
                  className={styles.createInput}
                  type="password"
                  value={password}
                  disabled={!canWriteTasks(currentUser?.role || 'guest')}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Leave empty to keep current password"
                />
                <span className={styles.settingsHelp}>
                  Minimum 6 characters. Leave blank if you do not want to change
                  it.
                </span>
              </label>

              <div
                className={`${styles.settingsField} ${styles.settingsFieldFull}`}
              >
                <span className={styles.sectionLabel}>Organization</span>
                <input
                  className={styles.createInput}
                  type="text"
                  value={organization?.name || 'No organization'}
                  disabled
                />
              </div>
            </div>

            {error ? <div className={styles.taskMeta}>{error}</div> : null}
            {message ? <div className={styles.taskMeta}>{message}</div> : null}

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                type="button"
                disabled={busy}
                onClick={() => router.push('/home')}
              >
                Cancel
              </button>
              <button
                className={styles.createTaskButton}
                type="submit"
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {currentUser?.role === 'admin' ? (
            <section
              className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
            >
              <div className={styles.settingsPanelHeader}>
                <div className={styles.settingsPanelTitle}>Admin: Users</div>
                <div className={styles.settingsHelp}>
                  Create users and adjust roles
                </div>
              </div>

              <div
                className={`${styles.settingsGrid} ${styles.settingsGridWide}`}
              >
                <label className={styles.settingsField}>
                  <span className={styles.sectionLabel}>New user name</span>
                  <input
                    className={styles.createInput}
                    type="text"
                    value={newAdminUserName}
                    disabled={adminBusy}
                    placeholder="Optional"
                    onChange={(event) =>
                      setNewAdminUserName(event.target.value)
                    }
                  />
                </label>

                <label className={styles.settingsField}>
                  <span className={styles.sectionLabel}>New user email</span>
                  <input
                    className={styles.createInput}
                    type="email"
                    value={newAdminUserEmail}
                    disabled={adminBusy}
                    placeholder="name@company.com"
                    onChange={(event) =>
                      setNewAdminUserEmail(event.target.value)
                    }
                  />
                </label>

                <label className={styles.settingsField}>
                  <span className={styles.sectionLabel}>
                    Temporary password
                  </span>
                  <input
                    className={styles.createInput}
                    type="password"
                    value={newAdminUserPassword}
                    disabled={adminBusy}
                    placeholder="At least 6 characters"
                    onChange={(event) =>
                      setNewAdminUserPassword(event.target.value)
                    }
                  />
                </label>

                <label className={styles.settingsField}>
                  <span className={styles.sectionLabel}>Role</span>
                  <select
                    className={styles.createSelect}
                    value={newAdminUserRole}
                    disabled={adminBusy}
                    onChange={(event) =>
                      setNewAdminUserRole(
                        event.target.value as 'admin' | 'user' | 'guest'
                      )
                    }
                  >
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                    <option value="guest">guest</option>
                  </select>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.createTaskButton}
                  type="button"
                  disabled={adminBusy}
                  onClick={() => {
                    void handleCreateAdminUser()
                  }}
                >
                  {adminBusy ? 'Creating...' : 'Create User'}
                </button>
              </div>

              <div className={styles.settingsRoleList}>
                {adminUsers.map((adminUser) => (
                  <div key={adminUser.id} className={styles.settingsRoleRow}>
                    <div className={styles.settingsRoleIdentity}>
                      {adminUser.name ||
                        adminUser.email ||
                        `User ${adminUser.id}`}
                    </div>
                    <select
                      className={styles.createSelect}
                      value={adminUser.role || 'user'}
                      disabled={adminBusy}
                      onChange={(event) => {
                        void handleAdminRoleUpdate(
                          adminUser.id,
                          event.target.value as 'admin' | 'user' | 'guest'
                        )
                      }}
                    >
                      <option value="admin">admin</option>
                      <option value="user">user</option>
                      <option value="guest">guest</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {currentUser?.role === 'admin' ? (
            <section
              className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
            >
              <div className={styles.settingsPanelHeader}>
                <div className={styles.settingsPanelTitle}>
                  Admin: Space Members
                </div>
                <div className={styles.settingsHelp}>
                  Manage memberships both by space and by user
                </div>
              </div>

              <div
                className={`${styles.settingsGrid} ${styles.settingsGridWide}`}
              >
                <label className={styles.settingsField}>
                  <span className={styles.sectionLabel}>User</span>
                  <select
                    className={styles.createSelect}
                    value={selectedMemberUserId ?? ''}
                    onChange={(event) =>
                      handleSelectMemberUser(
                        Number.parseInt(event.target.value, 10)
                      )
                    }
                  >
                    {adminUsers.map((adminUser) => (
                      <option key={adminUser.id} value={adminUser.id}>
                        {adminUser.name ||
                          adminUser.email ||
                          `User ${adminUser.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.settingsField}>
                  <span className={styles.sectionLabel}>Spaces for user</span>
                  <select
                    className={styles.createSelect}
                    multiple
                    value={memberSpaceDraftIds.map(String)}
                    onChange={(event) => {
                      const nextIds = Array.from(
                        event.target.selectedOptions
                      ).map((option) => Number.parseInt(option.value, 10))
                      setMemberSpaceDraftIds(nextIds)
                    }}
                  >
                    {adminSpaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.createTaskButton}
                  type="button"
                  disabled={adminBusy || !selectedMemberUserId}
                  onClick={() => {
                    void handleSaveUserSpaceMemberships()
                  }}
                >
                  {adminBusy ? 'Saving...' : 'Save User Spaces'}
                </button>
              </div>

              <div className={styles.settingsMembershipList}>
                {adminUsers.map((adminUser) => {
                  const userSpaces = adminSpaces.filter((space) =>
                    (space.memberIds || []).includes(adminUser.id)
                  )

                  return (
                    <div
                      key={adminUser.id}
                      className={styles.settingsMembershipRow}
                    >
                      <div className={styles.settingsRoleIdentity}>
                        {adminUser.name ||
                          adminUser.email ||
                          `User ${adminUser.id}`}
                      </div>

                      <div className={styles.settingsMembershipTags}>
                        {userSpaces.length === 0 ? (
                          <span className={styles.settingsHelp}>No spaces</span>
                        ) : (
                          userSpaces.map((space) => (
                            <button
                              key={`${adminUser.id}-${space.id}`}
                              type="button"
                              className={styles.settingsMembershipTag}
                              disabled={adminBusy}
                              onClick={() => {
                                void handleRemoveUserFromSpace(
                                  adminUser.id,
                                  space.id
                                )
                              }}
                            >
                              {space.name} ×
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {currentUser?.role === 'admin' ? (
            <section
              className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
            >
              <div className={styles.settingsPanelHeader}>
                <div className={styles.settingsPanelTitle}>
                  Admin: Organization
                </div>
                <div className={styles.settingsHelp}>
                  Manage organization name
                </div>
              </div>

              <div
                className={`${styles.settingsGrid} ${styles.settingsGridWide}`}
              >
                <label
                  className={`${styles.settingsField} ${styles.settingsFieldFull}`}
                >
                  <span className={styles.sectionLabel}>
                    Organization Name
                  </span>
                  <input
                    className={styles.createInput}
                    type="text"
                    value={adminOrgName}
                    disabled={adminBusy}
                    onChange={(event) => setAdminOrgName(event.target.value)}
                    placeholder="Organization name"
                  />
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.createTaskButton}
                  type="button"
                  disabled={adminBusy}
                  onClick={() => {
                    void handleSaveOrganization()
                  }}
                >
                  {adminBusy ? 'Saving...' : 'Save Organization'}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}
