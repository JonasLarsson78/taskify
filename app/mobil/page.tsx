'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '../../lib/store'
import { getContent } from '../../lib/content'
import CreateTaskModal from '../home/_components/create-task-modal'
import EditTaskModal from '../home/_components/edit-task-modal'
import useHomeWorkspaceData from '../home/_hooks/use-home-workspace-data'
import useHomeTaskActions from '../home/_hooks/use-home-task-actions'
import {
  type AssigneeOption,
  countDueThisWeek,
  groupedTasksFromApi,
  normalizeSectionColorMap,
  normalizeSectionList,
  type ApiTask,
  type Space,
  type UiTask,
} from '../home/model'
import MobileNav from './_components/mobile-nav'
import styles from './page.module.css'

export default function MobilPage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const organization = useStore((s) => s.organization)
  const setUser = useStore((s) => s.setUser)
  const setOrganization = useStore((s) => s.setOrganization)
  const ui = getContent(user?.preferredLanguage)

  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    checking,
    users,
    spaces,
    selectedSpaceId,
    sectionOptions,
    sectionColors,
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

  const activeOrganizationId = organization?.id ?? user?.organizationId ?? null

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
    deleteTaskOnServer,
    archiveTaskOnServer,
    createTaskOnServer,
  } = useHomeTaskActions({
    token,
    userRole: user?.role,
    organizationId: activeOrganizationId,
    selectedSpaceId,
    tasks,
    setTasks,
    setIntegrationError,
  })

  const userRole = user?.role || 'guest'
  const canWriteTaskData = userRole !== 'guest'

  const personName = user?.name || ui.home.guest
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'

  const organizationUsers =
    typeof activeOrganizationId === 'number'
      ? users.filter((u) => u.organizationId === activeOrganizationId)
      : users

  const assigneeOptions: AssigneeOption[] = organizationUsers
    .map((u) => {
      const name = u.name?.trim()
      if (name) return { id: u.id, label: name }
      const local = u.email?.split('@')[0]?.trim()
      if (local) return { id: u.id, label: local }
      return { id: u.id, label: `User ${u.id}` }
    })
    .filter(
      (value, index, arr) =>
        arr.findIndex((candidate) => candidate.id === value.id) === index
    )
    .slice(0, 24)

  const tasksForSelectedSpace =
    typeof selectedSpaceId === 'number'
      ? tasks.filter((task) => task.spaceId === selectedSpaceId)
      : tasks

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredTasks = tasksForSelectedSpace.filter((task) => {
    if (!normalizedSearch) return true
    const assigneeLabels = task.assigneeIds
      .map(
        (id) => assigneeOptions.find((option) => option.id === id)?.label || ''
      )
      .join(' ')
    const haystack = [task.title, task.meta || '', task.section, task.priority]
      .concat(assigneeLabels)
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

  const activeSpace =
    spaces.find((space) => space.id === selectedSpaceId) || spaces[0] || null
  const projectTitle =
    activeSpace?.name || organization?.name || ui.home.projectFallback

  function selectSpace(space: Space) {
    setSelectedSpaceId(space.id)
    setSectionOptions(normalizeSectionList(space.taskSections))
    setSectionColors(
      normalizeSectionColorMap(space.taskSectionColors, space.taskSections)
    )
    void loadTasksForSpace(activeOrganizationId, space.id)
  }

  if (checking) {
    return (
      <main className={styles.shell}>
        <div className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <span className={styles.topbarDot} />
            <div>
              <p className={styles.topbarTitle}>Taskify</p>
            </div>
          </div>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingDot} />
          <p className={styles.loadingText}>{ui.home.loading}</p>
        </div>
        <MobileNav active="home" />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.topbarBrand}>
          <span className={styles.topbarDot} />
          <div>
            <p className={styles.topbarTitle}>{projectTitle}</p>
            <p className={styles.topbarSub}>{tasks.length} tasks</p>
          </div>
        </div>
        <div className={styles.topbarAvatar} aria-label={personName}>
          {personInitials}
        </div>
      </header>

      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder={ui.home.quickActions.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <div className={styles.statChip}>
          <span className={styles.statValue}>{tasks.length}</span>
          <span className={styles.statLabel}>{ui.home.overview.openTasks}</span>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statValue}>{dueThisWeek}</span>
          <span className={styles.statLabel}>
            {ui.home.overview.dueThisWeek}
          </span>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statValue}>{users.length}</span>
          <span className={styles.statLabel}>{ui.home.overview.users}</span>
        </div>
      </div>

      {/* Space picker */}
      {spaces.length > 1 && (
        <div className={styles.spacePicker}>
          {spaces.map((space) => (
            <button
              key={space.id}
              type="button"
              className={`${styles.spaceChip} ${
                space.id === selectedSpaceId ? styles.spaceChipActive : ''
              }`}
              onClick={() => selectSpace(space)}
            >
              {space.name}
            </button>
          ))}
        </div>
      )}

      {/* Error banner */}
      {integrationError && (
        <div className={styles.errorBanner}>{integrationError}</div>
      )}

      {/* Task feed */}
      <div className={styles.taskFeed}>
        {boardGroups.length === 0 ||
        boardGroups.every((g) => g.items.length === 0) ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📋</span>
            <p className={styles.emptyLabel}>
              {normalizedSearch
                ? `No tasks matching "${searchQuery}"`
                : 'No tasks yet'}
            </p>
          </div>
        ) : (
          boardGroups.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.label}>
                <div
                  className={styles.sectionLabel}
                  style={{ background: group.color }}
                >
                  {group.label}
                </div>
                {group.items.map((task) => (
                  <MobileTaskCard
                    key={task.id}
                    task={task}
                    busy={taskActionBusyId === task.id}
                    assigneeOptions={assigneeOptions}
                    onClick={() => handleOpenTask(task)}
                  />
                ))}
              </div>
            )
          )
        )}
      </div>

      {/* FAB */}
      {canWriteTaskData && (
        <button
          type="button"
          className={styles.fab}
          aria-label="New task"
          disabled={createTaskBusy}
          onClick={() => {
            setIntegrationError(null)
            setCreateTaskModalOpen(true)
          }}
        >
          +
        </button>
      )}

      {/* Modals */}
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
          void archiveTaskOnServer(editTaskId)
        }}
        onDelete={() => {
          if (!editTaskId) return
          void deleteTaskOnServer(editTaskId)
        }}
        onTitleChange={handleEditTaskTitleChange}
        onMetaChange={handleEditTaskMetaChange}
        onDueDateChange={handleEditTaskDueDateChange}
        onAssigneeIdsChange={handleEditTaskAssigneeIdsChange}
        onSectionChange={handleEditTaskSectionChange}
        onPriorityChange={handleEditTaskPriorityChange}
        onColorChange={handleEditTaskColorChange}
      />

      <MobileNav active="home" />
    </main>
  )
}

