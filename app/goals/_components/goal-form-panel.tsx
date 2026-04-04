import styles from '../../home/page.module.css'
import type { SpaceItem, TaskItem } from '../model'

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
          {editingGoalId ? 'Edit Goal' : 'Create Goal'}
        </div>
        <div className={styles.settingsHelp}>
          Link tasks to calculate progress automatically
        </div>
      </div>

      <div className={`${styles.settingsGrid} ${styles.settingsGridWide}`}>
        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Title</span>
          <input
            className={styles.createInput}
            type="text"
            value={title}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="Launch Q2 onboarding"
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Target Date</span>
          <input
            className={styles.createInput}
            type="date"
            value={targetDate}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeTargetDate(event.target.value)}
          />
        </label>

        <label className={styles.settingsField}>
          <span className={styles.sectionLabel}>Space</span>
          <select
            className={styles.createSelect}
            value={spaceId}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeSpaceId(event.target.value)}
          >
            <option value="">No specific space</option>
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
          <span className={styles.sectionLabel}>Description</span>
          <input
            className={styles.createInput}
            type="text"
            value={description}
            disabled={busy || !canWrite}
            onChange={(event) => onChangeDescription(event.target.value)}
            placeholder="Reduce cycle time and improve quality"
          />
        </label>
      </div>

      <div className={styles.settingsMembershipList}>
        <div className={styles.sectionLabel}>Progress Override</div>
        <label className={styles.settingsMembershipRow}>
          <input
            type="checkbox"
            checked={useManualProgress}
            disabled={busy || !canWrite}
            onChange={(event) => onToggleManualProgress(event.target.checked)}
          />
          <span className={styles.settingsRoleIdentity}>
            Use manual progress
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
            Auto progress from linked tasks is active.
          </div>
        ) : null}
      </div>

      <div className={styles.settingsMembershipList}>
        <div className={styles.sectionLabel}>Linked Tasks</div>
        {visibleTasks.length === 0 ? (
          <div className={styles.settingsHelp}>
            No tasks available for this filter.
          </div>
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
                placeholder="Search task by title or section"
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
                    ? 'All visible tasks are linked'
                    : filteredAvailableTasks.length === 0
                    ? 'No tasks match search'
                    : 'Choose task to link'}
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
                Link
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
          <div className={styles.settingsHelp}>No linked tasks yet.</div>
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
            Cancel Edit
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
          {busy ? 'Saving...' : editingGoalId ? 'Save Goal' : 'Create Goal'}
        </button>
      </div>
    </section>
  )
}
