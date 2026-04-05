import styles from '../page.module.css'
import type { AppContent } from '../../../lib/content'

type LoginShowcaseProps = {
  content: AppContent['login']
  metrics: {
    activeProjects: number
    tasksClosed: number
    leadTimeDays: number | null
  } | null
}

export default function LoginShowcase({
  content,
  metrics,
}: LoginShowcaseProps) {
  const activeProjects = metrics?.activeProjects ?? 0
  const tasksClosed = metrics?.tasksClosed ?? 0
  const leadTime =
    typeof metrics?.leadTimeDays === 'number' ? `${metrics.leadTimeDays} d` : '--'

  return (
    <section className={styles.showcase}>
      <div className={styles.brandRow}>
        <span className={styles.brandMark} />
        <div>
          <div className={styles.brandTitle}>Taskify</div>
          <div className={styles.brandSub}>{content.brandSub}</div>
        </div>
      </div>

      <h1 className={styles.headline}>{content.headline}</h1>
      <p className={styles.lead}>{content.lead}</p>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{content.kpiActiveProjects}</div>
          <div className={styles.kpiValue}>{activeProjects}</div>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{content.kpiTasksClosed}</div>
          <div className={styles.kpiValue}>{tasksClosed}</div>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{content.kpiCycleTime}</div>
          <div className={styles.kpiValue}>{leadTime}</div>
        </article>
      </div>
    </section>
  )
}
