import styles from '../page.module.css'
import type { Space, ViewMode } from '../model'
import { getInitial } from '../model'

type HomeSidebarProps = {
  personInitials: string
  personName: string
  userEmail: string
  viewMode: ViewMode
  spaces: Space[]
  selectedSpaceId: number | null
  onChangeView: (next: ViewMode) => void
  onOpenArchive: () => void
  onOpenSettings: () => void
  onSelectSpace: (space: Space) => void
  onCreateSpace: () => void
  canCreateSpace: boolean
}

export default function HomeSidebar({
  personInitials,
  personName,
  userEmail,
  viewMode,
  spaces,
  selectedSpaceId,
  onChangeView,
  onOpenArchive,
  onOpenSettings,
  onSelectSpace,
  onCreateSpace,
  canCreateSpace,
}: HomeSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandRow}>
        <span className={styles.brandMark} />
        <div className={styles.brandText}>
          <div className={styles.brandTitle}>Taskify</div>
          <div className={styles.brandSub}>Work faster, stay aligned</div>
        </div>
      </div>

      <section className={styles.navSection}>
        <div className={styles.sectionLabel}>Workspace</div>
        <button
          className={`${styles.navItem} ${
            viewMode === 'list' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('list')}
          title="Open home view"
        >
          <span className={styles.navIcon}>⌂</span>
          Home
        </button>
        <button
          className={`${styles.navItem} ${
            viewMode === 'board' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('board')}
          title="Open notifications view"
        >
          <span className={styles.navIcon}>◌</span>
          Notifications
        </button>
        <button
          className={`${styles.navItem} ${
            viewMode === 'box' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={() => onChangeView('box')}
          title="Open goals view"
        >
          <span className={styles.navIcon}>◎</span>
          Goals
        </button>
        <button
          className={styles.navItem}
          type="button"
          onClick={onOpenArchive}
        >
          <span className={styles.navIcon}>▣</span>
          Archive
        </button>
      </section>

      <section className={styles.navSection}>
        <div className={styles.sectionLabel}>Spaces</div>
        {spaces.length > 0 ? (
          spaces.map((space) => {
            const isActive = selectedSpaceId === space.id

            return (
              <button
                className={`${styles.spaceItem} ${
                  isActive ? styles.spaceActive : ''
                }`}
                type="button"
                key={space.id}
                onClick={() => onSelectSpace(space)}
              >
                <span className={styles.spaceIcon}>
                  {getInitial(space.name, 'S')}
                </span>
                {space.name || `Space ${space.id}`}
              </button>
            )
          })
        ) : (
          <div className={styles.brandSub}>No spaces found</div>
        )}

        {canCreateSpace ? (
          <button className={styles.navItem} type="button" onClick={onCreateSpace}>
            <span className={styles.navIcon}>+</span>
            New Space
          </button>
        ) : null}
      </section>

      <button
        className={styles.sidebarFooterButton}
        type="button"
        onClick={onOpenSettings}
      >
        <div className={styles.sidebarFooter}>
          <span className={styles.avatarLarge}>{personInitials}</span>
          <div>
            <div className={styles.brandTitle}>{personName}</div>
            <div className={styles.brandSub}>{userEmail}</div>
          </div>
        </div>
      </button>
    </aside>
  )
}
