import styles from '../page.module.css'

type HomeQuickActionsProps = {
  canWriteTaskData: boolean
  searchQuery: string
  onNewTask: () => void
  onSearchChange: (value: string) => void
}

export default function HomeQuickActions({
  canWriteTaskData,
  searchQuery,
  onNewTask,
  onSearchChange,
}: HomeQuickActionsProps) {
  return (
    <section className={styles.createTaskQuickAction}>
      <button
        className={styles.createTaskButton}
        type="button"
        disabled={!canWriteTaskData}
        onClick={onNewTask}
      >
        + New Task
      </button>
      <input
        className={`${styles.createInput} ${styles.quickSearchInput}`}
        type="search"
        value={searchQuery}
        placeholder="Search tasks, meta, section or assignee"
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </section>
  )
}
