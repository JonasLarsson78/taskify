'use client'

import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import type { ApiTask, Organization, StoreUser } from '../home/model'
import styles from '../home/page.module.css'

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
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No date'
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
  const token = useStore((state) => state.token)
  const rehydrated = useStore((state) => state.rehydrated)
  const [checking, setChecking] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null)

  async function loadArchivedTasks(organizationId: number | null) {
    const url = organizationId
      ? `/api/task?organizationId=${organizationId}&archived=only`
      : '/api/task?archived=only'

    const response = await fetch(url)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Failed to load archived tasks')
    }

    const taskData = (await response.json()) as ApiTask[]
    setTasks(Array.isArray(taskData) ? taskData : [])
  }

  async function updateArchivedTask(taskId: number, archivedAt: string | null) {
    setBusyTaskId(taskId)
    setIntegrationError(null)

    try {
      const response = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setIntegrationError(data?.error || 'Failed to update archived task.')
        return false
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      return true
    } catch (error) {
      console.error('archive update error', error)
      setIntegrationError('Failed to update archived task.')
      return false
    } finally {
      setBusyTaskId(null)
    }
  }

  async function deleteArchivedTask(taskId: number) {
    setBusyTaskId(taskId)
    setIntegrationError(null)

    try {
      const response = await fetch(`/api/task/${taskId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setIntegrationError(data?.error || 'Failed to delete archived task.')
        return false
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      return true
    } catch (error) {
      console.error('archive delete error', error)
      setIntegrationError('Failed to delete archived task.')
      return false
    } finally {
      setBusyTaskId(null)
    }
  }

  useEffect(() => {
    let mounted = true

    async function loadPage() {
      try {
        if (!rehydrated) return
        if (!token) {
          router.replace('/login')
          return
        }

        const verifyResponse = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!verifyResponse.ok) {
          router.replace('/login')
          return
        }

        const verifyData = await verifyResponse.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as StoreUser)
            : null

        const organizationId = verifiedUser?.organizationId ?? null
        if (organizationId) {
          const organizationResponse = await fetch(
            `/api/organization/${organizationId}`
          )
          if (organizationResponse.ok) {
            const organizationData =
              (await organizationResponse.json()) as Organization
            if (mounted) setOrganization(organizationData)
          }
        }

        await loadArchivedTasks(organizationId)
      } catch (error) {
        console.error('archive page load error', error)
        if (mounted) setIntegrationError('Failed to load archive.')
      } finally {
        if (mounted) setChecking(false)
      }
    }

    void loadPage()

    return () => {
      mounted = false
    }
  }, [rehydrated, router, token])

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message="Loading archive..." />
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
              <div className={styles.workspaceTitle}>Archive</div>
              <div className={styles.workspaceSub}>
                {organization?.name
                  ? `Archived tasks for ${organization.name}`
                  : 'Archived tasks across your workspace'}
              </div>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <button
              className={styles.modalCancel}
              type="button"
              onClick={() => router.push('/home')}
            >
              Back to Home
            </button>
          </div>
        </div>

        {integrationError ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>{integrationError}</div>
          </section>
        ) : null}

        <section className={styles.board}>
          {tasks.length === 0 ? (
            <div className={styles.taskMeta}>No archived tasks found.</div>
          ) : (
            <div className={styles.taskTiles}>
              {tasks.map((task) => (
                <article className={styles.taskTile} key={task.id}>
                  <div
                    className={styles.taskTileSection}
                    style={{
                      background: task.color || '#716bff',
                      color: getTagTextColor(task.color || '#716bff'),
                    }}
                  >
                    {task.section}
                  </div>
                  <div className={styles.taskViewCardTitle}>{task.title}</div>
                  {task.meta ? (
                    <div
                      className={`${styles.taskMeta} ${styles.archiveTaskMeta}`}
                      dangerouslySetInnerHTML={{
                        __html: markdownToHtml(task.meta),
                      }}
                    />
                  ) : null}
                  <div className={styles.taskViewMetaRow}>
                    Archived: {formatDate(task.archivedAt)}
                  </div>
                  <div className={styles.taskViewMetaRow}>
                    Due: {formatDate(task.dueDate)}
                  </div>
                  <div className={styles.taskViewMetaRow}>
                    Priority: {task.priority}
                  </div>

                  <div className={styles.taskActions}>
                    <button
                      className={styles.taskActionBtn}
                      type="button"
                      disabled={busyTaskId === task.id}
                      onClick={() => {
                        void updateArchivedTask(task.id, null)
                      }}
                    >
                      {busyTaskId === task.id ? 'Working...' : 'Restore'}
                    </button>
                    <button
                      className={`${styles.taskActionBtn} ${styles.taskActionDanger}`}
                      type="button"
                      disabled={busyTaskId === task.id}
                      onClick={() => {
                        void deleteArchivedTask(task.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}