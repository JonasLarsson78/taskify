'use client'

import styles from '../_styles/home-sidebar.module.css'
import type { Space } from '../model'
import { getInitial } from '../model'
import type { AppContent } from '../../../lib/content'
import useTheme from '../../_hooks/use-theme'
import {
  Archive,
  CircleDot,
  House,
  LogOut,
  Moon,
  Plus,
  Sun,
  Target,
} from 'lucide-react'

type HomeSidebarProps = {
  personInitials: string
  personName: string
  userEmail: string
  activeItem: 'home' | 'goals' | 'archive' | 'log' | 'settings'
  showSpaces?: boolean
  spaces?: Space[]
  selectedSpaceId?: number | null
  onOpenHome: () => void
  onOpenLog: () => void
  onOpenArchive: () => void
  onOpenGoals: () => void
  onOpenSettings: () => void
  onOpenLogout: () => void
  onSelectSpace?: (space: Space) => void
  onCreateSpace?: () => void
  canCreateSpace?: boolean
  content: AppContent['home']['sidebar']
}

export default function HomeSidebar({
  personInitials,
  personName,
  userEmail,
  activeItem,
  showSpaces = false,
  spaces = [],
  selectedSpaceId = null,
  onOpenHome,
  onOpenLog,
  onOpenArchive,
  onOpenGoals,
  onOpenSettings,
  onOpenLogout,
  onSelectSpace,
  onCreateSpace,
  canCreateSpace = false,
  content,
}: HomeSidebarProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandRow}>
        <span className={styles.brandMark} />
        <div className={styles.brandText}>
          <div className={styles.brandTitle}>Taskify</div>
          <div className={styles.brandSub}>{content.brandSub}</div>
        </div>
      </div>

      <section className={styles.navSection}>
        <div className={styles.sectionLabel}>{content.workspace}</div>
        <button
          className={`${styles.navItem} ${
            activeItem === 'home' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={onOpenHome}
          title={content.home}
        >
          <span className={styles.navIcon}>
            <House className={styles.navIconSvg} />
          </span>
          {content.home}
        </button>
        <button
          className={`${styles.navItem} ${
            activeItem === 'log' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={onOpenLog}
          title={content.log}
        >
          <span className={styles.navIcon}>
            <CircleDot className={styles.navIconSvg} />
          </span>
          {content.log}
        </button>
        <button
          className={`${styles.navItem} ${
            activeItem === 'goals' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={onOpenGoals}
          title={content.goals}
        >
          <span className={styles.navIcon}>
            <Target className={styles.navIconSvg} />
          </span>
          {content.goals}
        </button>
        <button
          className={`${styles.navItem} ${
            activeItem === 'archive' ? styles.navItemActive : ''
          }`}
          type="button"
          onClick={onOpenArchive}
        >
          <span className={styles.navIcon}>
            <Archive className={styles.navIconSvg} />
          </span>
          {content.archive}
        </button>
      </section>

      {showSpaces ? (
        <section className={styles.navSection}>
          <div className={styles.sectionLabel}>{content.spaces}</div>
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
                  onClick={() => onSelectSpace?.(space)}
                >
                  <span className={styles.spaceIcon}>
                    {getInitial(space.name, 'S')}
                  </span>
                  {space.name || `Space ${space.id}`}
                </button>
              )
            })
          ) : (
            <div className={styles.brandSub}>{content.noSpaces}</div>
          )}

          {canCreateSpace ? (
            <button
              className={styles.navItem}
              type="button"
              onClick={onCreateSpace}
            >
              <span className={styles.navIcon}>
                <Plus className={styles.navIconSvg} />
              </span>
              {content.newSpace}
            </button>
          ) : null}
        </section>
      ) : null}

      <div className={styles.sidebarFooterArea}>
        <button
          className={`${styles.navItem} ${styles.themeToggle}`}
          type="button"
          onClick={toggleTheme}
          title={isDark ? content.lightMode : content.darkMode}
        >
          <span className={styles.navIcon}>
            {isDark ? (
              <Sun className={styles.navIconSvg} />
            ) : (
              <Moon className={styles.navIconSvg} />
            )}
          </span>
          {isDark ? content.lightMode : content.darkMode}
        </button>

        <button
          className={styles.navItem}
          type="button"
          onClick={onOpenLogout}
          title={content.logout}
        >
          <span className={styles.navIcon}>
            <LogOut className={styles.navIconSvg} />
          </span>
          {content.logout}
        </button>

        <button
          className={`${styles.sidebarFooterButton} ${
            activeItem === 'settings' ? styles.sidebarFooterButtonActive : ''
          }`}
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
      </div>
    </aside>
  )
}
