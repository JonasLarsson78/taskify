import styles from '../page.module.css'
import { useState, type DragEvent } from 'react'
import type { AssigneeOption, BoardGroup, UiTask } from '../model'
import { isCompletedSection } from '../model'
import TaskAssigneeDropdown from './task-assignee-dropdown'

type HomeTaskBoardProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: AssigneeOption[]
  onTogglePriority: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: string) => void
  onAssigneesChange: (task: UiTask, assigneeId: number | null) => void
  onOpenTask: (task: UiTask) => void
}

export default function HomeTaskBoard({
  groups,
  busyTaskId,
  assigneeOptions,
  onTogglePriority,
  onMoveTask,
  onAssigneesChange,
  onOpenTask,
}: HomeTaskBoardProps) {
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
      <div className={styles.tableHead}>
        <div>Task</div>
        <div>Assignee</div>
        <div>Due Date</div>
        <div>Priority</div>
      </div>

      <div className={styles.columnGroup}>
        {groups.map((group) => (
          <section
            className={`${styles.section} ${
              dragOverSection === group.label ? styles.sectionDropActive : ''
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
              className={styles.sectionHeader}
              style={{ background: group.color }}
            >
              {group.label}
            </div>

            {group.items.map((task) => (
              <div
                className={`${styles.row} ${
                  draggingTaskId === task.id ? styles.rowDragging : ''
                }`}
                key={`${group.label}-${task.id ?? task.title}`}
                draggable={!!task.id && busyTaskId !== task.id}
                onDragStart={(event) => onDragStart(task, event)}
                onDragEnd={onDragEnd}
                onClick={() => onOpenTask(task)}
              >
                <div className={styles.taskCell}>
                  <span
                    className={styles.taskDot}
                    style={{ background: task.color }}
                  />
                  <div className={styles.taskMain}>
                    <div className={styles.taskTitleRow}>
                      <div className={styles.taskTitle}>{task.title}</div>
                      {isCompletedSection(task.section) ? (
                        <span className={styles.taskDoneBadge}>Klar</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={styles.assigneeCluster}>
                  <TaskAssigneeDropdown
                    value={task.assigneeIds}
                    options={assigneeOptions}
                    busy={busyTaskId === task.id}
                    onSelect={(nextAssigneeId) =>
                      onAssigneesChange(task, nextAssigneeId)
                    }
                  />
                </div>

                <div className={styles.dueDate}>{task.dueDate}</div>
                <div className={styles.priority}>
                  <div className={styles.priorityCell}>
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
                          ? 'High'
                          : task.priority === 'Low'
                          ? 'Low'
                          : 'Normal'}
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
                          ? 'High'
                          : task.priority === 'Low'
                          ? 'Low'
                          : 'Normal'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </section>
  )
}
