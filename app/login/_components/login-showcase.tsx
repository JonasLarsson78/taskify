import styles from '../page.module.css'
import type { AppContent } from '../../../lib/content'

type LoginShowcaseProps = {
  content: AppContent['login']
}

export default function LoginShowcase({ content }: LoginShowcaseProps) {
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
          <div className={styles.kpiValue}>12</div>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{content.kpiTasksClosed}</div>
          <div className={styles.kpiValue}>184</div>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>{content.kpiCycleTime}</div>
          <div className={styles.kpiValue}>-28%</div>
        </article>
      </div>
    </section>
  )
}
