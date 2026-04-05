'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import styles from '../home/page.module.css'
import settingsLayoutStyles from './_styles/settings-layout.module.css'
import { canWriteTasks } from '../../lib/user-role'
import { getContent, normalizeLanguage } from '../../lib/content'
import HomeSidebar from '../home/_components/home-sidebar'
import ProfilePanel from './_components/profile-panel'
import AdminUsersPanel from './_components/admin-users-panel'
import AdminSpaceMembersPanel from './_components/admin-space-members-panel'
import AdminOrganizationPanel from './_components/admin-organization-panel'
import useSettingsPage from './_hooks/use-settings-page'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const token = useStore((state) => state.token)
  const rehydrated = useStore((state) => state.rehydrated)
  const sessionUser = useStore((state) => state.user)
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
  } = useSettingsPage({
    token,
    rehydrated,
    organization,
    setUser,
    setOrganization,
    redirectToLogin,
    redirectToHome,
  })

  const uiLanguage = normalizeLanguage(
    currentUser?.preferredLanguage || sessionUser?.preferredLanguage
  )
  const ui = getContent(uiLanguage)
  const sidebarUser = currentUser || sessionUser
  const personName = sidebarUser?.name || ui.home.guest
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'

  if (checking) {
    return (
      <main className={styles.shell}>
        <HomeSidebar
          personInitials={personInitials}
          personName={personName}
          userEmail={sidebarUser?.email || ui.home.signedIn}
          activeItem="settings"
          content={ui.home.sidebar}
          onOpenHome={() => router.push('/home')}
          onOpenArchive={() => router.push('/archive')}
          onOpenLog={() => router.push('/log')}
          onOpenGoals={() => router.push('/goals')}
          onOpenSettings={() => router.push('/settings')}
          onOpenLogout={() => router.push('/logout')}
        />

        <section className={styles.content}>
          <section className={styles.workspaceLoadingCard} aria-live="polite">
            <div className={styles.workspaceLoadingHeader}>
              <span className={styles.workspaceLoadingBadge} aria-hidden />
              <div>
                <p className={styles.workspaceLoadingKicker}>
                  Taskify Settings
                </p>
                <h1 className={styles.workspaceLoadingTitle}>
                  {ui.settings.loading}
                </h1>
              </div>
            </div>

            <p className={styles.workspaceLoadingHint}>
              Loading your account and settings...
            </p>

            <div className={styles.workspaceLoadingSpinner}>
              <Loader size="lg" message={ui.settings.loading} />
            </div>

            <div className={styles.workspaceLoadingSkeleton} aria-hidden>
              <span className={styles.workspaceLoadingLineLong} />
              <span className={styles.workspaceLoadingLineMedium} />
              <span className={styles.workspaceLoadingLineShort} />
            </div>
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <HomeSidebar
        personInitials={personInitials}
        personName={personName}
        userEmail={sidebarUser?.email || ui.home.signedIn}
        activeItem="settings"
        content={ui.home.sidebar}
        onOpenHome={() => router.push('/home')}
        onOpenArchive={() => router.push('/archive')}
        onOpenLog={() => router.push('/log')}
        onOpenGoals={() => router.push('/goals')}
        onOpenSettings={() => router.push('/settings')}
        onOpenLogout={() => router.push('/logout')}
      />

      <section className={styles.content}>
        <div
          className={`${styles.topbar} ${settingsLayoutStyles.settingsTopbar}`}
        >
          <div className={styles.workspaceMeta}>
            <span className={styles.workspaceBadge}>
              <Settings className={styles.workspaceBadgeIcon} />
            </span>
            <div>
              <div className={styles.workspaceTitle}>{ui.settings.title}</div>
              <div className={styles.workspaceSub}>{ui.settings.subtitle}</div>
            </div>
          </div>
        </div>

        <div className={settingsLayoutStyles.settingsStack}>
          <ProfilePanel
            name={name}
            email={email}
            password={password}
            preferredLanguage={preferredLanguage}
            content={ui.settings.profile}
            role={currentUser?.role || 'user'}
            organizationName={
              organization?.name || ui.settings.organizationFallback
            }
            canEdit={canWriteTasks(currentUser?.role || 'guest')}
            busy={busy}
            error={error}
            message={message}
            onChangeName={setName}
            onChangeEmail={setEmail}
            onChangePassword={setPassword}
            onChangePreferredLanguage={setPreferredLanguage}
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
              content={ui.settings.adminUsers}
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
              content={ui.settings.adminSpaceMembers}
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
              content={ui.settings.adminOrganization}
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
