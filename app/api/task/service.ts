import mysql from 'mysql2/promise'
import type { ResultSetHeader } from 'mysql2/promise'
import type { CreateTaskInput, UpdateTaskInput } from './validator'

type TaskRow = {
  id: number
  title: string
  meta: string | null
  dueDate: Date | null
  archivedAt: Date | null
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'High' | 'Normal' | 'Low'
  section: string
  color: string | null
  assigneeIds: number[]
  organizationId: number | null
  spaceId: number | null
  createdAt: Date
}

let initialized = false

function parseAssigneePayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string') return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getDbConfigFromEnv() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL not set')
  }

  const u = new URL(url)
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  }
}

const pool = mysql.createPool(getDbConfigFromEnv())

function normalizePriority(raw: unknown): TaskRow['priority'] {
  const value = typeof raw === 'string' ? raw : 'Normal'

  if (value === 'High' || value === 'Normal' || value === 'Low') {
    return value
  }

  if (value === 'flag') return 'High'
  if (value === 'low') return 'Low'
  return 'Normal'
}

async function ensureTaskTable() {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`Task\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`title\` VARCHAR(191) NOT NULL,
      \`meta\` VARCHAR(191) NULL,
      \`dueDate\` DATETIME(3) NULL,
      \`archivedAt\` DATETIME(3) NULL,
      \`stage\` VARCHAR(32) NOT NULL DEFAULT 'Planning',
      \`priority\` VARCHAR(16) NOT NULL DEFAULT 'Normal',
      \`section\` VARCHAR(32) NOT NULL DEFAULT 'Review',
      \`color\` VARCHAR(32) NULL,
      \`assignees\` TEXT NULL,
      \`organization_id\` INT NULL,
      \`space_id\` INT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`Task_organization_id_idx\` (\`organization_id\`),
      INDEX \`Task_space_id_idx\` (\`space_id\`)
    )
  `)

  try {
    await pool.query('ALTER TABLE `Task` ADD COLUMN `archivedAt` DATETIME(3) NULL')
  } catch {
    // Ignore if the column already exists.
  }

  try {
    await pool.query('ALTER TABLE `Task` ADD COLUMN `space_id` INT NULL')
  } catch {
    // Ignore if the column already exists.
  }

  try {
    await pool.query('CREATE INDEX `Task_space_id_idx` ON `Task` (`space_id`)')
  } catch {
    // Ignore if the index already exists.
  }

  await pool.query(
    "UPDATE `Task` SET `priority` = CASE WHEN `priority` = 'flag' THEN 'High' WHEN `priority` = 'muted' THEN 'Normal' WHEN `priority` = 'low' THEN 'Low' ELSE `priority` END"
  )

  try {
    await pool.query(
      "ALTER TABLE `Task` MODIFY COLUMN `priority` VARCHAR(16) NOT NULL DEFAULT 'Normal'"
    )
  } catch {
    // Ignore if the database considers this alter a no-op.
  }

  initialized = true
}

function mapTaskRow(row: Record<string, unknown>): TaskRow {
  const parsedAssignees = parseAssigneePayload(row.assignees)

  const assigneeIds = Array.isArray(parsedAssignees)
    ? parsedAssignees
        .map((value) => {
          if (typeof value === 'number') return value
          if (typeof value === 'string') {
            const parsed = Number.parseInt(value, 10)
            return Number.isNaN(parsed) ? null : parsed
          }
          return null
        })
        .filter((value): value is number => value !== null)
    : []

  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    meta: typeof row.meta === 'string' ? row.meta : null,
    dueDate: row.dueDate ? new Date(String(row.dueDate)) : null,
    archivedAt: row.archivedAt ? new Date(String(row.archivedAt)) : null,
    stage: (row.stage as TaskRow['stage']) || 'Planning',
    priority: normalizePriority(row.priority),
    section:
      typeof row.section === 'string' && row.section.trim()
        ? row.section
        : 'Review',
    color: typeof row.color === 'string' ? row.color : null,
    assigneeIds,
    organizationId:
      typeof row.organization_id === 'number' ? row.organization_id : null,
    spaceId: typeof row.space_id === 'number' ? row.space_id : null,
    createdAt: new Date(String(row.createdAt)),
  }
}

