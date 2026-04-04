import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildAuthHeaders,
  buildJsonAuthHeaders,
} from '../../../lib/request-headers'
import { subscribeToWorkspaceEvents } from '../../../lib/realtime/client'
import { canWriteTasks } from '../../../lib/user-role'
import type { Goal, SpaceItem, TaskItem, VerifiedUser } from '../model'

type UseGoalsPageParams = {
  token: string | null
  rehydrated: boolean
  redirectToLogin: () => void
  redirectToHome: () => void
}

export default function useGoalsPage({
  token,
  rehydrated,
  redirectToLogin,
  redirectToHome,
}: UseGoalsPageParams) {
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

  const reloadGoalsData = useCallback(
    async (organizationId: number) => {
      const [goalsResponse, tasksResponse, spacesResponse] = await Promise.all([
        fetch(`/api/goal?organizationId=${organizationId}`, {
          headers: buildAuthHeaders(token),
        }),
        fetch(`/api/task?organizationId=${organizationId}&archived=include`, {
          headers: buildAuthHeaders(token),
        }),
        fetch(`/api/space?organizationId=${organizationId}`, {
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

      setGoals(Array.isArray(goalsData) ? goalsData : [])
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setSpaces(Array.isArray(spacesData) ? spacesData : [])
    },
    [token]
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        if (!rehydrated) return
        if (!token) {
          redirectToLogin()
          return
        }

        const verifyResponse = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!verifyResponse.ok) {
          redirectToLogin()
          return
        }

        const verifyData = await verifyResponse.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as VerifiedUser)
            : null

        if (!verifiedUser?.id || !verifiedUser.organizationId) {
          redirectToHome()
          return
        }

        const orgId = verifiedUser.organizationId

        if (!mounted) return

        setUser(verifiedUser)
        await reloadGoalsData(orgId)
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
  }, [rehydrated, token, redirectToLogin, redirectToHome, reloadGoalsData])

  useEffect(() => {
    const organizationId = user?.organizationId
    if (!token || !organizationId) return

    return subscribeToWorkspaceEvents({
      token,
      organizationId,
      onEvent: (event) => {
        if (event.type === 'connected') return
        void reloadGoalsData(organizationId)
      },
      onError: () => {
        // Ignore transient stream reconnect errors in the UI.
      },
    })
  }, [token, user?.organizationId, reloadGoalsData])

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
    setTargetDate(
      goal.targetDate
        ? new Date(goal.targetDate).toISOString().slice(0, 10)
        : ''
    )
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

  return {
    checking,
    busy,
    canWrite,
    goals,
    spaces,
    editingGoalId,
    title,
    description,
    targetDate,
    spaceId,
    useManualProgress,
    manualProgress,
    taskSearchQuery,
    taskPickerId,
    visibleTasks,
    availableTasks,
    filteredAvailableTasks,
    selectedTasks,
    error,
    message,
    setTitle,
    setDescription,
    setTargetDate,
    setSpaceId,
    setUseManualProgress,
    setManualProgress,
    setTaskSearchQuery,
    setTaskPickerId,
    addTaskFromPicker,
    removeLinkedTask,
    resetForm,
    startEdit,
    handleSaveGoal,
    handleDeleteGoal,
  }
}
