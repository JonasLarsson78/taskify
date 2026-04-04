import sharedStyles from '../page.module.css'
import styles from '../_styles/home-topbar.module.css'
import type { ViewMode } from '../model'
import type { AppContent } from '../../../lib/content'
import {
  Kanban,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Square,
} from 'lucide-react'

type HomeTopbarProps = {
  projectTitle: string
  workspaceSub: string
  viewMode: ViewMode
  onChangeView: (next: ViewMode) => void
  onOpenSpaceSettings: () => void
  canOpenSpaceSettings: boolean
  content: AppContent['home']['topbar']
}

export default function HomeTopbar({
  projectTitle,
  workspaceSub,
  viewMode,
  onChangeView,
  onOpenSpaceSettings,
  canOpenSpaceSettings,
  content,
}: HomeTopbarProps) {
  return (
    <div className={sharedStyles.topbar}>
      <div className={sharedStyles.workspaceMeta}>
        <span className={sharedStyles.workspaceBadge}>
          <LayoutGrid className={sharedStyles.workspaceBadgeIcon} />
        </span>
        <div>
          <div className={sharedStyles.workspaceTitle}>{projectTitle}</div>
          <div className={sharedStyles.workspaceSub}>{workspaceSub}</div>
        </div>
      </div>

      <div className={styles.topbarActions}>
        <button
          className={`${styles.actionPill} ${
            viewMode === 'list' ? styles.actionPillActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('list')}
        >
          <List className={styles.actionIcon} /> {content.list}
        </button>
        <button
          className={`${styles.actionPill} ${
            viewMode === 'board' ? styles.actionPillActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('board')}
        >
          <Kanban className={styles.actionIcon} /> {content.board}
        </button>
        <button
          className={`${styles.actionPill} ${
            viewMode === 'box' ? styles.actionPillActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('box')}
        >
          <Square className={styles.actionIcon} /> {content.box}
        </button>
        {canOpenSpaceSettings ? (
          <button
            className={styles.addView}
            type="button"
            onClick={onOpenSpaceSettings}
          >
            <SlidersHorizontal className={styles.actionIcon} />
            {content.spaceSettings}
          </button>
        ) : null}
      </div>
    </div>
  )
}
