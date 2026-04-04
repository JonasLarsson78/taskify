import type { StoreUser } from '../../home/model'
import styles from '../../home/page.module.css'

type AdminUsersPanelProps = {
  adminUsers: StoreUser[]
  adminBusy: boolean
  newAdminUserName: string
  newAdminUserEmail: string
  newAdminUserPassword: string
  newAdminUserRole: 'admin' | 'user' | 'guest'
  onChangeName: (value: string) => void
  onChangeEmail: (value: string) => void
  onChangePassword: (value: string) => void
  onChangeRole: (value: 'admin' | 'user' | 'guest') => void
  onCreateUser: () => void
  onRoleUpdate: (targetUserId: number, role: 'admin' | 'user' | 'guest') => void
}

export default function AdminUsersPanel({
  adminUsers,
  adminBusy,
  newAdminUserName,
  newAdminUserEmail,
  newAdminUserPassword,
  newAdminUserRole,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onChangeRole,
  onCreateUser,
  onRoleUpdate,
}: AdminUsersPanelProps) {
  return (
    <section
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>Admin: Users</div>
        <div className={styles.settingsHelp}>Create users and adjust roles</div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>New user name</span>
          <input
            className={styles.createInput}
            type="text"
            value={newAdminUserName}
            disabled={adminBusy}
            placeholder="Optional"
            onChange={(event) => onChangeName(event.target.value)}
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
            onChange={(event) => onChangeEmail(event.target.value)}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Temporary password</span>
          <input
            className={styles.createInput}
            type="password"
            value={newAdminUserPassword}
            disabled={adminBusy}
            placeholder="At least 6 characters"
            onChange={(event) => onChangePassword(event.target.value)}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Role</span>
          <select
            className={styles.createSelect}
            value={newAdminUserRole}
            disabled={adminBusy}
            onChange={(event) =>
              onChangeRole(event.target.value as 'admin' | 'user' | 'guest')
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
          onClick={onCreateUser}
        >
          {adminBusy ? 'Creating...' : 'Create User'}
        </button>
      </div>

      <div className={styles.settingsRoleList}>
        {adminUsers.map((adminUser) => (
          <div key={adminUser.id} className={styles.settingsRoleRow}>
            <div className={styles.settingsRoleIdentity}>
              {adminUser.name || adminUser.email || `User ${adminUser.id}`}
            </div>
            <select
              className={styles.createSelect}
              value={adminUser.role || 'user'}
              disabled={adminBusy}
              onChange={(event) =>
                onRoleUpdate(
                  adminUser.id,
                  event.target.value as 'admin' | 'user' | 'guest'
                )
              }
            >
              <option value="admin">admin</option>
              <option value="user">user</option>
              <option value="guest">guest</option>
            </select>
          </div>
        ))}
      </div>
    </section>
  )
}
