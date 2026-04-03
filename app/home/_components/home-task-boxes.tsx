import styles from '../page.module.css'
import type { AssigneeOption, BoardGroup, UiTask } from '../model'
import TaskAssigneeDropdown from './task-assignee-dropdown'

type HomeTaskBoxesProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: AssigneeOption[]
  onTogglePriority: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: string) => void
  onAssigneesChange: (task: UiTask, assigneeId: number | null) => void
  onOpenTask: (task: UiTask) => void
}

export default function HomeTaskBoxes({
  groups,
  busyTaskId,
  assigneeOptions,
  onTogglePriority,
  onAssigneesChange,
  onOpenTask,
}: HomeTaskBoxesProps) {
  const tasks = groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      section: group.label,
      sectionColor: group.color,
    }))
  )

  return (
    <section className={styles.board}>
      <div className={styles.taskTiles}>
        {tasks.map((task) => (
          <article
            className={styles.taskTile}
            key={`${task.section}-${task.id ?? task.title}`}
            onClick={() => onOpenTask(task)}
          >
            <div
              className={styles.taskTileSection}
              style={{ background: task.sectionColor }}
            >
              {task.section}
            </div>
            <div className={styles.taskViewCardTitle}>{task.title}</div>
            <div className={styles.taskMeta}>{task.meta}</div>
            <div className={styles.taskViewMetaRow}>Due: {task.dueDate}</div>
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

            <TaskAssigneeDropdown
              value={task.assigneeIds}
              options={assigneeOptions}
              busy={busyTaskId === task.id}
              onSelect={(nextAssigneeId) =>
                onAssigneesChange(task, nextAssigneeId)
              }
            />
          </article>
        ))}
      </div>
    </section>
  )
}
