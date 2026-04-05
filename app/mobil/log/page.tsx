'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Eraser } from 'lucide-react'
import useStore from '../../../lib/store'
import { getContent, normalizeLanguage } from '../../../lib/content'
import { subscribeToWorkspaceEvents } from '../../../lib/realtime/client'
import MobileNav from '../_components/mobile-nav'
import styles from '../page.module.css'

type WorkspaceEvent = {
  organizationId: number
  type: string
  at: number
  details?: Record<string, unknown>
}

function toLabel(event: WorkspaceEvent, ui: ReturnType<typeof getContent>) {
  const { type } = event

  if (type === 'task.changed') {
    const action =
      typeof event.details?.action === 'string' ? event.details.action : null
    const title =
      typeof event.details?.title === 'string' ? event.details.title : null
    const fromSection =
      typeof event.details?.fromSection === 'string'
        ? event.details.fromSection
        : null
    const toSection =
      typeof event.details?.toSection === 'string'
        ? event.details.toSection
        : null

    const actionLabel =
      action === 'created'
        ? ui.log.taskActions.created
        : action === 'moved'
        ? ui.log.taskActions.moved
        : action === 'deleted'
        ? ui.log.taskActions.deleted
        : ui.log.taskActions.updated

    if (action === 'moved' && fromSection && toSection) {
      return `${actionLabel}: ${title || '#'} (${fromSection} → ${toSection})`
    }
    return title ? `${actionLabel}: ${title}` : actionLabel
  }

  if (type === 'connected') return ui.log.eventTypes.connected
  if (type === 'goal.changed') return ui.log.eventTypes.goalChanged
  if (type === 'space.changed') return ui.log.eventTypes.spaceChanged
  if (type === 'user.changed') return ui.log.eventTypes.userChanged
  if (type === 'organization.changed')
    return ui.log.eventTypes.organizationChanged
  return ui.log.eventTypes.unknown
}

export default function MobilLogPage() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const rehydrated = useStore((s) => s.rehydrated)
  const user = useStore((s) => s.user)
  const ui = getContent(user?.preferredLanguage)
  const locale =
    normalizeLanguage(user?.preferredLanguage) === 'sv' ? 'sv-SE' : 'en-GB'

  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<WorkspaceEvent[]>([])
  const [organizationId, setOrganizationId] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let mounted = true

    async function verify() {
      try {
        if (!rehydrated) return
        if (!token) {
          router.replace('/login')
          return
        }

        const res = await fetch('/api/verify', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          router.replace('/login')
          return
        }

        const verifyData = await res.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as { organizationId?: number | null })
            : null

        if (mounted) {
          setOrganizationId(verifiedUser?.organizationId || null)
        }
      } catch {
        if (mounted) setError('Could not verify session.')
      } finally {
        if (mounted) setChecking(false)
      }
    }

    void verify()
    return () => {
      mounted = false
    }
  }, [rehydrated, token, router])

  useEffect(() => {
    if (!token || !organizationId || paused) return

    return subscribeToWorkspaceEvents({
      token,
      organizationId,
      onEvent: (event) => {
        setEvents((prev) => [event, ...prev].slice(0, 120))
      },
      onError: () => {
        setError('Live stream disconnected. Trying to reconnect...')
      },
    })
  }, [token, organizationId, paused])

  const visibleEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        label: toLabel(event, ui),
        timestamp: new Date(event.at).toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      })),
    [events, locale, ui]
  )

  if (checking) {
    return (
      <main className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <span className={styles.topbarDot} />
            <div>
              <p className={styles.topbarTitle}>{ui.log.title}</p>
            </div>
          </div>
        </header>
        <div className={styles.loadingState}>
          <div className={styles.loadingDot} />
          <p className={styles.loadingText}>{ui.log.loading}</p>
        </div>
        <MobileNav active="log" />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarBrand}>
          <span className={styles.topbarDot} />
          <div>
            <p className={styles.topbarTitle}>{ui.log.title}</p>
            <p className={styles.topbarSub}>{ui.log.subtitle}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? ui.log.actions.resume : ui.log.actions.pause}
            style={iconBtnStyle}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setEvents([])}
            aria-label={ui.log.actions.clear}
            style={iconBtnStyle}
          >
            <Eraser size={16} />
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.taskFeed}>
        {visibleEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📡</span>
            <p className={styles.emptyLabel}>{ui.log.empty}</p>
          </div>
        ) : (
          visibleEvents.map((event, index) => (
            <div
              key={`${event.type}-${event.at}-${index}`}
              style={eventRowStyle}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#21253d',
                  flex: 1,
                }}
              >
                {event.label}
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  color: '#a2abc9',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.timestamp}
              </span>
            </div>
          ))
        )}
      </div>

      <MobileNav active="log" />
    </main>
  )
}

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'rgba(111,90,214,0.08)',
  border: '1px solid rgba(111,90,214,0.16)',
  cursor: 'pointer',
  color: '#6f5ad6',
}

const eventRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.9)',
  borderRadius: 12,
  border: '1px solid rgba(31,35,78,0.07)',
}
