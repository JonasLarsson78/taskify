import styles from '../../home/page.module.css'
import panelStyles from '../../settings/_styles/settings-panels.module.css'
import type { Goal } from '../model'
import type { AppContent } from '../../../lib/content'

type GoalListPanelProps = {
  goals: Goal[]
  busy: boolean
  canWrite: boolean
  content: AppContent['goals']['list']
  onEdit: (goal: Goal) => void
  onDelete: (goalId: number) => void
}

export default function GoalListPanel({
  goals,
  busy,
  canWrite,
  content,
  onEdit,
  onDelete,
}: GoalListPanelProps) {
  return (
    <section
      className={`${panelStyles.settingsPanel} ${panelStyles.settingsPanelCompact}`}
    >
      <div className={panelStyles.settingsPanelHeader}>
        <div className={panelStyles.settingsPanelTitle}>{content.title}</div>
        <div className={panelStyles.settingsHelp}>{content.subtitle}</div>
      </div>

      <div className={panelStyles.settingsMembershipList}>
        {goals.length === 0 ? (
          <div className={panelStyles.settingsHelp}>{content.noGoals}</div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className={panelStyles.settingsMembershipRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={panelStyles.settingsRoleIdentity}>
                  {goal.title}
                </div>
                {goal.description ? (
                  <div className={panelStyles.settingsHelp}>
                    {goal.description}
                  </div>
                ) : null}
                <div className={panelStyles.settingsHelp}>
                  {content.progressLabel}: {goal.progress}%
                  {goal.manualProgress !== null
                    ? ` (${content.manual})`
                    : ` (${content.auto})`}{' '}
                  · {content.linkedTasks}: {goal.linkedTaskCount}
                  {goal.targetDate
                    ? ` · ${content.target}: ${new Date(
                        goal.targetDate
                      ).toLocaleDateString('en-GB')}`
                    : ''}
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'rgba(98, 89, 255, 0.15)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, goal.progress))}%`,
                      height: '100%',
                      background: 'linear-gradient(135deg, #7e78ff, #6259ff)',
                    }}
                  />
                </div>
              </div>

              <div className={panelStyles.settingsMembershipTags}>
                {goal.atRisk ? (
                  <span className={panelStyles.settingsMembershipTag}>
                    {content.atRisk}
                  </span>
                ) : null}
                {canWrite ? (
                  <button
                    type="button"
                    className={panelStyles.settingsMembershipTag}
                    disabled={busy}
                    onClick={() => onEdit(goal)}
                  >
                    {content.edit}
                  </button>
                ) : null}
                {canWrite ? (
                  <button
                    type="button"
                    className={panelStyles.settingsMembershipTag}
                    disabled={busy}
                    onClick={() => onDelete(goal.id)}
                  >
                    {content.delete}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
