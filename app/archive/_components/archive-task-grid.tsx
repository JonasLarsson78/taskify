import styles from '../../home/page.module.css'
import type { ApiTask, StoreUser } from '../../home/model'

type ArchiveTaskGridProps = {
  tasks: ApiTask[]
  busyTaskId: number | null
  currentUser: StoreUser | null
  formatDate: (value: string | null) => string
  getTagTextColor: (background: string) => string
  markdownToHtml: (value: string) => string
  onRestore: (taskId: number) => void
  onDelete: (taskId: number) => void
}

export default function ArchiveTaskGrid({
  tasks,
  busyTaskId,
  currentUser,
  formatDate,
  getTagTextColor,
  markdownToHtml,
  onRestore,
  onDelete,
}: ArchiveTaskGridProps) {
  if (tasks.length === 0) {
    return <div className={styles.taskMeta}>No archived tasks found.</div>
  }

  return (
    <div className={styles.taskTiles}>
      {tasks.map((task) => (
        <article className={styles.taskTile} key={task.id}>
          <div
            className={styles.taskTileSection}
            style={{
              background: task.color || '#716bff',
              color: getTagTextColor(task.color || '#716bff'),
            }}
          >
            {task.section}
          </div>
          <div className={styles.taskViewCardTitle}>{task.title}</div>
          {task.meta ? (
            <div
              className={`${styles.taskMeta} ${styles.archiveTaskMeta}`}
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(task.meta),
              }}
            />
          ) : null}
          <div className={styles.taskViewMetaRow}>
            Archived: {formatDate(task.archivedAt)}
          </div>
          <div className={styles.taskViewMetaRow}>
            Due: {formatDate(task.dueDate)}
          </div>
          <div className={styles.taskViewMetaRow}>
            Priority: {task.priority}
          </div>

          <div className={styles.taskActions}>
            <button
              className={styles.taskActionBtn}
              type="button"
              disabled={busyTaskId === task.id || currentUser?.role === 'guest'}
              onClick={() => onRestore(task.id)}
            >
              {busyTaskId === task.id ? 'Working...' : 'Restore'}
            </button>
            <button
              className={`${styles.taskActionBtn} ${styles.taskActionDanger}`}
              type="button"
              disabled={busyTaskId === task.id || currentUser?.role === 'guest'}
              onClick={() => onDelete(task.id)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
