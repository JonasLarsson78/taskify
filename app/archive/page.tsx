'use client'

import { useCallback } from 'react'
import { marked } from 'marked'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import { getContent } from '../../lib/content'
import styles from '../home/page.module.css'
import ArchiveTaskGrid from './_components/archive-task-grid'
import useArchivePage from './_hooks/use-archive-page'

function getTagTextColor(background: string): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(background.trim())
  if (!match) return '#ffffff'

  const hex = match[1]
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness > 160 ? '#2d324c' : '#ffffff'
}

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

function markdownToHtml(value: string): string {
  const rendered = marked.parse(value, {
    async: false,
    gfm: true,
    breaks: true,
  })

  return typeof rendered === 'string' ? rendered : ''
}

export default function ArchivePage() {
  const router = useRouter()
  const redirectToLogin = useCallback(() => router.replace('/login'), [router])
  const token = useStore((state) => state.token)
  const rehydrated = useStore((state) => state.rehydrated)
  const user = useStore((state) => state.user)
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
    redirectToLogin,
  })

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message={ui.archive.loading} />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <section className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.workspaceMeta}>
            <span className={styles.workspaceBadge}>▣</span>
            <div>
              <div className={styles.workspaceTitle}>{ui.archive.title}</div>
              <div className={styles.workspaceSub}>
                {organization?.name
                  ? ui.archive.subtitleWithOrg(organization.name)
                  : ui.archive.subtitleFallback}
              </div>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <button
              className={styles.modalCancel}
              type="button"
              onClick={() => router.push('/home')}
            >
              {ui.common.backToHome}
            </button>
          </div>
        </div>

        {integrationError ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>{integrationError}</div>
          </section>
        ) : null}

        <section className={styles.board}>
          <ArchiveTaskGrid
            tasks={tasks}
            busyTaskId={busyTaskId}
            currentUser={currentUser}
            formatDate={formatDate}
            getTagTextColor={getTagTextColor}
            markdownToHtml={markdownToHtml}
            archiveContent={ui.archive}
            taskContent={ui.home.task}
            commonContent={ui.common}
            onRestore={(taskId) => {
              void updateArchivedTask(taskId, null)
            }}
            onDelete={(taskId) => {
              void deleteArchivedTask(taskId)
            }}
          />
        </section>
      </section>
    </main>
  )
}
