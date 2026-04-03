import type { PrismaClient } from '@prisma/client'
import { createMysqlFallback } from './fallback'
import type { PrismaLike } from './types'

declare global {
  var prisma: PrismaClient | undefined
}

let exportedPrisma: PrismaLike

try {
  const { PrismaClient: PC } = await import('@prisma/client')
  const inst = global.prisma ?? new PC({})
  if (process.env.NODE_ENV !== 'production') global.prisma = inst
  exportedPrisma = inst
} catch {
  exportedPrisma = await createMysqlFallback()
}

export default exportedPrisma
