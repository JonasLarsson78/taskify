'use client'

import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import styles from '../home/page.module.css'
import GoalFormPanel from './_components/goal-form-panel'
import GoalListPanel from './_components/goal-list-panel'
import useGoalsPage from './_hooks/use-goals-page'

export default function GoalsPage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const {
    checking,
    busy,
    canWrite,
    goals,
    spaces,
    editingGoalId,
    title,
    description,
    targetDate,
    spaceId,
    useManualProgress,
    manualProgress,
    taskSearchQuery,
    taskPickerId,
    visibleTasks,
    availableTasks,
    filteredAvailableTasks,
    selectedTasks,
    error,
    message,
    setTitle,
    setDescription,
    setTargetDate,
    setSpaceId,
    setUseManualProgress,
    setManualProgress,
    setTaskSearchQuery,
    setTaskPickerId,
    addTaskFromPicker,
    removeLinkedTask,
    resetForm,
    startEdit,
    handleSaveGoal,
    handleDeleteGoal,
  } = useGoalsPage({
    token,
    rehydrated,
    redirectToLogin: () => router.replace('/login'),
    redirectToHome: () => router.replace('/home'),
  })

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message="Loading goals..." />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <section className={`${styles.content} ${styles.settingsContent}`}>
        <div className={`${styles.topbar} ${styles.settingsTopbar}`}>
          <div className={styles.workspaceMeta}>
            <span className={styles.workspaceBadge}>◎</span>
            <div>
              <div className={styles.workspaceTitle}>Goals</div>
              <div className={styles.workspaceSub}>
                Track outcomes with automatic progress from linked tasks.
              </div>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <button
              className={styles.modalCancel}
              type="button"
              onClick={() => router.push('/home')}
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className={styles.settingsStack}>
          <GoalFormPanel
            editingGoalId={editingGoalId}
            title={title}
            description={description}
            targetDate={targetDate}
            spaceId={spaceId}
            spaces={spaces}
            useManualProgress={useManualProgress}
            manualProgress={manualProgress}
            busy={busy}
            canWrite={canWrite}
            taskSearchQuery={taskSearchQuery}
            taskPickerId={taskPickerId}
            visibleTasks={visibleTasks}
            availableTasks={availableTasks}
            filteredAvailableTasks={filteredAvailableTasks}
            selectedTasks={selectedTasks}
            error={error}
            message={message}
            onChangeTitle={setTitle}
            onChangeDescription={setDescription}
            onChangeTargetDate={setTargetDate}
            onChangeSpaceId={setSpaceId}
            onToggleManualProgress={setUseManualProgress}
            onChangeManualProgress={setManualProgress}
            onChangeTaskSearchQuery={setTaskSearchQuery}
            onChangeTaskPickerId={setTaskPickerId}
            onAddTask={addTaskFromPicker}
            onRemoveTask={removeLinkedTask}
            onCancelEdit={resetForm}
            onSave={() => {
              void handleSaveGoal()
            }}
          />

          <GoalListPanel
            goals={goals}
            busy={busy}
            canWrite={canWrite}
            onEdit={startEdit}
            onDelete={(goalId) => {
              void handleDeleteGoal(goalId)
            }}
          />
        </div>
      </section>
    </main>
  )
}
