import type { Space, StoreUser } from '../../home/model'
import styles from '../../home/page.module.css'
import panelStyles from '../_styles/settings-panels.module.css'
import type { AppContent } from '@/lib/content'
import { Save, UserMinus } from 'lucide-react'

type AdminSpaceMembersPanelProps = {
  adminUsers: StoreUser[]
  adminSpaces: Space[]
  selectedMemberUserId: number | null
  memberSpaceDraftIds: number[]
  adminBusy: boolean
  content: AppContent['settings']['adminSpaceMembers']
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
  content,
  onSelectUser,
  onChangeDraftSpaceIds,
  onSaveUserSpaces,
  onRemoveUserFromSpace,
}: AdminSpaceMembersPanelProps) {
  return (
    <section
      className={`${panelStyles.settingsPanel} ${panelStyles.settingsPanelCompact}`}
    >
      <div className={panelStyles.settingsPanelHeader}>
        <div className={panelStyles.settingsPanelTitle}>{content.title}</div>
        <div className={panelStyles.settingsHelp}>{content.subtitle}</div>
      </div>

      <div
        className={`${panelStyles.settingsGrid} ${panelStyles.settingsGridWide}`}
      >
        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>{content.user}</span>
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

        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>
            {content.spacesForUser}
          </span>
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
          className={`${styles.createTaskButton} ${panelStyles.buttonWithIcon}`}
          type="button"
          disabled={adminBusy || !selectedMemberUserId}
          onClick={onSaveUserSpaces}
        >
          <Save className={panelStyles.buttonIcon} aria-hidden="true" />
          {adminBusy ? content.savingUserSpaces : content.saveUserSpaces}
        </button>
      </div>

      <div className={panelStyles.settingsMembershipList}>
        {adminUsers.map((adminUser) => {
          const userSpaces = adminSpaces.filter((space) =>
            (space.memberIds || []).includes(adminUser.id)
          )

          return (
            <div
              key={adminUser.id}
              className={panelStyles.settingsMembershipRow}
            >
              <div className={panelStyles.settingsRoleIdentity}>
                {adminUser.name || adminUser.email || `User ${adminUser.id}`}
              </div>

              <div className={panelStyles.settingsMembershipTags}>
                {userSpaces.length === 0 ? (
                  <span className={panelStyles.settingsHelp}>
                    {content.noSpaces}
                  </span>
                ) : (
                  userSpaces.map((space) => (
                    <button
                      key={`${adminUser.id}-${space.id}`}
                      type="button"
                      className={`${panelStyles.settingsMembershipTag} ${panelStyles.buttonWithIcon}`}
                      disabled={adminBusy}
                      onClick={() =>
                        onRemoveUserFromSpace(adminUser.id, space.id)
                      }
                    >
                      <UserMinus
                        className={panelStyles.buttonIcon}
                        aria-hidden="true"
                      />
                      <span>{space.name}</span>
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
