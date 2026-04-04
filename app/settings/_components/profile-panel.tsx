import styles from '../../home/page.module.css'
import type { SettingsProfileContent } from '../../../lib/content'

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
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
      onSubmit={onSubmit}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>{content.title}</div>
        <div className={styles.settingsHelp}>{content.subtitle}</div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.labels.name}</span>
          <input
            className={styles.createInput}
            type="text"
            value={name}
            disabled={!canEdit}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder={content.placeholders.name}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.labels.email}</span>
          <input
            className={styles.createInput}
            type="email"
            value={email}
            disabled={!canEdit}
            onChange={(event) => onChangeEmail(event.target.value)}
            placeholder={content.placeholders.email}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.labels.role}</span>
          <input
            className={styles.createInput}
            type="text"
            value={role}
            disabled
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.labels.language}</span>
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

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>
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
          <span className={styles.settingsHelp}>{content.passwordHelp}</span>
        </label>

        <div className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
          <span className={styles.sectionLabel}>
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

      {error ? <div className={styles.taskMeta}>{error}</div> : null}
      {message ? <div className={styles.taskMeta}>{message}</div> : null}

      <div className={styles.modalActions}>
        <button
          className={styles.createTaskButton}
          type="submit"
          disabled={busy}
        >
          {busy ? content.actions.saving : content.actions.save}
        </button>
      </div>
    </form>
  )
}
