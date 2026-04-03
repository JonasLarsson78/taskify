'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import CreateTaskModal from './_components/create-task-modal'
import HomeOverview from './_components/home-overview'
import HomeSidebar from './_components/home-sidebar'
import HomeTaskViews from './_components/home-task-views'
import HomeTopbar from './_components/home-topbar'
import {
  countDueThisWeek,
  getBusiestSection,
  groupedTasksFromApi,
  type ApiTask,
  type Organization,
  type StoreUser,
  type UiTask,
  type ViewMode,
} from './model'
import styles from './page.module.css'

export default function HomePage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const organization = useStore((s) => s.organization)
  const setUser = useStore((s) => s.setUser)
  const setOrganization = useStore((s) => s.setOrganization)
  const [checking, setChecking] = useState(true)
  const [users, setUsers] = useState<StoreUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const [taskActionBusyId, setTaskActionBusyId] = useState<number | null>(null)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | null
  >(null)
  const [createTaskBusy, setCreateTaskBusy] = useState(false)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskMeta, setNewTaskMeta] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([])
  const [newTaskSection, setNewTaskSection] = useState<
    'Issues Found' | 'Review' | 'Ready'
  >('Review')
  const [newTaskStage, setNewTaskStage] = useState<
    'Initiation' | 'Planning' | 'Execution'
  >('Planning')
  const [newTaskPriority, setNewTaskPriority] = useState<'flag' | 'muted'>(
    'muted'
  )
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  function nextStage(current: ApiTask['stage']): ApiTask['stage'] {
    if (current === 'Initiation') return 'Planning'
    if (current === 'Planning') return 'Execution'
    return 'Initiation'
  }

  async function updateTaskOnServer(
    taskId: number,
    payload: Partial<Pick<ApiTask, 'stage' | 'priority' | 'section' | 'assignees'>>
  ) {
    setTaskActionBusyId(taskId)
    setIntegrationError(null)
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte uppdatera task.')
        return
      }

      const updated = (await res.json()) as ApiTask
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
    } catch (e) {
      console.error('update task error', e)
      setIntegrationError('Kunde inte uppdatera task.')
    } finally {
      setTaskActionBusyId(null)
    }
  }

  function handleNextStage(task: UiTask) {
    if (!task.id) return
    void updateTaskOnServer(task.id, {
      stage: nextStage(task.stage),
    })
  }

  function handleTogglePriority(task: UiTask) {
    if (!task.id) return
    void updateTaskOnServer(task.id, {
      priority: task.priority === 'flag' ? 'muted' : 'flag',
    })
  }

  function handleDeleteTask(task: UiTask) {
    if (!task.id) return
    void deleteTaskOnServer(task.id)
  }

  function handleMoveTask(
    task: UiTask,
    targetSection: 'Issues Found' | 'Review' | 'Ready'
  ) {
    if (!task.id) return
    if (task.section === targetSection) return
    void updateTaskOnServer(task.id, { section: targetSection })
  }

  function handleAssigneesChange(task: UiTask, assignee: string | null) {
    if (!task.id) return
    void updateTaskOnServer(task.id, {
      assignees: assignee ? [assignee] : [],
    })
  }

  async function deleteTaskOnServer(taskId: number) {
    setTaskActionBusyId(taskId)
    setIntegrationError(null)
    try {
      const res = await fetch(`/api/task/${taskId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte ta bort task.')
        return
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (e) {
      console.error('delete task error', e)
      setIntegrationError('Kunde inte ta bort task.')
    } finally {
      setTaskActionBusyId(null)
    }
  }

  async function createTaskOnServer() {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          meta: newTaskMeta.trim() || null,
          dueDate: newTaskDueDate || null,
          stage: newTaskStage,
          priority: newTaskPriority,
          section: newTaskSection,
          assignees: newTaskAssignees,
          color: null,
          organizationId: user?.organizationId ?? organization?.id ?? null,
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
      setNewTaskAssignees([])
      setNewTaskSection('Review')
      setNewTaskStage('Planning')
      setNewTaskPriority('muted')
      setCreateTaskModalOpen(false)
    } catch (e) {
      console.error('create task error', e)
      setIntegrationError('Kunde inte skapa task.')
    } finally {
      setCreateTaskBusy(false)
    }
  }

  async function loadTasksForOrganization(organizationId: number | null) {
    try {
      const url = organizationId
        ? `/api/task?organizationId=${organizationId}`
        : '/api/task'
      const res = await fetch(url)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte ladda tasks for space.')
        return
      }

      const taskData = (await res.json()) as ApiTask[]
      setTasks(Array.isArray(taskData) ? taskData : [])
    } catch (e) {
      console.error('load tasks for organization error', e)
      setIntegrationError('Kunde inte ladda tasks for space.')
    }
  }

  useEffect(() => {
    let mounted = true

    async function verify() {
      try {
        if (!rehydrated) return
        if (!token) {
          router.replace('/login')
          return
        }

        const res = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          router.replace('/login')
          return
        }

        const verifyData = await res.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as StoreUser)
            : null

        let taskUrl = '/api/task'

        if (verifiedUser?.id) {
          setUser(verifiedUser)

          if (verifiedUser.organizationId) {
            setSelectedOrganizationId(verifiedUser.organizationId)
            const orgRes = await fetch(
              `/api/organization/${verifiedUser.organizationId}`
            )
            taskUrl = `/api/task?organizationId=${verifiedUser.organizationId}`
            if (orgRes.ok) {
              const orgData = (await orgRes.json()) as Organization
              setOrganization(orgData)
            } else {
              setOrganization(null)
            }
          } else {
            setOrganization(null)
          }
        }

        const [usersRes, organizationsRes, tasksRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/organization'),
          fetch(taskUrl),
        ])

        if (usersRes.ok) {
          const usersData = (await usersRes.json()) as StoreUser[]
          setUsers(Array.isArray(usersData) ? usersData : [])
        }

        if (organizationsRes.ok) {
          const organizationsData =
            (await organizationsRes.json()) as Organization[]
          setOrganizations(
            Array.isArray(organizationsData) ? organizationsData : []
          )
        }

        if (tasksRes.ok) {
          const taskData = (await tasksRes.json()) as ApiTask[]
          setTasks(Array.isArray(taskData) ? taskData : [])
        }

        if (!usersRes.ok || !organizationsRes.ok || !tasksRes.ok) {
          setIntegrationError('Viss dashboard-data kunde inte laddas.')
        }

        if (mounted) setChecking(false)
      } catch (e) {
        console.error('verify error', e)
        setIntegrationError('Kunde inte ladda dashboard-data.')
        router.replace('/login')
      }
    }

    void verify()

    return () => {
      mounted = false
    }
  }, [router, token, rehydrated, setUser, setOrganization])

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message="Building your workspace..." />
      </main>
    )
  }

  const projectTitle =
    organization?.name || organizations[0]?.name || 'Company Event'
  const personName = user?.name || 'Guest'
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'

  const usersWithEmail = users.filter((u) => !!u.email).length
  const activeOrganizationId =
    selectedOrganizationId ?? organization?.id ?? user?.organizationId ?? null

  const organizationUsers =
    typeof activeOrganizationId === 'number'
      ? users.filter((u) => u.organizationId === activeOrganizationId)
      : users

  const assigneeOptions = organizationUsers
    .map((u) => {
      const name = u.name?.trim()
      if (name) {
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('')
        return initials || name.slice(0, 2).toUpperCase()
      }

      const local = u.email?.split('@')[0]?.trim()
      if (local) {
        return local.slice(0, 2).toUpperCase()
      }

      return `U${u.id}`
    })
    .filter((value, index, arr) => value.length > 0 && arr.indexOf(value) === index)
    .slice(0, 12)
  const boardGroups = groupedTasksFromApi(tasks)
  const dueThisWeek = countDueThisWeek(tasks)
  const busiestSection = getBusiestSection(tasks)

  const availableSpaces =
    organizations.length > 0
      ? organizations
      : organization
      ? [organization]
      : []

  const workspaceSub = organization?.city
    ? `${organization.city} workspace connected to live data.`
    : 'Campaign planning across review, approval and launch.'

  return (
    <main className={styles.shell}>
      <HomeSidebar
        personInitials={personInitials}
        personName={personName}
        userEmail={user?.email || 'Signed in'}
        availableSpaces={availableSpaces}
        selectedOrganizationId={selectedOrganizationId}
        currentOrganizationId={organization?.id}
        onSelectOrganization={(org) => {
          setSelectedOrganizationId(org.id)
          setOrganization(org)
          void loadTasksForOrganization(org.id)
        }}
      />

      <section className={styles.content}>
        <HomeTopbar
          projectTitle={projectTitle}
          workspaceSub={workspaceSub}
          viewMode={viewMode}
          onChangeView={setViewMode}
        />

        <section className={styles.createTaskQuickAction}>
          <button
            className={styles.createTaskButton}
            type="button"
            onClick={() => {
              setIntegrationError(null)
              setCreateTaskModalOpen(true)
            }}
          >
            + New Task
          </button>
        </section>

        <HomeOverview
          taskCount={tasks.length}
          userCount={users.length}
          usersWithEmail={usersWithEmail}
          dueThisWeek={dueThisWeek}
          hasTasks={tasks.length > 0}
          busiestSection={busiestSection}
        />

        <CreateTaskModal
          open={createTaskModalOpen}
          busy={createTaskBusy}
          title={newTaskTitle}
          meta={newTaskMeta}
          dueDate={newTaskDueDate}
          assignees={newTaskAssignees}
          assigneeOptions={assigneeOptions}
          section={newTaskSection}
          stage={newTaskStage}
          priority={newTaskPriority}
          onClose={() => setCreateTaskModalOpen(false)}
          onSubmit={() => {
            void createTaskOnServer()
          }}
          onTitleChange={setNewTaskTitle}
          onMetaChange={setNewTaskMeta}
          onDueDateChange={setNewTaskDueDate}
          onAssigneesChange={setNewTaskAssignees}
          onSectionChange={setNewTaskSection}
          onStageChange={setNewTaskStage}
          onPriorityChange={setNewTaskPriority}
        />

        {integrationError ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>{integrationError}</div>
          </section>
        ) : null}

        <HomeTaskViews
          viewMode={viewMode}
          groups={boardGroups}
          busyTaskId={taskActionBusyId}
          assigneeOptions={assigneeOptions}
          onNextStage={handleNextStage}
          onTogglePriority={handleTogglePriority}
          onDelete={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onAssigneesChange={handleAssigneesChange}
        />
      </section>
    </main>
  )
}
