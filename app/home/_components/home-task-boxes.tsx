import styles from '../page.module.css'
import type { AssigneeOption, BoardGroup, UiTask } from '../model'
import { isCompletedSection } from '../model'
import TaskAssigneeDropdown from './task-assignee-dropdown'
import type { AppContent } from '../../../lib/content'

function getTagTextColor(background: string): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(background.trim())
  if (!match) return '#ffffff'

  const hex = match[1]
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness > 160 ? '#2d324c' : '#ffffff'
}

type HomeTaskBoxesProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: AssigneeOption[]
  taskContent: AppContent['home']['task']
  onTogglePriority: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: string) => void
  onAssigneesChange: (task: UiTask, assigneeId: number | null) => void
  onOpenTask: (task: UiTask) => void
}

export default function HomeTaskBoxes({
  groups,
  busyTaskId,
  assigneeOptions,
  taskContent,
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
              style={{
                background: task.sectionColor,
                color: getTagTextColor(task.sectionColor),
              }}
            >
              {task.section}
            </div>
            <div className={styles.taskTitleRow}>
              <div className={styles.taskViewCardTitle}>{task.title}</div>
              {isCompletedSection(task.section) ? (
                <span className={styles.taskDoneBadge}>{taskContent.done}</span>
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
  )
}
