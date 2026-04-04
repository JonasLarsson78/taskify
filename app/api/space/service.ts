import type { ResultSetHeader } from 'mysql2/promise'
import { getMysqlPool } from '../../../lib/mysql/pool'
import type { UserRole } from '../../../lib/user-role'

const DEFAULT_TASK_SECTIONS = ['Issues Found', 'Review', 'Ready']
const DEFAULT_SECTION_PALETTE = [
  '#ff5f98',
  '#ffb000',
  '#6259ff',
  '#2dbdb8',
  '#49a4ff',
  '#a35cff',
]

type SpaceRow = {
  id: number
  organizationId: number
  name: string
  taskSections: string[]
  taskSectionColors: Record<string, string>
  memberIds: number[]
  createdAt: Date
}

let initialized = false

const pool = getMysqlPool()

function normalizeTaskSections(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_TASK_SECTIONS]

  const sections = raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(
      (value, index, arr) => value.length > 0 && arr.indexOf(value) === index
    )
    .slice(0, 32)

  return sections.length > 0 ? sections : [...DEFAULT_TASK_SECTIONS]
}

function defaultColorForIndex(index: number): string {
  return DEFAULT_SECTION_PALETTE[index % DEFAULT_SECTION_PALETTE.length]
}

function normalizeSectionColors(
  raw: unknown,
  sections: string[]
): Record<string, string> {
  const defaults = sections.reduce((acc, section, index) => {
    acc[section] = defaultColorForIndex(index)
    return acc
  }, {} as Record<string, string>)

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults
  }

  const input = raw as Record<string, unknown>
  return sections.reduce((acc, section) => {
    const candidate = input[section]
    if (typeof candidate === 'string' && /^#[0-9a-fA-F]{6}$/.test(candidate)) {
      acc[section] = candidate.toLowerCase()
      return acc
    }

    acc[section] = defaults[section]
    return acc
  }, {} as Record<string, string>)
}

function parseJsonString(raw: unknown): unknown {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function mapSpaceRow(row: Record<string, unknown>): SpaceRow {
  const taskSections = normalizeTaskSections(parseJsonString(row.task_sections))
  const taskSectionColors = normalizeSectionColors(
    parseJsonString(row.task_section_colors),
    taskSections
  )

  return {
    id: Number(row.id),
    organizationId: Number(row.organization_id),
    name:
      typeof row.name === 'string' && row.name.trim()
        ? row.name.trim()
        : `Space ${String(row.id ?? '')}`,
    taskSections,
    taskSectionColors,
    memberIds: [],
    createdAt: new Date(String(row.createdAt)),
  }
}

async function ensureSpaceTable() {
  if (initialized) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`Space\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`organization_id\` INT NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`task_sections\` TEXT NULL,
      \`task_section_colors\` TEXT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`Space_organization_id_idx\` (\`organization_id\`)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`SpaceMember\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`space_id\` INT NOT NULL,
      \`user_id\` INT NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`SpaceMember_space_user_uq\` (\`space_id\`, \`user_id\`),
      INDEX \`SpaceMember_space_id_idx\` (\`space_id\`),
      INDEX \`SpaceMember_user_id_idx\` (\`user_id\`)
    )
  `)

  initialized = true
}

export async function listSpaceMemberIds(spaceId: number): Promise<number[]> {
  await ensureSpaceTable()

  const [rows] = await pool.query(
    'SELECT user_id FROM `SpaceMember` WHERE space_id = ? ORDER BY id ASC',
    [spaceId]
  )

  return (rows as Record<string, unknown>[])
    .map((row) => Number(row.user_id))
    .filter((id) => Number.isInteger(id))
}

export async function isSpaceMember(
  spaceId: number,
  userId: number
): Promise<boolean> {
  await ensureSpaceTable()

  const [rows] = await pool.query(
    'SELECT id FROM `SpaceMember` WHERE space_id = ? AND user_id = ? LIMIT 1',
    [spaceId, userId]
  )

  return (rows as Record<string, unknown>[]).length > 0
}

