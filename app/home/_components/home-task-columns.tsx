import styles from '../page.module.css'
import { useState, type DragEvent } from 'react'
import type { AssigneeOption, BoardGroup, UiTask } from '../model'
import { isCompletedSection } from '../model'
import TaskAssigneeDropdown from './task-assignee-dropdown'
import type { AppContent } from '../../../lib/content'

type HomeTaskColumnsProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: AssigneeOption[]
  taskContent: AppContent['home']['task']
  onTogglePriority: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: string) => void
  onAssigneesChange: (task: UiTask, assigneeId: number | null) => void
  onOpenTask: (task: UiTask) => void
}

export default function HomeTaskColumns({
  groups,
  busyTaskId,
  assigneeOptions,
  taskContent,
  onTogglePriority,
  onMoveTask,
  onAssigneesChange,
  onOpenTask,
}: HomeTaskColumnsProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)

  function onDragStart(task: UiTask, event: DragEvent<HTMLElement>) {
    if (!task.id) return
    setDraggingTaskId(task.id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'application/taskify-task',
      JSON.stringify({ taskId: task.id, section: task.section })
    )
  }

  function onDropSection(section: string, event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDraggingTaskId(null)
    setDragOverSection(null)

    const raw = event.dataTransfer.getData('application/taskify-task')
    if (!raw) return

    const parsed = JSON.parse(raw) as {
      taskId?: number
      section?: string
    }

    if (!parsed.taskId) return

    const sourceTask = groups
      .flatMap((group) => group.items)
      .find((item) => item.id === parsed.taskId)

    if (!sourceTask) return
    onMoveTask(sourceTask, section)
  }

  function onDragEnd() {
    setDraggingTaskId(null)
    setDragOverSection(null)
  }

  return (
    <section className={styles.board}>
      <div className={styles.taskViewColumns}>
        {groups.map((group) => (
          <section
            className={`${styles.taskViewColumn} ${
              dragOverSection === group.label
                ? styles.taskViewColumnDropActive
                : ''
            }`}
            key={group.label}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOverSection(group.label)
            }}
            onDragLeave={() => {
              setDragOverSection((prev) => (prev === group.label ? null : prev))
            }}
            onDrop={(event) => onDropSection(group.label, event)}
          >
            <div
              className={styles.taskViewColumnHeader}
              style={{ background: group.color }}
            >
              {group.label}
            </div>

            <div className={styles.taskViewColumnList}>
              {group.items.map((task) => (
                <article
                  className={`${styles.taskViewCard} ${
                    draggingTaskId === task.id
                      ? styles.taskViewCardDragging
                      : ''
                  }`}
                  key={`${group.label}-${task.id ?? task.title}`}
                  draggable={!!task.id && busyTaskId !== task.id}
                  onDragStart={(event) => onDragStart(task, event)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpenTask(task)}
                >
                  <div className={styles.taskTitleRow}>
                    <div className={styles.taskViewCardTitle}>{task.title}</div>
                    {isCompletedSection(task.section) ? (
                      <span className={styles.taskDoneBadge}>
                        {taskContent.done}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.taskViewMetaRow}>
                    {taskContent.duePrefix}: {task.dueDate}
                  </div>
                  <div className={styles.taskViewMetaRow}>
                    {task.id ? (
                      <button
                        className={`${styles.priorityBadge} ${
                          styles.priorityBadgeButton
                        } ${
                          task.priority === 'High'
                            ? styles.priorityBadgeHigh
                            : task.priority === 'Low'
                            ? styles.priorityBadgeLow
                            : styles.priorityBadgeNormal
                        }`}
                        type="button"
                        disabled={busyTaskId === task.id}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onTogglePriority(task)
                        }}
                      >
                        <span className={styles.priorityBadgeDot} />
                        {task.priority === 'High'
                          ? taskContent.high
                          : task.priority === 'Low'
                          ? taskContent.low
                          : taskContent.normal}
                      </button>
                    ) : (
                      <span
                        className={`${styles.priorityBadge} ${
                          task.priority === 'High'
                            ? styles.priorityBadgeHigh
                            : task.priority === 'Low'
                            ? styles.priorityBadgeLow
                            : styles.priorityBadgeNormal
                        }`}
                      >
                        <span className={styles.priorityBadgeDot} />
                        {task.priority === 'High'
                          ? taskContent.high
                          : task.priority === 'Low'
                          ? taskContent.low
                          : taskContent.normal}
                      </span>
                    )}
                  </div>

                  <TaskAssigneeDropdown
                    value={task.assigneeIds}
                    options={assigneeOptions}
                    busy={busyTaskId === task.id}
                    unassignedLabel={taskContent.unassigned}
                    onSelect={(nextAssigneeId) =>
                      onAssigneesChange(task, nextAssigneeId)
                    }
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
