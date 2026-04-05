'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '../../../lib/store'
import { getContent } from '../../../lib/content'
import useGoalsPage from '../../goals/_hooks/use-goals-page'
import type { Goal } from '../../goals/model'
import MobileNav from '../_components/mobile-nav'
import styles from '../page.module.css'

export default function MobilGoalsPage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const ui = getContent(user?.preferredLanguage)

  const { checking, busy, canWrite, goals, error, message, handleDeleteGoal } =
    useGoalsPage({
      token,
      rehydrated,
      redirectToLogin: useCallback(() => router.replace('/login'), [router]),
      redirectToHome: useCallback(() => router.replace('/mobil'), [router]),
    })

  if (checking) {
    return (
      <main className={styles.shell}>
        <MobileTopbar title={ui.goals.title} />
        <div className={styles.loadingState}>
          <div className={styles.loadingDot} />
          <p className={styles.loadingText}>{ui.goals.loading}</p>
        </div>
        <MobileNav active="goals" />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <MobileTopbar title={ui.goals.title} sub={ui.goals.subtitle} />

      {(error || message) && (
        <div className={styles.errorBanner}>{error || message}</div>
      )}

      <div className={styles.taskFeed}>
        {goals.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🎯</span>
            <p className={styles.emptyLabel}>{ui.goals.list.noGoals}</p>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              busy={busy}
              canWrite={canWrite}
              content={ui.goals.list}
              onDelete={() => handleDeleteGoal(goal.id)}
            />
          ))
        )}
      </div>

      <MobileNav active="goals" />
    </main>
  )
}

/* ── Sub-components ──────────────────────────────────── */

function MobileTopbar({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarBrand}>
        <span className={styles.topbarDot} />
        <div>
          <p className={styles.topbarTitle}>{title}</p>
          {sub && <p className={styles.topbarSub}>{sub}</p>}
        </div>
      </div>
    </header>
  )
}

type GoalCardProps = {
  goal: Goal
  busy: boolean
  canWrite: boolean
  content: ReturnType<typeof getContent>['goals']['list']
  onDelete: () => void
}

function GoalCard({ goal, busy, canWrite, content, onDelete }: GoalCardProps) {
  const progress = Math.max(0, Math.min(100, goal.progress))
  const progressColor = goal.atRisk
    ? '#ff5a96'
    : progress >= 80
    ? '#2dbdb8'
    : '#6259ff'

  return (
    <article className={styles.taskCard}>
      <div className={styles.taskCardHeader}>
        <span
          className={styles.taskColorDot}
          style={{ background: progressColor }}
        />
        <p className={styles.taskTitle}>{goal.title}</p>
      </div>

      {goal.description && (
        <p className={styles.taskMeta}>{goal.description}</p>
      )}

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: 'rgba(98,89,255,0.12)',
          borderRadius: 999,
          overflow: 'hidden',
          margin: '2px 0',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(135deg, ${progressColor}, #6259ff)`,
            transition: 'width 300ms ease',
          }}
        />
      </div>

      <div className={styles.taskFooter}>
        <span
          className={`${styles.taskPriorityBadge} ${
            goal.atRisk ? styles.priorityHigh : styles.priorityNormal
          }`}
        >
          {progress}%
        </span>
        {goal.atRisk && (
          <span
            className={`${styles.taskPriorityBadge} ${styles.priorityHigh}`}
          >
            {content.atRisk}
          </span>
        )}
        {goal.targetDate && (
          <span className={styles.taskDue}>
            {content.target}:{' '}
            {new Date(goal.targetDate).toLocaleDateString('en-GB')}
          </span>
        )}
        <span className={styles.taskDue}>
          {content.linkedTasks}: {goal.linkedTaskCount}
        </span>
        {canWrite && (
          <button
            type="button"
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              color: '#d43a3a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 700,
            }}
            disabled={busy}
            onClick={onDelete}
          >
            {content.delete}
          </button>
        )}
      </div>
    </article>
  )
}
