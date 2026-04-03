import type { PrismaClient, User, Organization } from '@prisma/client'

export type UserWithOrg = User & { organization?: Organization | null }

export type FallbackClient = {
  _isFallback: true
  $disconnect(): Promise<void>
  user: {
    findUnique(opts: {
      where: { id?: number; email?: string }
    }): Promise<User | null>
    findMany(opts?: {
      include?: { organization?: boolean }
    }): Promise<UserWithOrg[]>
    create(opts: {
      data: Partial<User> & { organizationId?: number | null }
      include?: { organization?: boolean }
    }): Promise<User | UserWithOrg>
  }
  organization: {
    findUnique(opts: { where: { id: number } }): Promise<Organization | null>
  }
}

export type PrismaLike = PrismaClient | FallbackClient
