'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import { getContent } from '../../lib/content'
import styles from '../home/page.module.css'
import settingsLayoutStyles from '../settings/_styles/settings-layout.module.css'
import HomeSidebar from '../home/_components/home-sidebar'
import GoalFormPanel from './_components/goal-form-panel'
import GoalListPanel from './_components/goal-list-panel'
import useGoalsPage from './_hooks/use-goals-page'

export default function GoalsPage() {
  const router = useRouter()
  const redirectToLogin = useCallback(() => router.replace('/login'), [router])
  const redirectToHome = useCallback(() => router.replace('/home'), [router])
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const ui = getContent(user?.preferredLanguage)
  const personName = user?.name || ui.home.guest
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'
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
    redirectToLogin,
    redirectToHome,
  })

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message={ui.goals.loading} />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <HomeSidebar
        personInitials={personInitials}
        personName={personName}
        userEmail={user?.email || ui.home.signedIn}
        activeItem="goals"
        content={ui.home.sidebar}
        onOpenHome={() => router.push('/home')}
        onOpenArchive={() => router.push('/archive')}
        onOpenLog={() => router.push('/log')}
        onOpenGoals={() => router.push('/goals')}
        onOpenSettings={() => router.push('/settings')}
        onOpenLogout={() => router.push('/logout')}
      />

      <section className={styles.content}>
        <div
          className={`${styles.topbar} ${settingsLayoutStyles.settingsTopbar}`}
        >
          <div className={styles.workspaceMeta}>
            <span className={styles.workspaceBadge}>◎</span>
            <div>
              <div className={styles.workspaceTitle}>{ui.goals.title}</div>
              <div className={styles.workspaceSub}>{ui.goals.subtitle}</div>
            </div>
          </div>
        </div>

        <div className={settingsLayoutStyles.settingsStack}>
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
            content={ui.goals.form}
            common={ui.common}
            onSave={() => {
              void handleSaveGoal()
            }}
          />

          <GoalListPanel
            goals={goals}
            busy={busy}
            canWrite={canWrite}
            content={ui.goals.list}
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
