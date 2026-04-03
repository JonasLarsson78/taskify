import styles from '../page.module.css'

type CreateTaskModalProps = {
  open: boolean
  busy: boolean
  title: string
  meta: string
  dueDate: string
  assignees: string[]
  assigneeOptions: string[]
  section: 'Issues Found' | 'Review' | 'Ready'
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'flag' | 'muted'
  onClose: () => void
  onSubmit: () => void
  onTitleChange: (value: string) => void
  onMetaChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onAssigneesChange: (value: string[]) => void
  onSectionChange: (value: 'Issues Found' | 'Review' | 'Ready') => void
  onStageChange: (value: 'Initiation' | 'Planning' | 'Execution') => void
  onPriorityChange: (value: 'flag' | 'muted') => void
}

export default function CreateTaskModal({
  open,
  busy,
  title,
  meta,
  dueDate,
  assignees,
  assigneeOptions,
  section,
  stage,
  priority,
  onClose,
  onSubmit,
  onTitleChange,
  onMetaChange,
  onDueDateChange,
  onAssigneesChange,
  onSectionChange,
  onStageChange,
  onPriorityChange,
}: CreateTaskModalProps) {
  if (!open) return null

  return (
    <section
      className={styles.modalBackdrop}
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className={styles.modalCard}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Create Task</div>
            <div className={styles.modalSub}>
              Fill in details and add to board
            </div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            disabled={busy}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className={styles.createTaskGrid}>
          <input
            className={styles.createInput}
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <input
            className={styles.createInput}
            type="text"
            placeholder="Meta"
            value={meta}
            onChange={(e) => onMetaChange(e.target.value)}
          />
          <input
            className={styles.createInput}
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />

          <select
            className={styles.createSelect}
            multiple
            value={assignees}
            onChange={(e) =>
              onAssigneesChange(
                Array.from(e.target.selectedOptions).map((option) => option.value)
              )
            }
          >
            {assigneeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={styles.createSelect}
            value={section}
            onChange={(e) =>
              onSectionChange(
                e.target.value as 'Issues Found' | 'Review' | 'Ready'
              )
            }
          >
            <option value="Issues Found">Issues Found</option>
            <option value="Review">Review</option>
            <option value="Ready">Ready</option>
          </select>

          <select
            className={styles.createSelect}
            value={stage}
            onChange={(e) =>
              onStageChange(
                e.target.value as 'Initiation' | 'Planning' | 'Execution'
              )
            }
          >
            <option value="Initiation">Initiation</option>
            <option value="Planning">Planning</option>
            <option value="Execution">Execution</option>
          </select>

          <select
            className={styles.createSelect}
            value={priority}
            onChange={(e) =>
              onPriorityChange(e.target.value as 'flag' | 'muted')
            }
          >
            <option value="muted">Muted</option>
            <option value="flag">Flag</option>
          </select>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.modalCancel}
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.createTaskButton}
            type="button"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </section>
  )
}
