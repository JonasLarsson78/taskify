import styles from '../page.module.css'
import { useState, type DragEvent } from 'react'
import type { BoardGroup, UiTask } from '../model'

type HomeTaskColumnsProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: string[]
  onNextStage: (task: UiTask) => void
  onTogglePriority: (task: UiTask) => void
  onDelete: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: BoardGroup['label']) => void
  onAssigneesChange: (task: UiTask, assignee: string | null) => void
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

export default function HomeTaskColumns({
  groups,
  busyTaskId,
  onNextStage,
  onTogglePriority,
  onDelete,
  onMoveTask,
}: HomeTaskColumnsProps) {
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
              className={`${styles.taskViewColumnHeader} ${getSectionToneClass(
                group.tone
              )}`}
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
                >
                  <div className={styles.taskViewCardTitle}>{task.title}</div>
                  <div className={styles.taskMeta}>{task.meta}</div>
                  <div className={styles.taskViewMetaRow}>
                    Due: {task.dueDate}
                  </div>

                  {task.id ? (
                    <div className={styles.taskViewActions}>
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
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
