'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import styles from '../home/page.module.css'
import { canWriteTasks } from '../../lib/user-role'
import ProfilePanel from './_components/profile-panel'
import AdminUsersPanel from './_components/admin-users-panel'
import AdminSpaceMembersPanel from './_components/admin-space-members-panel'
import AdminOrganizationPanel from './_components/admin-organization-panel'
import useSettingsPage from './_hooks/use-settings-page'

export default function SettingsPage() {
  const router = useRouter()
  const token = useStore((state) => state.token)
  const rehydrated = useStore((state) => state.rehydrated)
  const setUser = useStore((state) => state.setUser)
  const setOrganization = useStore((state) => state.setOrganization)
  const organization = useStore((state) => state.organization)
  const redirectToLogin = useCallback(() => router.replace('/login'), [router])
  const redirectToHome = useCallback(() => router.replace('/home'), [router])
  const {
    checking,
    busy,
    currentUser,
    name,
    email,
    password,
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
  } = useSettingsPage({
    token,
    rehydrated,
    organization,
    setUser,
    setOrganization,
    redirectToLogin,
    redirectToHome,
  })

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
          <ProfilePanel
            name={name}
            email={email}
            password={password}
            role={currentUser?.role || 'user'}
            organizationName={organization?.name || 'No organization'}
            canEdit={canWriteTasks(currentUser?.role || 'guest')}
            busy={busy}
            error={error}
            message={message}
            onChangeName={setName}
            onChangeEmail={setEmail}
            onChangePassword={setPassword}
            onCancel={() => router.push('/home')}
            onSubmit={handleSubmit}
          />

          {currentUser?.role === 'admin' ? (
            <AdminUsersPanel
              adminUsers={adminUsers}
              adminBusy={adminBusy}
              newAdminUserName={newAdminUserName}
              newAdminUserEmail={newAdminUserEmail}
              newAdminUserPassword={newAdminUserPassword}
              newAdminUserRole={newAdminUserRole}
              onChangeName={setNewAdminUserName}
              onChangeEmail={setNewAdminUserEmail}
              onChangePassword={setNewAdminUserPassword}
              onChangeRole={setNewAdminUserRole}
              onCreateUser={() => {
                void handleCreateAdminUser()
              }}
              onRoleUpdate={(targetUserId, role) => {
                void handleAdminRoleUpdate(targetUserId, role)
              }}
            />
          ) : null}

          {currentUser?.role === 'admin' ? (
            <AdminSpaceMembersPanel
              adminUsers={adminUsers}
              adminSpaces={adminSpaces}
              selectedMemberUserId={selectedMemberUserId}
              memberSpaceDraftIds={memberSpaceDraftIds}
              adminBusy={adminBusy}
              onSelectUser={handleSelectMemberUser}
              onChangeDraftSpaceIds={setMemberSpaceDraftIds}
              onSaveUserSpaces={() => {
                void handleSaveUserSpaceMemberships()
              }}
              onRemoveUserFromSpace={(userId, spaceId) => {
                void handleRemoveUserFromSpace(userId, spaceId)
              }}
            />
          ) : null}

          {currentUser?.role === 'admin' ? (
            <AdminOrganizationPanel
              adminOrgName={adminOrgName}
              adminBusy={adminBusy}
              onChangeName={setAdminOrgName}
              onSave={() => {
                void handleSaveOrganization()
              }}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}
