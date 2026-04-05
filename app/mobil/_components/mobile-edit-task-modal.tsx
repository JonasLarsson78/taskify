// ...existing code...
import React, { useEffect } from 'react'
import styles from '../page.module.css'
import sharedStyles from '../../home/page.module.css'
import formStyles from '../../home/_styles/home-task-editor-form.module.css'
import type { AssigneeOption } from '../../home/model'
import type { AppContent } from '../../../lib/content'

interface MobileEditTaskModalProps {
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

export default function MobileEditTaskModal({
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
}: MobileEditTaskModalProps) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [open])
  if (!open) return null
  return (
    <div className={styles.mobileModalBackdrop}>
      <div className={styles.mobileModalCard}>
        <header className={styles.mobileModalHeader}>
          <div>
            <div className={sharedStyles.topbarTitle}>{content.title}</div>
            <div className={sharedStyles.topbarSub}>{content.subtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={styles.mobileModalCloseBtn}
          >
            {commonContent.close}
          </button>
        </header>
        <div className={formStyles.createTaskGrid}>
          <input
            className={formStyles.createFieldFull}
            type="text"
            placeholder={content.taskTitlePlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <textarea
            className={formStyles.createFieldFull}
            placeholder={content.descriptionPlaceholder}
            value={meta}
            onChange={(e) => onMetaChange(e.target.value)}
          />
          <input
            className={formStyles.createFieldFull}
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
          {/* Assignee select */}
          <select
            className={formStyles.createFieldFull}
            value={assigneeIds[0] ?? ''}
            onChange={(e) => onAssigneeIdsChange([Number(e.target.value)])}
            disabled={busy}
          >
            <option value="">{taskContent.assigneeLabel}</option>
            {assigneeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Section select */}
          <select
            className={formStyles.createFieldFull}
            value={section}
            onChange={(e) => onSectionChange(e.target.value)}
            disabled={busy}
          >
            <option value="">Section</option>
            {sectionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {/* Priority select */}
          <select
            className={formStyles.createFieldFull}
            value={priority}
            onChange={(e) =>
              onPriorityChange(e.target.value as 'High' | 'Normal' | 'Low')
            }
            disabled={busy}
          >
            <option value="">{taskContent.priorityPrefix || 'Priority'}</option>
            <option value="High">{taskContent.high || 'High'}</option>
            <option value="Normal">{taskContent.normal || 'Normal'}</option>
            <option value="Low">{taskContent.low || 'Low'}</option>
          </select>
          {/* Color picker */}
          <input
            className={formStyles.createFieldFull}
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            disabled={busy}
            style={{
              height: 40,
              padding: 0,
              border: 'none',
              background: 'none',
            }}
          />
        </div>
        <div className={styles.mobileModalActions}>
          <button type="button" onClick={onSubmit} disabled={busy}>
            {busy ? content.saving : commonContent.save}
          </button>
          <button type="button" onClick={onArchive} disabled={busy}>
            {content.archiveTask || 'Archive'}
          </button>
          <button type="button" onClick={onDelete} disabled={busy}>
            {busy ? content.deleting : content.confirmDelete}
          </button>
        </div>
      </div>
    </div>
  )
}
