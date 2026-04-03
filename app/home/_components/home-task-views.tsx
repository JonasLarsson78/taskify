import type { BoardGroup, UiTask, ViewMode } from '../model'
import HomeTaskBoard from './home-task-board'
import HomeTaskBoxes from './home-task-boxes'
import HomeTaskColumns from './home-task-columns'

type HomeTaskViewsProps = {
  viewMode: ViewMode
  groups: BoardGroup[]
  busyTaskId: number | null
  assigneeOptions: string[]
  onNextStage: (task: UiTask) => void
  onTogglePriority: (task: UiTask) => void
  onDelete: (task: UiTask) => void
  onMoveTask: (task: UiTask, targetSection: BoardGroup['label']) => void
  onAssigneesChange: (task: UiTask, assignee: string | null) => void
}

export default function HomeTaskViews({
  viewMode,
  groups,
  busyTaskId,
  assigneeOptions,
  onNextStage,
  onTogglePriority,
  onDelete,
  onMoveTask,
  onAssigneesChange,
}: HomeTaskViewsProps) {
  if (viewMode === 'board') {
    return (
      <HomeTaskColumns
        groups={groups}
        busyTaskId={busyTaskId}
        assigneeOptions={assigneeOptions}
        onNextStage={onNextStage}
        onTogglePriority={onTogglePriority}
        onDelete={onDelete}
        onMoveTask={onMoveTask}
        onAssigneesChange={onAssigneesChange}
      />
    )
  }

  if (viewMode === 'box') {
    return (
      <HomeTaskBoxes
        groups={groups}
        busyTaskId={busyTaskId}
        assigneeOptions={assigneeOptions}
        onNextStage={onNextStage}
        onTogglePriority={onTogglePriority}
        onDelete={onDelete}
        onMoveTask={onMoveTask}
        onAssigneesChange={onAssigneesChange}
      />
    )
  }

  return (
    <HomeTaskBoard
      groups={groups}
      busyTaskId={busyTaskId}
      assigneeOptions={assigneeOptions}
      onNextStage={onNextStage}
      onTogglePriority={onTogglePriority}
      onDelete={onDelete}
      onMoveTask={onMoveTask}
      onAssigneesChange={onAssigneesChange}
    />
  )
}
