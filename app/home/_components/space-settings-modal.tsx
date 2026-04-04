import styles from '../page.module.css'

type SpaceSettingsModalProps = {
  open: boolean
  spaceSettingsBusy: boolean
  isAdmin: boolean
  spaceNameDraft: string
  newSectionName: string
  sectionOptions: string[]
  sectionColors: Record<string, string>
  draggingSectionName: string | null
  dragOverSectionName: string | null
  onClose: () => void
  onSpaceNameChange: (value: string) => void
  onNewSectionNameChange: (value: string) => void
  onAddSection: () => void
  onDragStart: (section: string) => void
  onDragOver: (section: string) => void
  onDragLeave: (section: string) => void
  onDrop: (draggedSection: string, targetSection: string) => void
  onDragEnd: () => void
  onUpdateSectionColor: (section: string, color: string) => void
  onRemoveSection: (section: string) => void
  onSave: () => void
}

export default function SpaceSettingsModal({
  open,
  spaceSettingsBusy,
  isAdmin,
  spaceNameDraft,
  newSectionName,
  sectionOptions,
  sectionColors,
  draggingSectionName,
  dragOverSectionName,
  onClose,
  onSpaceNameChange,
  onNewSectionNameChange,
  onAddSection,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onUpdateSectionColor,
  onRemoveSection,
  onSave,
}: SpaceSettingsModalProps) {
  if (!open) return null

  return (
    <section
      className={styles.modalBackdrop}
      onClick={() => {
        if (!spaceSettingsBusy) onClose()
      }}
    >
      <div
        className={styles.modalCard}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Space Settings</div>
            <div className={styles.modalSub}>
              Manage custom task columns for this space
            </div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            disabled={spaceSettingsBusy}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className={styles.settingsRow}>
          <input
            className={styles.createInput}
            type="text"
            placeholder="Space name"
            value={spaceNameDraft}
            disabled={!isAdmin || spaceSettingsBusy}
            onChange={(event) => onSpaceNameChange(event.target.value)}
          />
        </div>

        <div className={styles.settingsRow}>
          <input
            className={styles.createInput}
            type="text"
            placeholder="Add new column (e.g. QA, Done, Blocked)"
            value={newSectionName}
            onChange={(event) => onNewSectionNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onAddSection()
              }
            }}
          />
          <button
            className={styles.taskActionBtn}
            type="button"
            onClick={onAddSection}
            disabled={spaceSettingsBusy}
          >
            Add
          </button>
        </div>

        <div className={styles.settingsChipRow}>
          {sectionOptions.map((section) => (
            <div
              className={`${styles.settingsChip} ${
                draggingSectionName === section
                  ? styles.settingsChipDragging
                  : ''
              } ${
                dragOverSectionName === section
                  ? styles.settingsChipDropTarget
                  : ''
              }`}
              key={section}
              draggable={!spaceSettingsBusy}
              onDragStart={(event) => {
                onDragStart(section)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', section)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                if (!spaceSettingsBusy) {
                  onDragOver(section)
                }
              }}
              onDragLeave={() => onDragLeave(section)}
              onDrop={(event) => {
                event.preventDefault()
                const draggedSection = event.dataTransfer.getData('text/plain')
                onDrop(draggedSection, section)
              }}
              onDragEnd={onDragEnd}
            >
              <span>{section}</span>
              <input
                type="color"
                className={styles.settingsColorInput}
                value={sectionColors[section] || '#6259ff'}
                onChange={(event) =>
                  onUpdateSectionColor(section, event.target.value)
                }
                disabled={spaceSettingsBusy}
                title={`Color for ${section}`}
              />
              <button
                type="button"
                className={styles.settingsChipRemove}
                onClick={() => onRemoveSection(section)}
                disabled={spaceSettingsBusy}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.modalCancel}
            type="button"
            disabled={spaceSettingsBusy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.createTaskButton}
            type="button"
            disabled={spaceSettingsBusy}
            onClick={onSave}
          >
            {spaceSettingsBusy ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>
    </section>
  )
}
