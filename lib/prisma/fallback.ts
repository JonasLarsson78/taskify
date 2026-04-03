import type { User, Organization } from '@prisma/client'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import type { FallbackClient, UserWithOrg } from './types'

export async function createMysqlFallback(): Promise<FallbackClient> {
  const mysql = await import('mysql2/promise')
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')

  const u = new URL(url)
  const pool = mysql.createPool({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  })

  return {
    _isFallback: true,
    async $disconnect() {
      await pool.end()
    },
    user: {
      async findUnique(opts: { where: { id?: number; email?: string } }) {
        const where = opts?.where ?? {}

        if (typeof where.id === 'number') {
          const [rows] = await pool.query<RowDataPacket[]>(
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
            createdAt: r.createdAt,
            organizationId: r.organization_id,
          } as User
        }

        if (typeof where.email === 'string') {
          const [rows] = await pool.query<RowDataPacket[]>(
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
            createdAt: r.createdAt,
            organizationId: r.organization_id,
          } as User
        }

        return null
      },

      async findMany(opts: { include?: { organization?: boolean } } = {}) {
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
        const data = opts.data || {}
        const [res] = await pool.query<ResultSetHeader>(
          'INSERT INTO `User` (name,email,password,organization_id,createdAt) VALUES (?, ?, ?, ?, NOW())',
          [
            data.name ?? null,
            data.email ?? null,
            data.password ?? null,
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
    },
  }
}
