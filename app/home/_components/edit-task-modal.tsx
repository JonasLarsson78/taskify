import { useState } from 'react'
import sharedStyles from '../page.module.css'
import modalStyles from '../_styles/home-modal-shell.module.css'
import formStyles from '../_styles/home-task-editor-form.module.css'
import type { AssigneeOption } from '../model'
import MarkdownLiveEditor from './markdown-live-editor'
import type { AppContent } from '../../../lib/content'

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
  content: AppContent['home']['editModal']
  commonContent: AppContent['common']
  taskContent: AppContent['home']['task']
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
  content,
  commonContent,
  taskContent,
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
      className={modalStyles.modalBackdrop}
      onClick={() => {
        if (!busy) handleClose()
      }}
    >
      <div
        className={modalStyles.modalCard}
        onClick={(event) => {
          event.stopPropagation()
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
            onClick={handleClose}
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
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <div className={formStyles.createFieldFull}>
            <MarkdownLiveEditor
              value={meta}
              onChange={onMetaChange}
              placeholder={content.descriptionPlaceholder}
              disabled={busy}
              initialMode="preview"
            />
          </div>
          <input
            className={sharedStyles.createInput}
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
          />

          <select
            className={sharedStyles.createSelect}
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
            className={sharedStyles.createSelect}
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
            className={sharedStyles.createSelect}
            value={priority}
            onChange={(event) =>
              onPriorityChange(event.target.value as 'High' | 'Normal' | 'Low')
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
              onChange={(event) => onColorChange(event.target.value)}
            />
          </label>
        </div>

        <div className={sharedStyles.modalActions}>
          <button
            className={sharedStyles.taskActionBtn}
            type="button"
            disabled={busy}
            onClick={onArchive}
          >
            {content.archiveTask}
          </button>
          <button
            className={`${sharedStyles.taskActionBtn} ${sharedStyles.taskActionDanger}`}
            type="button"
            disabled={busy}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            {content.deleteTask}
          </button>
          <button
            className={sharedStyles.modalCancel}
            type="button"
            disabled={busy}
            onClick={handleClose}
          >
            {commonContent.cancel}
          </button>
          <button
            className={sharedStyles.createTaskButton}
            type="button"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? content.saving : content.saveChanges}
          </button>
        </div>
      </div>

      {confirmDeleteOpen ? (
        <section
          className={modalStyles.modalBackdrop}
          onClick={() => {
            if (!busy) setConfirmDeleteOpen(false)
          }}
        >
          <div
            className={modalStyles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={modalStyles.modalHeader}>
              <div>
                <div className={modalStyles.modalTitle}>
                  {content.deleteConfirmTitle}
                </div>
                <div className={modalStyles.modalSub}>
                  {content.deleteConfirmSubtitle}
                </div>
              </div>
            </div>

            <div className={sharedStyles.modalActions}>
              <button
                className={sharedStyles.modalCancel}
                type="button"
                disabled={busy}
                onClick={() => setConfirmDeleteOpen(false)}
              >
                {commonContent.cancel}
              </button>
              <button
                className={`${sharedStyles.taskActionBtn} ${sharedStyles.taskActionDanger}`}
                type="button"
                disabled={busy}
                onClick={() => {
                  setConfirmDeleteOpen(false)
                  onDelete()
                }}
              >
                {busy ? content.deleting : content.confirmDelete}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  )
}
