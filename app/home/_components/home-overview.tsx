import styles from '../page.module.css'

type HomeOverviewProps = {
  taskCount: number
  userCount: number
  usersWithEmail: number
  dueThisWeek: number
  hasTasks: boolean
  busiestSection: string
}

export default function HomeOverview({
  taskCount,
  userCount,
  usersWithEmail,
  dueThisWeek,
  hasTasks,
  busiestSection,
}: HomeOverviewProps) {
  return (
    <section className={styles.overview}>
      <article className={styles.statCard}>
        <div className={styles.statLabel}>Open Tasks</div>
        <div className={styles.statValue}>{taskCount}</div>
        <div className={styles.statHint}>
          {taskCount > 0
            ? `${taskCount} tasks synced from /api/task.`
            : 'No tasks in DB yet.'}
        </div>
      </article>
      <article className={styles.statCard}>
        <div className={styles.statLabel}>Users</div>
        <div className={styles.statValue}>{userCount}</div>
        <div className={styles.statHint}>
          {usersWithEmail} users have connected emails.
        </div>
      </article>
      <article className={styles.statCard}>
        <div className={styles.statLabel}>Due This Week</div>
        <div className={styles.statValue}>{Math.max(dueThisWeek, 0)}</div>
        <div className={styles.statHint}>
          {hasTasks
            ? `${busiestSection} lane is the busiest.`
            : 'No task activity yet.'}
        </div>
      </article>
    </section>
  )
}
