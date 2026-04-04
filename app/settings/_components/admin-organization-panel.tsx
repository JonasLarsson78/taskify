import styles from '../../home/page.module.css'
import type { AppContent } from '../../../lib/content'

type AdminOrganizationPanelProps = {
  adminOrgName: string
  adminBusy: boolean
  content: AppContent['settings']['adminOrganization']
  onChangeName: (value: string) => void
  onSave: () => void
}

export default function AdminOrganizationPanel({
  adminOrgName,
  adminBusy,
  content,
  onChangeName,
  onSave,
}: AdminOrganizationPanelProps) {
  return (
    <section
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>{content.title}</div>
        <div className={styles.settingsHelp}>{content.subtitle}</div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label
          className={`${styles.settingsField} ${styles.settingsFieldFull}`}
        >
          <span className={styles.sectionLabel}>
            {content.organizationName}
          </span>
          <input
            className={styles.createInput}
            type="text"
            value={adminOrgName}
            disabled={adminBusy}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder={content.organizationNamePlaceholder}
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
          {adminBusy ? content.savingOrganization : content.saveOrganization}
        </button>
      </div>
    </section>
  )
}
