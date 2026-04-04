import bcrypt from 'bcryptjs'
import prisma from '../../../lib/prisma'
import type { CreateUserInput, UpdateUserInput } from './validator'

export async function listUsers() {
  return prisma.user.findMany({
    include: { organization: true },
  })
}

export async function listUsersByOrganization(organizationId: number | null) {
  const users = await prisma.user.findMany({
    include: { organization: true },
  })

  if (organizationId === null) {
    return users
  }

  return users.filter((user) => user.organizationId === organizationId)
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
      role: input.role,
      organizationId: input.organizationId,
    },
    include: { organization: true },
  })

  const { password: _, ...safe } = created
  void _
  return safe
}

export async function getUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  })
}

export async function updateUser(userId: number, input: UpdateUserInput) {
  const data: {
    name?: string | null
    email?: string | null
    password?: string | null
    role?: UpdateUserInput['role']
    organizationId?: number | null
  } = {}

  if (input.name !== undefined) {
    data.name = input.name
  }

  if (input.email !== undefined) {
    data.email = input.email
  }

  if (input.password !== undefined) {
    data.password = input.password
      ? await bcrypt.hash(input.password, 10)
      : null
  }

  if (input.role !== undefined) {
    data.role = input.role
  }

  if (input.organizationId !== undefined) {
    data.organizationId = input.organizationId
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    include: { organization: true },
  })

  const { password: _, ...safe } = updated
  void _
  return safe
}
