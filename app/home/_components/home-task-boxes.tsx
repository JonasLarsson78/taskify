import styles from '../page.module.css'
import type { BoardGroup, UiTask } from '../model'

type HomeTaskBoxesProps = {
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: string[]
  onNextStage: (task: UiTask) => void
  onTogglePriority: (task: UiTask) => void
  onDelete: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: BoardGroup['label']) => void
  onAssigneesChange: (task: UiTask, assignee: string | null) => void
}

export default function HomeTaskBoxes({
  groups,
  busyTaskId,
  onNextStage,
  onTogglePriority,
  onDelete,
}: HomeTaskBoxesProps) {
  const tasks = groups.flatMap((group) =>
    group.items.map((item) => ({ ...item, section: group.label }))
  )

  return (
    <section className={styles.board}>
      <div className={styles.taskTiles}>
        {tasks.map((task) => (
          <article className={styles.taskTile} key={`${task.section}-${task.id ?? task.title}`}>
            <div className={styles.taskTileSection}>{task.section}</div>
            <div className={styles.taskViewCardTitle}>{task.title}</div>
            <div className={styles.taskMeta}>{task.meta}</div>
            <div className={styles.taskViewMetaRow}>Stage: {task.stage}</div>
            <div className={styles.taskViewMetaRow}>Due: {task.dueDate}</div>

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
  )
}
