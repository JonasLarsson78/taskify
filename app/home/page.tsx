'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import { buildJsonAuthHeaders } from '../../lib/request-headers'
import { getContent } from '../../lib/content'
import CreateTaskModal from './_components/create-task-modal'
import EditTaskModal from './_components/edit-task-modal'
import HomeOverview from './_components/home-overview'
import HomeQuickActions from './_components/home-quick-actions'
import HomeSidebar from './_components/home-sidebar'
import SpaceSettingsModal from './_components/space-settings-modal'
import HomeTaskViews from './_components/home-task-views'
import HomeTopbar from './_components/home-topbar'
import useHomeTaskActions from './_hooks/use-home-task-actions'
import useHomeWorkspaceData from './_hooks/use-home-workspace-data'
import {
  type AssigneeOption,
  countDueThisWeek,
  DEFAULT_SECTION_PALETTE,
  DEFAULT_TASK_SECTIONS,
  getBusiestSection,
  groupedTasksFromApi,
  normalizeSectionColorMap,
  normalizeSectionList,
  type ApiTask,
  type Space,
  type ViewMode,
} from './model'
import styles from './page.module.css'

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const ui = getContent(user?.preferredLanguage)
  const organization = useStore((s) => s.organization)
  const setUser = useStore((s) => s.setUser)
  const setOrganization = useStore((s) => s.setOrganization)
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const {
    checking,
    tasksLoading,
    users,
    organizations,
    spaces,
    selectedOrganizationId,
    selectedSpaceId,
    sectionOptions,
    sectionColors,
    setSpaces,
    setSelectedSpaceId,
    setSectionOptions,
    setSectionColors,
    loadTasksForSpace,
  } = useHomeWorkspaceData({
    token,
    rehydrated,
    setUser,
    setOrganization,
    setTasks,
    setIntegrationError,
    redirectToLogin: () => router.replace('/login'),
  })
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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const selectedSpaceIdRef = useRef<number | null>(null)

  const activeOrganizationId =
    selectedOrganizationId ?? organization?.id ?? user?.organizationId ?? null

  const {
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
  } = useHomeTaskActions({
    token,
    userRole: user?.role,
    organizationId: activeOrganizationId,
    selectedSpaceId,
    tasks,
    setTasks,
    setIntegrationError,
  })

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

  function buildHomeUrl(nextView: ViewMode, nextSpaceId?: number | null) {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )

    params.set('view', nextView)

    if (nextSpaceId) {
      params.set('spaceId', String(nextSpaceId))
    } else {
      params.delete('spaceId')
    }

    return `${pathname}?${params.toString()}`
  }

  const applyUrlViewState = useCallback((nextSearch: string) => {
    const params = new URLSearchParams(nextSearch)

    const nextView = parseViewMode(params.get('view'))
    setViewMode((prev) => (prev === nextView ? prev : nextView))
  }, [])

  const applyUrlSpaceState = useCallback(
    (nextSearch: string) => {
      const params = new URLSearchParams(nextSearch)
      const rawSpaceId = params.get('spaceId')
      const nextSpaceId = Number.parseInt(rawSpaceId || '', 10)

      if (!Number.isFinite(nextSpaceId)) return
      if (nextSpaceId === selectedSpaceIdRef.current) return

      const nextSpace = spaces.find((space) => space.id === nextSpaceId)
      if (!nextSpace) return

      setSelectedSpaceId(nextSpace.id)
      setSectionOptions(normalizeSectionList(nextSpace.taskSections))
      setSectionColors(
        normalizeSectionColorMap(
          nextSpace.taskSectionColors,
          nextSpace.taskSections
        )
      )
      void loadTasksForSpace(activeOrganizationId, nextSpace.id)
    },
    [
      activeOrganizationId,
      loadTasksForSpace,
      setSectionColors,
      setSectionOptions,
      setSelectedSpaceId,
      spaces,
    ]
  )

  async function saveSectionsForOrganization() {
    if (user?.role !== 'admin') {
      setIntegrationError(ui.home.errors.adminOnlySpaceSettings)
      return
    }

    if (!selectedSpaceId) {
      setIntegrationError(ui.home.errors.selectSpaceFirst)
      return
    }

    setSpaceSettingsBusy(true)
    setIntegrationError(null)

    try {
      const nextSpaceName = spaceNameDraft.trim()
      if (!nextSpaceName) {
        setIntegrationError(ui.home.errors.spaceNameRequired)
        return
      }

      const res = await fetch(`/api/space/${selectedSpaceId}`, {
        method: 'PUT',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify({
          name: nextSpaceName,
          taskSections: sectionOptions,
          taskSectionColors: sectionColors,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setIntegrationError(
          data?.error || ui.home.errors.saveSpaceSettingsFailed
        )
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
      setIntegrationError(ui.home.errors.saveSpaceSettingsFailed)
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

  useEffect(() => {
    setNewTaskSection((prev) => {
      if (sectionOptions.includes(prev)) return prev
      return sectionOptions[0] || 'Review'
    })
  }, [sectionOptions, setNewTaskSection])

  useEffect(() => {
    setSectionColors((prev) => normalizeSectionColorMap(prev, sectionOptions))
  }, [sectionOptions, setSectionColors])

  useEffect(() => {
    selectedSpaceIdRef.current = selectedSpaceId
  }, [selectedSpaceId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    applyUrlViewState(window.location.search)
  }, [applyUrlViewState])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (spaces.length === 0) return
    applyUrlSpaceState(window.location.search)
  }, [applyUrlSpaceState, spaces.length])

  const personName = user?.name || ui.home.guest
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'

  if (checking) {
    return (
      <main className={styles.shell}>
        <HomeSidebar
          personInitials={personInitials}
          personName={personName}
          userEmail={user?.email || ui.home.signedIn}
          activeItem="home"
          content={ui.home.sidebar}
          onOpenHome={() => router.replace(buildHomeUrl(viewMode, null))}
          onOpenArchive={() => router.push('/archive')}
          onOpenLog={() => router.push('/log')}
          onOpenGoals={() => router.push('/goals')}
          onOpenSettings={() => router.push('/settings')}
          onOpenLogout={() => router.push('/logout')}
        />

        <section className={styles.content}>
          <section className={styles.workspaceLoadingCard} aria-live="polite">
            <div className={styles.workspaceLoadingHeader}>
              <span className={styles.workspaceLoadingBadge} aria-hidden />
              <div>
                <p className={styles.workspaceLoadingKicker}>Taskify Workspace</p>
                <h1 className={styles.workspaceLoadingTitle}>{ui.home.loading}</h1>
              </div>
            </div>

            <p className={styles.workspaceLoadingHint}>
              Preparing spaces, members and tasks...
            </p>

            <div className={styles.workspaceLoadingSpinner}>
              <Loader size="lg" message={ui.home.loading} />
            </div>

            <div className={styles.workspaceLoadingSkeleton} aria-hidden>
              <span className={styles.workspaceLoadingLineLong} />
              <span className={styles.workspaceLoadingLineMedium} />
              <span className={styles.workspaceLoadingLineShort} />
            </div>
          </section>
        </section>
      </main>
    )
  }

  const activeSpace =
    spaces.find((space) => space.id === selectedSpaceId) || spaces[0] || null

  const projectTitle =
    activeSpace?.name ||
    organization?.name ||
    organizations[0]?.name ||
    ui.home.projectFallback
  const userRole = user?.role || 'guest'
  const canWriteTaskData = userRole !== 'guest'
  const canManageWorkspaceData = userRole === 'admin'

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
  const tasksForSelectedSpace =
    typeof selectedSpaceId === 'number'
      ? tasks.filter((task) => task.spaceId === selectedSpaceId)
      : tasks

  const filteredTasks = tasksForSelectedSpace.filter((task) => {
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
  const dueThisWeek = countDueThisWeek(tasksForSelectedSpace)
  const busiestSection = getBusiestSection(tasksForSelectedSpace)

  const workspaceSub = organization?.city
    ? ui.home.workspaceSubConnected(organization.city)
    : ui.home.workspaceSubFallback

  return (
    <main className={styles.shell}>
      <HomeSidebar
        personInitials={personInitials}
        personName={personName}
        userEmail={user?.email || ui.home.signedIn}
        activeItem="home"
        showSpaces
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        content={ui.home.sidebar}
        onOpenHome={() =>
          router.replace(buildHomeUrl(viewMode, selectedSpaceId))
        }
        onOpenArchive={() => router.push('/archive')}
        onOpenLog={() => router.push('/log')}
        onOpenGoals={() => router.push('/goals')}
        onOpenSettings={() => router.push('/settings')}
        onOpenLogout={() => router.push('/logout')}
        canCreateSpace={canManageWorkspaceData}
        onSelectSpace={(space) => {
          setSelectedSpaceId(space.id)
          setSectionOptions(normalizeSectionList(space.taskSections))
          setSectionColors(
            normalizeSectionColorMap(
              space.taskSectionColors,
              space.taskSections
            )
          )
          router.replace(buildHomeUrl(viewMode, space.id))
          void loadTasksForSpace(activeOrganizationId, space.id)
        }}
        onCreateSpace={() => {
          void (async () => {
            if (!activeOrganizationId) {
              setIntegrationError(ui.home.errors.selectOrganizationFirst)
              return
            }

            const fallbackName = `Space ${spaces.length + 1}`
            const res = await fetch('/api/space', {
              method: 'POST',
              headers: buildJsonAuthHeaders(token),
              body: JSON.stringify({
                organizationId: activeOrganizationId,
                name: fallbackName,
              }),
            })

            if (!res.ok) {
              setIntegrationError(ui.home.errors.createSpaceFailed)
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
          })()
        }}
      />

      <section className={styles.content}>
        <HomeTopbar
          projectTitle={projectTitle}
          workspaceSub={workspaceSub}
          viewMode={viewMode}
          onChangeView={handleChangeView}
          content={ui.home.topbar}
          canOpenSpaceSettings={canManageWorkspaceData}
          onOpenSpaceSettings={() => {
            if (!canManageWorkspaceData) {
              setIntegrationError(ui.home.errors.adminOnlySpaceSettings)
              return
            }
            setIntegrationError(null)
            setSpaceNameDraft(activeSpace?.name?.trim() || projectTitle)
            setSpaceSettingsOpen(true)
          }}
        />

        <HomeQuickActions
          canWriteTaskData={canWriteTaskData}
          searchQuery={searchQuery}
          content={ui.home.quickActions}
          onNewTask={() => {
            setIntegrationError(null)
            setCreateTaskModalOpen(true)
          }}
          onSearchChange={setSearchQuery}
        />

        <HomeOverview
          taskCount={tasks.length}
          userCount={users.length}
          usersWithEmail={usersWithEmail}
          dueThisWeek={dueThisWeek}
          hasTasks={tasks.length > 0}
          busiestSection={busiestSection}
          content={ui.home.overview}
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
          content={ui.home.createModal}
          commonContent={ui.common}
          taskContent={ui.home.task}
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
          content={ui.home.editModal}
          commonContent={ui.common}
          taskContent={ui.home.task}
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
          onTitleChange={handleEditTaskTitleChange}
          onMetaChange={handleEditTaskMetaChange}
          onDueDateChange={handleEditTaskDueDateChange}
          onAssigneeIdsChange={handleEditTaskAssigneeIdsChange}
          onSectionChange={handleEditTaskSectionChange}
          onPriorityChange={handleEditTaskPriorityChange}
          onColorChange={handleEditTaskColorChange}
        />

        <SpaceSettingsModal
          open={spaceSettingsOpen}
          spaceSettingsBusy={spaceSettingsBusy}
          isAdmin={user?.role === 'admin'}
          spaceNameDraft={spaceNameDraft}
          newSectionName={newSectionName}
          sectionOptions={sectionOptions}
          sectionColors={sectionColors}
          draggingSectionName={draggingSectionName}
          dragOverSectionName={dragOverSectionName}
          content={ui.home.spaceSettings}
          commonContent={ui.common}
          onClose={() => setSpaceSettingsOpen(false)}
          onSpaceNameChange={setSpaceNameDraft}
          onNewSectionNameChange={setNewSectionName}
          onAddSection={addSectionToDraft}
          onDragStart={setDraggingSectionName}
          onDragOver={setDragOverSectionName}
          onDragLeave={(section) => {
            setDragOverSectionName((prev) => (prev === section ? null : prev))
          }}
          onDrop={(draggedSection, targetSection) => {
            reorderSectionDraft(draggedSection, targetSection)
            setDraggingSectionName(null)
            setDragOverSectionName(null)
          }}
          onDragEnd={() => {
            setDraggingSectionName(null)
            setDragOverSectionName(null)
          }}
          onUpdateSectionColor={updateSectionColor}
          onRemoveSection={removeSectionFromDraft}
          onSave={() => {
            void saveSectionsForOrganization()
          }}
        />

        {integrationError ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>{integrationError}</div>
          </section>
        ) : null}

        {searchQuery.trim() ? (
          <section className={styles.board}>
            <div className={styles.taskMeta}>
              {ui.home.searchResult(
                filteredTasks.length,
                tasks.length,
                searchQuery.trim()
              )}
            </div>
          </section>
        ) : null}

        <HomeTaskViews
          viewMode={viewMode}
          groups={boardGroups}
          busyTaskId={taskActionBusyId}
          assigneeOptions={assigneeOptions}
          taskContent={ui.home.task}
          onTogglePriority={handleTogglePriority}
          onMoveTask={handleMoveTask}
          onAssigneesChange={handleAssigneesChange}
          onOpenTask={handleOpenTask}
        />

        {tasksLoading && !integrationError ? (
          <Loader message={ui.home.loading} />
        ) : null}
      </section>
    </main>
  )
}
