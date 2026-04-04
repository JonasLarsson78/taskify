import mysql from 'mysql2/promise'
import type { ResultSetHeader } from 'mysql2/promise'
import type { CreateGoalInput, UpdateGoalInput } from './validator'

type GoalRow = {
  id: number
  title: string
  description: string | null
  targetDate: Date | null
  organizationId: number | null
  spaceId: number | null
  manualProgress: number | null
  createdAt: Date
}

export type GoalWithStats = GoalRow & {
  taskIds: number[]
  linkedTaskCount: number
  autoProgress: number
  progress: number
  atRisk: boolean
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

async function ensureGoalTables() {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`Goal\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`title\` VARCHAR(191) NOT NULL,
      \`description\` VARCHAR(512) NULL,
      \`target_date\` DATETIME(3) NULL,
      \`organization_id\` INT NOT NULL,
      \`space_id\` INT NULL,
      \`manual_progress\` INT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`Goal_organization_id_idx\` (\`organization_id\`),
      INDEX \`Goal_space_id_idx\` (\`space_id\`)
    )
  `)

  try {
    await pool.query('ALTER TABLE `Goal` ADD COLUMN `manual_progress` INT NULL')
  } catch {
    // Ignore if the column already exists.
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`GoalTask\` (
      \`goal_id\` INT NOT NULL,
      \`task_id\` INT NOT NULL,
      PRIMARY KEY (\`goal_id\`, \`task_id\`),
      INDEX \`GoalTask_task_id_idx\` (\`task_id\`)
    )
  `)

  initialized = true
}

function mapGoalRow(row: Record<string, unknown>): GoalRow {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    description: typeof row.description === 'string' ? row.description : null,
    targetDate: row.target_date ? new Date(String(row.target_date)) : null,
    organizationId:
      typeof row.organization_id === 'number' ? row.organization_id : null,
    spaceId: typeof row.space_id === 'number' ? row.space_id : null,
    manualProgress:
      typeof row.manual_progress === 'number'
        ? Math.max(0, Math.min(100, Math.round(row.manual_progress)))
        : null,
    createdAt: new Date(String(row.createdAt)),
  }
}

function isTaskCompleted(task: {
  section: string | null
  archivedAt: Date | null
}) {
  if (task.archivedAt) return true

  const section = task.section?.trim().toLowerCase() || ''
  return (
    section === 'ready' ||
    section === 'done' ||
    section === 'closed' ||
    section === 'complete' ||
    section === 'completed'
  )
}

function computeAtRisk(targetDate: Date | null, progress: number) {
  if (!targetDate || progress >= 100) return false

  const now = Date.now()
  const msLeft = targetDate.getTime() - now
  const daysLeft = msLeft / (1000 * 60 * 60 * 24)

  if (daysLeft < 0) return progress < 100
  if (daysLeft <= 3) return progress < 70
  if (daysLeft <= 7) return progress < 40

  return false
}

async function loadTaskIdsByGoalId(goalIds: number[]) {
  if (goalIds.length === 0) return new Map<number, number[]>()

  const placeholders = goalIds.map(() => '?').join(', ')
  const [rows] = await pool.query(
    `SELECT goal_id, task_id FROM \`GoalTask\` WHERE goal_id IN (${placeholders})`,
    goalIds
  )

  const map = new Map<number, number[]>()
  for (const row of rows as Record<string, unknown>[]) {
    const goalId = Number(row.goal_id)
    const taskId = Number(row.task_id)
    const existing = map.get(goalId) || []
    existing.push(taskId)
    map.set(goalId, existing)
  }

  return map
}

async function loadTaskCompletionByTaskIds(taskIds: number[]) {
  if (taskIds.length === 0) return new Map<number, boolean>()

  const placeholders = taskIds.map(() => '?').join(', ')

  try {
    const [rows] = await pool.query(
      `SELECT id, section, archivedAt FROM \`Task\` WHERE id IN (${placeholders})`,
      taskIds
    )

    const map = new Map<number, boolean>()
    for (const row of rows as Record<string, unknown>[]) {
      const id = Number(row.id)
      const section = typeof row.section === 'string' ? row.section : null
      const archivedAt = row.archivedAt
        ? new Date(String(row.archivedAt))
        : null
      map.set(id, isTaskCompleted({ section, archivedAt }))
    }

    return map
  } catch {
    // Task table might not exist yet in fresh setups.
    return new Map<number, boolean>()
  }
}

