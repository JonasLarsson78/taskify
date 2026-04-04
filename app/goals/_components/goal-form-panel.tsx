import styles from '../../home/page.module.css'
import type { SpaceItem, TaskItem } from '../model'
import type { AppContent } from '../../../lib/content'

type GoalFormPanelProps = {
  editingGoalId: number | null
  title: string
  description: string
  targetDate: string
  spaceId: string
  spaces: SpaceItem[]
  useManualProgress: boolean
  manualProgress: number
  busy: boolean
  canWrite: boolean
  taskSearchQuery: string
  taskPickerId: string
  visibleTasks: TaskItem[]
  availableTasks: TaskItem[]
  filteredAvailableTasks: TaskItem[]
  selectedTasks: TaskItem[]
  error: string | null
  message: string | null
  content: AppContent['goals']['form']
  common: AppContent['common']
  onChangeTitle: (value: string) => void
  onChangeDescription: (value: string) => void
  onChangeTargetDate: (value: string) => void
  onChangeSpaceId: (value: string) => void
  onToggleManualProgress: (value: boolean) => void
  onChangeManualProgress: (value: number) => void
  onChangeTaskSearchQuery: (value: string) => void
  onChangeTaskPickerId: (value: string) => void
  onAddTask: () => void
  onRemoveTask: (taskId: number) => void
  onCancelEdit: () => void
  onSave: () => void
}

export default function GoalFormPanel({
  editingGoalId,
  title,
  description,
  targetDate,
  spaceId,
  spaces,
  useManualProgress,
  manualProgress,
  busy,
  canWrite,
  taskSearchQuery,
  taskPickerId,
  visibleTasks,
  availableTasks,
  filteredAvailableTasks,
  selectedTasks,
  error,
  message,
  content,
  common,
  onChangeTitle,
  onChangeDescription,
  onChangeTargetDate,
  onChangeSpaceId,
  onToggleManualProgress,
  onChangeManualProgress,
  onChangeTaskSearchQuery,
  onChangeTaskPickerId,
  onAddTask,
  onRemoveTask,
  onCancelEdit,
  onSave,
}: GoalFormPanelProps) {
  return (
    <section
      className={`${styles.settingsPanel} ${styles.settingsPanelCompact}`}
    >
      <div className={styles.settingsPanelHeader}>
        <div className={styles.settingsPanelTitle}>
          {editingGoalId ? content.editTitle : content.createTitle}
        </div>
        <div className={styles.settingsHelp}>{content.help}</div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.titleLabel}</span>
          <input
            className={styles.createInput}
            type="text"
            value={title}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder={content.titlePlaceholder}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.targetDateLabel}</span>
          <input
            className={styles.createInput}
            type="date"
            value={targetDate}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeTargetDate(event.target.value)}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>{content.spaceLabel}</span>
          <select
            className={styles.createSelect}
            value={spaceId}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeSpaceId(event.target.value)}
          >
            <option value="">{content.noSpace}</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name || `Space ${space.id}`}
              </option>
            ))}
          </select>
        </label>

        <label
          className={`${styles.settingsField} ${styles.settingsFieldFull}`}
        >
          <span className={styles.sectionLabel}>
            {content.descriptionLabel}
          </span>
          <input
            className={styles.createInput}
            type="text"
            value={description}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeDescription(event.target.value)}
            placeholder={content.descriptionPlaceholder}
          />
        </label>
      </div>

      <div className={styles.settingsMembershipList}>
        <div className={styles.sectionLabel}>{content.progressOverride}</div>
        <label className={styles.settingsMembershipRow}>
          <input
            type="checkbox"
            checked={useManualProgress}
            disabled={busy || !canWrite}
            onChange={(event) => onToggleManualProgress(event.target.checked)}
          />
          <span className={styles.settingsRoleIdentity}>
            {content.useManualProgress}
          </span>
        </label>
        <div className={styles.settingsRow}>
          <input
            className={styles.createInput}
            type="range"
            min={0}
            max={100}
            step={1}
            value={manualProgress}
            disabled={busy || !canWrite || !useManualProgress}
            onChange={(event) =>
              onChangeManualProgress(
                Number.parseInt(event.target.value, 10) || 0
              )
            }
          />
          <span className={styles.settingsHelp}>{manualProgress}%</span>
        </div>
        {!useManualProgress ? (
          <div className={styles.settingsHelp}>
            {content.autoProgressActive}
          </div>
        ) : null}
      </div>

      <div className={styles.settingsMembershipList}>
        <div className={styles.sectionLabel}>{content.linkedTasks}</div>
        {visibleTasks.length === 0 ? (
          <div className={styles.settingsHelp}>{content.noTasksForFilter}</div>
        ) : (
          <div>
            <div className={styles.settingsRow}>
              <input
                className={styles.createInput}
                type="text"
                value={taskSearchQuery}
                disabled={busy || !canWrite || availableTasks.length === 0}
                onChange={(event) =>
                  onChangeTaskSearchQuery(event.target.value)
                }
                placeholder={content.searchTaskPlaceholder}
              />
            </div>
            <div className={styles.settingsRow}>
              <select
                className={styles.createSelect}
                value={taskPickerId}
                disabled={busy || !canWrite || availableTasks.length === 0}
                onChange={(event) => onChangeTaskPickerId(event.target.value)}
              >
                <option value="">
                  {availableTasks.length === 0
                    ? content.allVisibleTasksLinked
                    : filteredAvailableTasks.length === 0
                    ? content.noTasksMatchSearch
                    : content.chooseTaskToLink}
                </option>
                {filteredAvailableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.section})
                  </option>
                ))}
              </select>
              <button
                className={styles.taskActionBtn}
                type="button"
                disabled={busy || !canWrite || !taskPickerId}
                onClick={onAddTask}
              >
                {content.link}
              </button>
            </div>
          </div>
        )}

        {selectedTasks.length > 0 ? (
          <div className={styles.settingsMembershipTags}>
            {selectedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={styles.settingsMembershipTag}
                disabled={busy || !canWrite}
                onClick={() => onRemoveTask(task.id)}
              >
                {task.title} ×
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.settingsHelp}>{content.noLinkedTasks}</div>
        )}
      </div>

      {error ? <div className={styles.taskMeta}>{error}</div> : null}
      {message ? <div className={styles.taskMeta}>{message}</div> : null}

      <div className={styles.modalActions}>
        {editingGoalId ? (
          <button
            className={styles.modalCancel}
            type="button"
            disabled={busy}
            onClick={onCancelEdit}
          >
            {content.cancelEdit}
          </button>
        ) : (
          <span />
        )}
        <button
          className={styles.createTaskButton}
          type="button"
          disabled={busy || !canWrite}
          onClick={onSave}
        >
          {busy
            ? common.saving
            : editingGoalId
            ? content.saveGoal
            : content.createGoal}
        </button>
      </div>
    </section>
  )
}