/* ── Inline sub-components ─────────────────────────── */

type MobileTaskCardProps = {
  task: UiTask
  busy: boolean
  assigneeOptions: AssigneeOption[]
  onClick: () => void
}

function MobileTaskCard({
  task,
  busy,
  assigneeOptions,
  onClick,
}: MobileTaskCardProps) {
  const priorityClass =
    task.priority === 'High'
      ? styles.priorityHigh
      : task.priority === 'Low'
      ? styles.priorityLow
      : styles.priorityNormal

  const assignees = task.assigneeIds
    .map((id) => assigneeOptions.find((o) => o.id === id))
    .filter(Boolean)
    .slice(0, 3)

  return (
    <article
      className={`${styles.taskCard} ${busy ? styles.taskCardBusy : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
    >
      <div className={styles.taskCardHeader}>
        <span
          className={styles.taskColorDot}
          style={{ background: task.color }}
        />
        <p className={styles.taskTitle}>{task.title}</p>
      </div>
      {task.meta && task.meta !== `${task.stage} task` && (
        <p className={styles.taskMeta}>{task.meta}</p>
      )}
      <div className={styles.taskFooter}>
        <span className={`${styles.taskPriorityBadge} ${priorityClass}`}>
          {task.priority}
        </span>
        {task.dueDate && task.dueDate !== 'No date' && (
          <span className={styles.taskDue}>{task.dueDate}</span>
        )}
        {assignees.length > 0 && (
          <div className={styles.taskAssignees}>
            {assignees.map((a) => (
              <div key={a!.id} className={styles.assigneeAvatar}>
                {a!.label[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
