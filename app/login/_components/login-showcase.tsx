import styles from '../page.module.css'

export default function LoginShowcase() {
  return (
    <section className={styles.showcase}>
      <div className={styles.brandRow}>
        <span className={styles.brandMark} />
        <div>
          <div className={styles.brandTitle}>Taskify</div>
          <div className={styles.brandSub}>
            Workspace for high velocity teams
          </div>
        </div>
      </div>

      <h1 className={styles.headline}>Planera smartare. Leverera snabbare.</h1>
      <p className={styles.lead}>
        Samla goals, tasks och execution i ett tydligt flode for hela teamet.
      </p>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Active Projects</div>
          <div className={styles.kpiValue}>12</div>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Tasks Closed</div>
          <div className={styles.kpiValue}>184</div>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Cycle Time</div>
          <div className={styles.kpiValue}>-28%</div>
        </article>
      </div>
    </section>
  )
}
