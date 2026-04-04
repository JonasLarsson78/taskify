'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import {
  buildAuthHeaders,
  buildJsonAuthHeaders,
} from '../../lib/request-headers'
import { canWriteTasks } from '../../lib/user-role'
import styles from '../home/page.module.css'

type Goal = {
  id: number
  title: string
  description: string | null
  targetDate: string | null
  organizationId: number | null
  spaceId: number | null
  taskIds: number[]
  linkedTaskCount: number
  autoProgress: number
  progress: number
  manualProgress: number | null
  atRisk: boolean
  createdAt: string
}

type TaskItem = {
  id: number
  title: string
  section: string
  spaceId: number | null
  archivedAt: string | null
}

type SpaceItem = {
  id: number
  name: string
}

type VerifiedUser = {
  id: number
  role?: 'admin' | 'user' | 'guest'
  organizationId?: number | null
}

export default function GoalsPage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)

  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [user, setUser] = useState<VerifiedUser | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [spaces, setSpaces] = useState<SpaceItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [editingGoalId, setEditingGoalId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [spaceId, setSpaceId] = useState<string>('')
  const [taskIds, setTaskIds] = useState<number[]>([])
  const [useManualProgress, setUseManualProgress] = useState(false)
  const [manualProgress, setManualProgress] = useState(0)
  const [taskPickerId, setTaskPickerId] = useState<string>('')
  const [taskSearchQuery, setTaskSearchQuery] = useState('')

  const canWrite = canWriteTasks(user?.role || 'guest')

  useEffect(() => {
    let mounted = true

    async function load() {
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
            ? (verifyData.user as VerifiedUser)
            : null

        if (!verifiedUser?.id || !verifiedUser.organizationId) {
          router.replace('/home')
          return
        }

        const orgId = verifiedUser.organizationId

        const [goalsResponse, tasksResponse, spacesResponse] = await Promise.all([
          fetch(`/api/goal?organizationId=${orgId}`, {
            headers: buildAuthHeaders(token),
          }),
          fetch(`/api/task?organizationId=${orgId}&archived=include`, {
            headers: buildAuthHeaders(token),
          }),
          fetch(`/api/space?organizationId=${orgId}`, {
            headers: buildAuthHeaders(token),
          }),
        ])

        const goalsData = goalsResponse.ok
          ? ((await goalsResponse.json()) as Goal[])
          : []
        const tasksData = tasksResponse.ok
          ? ((await tasksResponse.json()) as TaskItem[])
          : []
        const spacesData = spacesResponse.ok
          ? ((await spacesResponse.json()) as SpaceItem[])
          : []

        if (!mounted) return

        setUser(verifiedUser)
        setGoals(Array.isArray(goalsData) ? goalsData : [])
        setTasks(Array.isArray(tasksData) ? tasksData : [])
        setSpaces(Array.isArray(spacesData) ? spacesData : [])

        if (!goalsResponse.ok || !tasksResponse.ok || !spacesResponse.ok) {
          setError('Some goal data could not be loaded.')
        }
      } catch (loadError) {
        console.error('goals load error', loadError)
        if (mounted) {
          setError('Could not load goals.')
        }
      } finally {
        if (mounted) setChecking(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [rehydrated, router, token])

  const visibleTasks = useMemo(() => {
    const selectedSpace = Number.parseInt(spaceId, 10)
    if (!Number.isInteger(selectedSpace)) return tasks
    return tasks.filter((task) => task.spaceId === selectedSpace)
  }, [spaceId, tasks])

  const selectedTasks = useMemo(
    () => tasks.filter((task) => taskIds.includes(task.id)),
    [taskIds, tasks]
  )

  const availableTasks = useMemo(
    () => visibleTasks.filter((task) => !taskIds.includes(task.id)),
    [taskIds, visibleTasks]
  )

  const filteredAvailableTasks = useMemo(() => {
    const needle = taskSearchQuery.trim().toLowerCase()
    if (!needle) return availableTasks

    return availableTasks.filter((task) => {
      const haystack = `${task.title} ${task.section}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [availableTasks, taskSearchQuery])

  function resetForm() {
    setEditingGoalId(null)
    setTitle('')
    setDescription('')
    setTargetDate('')
    setSpaceId('')
    setTaskIds([])
    setUseManualProgress(false)
    setManualProgress(0)
    setTaskPickerId('')
    setTaskSearchQuery('')
  }

  function startEdit(goal: Goal) {
    setEditingGoalId(goal.id)
    setTitle(goal.title)
    setDescription(goal.description || '')
    setTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : '')
    setSpaceId(goal.spaceId ? String(goal.spaceId) : '')
    setTaskIds(goal.taskIds || [])
    setUseManualProgress(goal.manualProgress !== null)
    setManualProgress(goal.manualProgress ?? goal.progress ?? 0)
    setTaskPickerId('')
    setTaskSearchQuery('')
  }

  function addTaskFromPicker() {
    const parsed = Number.parseInt(taskPickerId, 10)
    if (!Number.isInteger(parsed)) return
    setTaskIds((prev) => (prev.includes(parsed) ? prev : [...prev, parsed]))
    setTaskPickerId('')
    setTaskSearchQuery('')
  }

  function removeLinkedTask(taskId: number) {
    setTaskIds((prev) => prev.filter((id) => id !== taskId))
  }

  async function reloadGoals() {
    if (!user?.organizationId) return

    const goalsResponse = await fetch(
      `/api/goal?organizationId=${user.organizationId}`,
      {
        headers: buildAuthHeaders(token),
      }
    )

    const goalsData = goalsResponse.ok
      ? ((await goalsResponse.json()) as Goal[])
      : []

    setGoals(Array.isArray(goalsData) ? goalsData : [])
  }

  async function handleSaveGoal() {
    if (!canWrite) {
      setError('Guests can only view goals.')
      return
    }

    if (!user?.organizationId) {
      setError('Organization is required.')
      return
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Goal title is required.')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim() || null,
        targetDate: targetDate || null,
        organizationId: user.organizationId,
        spaceId: spaceId ? Number.parseInt(spaceId, 10) : null,
        taskIds,
        manualProgress: useManualProgress ? manualProgress : null,
      }

      const response = await fetch(
        editingGoalId ? `/api/goal/${editingGoalId}` : '/api/goal',
        {
          method: editingGoalId ? 'PUT' : 'POST',
          headers: buildJsonAuthHeaders(token),
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error || 'Failed to save goal.')
        return
      }

      await reloadGoals()
      setMessage(editingGoalId ? 'Goal updated.' : 'Goal created.')
      resetForm()
    } catch (saveError) {
      console.error('goal save error', saveError)
      setError('Failed to save goal.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteGoal(goalId: number) {
    if (!canWrite) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/goal/${goalId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error || 'Failed to delete goal.')
        return
      }

      await reloadGoals()
      if (editingGoalId === goalId) {
        resetForm()
      }
      setMessage('Goal deleted.')
    } catch (deleteError) {
      console.error('goal delete error', deleteError)
      setError('Failed to delete goal.')
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message="Loading goals..." />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <section className={`${styles.content} ${styles.settingsContent}`}>
        <div className={`${styles.topbar} ${styles.settingsTopbar}`}>
          <div className={styles.workspaceMeta}>
            <span className={styles.workspaceBadge}>◎</span>
            <div>
              <div className={styles.workspaceTitle}>Goals</div>
              <div className={styles.workspaceSub}>
                Track outcomes with automatic progress from linked tasks.
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

        <div className={styles.settingsStack}>
          <section className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}>
            <div className={styles.settingsPanelHeader}>
              <div className={styles.settingsPanelTitle}>
                {editingGoalId ? 'Edit Goal' : 'Create Goal'}
              </div>
              <div className={styles.settingsHelp}>
                Link tasks to calculate progress automatically
              </div>
            </div>

            <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>Title</span>
                <input
                  className={styles.createInput}
                  type="text"
                  value={title}
                  disabled={busy || !canWrite}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Launch Q2 onboarding"
                />
              </label>

              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>Target Date</span>
                <input
                  className={styles.createInput}
                  type="date"
                  value={targetDate}
                  disabled={busy || !canWrite}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>

              <label className={styles.settingsField}>
                <span className={styles.sectionLabel}>Space</span>
                <select
                  className={styles.createSelect}
                  value={spaceId}
                  disabled={busy || !canWrite}
                  onChange={(event) => setSpaceId(event.target.value)}
                >
                  <option value="">No specific space</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name || `Space ${space.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`${styles.settingsField} ${styles.settingsFieldFull}`}>
                <span className={styles.sectionLabel}>Description</span>
                <input
                  className={styles.createInput}
                  type="text"
                  value={description}
                  disabled={busy || !canWrite}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Reduce cycle time and improve quality"
                />
              </label>
            </div>

            <div className={styles.settingsMembershipList}>
              <div className={styles.sectionLabel}>Progress Override</div>
              <label className={styles.settingsMembershipRow}>
                <input
                  type="checkbox"
                  checked={useManualProgress}
                  disabled={busy || !canWrite}
                  onChange={(event) => setUseManualProgress(event.target.checked)}
                />
                <span className={styles.settingsRoleIdentity}>
                  Use manual progress
                </span>
              </label>
              <div className={styles.settingsRow}>
                <input
                  className={styles.createInput}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={manualProgress}
                  disabled={busy || !canWrite || !useManualProgress}
                  onChange={(event) =>
                    setManualProgress(Number.parseInt(event.target.value, 10) || 0)
                  }
                />
                <span className={styles.settingsHelp}>{manualProgress}%</span>
              </div>
              {!useManualProgress ? (
                <div className={styles.settingsHelp}>
                  Auto progress from linked tasks is active.
                </div>
              ) : null}
            </div>

            <div className={styles.settingsMembershipList}>
              <div className={styles.sectionLabel}>Linked Tasks</div>
              {visibleTasks.length === 0 ? (
                <div className={styles.settingsHelp}>No tasks available for this filter.</div>
              ) : (
                <div>
                  <div className={styles.settingsRow}>
                    <input
                      className={styles.createInput}
                      type="text"
                      value={taskSearchQuery}
                      disabled={busy || !canWrite || availableTasks.length === 0}
                      onChange={(event) => setTaskSearchQuery(event.target.value)}
                      placeholder="Search task by title or section"
                    />
                  </div>
                  <div className={styles.settingsRow}>
                    <select
                      className={styles.createSelect}
                      value={taskPickerId}
                      disabled={busy || !canWrite || availableTasks.length === 0}
                      onChange={(event) => setTaskPickerId(event.target.value)}
                    >
                      <option value="">
                        {availableTasks.length === 0
                          ? 'All visible tasks are linked'
                          : filteredAvailableTasks.length === 0
                          ? 'No tasks match search'
                          : 'Choose task to link'}
                      </option>
                      {filteredAvailableTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title} ({task.section})
                        </option>
                      ))}
                    </select>
                    <button
                      className={styles.taskActionBtn}
                      type="button"
                      disabled={busy || !canWrite || !taskPickerId}
                      onClick={addTaskFromPicker}
                    >
                      Link
                    </button>
                  </div>
                </div>
              )}

              {selectedTasks.length > 0 ? (
                <div className={styles.settingsMembershipTags}>
                  {selectedTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={styles.settingsMembershipTag}
                      disabled={busy || !canWrite}
                      onClick={() => removeLinkedTask(task.id)}
                    >
                      {task.title} ×
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.settingsHelp}>No linked tasks yet.</div>
              )}
            </div>

            {error ? <div className={styles.taskMeta}>{error}</div> : null}
            {message ? <div className={styles.taskMeta}>{message}</div> : null}

            <div className={styles.modalActions}>
              {editingGoalId ? (
                <button
                  className={styles.modalCancel}
                  type="button"
                  disabled={busy}
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              ) : (
                <span />
              )}
              <button
                className={styles.createTaskButton}
                type="button"
                disabled={busy || !canWrite}
                onClick={() => {
                  void handleSaveGoal()
                }}
              >
                {busy ? 'Saving...' : editingGoalId ? 'Save Goal' : 'Create Goal'}
              </button>
            </div>
          </section>

          <section className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}>
            <div className={styles.settingsPanelHeader}>
              <div className={styles.settingsPanelTitle}>Goal List</div>
              <div className={styles.settingsHelp}>Progress and risk overview</div>
            </div>

            <div className={styles.settingsMembershipList}>
              {goals.length === 0 ? (
                <div className={styles.settingsHelp}>No goals yet.</div>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className={styles.settingsMembershipRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.settingsRoleIdentity}>{goal.title}</div>
                      {goal.description ? (
                        <div className={styles.settingsHelp}>{goal.description}</div>
                      ) : null}
                      <div className={styles.settingsHelp}>
                        Progress: {goal.progress}%
                        {goal.manualProgress !== null ? ' (manual)' : ' (auto)'} ·
                        {' '}Linked tasks: {goal.linkedTaskCount}
                        {goal.targetDate
                          ? ` · Target: ${new Date(goal.targetDate).toLocaleDateString('en-GB')}`
                          : ''}
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: 'rgba(98, 89, 255, 0.15)',
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginTop: 6,
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, goal.progress))}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #7e78ff, #6259ff)',
                          }}
                        />
                      </div>
                    </div>

                    <div className={styles.settingsMembershipTags}>
                      {goal.atRisk ? (
                        <span className={styles.settingsMembershipTag}>At risk</span>
                      ) : null}
                      {canWrite ? (
                        <button
                          type="button"
                          className={styles.settingsMembershipTag}
                          disabled={busy}
                          onClick={() => startEdit(goal)}
                        >
                          Edit
                        </button>
                      ) : null}
                      {canWrite ? (
                        <button
                          type="button"
                          className={styles.settingsMembershipTag}
                          disabled={busy}
                          onClick={() => {
                            void handleDeleteGoal(goal.id)
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
