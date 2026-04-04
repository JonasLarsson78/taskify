import type { User, Organization } from '@prisma/client'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { getMysqlPool } from '../mysql/pool'
import type { FallbackClient, UserWithOrg } from './types'

function isConnectionLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: unknown }).code
  return code === 'ER_CON_COUNT_ERROR'
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createMysqlFallback(): Promise<FallbackClient> {
  const pool = getMysqlPool()

  async function queryRows<T extends RowDataPacket[]>(
    sql: string,
    params: unknown[]
  ) {
    try {
      const [rows] = await pool.query<T>(sql, params)
      return rows
    } catch (error) {
      if (!isConnectionLimitError(error)) throw error

      await sleep(120)
      const [rows] = await pool.query<T>(sql, params)
      return rows
    }
  }

  let userColumnsEnsured = false

  async function ensureUserColumns() {
    if (userColumnsEnsured) return

    try {
      await pool.query(
        "ALTER TABLE `User` ADD COLUMN `role` VARCHAR(32) NOT NULL DEFAULT 'user'"
      )
    } catch {
      // Ignore if the column already exists.
    }

    try {
      await pool.query(
        "ALTER TABLE `User` ADD COLUMN `preferredLanguage` VARCHAR(16) NOT NULL DEFAULT 'sv'"
      )
    } catch {
      // Ignore if the column already exists.
    }

    userColumnsEnsured = true
  }

  return {
    _isFallback: true,
    async $disconnect() {
      // Shared global pool is reused across modules and should stay alive.
    },
    user: {
      async findUnique(opts: { where: { id?: number; email?: string } }) {
        await ensureUserColumns()
        const where = opts?.where ?? {}

        if (typeof where.id === 'number') {
          const rows = await queryRows<RowDataPacket[]>(
            'SELECT * FROM `User` WHERE id = ? LIMIT 1',
            [where.id]
          )
          const r = rows[0]
          if (!r) return null
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            password: r.password,
            role: r.role,
            preferredLanguage: r.preferredLanguage || 'sv',
            createdAt: r.createdAt,
            organizationId: r.organization_id,
          } as User
        }

        if (typeof where.email === 'string') {
          const rows = await queryRows<RowDataPacket[]>(
            'SELECT * FROM `User` WHERE email = ? LIMIT 1',
            [where.email]
          )
          const r = rows[0]
          if (!r) return null
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            password: r.password,
            role: r.role,
            preferredLanguage: r.preferredLanguage || 'sv',
            createdAt: r.createdAt,
            organizationId: r.organization_id,
          } as User
        }

        return null
      },

      async findMany(opts: { include?: { organization?: boolean } } = {}) {
        await ensureUserColumns()
        const includeOrg = !!opts.include?.organization
        const sql = includeOrg
          ? 'SELECT u.*, o.id as o_id, o.name as o_name, o.address as o_address, o.city as o_city, o.zip as o_zip, o.phone as o_phone, o.email as o_email, o.createdAt as o_createdAt FROM `User` u LEFT JOIN `Organization` o ON u.organization_id = o.id'
          : 'SELECT u.* FROM `User` u'

        const [rows] = await pool.query<RowDataPacket[]>(sql)

        return rows.map((r) => {
          const user: UserWithOrg = {
            id: r.id,
            name: r.name,
            email: r.email,
            password: r.password,
            role: r.role,
            preferredLanguage: r.preferredLanguage || 'sv',
            createdAt: r.createdAt,
            organizationId: r.organization_id,
          }

          if (includeOrg) {
            user.organization = r.o_id
              ? {
                  id: r.o_id,
                  name: r.o_name,
                  address: r.o_address,
                  city: r.o_city,
                  zip: r.o_zip,
                  phone: r.o_phone,
                  email: r.o_email,
                  createdAt: r.o_createdAt,
                }
              : null
          }

          return user
        })
      },

      async create(opts: {
        data: Partial<User> & { organizationId?: number | null }
        include?: { organization?: boolean }
      }) {
        await ensureUserColumns()
        const data = opts.data || {}
        const [res] = await pool.query<ResultSetHeader>(
          'INSERT INTO `User` (name,email,password,role,preferredLanguage,organization_id,createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [
            data.name ?? null,
            data.email ?? null,
            data.password ?? null,
            data.role ?? 'user',
            data.preferredLanguage ?? 'sv',
            data.organizationId ?? null,
          ]
        )

        const insertId = res.insertId
        const includeOrg = !!opts.include?.organization

        if (includeOrg) {
          const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT u.*, o.id as o_id, o.name as o_name, o.address as o_address, o.city as o_city, o.zip as o_zip, o.phone as o_phone, o.email as o_email, o.createdAt as o_createdAt FROM `User` u LEFT JOIN `Organization` o ON u.organization_id = o.id WHERE u.id = ?',
            [insertId]
          )
          const r = rows[0]
          const result: UserWithOrg = {
            id: r.id,
            name: r.name,
            email: r.email,
            password: r.password,
            role: r.role,
            preferredLanguage: r.preferredLanguage || 'sv',
            createdAt: r.createdAt,
            organizationId: r.organization_id,
            organization: r.o_id
              ? {
                  id: r.o_id,
                  name: r.o_name,
                  address: r.o_address,
                  city: r.o_city,
                  zip: r.o_zip,
                  phone: r.o_phone,
                  email: r.o_email,
                  createdAt: r.o_createdAt,
                }
              : null,
          }
          return result
        }

        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM `User` WHERE id = ?',
          [insertId]
        )
        const r = rows[0]

        return {
          id: r.id,
          name: r.name,
          email: r.email,
          password: r.password,
          role: r.role,
          preferredLanguage: r.preferredLanguage || 'sv',
          createdAt: r.createdAt,
          organizationId: r.organization_id,
        } as User
      },

      async update(opts: {
        where: { id: number }
        data: Partial<User> & { organizationId?: number | null }
        include?: { organization?: boolean }
      }) {
        await ensureUserColumns()
        const id = opts.where.id
        const data = opts.data || {}
        const existing = await this.findUnique({ where: { id } })

        if (!existing) {
          throw new Error(`User ${id} not found`)
        }

        await pool.query(
          'UPDATE `User` SET name = ?, email = ?, password = ?, role = ?, preferredLanguage = ?, organization_id = ? WHERE id = ? LIMIT 1',
          [
            data.name ?? existing.name ?? null,
            data.email ?? existing.email ?? null,
            data.password ?? existing.password ?? null,
            data.role ?? existing.role ?? 'user',
            data.preferredLanguage ?? existing.preferredLanguage ?? 'sv',
            data.organizationId ?? existing.organizationId ?? null,
            id,
          ]
        )

        const includeOrg = !!opts.include?.organization

        if (includeOrg) {
          const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT u.*, o.id as o_id, o.name as o_name, o.address as o_address, o.city as o_city, o.zip as o_zip, o.phone as o_phone, o.email as o_email, o.createdAt as o_createdAt FROM `User` u LEFT JOIN `Organization` o ON u.organization_id = o.id WHERE u.id = ? LIMIT 1',
            [id]
          )
          const r = rows[0]
          const result: UserWithOrg = {
            id: r.id,
            name: r.name,
            email: r.email,
            password: r.password,
            role: r.role,
            preferredLanguage: r.preferredLanguage || 'sv',
            createdAt: r.createdAt,
            organizationId: r.organization_id,
            organization: r.o_id
              ? {
                  id: r.o_id,
                  name: r.o_name,
                  address: r.o_address,
                  city: r.o_city,
                  zip: r.o_zip,
                  phone: r.o_phone,
                  email: r.o_email,
                  createdAt: r.o_createdAt,
                }
              : null,
          }
          return result
        }

        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM `User` WHERE id = ? LIMIT 1',
          [id]
        )
        const r = rows[0]

        return {
          id: r.id,
          name: r.name,
          email: r.email,
          password: r.password,
          role: r.role,
          preferredLanguage: r.preferredLanguage || 'sv',
          createdAt: r.createdAt,
          organizationId: r.organization_id,
        } as User
      },
    },

    organization: {
      async findUnique(opts: { where: { id: number } }) {
        const id = opts.where.id
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM `Organization` WHERE id = ?',
          [id]
        )
        const r = rows[0]
        if (!r) return null

        return {
          id: r.id,
          name: r.name,
          address: r.address,
          city: r.city,
          zip: r.zip,
          phone: r.phone,
          email: r.email,
          createdAt: r.createdAt,
        } as Organization
      },

      async findMany() {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM `Organization` ORDER BY id DESC'
        )

        return rows.map((r) => {
          return {
            id: r.id,
            name: r.name,
            address: r.address,
            city: r.city,
            zip: r.zip,
            phone: r.phone,
            email: r.email,
            createdAt: r.createdAt,
          } as Organization
        })
      },

      async create(opts: { data: Partial<Organization> }) {
        const data = opts.data || {}
        const [res] = await pool.query<ResultSetHeader>(
          'INSERT INTO `Organization` (name,address,city,zip,phone,email,createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [
            data.name ?? null,
            data.address ?? null,
            data.city ?? null,
            data.zip ?? null,
            data.phone ?? null,
            data.email ?? null,
          ]
        )

        const insertId = res.insertId
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM `Organization` WHERE id = ? LIMIT 1',
          [insertId]
        )
        const r = rows[0]

        return {
          id: r.id,
          name: r.name,
          address: r.address,
          city: r.city,
          zip: r.zip,
          phone: r.phone,
          email: r.email,
          createdAt: r.createdAt,
        } as Organization
      },

      async update(opts: {
        where: { id: number }
        data: Partial<Organization>
      }) {
        const id = opts.where.id
        const data = opts.data || {}

        await pool.query(
          'UPDATE `Organization` SET name = ?, address = ?, city = ?, zip = ?, phone = ?, email = ? WHERE id = ? LIMIT 1',
          [
            data.name ?? null,
            data.address ?? null,
            data.city ?? null,
            data.zip ?? null,
            data.phone ?? null,
            data.email ?? null,
            id,
          ]
        )

        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM `Organization` WHERE id = ? LIMIT 1',
          [id]
        )
        const r = rows[0]

        return {
          id: r.id,
          name: r.name,
          address: r.address,
          city: r.city,
          zip: r.zip,
          phone: r.phone,
          email: r.email,
          createdAt: r.createdAt,
        } as Organization
      },
    },
  }
}
