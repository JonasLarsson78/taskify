import styles from '../page.module.css'
import type { AssigneeOption } from '../model'
import MarkdownLiveEditor from './markdown-live-editor'
import type { AppContent } from '../../../lib/content'

type CreateTaskModalProps = {
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
  content: AppContent['home']['createModal']
  commonContent: AppContent['common']
  taskContent: AppContent['home']['task']
  onClose: () => void
  onSubmit: () => void
  onTitleChange: (value: string) => void
  onMetaChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onAssigneeIdsChange: (value: number[]) => void
  onSectionChange: (value: string) => void
  onPriorityChange: (value: 'High' | 'Normal' | 'Low') => void
  onColorChange: (value: string) => void
}

export default function CreateTaskModal({
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
  content,
  commonContent,
  taskContent,
  onClose,
  onSubmit,
  onTitleChange,
  onMetaChange,
  onDueDateChange,
  onAssigneeIdsChange,
  onSectionChange,
  onPriorityChange,
  onColorChange,
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
            <div className={styles.modalTitle}>{content.title}</div>
            <div className={styles.modalSub}>{content.subtitle}</div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            disabled={busy}
            onClick={onClose}
          >
            {commonContent.close}
          </button>
        </div>

        <div className={styles.createTaskGrid}>
          <input
            className={styles.createInput}
            type="text"
            placeholder={content.taskTitlePlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />

          <div className={styles.createFieldFull}>
            <MarkdownLiveEditor
              value={meta}
              onChange={onMetaChange}
              placeholder={content.descriptionPlaceholder}
              disabled={busy}
            />
          </div>

          <input
            className={styles.createInput}
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />

          <select
            className={styles.createSelect}
            multiple
            value={assigneeIds.map(String)}
            onChange={(e) =>
              onAssigneeIdsChange(
                Array.from(e.target.selectedOptions).map((option) =>
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
            onChange={(e) => onSectionChange(e.target.value)}
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
            onChange={(e) =>
              onPriorityChange(e.target.value as 'High' | 'Normal' | 'Low')
            }
          >
            <option value="High">{taskContent.high}</option>
            <option value="Normal">{taskContent.normal}</option>
            <option value="Low">{taskContent.low}</option>
          </select>

          <label className={styles.createColorField}>
            <span className={styles.createColorLabel}>
              {content.colorLabel}
            </span>
            <input
              className={styles.createColorInput}
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.modalCancel}
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            {commonContent.cancel}
          </button>
          <button
            className={styles.createTaskButton}
            type="button"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? content.creating : content.create}
          </button>
        </div>
      </div>
    </section>
  )
}
