import styles from '../../home/page.module.css'
import panelStyles from '../_styles/settings-panels.module.css'
import type { AppContent } from '../../../lib/content'
import { Building2 } from 'lucide-react'

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
      className={`${panelStyles.settingsPanel} ${panelStyles.settingsPanelCompact}`}
    >
      <div className={panelStyles.settingsPanelHeader}>
        <div className={panelStyles.settingsPanelTitle}>{content.title}</div>
        <div className={panelStyles.settingsHelp}>{content.subtitle}</div>
      </div>

      <div
        className={`${panelStyles.settingsGrid} ${panelStyles.settingsGridWide}`}
      >
        <label
          className={`${panelStyles.settingsField} ${panelStyles.settingsFieldFull}`}
        >
          <span className={panelStyles.sectionLabel}>
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
          className={`${styles.createTaskButton} ${panelStyles.buttonWithIcon}`}
          type="button"
          disabled={adminBusy}
          onClick={onSave}
        >
          <Building2 className={panelStyles.buttonIcon} aria-hidden="true" />
          {adminBusy ? content.savingOrganization : content.saveOrganization}
        </button>
      </div>
    </section>
  )
}
