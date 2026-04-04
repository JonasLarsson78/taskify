'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '../components/loader/loader'
import useStore from '../../lib/store'
import { getContent, normalizeLanguage } from '../../lib/content'
import { subscribeToWorkspaceEvents } from '../../lib/realtime/client'
import HomeSidebar from '../home/_components/home-sidebar'
import styles from '../home/page.module.css'
import logStyles from './page.module.css'
import { Eraser, Pause, Play } from 'lucide-react'

type WorkspaceEvent = {
  organizationId: number
  type: string
  at: number
  details?: Record<string, unknown>
}

function toLabel(event: WorkspaceEvent, ui: ReturnType<typeof getContent>) {
  const type = event.type

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
      return `${actionLabel}: ${title || '#'} (${fromSection} -> ${toSection})`
    }

    return title ? `${actionLabel}: ${title}` : actionLabel
  }

  if (type === 'connected') return ui.log.eventTypes.connected
  if (type === 'goal.changed') return ui.log.eventTypes.goalChanged
  if (type === 'space.changed') return ui.log.eventTypes.spaceChanged
  if (type === 'user.changed') return ui.log.eventTypes.userChanged
  if (type === 'organization.changed') {
    return ui.log.eventTypes.organizationChanged
  }
  return ui.log.eventTypes.unknown
}

export default function LogPage() {
  const router = useRouter()
  const token = useStore((state) => state.token)
  const rehydrated = useStore((state) => state.rehydrated)
  const sessionUser = useStore((state) => state.user)

  const ui = getContent(sessionUser?.preferredLanguage)
  const locale =
    normalizeLanguage(sessionUser?.preferredLanguage) === 'sv'
      ? 'sv-SE'
      : 'en-GB'
  const personName = sessionUser?.name || ui.home.guest
  const personInitials =
    personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GU'

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
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          router.replace('/login')
          return
        }

        const verifyData = await res.json().catch(() => null)
        const user =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as { organizationId?: number | null })
            : null

        if (mounted) {
          setOrganizationId(user?.organizationId || null)
        }
      } catch (verifyError) {
        console.error('log verify error', verifyError)
        if (mounted) {
          setError('Could not verify session.')
        }
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

  const visibleEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      label: toLabel(event, ui),
      timestamp: new Date(event.at).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }))
  }, [events, locale, ui])

  if (checking) {
    return (
      <main className="center-screen">
        <Loader message={ui.log.loading} />
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <HomeSidebar
        personInitials={personInitials}
        personName={personName}
        userEmail={sessionUser?.email || ui.home.signedIn}
        activeItem="log"
        content={ui.home.sidebar}
        onOpenHome={() => router.push('/home')}
        onOpenArchive={() => router.push('/archive')}
        onOpenLog={() => router.push('/log')}
        onOpenGoals={() => router.push('/goals')}
        onOpenSettings={() => router.push('/settings')}
        onOpenLogout={() => router.push('/logout')}
      />

      <section className={logStyles.wrap}>
        <div className={logStyles.topbar}>
          <div>
            <div className={logStyles.title}>{ui.log.title}</div>
            <div className={logStyles.sub}>{ui.log.subtitle}</div>
          </div>

          <div className={logStyles.actions}>
            <button
              className={logStyles.btn}
              type="button"
              onClick={() => setEvents([])}
            >
              <Eraser className={logStyles.btnIcon} aria-hidden="true" />
              <span>{ui.log.actions.clear}</span>
            </button>
            <button
              className={logStyles.btn}
              type="button"
              onClick={() => setPaused((prev) => !prev)}
            >
              {paused ? (
                <Play className={logStyles.btnIcon} aria-hidden="true" />
              ) : (
                <Pause className={logStyles.btnIcon} aria-hidden="true" />
              )}
              <span>
                {paused ? ui.log.actions.resume : ui.log.actions.pause}
              </span>
            </button>
          </div>
        </div>

        {error ? <div className={logStyles.error}>{error}</div> : null}

        <div className={logStyles.card}>
          {visibleEvents.length === 0 ? (
            <div className={logStyles.empty}>{ui.log.empty}</div>
          ) : (
            <ul className={logStyles.list}>
              {visibleEvents.map((event, index) => (
                <li
                  key={`${event.type}-${event.at}-${index}`}
                  className={logStyles.item}
                >
                  <span className={logStyles.message}>{event.label}</span>
                  <span className={logStyles.meta}>
                    #{event.organizationId} • {event.timestamp}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
