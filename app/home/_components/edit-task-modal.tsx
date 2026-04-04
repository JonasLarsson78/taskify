import { useState } from 'react'
import styles from '../page.module.css'
import type { AssigneeOption } from '../model'
import MarkdownLiveEditor from './markdown-live-editor'

type EditTaskModalProps = {
  open: boolean
  busy: boolean
  title: string
  meta: string
  dueDate: string
  assigneeIds: number[]
  assigneeOptions: AssigneeOption[]
  section: string
  sectionOptions: string[]
  priority: 'High' | 'Normal' | 'Low'
  color: string
  onClose: () => void
  onSubmit: () => void
  onArchive: () => void
  onDelete: () => void
  onTitleChange: (value: string) => void
  onMetaChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onAssigneeIdsChange: (value: number[]) => void
  onSectionChange: (value: string) => void
  onPriorityChange: (value: 'High' | 'Normal' | 'Low') => void
  onColorChange: (value: string) => void
}

export default function EditTaskModal({
  open,
  busy,
  title,
  meta,
  dueDate,
  assigneeIds,
  assigneeOptions,
  section,
  sectionOptions,
  priority,
  color,
  onClose,
  onSubmit,
  onArchive,
  onDelete,
  onTitleChange,
  onMetaChange,
  onDueDateChange,
  onAssigneeIdsChange,
  onSectionChange,
  onPriorityChange,
  onColorChange,
}: EditTaskModalProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  function handleClose() {
    setConfirmDeleteOpen(false)
    onClose()
  }

  if (!open) return null

  return (
    <section
      className={styles.modalBackdrop}
      onClick={() => {
        if (!busy) handleClose()
      }}
    >
      <div
        className={styles.modalCard}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Task</div>
            <div className={styles.modalSub}>
              Update details and save changes
            </div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            disabled={busy}
            onClick={handleClose}
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
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <div className={styles.createFieldFull}>
            <MarkdownLiveEditor
              value={meta}
              onChange={onMetaChange}
              placeholder="Task description (Markdown supported)"
              disabled={busy}
              initialMode="preview"
            />
          </div>
          <input
            className={styles.createInput}
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
          />

          <select
            className={styles.createSelect}
            multiple
            value={assigneeIds.map(String)}
            onChange={(event) =>
              onAssigneeIdsChange(
                Array.from(event.target.selectedOptions).map((option) =>
                  Number.parseInt(option.value, 10)
                )
              )
            }
          >
            {assigneeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className={styles.createSelect}
            value={section}
            onChange={(event) => onSectionChange(event.target.value)}
          >
            {sectionOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className={styles.createSelect}
            value={priority}
            onChange={(event) =>
              onPriorityChange(event.target.value as 'High' | 'Normal' | 'Low')
            }
          >
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>

          <label className={styles.createColorField}>
            <span className={styles.createColorLabel}>Task color</span>
            <input
              className={styles.createColorInput}
              type="color"
              value={color}
              onChange={(event) => onColorChange(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.taskActionBtn}
            type="button"
            disabled={busy}
            onClick={onArchive}
          >
            Archive task
          </button>
          <button
            className={`${styles.taskActionBtn} ${styles.taskActionDanger}`}
            type="button"
            disabled={busy}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete task
          </button>
          <button
            className={styles.modalCancel}
            type="button"
            disabled={busy}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className={styles.createTaskButton}
            type="button"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {confirmDeleteOpen ? (
        <section
          className={styles.modalBackdrop}
          onClick={() => {
            if (!busy) setConfirmDeleteOpen(false)
          }}
        >
          <div
            className={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Delete task?</div>
                <div className={styles.modalSub}>
                  This action cannot be undone.
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                type="button"
                disabled={busy}
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.taskActionBtn} ${styles.taskActionDanger}`}
                type="button"
                disabled={busy}
                onClick={() => {
                  setConfirmDeleteOpen(false)
                  onDelete()
                }}
              >
                {busy ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  )
}
