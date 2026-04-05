import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { getMysqlPool } from '../../../lib/mysql/pool'

type MysqlCountRow = { count: number }
type MysqlLeadTimeRow = { leadTimeDays: number | null }

const pool = getMysqlPool()

async function getOrganizationCount(): Promise<number> {
  try {
    const organizations = await prisma.organization.findMany()
    return organizations.length
  } catch {
    return 0
  }
}

async function getSpaceCount(): Promise<number> {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM `Space`')
    const row = (rows as MysqlCountRow[])[0]
    return Number(row?.count ?? 0)
  } catch {
    return 0
  }
}

async function getClosedTaskCount(): Promise<number> {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM `Task` WHERE archivedAt IS NOT NULL'
    )
    const row = (rows as MysqlCountRow[])[0]
    return Number(row?.count ?? 0)
  } catch {
    return 0
  }
}

async function getLeadTimeDays(): Promise<number | null> {
  try {
    const [rows] = await pool.query(
      'SELECT AVG(TIMESTAMPDIFF(HOUR, createdAt, archivedAt)) / 24 AS leadTimeDays FROM `Task` WHERE archivedAt IS NOT NULL'
    )
    const row = (rows as MysqlLeadTimeRow[])[0]
    const value = row?.leadTimeDays
    if (typeof value !== 'number' || Number.isNaN(value)) return null
    return Number(value.toFixed(1))
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const [spaceCount, organizationCount, tasksClosed, leadTimeDays] =
      await Promise.all([
        getSpaceCount(),
        getOrganizationCount(),
        getClosedTaskCount(),
        getLeadTimeDays(),
      ])

    return NextResponse.json({
      activeProjects: spaceCount > 0 ? spaceCount : organizationCount,
      tasksClosed,
      leadTimeDays,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/login-metrics error', error)
    return NextResponse.json(
      {
        activeProjects: 0,
        tasksClosed: 0,
        leadTimeDays: null,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  }
}
