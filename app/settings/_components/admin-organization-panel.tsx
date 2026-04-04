import styles from '../../home/page.module.css'

type AdminOrganizationPanelProps = {
  adminOrgName: string
  adminBusy: boolean
  onChangeName: (value: string) => void
  onSave: () => void
}

export default function AdminOrganizationPanel({
  adminOrgName,
  adminBusy,
  onChangeName,
  onSave,
}: AdminOrganizationPanelProps) {
  return (
    <section
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>Admin: Organization</div>
        <div className={styles.settingsHelp}>Manage organization name</div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label
          className={`${styles.settingsField} ${styles.settingsFieldFull}`}
        >
          <span className={styles.sectionLabel}>Organization Name</span>
          <input
            className={styles.createInput}
            type="text"
            value={adminOrgName}
            disabled={adminBusy}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder="Organization name"
          />
        </label>
      </div>

      <div className={styles.modalActions}>
        <button
          className={styles.createTaskButton}
          type="button"
          disabled={adminBusy}
          onClick={onSave}
        >
          {adminBusy ? 'Saving...' : 'Save Organization'}
        </button>
      </div>
    </section>
  )
}
