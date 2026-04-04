'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import CreateTaskModal from './_components/create-task-modal'
import EditTaskModal from './_components/edit-task-modal'
import HomeOverview from './_components/home-overview'
import HomeSidebar from './_components/home-sidebar'
import HomeTaskViews from './_components/home-task-views'
import HomeTopbar from './_components/home-topbar'
import {
  type AssigneeOption,
  countDueThisWeek,
  getBusiestSection,
  groupedTasksFromApi,
  type ApiTask,
  type Organization,
  type Space,
  type StoreUser,
  type UiTask,
  type ViewMode,
} from './model'
import styles from './page.module.css'

const DEFAULT_TASK_SECTIONS = ['Issues Found', 'Review', 'Ready']
const DEFAULT_SECTION_PALETTE = [
  '#ff5f98',
  '#ffb000',
  '#6259ff',
  '#2dbdb8',
  '#49a4ff',
  '#a35cff',
]

function normalizeSectionList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_TASK_SECTIONS]

  const sections = raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(
      (value, index, arr) => value.length > 0 && arr.indexOf(value) === index
    )

  return sections.length > 0
    ? sections.slice(0, 32)
    : [...DEFAULT_TASK_SECTIONS]
}

function normalizeSectionColorMap(
  raw: unknown,
  sections: string[]
): Record<string, string> {
  const defaults = sections.reduce((acc, section, index) => {
    acc[section] =
      DEFAULT_SECTION_PALETTE[index % DEFAULT_SECTION_PALETTE.length]
    return acc
  }, {} as Record<string, string>)

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults
  }

  const input = raw as Record<string, unknown>
  return sections.reduce((acc, section) => {
    const value = input[section]
    if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
      acc[section] = value.toLowerCase()
      return acc
    }

    acc[section] = defaults[section]
    return acc
  }, {} as Record<string, string>)
}

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const organization = useStore((s) => s.organization)
  const setUser = useStore((s) => s.setUser)
  const setOrganization = useStore((s) => s.setOrganization)
  const [checking, setChecking] = useState(true)
  const [users, setUsers] = useState<StoreUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const [taskActionBusyId, setTaskActionBusyId] = useState<number | null>(null)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | null
  >(null)
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
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskMeta, setNewTaskMeta] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskColor, setNewTaskColor] = useState('#716bff')
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<number[]>([])
  const [newTaskSection, setNewTaskSection] = useState<string>('Review')
  const [sectionOptions, setSectionOptions] = useState<string[]>([
    ...DEFAULT_TASK_SECTIONS,
  ])
  const [sectionColors, setSectionColors] = useState<Record<string, string>>(
    () => normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS)
  )
  const [spaceSettingsOpen, setSpaceSettingsOpen] = useState(false)
  const [spaceSettingsBusy, setSpaceSettingsBusy] = useState(false)
  const [spaceNameDraft, setSpaceNameDraft] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [draggingSectionName, setDraggingSectionName] = useState<string | null>(
    null
  )
  const [dragOverSectionName, setDragOverSectionName] = useState<string | null>(
    null
  )
  const [newTaskPriority, setNewTaskPriority] = useState<
    'High' | 'Normal' | 'Low'
  >('Normal')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')

  function parseViewMode(value: string | null): ViewMode {
    if (value === 'board' || value === 'box') return value
    return 'list'
  }

  function handleChangeView(next: ViewMode) {
    setViewMode(next)

    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    params.set('view', next)
    router.replace(`${pathname}?${params.toString()}`)
  }

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
        headers: { 'Content-Type': 'application/json' },
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
    } catch (e) {
      if (rollbackTasks) {
        setTasks(rollbackTasks)
      }
      console.error('update task error', e)
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
    setEditTaskModalOpen(true)
  }

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
    setTaskActionBusyId(taskId)
    setIntegrationError(null)
    try {
      const res = await fetch(`/api/task/${taskId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte ta bort task.')
        return false
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      return true
    } catch (e) {
      console.error('delete task error', e)
      setIntegrationError('Kunde inte ta bort task.')
      return false
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
          priority: newTaskPriority,
          section: newTaskSection,
          assigneeIds: newTaskAssigneeIds,
          color: newTaskColor,
          organizationId: user?.organizationId ?? organization?.id ?? null,
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
    } catch (e) {
      console.error('create task error', e)
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

  async function loadTasksForSpace(
    organizationId: number | null,
    spaceId: number | null
  ) {
    try {
      const url = organizationId
        ? `/api/task?organizationId=${organizationId}${
            spaceId ? `&spaceId=${spaceId}` : ''
          }`
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
      console.error('load tasks for space error', e)
      setIntegrationError('Kunde inte ladda tasks for space.')
    }
  }

  async function loadSpacesForOrganization(organizationId: number | null) {
    if (!organizationId) {
      setSpaces([])
      setSelectedSpaceId(null)
      setSectionOptions([...DEFAULT_TASK_SECTIONS])
      setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
      return
    }

    try {
      const res = await fetch(`/api/space?organizationId=${organizationId}`)
      if (!res.ok) {
        setSpaces([])
        setSelectedSpaceId(null)
        setSectionOptions([...DEFAULT_TASK_SECTIONS])
        setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
        return
      }

      const data = (await res.json()) as Space[]
      const nextSpaces = Array.isArray(data) ? data : []
      setSpaces(nextSpaces)

      const nextSelectedSpaceId = nextSpaces[0]?.id ?? null
      setSelectedSpaceId(nextSelectedSpaceId)

      const activeSpace = nextSpaces.find(
        (space) => space.id === nextSelectedSpaceId
      )
      const nextSections = normalizeSectionList(activeSpace?.taskSections)
      const nextColors = normalizeSectionColorMap(
        activeSpace?.taskSectionColors,
        nextSections
      )

      setSectionOptions(nextSections)
      setSectionColors(nextColors)
      await loadTasksForSpace(organizationId, nextSelectedSpaceId)
    } catch (e) {
      console.error('load spaces for organization error', e)
      setSpaces([])
      setSelectedSpaceId(null)
      setSectionOptions([...DEFAULT_TASK_SECTIONS])
      setSectionColors(normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS))
    }
  }

  async function saveSectionsForOrganization() {
    if (!selectedSpaceId) {
      setIntegrationError('Välj ett space först innan du sparar settings.')
      return
    }

    setSpaceSettingsBusy(true)
    setIntegrationError(null)

    try {
      const nextSpaceName = spaceNameDraft.trim()
      if (!nextSpaceName) {
        setIntegrationError('Space name is required.')
        return
      }

      const res = await fetch(`/api/space/${selectedSpaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nextSpaceName,
          taskSections: sectionOptions,
          taskSectionColors: sectionColors,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(data?.error || 'Kunde inte spara space settings.')
        return
      }

      const payload = (await res.json()) as {
        taskSections?: unknown
        taskSectionColors?: unknown
        name?: unknown
      }
      const savedSections = normalizeSectionList(payload.taskSections)
      const savedColors = normalizeSectionColorMap(
        payload.taskSectionColors,
        savedSections
      )
      setSectionOptions(savedSections)
      setSectionColors(savedColors)
      setSpaces((prev) =>
        prev.map((space) =>
          space.id === selectedSpaceId
            ? {
                ...space,
                name:
                  typeof payload.name === 'string' && payload.name.trim()
                    ? payload.name.trim()
                    : space.name,
                taskSections: savedSections,
                taskSectionColors: savedColors,
              }
            : space
        )
      )
      setSpaceSettingsOpen(false)
    } catch (e) {
      console.error('save sections for organization error', e)
      setIntegrationError('Kunde inte spara space settings.')
    } finally {
      setSpaceSettingsBusy(false)
    }
  }

  function addSectionToDraft() {
    const candidate = newSectionName.trim()
    if (!candidate) return

    setSectionOptions((prev) => {
      if (prev.includes(candidate)) return prev
      return [...prev, candidate].slice(0, 32)
    })
    setSectionColors((prev) => {
      if (prev[candidate]) return prev
      const index = sectionOptions.length
      return {
        ...prev,
        [candidate]:
          DEFAULT_SECTION_PALETTE[index % DEFAULT_SECTION_PALETTE.length],
      }
    })
    setNewSectionName('')
  }

  function removeSectionFromDraft(section: string) {
    setSectionOptions((prev) => {
      const next = prev.filter((item) => item !== section)
      return next.length > 0 ? next : [...DEFAULT_TASK_SECTIONS]
    })
    setSectionColors((prev) => {
      const next = { ...prev }
      delete next[section]
      return next
    })
  }

  function updateSectionColor(section: string, color: string) {
    setSectionColors((prev) => ({ ...prev, [section]: color }))
  }

  function reorderSectionDraft(draggedSection: string, targetSection: string) {
    if (draggedSection === targetSection) return

    setSectionOptions((prev) => {
      const sourceIndex = prev.indexOf(draggedSection)
      const targetIndex = prev.indexOf(targetSection)

      if (sourceIndex === -1 || targetIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  /* eslint-disable react-hooks/exhaustive-deps */
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

        let activeOrganizationId: number | null = null

        if (verifiedUser?.id) {
          setUser(verifiedUser)

          if (verifiedUser.organizationId) {
            setSelectedOrganizationId(verifiedUser.organizationId)
            activeOrganizationId = verifiedUser.organizationId
            const orgRes = await fetch(
              `/api/organization/${verifiedUser.organizationId}`
            )
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
          fetch(
            activeOrganizationId
              ? `/api/task?organizationId=${activeOrganizationId}`
              : '/api/task'
          ),
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

        if (verifiedUser?.organizationId) {
          await loadSpacesForOrganization(verifiedUser.organizationId)
        } else {
          setSpaces([])
          setSelectedSpaceId(null)
          setSectionOptions([...DEFAULT_TASK_SECTIONS])
          setSectionColors(
            normalizeSectionColorMap(null, DEFAULT_TASK_SECTIONS)
          )
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
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    setNewTaskSection((prev) => {
      if (sectionOptions.includes(prev)) return prev
      return sectionOptions[0] || 'Review'
    })
  }, [sectionOptions])

  useEffect(() => {
    setSectionColors((prev) => normalizeSectionColorMap(prev, sectionOptions))
  }, [sectionOptions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const next = parseViewMode(params.get('view'))
    setViewMode((prev) => (prev === next ? prev : next))
  }, [])

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message="Building your workspace..." />
      </main>
    )
  }

  const activeOrganizationId =
    selectedOrganizationId ?? organization?.id ?? user?.organizationId ?? null

  const activeSpace =
    spaces.find((space) => space.id === selectedSpaceId) || spaces[0] || null

  const projectTitle =
    activeSpace?.name ||
    organization?.name ||
    organizations[0]?.name ||
    'Company Event'
  const personName = user?.name || 'Guest'
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'

  const usersWithEmail = users.filter((u) => !!u.email).length

  const organizationUsers =
    typeof activeOrganizationId === 'number'
      ? users.filter((u) => u.organizationId === activeOrganizationId)
      : users

  const assigneeOptions: AssigneeOption[] = organizationUsers
    .map((u) => {
      const name = u.name?.trim()
      if (name) {
        return { id: u.id, label: name }
      }

      const local = u.email?.split('@')[0]?.trim()
      if (local) {
        return { id: u.id, label: local }
      }

      return { id: u.id, label: `User ${u.id}` }
    })
    .filter(
      (value, index, arr) =>
        arr.findIndex((candidate) => candidate.id === value.id) === index
    )
    .slice(0, 24)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredTasks = tasks.filter((task) => {
    if (!normalizedSearch) return true

    const assigneeLabels = task.assigneeIds
      .map(
        (id) => assigneeOptions.find((option) => option.id === id)?.label || ''
      )
      .join(' ')

    const haystack = [
      task.title,
      task.meta || '',
      task.section,
      task.priority,
      task.stage,
      assigneeLabels,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })
  const boardGroups = groupedTasksFromApi(
    filteredTasks,
    sectionOptions,
    sectionColors
  )
  const dueThisWeek = countDueThisWeek(tasks)
  const busiestSection = getBusiestSection(tasks)

  const workspaceSub = organization?.city
    ? `${organization.city} workspace connected to live data.`
    : 'Campaign planning across review, approval and launch.'

  return (
    <main className={styles.shell}>
      <HomeSidebar
        personInitials={personInitials}
        personName={personName}
        userEmail={user?.email || 'Signed in'}
        viewMode={viewMode}
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        onChangeView={handleChangeView}
        onOpenArchive={() => router.push('/archive')}
        onSelectSpace={(space) => {
          setSelectedSpaceId(space.id)
          setSectionOptions(normalizeSectionList(space.taskSections))
          setSectionColors(
            normalizeSectionColorMap(
              space.taskSectionColors,
              space.taskSections
            )
          )
          void loadTasksForSpace(activeOrganizationId, space.id)
        }}
        onCreateSpace={() => {
          void (async () => {
            if (!activeOrganizationId) {
              setIntegrationError('Välj en organization först.')
              return
            }

            const fallbackName = `Space ${spaces.length + 1}`
            const res = await fetch('/api/space', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizationId: activeOrganizationId,
                name: fallbackName,
              }),
            })

            if (!res.ok) {
              setIntegrationError('Kunde inte skapa nytt space.')
              return
            }

            const created = (await res.json()) as Space
            if (!created?.id) return

            setSpaces((prev) => [...prev, created])
            setSelectedSpaceId(created.id)
            setSectionOptions(normalizeSectionList(created.taskSections))
            setSectionColors(
              normalizeSectionColorMap(
                created.taskSectionColors,
                created.taskSections
              )
            )
            setTasks([])
          })()
        }}
      />

      <section className={styles.content}>
        <HomeTopbar
          projectTitle={projectTitle}
          workspaceSub={workspaceSub}
          viewMode={viewMode}
          onChangeView={handleChangeView}
          onOpenSpaceSettings={() => {
            setIntegrationError(null)
            setSpaceNameDraft(activeSpace?.name?.trim() || projectTitle)
            setSpaceSettingsOpen(true)
          }}
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
          <input
            className={`${styles.createInput} ${styles.quickSearchInput}`}
            type="search"
            value={searchQuery}
            placeholder="Search tasks, meta, section or assignee"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
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
          assigneeIds={newTaskAssigneeIds}
          assigneeOptions={assigneeOptions}
          section={newTaskSection}
          sectionOptions={sectionOptions}
          priority={newTaskPriority}
          color={newTaskColor}
          onClose={() => setCreateTaskModalOpen(false)}
          onSubmit={() => {
            void createTaskOnServer()
          }}
          onTitleChange={setNewTaskTitle}
          onMetaChange={setNewTaskMeta}
          onDueDateChange={setNewTaskDueDate}
          onAssigneeIdsChange={setNewTaskAssigneeIds}
          onSectionChange={setNewTaskSection}
          onPriorityChange={setNewTaskPriority}
          onColorChange={setNewTaskColor}
        />

        <EditTaskModal
          open={editTaskModalOpen}
          busy={taskActionBusyId === editTaskId}
          title={editTaskTitle}
          meta={editTaskMeta}
          dueDate={editTaskDueDate}
          assigneeIds={editTaskAssigneeIds}
          assigneeOptions={assigneeOptions}
          section={editTaskSection}
          sectionOptions={sectionOptions}
          priority={editTaskPriority}
          color={editTaskColor}
          onClose={() => setEditTaskModalOpen(false)}
          onSubmit={() => {
            void saveEditedTask()
          }}
          onArchive={() => {
            if (!editTaskId) return
            void (async () => {
              const ok = await archiveTaskOnServer(editTaskId)
              if (ok) setEditTaskModalOpen(false)
            })()
          }}
          onDelete={() => {
            if (!editTaskId) return
            void (async () => {
              const ok = await deleteTaskOnServer(editTaskId)
              if (ok) setEditTaskModalOpen(false)
            })()
          }}
          onTitleChange={setEditTaskTitle}
          onMetaChange={setEditTaskMeta}
          onDueDateChange={setEditTaskDueDate}
          onAssigneeIdsChange={setEditTaskAssigneeIds}
          onSectionChange={setEditTaskSection}
          onPriorityChange={setEditTaskPriority}
          onColorChange={setEditTaskColor}
        />

        {spaceSettingsOpen ? (
          <section
            className={styles.modalBackdrop}
            onClick={() => {
              if (!spaceSettingsBusy) setSpaceSettingsOpen(false)
            }}
          >
            <div
              className={styles.modalCard}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <div className={styles.modalTitle}>Space Settings</div>
                  <div className={styles.modalSub}>
                    Manage custom task columns for this space
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.modalClose}
                  disabled={spaceSettingsBusy}
                  onClick={() => setSpaceSettingsOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className={styles.settingsRow}>
                <input
                  className={styles.createInput}
                  type="text"
                  placeholder="Space name"
                  value={spaceNameDraft}
                  onChange={(event) => setSpaceNameDraft(event.target.value)}
                />
              </div>

              <div className={styles.settingsRow}>
                <input
                  className={styles.createInput}
                  type="text"
                  placeholder="Add new column (e.g. QA, Done, Blocked)"
                  value={newSectionName}
                  onChange={(event) => setNewSectionName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addSectionToDraft()
                    }
                  }}
                />
                <button
                  className={styles.taskActionBtn}
                  type="button"
                  onClick={addSectionToDraft}
                  disabled={spaceSettingsBusy}
                >
                  Add
                </button>
              </div>

              <div className={styles.settingsChipRow}>
                {sectionOptions.map((section) => (
                  <div
                    className={`${styles.settingsChip} ${
                      draggingSectionName === section
                        ? styles.settingsChipDragging
                        : ''
                    } ${
                      dragOverSectionName === section
                        ? styles.settingsChipDropTarget
                        : ''
                    }`}
                    key={section}
                    draggable={!spaceSettingsBusy}
                    onDragStart={(event) => {
                      setDraggingSectionName(section)
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', section)
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      if (!spaceSettingsBusy) {
                        setDragOverSectionName(section)
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverSectionName((prev) =>
                        prev === section ? null : prev
                      )
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const draggedSection =
                        event.dataTransfer.getData('text/plain')
                      reorderSectionDraft(draggedSection, section)
                      setDraggingSectionName(null)
                      setDragOverSectionName(null)
                    }}
                    onDragEnd={() => {
                      setDraggingSectionName(null)
                      setDragOverSectionName(null)
                    }}
                  >
                    <span>{section}</span>
                    <input
                      type="color"
                      className={styles.settingsColorInput}
                      value={sectionColors[section] || '#6259ff'}
                      onChange={(event) =>
                        updateSectionColor(section, event.target.value)
                      }
                      disabled={spaceSettingsBusy}
                      title={`Color for ${section}`}
                    />
                    <button
                      type="button"
                      className={styles.settingsChipRemove}
                      onClick={() => removeSectionFromDraft(section)}
                      disabled={spaceSettingsBusy}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalCancel}
                  type="button"
                  disabled={spaceSettingsBusy}
                  onClick={() => setSpaceSettingsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.createTaskButton}
                  type="button"
                  disabled={spaceSettingsBusy}
                  onClick={() => {
                    void saveSectionsForOrganization()
                  }}
                >
                  {spaceSettingsBusy ? 'Saving...' : 'Save settings'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {integrationError ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>{integrationError}</div>
          </section>
        ) : null}

        {searchQuery.trim() ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>
              Showing {filteredTasks.length} of {tasks.length} tasks for
              {' '}&quot;{searchQuery.trim()}&quot;
            </div>
          </section>
        ) : null}

        <HomeTaskViews
          viewMode={viewMode}
          groups={boardGroups}
          busyTaskId={taskActionBusyId}
          assigneeOptions={assigneeOptions}
          onTogglePriority={handleTogglePriority}
          onMoveTask={handleMoveTask}
          onAssigneesChange={handleAssigneesChange}
          onOpenTask={handleOpenTask}
        />
      </section>
    </main>
  )
}
