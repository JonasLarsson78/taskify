import bcrypt from 'bcryptjs'
import prisma from '../../../lib/prisma'
import type { CreateUserInput } from './validator'

export async function listUsers() {
  return prisma.user.findMany({
    include: { organization: true },
  })
}

export async function ensureOrganizationExists(organizationId: number | null) {
  if (organizationId === null) return

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    throw new Error(`Organization with id ${organizationId} not found`)
  }
}

export async function createUser(input: CreateUserInput) {
  const hashedPassword = input.password
    ? await bcrypt.hash(input.password, 10)
    : null

  const created = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      organizationId: input.organizationId,
    },
    include: { organization: true },
  })

  const { password: _, ...safe } = created
  void _
  return safe
}
