type WorkspaceEvent = {
  organizationId: number
  type: string
  at: number
}

type SubscribeOptions = {
  token: string
  organizationId: number
  onEvent: (event: WorkspaceEvent) => void
  onError?: (event: Event) => void
}

export function subscribeToWorkspaceEvents({
  token,
  organizationId,
  onEvent,
  onError,
}: SubscribeOptions): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const params = new URLSearchParams({
    organizationId: String(organizationId),
    token,
  })
  const source = new EventSource(`/api/realtime?${params.toString()}`)

  source.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as WorkspaceEvent
      onEvent(parsed)
    } catch {
      // Ignore malformed payloads to keep the stream alive.
    }
  }

  source.onerror = (event) => {
    if (onError) {
      onError(event)
    }
  }

  return () => {
    source.close()
  }
}
