import type { AssigneeOption, BoardGroup, UiTask, ViewMode } from '../model'
import type { AppContent } from '../../../lib/content'
import HomeTaskBoard from './home-task-board'
import HomeTaskBoxes from './home-task-boxes'
import HomeTaskColumns from './home-task-columns'

type HomeTaskViewsProps = {
  viewMode: ViewMode
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: AssigneeOption[]
  taskContent: AppContent['home']['task']
  onTogglePriority: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: string) => void
  onAssigneesChange: (task: UiTask, assigneeId: number | null) => void
  onOpenTask: (task: UiTask) => void
}

export default function HomeTaskViews({
  viewMode,
  groups,
  busyTaskId,
  assigneeOptions,
  taskContent,
  onTogglePriority,
  onMoveTask,
  onAssigneesChange,
  onOpenTask,
}: HomeTaskViewsProps) {
  if (viewMode === 'board') {
    return (
      <HomeTaskColumns
        groups={groups}
        busyTaskId={busyTaskId}
        assigneeOptions={assigneeOptions}
        taskContent={taskContent}
        onTogglePriority={onTogglePriority}
        onMoveTask={onMoveTask}
        onAssigneesChange={onAssigneesChange}
        onOpenTask={onOpenTask}
      />
    )
  }

  if (viewMode === 'box') {
    return (
      <HomeTaskBoxes
        groups={groups}
        busyTaskId={busyTaskId}
        assigneeOptions={assigneeOptions}
        taskContent={taskContent}
        onTogglePriority={onTogglePriority}
        onMoveTask={onMoveTask}
        onAssigneesChange={onAssigneesChange}
        onOpenTask={onOpenTask}
      />
    )
  }

  return (
    <HomeTaskBoard
      groups={groups}
      busyTaskId={busyTaskId}
      assigneeOptions={assigneeOptions}
      taskContent={taskContent}
      onTogglePriority={onTogglePriority}
      onMoveTask={onMoveTask}
      onAssigneesChange={onAssigneesChange}
      onOpenTask={onOpenTask}
    />
  )
}
