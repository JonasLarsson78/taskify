type WorkspaceEvent = {
  organizationId: number
  type: string
  at: number
}

type WorkspaceListener = (event: WorkspaceEvent) => void

type WorkspaceEventBus = {
  listenersByOrganization: Map<number, Set<WorkspaceListener>>
}

declare global {
  var __taskifyWorkspaceEventBus: WorkspaceEventBus | undefined
}

function getBus(): WorkspaceEventBus {
  if (!globalThis.__taskifyWorkspaceEventBus) {
    globalThis.__taskifyWorkspaceEventBus = {
      listenersByOrganization: new Map<number, Set<WorkspaceListener>>(),
    }
  }

  return globalThis.__taskifyWorkspaceEventBus
}

export function subscribeWorkspaceEvents(
  organizationId: number,
  listener: WorkspaceListener
): () => void {
  const bus = getBus()
  const listeners = bus.listenersByOrganization.get(organizationId) || new Set()
  listeners.add(listener)
  bus.listenersByOrganization.set(organizationId, listeners)

  return () => {
    const current = bus.listenersByOrganization.get(organizationId)
    if (!current) return

    current.delete(listener)
    if (current.size === 0) {
      bus.listenersByOrganization.delete(organizationId)
    }
  }
}

export function publishWorkspaceEvent(
  organizationId: number | null | undefined,
  type: string
) {
  if (!organizationId || !Number.isInteger(organizationId)) return

  const bus = getBus()
  const listeners = bus.listenersByOrganization.get(organizationId)
  if (!listeners || listeners.size === 0) return

  const event: WorkspaceEvent = {
    organizationId,
    type,
    at: Date.now(),
  }

  for (const listener of listeners) {
    listener(event)
  }
}
