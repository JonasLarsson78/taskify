'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '../../../lib/store'
import { getContent } from '../../../lib/content'
import useArchivePage from '../../archive/_hooks/use-archive-page'
import MobileNav from '../_components/mobile-nav'
import styles from '../page.module.css'

function formatDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function MobilArchivePage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const ui = getContent(user?.preferredLanguage)

  const {
    checking,
    organization,
    tasks,
    integrationError,
    busyTaskId,
    currentUser,
    updateArchivedTask,
    deleteArchivedTask,
  } = useArchivePage({
    token,
    rehydrated,
    redirectToLogin: useCallback(() => router.replace('/login'), [router]),
  })

  const subtitleText = organization?.name
    ? ui.archive.subtitleWithOrg(organization.name)
    : ui.archive.subtitleFallback

  if (checking) {
    return (
      <main className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <span className={styles.topbarDot} />
            <div>
              <p className={styles.topbarTitle}>{ui.archive.title}</p>
            </div>
          </div>
        </header>
        <div className={styles.loadingState}>
          <div className={styles.loadingDot} />
          <p className={styles.loadingText}>{ui.archive.loading}</p>
        </div>
        <MobileNav active="archive" />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarBrand}>
          <span className={styles.topbarDot} />
          <div>
            <p className={styles.topbarTitle}>{ui.archive.title}</p>
            <p className={styles.topbarSub}>{subtitleText}</p>
          </div>
        </div>
      </header>

      {integrationError && (
        <div className={styles.errorBanner}>{integrationError}</div>
      )}

      <div className={styles.taskFeed}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📦</span>
            <p className={styles.emptyLabel}>{ui.archive.noTasks}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <article
              key={task.id}
              className={`${styles.taskCard} ${
                busyTaskId === task.id ? styles.taskCardBusy : ''
              }`}
            >
              <div className={styles.taskCardHeader}>
                <span
                  className={styles.taskColorDot}
                  style={{ background: task.color || '#716bff' }}
                />
                <p className={styles.taskTitle}>{task.title}</p>
              </div>
              {task.meta && <p className={styles.taskMeta}>{task.meta}</p>}
              <div className={styles.taskFooter}>
                <span
                  className={`${styles.taskPriorityBadge} ${styles.priorityNormal}`}
                >
                  {task.section}
                </span>
                <span className={styles.taskDue}>
                  {ui.home.task.archivedPrefix}: {formatDate(task.archivedAt)}
                </span>
              </div>
              {currentUser?.role !== 'guest' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    style={actionBtnStyle}
                    disabled={busyTaskId === task.id}
                    onClick={() => void updateArchivedTask(task.id, null)}
                  >
                    {busyTaskId === task.id
                      ? ui.archive.working
                      : ui.archive.restore}
                  </button>
                  <button
                    type="button"
                    style={{ ...actionBtnStyle, color: '#d43a3a' }}
                    disabled={busyTaskId === task.id}
                    onClick={() => void deleteArchivedTask(task.id)}
                  >
                    {ui.common.delete}
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <MobileNav active="archive" />
    </main>
  )
}

const actionBtnStyle: React.CSSProperties = {
  fontSize: '0.76rem',
  fontWeight: 700,
  background: 'rgba(111,90,214,0.08)',
  border: '1px solid rgba(111,90,214,0.2)',
  borderRadius: 8,
  padding: '4px 10px',
  cursor: 'pointer',
  color: '#6f5ad6',
}
