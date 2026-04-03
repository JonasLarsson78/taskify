import styles from '../page.module.css'
import type { Organization } from '../model'
import { getInitial } from '../model'

type HomeSidebarProps = {
  personInitials: string
  personName: string
  userEmail: string
  availableSpaces: Organization[]
  selectedOrganizationId: number | null
  currentOrganizationId: number | undefined
  onSelectOrganization: (organization: Organization) => void
}

export default function HomeSidebar({
  personInitials,
  personName,
  userEmail,
  availableSpaces,
  selectedOrganizationId,
  currentOrganizationId,
  onSelectOrganization,
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
        {availableSpaces.length > 0 ? (
          availableSpaces.map((org) => {
            const isActive =
              selectedOrganizationId === org.id ||
              (!selectedOrganizationId && currentOrganizationId === org.id)

            return (
              <button
                className={`${styles.spaceItem} ${
                  isActive ? styles.spaceActive : ''
                }`}
                type="button"
                key={org.id}
                onClick={() => onSelectOrganization(org)}
              >
                <span className={styles.spaceIcon}>
                  {getInitial(org.name, 'O')}
                </span>
                {org.name || `Organization ${org.id}`}
              </button>
            )
          })
        ) : (
          <div className={styles.brandSub}>No spaces found</div>
        )}
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
