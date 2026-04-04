import styles from '../../home/page.module.css'
import panelStyles from '../_styles/settings-panels.module.css'
import type { SettingsProfileContent } from '../../../lib/content'
import { Save } from 'lucide-react'

type ProfilePanelProps = {
  name: string
  email: string
  password: string
  preferredLanguage: 'sv' | 'en'
  content: SettingsProfileContent
  role: string
  organizationName: string
  canEdit: boolean
  busy: boolean
  error: string | null
  message: string | null
  onChangeName: (value: string) => void
  onChangeEmail: (value: string) => void
  onChangePassword: (value: string) => void
  onChangePreferredLanguage: (value: 'sv' | 'en') => void
  onSubmit: (event: React.FormEvent) => void
}

export default function ProfilePanel({
  name,
  email,
  password,
  preferredLanguage,
  content,
  role,
  organizationName,
  canEdit,
  busy,
  error,
  message,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onChangePreferredLanguage,
  onSubmit,
}: ProfilePanelProps) {
  return (
    <form
      className={`${panelStyles.settingsPanel} ${panelStyles.settingsPanelCompact}`}
      onSubmit={onSubmit}
    >
      <div className={panelStyles.settingsPanelHeader}>
        <div className={panelStyles.settingsPanelTitle}>{content.title}</div>
        <div className={panelStyles.settingsHelp}>{content.subtitle}</div>
      </div>

      <div
        className={`${panelStyles.settingsGrid} ${panelStyles.settingsGridWide}`}
      >
        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>
            {content.labels.name}
          </span>
          <input
            className={styles.createInput}
            type="text"
            value={name}
            disabled={!canEdit}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder={content.placeholders.name}
          />
        </label>

        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>
            {content.labels.email}
          </span>
          <input
            className={styles.createInput}
            type="email"
            value={email}
            disabled={!canEdit}
            onChange={(event) => onChangeEmail(event.target.value)}
            placeholder={content.placeholders.email}
          />
        </label>

        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>
            {content.labels.role}
          </span>
          <input
            className={styles.createInput}
            type="text"
            value={role}
            disabled
          />
        </label>

        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>
            {content.labels.language}
          </span>
          <select
            className={styles.createSelect}
            value={preferredLanguage}
            disabled={!canEdit}
            onChange={(event) =>
              onChangePreferredLanguage(event.target.value as 'sv' | 'en')
            }
          >
            <option value="sv">{content.languageOptions.sv}</option>
            <option value="en">{content.languageOptions.en}</option>
          </select>
        </label>

        <label className={panelStyles.settingsField}>
          <span className={panelStyles.sectionLabel}>
            {content.labels.newPassword}
          </span>
          <input
            className={styles.createInput}
            type="password"
            value={password}
            disabled={!canEdit}
            onChange={(event) => onChangePassword(event.target.value)}
            placeholder={content.placeholders.newPassword}
          />
          <span className={panelStyles.settingsHelp}>
            {content.passwordHelp}
          </span>
        </label>

        <div
          className={`${panelStyles.settingsField} ${panelStyles.settingsFieldFull}`}
        >
          <span className={panelStyles.sectionLabel}>
            {content.labels.organization}
          </span>
          <input
            className={styles.createInput}
            type="text"
            value={organizationName}
            disabled
          />
        </div>
      </div>

      {error ? <div className={panelStyles.settingsHelp}>{error}</div> : null}
      {message ? (
        <div className={panelStyles.settingsHelp}>{message}</div>
      ) : null}

      <div className={styles.modalActions}>
        <button
          className={`${styles.createTaskButton} ${panelStyles.buttonWithIcon}`}
          type="submit"
          disabled={busy}
        >
          <Save className={panelStyles.buttonIcon} aria-hidden="true" />
          {busy ? content.actions.saving : content.actions.save}
        </button>
      </div>
    </form>
  )
}
