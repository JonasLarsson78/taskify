'use client'

import type React from 'react'
import styles from '../page.module.css'
import type { AppContent } from '../../../lib/content'

type LoginMobileProps = {
  email: string
  password: string
  loading: boolean
  error: string | null
  content: AppContent['login']
  metrics: {
    activeProjects: number
    tasksClosed: number
    leadTimeDays: number | null
  } | null
  onChangeEmail: (value: string) => void
  onChangePassword: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
}

export default function LoginMobile({
  email,
  password,
  loading,
  error,
  content,
  metrics,
  onChangeEmail,
  onChangePassword,
  onSubmit,
}: LoginMobileProps) {
  const activeProjects = metrics?.activeProjects ?? 0
  const tasksClosed = metrics?.tasksClosed ?? 0
  const leadTime =
    typeof metrics?.leadTimeDays === 'number'
      ? `${metrics.leadTimeDays} d`
      : '--'

  return (
    <main className={styles.mobileShell}>
      <section className={styles.mobileHero}>
        <div className={styles.mobileBrandRow}>
          <span className={styles.mobileBrandMark} />
          <div>
            <p className={styles.mobileBrandTitle}>Taskify</p>
            <p className={styles.mobileBrandSub}>{content.brandSub}</p>
          </div>
        </div>

        <h1 className={styles.mobileHeadline}>{content.headline}</h1>
        <p className={styles.mobileLead}>{content.lead}</p>

        <div className={styles.mobileKpiRow}>
          <article className={styles.mobileKpiCard}>
            <span className={styles.mobileKpiLabel}>
              {content.kpiActiveProjects}
            </span>
            <span className={styles.mobileKpiValue}>{activeProjects}</span>
          </article>
          <article className={styles.mobileKpiCard}>
            <span className={styles.mobileKpiLabel}>
              {content.kpiTasksClosed}
            </span>
            <span className={styles.mobileKpiValue}>{tasksClosed}</span>
          </article>
          <article className={styles.mobileKpiCard}>
            <span className={styles.mobileKpiLabel}>
              {content.kpiCycleTime}
            </span>
            <span className={styles.mobileKpiValue}>{leadTime}</span>
          </article>
        </div>
      </section>

      <section className={styles.mobileAuthPanel}>
        <form onSubmit={onSubmit} className={styles.mobileForm}>
          <h2 className={styles.mobileFormTitle}>{content.title}</h2>
          <p className={styles.mobileFormSubtitle}>{content.subtitle}</p>

          {error ? <div className={styles.mobileError}>{error}</div> : null}

          <label className={styles.mobileLabel}>
            <span className={styles.mobileLabelTitle}>{content.email}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              required
              className={styles.mobileInput}
              placeholder="name@company.com"
            />
          </label>

          <label className={styles.mobileLabel}>
            <span className={styles.mobileLabelTitle}>{content.password}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              required
              className={styles.mobileInput}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={styles.mobileSubmit}
          >
            {loading ? content.submitting : content.submit}
          </button>
        </form>
      </section>
    </main>
  )
}