async function attachStats(goals: GoalRow[]): Promise<GoalWithStats[]> {
  if (goals.length === 0) return []

  const goalIds = goals.map((goal) => goal.id)
  const taskIdsByGoalId = await loadTaskIdsByGoalId(goalIds)

  const uniqueTaskIds = Array.from(
    new Set(Array.from(taskIdsByGoalId.values()).flatMap((taskIds) => taskIds))
  )
  const completionByTaskId = await loadTaskCompletionByTaskIds(uniqueTaskIds)

  return goals.map((goal) => {
    const taskIds = taskIdsByGoalId.get(goal.id) || []
    const completed = taskIds.filter((taskId) =>
      completionByTaskId.get(taskId)
    ).length
    const autoProgress =
      taskIds.length === 0 ? 0 : Math.round((completed / taskIds.length) * 100)
    const progress = goal.manualProgress ?? autoProgress

    return {
      ...goal,
      taskIds,
      linkedTaskCount: taskIds.length,
      autoProgress,
      progress,
      atRisk: computeAtRisk(goal.targetDate, progress),
    }
  })
}

export async function listGoals(
  organizationId?: number | null,
  spaceId?: number | null
) {
  await ensureGoalTables()

  let sql = 'SELECT * FROM `Goal`'
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

  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(' AND ')}`
  }

  sql += ' ORDER BY createdAt DESC, id DESC'

  const [rows] = await pool.query(sql, params)
  const goals = (rows as Record<string, unknown>[]).map(mapGoalRow)
  return attachStats(goals)
}

export async function getGoalById(id: number) {
  await ensureGoalTables()

  const [rows] = await pool.query('SELECT * FROM `Goal` WHERE id = ? LIMIT 1', [
    id,
  ])
  const row = (rows as Record<string, unknown>[])[0]
  if (!row) return null

  const withStats = await attachStats([mapGoalRow(row)])
  return withStats[0] || null
}

export async function setGoalTaskIds(goalId: number, taskIds: number[]) {
  await ensureGoalTables()

  await pool.query('DELETE FROM `GoalTask` WHERE goal_id = ?', [goalId])

  if (taskIds.length === 0) return

  const placeholders = taskIds.map(() => '(?, ?)').join(', ')
  const params = taskIds.flatMap((taskId) => [goalId, taskId])
  await pool.query(
    `INSERT INTO \`GoalTask\` (goal_id, task_id) VALUES ${placeholders}`,
    params
  )
}

export async function createGoal(input: CreateGoalInput) {
  await ensureGoalTables()

  const [res] = await pool.query<ResultSetHeader>(
    'INSERT INTO `Goal` (title, description, target_date, organization_id, space_id, manual_progress, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW(3))',
    [
      input.title,
      input.description,
      input.targetDate ? new Date(input.targetDate) : null,
      input.organizationId,
      input.spaceId,
      input.manualProgress,
    ]
  )

  const goalId = res.insertId
  await setGoalTaskIds(goalId, input.taskIds)
  return getGoalById(goalId)
}

export async function updateGoal(id: number, patch: UpdateGoalInput) {
  await ensureGoalTables()

  const fields: string[] = []
  const values: unknown[] = []

  if (patch.title !== undefined) {
    fields.push('title = ?')
    values.push(patch.title)
  }

  if (patch.description !== undefined) {
    fields.push('description = ?')
    values.push(patch.description)
  }

  if (patch.targetDate !== undefined) {
    fields.push('target_date = ?')
    values.push(patch.targetDate ? new Date(patch.targetDate) : null)
  }

  if (patch.organizationId !== undefined) {
    fields.push('organization_id = ?')
    values.push(patch.organizationId)
  }

  if (patch.spaceId !== undefined) {
    fields.push('space_id = ?')
    values.push(patch.spaceId)
  }

  if (patch.manualProgress !== undefined) {
    fields.push('manual_progress = ?')
    values.push(patch.manualProgress)
  }

  if (fields.length > 0) {
    values.push(id)
    await pool.query(
      `UPDATE \`Goal\` SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
  }

  if (patch.taskIds !== undefined) {
    await setGoalTaskIds(id, patch.taskIds)
  }

  return getGoalById(id)
}

export async function deleteGoal(id: number) {
  await ensureGoalTables()

  await pool.query('DELETE FROM `GoalTask` WHERE goal_id = ?', [id])
  const [res] = await pool.query<ResultSetHeader>(
    'DELETE FROM `Goal` WHERE id = ? LIMIT 1',
    [id]
  )
  return res.affectedRows > 0
}
