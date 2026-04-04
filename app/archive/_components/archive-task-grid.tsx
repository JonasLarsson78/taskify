import styles from '../../home/page.module.css'
import type { ApiTask, StoreUser } from '../../home/model'
import type { AppContent } from '../../../lib/content'

type ArchiveTaskGridProps = {
  tasks: ApiTask[]
  busyTaskId: number | null
  currentUser: StoreUser | null
  archiveContent: AppContent['archive']
  taskContent: AppContent['home']['task']
  commonContent: AppContent['common']
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
  archiveContent,
  taskContent,
  commonContent,
  formatDate,
  getTagTextColor,
  markdownToHtml,
  onRestore,
  onDelete,
}: ArchiveTaskGridProps) {
  if (tasks.length === 0) {
    return <div className={styles.taskMeta}>{archiveContent.noTasks}</div>
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
            {taskContent.archivedPrefix}: {formatDate(task.archivedAt)}
          </div>
          <div className={styles.taskViewMetaRow}>
            {taskContent.duePrefix}: {formatDate(task.dueDate)}
          </div>
          <div className={styles.taskViewMetaRow}>
            {taskContent.priorityPrefix}: {task.priority}
          </div>

          <div className={styles.taskActions}>
            <button
              className={styles.taskActionBtn}
              type="button"
              disabled={busyTaskId === task.id || currentUser?.role === 'guest'}
              onClick={() => onRestore(task.id)}
            >
              {busyTaskId === task.id
                ? archiveContent.working
                : archiveContent.restore}
            </button>
            <button
              className={`${styles.taskActionBtn} ${styles.taskActionDanger}`}
              type="button"
              disabled={busyTaskId === task.id || currentUser?.role === 'guest'}
              onClick={() => onDelete(task.id)}
            >
              {commonContent.delete}
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