export async function setSpaceMembers(
  spaceId: number,
  userIds: number[]
): Promise<void> {
  await ensureSpaceTable()

  const normalized = Array.from(
    new Set(
      userIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  )

  await pool.query('DELETE FROM `SpaceMember` WHERE space_id = ?', [spaceId])

  if (normalized.length === 0) return

  const placeholders = normalized.map(() => '(?, ?, NOW(3))').join(', ')
  const values = normalized.flatMap((userId) => [spaceId, userId])

  await pool.query(
    `INSERT INTO \`SpaceMember\` (space_id, user_id, createdAt) VALUES ${placeholders}`,
    values
  )
}

export async function addSpaceMember(
  spaceId: number,
  userId: number
): Promise<void> {
  await ensureSpaceTable()

  await pool.query(
    'INSERT IGNORE INTO `SpaceMember` (space_id, user_id, createdAt) VALUES (?, ?, NOW(3))',
    [spaceId, userId]
  )
}

export async function listSpaces(organizationId: number): Promise<SpaceRow[]> {
  await ensureSpaceTable()

  const [rows] = await pool.query(
    'SELECT * FROM `Space` WHERE organization_id = ? ORDER BY createdAt ASC, id ASC',
    [organizationId]
  )

  const spaces = (rows as Record<string, unknown>[]).map(mapSpaceRow)
  return Promise.all(
    spaces.map(async (space) => ({
      ...space,
      memberIds: await listSpaceMemberIds(space.id),
    }))
  )
}

export async function listSpacesForUser(input: {
  organizationId: number
  userId: number
  role: UserRole
}): Promise<SpaceRow[]> {
  const all = await listSpaces(input.organizationId)
  if (input.role === 'admin') {
    return all
  }

  return all.filter((space) => space.memberIds.includes(input.userId))
}

export async function getSpaceById(id: number): Promise<SpaceRow | null> {
  await ensureSpaceTable()

  const [rows] = await pool.query(
    'SELECT * FROM `Space` WHERE id = ? LIMIT 1',
    [id]
  )
  const row = (rows as Record<string, unknown>[])[0]
  if (!row) return null

  const space = mapSpaceRow(row)
  return {
    ...space,
    memberIds: await listSpaceMemberIds(space.id),
  }
}

export async function createSpace(input: {
  organizationId: number
  name: string
}): Promise<SpaceRow | null> {
  await ensureSpaceTable()

  const taskSections = [...DEFAULT_TASK_SECTIONS]
  const taskSectionColors = normalizeSectionColors({}, taskSections)

  const [res] = await pool.query<ResultSetHeader>(
    'INSERT INTO `Space` (organization_id, name, task_sections, task_section_colors, createdAt) VALUES (?, ?, ?, ?, NOW(3))',
    [
      input.organizationId,
      input.name,
      JSON.stringify(taskSections),
      JSON.stringify(taskSectionColors),
    ]
  )

  return getSpaceById(res.insertId)
}

export async function updateSpace(
  id: number,
  patch: {
    name?: string
    taskSections?: string[]
    taskSectionColors?: Record<string, string>
  }
): Promise<SpaceRow | null> {
  await ensureSpaceTable()

  const current = await getSpaceById(id)
  if (!current) return null

  const nextSections = patch.taskSections
    ? normalizeTaskSections(patch.taskSections)
    : current.taskSections
  const nextColors = normalizeSectionColors(
    patch.taskSectionColors ?? current.taskSectionColors,
    nextSections
  )

  const nextName =
    typeof patch.name === 'string' && patch.name.trim()
      ? patch.name.trim().slice(0, 191)
      : current.name

  await pool.query(
    'UPDATE `Space` SET name = ?, task_sections = ?, task_section_colors = ? WHERE id = ? LIMIT 1',
    [nextName, JSON.stringify(nextSections), JSON.stringify(nextColors), id]
  )

  return getSpaceById(id)
}

export async function ensureDefaultSpace(
  organizationId: number,
  fallbackName: string
): Promise<SpaceRow | null> {
  const spaces = await listSpaces(organizationId)
  if (spaces.length > 0) return spaces[0]

  return createSpace({
    organizationId,
    name: fallbackName.trim() || 'Main Space',
  })
}
