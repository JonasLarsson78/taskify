import styles from '../page.module.css'
import { useState, type DragEvent } from 'react'
import type { BoardGroup, UiTask } from '../model'
import TaskAssigneeDropdown from './task-assignee-dropdown'

type HomeTaskBoardProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: string[]
  onNextStage: (task: UiTask) => void
  onTogglePriority: (task: UiTask) => void
  onDelete: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: BoardGroup['label']) => void
  onAssigneesChange: (task: UiTask, assignee: string | null) => void
}

function getStageClass(stage: UiTask['stage']) {
  switch (stage) {
    case 'Initiation':
      return styles.stageInitiation
    case 'Planning':
      return styles.stagePlanning
    case 'Execution':
      return styles.stageExecution
    default:
      return styles.stagePlanning
  }
}

function getSectionToneClass(tone: BoardGroup['tone']) {
  switch (tone) {
    case 'pink':
      return styles.sectionPink
    case 'yellow':
      return styles.sectionYellow
    case 'purple':
      return styles.sectionPurple
    default:
      return styles.sectionPink
  }
}

export default function HomeTaskBoard({
  groups,
  busyTaskId,
  assigneeOptions,
  onNextStage,
  onTogglePriority,
  onDelete,
  onMoveTask,
  onAssigneesChange,
}: HomeTaskBoardProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null)
  const [dragOverSection, setDragOverSection] = useState<
    BoardGroup['label'] | null
  >(null)

  function onDragStart(task: UiTask, event: DragEvent<HTMLElement>) {
    if (!task.id) return
    setDraggingTaskId(task.id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'application/taskify-task',
      JSON.stringify({ taskId: task.id, section: task.section })
    )
  }

  function onDropSection(
    section: BoardGroup['label'],
    event: DragEvent<HTMLElement>
  ) {
    event.preventDefault()
    setDragOverSection(null)

    const raw = event.dataTransfer.getData('application/taskify-task')
    if (!raw) return

    const parsed = JSON.parse(raw) as {
      taskId?: number
      section?: BoardGroup['label']
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
        <div>Stage</div>
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
              className={`${styles.sectionHeader} ${getSectionToneClass(
                group.tone
              )}`}
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
              >
                <div className={styles.taskCell}>
                  <span
                    className={styles.taskDot}
                    style={{ background: task.color }}
                  />
                  <div className={styles.taskMain}>
                    <div className={styles.taskTitle}>{task.title}</div>
                    <div className={styles.taskMeta}>{task.meta}</div>
                  </div>
                </div>

                <div className={styles.assigneeCluster}>
                  <TaskAssigneeDropdown
                    value={task.assignees}
                    options={assigneeOptions}
                    busy={busyTaskId === task.id}
                    onSelect={(nextAssignee) =>
                      onAssigneesChange(task, nextAssignee)
                    }
                  />
                </div>

                <div className={styles.dueDate}>{task.dueDate}</div>
                <div>
                  <span
                    className={`${styles.stageBadge} ${getStageClass(
                      task.stage
                    )}`}
                  >
                    {task.stage}
                  </span>
                </div>
                <div className={styles.priority}>
                  <div className={styles.priorityCell}>
                    {task.priority === 'flag' ? (
                      <span className={styles.priorityFlag} />
                    ) : (
                      <span className={styles.priorityMuted} />
                    )}

                    {task.id ? (
                      <div className={styles.taskActions}>
                        <button
                          className={styles.taskActionBtn}
                          type="button"
                          disabled={busyTaskId === task.id}
                          onClick={() => onNextStage(task)}
                        >
                          Stage
                        </button>
                        <button
                          className={styles.taskActionBtn}
                          type="button"
                          disabled={busyTaskId === task.id}
                          onClick={() => onTogglePriority(task)}
                        >
                          Prio
                        </button>
                        <button
                          className={`${styles.taskActionBtn} ${styles.taskActionDanger}`}
                          type="button"
                          disabled={busyTaskId === task.id}
                          onClick={() => onDelete(task)}
                        >
                          Del
                        </button>
                      </div>
                    ) : null}
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