export async function listTasks(
  organizationId?: number | null,
  spaceId?: number | null,
  archivedMode: 'exclude' | 'only' | 'include' = 'exclude'
) {
  await ensureTaskTable()

  let sql = 'SELECT * FROM `Task`'
  const clauses: string[] = []
  const params: unknown[] = []

  if (typeof organizationId === 'number') {
    clauses.push('organization_id = ?')
    params.push(organizationId)
  }

  if (typeof spaceId === 'number') {
    clauses.push('space_id = ?')
    params.push(spaceId)
  }

  if (archivedMode === 'exclude') {
    clauses.push('archivedAt IS NULL')
  } else if (archivedMode === 'only') {
    clauses.push('archivedAt IS NOT NULL')
  }

  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(' AND ')}`
  }

  sql += ' ORDER BY createdAt DESC, id DESC'

  const [rows] = await pool.query(sql, params)
  return (rows as Record<string, unknown>[]).map(mapTaskRow)
}

export async function createTask(input: CreateTaskInput) {
  await ensureTaskTable()

  const [res] = await pool.query<ResultSetHeader>(
    'INSERT INTO `Task` (title,meta,dueDate,archivedAt,stage,priority,section,color,assignees,organization_id,space_id,createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))',
    [
      input.title,
      input.meta,
      input.dueDate ? new Date(input.dueDate) : null,
      null,
      input.stage,
      input.priority,
      input.section,
      input.color,
      JSON.stringify(input.assigneeIds),
      input.organizationId,
      input.spaceId,
    ]
  )

  const insertId = res.insertId
  const [rows] = await pool.query('SELECT * FROM `Task` WHERE id = ? LIMIT 1', [
    insertId,
  ])

  const row = (rows as Record<string, unknown>[])[0]
  return row ? mapTaskRow(row) : null
}

export async function updateTask(id: number, patch: UpdateTaskInput) {
  await ensureTaskTable()

  const fields: string[] = []
  const values: unknown[] = []

  if (patch.title !== undefined) {
    fields.push('title = ?')
    values.push(patch.title)
  }
  if (patch.meta !== undefined) {
    fields.push('meta = ?')
    values.push(patch.meta)
  }
  if (patch.dueDate !== undefined) {
    fields.push('dueDate = ?')
    values.push(patch.dueDate ? new Date(patch.dueDate) : null)
  }
  if (patch.archivedAt !== undefined) {
    fields.push('archivedAt = ?')
    values.push(patch.archivedAt ? new Date(patch.archivedAt) : null)
  }
  if (patch.stage !== undefined) {
    fields.push('stage = ?')
    values.push(patch.stage)
  }
  if (patch.priority !== undefined) {
    fields.push('priority = ?')
    values.push(patch.priority)
  }
  if (patch.section !== undefined) {
    fields.push('section = ?')
    values.push(patch.section)
  }
  if (patch.color !== undefined) {
    fields.push('color = ?')
    values.push(patch.color)
  }
  if (patch.assigneeIds !== undefined) {
    fields.push('assignees = ?')
    values.push(JSON.stringify(patch.assigneeIds))
  }
  if (patch.organizationId !== undefined) {
    fields.push('organization_id = ?')
    values.push(patch.organizationId)
  }
  if (patch.spaceId !== undefined) {
    fields.push('space_id = ?')
    values.push(patch.spaceId)
  }

  if (fields.length === 0) return null

  values.push(id)
  await pool.query(
    `UPDATE \`Task\` SET ${fields.join(', ')} WHERE id = ?`,
    values
  )

  const [rows] = await pool.query('SELECT * FROM `Task` WHERE id = ? LIMIT 1', [
    id,
  ])
  const row = (rows as Record<string, unknown>[])[0]
  return row ? mapTaskRow(row) : null
}

export async function deleteTask(id: number) {
  await ensureTaskTable()
  const [res] = await pool.query<ResultSetHeader>(
    'DELETE FROM `Task` WHERE id = ? LIMIT 1',
    [id]
  )
  return res.affectedRows > 0
}
