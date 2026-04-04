import sharedStyles from '../page.module.css'
import modalStyles from '../_styles/home-modal-shell.module.css'
import formStyles from '../_styles/home-task-editor-form.module.css'
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
      className={modalStyles.modalBackdrop}
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className={modalStyles.modalCard}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className={modalStyles.modalHeader}>
          <div>
            <div className={modalStyles.modalTitle}>{content.title}</div>
            <div className={modalStyles.modalSub}>{content.subtitle}</div>
          </div>
          <button
            type="button"
            className={modalStyles.modalClose}
            disabled={busy}
            onClick={onClose}
          >
            {commonContent.close}
          </button>
        </div>

        <div className={formStyles.createTaskGrid}>
          <input
            className={sharedStyles.createInput}
            type="text"
            placeholder={content.taskTitlePlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />

          <div className={formStyles.createFieldFull}>
            <MarkdownLiveEditor
              value={meta}
              onChange={onMetaChange}
              placeholder={content.descriptionPlaceholder}
              disabled={busy}
            />
          </div>

          <input
            className={sharedStyles.createInput}
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />

          <select
            className={sharedStyles.createSelect}
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
            className={sharedStyles.createSelect}
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
            className={sharedStyles.createSelect}
            value={priority}
            onChange={(e) =>
              onPriorityChange(e.target.value as 'High' | 'Normal' | 'Low')
            }
          >
            <option value="High">{taskContent.high}</option>
            <option value="Normal">{taskContent.normal}</option>
            <option value="Low">{taskContent.low}</option>
          </select>

          <label className={formStyles.createColorField}>
            <span className={formStyles.createColorLabel}>
              {content.colorLabel}
            </span>
            <input
              className={formStyles.createColorInput}
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
            />
          </label>
        </div>

        <div className={sharedStyles.modalActions}>
          <button
            className={sharedStyles.modalCancel}
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            {commonContent.cancel}
          </button>
          <button
            className={sharedStyles.createTaskButton}
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
