import styles from '../../home/page.module.css'
import type { Goal } from '../model'

type GoalListPanelProps = {
  goals: Goal[]
  busy: boolean
  canWrite: boolean
  onEdit: (goal: Goal) => void
  onDelete: (goalId: number) => void
}

export default function GoalListPanel({
  goals,
  busy,
  canWrite,
  onEdit,
  onDelete,
}: GoalListPanelProps) {
  return (
    <section
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>Goal List</div>
        <div className={styles.settingsHelp}>Progress and risk overview</div>
      </div>

      <div className={styles.settingsMembershipList}>
        {goals.length === 0 ? (
          <div className={styles.settingsHelp}>No goals yet.</div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className={styles.settingsMembershipRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.settingsRoleIdentity}>{goal.title}</div>
                {goal.description ? (
                  <div className={styles.settingsHelp}>{goal.description}</div>
                ) : null}
                <div className={styles.settingsHelp}>
                  Progress: {goal.progress}%
                  {goal.manualProgress !== null ? ' (manual)' : ' (auto)'} ·
                  Linked tasks: {goal.linkedTaskCount}
                  {goal.targetDate
                    ? ` · Target: ${new Date(
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

              <div className={styles.settingsMembershipTags}>
                {goal.atRisk ? (
                  <span className={styles.settingsMembershipTag}>At risk</span>
                ) : null}
                {canWrite ? (
                  <button
                    type="button"
                    className={styles.settingsMembershipTag}
                    disabled={busy}
                    onClick={() => onEdit(goal)}
                  >
                    Edit
                  </button>
                ) : null}
                {canWrite ? (
                  <button
                    type="button"
                    className={styles.settingsMembershipTag}
                    disabled={busy}
                    onClick={() => onDelete(goal.id)}
                  >
                    Delete
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
