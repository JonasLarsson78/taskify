import type { Space, StoreUser } from '../../home/model'
import styles from '../../home/page.module.css'

type AdminSpaceMembersPanelProps = {
  adminUsers: StoreUser[]
  adminSpaces: Space[]
  selectedMemberUserId: number | null
  memberSpaceDraftIds: number[]
  adminBusy: boolean
  onSelectUser: (userId: number) => void
  onChangeDraftSpaceIds: (spaceIds: number[]) => void
  onSaveUserSpaces: () => void
  onRemoveUserFromSpace: (userId: number, spaceId: number) => void
}

export default function AdminSpaceMembersPanel({
  adminUsers,
  adminSpaces,
  selectedMemberUserId,
  memberSpaceDraftIds,
  adminBusy,
  onSelectUser,
  onChangeDraftSpaceIds,
  onSaveUserSpaces,
  onRemoveUserFromSpace,
}: AdminSpaceMembersPanelProps) {
  return (
    <section
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>Admin: Space Members</div>
        <div className={styles.settingsHelp}>
          Manage memberships both by space and by user
        </div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>User</span>
          <select
            className={styles.createSelect}
            value={selectedMemberUserId ?? ''}
            onChange={(event) =>
              onSelectUser(Number.parseInt(event.target.value, 10))
            }
          >
            {adminUsers.map((adminUser) => (
              <option key={adminUser.id} value={adminUser.id}>
                {adminUser.name || adminUser.email || `User ${adminUser.id}`}
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
              const nextIds = Array.from(event.target.selectedOptions).map(
                (option) => Number.parseInt(option.value, 10)
              )
              onChangeDraftSpaceIds(nextIds)
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
          onClick={onSaveUserSpaces}
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
            <div key={adminUser.id} className={styles.settingsMembershipRow}>
              <div className={styles.settingsRoleIdentity}>
                {adminUser.name || adminUser.email || `User ${adminUser.id}`}
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
                      onClick={() =>
                        onRemoveUserFromSpace(adminUser.id, space.id)
                      }
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
  )
}
