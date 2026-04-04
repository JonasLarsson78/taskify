import styles from '../../home/page.module.css'

type ProfilePanelProps = {
  name: string
  email: string
  password: string
  role: string
  organizationName: string
  canEdit: boolean
  busy: boolean
  error: string | null
  message: string | null
  onChangeName: (value: string) => void
  onChangeEmail: (value: string) => void
  onChangePassword: (value: string) => void
  onCancel: () => void
  onSubmit: (event: React.FormEvent) => void
}

export default function ProfilePanel({
  name,
  email,
  password,
  role,
  organizationName,
  canEdit,
  busy,
  error,
  message,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onCancel,
  onSubmit,
}: ProfilePanelProps) {
  return (
    <form
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
      onSubmit={onSubmit}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>Profile</div>
        <div className={styles.settingsHelp}>Personal and sign-in details</div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Name</span>
          <input
            className={styles.createInput}
            type="text"
            value={name}
            disabled={!canEdit}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder="Your name"
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Email</span>
          <input
            className={styles.createInput}
            type="email"
            value={email}
            disabled={!canEdit}
            onChange={(event) => onChangeEmail(event.target.value)}
            placeholder="name@company.com"
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Role</span>
          <input
            className={styles.createInput}
            type="text"
            value={role}
            disabled
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>New Password</span>
          <input
            className={styles.createInput}
            type="password"
            value={password}
            disabled={!canEdit}
            onChange={(event) => onChangePassword(event.target.value)}
            placeholder="Leave empty to keep current password"
          />
          <span className={styles.settingsHelp}>
            Minimum 6 characters. Leave blank if you do not want to change it.
          </span>
        </label>

        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <span className={styles.sectionLabel}>Organization</span>
          <input
            className={styles.createInput}
            type="text"
            value={organizationName}
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
          onClick={onCancel}
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
  )
}
