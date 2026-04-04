import { useEffect, useState } from 'react'
import {
  buildAuthHeaders,
  buildJsonAuthHeaders,
} from '../../../lib/request-headers'
import type { ApiTask, StoreUser, UiTask } from '../model'

type UseHomeTaskActionsParams = {
  token: string | null
  userRole: StoreUser['role'] | undefined
  organizationId: number | null
  selectedSpaceId: number | null
  tasks: ApiTask[]
  setTasks: React.Dispatch<React.SetStateAction<ApiTask[]>>
  setIntegrationError: React.Dispatch<React.SetStateAction<string | null>>
}

export default function useHomeTaskActions({
  token,
  userRole,
  organizationId,
  selectedSpaceId,
  tasks,
  setTasks,
  setIntegrationError,
}: UseHomeTaskActionsParams) {
  const [taskActionBusyId, setTaskActionBusyId] = useState<number | null>(null)
  const [createTaskBusy, setCreateTaskBusy] = useState(false)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false)

  const [editTaskId, setEditTaskId] = useState<number | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskMeta, setEditTaskMeta] = useState('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [editTaskColor, setEditTaskColor] = useState('#716bff')
  const [editTaskAssigneeIds, setEditTaskAssigneeIds] = useState<number[]>([])
  const [editTaskSection, setEditTaskSection] = useState('Review')
  const [editTaskPriority, setEditTaskPriority] = useState<
    'High' | 'Normal' | 'Low'
  >('Normal')
  const [editTaskDirty, setEditTaskDirty] = useState(false)

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskMeta, setNewTaskMeta] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskColor, setNewTaskColor] = useState('#716bff')
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<number[]>([])
  const [newTaskSection, setNewTaskSection] = useState<string>('Review')
  const [newTaskPriority, setNewTaskPriority] = useState<
    'High' | 'Normal' | 'Low'
  >('Normal')

  async function updateTaskOnServer(
    taskId: number,
    payload: Partial<
      Pick<
        ApiTask,
        | 'title'
        | 'meta'
        | 'dueDate'
        | 'archivedAt'
        | 'priority'
        | 'section'
        | 'assigneeIds'
        | 'color'
      >
    >,
    options?: {
      optimisticUpdate?: (tasks: ApiTask[]) => ApiTask[]
    }
  ): Promise<boolean> {
    let rollbackTasks: ApiTask[] | null = null

    if (options?.optimisticUpdate) {
      setTasks((prev) => {
        rollbackTasks = prev
        return options.optimisticUpdate!(prev)
      })
    }

    setTaskActionBusyId(taskId)
    setIntegrationError(null)
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (rollbackTasks) {
          setTasks(rollbackTasks)
        }
        setIntegrationError(data?.error || 'Kunde inte uppdatera task.')
        return false
      }

      const updated = (await res.json()) as ApiTask
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
      return true
    } catch (error) {
      if (rollbackTasks) {
        setTasks(rollbackTasks)
      }
      console.error('update task error', error)
      setIntegrationError('Kunde inte uppdatera task.')
      return false
    } finally {
      setTaskActionBusyId(null)
    }
  }

  function toInputDate(value: string | null): string {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  function handleOpenTask(task: UiTask) {
    if (userRole === 'guest') return
    if (!task.id) return

    const source = tasks.find((item) => item.id === task.id)
    if (!source) return

    setEditTaskId(source.id)
    setEditTaskTitle(source.title)
    setEditTaskMeta(source.meta || '')
    setEditTaskDueDate(toInputDate(source.dueDate))
    setEditTaskColor(source.color || '#716bff')
    setEditTaskAssigneeIds(source.assigneeIds)
    setEditTaskSection(source.section)
    setEditTaskPriority(source.priority)
    setEditTaskDirty(false)
    setEditTaskModalOpen(true)
  }

  function handleEditTaskTitleChange(value: string) {
    setEditTaskDirty(true)
    setEditTaskTitle(value)
  }

  function handleEditTaskMetaChange(value: string) {
    setEditTaskDirty(true)
    setEditTaskMeta(value)
  }

  function handleEditTaskDueDateChange(value: string) {
    setEditTaskDirty(true)
    setEditTaskDueDate(value)
  }

  function handleEditTaskAssigneeIdsChange(value: number[]) {
    setEditTaskDirty(true)
    setEditTaskAssigneeIds(value)
  }

  function handleEditTaskSectionChange(value: string) {
    setEditTaskDirty(true)
    setEditTaskSection(value)
  }

  function handleEditTaskPriorityChange(value: 'High' | 'Normal' | 'Low') {
    setEditTaskDirty(true)
    setEditTaskPriority(value)
  }

  function handleEditTaskColorChange(value: string) {
    setEditTaskDirty(true)
    setEditTaskColor(value)
  }

  useEffect(() => {
    if (!editTaskModalOpen || !editTaskId) return

    const source = tasks.find((item) => item.id === editTaskId)
    if (!source) {
      setEditTaskModalOpen(false)
      setEditTaskId(null)
      return
    }

    if (editTaskDirty) return

    setEditTaskTitle(source.title)
    setEditTaskMeta(source.meta || '')
    setEditTaskDueDate(toInputDate(source.dueDate))
    setEditTaskColor(source.color || '#716bff')
    setEditTaskAssigneeIds(source.assigneeIds)
    setEditTaskSection(source.section)
    setEditTaskPriority(source.priority)
  }, [editTaskModalOpen, editTaskId, editTaskDirty, tasks])

  async function saveEditedTask() {
    if (!editTaskId) return

    const title = editTaskTitle.trim()
    if (!title) {
      setIntegrationError('Task title is required.')
      return
    }

    const ok = await updateTaskOnServer(editTaskId, {
      title,
      meta: editTaskMeta.trim() || null,
      dueDate: editTaskDueDate || null,
      color: editTaskColor,
      section: editTaskSection,
      priority: editTaskPriority,
      assigneeIds: editTaskAssigneeIds,
    })

    if (ok) {
      setEditTaskDirty(false)
      setEditTaskModalOpen(false)
    }
  }

  function handleTogglePriority(task: UiTask) {
    if (!task.id) return

    const nextPriority =
      task.priority === 'High'
        ? 'Normal'
        : task.priority === 'Normal'
        ? 'Low'
        : 'High'

    void updateTaskOnServer(task.id, {
      priority: nextPriority,
    })
  }

  function handleMoveTask(task: UiTask, targetSection: string) {
    if (!task.id) return
    if (task.section === targetSection) return

    void updateTaskOnServer(
      task.id,
      { section: targetSection },
      {
        optimisticUpdate: (prev) =>
          prev.map((item) =>
            item.id === task.id ? { ...item, section: targetSection } : item
          ),
      }
    )
  }

  function handleAssigneesChange(task: UiTask, assigneeId: number | null) {
    if (!task.id) return
    const nextAssigneeIds = assigneeId !== null ? [assigneeId] : []

    void updateTaskOnServer(
      task.id,
      {
        assigneeIds: nextAssigneeIds,
      },
      {
        optimisticUpdate: (prev) =>
          prev.map((item) =>
            item.id === task.id
              ? { ...item, assigneeIds: nextAssigneeIds }
              : item
          ),
      }
    )
  }

  async function deleteTaskOnServer(taskId: number): Promise<boolean> {
    if (userRole === 'guest') {
      setIntegrationError('Guests can only read tasks.')
      return false
    }

    setTaskActionBusyId(taskId)
    setIntegrationError(null)
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte ta bort task.')
        return false
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      return true
    } catch (error) {
      console.error('delete task error', error)
      setIntegrationError('Kunde inte ta bort task.')
      return false
    } finally {
      setTaskActionBusyId(null)
    }
  }

  async function createTaskOnServer() {
    if (userRole === 'guest') {
      setIntegrationError('Guests can only read tasks.')
      return
    }

    const title = newTaskTitle.trim()
    if (!title) {
      setIntegrationError('Task title is required.')
      return
    }

    setCreateTaskBusy(true)
    setIntegrationError(null)

    try {
      const res = await fetch('/api/task', {
        method: 'POST',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify({
          title,
          meta: newTaskMeta.trim() || null,
          dueDate: newTaskDueDate || null,
          priority: newTaskPriority,
          section: newTaskSection,
          assigneeIds: newTaskAssigneeIds,
          color: newTaskColor,
          organizationId,
          spaceId: selectedSpaceId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte skapa task.')
        return
      }

      const created = (await res.json()) as ApiTask
      setTasks((prev) => [created, ...prev])
      setNewTaskTitle('')
      setNewTaskMeta('')
      setNewTaskDueDate('')
      setNewTaskColor('#716bff')
      setNewTaskAssigneeIds([])
      setNewTaskSection('Review')
      setNewTaskPriority('Normal')
      setCreateTaskModalOpen(false)
    } catch (error) {
      console.error('create task error', error)
      setIntegrationError('Kunde inte skapa task.')
    } finally {
      setCreateTaskBusy(false)
    }
  }

  async function archiveTaskOnServer(taskId: number): Promise<boolean> {
    return updateTaskOnServer(
      taskId,
      { archivedAt: new Date().toISOString() },
      {
        optimisticUpdate: (prev) => prev.filter((task) => task.id !== taskId),
      }
    )
  }

  return {
    taskActionBusyId,
    createTaskBusy,
    createTaskModalOpen,
    editTaskModalOpen,
    editTaskId,
    editTaskTitle,
    editTaskMeta,
    editTaskDueDate,
    editTaskColor,
    editTaskAssigneeIds,
    editTaskSection,
    editTaskPriority,
    newTaskTitle,
    newTaskMeta,
    newTaskDueDate,
    newTaskColor,
    newTaskAssigneeIds,
    newTaskSection,
    newTaskPriority,
    setCreateTaskModalOpen,
    setEditTaskModalOpen,
    setEditTaskTitle,
    setEditTaskMeta,
    setEditTaskDueDate,
    setEditTaskColor,
    setEditTaskAssigneeIds,
    setEditTaskSection,
    setEditTaskPriority,
    setNewTaskTitle,
    setNewTaskMeta,
    setNewTaskDueDate,
    setNewTaskColor,
    setNewTaskAssigneeIds,
    setNewTaskSection,
    setNewTaskPriority,
    handleOpenTask,
    handleEditTaskTitleChange,
    handleEditTaskMetaChange,
    handleEditTaskDueDateChange,
    handleEditTaskAssigneeIdsChange,
    handleEditTaskSectionChange,
    handleEditTaskPriorityChange,
    handleEditTaskColorChange,
    saveEditedTask,
    handleTogglePriority,
    handleMoveTask,
    handleAssigneesChange,
    deleteTaskOnServer,
    createTaskOnServer,
    archiveTaskOnServer,
  }
}
