import styles from '../page.module.css'
import type { AppContent } from '../../../lib/content'

type HomeOverviewProps = {
  taskCount: number
  userCount: number
  usersWithEmail: number
  dueThisWeek: number
  hasTasks: boolean
  busiestSection: string
  content: AppContent['home']['overview']
}

export default function HomeOverview({
  taskCount,
  userCount,
  usersWithEmail,
  dueThisWeek,
  hasTasks,
  busiestSection,
  content,
}: HomeOverviewProps) {
  return (
    <section className={styles.overview}>
      <article className={styles.statCard}>
        <div className={styles.statLabel}>{content.openTasks}</div>
        <div className={styles.statValue}>{taskCount}</div>
        <div className={styles.statHint}>
          {taskCount > 0
            ? content.openTasksSynced(taskCount)
            : content.noTasksInDb}
        </div>
      </article>
      <article className={styles.statCard}>
        <div className={styles.statLabel}>{content.users}</div>
        <div className={styles.statValue}>{userCount}</div>
        <div className={styles.statHint}>
          {content.usersConnectedEmails(usersWithEmail)}
        </div>
      </article>
      <article className={styles.statCard}>
        <div className={styles.statLabel}>{content.dueThisWeek}</div>
        <div className={styles.statValue}>{Math.max(dueThisWeek, 0)}</div>
        <div className={styles.statHint}>
          {hasTasks
            ? content.busiestLane(busiestSection)
            : content.noTaskActivity}
        </div>
      </article>
    </section>
  )
}
