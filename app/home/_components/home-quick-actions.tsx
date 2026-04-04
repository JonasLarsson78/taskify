import styles from '../page.module.css'
import type { AppContent } from '../../../lib/content'

type HomeQuickActionsProps = {
  canWriteTaskData: boolean
  searchQuery: string
  onNewTask: () => void
  onSearchChange: (value: string) => void
  content: AppContent['home']['quickActions']
}

export default function HomeQuickActions({
  canWriteTaskData,
  searchQuery,
  onNewTask,
  onSearchChange,
  content,
}: HomeQuickActionsProps) {
  return (
    <section className={styles.createTaskQuickAction}>
      <button
        className={styles.createTaskButton}
        type="button"
        disabled={!canWriteTaskData}
        onClick={onNewTask}
      >
        + {content.newTask}
      </button>
      <input
        className={`${styles.createInput} ${styles.quickSearchInput}`}
        type="search"
        value={searchQuery}
        placeholder={content.searchPlaceholder}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </section>
  )
}
