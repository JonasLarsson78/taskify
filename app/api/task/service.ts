import mysql from 'mysql2/promise'
import type { ResultSetHeader } from 'mysql2/promise'
import type { CreateTaskInput, UpdateTaskInput } from './validator'

type TaskRow = {
  id: number
  title: string
  meta: string | null
  dueDate: Date | null
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'flag' | 'muted'
  section: 'Issues Found' | 'Review' | 'Ready'
  color: string | null
  assignees: string[]
  organizationId: number | null
  createdAt: Date
}

let initialized = false

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

async function ensureTaskTable() {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`Task\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`title\` VARCHAR(191) NOT NULL,
      \`meta\` VARCHAR(191) NULL,
      \`dueDate\` DATETIME(3) NULL,
      \`stage\` VARCHAR(32) NOT NULL DEFAULT 'Planning',
      \`priority\` VARCHAR(16) NOT NULL DEFAULT 'muted',
      \`section\` VARCHAR(32) NOT NULL DEFAULT 'Review',
      \`color\` VARCHAR(32) NULL,
      \`assignees\` TEXT NULL,
      \`organization_id\` INT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`Task_organization_id_idx\` (\`organization_id\`)
    )
  `)

  initialized = true
}

function mapTaskRow(row: Record<string, unknown>): TaskRow {
  const parsedAssignees =
    typeof row.assignees === 'string'
      ? JSON.parse(row.assignees)
      : Array.isArray(row.assignees)
      ? row.assignees
      : []

  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    meta: typeof row.meta === 'string' ? row.meta : null,
    dueDate: row.dueDate ? new Date(String(row.dueDate)) : null,
    stage: (row.stage as TaskRow['stage']) || 'Planning',
    priority: (row.priority as TaskRow['priority']) || 'muted',
    section: (row.section as TaskRow['section']) || 'Review',
    color: typeof row.color === 'string' ? row.color : null,
    assignees: Array.isArray(parsedAssignees)
      ? parsedAssignees.filter((v): v is string => typeof v === 'string')
      : [],
    organizationId:
      typeof row.organization_id === 'number' ? row.organization_id : null,
    createdAt: new Date(String(row.createdAt)),
  }
}

export async function listTasks(organizationId?: number | null) {
  await ensureTaskTable()

  const sql =
    typeof organizationId === 'number'
      ? 'SELECT * FROM `Task` WHERE organization_id = ? ORDER BY createdAt DESC, id DESC'
      : 'SELECT * FROM `Task` ORDER BY createdAt DESC, id DESC'

  const params = typeof organizationId === 'number' ? [organizationId] : []
  const [rows] = await pool.query(sql, params)
  return (rows as Record<string, unknown>[]).map(mapTaskRow)
}

export async function createTask(input: CreateTaskInput) {
  await ensureTaskTable()

  const [res] = await pool.query<ResultSetHeader>(
    'INSERT INTO `Task` (title,meta,dueDate,stage,priority,section,color,assignees,organization_id,createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))',
    [
      input.title,
      input.meta,
      input.dueDate ? new Date(input.dueDate) : null,
      input.stage,
      input.priority,
      input.section,
      input.color,
      JSON.stringify(input.assignees),
      input.organizationId,
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
  if (patch.assignees !== undefined) {
    fields.push('assignees = ?')
    values.push(JSON.stringify(patch.assignees))
  }
  if (patch.organizationId !== undefined) {
    fields.push('organization_id = ?')
    values.push(patch.organizationId)
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
