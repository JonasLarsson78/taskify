import styles from '../page.module.css'
import type { ViewMode } from '../model'
import type { AppContent } from '../../../lib/content'

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
    <div className={styles.topbar}>
      <div className={styles.workspaceMeta}>
        <span className={styles.workspaceBadge}>◫</span>
        <div>
          <div className={styles.workspaceTitle}>{projectTitle}</div>
          <div className={styles.workspaceSub}>{workspaceSub}</div>
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
          ≡ {content.list}
        </button>
        <button
          className={`${styles.actionPill} ${
            viewMode === 'board' ? styles.actionPillActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('board')}
        >
          ◫ {content.board}
        </button>
        <button
          className={`${styles.actionPill} ${
            viewMode === 'box' ? styles.actionPillActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('box')}
        >
          □ {content.box}
        </button>
        {canOpenSpaceSettings ? (
          <button
            className={styles.addView}
            type="button"
            onClick={onOpenSpaceSettings}
          >
            {content.spaceSettings}
          </button>
        ) : null}
      </div>
    </div>
  )
}
