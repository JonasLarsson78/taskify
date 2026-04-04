import { getMysqlPool } from '../mysql/pool'

type WorkspaceEvent = {
  organizationId: number
  type: string
  at: number
  details?: Record<string, unknown>
}

type WorkspaceEventWithId = WorkspaceEvent & {
  id: number
}

type WorkspaceListener = (event: WorkspaceEvent) => void

type WorkspaceEventBus = {
  listenersByOrganization: Map<number, Set<WorkspaceListener>>
}

declare global {
  var __taskifyWorkspaceEventBus: WorkspaceEventBus | undefined
}

let initialized = false

const pool = getMysqlPool()

async function ensureWorkspaceEventsTable() {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`WorkspaceEvent\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`organization_id\` INT NOT NULL,
      \`type\` VARCHAR(64) NOT NULL,
      \`details\` TEXT NULL,
      \`at_ms\` BIGINT NOT NULL,
      PRIMARY KEY (\`id\`),
      INDEX \`WorkspaceEvent_org_id_idx\` (\`organization_id\`),
      INDEX \`WorkspaceEvent_at_ms_idx\` (\`at_ms\`)
    )
  `)

  initialized = true
}

function parseDetails(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== 'string' || !raw) return undefined

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : undefined
  } catch {
    return undefined
  }
}

function parseNumeric(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function mapEventRow(row: Record<string, unknown>): WorkspaceEventWithId {
  return {
    id: parseNumeric(row.id),
    organizationId: parseNumeric(row.organization_id),
    type: typeof row.type === 'string' ? row.type : 'unknown',
    at: parseNumeric(row.at_ms),
    details: parseDetails(row.details),
  }
}

async function persistWorkspaceEvent(event: WorkspaceEvent) {
  await ensureWorkspaceEventsTable()
  await pool.query(
    'INSERT INTO `WorkspaceEvent` (organization_id, type, details, at_ms) VALUES (?, ?, ?, ?)',
    [
      event.organizationId,
      event.type,
      event.details ? JSON.stringify(event.details) : null,
      event.at,
    ]
  )
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
  type: string,
  details?: Record<string, unknown>
) {
  if (!organizationId || !Number.isInteger(organizationId)) return

  const bus = getBus()
  const event: WorkspaceEvent = {
    organizationId,
    type,
    at: Date.now(),
    details,
  }

  const listeners = bus.listenersByOrganization.get(organizationId)
  if (listeners && listeners.size > 0) {
    for (const listener of listeners) {
      listener(event)
    }
  }

  void persistWorkspaceEvent(event).catch((error) => {
    console.error('persist workspace event error', error)
  })
}

export async function getWorkspaceEventCursor(organizationId: number) {
  await ensureWorkspaceEventsTable()
  const [rows] = await pool.query(
    'SELECT COALESCE(MAX(id), 0) AS max_id FROM `WorkspaceEvent` WHERE organization_id = ?',
    [organizationId]
  )
  const row = (rows as Record<string, unknown>[])[0]
  return parseNumeric(row?.max_id)
}

export async function listWorkspaceEventsSince(
  organizationId: number,
  afterId: number
) {
  await ensureWorkspaceEventsTable()
  const [rows] = await pool.query(
    'SELECT id, organization_id, type, details, at_ms FROM `WorkspaceEvent` WHERE organization_id = ? AND id > ? ORDER BY id ASC LIMIT 200',
    [organizationId, afterId]
  )
  return (rows as Record<string, unknown>[]).map(mapEventRow)
}

export async function listRecentWorkspaceEvents(
  organizationId: number,
  limit = 30
) {
  await ensureWorkspaceEventsTable()

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200)
  const [rows] = await pool.query(
    `SELECT id, organization_id, type, details, at_ms
     FROM \`WorkspaceEvent\`
     WHERE organization_id = ?
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [organizationId]
  )

  return (rows as Record<string, unknown>[]).map(mapEventRow).reverse()
}
