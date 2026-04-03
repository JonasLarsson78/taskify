import styles from '../page.module.css'
import type { ViewMode } from '../model'

type HomeTopbarProps = {
  projectTitle: string
  workspaceSub: string
  viewMode: ViewMode
  onChangeView: (next: ViewMode) => void
}

export default function HomeTopbar({
  projectTitle,
  workspaceSub,
  viewMode,
  onChangeView,
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
          className={`${styles.actionPill} ${viewMode === 'list' ? styles.actionPillActive : ''}`}
          type="button"
          onClick={() => onChangeView('list')}
        >
          ≡ List
        </button>
        <button
          className={`${styles.actionPill} ${viewMode === 'board' ? styles.actionPillActive : ''}`}
          type="button"
          onClick={() => onChangeView('board')}
        >
          ◫ Board
        </button>
        <button
          className={`${styles.actionPill} ${viewMode === 'box' ? styles.actionPillActive : ''}`}
          type="button"
          onClick={() => onChangeView('box')}
        >
          □ Box
        </button>
        <button className={styles.addView} type="button">
          + Add view
        </button>
      </div>
    </div>
  )
}
