import styles from '../page.module.css'
import type { Space } from '../model'
import { getInitial } from '../model'

type HomeSidebarProps = {
  personInitials: string
  personName: string
  userEmail: string
  spaces: Space[]
  selectedSpaceId: number | null
  onSelectSpace: (space: Space) => void
  onCreateSpace: () => void
}

export default function HomeSidebar({
  personInitials,
  personName,
  userEmail,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onCreateSpace,
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
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>⌂</span>
          Home
        </button>
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>◌</span>
          Notifications
        </button>
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>◎</span>
          Goals
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

        <button
          className={styles.navItem}
          type="button"
          onClick={onCreateSpace}
        >
          <span className={styles.navIcon}>+</span>
          New Space
        </button>
      </section>

      <div className={styles.sidebarFooter}>
        <span className={styles.avatarLarge}>{personInitials}</span>
        <div>
          <div className={styles.brandTitle}>{personName}</div>
          <div className={styles.brandSub}>{userEmail}</div>
        </div>
      </div>
    </aside>
  )
}
